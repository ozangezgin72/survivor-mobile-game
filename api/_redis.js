import Redis from 'ioredis';

/**
 * Vercel Serverless'ta bağlantıyı warm invoke'lar arasında yeniden kullan.
 * REDIS_URL = redis:// veya rediss:// (Upstash/Vercel Redis TCP endpoint).
 */
let redis = null;

export function getRedis() {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      // Serverless: idle socket'lerin kopmasını tolere et
      retryStrategy(times) {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 1000);
      },
    });
  }

  return redis;
}

export const LEADERBOARD_KEY = 'leaderboard';
export const MAX_SCORE = 10_000_000;
export const MAX_NAME_LENGTH = 20;
export const LEADERBOARD_TOP_N = 20;

export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function sanitizePlayerName(raw) {
  if (typeof raw !== 'string') {
    return '';
  }

  // HTML tag'lerini kaldır, whitespace sadeleştir
  const stripped = raw
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return stripped.slice(0, MAX_NAME_LENGTH);
}
