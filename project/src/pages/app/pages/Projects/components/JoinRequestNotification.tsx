import { useState, useEffect } from 'react';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import type { ProjectJoinRequest, ProjectAttachment } from '../../../../../types/project';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface JoinRequestNotificationProps {
  request: ProjectJoinRequest;
  onAccept: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
}

export function JoinRequestNotification({ request, onAccept, onReject }: JoinRequestNotificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userData, setUserData] = useState<{ fullName?: string; avatar?: string; profileImage?: string; photoURL?: string } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', request.userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [request.userId]);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept(request.id);
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(request.id);
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-start gap-6">
      {/* User Avatar */}
      <div className="flex-shrink-0">
        {(userData?.avatar || userData?.profileImage || userData?.photoURL || request.user.avatar) ? (
          <img 
            src={userData?.avatar || userData?.profileImage || userData?.photoURL || request.user.avatar}
            alt={userData?.fullName || request.user.name}
            className="w-12 h-12 rounded-full object-cover ring-4 ring-white shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 ring-4 ring-white shadow-sm flex items-center justify-center">
            <span className="text-lg font-medium text-gray-600">
              {(userData?.fullName || request.user.name).charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Request Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-medium text-gray-900">
              {userData?.fullName || request.user.name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              {request.role && (
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: request.role.color ? `${request.role.color}15` : '#f3f4f6',
                    color: request.role.color || '#6b7280'
                  }}
                >
                  {request.role.title}
                </span>
              )}
              <span className="text-sm text-gray-500">
                {formatDate(request.createdAt)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600"
            >
              {isExpanded ? 'Hide' : 'View Details'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={isLoading}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAccept}
              loading={isLoading}
            >
              Accept
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pl-0">
                {/* Message */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Message</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {request.message || 'No message provided'}
                    </p>
                  </div>
                </div>

                {/* Attachments */}
                {request.attachments && request.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {request.attachments.map((file: ProjectAttachment, index: number) => (
                        <motion.a
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-gray-600 group-hover:text-gray-900 truncate">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          </div>
                        </motion.a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 