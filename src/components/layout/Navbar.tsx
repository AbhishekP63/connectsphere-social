import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Home, MessageCircle, Bell, User, LogOut, Moon, Sun, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface NavbarProps {
  currentPage: 'feed' | 'profile' | 'messages' | 'friends';
  onNavigate: (page: 'feed' | 'profile' | 'messages' | 'friends') => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!profile) return;

    async function loadUnreadCounts() {
      const [notificationsResult, messagesResult] = await Promise.all([
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile!.id)
          .eq('is_read', false),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', profile!.id)
          .eq('is_read', false),
      ]);

      setUnreadNotifications(notificationsResult.count || 0);
      setUnreadMessages(messagesResult.count || 0);
    }

    loadUnreadCounts();

    const notificationsSub = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => loadUnreadCounts()
      )
      .subscribe();

    const messagesSub = supabase
      .channel('messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${profile.id}`,
        },
        () => loadUnreadCounts()
      )
      .subscribe();

    return () => {
      notificationsSub.unsubscribe();
      messagesSub.unsubscribe();
    };
  }, [profile]);

  return (
    <nav className="card sticky top-0 z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">ConnectSphere</h1>
          </div>

          <div className="flex items-center space-x-6 relative">
            <button
              onClick={() => onNavigate('feed')}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 'feed'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Feed"
            >
              <Home className="w-6 h-6" />
            </button>

            <button
              onClick={() => onNavigate('friends')}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 'friends'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Friends"
            >
              <Users className="w-6 h-6" />
            </button>

            <button
              onClick={() => onNavigate('messages')}
              className={`p-2 rounded-lg transition-colors relative ${
                currentPage === 'messages'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Messages"
            >
              <MessageCircle className="w-6 h-6" />
              {unreadMessages > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>

         <button
  onClick={() => setShowNotifications(!showNotifications)}
  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
  title="Notifications"
>
              <Bell className="w-6 h-6" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
  <div className="absolute right-0 top-16 w-80 card shadow-lg z-50 p-4">
    <h3 className="font-bold text-lg mb-3">Notifications</h3>
    {unreadNotifications === 0 ? (
      <p className="text-gray-500 text-sm">No new notifications</p>
    ) : (
      <p className="text-gray-500 text-sm">{unreadNotifications} unread notifications</p>
    )}
  </div>
)}

            <button
              onClick={() => onNavigate('profile')}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 'profile'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Profile"
            >
              {profile?.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt="Profile"
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>

            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
