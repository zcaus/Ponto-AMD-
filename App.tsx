import React, { useState, useEffect } from 'react';
import { AuthState, UserRole } from './types';
import { Layout } from './components/Layout';
import { Login } from './views/Login';
import { EmployeeDashboard } from './views/EmployeeDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { storageService } from './services/storage';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const user = await storageService.getCurrentSession();
      if (user) {
        setAuth({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error("Session check failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user: any) => {
    setAuth({ user, isAuthenticated: true });
  };

  const handleLogout = async () => {
    await storageService.logout();
    setAuth({ user: null, isAuthenticated: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-primary-600">
        <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <Layout 
      title={auth.isAuthenticated ? (auth.user?.role === UserRole.ADMIN ? 'Administrador' : 'Colaborador') : undefined}
      onLogout={auth.isAuthenticated ? handleLogout : undefined}
      userName={auth.user?.fullName}
    >
      {!auth.isAuthenticated ? (
        <Login onLogin={handleLoginSuccess} />
      ) : (
        <>
          {auth.user?.role === UserRole.ADMIN ? (
            <AdminDashboard />
          ) : (
            <EmployeeDashboard user={auth.user!} />
          )}
        </>
      )}
    </Layout>
  );
};

export default App;