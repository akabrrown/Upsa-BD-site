import { RateLimiterMemory } from 'rate-limiter-flexible'

export const loginLimiter = new RateLimiterMemory({
  keyPrefix: 'login_fail',
  points: 5,
  duration: 15 * 60,
})

export const addPersonLimiter = new RateLimiterMemory({
  keyPrefix: 'add_person',
  points: 5000,
  duration: 60,
})
