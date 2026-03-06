import { Home, Users, MessageCircle, User } from 'lucide-react';

interface BottomNavProps {
  currentPage: 'feed' | 'profile' | 'messages' | 'friends';
  onNavigate: (page: 'feed' | 'profile' | 'messages' | 'friends') => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const tabs = [
    { id: 'feed' as const, icon: Home, label: 'Home' },
    { id: 'friends' as const, icon: Users, label: 'Friends' },
    { id: 'messages' as const, icon: MessageCircle, label: 'Messages' },
    { id: 'profile' as const, icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-2 py-2 safe-area-bottom">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors ${
            currentPage === id
              ? 'text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Icon className={`w-6 h-6 ${currentPage === id ? 'stroke-2' : ''}`} />
          <span className="text-xs mt-1 font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}