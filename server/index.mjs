import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import {
  brCepDigits,
  normalizePostalForLookup,
  parseAddressFromNominatim,
} from "./geocode.mjs";
import { loadContent } from "./contentRepository.mjs";
import { lookupViaCep } from "./viacep.mjs";
import {
  consumePasswordResetToken,
  createOrder,
  createPasswordResetToken,
  createUser,
  findUserByEmail,
  findUserByEmailAndPassword,
  getUserById,
  listOrders,
  updateUserPassword,
  updateUserProfile,
} from "./authRepository.mjs";

const app = express();
const sessions = new Map();

const SESSION_COOKIE = "bt_sid";
const PORT = Number(process.env.PORT) || 3001;

/** Nominatim requires a descriptive User-Agent (no API key). */
const NOMINATIM_UA =
  process.env.NOMINATIM_USER_AGENT ||
  "BeeTees-Training/1.0 (local dev; https://github.com/)";

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

function emptyDelivery() {
  return {
    zipCode: "",
    countryCode: "US",
    streetLine: "",
    neighborhood: "",
    city: "",
    state: "",
    country: "",
    complement: "",
    storeId: "",
  };
}

function normalizeDelivery(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const d = emptyDelivery();
  for (const k of Object.keys(d)) {
    if (raw[k] != null && typeof raw[k] === "string") {
      d[k] = raw[k];
    }
  }
  if (raw.countryCode && typeof raw.countryCode === "string") {
    d.countryCode = raw.countryCode.toUpperCase().slice(0, 2);
  }
  return d;
}

function setSessionCookie(res, sid) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function getSession(req, res, create = false) {
  let sid = req.cookies[SESSION_COOKIE];
  if (!sid && create) {
    sid = randomUUID();
    setSessionCookie(res, sid);
  }
  if (!sid) {
    return null;
  }

  const current = sessions.get(sid);
  if (current?.delivery || current?.userId != null) {
    return current;
  }

  if (current) {
    const migrated = { delivery: normalizeDelivery(current), userId: "" };
    sessions.set(sid, migrated);
    return migrated;
  }

  if (create) {
    const next = { delivery: null, userId: "" };
    sessions.set(sid, next);
    return next;
  }

  return null;
}

function requireUserId(req, res) {
  const session = getSession(req, res, false);
  return session?.userId || "";
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/content", async (_req, res) => {
  try {
    const content = await loadContent();
    res.json(content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Content database failed";
    res.status(503).json({ error: msg });
  }
});

async function nominatimSearch(params) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }

  const r = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": NOMINATIM_UA,
    },
  });

  if (!r.ok) {
    return null;
  }

  const data = await r.json();
  return Array.isArray(data) && data.length > 0 ? data : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Nominatim's `postalcode=` misses many BR CEPs. Try several query shapes (OSM policy: ~1 req/s — we only chain on empty).
 */
async function searchNominatimForPostal(postalCode, countryCode) {
  const cc = countryCode.toUpperCase().slice(0, 2);
  const normalized = normalizePostalForLookup(postalCode, cc);
  const countryLower = cc.toLowerCase();

  const attempts = [];

  if (cc === "BR") {
    const digits = brCepDigits(postalCode);
    attempts.push({ postalcode: normalized, countrycodes: countryLower });
    if (digits) {
      attempts.push({ postalcode: digits, countrycodes: countryLower });
      attempts.push({ q: `${digits}, Brasil`, countrycodes: countryLower });
      attempts.push({ q: `${normalized}, Brasil`, countrycodes: countryLower });
      attempts.push({ q: digits, countrycodes: countryLower });
    }
  } else {
    attempts.push({ postalcode: normalized, countrycodes: countryLower });
  }

  for (let i = 0; i < attempts.length; i++) {
    if (i > 0) {
      await sleep(350);
    }
    const hits = await nominatimSearch(attempts[i]);
    if (hits?.length) {
      const best =
        hits.find((h) => h.address?.postcode) ||
        hits.find((h) => h.address?.city || h.address?.town) ||
        hits[0];
      return { hit: best, fallbackPostal: normalized };
    }
  }

  return null;
}

