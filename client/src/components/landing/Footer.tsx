import { Link } from 'react-router-dom';

const footerLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Sign in', href: '/sign-in' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center">
              <span className="text-xs font-bold text-white tracking-tighter">C</span>
            </div>
            <span className="font-bold text-white text-sm tracking-tight">Connectly</span>
          </div>
          <p className="text-slate-500 text-sm">
            Real-time messaging with scheduled delivery.
          </p>

          <nav className="flex items-center gap-6 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => window.scrollTo(0, 0)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="text-slate-500 text-xs">
            © {new Date().getFullYear()} Connectly. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
