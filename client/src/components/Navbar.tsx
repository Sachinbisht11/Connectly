import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="fixed top-0 w-full border-b border-gray-200 bg-white z-50">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/profile" className="font-bold text-lg text-blue-600">
          Connectly
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/search"
            className="text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            Find people
          </Link>
          <Link
            to="/conversations"
            className="text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            Messages
          </Link>
          <button
            onClick={() => void handleLogout()}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
