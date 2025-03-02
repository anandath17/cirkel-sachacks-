import { NextApiRequest, NextApiResponse } from 'next';
import { PaymentService } from '../../services/PaymentService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify webhook signature from Xendit
  const xenditHeader = req.headers['x-callback-token'];
  const webhookKey = process.env.XENDIT_WEBHOOK_KEY;

  if (!webhookKey) {
    console.error('XENDIT_WEBHOOK_KEY is not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  if (xenditHeader !== webhookKey) {
    console.error('Invalid webhook signature');
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  try {
    const { 
      external_id,
      status,
      payment_method,
      paid_amount,
      paid_at,
      metadata
    } = req.body;

    console.log('Received webhook:', {
      external_id,
      status,
      payment_method,
      paid_amount
    });

    // Extract userId from external_id (format: premium-userId-timestamp)
    const [_, userId] = external_id.split('-');

    switch (status) {
      case 'PAID': {
        // Update premium status
        if (userId) {
          await PaymentService.updateUserPremiumStatus(userId, true);
          console.log('Premium activated for user:', userId);
        }
        break;
      }

      case 'EXPIRED': {
        // Handle expired invoice
        if (userId) {
          await PaymentService.updateUserPremiumStatus(userId, false);
          console.log('Premium expired for user:', userId);
        }
        break;
      }

      case 'FAILED': {
        // Handle failed payment
        console.log('Payment failed for user:', userId);
        break;
      }
    }

    res.json({ 
      received: true,
      message: `Webhook processed: ${status}`,
      userId
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      message: 'Error processing webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 