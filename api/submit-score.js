import {
  getRedis,
  LEADERBOARD_KEY,
  MAX_SCORE,
  setCorsHeaders,
  sanitizePlayerName,
} from './_redis.js';

/**
 * POST /api/submit-score
 * Body: { playerName, score, level?, prestigeCount? }
 *
 * Redis sorted set "leaderboard": ZADD score member
 * member = JSON { id, playerName, level, prestigeCount, submittedAt }
 */
export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const playerName = sanitizePlayerName(body.playerName);
    const score = Number(body.score);
    const level = Number.isFinite(Number(body.level)) ? Math.max(0, Math.floor(Number(body.level))) : 1;
    const prestigeCount = Number.isFinite(Number(body.prestigeCount))
      ? Math.max(0, Math.floor(Number(body.prestigeCount)))
      : 0;

    if (!playerName) {
      res.status(400).json({ error: 'playerName is required (max 20 chars)' });
      return;
    }

    if (!Number.isFinite(score) || score < 0) {
      res.status(400).json({ error: 'score must be a non-negative number' });
      return;
    }

    if (score > MAX_SCORE) {
      res.status(400).json({ error: `score exceeds maximum allowed (${MAX_SCORE})` });
      return;
    }

    const submittedAt = Date.now();
    const id = `${submittedAt}-${Math.random().toString(36).slice(2, 8)}`;
    const member = JSON.stringify({
      id,
      playerName,
      level,
      prestigeCount,
      submittedAt,
    });

    const redis = getRedis();
    await redis.zadd(LEADERBOARD_KEY, score, member);

    res.status(200).json({
      ok: true,
      id,
      playerName,
      score: Math.round(score),
      level,
      prestigeCount,
      submittedAt,
    });
  } catch (error) {
    console.error('[submit-score]', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
}
