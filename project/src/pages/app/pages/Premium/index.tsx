import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { PaymentService } from '../../../../services/PaymentService';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { RiVipCrownFill, RiDatabase2Fill, RiProjector2Fill, RiCustomerService2Fill, RiSparklingFill } from 'react-icons/ri';

const PRICES = {
  USD: {
    regular: 15,
    discount: 5,
    symbol: '$',
    format: (amount: number) => `$${amount}`
  }
};

const premiumFeatures = [
  {
    title: 'Unlimited Projects',
    description: 'Create and manage unlimited projects (Free: 3 projects)',
    icon: <RiProjector2Fill className="w-6 h-6" />,
    highlight: true
  },
  {
    title: '10GB Storage',
    description: 'Expanded storage space (Free: 1GB)',
    icon: <RiDatabase2Fill className="w-6 h-6" />,
    highlight: true
  },
  {
    title: 'Premium Badge',
    description: 'Exclusive premium member badge on your profile',
    icon: <RiVipCrownFill className="w-6 h-6" />,
    highlight: true
  },
  {
    title: 'Advanced Collaboration',
    description: 'Access to enhanced collaboration features',
    icon: <RiCustomerService2Fill className="w-6 h-6" />,
    highlight: true
  }
];

const additionalFeatures = [
  'Unlimited project creation',
  '10GB storage space',
  'Premium profile badge',
  'GitHub integration (Coming soon)',
  'Advanced collaboration tools',
  'Cross-platform integrations',
  'Priority support access',
  'Early access to new features'
];

export function Premium() {
  const { userProfile, currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);

  useEffect(() => {
    // Check payment status on mount
    PaymentService.checkPaymentStatus();
  }, []);

  // Add useEffect to initialize PayPal buttons when container is ready
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const initializePayPal = async (clientId: string, orderId: string, orderDetails: any) => {
      try {
        // Small delay to ensure container is rendered
        timeoutId = setTimeout(async () => {
          await PaymentService.initializePayPalButtons(clientId, orderId, orderDetails);
        }, 100);
      } catch (error) {
        console.error('Error initializing PayPal:', error);
        toast.error('Failed to initialize payment system. Please try again.');
        setShowPayPal(false);
      }
    };

    if (showPayPal && currentUser) {
      const paypalData = sessionStorage.getItem('paypalData');
      if (paypalData) {
        const { clientId, orderId, orderDetails } = JSON.parse(paypalData);
        initializePayPal(clientId, orderId, orderDetails);
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showPayPal, currentUser]);

  const handleUpgrade = async () => {
    if (!currentUser) {
      toast.error('Please sign in to upgrade');
      return;
    }

    try {
      setIsLoading(true);
      const { clientId, orderId, orderDetails } = await PaymentService.createCheckoutSession(currentUser.uid);
      
      // Store PayPal data in session storage
      sessionStorage.setItem('paypalData', JSON.stringify({ clientId, orderId, orderDetails }));
      
      // Show PayPal buttons
      setShowPayPal(true);
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast.error('Failed to start checkout process. Please try again.');
      setShowPayPal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      await PaymentService.cancelSubscription(currentUser.uid);
      toast.success('Subscription cancelled successfully');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (userProfile?.isPremium) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div>
              <RiVipCrownFill className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Premium Status</h1>
              <p className="text-gray-600 mt-1">Enjoying premium benefits</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleCancelSubscription}
            disabled={isLoading}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            {isLoading ? 'Processing...' : 'Cancel Subscription'}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {premiumFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-gray-200 overflow-hidden group">
                <div className="p-6">
                  <div className="relative mb-4">
                    <div className="text-primary-600">
                      {feature.icon}
                    </div>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.7, 0.3]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.5
                      }}
                      className="absolute inset-0 bg-primary-400/20 rounded-full blur-sm"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
                <div className="absolute inset-0 pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400/0 via-primary-400/10 to-primary-400/0 animate-shine" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Premium Benefits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {additionalFeatures.map((feature, index) => (
                  <div key={feature} className="flex items-center gap-2">
                    <RiSparklingFill className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upgrade to Premium
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unlock unlimited projects, expanded storage, and exclusive features
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {premiumFeatures.map((feature, index) => (
              <Card 
                key={feature.title}
                className={`border-gray-200 overflow-hidden ${feature.highlight ? 'bg-gradient-to-br from-primary-50/50 to-primary-100/30' : ''}`}
              >
                <div className="p-6">
                  <div className="mb-4">
                    <div className={`${feature.highlight ? 'text-primary-600' : 'text-gray-600'}`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </Card>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-gray-200 sticky top-6 overflow-hidden group">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
                  <div className="px-3 py-1 bg-primary-50 rounded-full">
                    <span className="text-sm font-medium text-primary-600">67% OFF</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {PRICES.USD.format(PRICES.USD.discount)}
                    </span>
                    <span className="text-gray-600">/first month</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-gray-500 line-through">
                      {PRICES.USD.format(PRICES.USD.regular)}/month
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">
                      First-time offer
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">Special price for new subscribers</p>
                </div>

                <div className="space-y-4 mb-8">
                  {additionalFeatures.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + (index * 0.1) }}
                      className="flex items-center gap-3"
                    >
                      <RiSparklingFill className="w-5 h-5 text-primary-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {!showPayPal ? (
                  <Button
                    onClick={handleUpgrade}
                    variant="primary"
                    className="w-full relative overflow-hidden group"
                    disabled={isLoading}
                  >
                    <span className="relative z-10">
                      {isLoading ? 'Processing...' : 'Upgrade Now'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600/0 via-white/30 to-primary-600/0 group-hover:animate-shine" />
                  </Button>
                ) : (
                  <div className="w-full">
                    <div id="paypal-button-container" className="w-full"></div>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure payment with SSL encryption
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400/0 via-primary-400/5 to-primary-400/0 animate-shine" />
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 