import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ProfilePage from './features/auth/pages/ProfilePage';
import SearchPage from './features/auth/pages/SearchPage';
import SignInPage from './features/auth/pages/SignInPage';
import LandingPage from './features/landing/LandingPage';
import ConversationsList from './features/conversations/ConversationsList';
import ConversationPage from './features/conversations/ConversationPage';
import CreateGroupPage from './features/conversations/CreateGroupPage';
import GroupInfoPage from './features/conversations/GroupInfoPage';
import ScheduledMessagesPage from './features/conversations/ScheduledMessagesPage';
import Sidebar, { SidebarProvider } from './components/Sidebar';
import { useAuth } from './features/auth/AuthContext';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  // Determine if we should show the conversation list (middle column)
  // Only show for chat-related routes
  const showConversationList = location.pathname.startsWith('/conversations');

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="lg:ml-72 min-h-screen flex">
          {/* Middle column: Conversation list - only for chat routes */}
          {showConversationList && (
            <aside className="w-96 flex-shrink-0 border-r border-slate-200 bg-white hidden lg:block">
              <ConversationsList />
            </aside>
          )}
          {/* Right column: Active conversation - single Outlet */}
          <div className={`flex-1 min-w-0 ${showConversationList ? '' : 'lg:ml-96'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Outlet />
    </div>
  );
}

/**
 * Empty state shown when no conversation is selected.
 * Renders inside the right column Outlet.
 */
function EmptyConversationState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-screen bg-white px-8">
      <svg
        className="w-16 h-16 text-slate-300 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Select a conversation</h2>
      <p className="text-slate-500 text-center max-w-xs">
        Choose a chat from the list or start a new conversation to begin messaging.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (no sidebar) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/login"  element={<Navigate to="/sign-in" replace />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes (with sidebar) */}
        <Route element={<ProtectedLayout />}>
          {/* Index route at /conversations shows empty state in right panel */}
          <Route path="/conversations" element={<EmptyConversationState />} />

          {/* Other sidebar navigation pages render in right panel */}
          <Route path="/contacts" element={<div className="flex-1 p-8 text-center text-slate-500"><p>Contacts page - Coming soon</p></div>} />
          <Route path="/scheduled" element={<ScheduledMessagesPage />} />
          <Route path="/settings" element={<div className="flex-1 p-8 text-center text-slate-500"><p>Settings page - Coming soon</p></div>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/conversations/create-group" element={<CreateGroupPage />} />
          <Route path="/conversations/:conversationId/group-info" element={<GroupInfoPage />} />

          {/* Active conversation renders in right panel */}
          <Route path="/conversations/:conversationId" element={<ConversationPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}