import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Login } from './components/auth/Login';
import { SignUp } from './components/auth/SignUp';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Feed } from './pages/Feed';
import { Profile } from './pages/Profile';
import { Messages } from './pages/Messages';
import { Friends } from './pages/Friends';
import { Moon, Sun } from 'lucide-react';

function AuthWrapper() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {authMode === 'login' ? (
        <Login onToggleMode={() => setAuthMode('signup')} />
      ) : (
        <SignUp onToggleMode={() => setAuthMode('login')} />
      )}
    </div>
  );
}

function MobileHeader() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <div className="md:hidden sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <h1 className="text-xl font-bold text-blue-600">ConnectSphere</h1>
      <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </div>
  );
}

function MainApp() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'feed' | 'profile' | 'messages' | 'friends'>('feed');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthWrapper />;
  }

  return (
    <div className="min-h-screen">
      {/* Desktop navbar */}
      <div className="hidden md:block">
        <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>

      {/* Mobile top header */}
      <MobileHeader />

      {/* Main content */}
      <main className="pb-20 md:pb-8">
        {currentPage === 'feed' && <Feed />}
        {currentPage === 'profile' && <Profile />}
        {currentPage === 'messages' && <Messages />}
        {currentPage === 'friends' && <Friends />}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;