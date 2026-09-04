// Admin backend shared types
export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 4;
export function getBackendUrl() { return process.env.ADMIN_BACKEND_URL || "http://localhost:3001"; }
