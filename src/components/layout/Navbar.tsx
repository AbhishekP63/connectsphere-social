import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Home, MessageCircle, Bell, User, LogOut, Moon, Sun, Users, Search, X, Heart, MessageSquare, UserPlus, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface NavbarProps {
  currentPage: 'feed' | 'profile' | 'messages' | 'friends';
  onNavigate: (page: 'feed' | 'profile' | 'messages' | 'friends') => void;
}

interface NotificationData {
  id: string;
  type: 'like' | 'comment' | 'friend_request' | 'friend_accept' | 'message';
  is_read: boolean;
  created_at: string;
  actor_id: string;
  actor?: { full_name: string; username: string; profile_picture: string | null };
}

interface SearchResult {
  id: string;
  full_name: string;
  username: string;
  profile_picture: string | null;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    loadUnreadCounts();
    const notifSub = supabase.channel('notifications-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, () => loadUnreadCounts())
      .subscribe();
    const msgSub = supabase.channel('messages-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `recipient_id=eq.${profile.id}` }, () => loadUnreadCounts())
      .subscribe();
    return () => { notifSub.unsubscribe(); msgSub.unsubscribe(); };
  }, [profile]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => searchUsers(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function loadUnreadCounts() {
    if (!profile) return;
    const [n, m] = await Promise.all([
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', profile.id).eq('is_read', false),
    ]);
    setUnreadNotifications(n.count || 0);
    setUnreadMessages(m.count || 0);
  }

  async function loadNotifications() {
    if (!profile) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(15);
    if (!data) return;
    const withActors = await Promise.all(data.map(async (n: NotificationData) => {
      const { data: actor } = await supabase.from('profiles').select('full_name, username, profile_picture').eq('id', n.actor_id).maybeSingle();
      return { ...n, actor };
    }));
    setNotifications(withActors);
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    setUnreadNotifications(0);
  }

  async function searchUsers() {
    if (!profile || !searchQuery.trim()) return;
    const { data } = await supabase.from('profiles').select('id, full_name, username, profile_picture').ilike('full_name', `%${searchQuery}%`).neq('id', profile.id).limit(5);
    if (data) setSearchResults(data);
  }

  function getNotifIcon(type: string) {
    if (type === 'like') return <Heart className="w-4 h-4 text-red-500" />;
    if (type === 'comment') return <MessageSquare className="w-4 h-4 text-blue-500" />;
    if (type === 'friend_request' || type === 'friend_accept') return <UserPlus className="w-4 h-4 text-green-500" />;
    return <MessageCircle className="w-4 h-4 text-purple-500" />;
  }

  function getNotifText(n: NotificationData) {
    const name = n.actor?.full_name || 'Someone';
    if (n.type === 'like') return `${name} liked your post`;
    if (n.type === 'comment') return `${name} commented on your post`;
    if (n.type === 'friend_request') return `${name} sent you a friend request`;
    if (n.type === 'friend_accept') return `${name} accepted your friend request`;
    if (n.type === 'message') return `${name} sent you a message`;
    return 'New notification';
  }

  function formatTime(dateString: string) {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  }

  return (
    <nav className="card sticky top-0 z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-blue-600">ConnectSphere</h1>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-sm mx-6 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-10 left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    {user.profile_picture ? (
                      <img src={user.profile_picture} className="w-9 h-9 rounded-full object-cover" alt={user.full_name} />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{user.full_name}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 relative" ref={notifRef}>
            <button onClick={() => onNavigate('feed')} className={`p-2 rounded-lg transition-colors ${currentPage === 'feed' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} title="Feed">
              <Home className="w-6 h-6" />
            </button>
            <button onClick={() => onNavigate('friends')} className={`p-2 rounded-lg transition-colors ${currentPage === 'friends' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} title="Friends">
              <Users className="w-6 h-6" />
            </button>
            <button onClick={() => onNavigate('messages')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative" title="Messages">
              <MessageCircle className="w-6 h-6" />
              {unreadMessages > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadMessages > 9 ? '9+' : unreadMessages}</span>}
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) loadNotifications(); }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              title="Notifications"
            >
              <Bell className="w-6 h-6" />
              {unreadNotifications > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-lg">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)}><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${!n.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                        <div className="mt-1">{getNotifIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{getNotifText(n)}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTime(n.created_at)}</p>
                        </div>
                        {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <button onClick={() => onNavigate('profile')} className={`p-2 rounded-lg transition-colors ${currentPage === 'profile' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} title="Profile">
              {profile?.profile_picture ? <img src={profile.profile_picture} alt="Profile" className="w-6 h-6 rounded-full object-cover" /> : <User className="w-6 h-6" />}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Toggle theme">
              {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600" title="Sign out">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}