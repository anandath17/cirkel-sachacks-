const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config();

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();
const port = process.env.PORT || 3000;
const CLIENT_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_APP_URL 
  : 'http://localhost:5174';

// Enable CORS for the Vite dev server
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Options pre-flight
app.options('*', cors());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Payment route
app.post('/api/payments/create-checkout', async (req, res) => {
  console.log('Received payment request:', req.body);
  
  try {
    const { userId, amount, currency, description, email } = req.body;

    if (!process.env.PAYPAL_CLIENT_ID) {
      throw new Error('PayPal client ID is not configured');
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `order-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `premium-${userId}-${Date.now()}`,
          custom_id: JSON.stringify({ userId }),
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: amount.toFixed(2)
              }
            }
          },
          description: description,
          items: [{
            name: 'Premium Subscription',
            description: 'Monthly Premium Subscription',
            quantity: '1',
            unit_amount: {
              currency_code: currency,
              value: amount.toFixed(2)
            },
            category: 'DIGITAL_GOODS'
          }]
        }],
        application_context: {
          brand_name: 'Cirkel',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${CLIENT_URL}/app/premium/success`,
          cancel_url: `${CLIENT_URL}/app/premium`,
          shipping_preference: 'NO_SHIPPING'
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('PayPal order creation failed:', data);
      throw new Error(data.message || 'Failed to create PayPal order');
    }

    console.log('PayPal order created successfully:', data);
    res.json({
      clientId: process.env.PAYPAL_CLIENT_ID,
      orderId: data.id,
      orderDetails: {
        userId,
        amount,
        currency,
        description,
        email
      }
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      message: 'Error creating checkout session',
      error: error.message
    });
  }
});

// Add payment success route
app.post('/api/payments/capture', async (req, res) => {
  try {
    const { orderDetails, paypalOrderId } = req.body;
    const { userId } = orderDetails;

    if (userId) {
      // Update user's premium status in Firestore
      const userRef = doc(db, 'users', userId);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      await updateDoc(userRef, {
        isPremium: true,
        premium: {
          isActive: true,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          plan: 'monthly',
          autoRenew: true,
          storage: {
            total: 10, // 10GB for premium
            used: 0
          },
          projectLimits: {
            maxProjects: 999999,
            currentProjects: 0
          }
        },
        updatedAt: new Date()
      });

      console.log('Premium status updated for user:', userId);
    }

    res.json({
      status: 'success',
      message: 'Payment captured successfully'
    });
  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({
      message: 'Error capturing payment',
      error: error.message
    });
  }
});

// Add payment status check route
app.get('/api/payments/check-status/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    console.log('Checking payment status for invoice:', invoiceId);

    const invoice = await i.getInvoice({
      invoiceID: invoiceId
    });
    
    console.log('Invoice status:', invoice.status);

    if (invoice.status === 'PAID') {
      // Extract userId from external_id (format: premium-userId-timestamp)
      const [_, userId] = invoice.external_id.split('-');

      if (userId) {
        // Update user's premium status in Firestore
        const userRef = doc(db, 'users', userId);
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

        await updateDoc(userRef, {
          isPremium: true,
          premium: {
            isActive: true,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            plan: 'monthly',
            autoRenew: true,
            storage: {
              total: 10, // 10GB for premium
              used: 0
            },
            projectLimits: {
              maxProjects: 999999,
              currentProjects: 0
            }
          },
          updatedAt: new Date()
        });

        console.log('Premium status updated for user:', userId);
      }
    }

    res.json({
      status: invoice.status,
      paid_at: invoice.paid_at,
      payment_method: invoice.payment_method
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      message: 'Error checking payment status',
      error: error.message || 'Unknown error'
    });
  }
});

// Helper function to get premium features
function getPremiumFeatures() {
  return {
    isActive: true,
    plan: 'monthly',
    autoRenew: true,
    storage: {
      total: 10 * 1024 * 1024 * 1024, // 10GB in bytes
      used: 0
    },
    projectLimits: {
      maxProjects: 999999,
      currentProjects: 0
    },
    features: {
      customization: true,
      prioritySupport: true,
      advancedAnalytics: true,
      enhancedSecurity: true
    }
  };
}

// Update the webhook handler
app.post('/api/webhook', async (req, res) => {
  console.log('Received webhook:', req.body);
  
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
      paid_amount
    } = req.body;

    console.log('Processing webhook:', {
      external_id,
      status,
      payment_method,
      paid_amount
    });

    // Extract userId from external_id (format: premium-userId-timestamp)
    const [_, userId] = external_id.split('-');

    if (!userId) {
      throw new Error('Invalid external_id format');
    }

    if (status === 'PAID') {
      // Update user's premium status in Firestore
      const userRef = doc(db, 'users', userId);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

      const premiumFeatures = getPremiumFeatures();
      
      await updateDoc(userRef, {
        isPremium: true,
        premium: {
          ...premiumFeatures,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        updatedAt: new Date()
      });

      console.log('Premium status and features updated for user:', userId);
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
      error: error.message
    });
  }
});

