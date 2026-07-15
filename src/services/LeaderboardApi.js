import { getDeviceId } from '../utils/DeviceId.js';

const SUBMIT_URL = '/api/submit-score';
const LEADERBOARD_URL = '/api/get-leaderboard';

/**
 * @param {Response} response
 */
async function parseJsonResponse(response) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || `İstek başarısız (${response.status})`;
    throw new Error(message);
  }

  return data;
}

/**
 * @param {{ playerName: string, score: number, level: number, prestigeCount: number }} payload
 */
export async function submitScore(payload) {
  const response = await fetch(SUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      deviceId: getDeviceId(),
    }),
  });

  return parseJsonResponse(response);
}

/** @returns {Promise<{ ok: boolean, count: number, entries: Array }>} */
export async function fetchLeaderboard() {
  const response = await fetch(LEADERBOARD_URL);

  return parseJsonResponse(response);
}

/** İstemci tarafı isim temizliği (sunucu da sanitize eder) */
export function sanitizePlayerNameInput(raw) {
  if (typeof raw !== 'string') {
    return '';
  }

  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20);
}
