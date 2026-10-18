import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ProfilePage from './features/auth/pages/ProfilePage';
import SearchPage from './features/auth/pages/SearchPage';
import ConversationsList from './features/conversations/ConversationsList';
import ConversationPage from './features/conversations/ConversationPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/conversations"
          element={
            <ProtectedRoute>
              <ConversationsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversations/:conversationId"
          element={
            <ProtectedRoute>
              <ConversationPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
