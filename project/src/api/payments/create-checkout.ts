import { Request, Response } from 'express';
import Xendit from 'xendit-node';

if (!process.env.XENDIT_SECRET_KEY) {
  throw new Error('XENDIT_SECRET_KEY is not set in environment variables');
}

const x = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

const { Invoice } = x;
const i = new Invoice({});

export default async function handler(req: Request, res: Response) {
  console.log('Received checkout request:', {
    method: req.method,
    body: req.body,
    headers: req.headers['content-type']
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, amount, currency, description, email } = req.body;

    // Validate required fields
    if (!userId || !amount || !currency || !description) {
      console.error('Missing required fields:', { userId, amount, currency, description });
      return res.status(400).json({ 
        message: 'Missing required fields',
        missing: Object.entries({ userId, amount, currency, description })
          .filter(([_, value]) => !value)
          .map(([key]) => key)
      });
    }

    // Test mode notification
    console.log('Creating test invoice with Xendit:', {
      amount,
      currency,
      description,
      email: email || 'customer@example.com'
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';

    // Create Invoice with Xendit
    const invoice = await i.createInvoice({
      externalId: `premium-${userId}-${Date.now()}`,
      amount,
      currency,
      description,
      reminderTime: 1,
      payerEmail: email || 'customer@example.com',
      customer: {
        given_names: req.body.name || 'Customer',
        email: email || 'customer@example.com',
        mobile_number: req.body.phone || '+628123456789',
      },
      successRedirectUrl: `${baseUrl}/app/premium/success`,
      failureRedirectUrl: `${baseUrl}/app/premium`,
      paymentMethods: currency === 'IDR' ? [
        'BCA',
        'BNI',
        'BSI',
        'BRI',
        'MANDIRI',
        'PERMATA',
        'ALFAMART',
        'INDOMARET',
        'OVO',
        'DANA',
        'LINKAJA',
        'QRIS',
        'CREDIT_CARD'
      ] : ['CREDIT_CARD'],
      items: [
        {
          name: 'Premium Subscription',
          quantity: 1,
          price: amount,
          category: 'Subscription',
        },
      ],
      fees: [
        {
          type: 'Monthly Subscription',
          value: amount,
        },
      ],
    });

    console.log('Test invoice created:', {
      id: invoice.id,
      url: invoice.invoice_url
    });

    res.status(200).json({ 
      invoiceUrl: invoice.invoice_url,
      invoiceId: invoice.id,
      testCards: process.env.NODE_ENV === 'development' ? {
        success: '4000000000000002',
        failure: '4000000000000069',
      } : undefined
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ 
      message: 'Error creating invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 