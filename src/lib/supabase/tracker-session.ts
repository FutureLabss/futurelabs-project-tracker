// A short-lived Tracker JWT, never an LMS access/refresh token.
const key = "tracker.application-session";
const lastActiveKey = "tracker.last-active-time";

export function getTrackerToken() {
  return sessionStorage.getItem(key);
}

export function setTrackerToken(token: string | null) {
  if (token) sessionStorage.setItem(key, token);
  else sessionStorage.removeItem(key);
}

export function getLastActiveTime(): number {
  const val = sessionStorage.getItem(lastActiveKey);
  return val ? Number(val) : Date.now();
}

export function setLastActiveTime(time: number = Date.now()) {
  sessionStorage.setItem(lastActiveKey, String(time));
}

export function clearTrackerSession() {
  sessionStorage.removeItem(key);
  sessionStorage.removeItem(lastActiveKey);
}
