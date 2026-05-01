import Stripe from 'stripe';
import { sendTelegramNotification, formatPaymentNotification } from './lib/telegram.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const workshopNames = {
      foundation: 'Foundation Workshop',
      intermediate: 'Intermediate Workshop',
      advanced: 'Advanced Workshop',
    };

    const workshop = session.metadata?.workshop || 'Unknown';
    const workshopName = workshopNames[workshop] || workshop;
    const amount = session.amount_total 
      ? `${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase()}`
      : 'N/A';

    const message = formatPaymentNotification({
      customerEmail: session.customer_email || 'N/A',
      workshop: workshopName,
      amount,
    });

    await sendTelegramNotification(message);
  }

  return res.status(200).json({ received: true });
}
