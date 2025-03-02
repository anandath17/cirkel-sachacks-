import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { followUser, unfollowUser, isFollowing } from '../../services/followerService';

interface FollowButtonProps {
  currentUserId: string;
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FollowButton({
  currentUserId,
  targetUserId,
  onFollowChange,
  size = 'md',
  className = ''
}: FollowButtonProps) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const status = await isFollowing(currentUserId, targetUserId);
        setFollowing(status);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    if (currentUserId && targetUserId) {
      checkFollowStatus();
    }
  }, [currentUserId, targetUserId]);

  const handleClick = async () => {
    if (loading || currentUserId === targetUserId) return;

    setLoading(true);
    try {
      if (following) {
        await unfollowUser(currentUserId, targetUserId);
        setFollowing(false);
      } else {
        await followUser(currentUserId, targetUserId);
        setFollowing(true);
      }
      onFollowChange?.(following);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-sm';
      case 'lg':
        return 'px-6 py-2.5 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  if (currentUserId === targetUserId) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={loading}
      className={`
        rounded-full font-medium transition-all duration-200
        ${getSizeClasses()}
        ${following
          ? 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          : 'bg-white text-gray-900 border border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </span>
      ) : following ? (
        'Following'
      ) : (
        'Follow'
      )}
    </motion.button>
  );
} 