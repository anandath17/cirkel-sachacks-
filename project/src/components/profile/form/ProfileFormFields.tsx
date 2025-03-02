import { FormInput } from '../../auth/FormInput';
import { SearchableMultiSelect } from '../../auth/registration/inputs/SearchableMultiSelect';
import { CountrySelect } from '../../auth/registration/inputs/CountrySelect';
import { BioInput } from '../../auth/registration/inputs/BioInput';
import { SKILLS } from '../../auth/registration/data/skills';
import { PROJECT_TYPES } from '../../auth/registration/data/projectTypes';
import { LANGUAGES } from '../../auth/registration/data/languages';
import type { ProfileFormData } from './types';
import { useAuth } from '../../../contexts/AuthContext';
import { ProfileBadge } from '../ProfileBadge';
import type { Badge } from '../../../types/user';
import { motion } from 'framer-motion';
import { Card } from '../../ui/Card';
import { useState, useEffect, useRef } from 'react';
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

interface ProfileFormFieldsProps {
  formData: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
}

export function ProfileFormFields({ formData, onChange }: ProfileFormFieldsProps) {
  const { userProfile } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getBadgeIcon = (badgeId: string) => {
    const iconClass = "w-4 h-4";
    
    switch (badgeId) {
      case 'premium':
        return (
          <div className="relative">
            <RiVipDiamondFill className={`${iconClass} text-purple-500 animate-pulse`} />
            <div className="absolute inset-0 bg-purple-500/20 blur-sm rounded-full animate-ping"></div>
          </div>
        );
      case 'verified':
        return <RiShieldCheckFill className={`${iconClass} text-blue-500`} />;
      case 'early_adopter':
        return (
          <div className="relative">
            <RiStarFill className={`${iconClass} text-amber-500`} />
            <div className="absolute inset-0 bg-amber-400/30 blur-sm rounded-full"></div>
          </div>
        );
      case 'contributor':
        return <RiCheckboxCircleFill className={`${iconClass} text-emerald-500`} />;
      case 'community_builder':
        return <RiTeamFill className={`${iconClass} text-rose-500`} />;
      case 'project_master':
        return <RiTaskFill className={`${iconClass} text-cyan-500`} />;
      case 'networking_pro':
        return <RiNodeTree className={`${iconClass} text-indigo-500`} />;
      case 'bug_hunter':
        return <RiBugFill className={`${iconClass} text-red-500`} />;
      case 'performance_guru':
        return <RiFlashlightFill className={`${iconClass} text-yellow-500`} />;
      case 'top_rated':
        return <RiAwardFill className={`${iconClass} text-orange-500`} />;
      case 'skill_master':
        return <RiMedalFill className={`${iconClass} text-teal-500`} />;
      case 'innovator':
        return <RiLightbulbFlashFill className={`${iconClass} text-pink-500`} />;
      case 'global_collaborator':
        return <RiGlobalFill className={`${iconClass} text-violet-500`} />;
      case 'framework_expert':
        return <RiCodeBoxFill className={`${iconClass} text-blue-600`} />;
      case 'rising_star':
        return <RiUserStarFill className={`${iconClass} text-amber-600`} />;
      default:
        return <RiAwardFill className={`${iconClass} text-gray-400`} />;
    }
  };

  const getBadgeStyle = (badgeId: string, isSelected: boolean = false) => {
    switch (badgeId) {
      case 'premium':
        return `
          bg-gradient-to-r from-[#D72BE4]/5 to-[#D72BE4]/10
          text-[#D72BE4]
          border border-[#D72BE4]/10
          ${isSelected ? 'ring-1 ring-[#D72BE4]/10' : ''}
        `;
      case 'early_adopter':
        return `
          bg-gradient-to-r from-amber-50 to-amber-100/50
          text-amber-700
          border border-amber-100
          ${isSelected ? 'ring-1 ring-amber-100' : ''}
        `;
      case 'contributor':
        return `
          bg-gradient-to-r from-emerald-50 to-emerald-100/50
          text-emerald-700
          border border-emerald-100
          ${isSelected ? 'ring-1 ring-emerald-100' : ''}
        `;
      case 'community_builder':
        return `
          bg-gradient-to-r from-rose-50 to-rose-100/50
          text-rose-700
          border border-rose-100
          ${isSelected ? 'ring-1 ring-rose-100' : ''}
        `;
      case 'project_master':
        return `
          bg-gradient-to-r from-cyan-50 to-cyan-100/50
          text-cyan-700
          border border-cyan-100
          ${isSelected ? 'ring-1 ring-cyan-100' : ''}
        `;
      case 'networking_pro':
        return `
          bg-gradient-to-r from-indigo-50 to-indigo-100/50
          text-indigo-700
          border border-indigo-100
          ${isSelected ? 'ring-1 ring-indigo-100' : ''}
        `;
      default:
        return `
          bg-gray-50
          text-gray-700
          border border-gray-100
          ${isSelected ? 'ring-1 ring-gray-100' : ''}
        `;
    }
  };

  const getBadgeIconStyle = (badgeId: string) => {
    switch (badgeId) {
      case 'premium':
        return `
          bg-gradient-to-r from-[#D72BE4] to-[#D72BE4]/90
          text-white
          border border-[#D72BE4]/20
        `;
      case 'early_adopter':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'contributor':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'community_builder':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
      case 'project_master':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-100';
      case 'networking_pro':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-100';
    }
  };

  console.log('UserProfile in ProfileFormFields:', userProfile); // Debug log
  console.log('Badges:', userProfile?.badges); // Debug log
  console.log('DisplayedBadges:', formData.displayedBadges); // Debug log

  const updateField = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    onChange({ ...formData, [field]: value });
  };

  const handleBadgeToggle = (badgeId: string) => {
    const badge = userProfile?.badges?.find(b => b.id === badgeId);
    if (!badge) return;
    if (badge.isLocked || (badge.id === 'premium' && !userProfile?.isPremium)) return;

    const currentDisplayed = formData.displayedBadges || [];
    let newDisplayed: string[];

    if (currentDisplayed.includes(badgeId)) {
      newDisplayed = currentDisplayed.filter(id => id !== badgeId);
    } else {
      if (currentDisplayed.length < 3) {
        newDisplayed = [...currentDisplayed, badgeId];
      } else {
        return; // Don't add if already 3 badges
      }
    }

    updateField('displayedBadges', newDisplayed);
  };

  // Group badges by locked status
  const defaultGroups = { unlocked: [] as Badge[], locked: [] as Badge[] };
  const groupedBadges = userProfile?.badges?.reduce((acc, badge) => {
    if (badge.isLocked || (badge.id === 'premium' && !userProfile?.isPremium)) {
      acc.locked.push(badge);
    } else {
      acc.unlocked.push(badge);
    }
    return acc;
  }, defaultGroups) || defaultGroups;

  const hasAnyBadges = groupedBadges.unlocked.length > 0 || groupedBadges.locked.length > 0;

  return (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <Card>
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h3 className="text-base font-medium text-gray-900">Basic Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your primary profile information visible to other users
          </p>
        </div>

        <div className="p-6 space-y-6">
      <FormInput
        type="text"
        label="Full Name"
        value={formData.fullName}
        onChange={(value) => updateField('fullName', value)}
            placeholder="Enter your full name"
      />

      <FormInput
        type="text"
        label="Professional Title"
        value={formData.professionalTitle}
        onChange={(value) => updateField('professionalTitle', value)}
        placeholder="e.g. Senior Frontend Developer"
      />

      <BioInput
        value={formData.bio}
        onChange={(value) => updateField('bio', value)}
      />
        </div>
      </Card>

      {/* Skills & Expertise Section */}
      <Card>
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h3 className="text-base font-medium text-gray-900">Skills & Expertise</h3>
          <p className="mt-1 text-sm text-gray-500">
            Showcase your technical skills and language proficiency
          </p>
        </div>

        <div className="p-6 space-y-6">
      <SearchableMultiSelect
        label="Skills"
        options={SKILLS}
        value={formData.skills}
        onChange={(value) => updateField('skills', value)}
        placeholder="Select your skills"
      />

          <SearchableMultiSelect
            label="Languages"
            options={LANGUAGES}
            value={formData.languages}
            onChange={(value) => updateField('languages', value)}
            placeholder="Select languages you know"
          />
        </div>
      </Card>

      {/* Preferences Section */}
      <Card>
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h3 className="text-base font-medium text-gray-900">Preferences</h3>
          <p className="mt-1 text-sm text-gray-500">
            Set your project preferences and availability
          </p>
        </div>

        <div className="p-6 space-y-6">
      <SearchableMultiSelect
        label="Project Preferences"
        options={PROJECT_TYPES}
        value={formData.projectPreferences}
        onChange={(value) => updateField('projectPreferences', value)}
        placeholder="Select project types"
      />

      <CountrySelect
        value={formData.country}
        onChange={(value) => updateField('country', value)}
      />

      <FormInput
        type="number"
            label="Weekly Availability"
        value={formData.weeklyAvailability.toString()}
        onChange={(value) => updateField('weeklyAvailability', parseInt(value) || 0)}
        min="0"
        max="168"
            placeholder="Hours per week"
          />
        </div>
      </Card>

      {/* Badges Section */}
      {hasAnyBadges && (
        <Card>
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h3 className="text-base font-medium text-gray-900">Profile Badges</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose badges to display on your profile
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Display Badges
              </label>
              <span className="text-sm text-gray-500">
                {formData.displayedBadges.length}/3 selected
              </span>
            </div>

            {/* Selected Badges Preview */}
            <div className="flex flex-wrap gap-2 mb-6">
              {formData.displayedBadges.length === 0 ? (
                <span className="text-sm text-gray-500">Select badges to display on your profile</span>
              ) : (
                groupedBadges.unlocked
                  .filter(badge => formData.displayedBadges.includes(badge.id))
                  .map((badge) => (
                    <span
                      key={badge.id}
                      className={`
                        inline-flex items-center gap-2.5
                        h-9 pl-3 pr-4 rounded-full text-sm font-medium
                        transition-all duration-200
                        ${getBadgeStyle(badge.id, true)}
                      `}
                    >
                      <span className={`
                        flex items-center justify-center w-6 h-6 rounded-full
                        border transition-all duration-200
                        ${getBadgeIconStyle(badge.id)}
                      `}>
                        {getBadgeIcon(badge.id)}
                      </span>
                      {badge.title}
                      <span 
                        onClick={() => handleBadgeToggle(badge.id)}
                        className="ml-1 text-lg leading-none opacity-60 hover:opacity-100 cursor-pointer"
                      >
                        ×
                      </span>
                    </span>
                  ))
              )}
            </div>

            <div className="relative">
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search badges..."
                  className="
                    w-full h-10 px-4 pl-10 text-sm
                    border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400
                  "
                />
                <svg 
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>

              {/* Unlocked Badges */}
              {groupedBadges.unlocked.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-medium text-gray-500 mb-3">
                    Available Badges
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {groupedBadges.unlocked
                      .filter(badge => 
                        badge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        badge.description.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((badge) => {
                        const isSelected = formData.displayedBadges?.includes(badge.id);
                        
                        return (
                          <motion.button
                            key={badge.id}
                            type="button"
                            onClick={() => handleBadgeToggle(badge.id)}
                            className={`
                              group relative flex items-center gap-3
                              px-4 py-3 rounded-lg text-sm
                              transition-all duration-200
                              ${getBadgeStyle(badge.id, isSelected)}
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className={`
                              flex items-center justify-center w-8 h-8 rounded-full
                              border transition-all duration-200
                              ${getBadgeIconStyle(badge.id)}
                            `}>
                              {getBadgeIcon(badge.id)}
                            </span>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{badge.title}</div>
                              <div className="text-xs opacity-70 mt-0.5">{badge.description}</div>
                            </div>
                            {isSelected && (
                              <span className="opacity-60 hover:opacity-100">
                                ×
                              </span>
                            )}
                          </motion.button>
                        );
                    })}
                  </div>
                </div>
              )}

              {/* Locked Badges */}
              {groupedBadges.locked.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-3">
                    Locked Badges
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {groupedBadges.locked
                      .filter(badge => 
                        badge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        badge.description.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((badge) => {
                        const badgeIcon = getBadgeIcon(badge.id);
                        const isPremiumBadge = badge.id === 'premium';
                        return (
                          <div
                            key={badge.id}
                            className="
                              group relative flex items-center gap-3
                              px-4 py-3 rounded-lg text-sm
                              bg-gray-50 text-gray-400
                              border border-gray-200
                              cursor-not-allowed
                            "
                          >
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-200">
                              {badgeIcon}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium">{badge.title}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {isPremiumBadge ? 'Requires premium subscription' : badge.description}
                              </div>
                            </div>
                            <svg 
                              className="w-4 h-4 text-gray-400 opacity-60 flex-shrink-0"
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                          </div>
                        );
                    })}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 text-sm text-gray-500">
              {formData.displayedBadges.length === 3 
                ? "You can display up to 3 badges. Remove one to select another."
                : "Select up to 3 badges to display on your profile."}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}