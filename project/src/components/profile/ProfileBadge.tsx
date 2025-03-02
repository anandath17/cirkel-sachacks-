import { motion } from 'framer-motion';
import type { Badge } from '../../types/user';
import { 
  RiVipDiamondFill, 
  RiShieldCheckFill,
  RiStarFill,
  RiCheckboxCircleFill,
  RiTeamFill,
  RiTaskFill,
  RiNodeTree,
  RiBugFill,
  RiFlashlightFill,
  RiAwardFill,
  RiMedalFill,
  RiLightbulbFlashFill,
  RiGlobalFill,
  RiCodeBoxFill,
  RiUserStarFill
} from 'react-icons/ri';

interface ProfileBadgeProps {
  badge: Badge;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isInteractive?: boolean;
  userIsPremium?: boolean;
}

export function ProfileBadge({ 
  badge, 
  className = '',
  size = 'md',
  isInteractive = false,
  userIsPremium = false
}: ProfileBadgeProps) {
  const isUnavailable = (badge.id === 'premium' && !userIsPremium) || badge.isLocked;

  const getBadgeIcon = () => {
    const iconClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    
    switch (badge.id) {
      case 'premium':
        return (
          <div className="relative">
            <RiVipDiamondFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-purple-500 animate-pulse'}`} />
            {!isUnavailable && (
              <div className="absolute inset-0 bg-purple-500/20 blur-sm rounded-full animate-ping"></div>
            )}
          </div>
        );
      case 'verified':
        return <RiShieldCheckFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-blue-500'}`} />;
      case 'early_adopter':
        return (
          <div className="relative">
            <RiStarFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-amber-500'}`} />
            {!isUnavailable && (
              <div className="absolute inset-0 bg-amber-400/30 blur-sm rounded-full"></div>
            )}
          </div>
        );
      case 'contributor':
        return <RiCheckboxCircleFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-emerald-500'}`} />;
      case 'community_builder':
        return <RiTeamFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-rose-500'}`} />;
      case 'project_master':
        return <RiTaskFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-cyan-500'}`} />;
      case 'networking_pro':
        return <RiNodeTree className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-indigo-500'}`} />;
      case 'bug_hunter':
        return <RiBugFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-red-500'}`} />;
      case 'performance_guru':
        return <RiFlashlightFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-yellow-500'}`} />;
      case 'top_rated':
        return <RiAwardFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-orange-500'}`} />;
      case 'skill_master':
        return <RiMedalFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-teal-500'}`} />;
      case 'innovator':
        return <RiLightbulbFlashFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-pink-500'}`} />;
      case 'global_collaborator':
        return <RiGlobalFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-violet-500'}`} />;
      case 'framework_expert':
        return <RiCodeBoxFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-blue-600'}`} />;
      case 'rising_star':
        return <RiUserStarFill className={`${iconClass} ${isUnavailable ? 'text-gray-400' : 'text-amber-600'}`} />;
      default:
        return <RiAwardFill className={`${iconClass} text-gray-400`} />;
    }
  };

  const getBadgeStyle = () => {
    if (isUnavailable) {
      return `
        bg-gray-50
        text-gray-400
        border border-gray-200
      `;
    }

    switch (badge.id) {
      case 'premium':
        return `
          bg-gradient-to-r from-[#D72BE4]/5 to-[#D72BE4]/10
          text-[#D72BE4]
          border border-[#D72BE4]/10
        `;
      case 'early_adopter':
        return `
          bg-gradient-to-r from-amber-50 to-amber-100/50
          text-amber-700
          border border-amber-100
        `;
      case 'contributor':
        return `
          bg-gradient-to-r from-emerald-50 to-emerald-100/50
          text-emerald-700
          border border-emerald-100
        `;
      case 'community_builder':
        return `
          bg-gradient-to-r from-rose-50 to-rose-100/50
          text-rose-700
          border border-rose-100
        `;
      case 'project_master':
        return `
          bg-gradient-to-r from-cyan-50 to-cyan-100/50
          text-cyan-700
          border border-cyan-100
        `;
      case 'networking_pro':
        return `
          bg-gradient-to-r from-indigo-50 to-indigo-100/50
          text-indigo-700
          border border-indigo-100
        `;
      default:
        return `
          bg-gray-50
          text-gray-700
          border border-gray-100
        `;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-6 pl-2 pr-3 text-xs gap-1.5';
      case 'lg':
        return 'h-10 pl-3.5 pr-4.5 text-sm gap-3';
      default: // md
        return 'h-8 pl-2.5 pr-3.5 text-sm gap-2';
    }
  };

  const badgeContent = (
    <>
      <span className="flex items-center justify-center rounded-full">{getBadgeIcon()}</span>
      <span className="font-medium">{badge.title}</span>
    </>
  );

  if (isInteractive) {
    return (
      <motion.div
        whileHover={!isUnavailable ? { scale: 1.02 } : undefined}
        whileTap={!isUnavailable ? { scale: 0.98 } : undefined}
        className={`
          inline-flex items-center rounded-full
          ${getBadgeStyle()}
          ${getSizeClasses()}
          transition-all duration-200
          ${isUnavailable ? 'cursor-not-allowed opacity-75' : ''}
          ${className}
        `}
      >
        {badgeContent}
      </motion.div>
    );
  }

  return (
    <div className={`
      inline-flex items-center rounded-full
      ${getBadgeStyle()}
      ${getSizeClasses()}
      ${isUnavailable ? 'opacity-75' : ''}
      ${className}
    `}>
      {badgeContent}
    </div>
  );
} 