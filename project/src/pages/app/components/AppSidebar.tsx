import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  IoGridOutline,
  IoCompassOutline,
  IoFolderOutline,
  IoChatbubbleOutline,
  IoSettingsOutline,
  IoChevronDownOutline,
  IoLogOutOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoCalendarOutline
} from 'react-icons/io5';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export function AppSidebar() {
  const { currentUser, userProfile, logout } = useAuth();
  const [unreadChats, setUnreadChats] = useState(0);
  const [joinRequests, setJoinRequests] = useState(0);
  const [requestUpdates, setRequestUpdates] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastRead, setLastRead] = useState<Date | null>(null);

  // Subscribe to user's last read timestamp
  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.lastNotificationRead) {
          setLastRead(new Date(data.lastNotificationRead));
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to join requests
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'joinRequests'),
      where('projectOwnerId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setJoinRequests(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to request updates
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'joinRequests'),
      where('userId', '==', currentUser.uid),
      where('status', 'in', ['accepted', 'rejected'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Count all updates regardless of lastRead timestamp
      setRequestUpdates(snapshot.docs.length);
      
      console.log('Request updates count:', snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to unread chats
  useEffect(() => {
    if (!currentUser) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      let totalUnread = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.unreadCount && data.unreadCount[currentUser.uid]) {
          totalUnread += data.unreadCount[currentUser.uid];
        }
      });
      setUnreadCount(totalUnread);
      console.log('Unread chat count:', totalUnread);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Calculate total notifications for the notification badge
  const totalNotifications = joinRequests + requestUpdates + unreadCount;
  console.log('Total notifications:', { joinRequests, requestUpdates, unreadCount, total: totalNotifications });

  const navigation = [
    { name: 'Dashboard', href: '/app', icon: IoGridOutline },
    { name: 'Explore', href: '/app/explore', icon: IoCompassOutline },
    { name: 'My Projects', href: '/app/projects', icon: IoFolderOutline },
    { 
      name: 'Messages', 
      href: '/app/chat', 
      icon: IoChatbubbleOutline,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { 
      name: 'Events', 
      href: '/app/events', 
      icon: IoCalendarOutline
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sidebarContent = (
    <nav className="py-5 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 mb-2">
        <div className="flex items-center">
          <div className="flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="Cirkel Logo" 
              className="w-24 h-24"
            />
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="px-6 mb-3">
        <div className="h-[1px] bg-gray-100/80" />
      </div>

      {/* Main Navigation */}
      <div className="px-3 space-y-0.5">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => `
              relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isActive 
                ? 'text-gray-900 bg-gray-50/80' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/60'}
            `}
          >
            <item.icon className="w-[18px] h-[18px] opacity-80" />
            <span>{item.name}</span>
            {item.badge && (
              <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center">
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-50 text-[11px] font-medium text-red-600">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Profile Section */}
      <div className="mt-auto pt-5">
        <div className="px-3">
          <NavLink
            to="/app/profile"
            className={({ isActive }) => `
              relative flex items-center gap-3 p-2 rounded-lg mb-2
              ${isActive 
                ? 'bg-gray-50/80' 
                : 'hover:bg-gray-50/60'}
            `}
          >
            {/* Avatar with Online Status */}
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden ring-2 ring-white">
                {(userProfile?.avatar || userProfile?.profileImage || currentUser?.photoURL) ? (
                  <img 
                    src={userProfile?.avatar || userProfile?.profileImage || currentUser?.photoURL}
                    alt={userProfile?.fullName || currentUser?.displayName || 'User'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.fullName || currentUser?.displayName || 'User')}&background=f3f4f6&color=4b5563`;
                    }}
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-600"
                    style={{ backgroundColor: userProfile?.profileColor || '#f3f4f6' }}
                  >
                    {userProfile?.profileEmoji || (userProfile?.fullName || currentUser?.displayName || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.fullName || currentUser?.displayName || 'User'}
                </p>
              </div>
              <p className="text-[11px] text-gray-500 truncate">
                {userProfile?.professionalTitle || 'Member'}
              </p>
            </div>
          </NavLink>

          {/* Quick Actions */}
          <div className="px-1 mb-2">
            <NavLink
              to="/app/notifications"
              className={({ isActive }) => `
                relative flex items-center gap-3 px-2 py-1.5 rounded-md text-[13px] font-medium 
                ${isActive 
                  ? 'text-gray-900 bg-gray-50/80' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/60'} 
                transition-colors
              `}
            >
              <IoNotificationsOutline className="w-[18px] h-[18px] opacity-80" />
              <span>Notifications</span>
              {totalNotifications > 0 && (
                <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-50 text-[11px] font-medium text-red-600">
                  {totalNotifications > 99 ? '99+' : totalNotifications}
                </span>
              )}
            </NavLink>
          </div>

          {/* Premium Button - Only show if user is not premium */}
          {(!userProfile?.isPremium) && (
            <div className="px-1 mb-2">
              <NavLink
                to="/app/premium"
                className="flex items-center gap-3 px-2 py-2 rounded-md text-[13px] font-medium text-[#D72BE4] bg-[#FAE8FD] hover:bg-[#F5D5FA] transition-colors"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L3 9L12 16L21 9L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 14L12 21L21 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-semibold">Upgrade to Premium</span>
              </NavLink>
            </div>
          )}

          {/* Settings & Help */}
          <div className="px-1 pt-1 border-t border-gray-100">
            <NavLink
              to="/app/settings"
              className={({ isActive }) => `
                mt-2 flex items-center gap-3 px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors
                ${isActive 
                  ? 'text-gray-900 bg-gray-50/80' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/60'}
              `}
            >
              <IoSettingsOutline className="w-[18px] h-[18px] opacity-80" />
              <span>Settings</span>
            </NavLink>

            <NavLink
              to="/app/help"
              className="mt-1 flex items-center gap-3 px-2 py-1.5 rounded-md text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50/60 transition-colors"
            >
              <IoHelpCircleOutline className="w-[18px] h-[18px] opacity-80" />
              <span>Help Center</span>
            </NavLink>

            <button
              onClick={handleLogout}
              className="mt-1 w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50/60 transition-colors"
            >
              <IoLogOutOutline className="w-[18px] h-[18px] opacity-80" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  const mobileNavContent = (
    <nav className="h-full px-6 flex justify-between items-center max-w-lg mx-auto">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) => `
            relative flex flex-col items-center gap-1 p-2
            ${isActive 
              ? 'text-gray-900' 
              : 'text-gray-400 hover:text-gray-600'}
          `}
        >
          {({ isActive }) => (
            <motion.div
              className="flex flex-col items-center"
              whileTap={{ scale: 0.95 }}
            >
              <item.icon className="w-[18px] h-[18px] opacity-80" />
              <span className="text-[10px] font-medium mt-1">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute inset-0 bg-gray-50/80 rounded-lg -z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.div>
          )}
        </NavLink>
      ))}
      
      {/* Profile Icon in Mobile */}
      <NavLink
        to="/app/profile"
        className={({ isActive }) => `
          relative flex flex-col items-center gap-1 p-2
          ${isActive 
            ? 'text-gray-900' 
            : 'text-gray-400 hover:text-gray-600'}
        `}
      >
        {({ isActive }) => (
          <motion.div
            className="flex flex-col items-center"
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-[22px] h-[22px] rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL}
                  alt={currentUser?.displayName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-600 text-[10px] font-medium">
                  {(currentUser?.displayName || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium mt-1">Profile</span>
            {isActive && (
              <motion.div
                layoutId="mobile-active"
                className="absolute inset-0 bg-gray-50/80 rounded-lg -z-0"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.div>
        )}
      </NavLink>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:fixed top-0 left-0 w-64 bg-white border-r border-gray-100 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-50">
        {mobileNavContent}
      </div>
    </>
  );
}