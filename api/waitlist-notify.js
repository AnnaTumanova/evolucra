import { sendTelegramNotification, formatWaitlistNotification } from './lib/telegram.js';
import { verifyTurnstile, getClientIp } from './lib/turnstile.js';

const GOOGLE_SHEETS_WEBHOOK_URL =
  process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
  'https://script.google.com/macros/s/AKfycbxmtZzXTsakkjA61Kpv1JOOj4oHtH48TwABp1p93hsBkQ5wD1b7sLjL-TfeEhntfBWJ/exec';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, workshop, website, turnstileToken } = req.body || {};

    // Honeypot: real users never see or fill this field
    if (website) {
      return res.status(200).json({ success: true });
    }

    if (!name || !email || !workshop) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isHuman = await verifyTurnstile(turnstileToken, getClientIp(req));
    if (!isHuman) {
      return res.status(403).json({ error: 'Human verification failed' });
    }

    const params = new URLSearchParams({ name, email, workshop });
    const sheetsResponse = await fetch(`${GOOGLE_SHEETS_WEBHOOK_URL}?${params}`);
    if (!sheetsResponse.ok) {
      console.error('Google Sheets error:', sheetsResponse.status);
      return res.status(502).json({ error: 'Failed to save signup' });
    }

    // Send Telegram notification
    const message = formatWaitlistNotification({ name, email, workshop });
    await sendTelegramNotification(message);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Waitlist notification error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
