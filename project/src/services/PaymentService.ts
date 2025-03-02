import { db } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { activatePremium, deactivatePremium } from './userService';
import { toast } from 'react-hot-toast';
import { loadScript } from "@paypal/paypal-js";

const PRICES = {
  USD: {
    regular: 15,
    discount: 5,
    amount: 5.00, // PayPal expects amount in dollars (not cents)
    format: (amount: number) => `$${amount.toFixed(2)}`
  }
};

export class PaymentService {
  private static async makeRequest(endpoint: string, data: any) {
    console.log('Making request to:', endpoint, 'with data:', data);
    
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || 'API request failed');
      } catch (e) {
        throw new Error(`API request failed: ${errorText}`);
      }
    }

    const responseData = await response.json();
    console.log('Received response:', responseData);
    return responseData;
  }

  static async createCheckoutSession(userId: string, email?: string) {
    try {
      console.log('Creating checkout session for user:', userId, 'email:', email);
      
      const currency = 'USD';
      console.log('Using currency:', currency);
      
      // Create order on server
      const { clientId, orderId, orderDetails } = await this.makeRequest('payments/create-checkout', {
        userId,
        email,
        amount: PRICES[currency].amount,
        currency: currency,
        description: `Premium Subscription - Monthly (${PRICES[currency].format(PRICES[currency].amount)})`,
      });

      return { clientId, orderId, orderDetails };
    } catch (error) {
      console.error('Error starting checkout:', error);
      throw error;
    }
  }

  static async initializePayPalButtons(clientId: string, orderId: string, orderDetails: any) {
    try {
      // Load PayPal script
      const paypal = await loadScript({ 
        clientId: clientId,
        currency: 'USD',
        intent: "capture",
        components: "buttons",
        "disable-funding": "paylater",
        "enable-funding": "paypal,card,credit",
        "data-namespace": "paypal_sdk",
      });

      if (!paypal) {
        throw new Error("Failed to load PayPal SDK");
      }

      // Wait for container to exist
      const container = document.getElementById('paypal-button-container');
      if (!container) {
        throw new Error('PayPal button container not found');
      }

      // Render PayPal buttons
      await paypal.Buttons({
        style: {
          shape: 'rect',
          color: 'gold',
          layout: 'vertical',
          label: 'paypal'
        },
        createOrder: async () => {
          return orderId;
        },
        onApprove: async (data) => {
          try {
            // Capture the payment
            await this.makeRequest('payments/capture-order', {
              orderId: data.orderID,
              orderDetails
            });

            // Show success message
            toast.success('Payment successful! Your premium features are now active.');
            
            // Reload the page after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (error) {
            console.error('Error capturing payment:', error);
            toast.error('Failed to complete payment. Please contact support.');
          }
        },
        onError: (err) => {
          console.error('PayPal error:', err);
          toast.error('Payment failed. Please try again.');
        },
        onCancel: () => {
          toast.error('Payment cancelled. Please try again when you\'re ready.');
        }
      }).render('#paypal-button-container');
    } catch (error) {
      console.error('Error initializing PayPal buttons:', error);
      throw error;
    }
  }

  static async checkPaymentStatus() {
    try {
      const orderIdFromUrl = new URLSearchParams(window.location.search).get('order_id');
      
      // If we have an order_id in the URL and we're on the success page, it's a successful payment
      if (orderIdFromUrl && window.location.pathname.includes('/success')) {
        console.log('Payment successful, order ID:', orderIdFromUrl);
        
        // Show success message
        toast.success('Payment successful! Your premium features are now active.');
        
        // Reload the page after a short delay
        setTimeout(() => {
          // Remove query parameters and reload
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.reload();
        }, 2000);
        
        return { status: 'PAID' };
      }

      return null;
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast.error('Failed to check payment status. Please refresh the page.');
      return null;
    }
  }

  static async updateUserPremiumStatus(userId: string, isPremium: boolean) {
    try {
      if (isPremium) {
        await activatePremium(userId, 'monthly');
      } else {
        await deactivatePremium(userId);
      }
    } catch (error) {
      console.error('Error updating premium status:', error);
      throw error;
    }
  }

  static async cancelSubscription(userId: string) {
    try {
      await this.makeRequest('payments/cancel', { userId });
      await deactivatePremium(userId);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  static async checkStorageLimit(userId: string, fileSize: number): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (!userData) {
        throw new Error('User not found');
      }

      const { premium, isPremium } = userData;
      const currentUsed = premium?.storage?.used || 0;
      const totalStorage = isPremium ? 10 * 1024 * 1024 * 1024 : 512 * 1024 * 1024; // 10GB for premium, 512MB for free

      console.log('Storage check:', {
        isPremium,
        currentUsed: formatBytes(currentUsed),
        totalStorage: formatBytes(totalStorage),
        fileSize: formatBytes(fileSize),
        wouldUse: formatBytes(currentUsed + fileSize),
        hasSpace: (currentUsed + fileSize) <= totalStorage
      });

      return (currentUsed + fileSize) <= totalStorage;
    } catch (error) {
      console.error('Error checking storage limit:', error);
      throw error;
    }
  }

  static async updateStorageUsed(userId: string, additionalBytes: number) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (!userData) {
        throw new Error('User not found');
      }

      const currentUsed = userData.premium?.storage?.used || 0;
      const totalStorage = userData.isPremium ? 10 * 1024 * 1024 * 1024 : 512 * 1024 * 1024;

      await updateDoc(userRef, {
        'premium.storage.used': currentUsed + additionalBytes,
        'premium.storage.lastUpdated': new Date().toISOString()
      });

      // Log storage usage
      console.log('Storage usage updated:', {
        userId,
        currentUsed: formatBytes(currentUsed + additionalBytes),
        totalStorage: formatBytes(totalStorage),
        percentage: ((currentUsed + additionalBytes) / totalStorage * 100).toFixed(2) + '%'
      });
    } catch (error) {
      console.error('Error updating storage used:', error);
      throw error;
    }
  }

  static async checkProjectLimit(userId: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (!userData) {
        throw new Error('User not found');
      }

      const { premium } = userData;
      return premium.projectLimits.currentProjects < premium.projectLimits.maxProjects;
    } catch (error) {
      console.error('Error checking project limit:', error);
      throw error;
    }
  }

  static async incrementProjectCount(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (!userData) {
        throw new Error('User not found');
      }

      const currentCount = userData.premium.projectLimits.currentProjects;
      await updateDoc(userRef, {
        'premium.projectLimits.currentProjects': currentCount + 1
      });
    } catch (error) {
      console.error('Error incrementing project count:', error);
      throw error;
    }
  }
} 