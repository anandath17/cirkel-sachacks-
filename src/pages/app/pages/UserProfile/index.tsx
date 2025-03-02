import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { isUserVisibleForHackathon } from '../../../../utils/utilsHelper';

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
          
          // Create user object
          const userObj = { 
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
          } as User;

          // Check if user should be visible
          if (!isUserVisibleForHackathon(userObj) && userObj.id !== currentUser?.id) {
            navigate('/404');
            return;
          }

          // Fetch follow stats
          const stats = await getFollowStats(userId);
          setFollowStats(stats);
          
          setUser(userObj);

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

          // Update projects with owner data and filter by date
          const projectsWithOwners = allProjects
            .map(project => ({
              ...project,
              owner: ownersMap.get(project.owner.id) || project.owner
            }))
            .filter(project => isUserVisibleForHackathon(project));

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
  }, [userId, currentUser?.id, navigate]);

  // ... rest of the component code ...
} 