import { createHash, randomUUID } from "node:crypto";
import pg from "pg";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://beetee:beetee_dev_password@localhost:5432/beetee_dev";

const pool = new Pool({ connectionString });

export function hashPassword(password) {
  return createHash("sha256").update(`beetee:${password}`).digest("hex");
}

/** Reset tokens are stored hashed, same as passwords — the raw token only ever lives client-side. */
export function hashResetToken(token) {
  return createHash("sha256").update(`beetee-reset:${token}`).digest("hex");
}

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function publicUser(row, location = null) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    location,
  };
}

function locationFromRow(row) {
  if (!row) {
    return null;
  }
  return {
    zipCode: row.zip_code,
    countryCode: row.country_code,
    streetLine: row.street_line,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    country: row.country,
    complement: row.complement,
    storeId: row.store_id,
  };
}

export async function findUserByEmailAndPassword(email, password) {
  const result = await pool.query(
    `
      SELECT *
      FROM users
      WHERE lower(email) = lower($1) AND password_hash = $2
      LIMIT 1
    `,
    [email, hashPassword(password)]
  );
  const user = result.rows[0];
  if (!user) {
    return null;
  }
  const location = await getUserLocation(user.id);
  return publicUser(user, location);
}

export async function createUser(body) {
  const id = randomUUID();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `
        INSERT INTO users (id, email, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        id,
        body.email,
        hashPassword(body.password),
        body.firstName,
        body.lastName,
      ]
    );
    const d = body.location || {};
    const locationResult = await client.query(
      `
        INSERT INTO user_locations (
          user_id, zip_code, country_code, street_line, neighborhood,
          city, state, country, complement, store_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *
      `,
      [
        id,
        d.zipCode || "",
        d.countryCode || "US",
        d.streetLine || "",
        d.neighborhood || "",
        d.city || "",
        d.state || "",
        d.country || "",
        d.complement || "",
        d.storeId || "",
      ]
    );
    await client.query("COMMIT");
    return publicUser(userResult.rows[0], locationFromRow(locationResult.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserById(id) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  const user = result.rows[0];
  if (!user) {
    return null;
  }
  const location = await getUserLocation(user.id);
  return publicUser(user, location);
}

export async function getUserLocation(userId) {
  const result = await pool.query(
    "SELECT * FROM user_locations WHERE user_id = $1",
    [userId]
  );
  return locationFromRow(result.rows[0]);
}

export async function updateUserProfile(userId, body) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `
        UPDATE users
        SET first_name = $2, last_name = $3, email = $4, updated_at = now()
        WHERE id = $1
        RETURNING *
      `,
      [userId, body.firstName, body.lastName, body.email]
    );
    const d = body.location || {};
    const locationResult = await client.query(
      `
        INSERT INTO user_locations (
          user_id, zip_code, country_code, street_line, neighborhood,
          city, state, country, complement, store_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (user_id)
        DO UPDATE SET
          zip_code = EXCLUDED.zip_code,
          country_code = EXCLUDED.country_code,
          street_line = EXCLUDED.street_line,
          neighborhood = EXCLUDED.neighborhood,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          country = EXCLUDED.country,
          complement = EXCLUDED.complement,
          store_id = EXCLUDED.store_id,
          updated_at = now()
        RETURNING *
      `,
      [
        userId,
        d.zipCode || "",
        d.countryCode || "US",
        d.streetLine || "",
        d.neighborhood || "",
        d.city || "",
        d.state || "",
        d.country || "",
        d.complement || "",
        d.storeId || "",
      ]
    );
    await client.query("COMMIT");
    return publicUser(userResult.rows[0], locationFromRow(locationResult.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1",
    [email]
  );
  return result.rows[0] ? publicUser(result.rows[0]) : null;
}

/** Returns the raw token — only the hash is ever persisted. */
export async function createPasswordResetToken(userId) {
  const token = randomUUID();
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await pool.query(
    `
      INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [id, userId, hashResetToken(token), expiresAt]
  );
  return token;
}

/**
 * Validates a raw token against its stored hash, checking it is neither
 * expired nor already used. Returns the owning userId, or null.
 */
export async function consumePasswordResetToken(rawToken) {
  const result = await pool.query(
    `
      SELECT id, user_id, expires_at, used_at
      FROM password_reset_tokens
      WHERE token_hash = $1
      LIMIT 1
    `,
    [hashResetToken(rawToken)]
  );
  const row = result.rows[0];
  if (!row || row.used_at || new Date(row.expires_at) <= new Date()) {
    return null;
  }
  await pool.query(
    "UPDATE password_reset_tokens SET used_at = now() WHERE id = $1",
    [row.id]
  );
  return row.user_id;
}

export async function updateUserPassword(userId, newPassword) {
  await pool.query(
    "UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1",
    [userId, hashPassword(newPassword)]
  );
}

export async function createOrder(userId, order) {
  const id = randomUUID();
  const totalUsd = Number(order.totalUsd || 0);
  await pool.query(
    `
      INSERT INTO orders (id, user_id, total_usd, delivery, lines)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [id, userId, totalUsd, JSON.stringify(order.delivery || {}), JSON.stringify(order.lines || [])]
  );
  return id;
}

export async function listOrders(userId) {
  const result = await pool.query(
    `
      SELECT id, ordered_at, total_usd, delivery, lines
      FROM orders
      WHERE user_id = $1
      ORDER BY ordered_at DESC
    `,
    [userId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    orderedAt: row.ordered_at,
    totalUsd: Number(row.total_usd),
    delivery: row.delivery,
    lines: row.lines,
  }));
}
