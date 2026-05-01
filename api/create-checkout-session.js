import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Workshop price IDs - you'll need to create these in Stripe Dashboard
// Go to Products → Create Product → Add Price → Copy the price ID (starts with price_)
const WORKSHOP_PRICES = {
  foundation: process.env.STRIPE_PRICE_FOUNDATION,
  intermediate: process.env.STRIPE_PRICE_INTERMEDIATE,
  advanced: process.env.STRIPE_PRICE_ADVANCED,
};

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
    const { workshop, customerEmail, customerName } = req.body;

    // Validate workshop
    if (!workshop || !WORKSHOP_PRICES[workshop]) {
      return res.status(400).json({ error: 'Invalid workshop selected' });
    }

    const priceId = WORKSHOP_PRICES[workshop];
    
    if (!priceId) {
      return res.status(400).json({ error: 'Workshop price not configured' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        customerName,
        workshop,
      },
      success_url: `${req.headers.origin || 'https://evolucra.com'}?payment=success&workshop=${workshop}`,
      cancel_url: `${req.headers.origin || 'https://evolucra.com'}?payment=cancelled`,
    });

    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: error.message });
  }
}
