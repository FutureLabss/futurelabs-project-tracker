// A short-lived Tracker JWT, never an LMS access/refresh token.
const key = "tracker.application-session";
export function getTrackerToken() {
  return sessionStorage.getItem(key);
}
export function setTrackerToken(token: string | null) {
  if (token) sessionStorage.setItem(key, token);
  else sessionStorage.removeItem(key);
}