// Update the success route
app.get('/app/premium/success', async (req, res) => {
  try {
    // Extract external_id from query parameters or URL
    const external_id = req.query.external_id || req.query.order_id;
    
    if (external_id) {
      console.log('Processing success callback for order:', external_id);
      
      // Extract userId from external_id (format: premium-userId-timestamp)
      const parts = external_id.split('-');
      if (parts.length >= 3) {
        const userId = parts[1]; // Get the userId part
        console.log('Extracted userId:', userId);

        // Update user's premium status
        const userRef = doc(db, 'users', userId);
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        const premiumFeatures = getPremiumFeatures();

        await updateDoc(userRef, {
          isPremium: true,
          premium: {
            ...premiumFeatures,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          updatedAt: new Date()
        });

        console.log('Premium status and features updated for user:', userId);
      }
    }
  } catch (error) {
    console.error('Error processing success callback:', error);
  }

  // Always redirect back to the premium page
  res.redirect(`${CLIENT_URL}/app/premium/success`);
});

// Cancel route
app.get('/app/premium', (req, res) => {
  res.redirect(`${CLIENT_URL}/app/premium`);
});

// Catch-all route for debugging
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.error(`API route not found: ${req.method} ${req.path}`);
    res.status(404).json({
      message: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  } else {
    // For all other routes, redirect to the client
    res.redirect(CLIENT_URL);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Add PayPal access token management
let paypalAccessToken = null;
let tokenExpiry = null;

async function getPayPalAccessToken() {
  try {
    // Check if we have a valid token
    if (paypalAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return paypalAccessToken;
    }

    // Get new access token
    const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to get PayPal access token');
    }

    // Store the token and set expiry (subtract 5 minutes for safety margin)
    paypalAccessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);

    return paypalAccessToken;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw error;
  }
}

// Add PayPal order creation endpoint
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { orderDetails } = req.body;
    
    // Get access token
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `order-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `premium-${orderDetails.userId}-${Date.now()}`,
          custom_id: JSON.stringify({ userId: orderDetails.userId }),
          amount: {
            currency_code: orderDetails.currency,
            value: (orderDetails.amount).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: orderDetails.currency,
                value: (orderDetails.amount).toFixed(2)
              }
            }
          },
          description: orderDetails.description,
          items: [{
            name: 'Premium Subscription',
            description: 'Monthly Premium Subscription',
            quantity: '1',
            unit_amount: {
              currency_code: orderDetails.currency,
              value: (orderDetails.amount).toFixed(2)
            },
            category: 'DIGITAL_GOODS'
          }]
        }],
        application_context: {
          brand_name: 'Cirkel',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${CLIENT_URL}/app/premium/success`,
          cancel_url: `${CLIENT_URL}/app/premium`,
          shipping_preference: 'NO_SHIPPING'
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('PayPal order creation failed:', data);
      throw new Error(data.message || 'Failed to create PayPal order');
    }

    console.log('PayPal order created successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({
      message: 'Error creating PayPal order',
      error: error.message
    });
  }
});

// Add PayPal order capture endpoint
app.post('/api/payments/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // Get access token
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('PayPal capture failed:', data);
      throw new Error(data.message || 'Failed to capture PayPal order');
    }

    // If capture successful, update user's premium status
    if (data.status === 'COMPLETED') {
      const orderDetails = data.purchase_units[0].custom_id;
      if (orderDetails) {
        const { userId } = JSON.parse(orderDetails);
        if (userId) {
          // Update user's premium status in Firestore
          const userRef = doc(db, 'users', userId);
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

          await updateDoc(userRef, {
            isPremium: true,
            premium: {
              isActive: true,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              plan: 'monthly',
              autoRenew: true,
              storage: {
                total: 10, // 10GB for premium
                used: 0
              },
              projectLimits: {
                maxProjects: 999999,
                currentProjects: 0
              }
            },
            updatedAt: new Date()
          });

          console.log('Premium status updated for user:', userId);
        }
      }
    }

    console.log('PayPal capture completed successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({
      message: 'Error capturing PayPal order',
      error: error.message
    });
  }
});

// Start server
try {
  const server = app.listen(port, '127.0.0.1', () => {
    console.log('----------------------------------------');
    console.log(`Server started at ${new Date().toISOString()}`);
    console.log(`Server running at http://127.0.0.1:${port}`);
    console.log(`Client URL: ${CLIENT_URL}`);
    console.log('Available routes:');
    console.log('  - GET  /api/test');
    console.log('  - POST /api/payments/create-checkout');
    console.log('  - GET  /api/payments/check-status/:invoiceId');
    console.log('  - GET  /app/premium/success');
    console.log('  - GET  /app/premium');
    console.log('CORS enabled for:');
    console.log('  - http://localhost:5173');
    console.log('  - http://localhost:5174');
    console.log('----------------------------------------');
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please try a different port or close the process using this port.`);
    } else {
      console.error('Server error:', error);
    }
    process.exit(1);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 