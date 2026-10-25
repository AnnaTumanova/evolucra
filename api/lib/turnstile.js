const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress;
}

export async function verifyTurnstile(token, remoteip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('TURNSTILE_SECRET_KEY is not configured');
    return false;
  }
  if (!token || typeof token !== 'string') {
    return false;
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteip) {
      body.append('remoteip', remoteip);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body });
    const result = await response.json();
    if (!result.success) {
      console.warn('Turnstile verification failed:', result['error-codes']);
    }
    return result.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}
