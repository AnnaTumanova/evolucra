import { sendTelegramNotification, formatWaitlistNotification } from './lib/telegram.js';

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
    const { name, email, workshop } = req.body;

    if (!name || !email || !workshop) {
      return res.status(400).json({ error: 'Missing required fields' });
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