app.get("/api/geocode", async (req, res) => {
  const postalCode = String(req.query.postalCode || "").trim();
  const countryCode = String(req.query.countryCode || "US").toUpperCase().slice(0, 2);
  if (!postalCode) {
    return res.status(400).json({ error: "postalCode is required" });
  }

  const normalized = normalizePostalForLookup(postalCode, countryCode);

  try {
    // Brazil: ViaCEP has full national CEP coverage; OpenStreetMap often misses CEP centroids.
    if (countryCode === "BR") {
      const digits = brCepDigits(postalCode);
      if (digits) {
        const via = await lookupViaCep(digits);
        if (via) {
          return res.json({ address: via, provider: "viacep" });
        }
      }
    }

    const found = await searchNominatimForPostal(postalCode, countryCode);
    if (!found) {
      return res.status(404).json({
        error:
          "No address found for this postal code. For Brazil use 8 digits; for US use 5 digits.",
      });
    }

    const parsed = parseAddressFromNominatim(found.hit, normalized);
    res.json({ address: parsed, provider: "nominatim" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Geocoding request failed";
    res.status(502).json({ error: msg });
  }
});

app.get("/api/delivery", (req, res) => {
  const session = getSession(req, res, false);
  if (!session) {
    return res.json({ delivery: null });
  }
  res.json({ delivery: normalizeDelivery(session.delivery) });
});

app.post("/api/delivery", (req, res) => {
  const body = req.body || {};
  const zipCode = typeof body.zipCode === "string" ? body.zipCode.trim() : "";
  if (!zipCode) {
    return res.status(400).json({ error: "ZIP / postal code is required" });
  }

  const cc =
    typeof body.countryCode === "string" && body.countryCode.length >= 2
      ? body.countryCode.toUpperCase().slice(0, 2)
      : "US";

  const payload = {
    zipCode,
    countryCode: cc,
    streetLine: typeof body.streetLine === "string" ? body.streetLine.trim() : "",
    neighborhood: typeof body.neighborhood === "string" ? body.neighborhood.trim() : "",
    city: typeof body.city === "string" ? body.city.trim() : "",
    state: typeof body.state === "string" ? body.state.trim() : "",
    country: typeof body.country === "string" ? body.country.trim() : "",
    complement: typeof body.complement === "string" ? body.complement.trim() : "",
    storeId:
      typeof body.storeId === "string" ? body.storeId.trim().slice(0, 64) : "",
  };

  const session = getSession(req, res, true);
  session.delivery = payload;
  res.json({ delivery: payload });
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) {
      return res.json({ user: null });
    }
    const user = await getUserById(userId);
    res.json({ user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to load user";
    res.status(503).json({ error: msg });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await findUserByEmailAndPassword(email, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const session = getSession(req, res, true);
    session.userId = user.id;
    if (user.location) {
      session.delivery = user.location;
    }
    res.json({ user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Login failed";
    res.status(503).json({ error: msg });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const body = req.body || {};
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const location = normalizeDelivery(body.location);

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "All signup fields are required" });
  }
  if (!email.includes("@") || !email.split("@")[1]?.includes(".")) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (!location?.zipCode || !location.storeId) {
    return res.status(400).json({ error: "A deliverable location is required" });
  }

  try {
    const user = await createUser({ firstName, lastName, email, password, location });
    const session = getSession(req, res, true);
    session.userId = user.id;
    session.delivery = location;
    res.status(201).json({ user });
  } catch (e) {
    if (e?.code === "23505") {
      return res.status(409).json({ error: "An account already exists for this email" });
    }
    const msg = e instanceof Error ? e.message : "Signup failed";
    res.status(503).json({ error: msg });
  }
});

/**
 * Training-app simplification: with no real mail service to deliver the
 * reset link, the raw token is returned to the client under `devResetToken`
 * so the flow (and Playwright) can complete without an inbox. A real
 * deployment would email the link and never put a live token in a response
 * body. Note this also means an attacker can tell whether an email is
 * registered by whether `devResetToken` comes back — acceptable for a
 * training sandbox, a real bug report in production.
 */
app.post("/api/auth/forgot-password", async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !email.includes("@") || !email.split("@")[1]?.includes(".")) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }

  try {
    const user = await findUserByEmail(email);
    const devResetToken = user ? await createPasswordResetToken(user.id) : null;
    res.json({
      ok: true,
      message: "If an account exists for that email, a reset link has been sent.",
      devResetToken,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to process request";
    res.status(503).json({ error: msg });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const body = req.body || {};
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!token) {
    return res.status(400).json({ error: "Reset token is required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const userId = await consumePasswordResetToken(token);
    if (!userId) {
      return res.status(400).json({ error: "This reset link is invalid or has expired." });
    }
    await updateUserPassword(userId, newPassword);
    res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to reset password";
    res.status(503).json({ error: msg });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const session = getSession(req, res, false);
  if (session) {
    session.userId = "";
  }
  res.json({ ok: true });
});

app.put("/api/auth/profile", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return res.status(401).json({ error: "Login required" });
  }

  try {
    const user = await updateUserProfile(userId, req.body || {});
    const session = getSession(req, res, true);
    session.userId = user.id;
    if (user.location) {
      session.delivery = user.location;
    }
    res.json({ user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Profile update failed";
    res.status(503).json({ error: msg });
  }
});

app.get("/api/orders", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return res.status(401).json({ error: "Login required" });
  }

  try {
    const orders = await listOrders(userId);
    res.json({ orders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to load orders";
    res.status(503).json({ error: msg });
  }
});

app.post("/api/orders", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) {
    return res.status(401).json({ error: "Login required" });
  }

  try {
    const id = await createOrder(userId, req.body || {});
    res.json({ id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to save order";
    res.status(503).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`BeeTee's API listening on http://localhost:${PORT}`);
});
