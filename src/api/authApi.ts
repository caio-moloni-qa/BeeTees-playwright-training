import type { AuthUser, PreviousOrder } from "../types/auth";
import type { LocationDelivery } from "../stores/locationStore";

type AuthResponse = {
  user: AuthUser | null;
};

async function readError(res: Response, fallback: string): Promise<Error> {
  const data = await res.json().catch(() => ({}));
  return new Error(typeof data.error === "string" ? data.error : fallback);
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) {
    throw await readError(res, "Unable to load user");
  }
  const data = (await res.json()) as AuthResponse;
  return data.user;
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw await readError(res, "Login failed");
  }
  const data = (await res.json()) as AuthResponse;
  if (!data.user) {
    throw new Error("Login failed");
  }
  return data.user;
}

export async function signupUser(body: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  location: LocationDelivery;
}): Promise<AuthUser> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await readError(res, "Signup failed");
  }
  const data = (await res.json()) as AuthResponse;
  if (!data.user) {
    throw new Error("Signup failed");
  }
  return data.user;
}

export type ForgotPasswordResult = {
  message: string;
  /** Training-app only: a real deployment emails the link instead of returning it. */
  devResetToken: string | null;
};

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResult> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw await readError(res, "Unable to process request");
  }
  const data = (await res.json()) as {
    ok: boolean;
    message: string;
    devResetToken: string | null;
  };
  return { message: data.message, devResetToken: data.devResetToken };
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) {
    throw await readError(res, "Unable to reset password");
  }
}

export async function logoutUser(): Promise<void> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw await readError(res, "Logout failed");
  }
}

export async function updateUserProfile(
  body: Omit<AuthUser, "id">
): Promise<AuthUser> {
  const res = await fetch("/api/auth/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await readError(res, "Profile update failed");
  }
  const data = (await res.json()) as AuthResponse;
  if (!data.user) {
    throw new Error("Profile update failed");
  }
  return data.user;
}

export async function fetchPreviousOrders(): Promise<PreviousOrder[]> {
  const res = await fetch("/api/orders", { credentials: "include" });
  if (!res.ok) {
    throw await readError(res, "Unable to load orders");
  }
  const data = (await res.json()) as { orders: PreviousOrder[] };
  return data.orders;
}

export async function saveOrder(body: {
  totalUsd: number;
  delivery: unknown;
  lines: unknown[];
}): Promise<string> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await readError(res, "Unable to save order");
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}
