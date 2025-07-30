// Simple in-memory rate limiter for InstantDeco API
class RateLimiter {
  constructor() {
    this.lastRequestTime = 0;
    this.minTimeBetweenRequests = 45000; // 45 seconds between requests
    this.requestCount = 0;
    this.resetTime = Date.now() + 3600000; // Reset counter every hour
  }

  canMakeRequest() {
    const now = Date.now();
    
    // Reset counter if hour has passed
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 3600000;
    }
    
    // Check if enough time has passed since last request
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minTimeBetweenRequests) {
      const waitTime = Math.ceil((this.minTimeBetweenRequests - timeSinceLastRequest) / 1000);
      return {
        allowed: false,
        waitTime,
        message: `Please wait ${waitTime} seconds before making another request.`
      };
    }
    
    return { allowed: true };
  }

  recordRequest() {
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }
}

// Create a singleton instance
if (!global.instantDecoRateLimiter) {
  global.instantDecoRateLimiter = new RateLimiter();
}

module.exports = global.instantDecoRateLimiter;