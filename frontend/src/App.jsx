import VideoCall from './components/VideoCall'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function DashboardApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login onLogin={() => {}} />;
}

function App() {
  // Simple routing based on pathname
  const isDashboard = window.location.pathname === '/dashboard';
  
  return isDashboard ? (
    <AuthProvider>
      <DashboardApp />
    </AuthProvider>
  ) : (
    <VideoCall />
  );
}

export default App