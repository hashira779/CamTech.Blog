/**
 * Ephemeral browser-session helper for the CV Builder zero-storage notice.
 * Shows the notice at most once per tab/browser session unless sessionStorage is cleared.
 */

export const CV_PRIVACY_NOTICE_SESSION_KEY = "camtech.cv.privacy_notice.v1";

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const listeners = new Set<() => void>();
let inMemoryDismissed = false;

function resolveStorage(customStorage?: SessionStorageLike | null): SessionStorageLike | null {
  if (customStorage !== undefined) return customStorage;
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readPrivacyNoticeSeen(customStorage?: SessionStorageLike | null): boolean {
  if (inMemoryDismissed && customStorage === undefined) {
    return true;
  }
  const storage = resolveStorage(customStorage);
  if (!storage) {
    return customStorage === undefined ? false : false;
  }
  try {
    return storage.getItem(CV_PRIVACY_NOTICE_SESSION_KEY) === "1";
  } catch {
    return customStorage === undefined ? inMemoryDismissed : false;
  }
}

export function markPrivacyNoticeSeen(customStorage?: SessionStorageLike | null): boolean {
  if (customStorage === undefined) {
    inMemoryDismissed = true;
  }
  const storage = resolveStorage(customStorage);
  let persisted = false;
  if (storage) {
    try {
      storage.setItem(CV_PRIVACY_NOTICE_SESSION_KEY, "1");
      persisted = true;
    } catch {
      persisted = false;
    }
  }
  if (customStorage === undefined) {
    for (const listener of listeners) {
      listener();
    }
  }
  return persisted;
}

export function subscribePrivacyNotice(callback: () => void): () => void {
  listeners.add(callback);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === CV_PRIVACY_NOTICE_SESSION_KEY) {
      callback();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function getPrivacyNoticeSeenSnapshot(): boolean {
  return readPrivacyNoticeSeen();
}

export function getPrivacyNoticeServerSnapshot(): boolean {
  return true;
}

/** Testing helper to reset in-memory state between runs if needed. */
export function _resetPrivacyNoticeMemoryForTest(): void {
  inMemoryDismissed = false;
}
