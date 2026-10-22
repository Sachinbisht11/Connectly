import NavBar from '../../components/landing/NavBar';
import HeroSection from '../../components/landing/HeroSection';
import { FeaturesSection } from '../../components/landing/FeatureCard';
import HowItWorksSection from '../../components/landing/HowItWorks';
import AboutSection from '../../components/landing/AboutSection';
import Footer from '../../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500 selection:text-white">
      <NavBar />

      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AboutSection />
      </main>

      <Footer />
    </div>
  );
}
