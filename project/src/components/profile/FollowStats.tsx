import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFollowStats } from '../../services/followerService';
import { FollowList } from './FollowList';

interface FollowStatsProps {
  userId: string;
  currentUserId: string;
  className?: string;
}

export function FollowStats({
  userId,
  currentUserId,
  className = ''
}: FollowStatsProps) {
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [showList, setShowList] = useState<'followers' | 'following' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching follow stats for user:', userId);
        setLoading(true);
        const data = await getFollowStats(userId);
        console.log('Received follow stats:', data);
        setStats(data);
      } catch (error) {
        console.error('Error fetching follow stats:', error);
        console.error('User ID:', userId);
        console.error('Current User ID:', currentUserId);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      console.log('Starting to fetch follow stats for user:', userId);
      fetchStats();
    } else {
      console.error('No userId provided to FollowStats component');
    }
  }, [userId]);

  const StatButton = ({ type, count }: { type: 'followers' | 'following'; count: number }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setShowList(type)}
      className="flex flex-col items-center px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <span className="font-semibold text-lg text-gray-900">
        {loading ? '-' : count.toLocaleString()}
      </span>
      <span className="text-sm text-gray-600 capitalize">
        {type}
      </span>
    </motion.button>
  );

  return (
    <>
      <div className={`flex items-center justify-center space-x-4 ${className}`}>
        <StatButton type="followers" count={stats.followers} />
        <div className="h-8 w-px bg-gray-200" />
        <StatButton type="following" count={stats.following} />
      </div>

      {showList && (
        <FollowList
          userId={userId}
          currentUserId={currentUserId}
          type={showList}
          onClose={() => setShowList(null)}
        />
      )}
    </>
  );
} 