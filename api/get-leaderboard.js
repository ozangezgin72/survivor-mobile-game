import { getRedis, LEADERBOARD_KEY, LEADERBOARD_TOP_N, setCorsHeaders } from './_redis.js';

/**
 * GET /api/get-leaderboard
 * Redis ZREVRANGE leaderboard 0 19 WITHSCORES → en yüksek 20 skor
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
    const rows = await redis.zrevrange(LEADERBOARD_KEY, 0, LEADERBOARD_TOP_N - 1, 'WITHSCORES');

    // ioredis WITHSCORES → [member, score, member, score, ...]
    const entries = [];
    for (let i = 0; i < rows.length; i += 2) {
      const memberRaw = rows[i];
      const score = Number(rows[i + 1]);
      let meta = {};

      try {
        meta = JSON.parse(memberRaw);
      } catch {
        meta = { playerName: String(memberRaw), id: String(memberRaw) };
      }

      entries.push({
        rank: entries.length + 1,
        score,
        playerName: meta.playerName ?? 'Anonim',
        level: meta.level ?? 1,
        prestigeCount: meta.prestigeCount ?? 0,
        id: meta.id ?? null,
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
