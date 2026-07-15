import {
  getRedis,
  LEADERBOARD_SCORES_KEY,
  LEADERBOARD_RANKING_KEY,
  LEADERBOARD_TOP_N,
  setCorsHeaders,
} from './_redis.js';

/**
 * GET /api/get-leaderboard
 * ZREVRANGE leaderboard:ranking → top deviceIds, HASH leaderboard:scores → detay
 */
export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const redis = getRedis();
    const rows = await redis.zrevrange(LEADERBOARD_RANKING_KEY, 0, LEADERBOARD_TOP_N - 1, 'WITHSCORES');

    const deviceIds = [];
    const scoreByDevice = new Map();

    for (let i = 0; i < rows.length; i += 2) {
      const deviceId = rows[i];
      deviceIds.push(deviceId);
      scoreByDevice.set(deviceId, Number(rows[i + 1]));
    }

    const hashValues =
      deviceIds.length > 0 ? await redis.hmget(LEADERBOARD_SCORES_KEY, ...deviceIds) : [];

    const entries = [];

    for (let i = 0; i < deviceIds.length; i += 1) {
      const deviceId = deviceIds[i];
      const raw = hashValues[i];
      let meta = {};

      if (raw) {
        try {
          meta = JSON.parse(raw);
        } catch {
          meta = {};
        }
      }

      const score = Number.isFinite(Number(meta.score))
        ? Number(meta.score)
        : scoreByDevice.get(deviceId) || 0;

      entries.push({
        rank: entries.length + 1,
        score,
        playerName: meta.playerName ?? 'Anonim',
        level: meta.level ?? 1,
        prestigeCount: meta.prestigeCount ?? 0,
        id: deviceId,
        submittedAt: meta.submittedAt ?? null,
      });
    }

    res.status(200).json({
      ok: true,
      count: entries.length,
      entries,
    });
  } catch (error) {
    console.error('[get-leaderboard]', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
