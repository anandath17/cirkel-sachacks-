import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ProjectJoinRequest } from '@/types/project';
import { 
  IoTrashOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
  IoChatbubbleOutline,
  IoFilterOutline,
  IoNotificationsOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline
} from 'react-icons/io5';

interface JoinRequestUpdate {
  id: string;
  projectId: string;
  status: 'accepted' | 'rejected';
  updatedAt: string;
}

interface UserData {
  fullName?: string;
  avatar?: string;
  profileImage?: string;
  photoURL?: string;
}

function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: 'primary' | 'gray' | 'green' | 'red' }) {
  const colors = {
    primary: 'bg-gray-50 text-gray-600',
    gray: 'bg-gray-50 text-gray-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${colors[color]}`}>
      {children}
    </span>
  );
}

// Format time ago function
function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const timeStamp = new Date(date);
  const secondsAgo = Math.floor((now.getTime() - timeStamp.getTime()) / 1000);
  const minutesAgo = Math.floor(secondsAgo / 60);
  const hoursAgo = Math.floor(minutesAgo / 60);
  const daysAgo = Math.floor(hoursAgo / 24);

  if (secondsAgo < 30) {
    return 'Just now';
  } else if (secondsAgo < 60) {
    return `${secondsAgo} seconds ago`;
  } else if (minutesAgo < 60) {
    return `${minutesAgo} ${minutesAgo === 1 ? 'minute' : 'minutes'} ago`;
  } else if (hoursAgo < 24) {
    return `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
  } else if (daysAgo < 7) {
    return `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
  } else {
    return timeStamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

// Define notification types
type NotificationType = {
  type: 'chat' | 'join_request' | 'update';
  data: {
    count: number;
  } | ProjectJoinRequest | JoinRequestUpdate;
  time: number;
  read: boolean;
};

// Type guard functions
function isChatNotification(notification: NotificationType): notification is NotificationType & { type: 'chat'; data: { count: number } } {
  return notification.type === 'chat';
}

function isJoinRequestNotification(notification: NotificationType): notification is NotificationType & { type: 'join_request'; data: ProjectJoinRequest } {
  return notification.type === 'join_request';
}

function isUpdateNotification(notification: NotificationType): notification is NotificationType & { type: 'update'; data: JoinRequestUpdate } {
  return notification.type === 'update';
}

export function Notifications() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [joinRequests, setJoinRequests] = useState<ProjectJoinRequest[]>([]);
  const [unreadChats, setUnreadChats] = useState(0);
  const [myJoinRequestUpdates, setMyJoinRequestUpdates] = useState<JoinRequestUpdate[]>([]);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [userProfiles, setUserProfiles] = useState<Record<string, UserData>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'requests' | 'updates' | 'messages'>('all');
  const [lastRead, setLastRead] = useState<Date | null>(null);
  const [latestMessageTime, setLatestMessageTime] = useState<number>(0);

  // Calculate total notifications (mencakup semua jenis notifikasi)
  const totalNotifications = joinRequests.length + myJoinRequestUpdates.length + (unreadChats > 0 ? unreadChats : 0);

  // Subscribe to user's last read timestamp and read notifications
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.lastNotificationRead) {
          setLastRead(new Date(data.lastNotificationRead));
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to unread chats
  useEffect(() => {
    if (!user) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      let totalUnread = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.unreadCount && data.unreadCount[user.uid]) {
          totalUnread += data.unreadCount[user.uid];
        }
      });
      console.log('Notifications - Total unread messages:', totalUnread);
      setUnreadChats(totalUnread);
    });

    return () => unsubscribe();
  }, [user]);

  // Fungsi untuk mengambil data profil pengguna
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfiles(prev => ({
          ...prev,
          [userId]: userDoc.data() as UserData
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Fungsi untuk menghapus notifikasi join request
  const handleDeleteJoinRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'joinRequests', requestId));
      setJoinRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error deleting join request:', error);
    }
  };

  // Fungsi untuk menghapus notifikasi update
  const handleDeleteUpdate = async (updateId: string) => {
    try {
      await deleteDoc(doc(db, 'joinRequests', updateId));
      setMyJoinRequestUpdates(prev => prev.filter(update => update.id !== updateId));
    } catch (error) {
      console.error('Error deleting update:', error);
    }
  };

  // Subscribe to my join request updates
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'joinRequests'),
      where('userId', '==', user.uid),
      where('status', 'in', ['accepted', 'rejected'])
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const updates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'update',
        time: new Date(doc.data().updatedAt).getTime(),
        read: false
      })) as JoinRequestUpdate[];

      setMyJoinRequestUpdates(updates);

      // Fetch project names
      const projectIds = updates.map(u => u.projectId);
      const uniqueProjectIds = [...new Set(projectIds)];
      
      const names: Record<string, string> = {};
      await Promise.all(
        uniqueProjectIds.map(async (projectId) => {
          try {
            const projectDoc = await getDoc(doc(db, 'projects', projectId));
            if (projectDoc.exists()) {
              names[projectId] = projectDoc.data().title;
            }
          } catch (error) {
            console.error('Error fetching project name:', error);
          }
        })
      );
      
      setProjectNames(prev => ({ ...prev, ...names }));
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to join requests
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'joinRequests'),
      where('projectOwnerId', '==', user.uid),
      where('status', 'in', ['pending', 'read']),
      orderBy('createdAt', 'desc')  // Sort by createdAt in descending order
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        read: doc.data().status === 'read'
      })) as ProjectJoinRequest[];

      setJoinRequests(requests);

      // Fetch project names for requests
      const projectIds = requests.map(r => r.projectId);
      const uniqueProjectIds = [...new Set(projectIds)];
      
      const names: Record<string, string> = {};
      await Promise.all(
        uniqueProjectIds.map(async (projectId) => {
          try {
            const projectDoc = await getDoc(doc(db, 'projects', projectId));
            if (projectDoc.exists()) {
              names[projectId] = projectDoc.data().title;
            }
          } catch (error) {
            console.error('Error fetching project name:', error);
          }
        })
      );
      
      setProjectNames(prev => ({ ...prev, ...names }));
    });

    return () => unsubscribe();
  }, [user]);

  // Get all notifications function
  const getAllNotifications = () => {
    const allNotifications = [
      // Join requests
      ...joinRequests.map(req => ({
        type: 'join_request' as const,
        data: req,
        time: new Date(req.createdAt).getTime(),
        read: false
      })),
      // Updates (accepted/rejected requests)
      ...myJoinRequestUpdates.map(update => ({
        type: 'update' as const,
        data: update,
        time: new Date(update.updatedAt).getTime(),
        read: false
      })),
      // Chat notifications
      ...(unreadChats > 0 ? [{
        type: 'chat' as const,
        data: { count: unreadChats },
        time: latestMessageTime || Date.now(),
        read: false
      }] : [])
    ];

    // Sort by time, newest first
    return allNotifications.sort((a, b) => b.time - a.time);
  };

  // Filter notifications based on read status
  const notifications = getAllNotifications();
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  // Check if notification should be shown based on filter
  const shouldShowNotification = (notification: NotificationType, filter: typeof activeFilter) => {
    console.log('Checking notification:', { type: notification.type, filter });
    
    switch (filter) {
      case 'all':
        return true;
      case 'requests':
        return notification.type === 'join_request';
      case 'updates':
        return notification.type === 'update';
      case 'messages':
        return notification.type === 'chat';
      default:
        return false;
    }
  };

  // Calculate total unread notifications
  const totalUnread = unreadNotifications.length;

  // Fungsi untuk menghapus notifikasi
  const handleDeleteNotification = async (notification: NotificationType) => {
    if (!user) return;

    try {
      if (notification.type === 'join_request') {
        await deleteDoc(doc(db, 'joinRequests', notification.data.id));
      } else if (notification.type === 'update') {
        await deleteDoc(doc(db, 'joinRequests', notification.data.id));
      } else if (notification.type === 'chat') {
        const currentTime = new Date();
        const userDocRef = doc(db, 'users', user.uid);
        
        // Update all chats to mark as read
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participantIds', 'array-contains', user.uid)
        );
        
        const chatsSnapshot = await getDocs(chatsQuery);
        const updatePromises = chatsSnapshot.docs.map(chatDoc => {
          const chatData = chatDoc.data();
          if (chatData.unreadCount?.[user.uid]) {
            return updateDoc(doc(db, 'chats', chatDoc.id), {
              [`unreadCount.${user.uid}`]: 0,
              lastRead: currentTime
            });
          }
          return Promise.resolve();
        });

        // Update user's last read time
        await Promise.all([
          ...updatePromises,
          updateDoc(userDocRef, {
            lastChatRead: currentTime,
            unreadChats: 0
          })
        ]);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
              {totalUnread > 0 && (
                <Badge color="primary">
                  {totalUnread} new
                </Badge>
              )}
            </div>
          </div>
          <p className="text-gray-500">Stay updated with your project activities</p>
        </div>

        {/* Notifications List */}
        <Card className="border border-gray-100 overflow-hidden rounded-lg">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                {totalNotifications > 0 && (
                  <Badge color="primary">
                    {totalNotifications} new
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {['all', 'requests', 'updates', 'messages'].map(filter => (
                    <Button
                      key={filter}
                      variant={activeFilter === filter ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(filter)}
                      className="text-sm"
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Unread Notifications Section */}
            {unreadNotifications.length > 0 && (
              <>
                <div className="bg-gray-50/50 px-4 py-2">
                  <h3 className="text-sm font-medium text-gray-900">New</h3>
                </div>
                {unreadNotifications
                  .filter(notification => shouldShowNotification(notification, activeFilter))
                  .map((notification) => (
                    <NotificationItem 
                      key={`${notification.type}-${notification.time}`}
                      notification={notification} 
                      projectNames={projectNames}
                      onDelete={handleDeleteNotification}
                      latestMessageTime={latestMessageTime}
                    />
                  ))}
              </>
            )}

            {/* Read Notifications Section */}
            {readNotifications.length > 0 && (
              <>
                <div className="bg-gray-50/50 px-4 py-2">
                  <h3 className="text-sm font-medium text-gray-500">Already Read</h3>
                </div>
                {readNotifications
                  .filter(notification => shouldShowNotification(notification, activeFilter))
                  .map((notification) => (
                    <NotificationItem 
                      key={`${notification.type}-${notification.time}`}
                      notification={notification}
                      projectNames={projectNames}
                      onDelete={handleDeleteNotification}
                      latestMessageTime={latestMessageTime}
                    />
                  ))}
              </>
            )}

            {/* Empty State */}
            {(!notifications.length || 
              !notifications.some(n => shouldShowNotification(n, activeFilter))) && (
              <div className="p-8">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <IoNotificationsOutline className="w-7 h-7 text-gray-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">All caught up!</h3>
                  <p className="text-sm text-gray-500">
                    {activeFilter === 'all' 
                      ? 'No notifications at the moment'
                      : `No ${activeFilter} notifications`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// NotificationItem component
interface NotificationItemProps {
  notification: NotificationType;
  projectNames: Record<string, string>;
  onDelete: (notification: NotificationType) => Promise<void>;
  latestMessageTime: number;
}

function NotificationItem({ notification, projectNames, onDelete, latestMessageTime }: NotificationItemProps) {
  const navigate = useNavigate();

  if (isJoinRequestNotification(notification)) {
    const request = notification.data;
    return (
      <div className="p-4 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            {request.user.avatar ? (
              <img 
                src={request.user.avatar}
                alt={request.user.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-base font-medium text-gray-600">
                  {request.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{request.user.name}</span> requested to join{' '}
                  <span className="font-medium">{projectNames[request.projectId] || 'Loading...'}</span>
                  {request.role && (
                    <>
                      {' '}as{' '}
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-50 text-gray-600">
                        {request.role.title}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(request.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/app/projects/${request.projectId}`)}
                  className="text-xs sm:text-sm shrink-0"
                >
                  View Request
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <IoTrashOutline className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isUpdateNotification(notification)) {
    const update = notification.data;
    return (
      <div className="p-4 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border-2 border-white shadow-sm">
            {update.status === 'accepted' ? (
              <IoCheckmarkCircleOutline className="w-4 h-4 text-green-600" />
            ) : (
              <IoCloseCircleOutline className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-900">
                  Your request to join <span className="font-medium">{projectNames[update.projectId] || 'Loading...'}</span> was{' '}
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    update.status === 'accepted' 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {update.status}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(update.updatedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/app/projects/${update.projectId}`)}
                  className="text-xs sm:text-sm shrink-0"
                >
                  View Project
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <IoTrashOutline className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isChatNotification(notification)) {
    return (
      <div className="p-4 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
            <IoChatbubbleOutline className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{notification.data.count}</span> unread messages in your inbox
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {latestMessageTime > 0 ? formatTimeAgo(new Date(latestMessageTime)) : 'Just now'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/app/chat')}
                className="text-xs sm:text-sm shrink-0"
              >
                View Messages
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 