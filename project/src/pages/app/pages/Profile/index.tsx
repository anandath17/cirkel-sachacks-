import { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { ProfileForm } from '../../../../components/profile/ProfileForm';
import { ProfilePictureModal } from '../../../../components/profile/picture/ProfilePictureModal';
import { CountryDisplay } from '../../../../components/auth/registration/inputs/CountryDisplay';
import { useAuth } from '../../../../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import type { User } from '../../../../types/user';
import type { Project } from '../../../../types/project';
import { motion } from 'framer-motion';
import { FiMail, FiGlobe, FiClock, FiBriefcase, FiAward } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { ProfileBadge } from '../../../../components/profile/ProfileBadge';

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPicture, setIsEditingPicture] = useState(false);
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<Project[]>([]);
  const { currentUser: user, userProfile, refreshUserProfile } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.uid) return;

      try {
        console.log('Fetching projects for user:', user.uid);
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
        const owned = projectsWithOwners.filter(project => project.owner.id === user.uid);
        const joined = projectsWithOwners.filter(project => 
          project.owner.id !== user.uid && 
          project.members?.some(member => member.id === user.uid)
        );

        setOwnedProjects(owned);
        setJoinedProjects(joined);
        
        console.log('Projects loaded:', owned.length + joined.length);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [user?.uid]);

  const handleEditSuccess = async () => {
    console.log('Profile edit successful, refreshing data...');
    await refreshUserProfile();
    setIsEditing(false);
  };

  const handlePictureModalClose = () => {
    setIsEditingPicture(false);
  };

  if (!userProfile) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-8 text-center">
          <motion.div 
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="text-4xl mb-4"
          >
            😢
          </motion.div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-600">
            Your profile is not available or has been removed
          </p>
        </Card>
      </div>
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
            {userProfile.banner ? (
              <img
                src={userProfile.banner}
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
            <button
              onClick={() => setIsEditingPicture(true)}
              className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/50 rounded-full text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </div>

          {/* Profile Content */}
          <div className="relative px-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              {/* Left Column: Profile Picture and Info */}
              <div className="flex flex-col items-center sm:items-start">
                {/* Profile Picture */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="relative -mt-12 sm:-mt-16 ml-0 group cursor-pointer" 
                  onClick={() => setIsEditingPicture(true)}
                >
                  <div className="w-24 h-24 sm:w-32 sm:h-32 transition-transform duration-300 ease-in-out">
                    {userProfile.avatar || userProfile.profileImage ? (
                      <img
                        src={userProfile.avatar || userProfile.profileImage}
                        alt={userProfile.fullName}
                        className="w-full h-full rounded-full object-cover ring-4 ring-white border border-gray-200"
                      />
                    ) : (
                      <div 
                        className="w-full h-full rounded-full flex items-center justify-center text-2xl sm:text-3xl ring-4 ring-white border border-gray-200"
                        style={{ backgroundColor: userProfile.profileColor || '#f3f4f6' }}
                      >
                        {userProfile.profileEmoji || userProfile.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Change Photo</span>
                    </div>
                  </div>
                </motion.div>

                {/* User Info */}
                <div className="text-center sm:text-left max-w-3xl mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                      {userProfile.fullName}
                    </h1>
                    {userProfile.badges && userProfile.badges.length > 0 && (
                      <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5">
                        {userProfile.badges
                          .filter(badge => 
                            userProfile.displayedBadges?.includes(badge.id) && 
                            !badge.isLocked && 
                            !(badge.id === 'premium' && !userProfile.isPremium)
                          )
                          .map(badge => (
                            <ProfileBadge 
                              key={badge.id} 
                              badge={badge} 
                              size="md"
                              userIsPremium={userProfile.isPremium}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                  <p className="text-lg text-gray-600 mb-4">{userProfile.professionalTitle}</p>
                  {userProfile.bio && (
                    <p className="text-sm text-gray-500 mb-5">
                      {userProfile.bio}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-sm text-gray-500">
                    {userProfile.country && (
                      <span className="inline-flex items-center">
                        <CountryDisplay country={userProfile.country} />
                      </span>
                    )}
                    {userProfile.experienceLevel && (
                      <span className="inline-flex items-center">
                        {userProfile.experienceLevel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Edit Button */}
              <div className="mt-6 sm:mt-4">
                <Button
                  variant={isEditing ? 'outline' : 'primary'}
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-auto"
                >
                  {isEditing ? 'Back' : 'Edit Profile'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-10 py-12"
          >
            <ProfileForm 
              onCancel={() => setIsEditing(false)}
              onSuccess={handleEditSuccess}
            />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-10 py-12 space-y-12"
          >
            {/* Skills & Preferences */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-6">Skills & preferences</h3>
              <Card className="p-8 space-y-8 border border-gray-200">
                {userProfile.skills && userProfile.skills.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skills.map((skill: string) => (
                        <motion.span
                          key={skill}
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {userProfile.projectPreferences && userProfile.projectPreferences.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Project preferences</label>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.projectPreferences.map((pref: string) => (
                        <motion.span
                          key={pref}
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {pref}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {userProfile.languages && userProfile.languages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Languages</label>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.languages.map((lang: string) => (
                        <motion.span
                          key={lang}
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-sm font-medium"
                        >
                          {lang}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {userProfile.collaborationPreferences && userProfile.collaborationPreferences.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Collaboration style</label>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.collaborationPreferences.map((style: string) => (
                        <motion.span
                          key={style}
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-sm font-medium"
                        >
                          {style}
                        </motion.span>
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
                  {userProfile.weeklyAvailability && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weekly availability</label>
                      <div className="text-sm sm:text-base text-gray-600">{userProfile.weeklyAvailability} hours/week</div>
                    </div>
                  )}

                  {userProfile.createdAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Member since</label>
                      <div className="text-sm sm:text-base text-gray-600">
                        {new Date(userProfile.createdAt).toLocaleDateString('en-US', {
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-gray-700">Portfolio projects</h3>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/app/projects/create'}
                  className="text-sm"
                >
                  Create project
                </Button>
              </div>

              <Card className="divide-y divide-gray-200 border border-gray-200">
                {/* Projects Stats */}
                <div className="px-8 py-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total projects</p>
                      <p className="text-2xl font-semibold text-gray-900">{ownedProjects.length + joinedProjects.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Created</p>
                      <p className="text-2xl font-semibold text-gray-900">{ownedProjects.filter(p => p.owner.id === user?.uid).length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Joined</p>
                      <p className="text-2xl font-semibold text-gray-900">{joinedProjects.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Active</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {ownedProjects.filter(p => p.status === 'active').length + joinedProjects.filter(p => p.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Projects List */}
                <div className="px-8 py-6">
                  {ownedProjects.length > 0 || joinedProjects.length > 0 ? (
                    <div className="space-y-8">
                      {/* Created Projects */}
                      {ownedProjects.filter(p => p.owner.id === user?.uid).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-4">Projects you created</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {ownedProjects
                              .filter(p => p.owner.id === user?.uid)
                              .map((project) => (
                                <Link 
                                  key={project.id}
                                  to={`/app/projects/${project.id}`}
                                >
                                  <Card className="group border border-gray-200 hover:border-gray-300 transition-all h-full">
                                    <div className="p-6 flex flex-col h-full">
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
                                          {project.owner?.avatar || project.owner?.profileImage ? (
                                            <img
                                              src={project.owner.avatar || project.owner.profileImage}
                                              alt={project.owner.name}
                                              className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                                            />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0 ring-2 ring-gray-100">
                                              <span className="text-xs font-medium text-primary-700">
                                                {(project.owner?.name || 'U').charAt(0).toUpperCase()}
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
                                </Link>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Joined Projects */}
                      {joinedProjects.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-4">Projects you joined</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {joinedProjects.map((project) => (
                                <Link 
                                  key={project.id}
                                  to={`/app/projects/${project.id}`}
                                >
                                  <Card className="group border border-gray-200 hover:border-gray-300 transition-all h-full">
                                    <div className="p-6 flex flex-col h-full">
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
                                          {project.owner?.avatar || project.owner?.profileImage ? (
                                            <img
                                              src={project.owner.avatar || project.owner.profileImage}
                                              alt={project.owner.name}
                                              className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
                                            />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0 ring-2 ring-gray-100">
                                              <span className="text-xs font-medium text-primary-700">
                                                {(project.owner?.name || 'U').charAt(0).toUpperCase()}
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
                                </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 mb-4">No projects yet</p>
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = '/app/projects/create'}
                        className="inline-flex items-center"
                      >
                        Create your first project
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </Card>

      {isEditingPicture && (
        <ProfilePictureModal onClose={handlePictureModalClose} />
      )}
    </motion.div>
  );
}