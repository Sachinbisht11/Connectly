/**
 * SignInPage — split-screen sign-in layout.
 *
 * Desktop: centered container (~1000px max) with two balanced columns —
 * Connectly branding on the left (~45%) and the sign-in form on the right (~55%).
 * Mobile/Tablet: stacks vertically with a compact brand header above the form.
 */

import { useNavigate } from 'react-router-dom';
import SignInBrandingPanel from '../components/SignInBrandingPanel';
import SignInForm from '../components/SignInForm';

export default function SignInPage() {
  const navigate = useNavigate();

  const handleSignup = () => {
    navigate('/register');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-200 selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* Centered auth container: balanced two columns on desktop, stacked on mobile */}
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <div className="min-h-[calc(100dvh-2rem)] flex flex-col lg:flex-row gap-6 lg:gap-0 items-start lg:items-center justify-center">
          <SignInBrandingPanel />
          <SignInForm onSignup={handleSignup} onBackToHome={handleBackToHome} />
        </div>
      </div>
    </div>
  );
}
