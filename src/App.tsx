import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Login } from './components/auth/Login';
import { SignUp } from './components/auth/SignUp';
import { Navbar } from './components/layout/Navbar';
import { Feed } from './pages/Feed';
import { Profile } from './pages/Profile';
import { Messages } from './pages/Messages';
import { Friends } from './pages/Friends';

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
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />

      <main className="pb-8">
        {currentPage === 'feed' && <Feed />}
        {currentPage === 'profile' && <Profile />}
        {currentPage === 'messages' && <Messages />}
        {currentPage === 'friends' && <Friends />}
      </main>
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
