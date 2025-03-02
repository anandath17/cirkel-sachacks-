import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { CountryDisplay } from '../../../../components/auth/registration/inputs/CountryDisplay';
import { createChat } from '../../../../services/chatService';
import { motion } from 'framer-motion';
import type { User } from '../../../../types/user';
import type { Project } from '../../../../types/project';
import { ProfileBadge } from '../../../../components/profile/ProfileBadge';
import { FollowButton } from '../../../../components/profile/FollowButton';
import { FollowStats } from '../../../../components/profile/FollowStats';
import { getFollowStats } from '../../../../services/followerService';

export function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });

  const { userProfile: currentUser } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if user joined after March 1st, 2025
          if (new Date(userData.joinedAt || userData.createdAt) < new Date('2025-03-01')) {
            navigate('/404'); // Redirect to 404 if user is not visible
            return;
          }

          // Fetch follow stats
          const stats = await getFollowStats(userId);
          setFollowStats(stats);

          setUser({ 
            id: userDoc.id,
            fullName: userData.fullName,
            professionalTitle: userData.professionalTitle,
            bio: userData.bio,
            avatar: userData.avatar || userData.profileImage,
            banner: userData.banner,
            skills: userData.skills || [],
            availability: userData.availability || 'available',
            location: userData.location || userData.country,
            experienceLevel: userData.experienceLevel,
            yearsOfExperience: userData.yearsOfExperience,
            languages: userData.languages || [],
            collaborationStyles: userData.collaborationStyles || userData.collaborationPreferences || [],
            weeklyAvailability: userData.weeklyAvailability,
            socialLinks: userData.socialLinks || {},
            stats: {
              projectsCount: ownedProjects.length + joinedProjects.length,
              followersCount: stats.followers,
              followingCount: stats.following
            },
            joinedAt: userData.joinedAt || userData.createdAt,
            badges: userData.badges || [],
            displayedBadges: userData.displayedBadges || [],
            isPremium: userData.isPremium || false
          } as User);

          // Fetch all projects
          const projectsSnapshot = await getDocs(collection(db, 'projects'));
          const allProjects = projectsSnapshot.docs.map(doc => {
            const data = doc.data();
            const owner = data.owner || {};
            
            return {
              id: doc.id,
              ...data,
              owner: {
                id: owner.id,
                name: owner.fullName || owner.name || '',
                avatar: owner.avatar || owner.profileImage || null
              }
            };
          }) as Project[];

          // Get unique owner IDs
          const ownerIds = [...new Set(allProjects.map(p => p.owner.id))];
          
          // Fetch all owners data in parallel
          const ownersData = await Promise.all(
            ownerIds.map(id => getDoc(doc(db, 'users', id)))
          );
          
          // Create owners map
          const ownersMap = new Map(
            ownersData
              .filter(doc => doc.exists())
              .map(doc => {
                const data = doc.data();
                return [
                  doc.id, 
                  {
                    id: doc.id,
                    name: data.fullName,
                    avatar: data.avatar || data.profileImage
                  }
                ];
              })
          );

          // Update projects with owner data
          const projectsWithOwners = allProjects.map(project => ({
            ...project,
            owner: ownersMap.get(project.owner.id) || project.owner
          }));

          // Separate owned and joined projects
          const owned = projectsWithOwners.filter(project => project.owner.id === userId);
          const joined = projectsWithOwners.filter(project => 
            project.owner.id !== userId && 
            project.members?.some(member => member.id === userId)
          );

          setOwnedProjects(owned);
          setJoinedProjects(joined);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleMessage = async () => {
    if (!currentUser || !user) return;

    try {
      // Create or get existing chat
      const chat = await createChat([
        {
          id: currentUser.id,
          name: currentUser.fullName,
          avatar: currentUser.avatar
        },
        {
          id: user.id,
          name: user.fullName,
          avatar: user.avatar
        }
      ]);

      // Navigate to chat page with chat ID
      navigate(`/app/chat/${chat.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      // TODO: Show error notification
    }
  };

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-8 py-8"
      >
        <Card className="overflow-hidden bg-white border border-gray-200">
          <div className="animate-pulse">
            {/* Banner placeholder */}
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="px-10 py-10">
              <div className="flex items-start gap-8">
                <div className="w-32 h-32 bg-gray-200 rounded-full -mt-20" />
                <div className="flex-1">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-8 py-8"
      >
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">😢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">User not found</h3>
          <p className="text-gray-600">
            The user you're looking for doesn't exist or has been removed
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-8 py-8"
    >
      <Card className="overflow-hidden bg-white border border-gray-200">
        {/* Header with banner and gradient overlay */}
        <div className="relative p-6">
          {/* Banner Image */}
          <div className="relative h-48 rounded-xl bg-gray-50 border border-gray-100">
            {user.banner ? (
              <img
                src={user.banner}
                alt="Profile Banner"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 rounded-xl">
                <svg
                  className="w-16 h-16 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-400">No banner image</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/10 rounded-xl" />
          </div>

          {/* Profile Info Section */}
          <div className="relative px-6 sm:px-8">
            {/* Action Buttons */}
            <div className="absolute top-6 right-6 sm:right-8 flex items-center gap-3 z-10">
              {currentUser && currentUser.id !== userId && (
                <>
                  <FollowButton
                    currentUserId={currentUser.id}
                    targetUserId={userId || ''}
                    size="md"
                    className="shadow-sm hover:shadow-md transition-shadow"
                    onFollowChange={(isFollowing) => {
                      setFollowStats(prev => ({
                        ...prev,
                        followers: prev.followers + (isFollowing ? 1 : -1)
                      }));
                    }}
                  />
                  <Button
                    variant="primary"
                    onClick={handleMessage}
                    className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Message
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-col gap-6">
              {/* Profile Picture */}
              <div className="relative -mt-12 sm:-mt-16">
                <div className="w-24 h-24 sm:w-32 sm:h-32">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-full h-full rounded-full object-cover ring-4 ring-white shadow-md"
                    />
                  ) : (
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center text-2xl sm:text-3xl ring-4 ring-white shadow-md"
                      style={{ backgroundColor: '#f3f4f6' }}
                    >
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="max-w-2xl w-full">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {user.fullName}
                  </h1>
                  {user.badges && user.badges.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {user.badges
                        .filter(badge => 
                          user.displayedBadges?.includes(badge.id) && 
                          !badge.isLocked && 
                          !(badge.id === 'premium' && !user.isPremium)
                        )
                        .map(badge => (
                          <ProfileBadge 
                            key={badge.id} 
                            badge={badge} 
                            size="md"
                            userIsPremium={user.isPremium}
                          />
                        ))}
                    </div>
                  )}
                </div>
                <p className="text-lg text-gray-600 mb-3">{user.professionalTitle}</p>
                {user.bio && (
                  <p className="text-sm text-gray-500 mb-4">
                    {user.bio}
                  </p>
                )}

                {/* Location and Stats Container */}
                <div className="flex items-center">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {user.location && (
                      <span className="inline-flex items-center">
                        <CountryDisplay country={user.location} />
                      </span>
                    )}
                    {user.experienceLevel && (
                      <span className="inline-flex items-center">
                        {user.experienceLevel}
                      </span>
                    )}
                    {user.yearsOfExperience && (
                      <span className="inline-flex items-center">
                        {user.yearsOfExperience} years of experience
                      </span>
                    )}
                  </div>
                  {currentUser && userId && (
                    <div className="absolute right-6 sm:right-8 top-32 sm:top-36">
                      <FollowStats
                        userId={userId}
                        currentUserId={currentUser.id}
                        key={`${followStats.followers}-${followStats.following}`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-10 py-12 space-y-12">
          {/* Skills & Preferences */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-6">Skills & preferences</h3>
            <Card className="p-8 space-y-8 border border-gray-200">
              {user.skills && user.skills.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user.languages && user.languages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {user.languages.map((lang: string) => (
                      <span
                        key={lang}
                        className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-sm font-medium"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user.collaborationStyles && user.collaborationStyles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Collaboration style</label>
                  <div className="flex flex-wrap gap-2">
                    {user.collaborationStyles.map((style: string) => (
                      <span
                        key={style}
                        className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-sm font-medium"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-6">Additional information</h3>
            <Card className="p-8 border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {user.weeklyAvailability && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weekly availability</label>
                    <div className="text-sm sm:text-base text-gray-600">{user.weeklyAvailability} hours/week</div>
                  </div>
                )}

                {user.joinedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Member since</label>
                    <div className="text-sm sm:text-base text-gray-600">
                      {new Date(user.joinedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Portfolio Projects */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-sm font-medium text-gray-700">Portfolio projects</h3>
            </div>

            <Card className="divide-y divide-gray-200 border border-gray-200">
              {/* Projects Stats */}
              <div className="px-6 sm:px-8 py-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total projects</p>
                    <p className="text-2xl font-semibold text-gray-900">{ownedProjects.length + joinedProjects.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created</p>
                    <p className="text-2xl font-semibold text-gray-900">{ownedProjects.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Joined</p>
                    <p className="text-2xl font-semibold text-gray-900">{joinedProjects.length}</p>
                  </div>
                </div>
              </div>

              {/* Projects List */}
              <div className="px-6 sm:px-8 py-6">
                {ownedProjects.length > 0 || joinedProjects.length > 0 ? (
                  <div className="space-y-8">
                    {/* Created Projects */}
                    {ownedProjects.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Projects created</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {ownedProjects.map((project) => (
                            <Card 
                              key={project.id}
                              className="group border border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
                              onClick={() => navigate(`/app/projects/${project.id}`)}
                            >
                              <div className="p-4 sm:p-6 flex flex-col h-full">
                                {/* Project Metadata */}
                                <div className="flex flex-wrap items-center gap-2 mb-6">
                                  {/* Status Chip */}
                                  {project.status === 'open' && (
                                    <span className="inline-flex items-center px-2.5 py-1 bg-green-50 border border-green-100 text-green-600 rounded-full text-xs font-medium">
                                      Open for Contributors
                                    </span>
                                  )}
                                  {/* Category Chip */}
                                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-xs font-medium capitalize">
                                    {project.category}
                                  </span>
                                  {/* Phase Chip */}
                                  <span className="inline-flex items-center px-2.5 py-1 bg-purple-50 border border-purple-100 text-purple-600 rounded-full text-xs font-medium capitalize">
                                    {project.phase}
                                  </span>
                                </div>

                                {/* Main Content */}
                                <div className="flex gap-5 mb-6">
                                  {/* Project Image */}
                                  <div className="shrink-0">
                                    {project.coverImage ? (
                                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 ring-2 ring-gray-100">
                                        <img
                                          src={project.coverImage}
                                          alt={project.title}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-gray-100 flex items-center justify-center">
                                        <span className="text-3xl">🎯</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Project Info */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2 truncate group-hover:text-primary-600 transition-colors">
                                      {project.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                      {project.shortDescription || project.description}
                                    </p>
                                  </div>
                                </div>

                                {/* Skills Section */}
                                {project.skills && project.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-6">
                                    {project.skills.slice(0, 5).map((skill) => (
                                      <span
                                        key={skill}
                                        className="inline-flex items-center px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-full text-xs font-medium"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {project.skills.length > 5 && (
                                      <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-400 rounded-full text-xs font-medium">
                                        +{project.skills.length - 5}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Owner Info */}
                                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {project.owner?.avatar ? (
                                      <img
                                        src={project.owner.avatar}
                                        alt={project.owner.name}
                                        className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0 ring-2 ring-gray-100">
                                        <span className="text-xs font-medium text-primary-700">
                                          {(project.owner?.name || '').charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <span className="text-sm font-medium text-gray-700 truncate">{project.owner?.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span className="font-medium">{project.members?.length || 0} members</span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Joined Projects */}
                    {joinedProjects.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Projects joined</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {joinedProjects.map((project) => (
                            <Card 
                              key={project.id}
                              className="group border border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
                              onClick={() => navigate(`/app/projects/${project.id}`)}
                            >
                              <div className="p-4 sm:p-6 flex flex-col h-full">
                                {/* Project Metadata */}
                                <div className="flex flex-wrap items-center gap-2 mb-6">
                                  {/* Status Chip */}
                                  {project.status === 'open' && (
                                    <span className="inline-flex items-center px-2.5 py-1 bg-green-50 border border-green-100 text-green-600 rounded-full text-xs font-medium">
                                      Open for Contributors
                                    </span>
                                  )}
                                  {/* Category Chip */}
                                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-xs font-medium capitalize">
                                    {project.category}
                                  </span>
                                  {/* Phase Chip */}
                                  <span className="inline-flex items-center px-2.5 py-1 bg-purple-50 border border-purple-100 text-purple-600 rounded-full text-xs font-medium capitalize">
                                    {project.phase}
                                  </span>
                                </div>

                                {/* Main Content */}
                                <div className="flex gap-5 mb-6">
                                  {/* Project Image */}
                                  <div className="shrink-0">
                                    {project.coverImage ? (
                                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 ring-2 ring-gray-100">
                                        <img
                                          src={project.coverImage}
                                          alt={project.title}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-gray-100 flex items-center justify-center">
                                        <span className="text-3xl">🎯</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Project Info */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2 truncate group-hover:text-primary-600 transition-colors">
                                      {project.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                      {project.shortDescription || project.description}
                                    </p>
                                  </div>
                                </div>

                                {/* Skills Section */}
                                {project.skills && project.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-6">
                                    {project.skills.slice(0, 5).map((skill) => (
                                      <span
                                        key={skill}
                                        className="inline-flex items-center px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-600 rounded-full text-xs font-medium"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {project.skills.length > 5 && (
                                      <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-400 rounded-full text-xs font-medium">
                                        +{project.skills.length - 5}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Owner Info */}
                                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {project.owner?.avatar ? (
                                      <img
                                        src={project.owner.avatar}
                                        alt={project.owner.name}
                                        className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0 ring-2 ring-gray-100">
                                        <span className="text-xs font-medium text-primary-700">
                                          {(project.owner?.name || '').charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <span className="text-sm font-medium text-gray-700 truncate">{project.owner?.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span className="font-medium">{project.members?.length || 0} members</span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No projects yet</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </motion.div>
  );
} 