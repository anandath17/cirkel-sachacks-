import React from 'react';
import type { Badge } from '../../types/user';
import { FaCrown } from 'react-icons/fa';
import { BsCheckCircleFill, BsStarFill, BsGem } from 'react-icons/bs';

interface UserBadgeProps {
  badge: Badge;
  currentUserId?: string;
}

const FOUNDER_ID = 'sFXax4C0zgcuoE2Xa5ARJfKxsfR2';

const getBadgeIcon = (type: Badge['type']) => {
  switch (type) {
    case 'founder':
      return <FaCrown className="text-yellow-500" />;
    case 'verified':
      return <BsCheckCircleFill className="text-blue-500" />;
    case 'premium':
      return <BsGem className="text-purple-500" />;
    case 'contributor':
      return <BsStarFill className="text-green-500" />;
    default:
      return null;
  }
};

const getBadgeColor = (type: Badge['type']) => {
  switch (type) {
    case 'founder':
      return 'bg-yellow-100 border-yellow-300';
    case 'verified':
      return 'bg-blue-100 border-blue-300';
    case 'premium':
      return 'bg-purple-100 border-purple-300';
    case 'contributor':
      return 'bg-green-100 border-green-300';
    default:
      return 'bg-gray-100 border-gray-300';
  }
};

export const UserBadge: React.FC<UserBadgeProps> = ({ badge, currentUserId }) => {
  // Only show founder badge if it belongs to the founder or it's being viewed by others
  if (badge.type === 'founder' && badge.userId !== FOUNDER_ID) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center px-2 py-1 rounded-full border ${getBadgeColor(
        badge.type
      )} gap-1`}
      title={badge.description}
    >
      {getBadgeIcon(badge.type)}
      <span className="text-sm font-medium">{badge.title}</span>
    </div>
  );
};

export default UserBadge; 