const STORAGE_KEY = 'device-id';

function createRandomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random hex
  const random = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');

  return `${Date.now().toString(16)}-${random}`;
}

/**
 * Tarayıcıda kalıcı cihaz kimliği (localStorage).
 * Veriler silinmediği sürece aynı cihaz aynı ID'yi kullanır.
 */
export function getDeviceId() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 0) {
      return existing;
    }

    const id = createRandomId();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // private mode / quota — oturum boyunca tutarlı ama kalıcı olmayan fallback
    if (!getDeviceId._sessionId) {
      getDeviceId._sessionId = createRandomId();
    }
    return getDeviceId._sessionId;
  }
}
