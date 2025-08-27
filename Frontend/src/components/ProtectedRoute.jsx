import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from './AuthContext';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 text-[12px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-pink-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  // Special case for /verify-otp: allow access if tempSignupData exists
  if (location.pathname === '/verify-otp') {
    const tempSignupData = JSON.parse(localStorage.getItem('tempSignupData'));
    if (!tempSignupData || !tempSignupData.email || !tempSignupData.name || !tempSignupData.password) {
      return <Navigate to="/signup" state={{ from: location }} replace />;
    }
    return children;
  }

  // For all other protected routes, require a logged-in user
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;