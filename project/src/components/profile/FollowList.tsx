import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getFollowers, getFollowing } from '../../services/followerService';
import type { UserProfile } from '../../types/user';
import { FollowButton } from './FollowButton';

interface FollowListProps {
  userId: string;
  currentUserId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

export function FollowList({
  userId,
  currentUserId,
  type,
  onClose
}: FollowListProps) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = type === 'followers' 
          ? await getFollowers(userId)
          : await getFollowing(userId);
        setUsers(data);
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        setError(`Failed to load ${type}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [userId, type]);

  const handleUserClick = (userId: string) => {
    onClose();
    setTimeout(() => {
      if (userId === currentUserId) {
        navigate('/app/profile');
      } else {
        navigate(`/app/profile/${userId}`);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold capitalize">
            {type}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-4">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No {type} yet
            </div>
          ) : (
            <AnimatePresence>
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between py-3"
                >
                  <div 
                    className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600">
                          {user.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {user.fullName}
                      </h3>
                      {user.professionalTitle && (
                        <p className="text-sm text-gray-500 truncate">
                          {user.professionalTitle}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <FollowButton
                      currentUserId={currentUserId}
                      targetUserId={user.id}
                      size="sm"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
} 