import {
  getRedis,
  LEADERBOARD_SCORES_KEY,
  LEADERBOARD_RANKING_KEY,
  MAX_SCORE,
  setCorsHeaders,
  sanitizePlayerName,
  sanitizeDeviceId,
} from './_redis.js';

/**
 * POST /api/submit-score
 * Body: { playerName, score, level?, prestigeCount?, deviceId }
 *
 * Cihaz başına tek kayıt: yeni skor eski best'ten yüksekse HASH + ZSET güncellenir.
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
    const deviceId = sanitizeDeviceId(body.deviceId);
    const score = Number(body.score);
    const level = Number.isFinite(Number(body.level)) ? Math.max(0, Math.floor(Number(body.level))) : 1;
    const prestigeCount = Number.isFinite(Number(body.prestigeCount))
      ? Math.max(0, Math.floor(Number(body.prestigeCount)))
      : 0;

    if (!playerName) {
      res.status(400).json({ error: 'playerName is required (max 20 chars)' });
      return;
    }

    if (!deviceId) {
      res.status(400).json({ error: 'deviceId is required' });
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

    const roundedScore = Math.round(score);
    const redis = getRedis();
    const existingRaw = await redis.hget(LEADERBOARD_SCORES_KEY, deviceId);
    let existing = null;

    if (existingRaw) {
      try {
        existing = JSON.parse(existingRaw);
      } catch {
        existing = null;
      }
    }

    const previousBest = Number.isFinite(Number(existing?.score)) ? Number(existing.score) : null;

    if (previousBest != null && roundedScore <= previousBest) {
      res.status(200).json({
        ok: true,
        updated: false,
        message: 'Skor kaydedildi ama önceki skorun daha yüksekti',
        deviceId,
        playerName,
        score: roundedScore,
        bestScore: previousBest,
        level: existing?.level ?? level,
        prestigeCount: existing?.prestigeCount ?? prestigeCount,
        submittedAt: existing?.submittedAt ?? null,
      });
      return;
    }

    const submittedAt = Date.now();
    const record = {
      playerName,
      score: roundedScore,
      level,
      prestigeCount,
      submittedAt,
    };

    await redis.hset(LEADERBOARD_SCORES_KEY, deviceId, JSON.stringify(record));
    await redis.zadd(LEADERBOARD_RANKING_KEY, roundedScore, deviceId);

    res.status(200).json({
      ok: true,
      updated: true,
      deviceId,
      playerName,
      score: roundedScore,
      bestScore: roundedScore,
      level,
      prestigeCount,
      submittedAt,
    });
  } catch (error) {
    console.error('[submit-score]', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
}
