import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  NavLink,
} from 'react-router-dom';
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


function ConversationBottomNav() {
  const navItems = [
    {
      to: '/conversations',
      label: 'Chats',
      icon: 'message-circle',
    },
    {
      to: '/contacts',
      label: 'Contacts',
      icon: 'users',
    },
    {
      to: '/scheduled',
      label: 'Scheduled',
      icon: 'calendar-clock',
    },
    {
      to: '/search',
      label: 'Search',
      icon: 'search',
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: 'user-round',
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: 'settings',
    },
  ];

  const icons: Record<string, React.ReactNode> = {
    'message-circle': (
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    'calendar-clock': (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M12 14v3l2 1" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </>
    ),
    'user-round': (
      <>
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2z" />
      </>
    ),
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/conversations'}
            aria-label={item.label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${isActive
                ? 'text-blue-600'
                : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center w-10 h-9 rounded-xl transition-all duration-200 ${isActive
                      ? 'bg-blue-50 scale-110'
                      : 'scale-100'
                    }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={isActive ? 2.2 : 1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''
                      }`}
                  >
                    {icons[item.icon]}
                  </svg>
                </span>

                <span
                  className={`text-[10px] transition-all ${isActive
                      ? 'font-semibold text-blue-600'
                      : 'font-medium'
                    }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  const isConversationRoute =
    location.pathname.startsWith("/conversations");

  const isConversationIndex =
    location.pathname === "/conversations";

  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] bg-slate-50">
        <Sidebar />

        <main className="lg:ml-72 min-h-[100dvh] flex pb-16 md:pb-0">
          {/* Conversation list */}
          {isConversationRoute && (
            <aside
              className={`
              bg-white border-r border-slate-200 flex-shrink-0
              ${isConversationIndex
                  ? 'w-full md:w-96'
                  : 'hidden md:block md:w-96'
                }
            `}
            >
              <ConversationsList />
            </aside>
          )}

          {/* Main content */}
          <div
            className={`
            flex-1 min-w-0
            ${isConversationIndex ? 'hidden md:block' : ''}
          `}
          >
            <Outlet />
          </div>
        </main>

        {/* Only show on conversations landing page */}
        {!/^\/conversations\/[^/]+$/.test(location.pathname) && (
          <ConversationBottomNav />
        )}
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
    <div className="flex flex-col items-center justify-center h-full min-h-[100dvh] bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
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
          <Route path="/login" element={<Navigate to="/sign-in" replace />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes (with sidebar) */}
        <Route element={<ProtectedLayout />}>
          {/* Index route at /conversations shows empty state in right panel */}
          <Route path="/conversations" element={<EmptyConversationState />} />

          {/* Other sidebar navigation pages render in right panel */}
          <Route path="/contacts" element={<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 text-center text-slate-500"><p>Contacts page - Coming soon</p></div>} />
          <Route path="/scheduled" element={<ScheduledMessagesPage />} />
          <Route path="/settings" element={<div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 text-center text-slate-500"><p>Settings page - Coming soon</p></div>} />
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