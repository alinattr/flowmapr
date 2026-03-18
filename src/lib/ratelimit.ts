import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 10 requests per 60 seconds per user
export const generateRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'rl:generate',
})

// 20 requests per 60 seconds per user (lighter endpoints)
export const lensRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  prefix: 'rl:lens',
})
