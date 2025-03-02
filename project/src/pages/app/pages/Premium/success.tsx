import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { motion } from 'framer-motion';

export function PremiumSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/app/premium');
    }
  }, [sessionId, navigate]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border border-gray-200 p-8">
            <div className="w-16 h-16 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome to Premium!
            </h1>
            <p className="text-gray-600 mb-6">
              Your payment was successful and your account has been upgraded. You now have access to all premium features.
            </p>

            <div className="space-y-4">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate('/app')}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/app/premium')}
              >
                View Premium Features
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 