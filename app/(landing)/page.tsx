"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Brain, BarChart3, ShieldCheck, Code, ArrowRight, ChevronDown,
  Bot, Users, Database, Settings, Crown, Star, Sparkles,
  Rocket, CheckCircle,
  MessageSquare,
  Image,
  Video,
  Music,
  Film,
  Headphones,
  Palette,
  Terminal,
  Activity,
  Cpu
} from 'lucide-react';
import LandingNavbar from '@/components/LandingNavbar';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);


// Mock authentication context - replace with actual Clerk hooks
const useAuthenticated = () => {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, signOut: clerkSignOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for Clerk to finish loading
    if (userLoaded) {
      setIsLoading(false);
    }
  }, [userLoaded]);

  const signOut = async () => {
    try {
      await clerkSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    isSignedIn: isSignedIn || false,
    user: user || null,
    isLoading,
    signOut
  };
};

// Helper component for icons
const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-3 bg-slate-700/50 rounded-lg inline-block ${className}`}>
    {children}
  </div>
);

// Enhanced features for premium users
const premiumFeaturesData = [
  {
    icon: <Crown size={32} className="text-yellow-400" />,
    title: 'Advanced Conversation Models',
    description: 'Access to GPT-4 Turbo, Claude-3 Opus, and specialized conversational AI models for complex dialogues.',
    premium: true
  },
  {
    icon: <Palette size={32} className="text-emerald-400" />,
    title: 'Professional Image Generation',
    description: 'High-resolution image creation with style controls, batch processing, and commercial licensing.',
    premium: true
  },
  {
    icon: <Film size={32} className="text-purple-400" />,
    title: 'HD Video Production',
    description: 'Generate professional-quality videos with custom branding, longer duration, and export options.',
    premium: true
  },
  {
    icon: <Headphones size={32} className="text-cyan-400" />,
    title: 'Studio-Quality Music',
    description: 'Create full-length compositions with instrument separation, mixing controls, and royalty-free licensing.',
    premium: true
  },
  {
    icon: <Terminal size={32} className="text-blue-400" />,
    title: 'Advanced Code Solutions',
    description: 'Complex algorithm generation, code optimization, debugging assistance, and enterprise-level integrations.',
    premium: true
  },
  {
    icon: <Settings size={32} className="text-red-400" />,
    title: 'Custom AI Workflows',
    description: 'Build automated pipelines combining all AI features with API access and webhook integrations.',
    premium: true
  }
];

// Standard features for non-authenticated users
const standardFeaturesData = [
  {
    icon: <MessageSquare size={32} className="text-cyan-400" />,
    title: 'Conversation',
    description: 'Engage in intelligent text-to-text conversations with advanced AI for any topic or task.',
    premium: false
  },
  {
    icon: <Image size={32} className="text-green-400" />,
    title: 'Image Generation',
    description: 'Transform your ideas into stunning visuals with powerful text-to-image AI technology.',
    premium: false
  },
  {
    icon: <Video size={32} className="text-yellow-400" />,
    title: 'Video Creation',
    description: 'Generate professional videos from text prompts with cutting-edge text-to-video AI.',
    premium: false
  },
  {
    icon: <Music size={32} className="text-purple-400" />,
    title: 'Music Composition',
    description: 'Create original music and soundtracks from text descriptions using AI composition tools.',
    premium: false
  },
  {
    icon: <Code size={32} className="text-blue-400" />,
    title: 'Code Generation',
    description: 'Solve complex programming problems and generate optimized code with AI-powered algorithms.',
    premium: false
  }
];

// Main App Component
const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const appRef = useRef<HTMLDivElement>(null);
  const { isSignedIn, user, isLoading } = useAuthenticated();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Redirect to dashboard if signed in
  useEffect(() => {
    if (isSignedIn && !isLoading) {
      // In a real app, you would use Next.js router or your routing solution
      console.log('Redirecting to dashboard...');
      // router.push('/dashboard');
    }
  }, [isSignedIn, isLoading]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Background animated elements */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                width: `${Math.random() * 100 + 20}px`,
                height: `${Math.random() * 100 + 20}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: [
                  'rgba(34, 211, 238, 0.3)', // cyan
                  'rgba(34, 197, 94, 0.3)',  // green
                  'rgba(251, 191, 36, 0.3)', // yellow
                  'rgba(168, 85, 247, 0.3)', // purple
                  'rgba(59, 130, 246, 0.3)', // blue
                ][i % 5],
                animation: `float-bg ${Math.random() * 10 + 15}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>

        {/* Main loading container */}
        <div className="relative z-10 text-center">
          {/* Sophisticated loading animation */}
          <div className="relative mb-8">
            {/* Outer rotating ring */}
            <div className="w-24 h-24 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-400 animate-spin-reverse"></div>

              {/* Inner pulsing core */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 animate-pulse-glow"></div>

              {/* Central AI brain icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain size={20} className="text-white animate-pulse-slow" />
              </div>
            </div>

            {/* Progress indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-slate-600 animate-bounce"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.4s'
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Loading text with typewriter effect */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white mb-2 animate-fade-in">
              Initializing AI Platform
            </h3>
            <div className="max-w-md mx-auto">
              <p className="text-slate-300 text-lg animate-fade-in-delay">
                Loading your personalized experience...
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Conversation Models</span>
                  <span className="text-cyan-400">Ready</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Image Generation</span>
                  <span className="text-green-400">Ready</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Video Processing</span>
                  <span className="text-yellow-400">Loading...</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Music Synthesis</span>
                  <span className="text-purple-400">Ready</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Code Generation</span>
                  <span className="text-blue-400">Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-8 max-w-sm mx-auto">
            <div className="w-full bg-slate-700 rounded-full h-1">
              <div className="bg-gradient-to-r from-cyan-400 to-purple-400 h-1 rounded-full animate-loading-progress"></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Optimizing neural networks...</p>
          </div>
        </div>

        {/* Advanced CSS animations */}
        <style jsx global>{`
        @keyframes float-bg {
          0% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(${Math.random() * 40 - 20}px) translateX(${Math.random() * 40 - 20}px) scale(1.1); }
          100% { transform: translateY(0px) translateX(0px) scale(1); }
        }
        
        @keyframes spin-reverse {
          to { transform: rotate(-360deg); }
        }
        .animate-spin-reverse { animation: spin-reverse 2s linear infinite; }
        
        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 0.8; 
            transform: scale(1);
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
          }
          50% { 
            opacity: 1; 
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(34, 211, 238, 0.5);
          }
        }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        
        @keyframes fade-in-delay {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-delay { animation: fade-in-delay 0.8s ease-out 0.3s both; }
        
        @keyframes loading-progress {
          0% { width: 0%; }
          50% { width: 60%; }
          100% { width: 85%; }
        }
        .animate-loading-progress { animation: loading-progress 3s ease-in-out infinite; }
      `}</style>
      </div>
    );
  }

  return (
    <div ref={appRef} className={`min-h-screen bg-slate-900 text-slate-100 dark overflow-x-hidden font-sans transition-colors duration-500 ${!darkMode ? 'bg-gray-100 text-slate-900' : ''}`}>
      {/* Background Gradient Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600/30 dark:bg-purple-600/50 rounded-full filter blur-3xl opacity-50 animate-pulse-slow"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/30 dark:bg-cyan-500/50 rounded-full filter blur-3xl opacity-50 animate-pulse-slower"></div>
      </div>

      <LandingNavbar
        scrollToSection={scrollToSection}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
      <main>
        <HeroSection isSignedIn={isSignedIn} />
        < FeaturesSection isSignedIn={isSignedIn} />
        <ShowcaseSection />
        {isSignedIn && user && <PremiumDashboardPreview />}
        <CallToActionSection scrollToSection={scrollToSection} />
      </main>
      <Footer />
    </div>
  );
};

const HeroSection: React.FC<{ isSignedIn: boolean }> = ({ isSignedIn }) => {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaButtonRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthenticated();

  // const { isSignedIn, user } = currentUser();

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (titleRef.current) {
      const words = titleRef.current.innerText.split(' ');
      titleRef.current.innerHTML = words.map(word => `<span class="inline-block opacity-0 translate-y-10">${word}</span>`).join(' ');

      tl.to(titleRef.current.children, {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.8,
        delay: 1,
      });
    }

    tl.fromTo(subtitleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8 },
      "-=0.5"
    );

    tl.fromTo(ctaButtonRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' },
      "-=0.4"
    );

    tl.fromTo(imageRef.current,
      { opacity: 0, scale: 0.5, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'power3.out' },
      "-=0.6"
    );

    gsap.to(imageRef.current, {
      y: "-=15px",
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 2
    });
  }, []);

  const getExperienceYears = () => {
    if (!isSignedIn || !user?.publicMetadata?.joinedDate) return 0;
    // const joinedYear = new Date(user).getFullYear();
    return new Date().getFullYear();
  };

  return (
    <section ref={heroRef} id="hero" className="min-h-screen flex items-center justify-center relative pt-20 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center text-center md:text-left">
        <div className="space-y-6 md:space-y-8">
          {isSignedIn && (
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
              <Sparkles className="text-yellow-400" size={20} />
              <span className="text-sm bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent font-semibold">
                Welcome back, {user?.firstName}! • {getExperienceYears()} years of AI excellence
              </span>
            </div>
          )}

          <h1 ref={titleRef} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="block">
              {isSignedIn ? 'Your AI Empire' : 'Future of AI'}
            </span>
            <span className="block text-cyan-400">
              {isSignedIn ? 'Awaits You.' : 'Is Here. Today.'}
            </span>
          </h1>

          <p ref={subtitleRef} className="text-lg sm:text-xl text-slate-300 dark:text-slate-400 max-w-xl mx-auto md:mx-0">
            {isSignedIn
              ? `Access your premium AI workspace with advanced models, custom workflows, and enterprise-grade analytics. Your success story continues here.`
              : `Unlock unparalleled efficiency and innovation with our next-generation AI platform. Transform your business with intelligent solutions designed for tomorrow's challenges.`
            }
          </p>

          <div ref={ctaButtonRef} className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
            {isSignedIn ? (
              <>
                <button className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Crown size={20} className="inline mr-2" />
                  Access Dashboard
                </button>
                <button className="bg-slate-700/50 dark:bg-slate-700 hover:bg-slate-600 dark:hover:bg-slate-600 text-slate-100 dark:text-slate-200 font-semibold py-3 px-8 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  View Analytics
                </button>
              </>
            ) : (
              <>
                <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Explore Platform <ArrowRight size={20} className="inline ml-2" />
                </button>
                <button className="bg-slate-700/50 dark:bg-slate-700 hover:bg-slate-600 dark:hover:bg-slate-600 text-slate-100 dark:text-slate-200 font-semibold py-3 px-8 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  Request Demo
                </button>
              </>
            )}
          </div>
        </div>

        <div ref={imageRef} className="hidden md:flex justify-center items-center mt-10 md:mt-0">
          <div className="relative w-80 h-80 lg:w-96 lg:h-96">
            <div className={`absolute inset-0 bg-gradient-to-br ${isSignedIn
              ? 'from-yellow-500 via-orange-500 to-red-600'
              : 'from-purple-600 via-cyan-500 to-green-400'
              } rounded-full opacity-30 dark:opacity-50 filter blur-2xl`}></div>

            {isSignedIn ? (
              <Crown size={180} className="absolute inset-0 m-auto text-yellow-300/70 dark:text-yellow-400/80 opacity-80" />
            ) : (
              <Bot size={180} className="absolute inset-0 m-auto text-cyan-300/70 dark:text-cyan-400/80 opacity-80 transform scale-x-[-1]" />
            )}

            <div className={`absolute w-full h-full border-2 ${isSignedIn ? 'border-yellow-500/30' : 'border-cyan-500/30'
              } rounded-full animate-spin-slow`}></div>

            <div className={`absolute w-3/4 h-3/4 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border ${isSignedIn ? 'border-orange-500/30' : 'border-purple-500/30'
              } rounded-full animate-ping-slow opacity-70`}></div>

            {isSignedIn && (
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2">
                <Star size={24} className="text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
        <ChevronDown size={32} className="text-cyan-400" />
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }

        @keyframes ping-slow {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-ping-slow { animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

        @keyframes pulse-slower {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.03); }
        }
        .animate-pulse-slower { animation: pulse-slower 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </section>
  );
};

