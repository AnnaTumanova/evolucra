const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramNotification(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials not configured');
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      console.error('Telegram API error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

export function formatWaitlistNotification({ name, email, workshop }) {
  return `📝 <b>New Waitlist Signup!</b>

👤 <b>Name:</b> ${name}
📧 <b>Email:</b> ${email}
🎓 <b>Workshop:</b> ${workshop}

⏰ ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`;
}

export function formatPaymentNotification({ customerEmail, workshop, amount }) {
  return `💰 <b>New Payment Received!</b>

📧 <b>Email:</b> ${customerEmail}
🎓 <b>Workshop:</b> ${workshop}
💵 <b>Amount:</b> ${amount}

⏰ ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`;
}
