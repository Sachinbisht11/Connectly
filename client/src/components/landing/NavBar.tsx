import { Link, useLocation } from 'react-router-dom';

interface NavLink {
  path: string;
  label: string;
}

const navLinks: NavLink[] = [
  { path: '#features', label: 'Features' },
  { path: '#how-it-works', label: 'How It Works' },
  { path: '#about', label: 'About' },
];

export default function LandingNavbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-lg shadow-blue-500/30 flex items-center justify-center">
              <span className="text-sm font-bold text-white tracking-tighter">C</span>
            </div>
            <Link
              to="/"
              className="font-bold text-white tracking-tight text-lg"
              onClick={() => window.scrollTo(0, 0)}
            >
              Connectly
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => window.scrollTo(0, 0)}
                className={`text-slate-300 hover:text-white transition-colors ${
                  location.hash === link.path ? 'text-blue-400' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/sign-in"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-3">
            <Button className="text-blue-400 hover:text-blue-300">
              Sign in
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Button({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-colors ${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer`}>
      {children}
    </span>
  );
}