// Enhanced Features Section
const FeaturesSection: React.FC<{ isSignedIn: boolean }> = ({ isSignedIn }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const featuresData = isSignedIn ? premiumFeaturesData : standardFeaturesData;

  useEffect(() => {
    const featureCards = gsap.utils.toArray('.feature-card');
    featureCards.forEach((card) => {
      const element = card as HTMLDivElement;
      gsap.fromTo(element,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );
    });
  }, []);

  return (
    <section ref={sectionRef} id="features" className="py-16 sm:py-24 bg-slate-800/30 dark:bg-slate-800/50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center space-x-3 mb-4">
            {isSignedIn && (
              <>
                <Crown className="text-yellow-400" size={32} />
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent font-bold text-lg">
                  PREMIUM FEATURES
                </span>
              </>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            {isSignedIn ? 'Enterprise-Grade AI Capabilities' : 'Revolutionize Your Workflow'}
          </h2>
          <p className="text-lg text-slate-300 dark:text-slate-400 max-w-2xl mx-auto">
            {isSignedIn
              ? 'Unlock the full potential of AI with advanced features designed for enterprise success. Built on 20+ years of industry expertise.'
              : 'Discover the powerful capabilities that set our AI platform apart. Built for performance, scalability, and seamless integration.'
            }
          </p>
        </div>

        <div className={`grid ${isSignedIn ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-8`}>
          {featuresData.map((feature, index) => (
            <div
              key={index}
              className={`feature-card ${isSignedIn
                ? 'bg-gradient-to-br from-slate-700/70 to-slate-800/70 border border-yellow-500/20'
                : 'bg-slate-700/50 dark:bg-slate-800'
                } p-6 rounded-xl shadow-lg hover:shadow-cyan-500/20 dark:hover:shadow-cyan-400/30 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden`}
            >
              {isSignedIn && (
                <div className="absolute top-2 right-2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                    <Star size={12} className="text-white" />
                  </div>
                </div>
              )}

              <IconWrapper className={`mb-4 ${isSignedIn
                ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                : 'bg-slate-600/70 dark:bg-slate-700'
                }`}>
                {feature.icon}
              </IconWrapper>

              <h3 className="text-xl font-semibold mb-2 text-white dark:text-white">{feature.title}</h3>
              <p className="text-sm text-slate-300 dark:text-slate-400">{feature.description}</p>

              {isSignedIn && (
                <div className="mt-4 flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Active in your plan</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Improved Showcase Section Component
const ShowcaseSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    gsap.fromTo(titleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: titleRef.current, start: "top 80%" } }
    );

    itemsRef.current.forEach((item, index) => {
      if (item) {
        gsap.fromTo(item,
          { opacity: 0, x: -50 },
          {
            opacity: 1, x: 0, duration: 0.7, delay: index * 0.15,
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              toggleActions: "play none none none",
            }
          }
        );
        // Enhanced subtle looping animation for list items
        gsap.to(item.querySelector('.status-indicator'), {
          opacity: 0.5,
          duration: 0.75 + Math.random(),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1 + index * 0.2
        });
      }
    });
  }, []);

  // Enhanced showcaseItems aligned with AI platform features
  const showcaseItems = [
    {
      id: 1,
      title: "Conversation Models",
      value: "99.8%",
      statusColor: "bg-cyan-400",
      description: "Response accuracy"
    },
    {
      id: 2,
      title: "Image Generation",
      value: "2.1s",
      statusColor: "bg-green-400",
      description: "Average render time"
    },
    {
      id: 3,
      title: "Video Processing",
      value: "94.2%",
      statusColor: "bg-yellow-400",
      description: "Quality score"
    },
    {
      id: 4,
      title: "Music Synthesis",
      value: "Active",
      statusColor: "bg-purple-400",
      description: "Neural networks"
    },
    {
      id: 5,
      title: "Code Generation",
      value: "97.5%",
      statusColor: "bg-blue-400",
      description: "Compilation success"
    }
  ];

  return (
    <section ref={sectionRef} id="showcase" className="py-16 sm:py-24">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 ref={titleRef} className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            AI Platform Performance: Real-Time Insights
          </h2>
          <p className="text-lg text-slate-300 dark:text-slate-400 max-w-2xl mx-auto">
            Experience the power of our multi-modal AI platform. Live performance metrics from conversation, image, video, music, and code generation engines.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Column: Enhanced AI Visualization */}
          <div className="bg-slate-800/50 dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl relative overflow-hidden border border-slate-700/50">
            <h3 className="text-2xl font-semibold mb-6 text-white dark:text-white flex items-center">
              <Cpu size={28} className="mr-3 text-cyan-400" />
              AI Core Monitor
            </h3>
            <div className="relative h-64 sm:h-80">
              {/* Enhanced animated background shapes with different colors for each AI type */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full filter blur-sm animate-pulse-slow"
                  style={{
                    width: `${Math.random() * 40 + 30}px`,
                    height: `${Math.random() * 40 + 30}px`,
                    left: `${Math.random() * 70 + 10}%`,
                    top: `${Math.random() * 70 + 10}%`,
                    background: [
                      'rgba(34, 211, 238, 0.3)', // cyan - conversation
                      'rgba(34, 197, 94, 0.3)',  // green - image
                      'rgba(251, 191, 36, 0.3)', // yellow - video
                      'rgba(168, 85, 247, 0.3)', // purple - music
                      'rgba(59, 130, 246, 0.3)', // blue - code
                    ][i % 5],
                    animation: `float ${Math.random() * 4 + 6}s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.5}s`
                  }}
                ></div>
              ))}

              {/* Central AI brain icon with rotation */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Brain size={80} className="text-cyan-500/60 dark:text-cyan-500/80 animate-spin-slow" />
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping-slow"></div>
              </div>

              {/* Floating AI feature icons */}
              <MessageSquare size={24} className="absolute top-4 right-4 text-cyan-400/70 animate-pulse-slower" />
              <Image size={24} className="absolute bottom-4 left-4 text-green-400/70 animate-pulse-slow" />
              <Video size={24} className="absolute top-4 left-4 text-yellow-400/70 animate-pulse-slower" />
              <Music size={24} className="absolute bottom-4 right-4 text-purple-400/70 animate-pulse-slow" />
              <Code size={24} className="absolute top-1/2 right-8 text-blue-400/70 animate-pulse-slower" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">
              Live visualization of multi-modal AI processing nodes and data streams across all platform services.
            </p>

            {/* Enhanced CSS animations */}
            <style jsx global>{`
              @keyframes float {
                0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
                50% { transform: translateY(${Math.random() * 30 - 15}px) translateX(${Math.random() * 30 - 15}px) rotate(${Math.random() * 15 - 7.5}deg); }
                100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
              }
              @keyframes spin-slow {
                to { transform: rotate(360deg); }
              }
              .animate-spin-slow { animation: spin-slow 25s linear infinite; }

              @keyframes ping-slow {
                75%, 100% {
                  transform: scale(1.8);
                  opacity: 0;
                }
              }
              .animate-ping-slow { animation: ping-slow 4s cubic-bezier(0, 0, 0.2, 1) infinite; }
              
              @keyframes pulse-slow {
                0%, 100% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 0.3; transform: scale(1.05); }
              }
              .animate-pulse-slow { animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

              @keyframes pulse-slower {
                0%, 100% { opacity: 0.5; transform: scale(1); }
                50% { opacity: 0.2; transform: scale(1.08); }
              }
              .animate-pulse-slower { animation: pulse-slower 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
          </div>

          {/* Right Column: Enhanced Status List */}
          <div className="bg-slate-800/50 dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-700/50">
            <h3 className="text-2xl font-semibold mb-6 text-white dark:text-white flex items-center">
              <Activity size={28} className="mr-3 text-green-400" />
              AI Services Status
            </h3>
            <ul className="space-y-4">
              {showcaseItems.map((item, index) => (
                <li
                  key={item.id}
                  ref={el => { itemsRef.current[index] = el; }}
                  className="flex items-center justify-between p-4 bg-slate-700/60 dark:bg-slate-700 rounded-lg hover:bg-slate-700/80 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    {index === 0 && <MessageSquare size={20} className="mr-3 text-cyan-400" />}
                    {index === 1 && <Image size={20} className="mr-3 text-green-400" />}
                    {index === 2 && <Video size={20} className="mr-3 text-yellow-400" />}
                    {index === 3 && <Music size={20} className="mr-3 text-purple-400" />}
                    {index === 4 && <Code size={20} className="mr-3 text-blue-400" />}
                    <div>
                      <span className="text-slate-200 dark:text-slate-300 font-medium">{item.title}</span>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{item.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`status-indicator w-3 h-3 rounded-full mr-3 ${item.statusColor}`}></span>
                    <span className="text-sm text-slate-300 dark:text-slate-400 font-mono">{item.value}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Additional metrics summary */}
            <div className="mt-6 pt-4 border-t border-slate-600/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Total Requests Today</span>
                <span className="text-green-400 font-mono">2,847,329</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-slate-400">System Load</span>
                <span className="text-yellow-400 font-mono">67.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Premium Dashboard Preview Component
const PremiumDashboardPreview: React.FC = () => {
  const { user } = useAuthenticated();
  return (
    <section id="dashboard-preview" className="py-16 sm:py-24 bg-gradient-to-br from-yellow-400/10 via-orange-400/10 to-red-400/10 dark:from-yellow-400/20 dark:via-orange-400/20 dark:to-red-400/20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <Crown size={40} className="mx-auto text-yellow-400 mb-2" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Premium Dashboard Preview
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-200 max-w-2xl mx-auto">
            Welcome, {user?.firstName}! Here’s a sneak peek of your enterprise AI dashboard.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-6 shadow-lg flex flex-col items-center">
            <BarChart3 size={40} className="text-cyan-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">AI Analytics</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center">Real-time insights and predictive analytics tailored for your business.</p>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-6 shadow-lg flex flex-col items-center">
            <Rocket size={40} className="text-purple-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Custom Workflows</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center">Automate and orchestrate complex business processes with ease.</p>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-6 shadow-lg flex flex-col items-center">
            <ShieldCheck size={40} className="text-green-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Enterprise Security</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center">Your data is protected with industry-leading security and compliance.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Call To Action Section
const CallToActionSection: React.FC<{ scrollToSection: (id: string) => void }> = ({ scrollToSection }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { isSignedIn } = useAuthenticated();
  const router = useRouter();

  const handleTrial = () => {
    if (!isSignedIn) {
      router.push('/signIn')
    } else {
      router.push('/dashboard')
    }

  }
  useEffect(() => {
    gsap.fromTo(sectionRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      }
    );
  }, []);

  return (
    <section ref={sectionRef} id="cta" className="py-16 sm:py-24 bg-gradient-to-br from-cyan-600/80 via-blue-700/80 to-purple-700/80 dark:from-cyan-600/90 dark:via-blue-700/90 dark:to-purple-700/90">
      <div className="container mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-6">
          Ready to Elevate Your Business with AI?
        </h2>
        <p className="text-lg text-cyan-100 dark:text-cyan-200 max-w-2xl mx-auto mb-10">
          Join the forefront of innovation. Experience the transformative power of our AI SaaS platform and redefine what&apos;s possible.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={() => handleTrial()}
            className="bg-white hover:bg-slate-100 text-blue-600 font-bold py-3 px-10 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            Start Free Trial
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="bg-transparent hover:bg-white/20 border-2 border-white text-white font-semibold py-3 px-10 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Learn More
          </button>
        </div>
      </div>
    </section >
  );
};


// Footer Component
const Footer: React.FC = () => {
  return (
    <footer className="py-12 bg-slate-800/70 dark:bg-slate-900/70 border-t border-slate-700/50 dark:border-slate-700">
      <div className="container mx-auto px-6 lg:px-8 text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-left">
          <div>
            <h5 className="font-semibold text-white mb-3">Product</h5>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Features</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Integrations</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Pricing</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">API Status</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-white mb-3">Company</h5>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">About Us</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Careers</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Contact</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-white mb-3">Resources</h5>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Documentation</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Support Center</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Case Studies</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Whitepapers</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-white mb-3">Legal</h5>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 text-sm">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="flex justify-center space-x-6 mb-8">
          {/* Placeholder for social icons */}
          <a href="#" className="text-slate-400 hover:text-cyan-400"><Users size={20} /></a>
          <a href="#" className="text-slate-400 hover:text-cyan-400"><Settings size={20} /></a>
          <a href="#" className="text-slate-400 hover:text-cyan-400"><Database size={20} /></a>
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} AI SaaS Inc. All rights reserved.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">
          Built with Next.js, Tailwind CSS, and GSAP.
        </p>
      </div>
    </footer>
  );
};

// To make this runnable in a simple React environment (like a previewer):
// export default App;
// If you were in a Next.js `app/page.tsx` file, you'd export App as default.
// For this immersive environment, App will be the root.

// This setup assumes you have Tailwind CSS configured in your project.
// For a standalone HTML file, you'd need to include Tailwind via CDN and GSAP via CDN.
// e.g. <script src="https://cdn.tailwindcss.com"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>

export default App;
