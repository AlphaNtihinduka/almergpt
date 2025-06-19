"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Brain, Zap, BarChart3, ShieldCheck, Code, ArrowRight, ChevronDown,
  Bot, Users, Database, Settings, Crown, Star, Sparkles,
  TrendingUp, Award, Target, Rocket, CheckCircle, User
} from 'lucide-react';
import LandingNavbar from '@/components/LandingNavbar';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);


interface User {
  firstName: string;
  lastName: string;
  emailAddress: string;
  profileImageUrl: string;
  publicMetadata: {
    plan: string;
    joinedDate: string;
  };
}

// Mock authentication context - replace with actual Clerk hooks
const useAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate authentication check
    const timer = setTimeout(() => {
      // Mock user data - replace with actual Clerk user data
      const mockUser = {
        firstName: "Alex",
        lastName: "Thompson",
        emailAddress: "alex@company.com",
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        publicMetadata: {
          plan: "premium",
          joinedDate: "2020-01-15"
        }
      };

      // Toggle this to test authenticated/unauthenticated states
      const authenticated = Math.random() > 0.5; // Random for demo

      setIsSignedIn(authenticated);
      setUser(authenticated ? mockUser : null);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const signOut = () => {
    setIsSignedIn(false);
    setUser(null);
  };

  return { isSignedIn, user, isLoading, signOut };
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
    title: 'Enterprise AI Models',
    description: 'Access to GPT-4 Turbo, Claude-3 Opus, and proprietary models trained on 20+ years of industry data.',
    premium: true
  },
  {
    icon: <TrendingUp size={32} className="text-emerald-400" />,
    title: 'Advanced Analytics Suite',
    description: 'Real-time business intelligence with predictive modeling and automated insight generation.',
    premium: true
  },
  {
    icon: <Rocket size={32} className="text-purple-400" />,
    title: 'Custom AI Workflows',
    description: 'Build sophisticated automation pipelines with our visual workflow designer and API integrations.',
    premium: true
  },
  {
    icon: <Award size={32} className="text-cyan-400" />,
    title: 'Priority Support & Training',
    description: 'Dedicated success manager, 24/7 support, and personalized AI implementation consulting.',
    premium: true
  },
  {
    icon: <Brain size={32} className="text-blue-400" />,
    title: 'Neural Network Training',
    description: 'Train custom models on your data with our advanced ML infrastructure and expert guidance.',
    premium: true
  },
  {
    icon: <Target size={32} className="text-red-400" />,
    title: 'Multi-Tenant Architecture',
    description: 'Enterprise-grade security with isolated environments and compliance certifications.',
    premium: true
  }
];

// Standard features for non-authenticated users
const standardFeaturesData = [
  {
    icon: <Brain size={32} className="text-cyan-400" />,
    title: 'Intelligent Automation',
    description: 'Streamline complex workflows with our cutting-edge AI automation engine.',
    premium: false
  },
  {
    icon: <BarChart3 size={32} className="text-green-400" />,
    title: 'Predictive Analytics',
    description: 'Leverage AI-driven insights to forecast trends and make data-backed decisions.',
    premium: false
  },
  {
    icon: <Zap size={32} className="text-yellow-400" />,
    title: 'Hyper-Personalization',
    description: 'Deliver unique customer experiences at scale with AI-powered personalization.',
    premium: false
  },
  {
    icon: <ShieldCheck size={32} className="text-purple-400" />,
    title: 'Enhanced Security',
    description: 'Protect your assets with AI-driven threat detection and anomaly identification.',
    premium: false
  }
];

// Main App Component
const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const appRef = useRef<HTMLDivElement>(null);
  const { isSignedIn, user, isLoading } = useAuth();

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your personalized experience...</p>
        </div>
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
        <HeroSection isSignedIn={isSignedIn} user={user} />
        <FeaturesSection isSignedIn={isSignedIn} />
        <ShowcaseSection />
        {isSignedIn && user && <PremiumDashboardPreview user={user} />}
        <CallToActionSection scrollToSection={scrollToSection} />
      </main>
      <Footer />
    </div>
  );
};

const HeroSection: React.FC<{ isSignedIn: boolean; user: User | null }> = ({ isSignedIn, user }) => {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaButtonRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

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
    const joinedYear = new Date(user.publicMetadata.joinedDate).getFullYear();
    return new Date().getFullYear() - joinedYear;
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

// Showcase Section Component
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
        // Subtle looping animation for list items
        gsap.to(item.querySelector('.status-indicator'), {
          opacity: 0.5, // Flicker effect (use yoyo for flicker)
          duration: 0.75 + Math.random(), // Randomize duration slightly
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1 + index * 0.2
        });
      }
    });
  }, []);

  // Define showcaseItems for the status list
  const showcaseItems = [
    {
      id: 1,
      title: "Database Uptime",
      value: "99.99%",
      statusColor: "bg-green-400"
    },
    {
      id: 2,
      title: "API Response Time",
      value: "120ms",
      statusColor: "bg-green-400"
    },
    {
      id: 3,
      title: "AI Model Accuracy",
      value: "98.7%",
      statusColor: "bg-yellow-400"
    },
    {
      id: 4,
      title: "Security Status",
      value: "All Secure",
      statusColor: "bg-green-400"
    }
  ];

  return (
    <section ref={sectionRef} id="showcase" className="py-16 sm:py-24">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 ref={titleRef} className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            AI in Action: A Glimpse Under the Hood
          </h2>
          <p className="text-lg text-slate-300 dark:text-slate-400 max-w-2xl mx-auto">
            Witness the elegance and power of our AI core. Real-time insights, dynamic processing, and robust architecture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Left Column: Abstract AI Visualization */}
          <div className="bg-slate-800/50 dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl relative overflow-hidden">
            <h3 className="text-2xl font-semibold mb-6 text-white dark:text-white">AI Core Monitor</h3>
            <div className="relative h-64 sm:h-80">
              {/* Animated background shapes */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full filter blur-sm"
                  style={{
                    width: `${Math.random() * 60 + 20}px`,
                    height: `${Math.random() * 60 + 20}px`,
                    left: `${Math.random() * 80}%`,
                    top: `${Math.random() * 80}%`,
                    background: `rgba(${Math.random() * 100 + 100}, ${Math.random() * 155 + 100}, 255, ${Math.random() * 0.3 + 0.2})`,
                    animation: `float ${Math.random() * 5 + 5}s ease-in-out infinite alternate`,
                  }}
                ></div>
              ))}
              <Code size={80} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-cyan-500/40 dark:text-cyan-500/60" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">Conceptual representation of AI data streams and processing nodes.</p>
            {/* CSS for float animation */}
            <style jsx global>{`
              @keyframes float {
                0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
                50% { transform: translateY(${Math.random() * 20 - 10}px) translateX(${Math.random() * 20 - 10}px) rotate(${Math.random() * 10 - 5}deg); }
                100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
              }
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
          </div>

          {/* Right Column: Status List */}
          <div className="bg-slate-800/50 dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl">
            <h3 className="text-2xl font-semibold mb-6 text-white dark:text-white">System Status</h3>
            <ul className="space-y-5">
              {showcaseItems.map((item, index) => (
                <li
                  key={item.id}
                  ref={el => { itemsRef.current[index] = el; }}
                  className="flex items-center justify-between p-4 bg-slate-700/60 dark:bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center">
                    {index === 0 && <Database size={20} className="mr-3 text-cyan-400" />}
                    {index === 1 && <Zap size={20} className="mr-3 text-green-400" />}
                    {index === 2 && <Brain size={20} className="mr-3 text-yellow-400" />}
                    {index === 3 && <ShieldCheck size={20} className="mr-3 text-purple-400" />}
                    <span className="text-slate-200 dark:text-slate-300">{item.title}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`status-indicator w-3 h-3 rounded-full mr-2 ${item.statusColor}`}></span>
                    <span className="text-sm text-slate-300 dark:text-slate-400">{item.value}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

// Premium Dashboard Preview Component
const PremiumDashboardPreview: React.FC<{ user: User }> = ({ user }) => {
  return (
    <section id="dashboard-preview" className="py-16 sm:py-24 bg-gradient-to-br from-yellow-400/10 via-orange-400/10 to-red-400/10 dark:from-yellow-400/20 dark:via-orange-400/20 dark:to-red-400/20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <Crown size={40} className="mx-auto text-yellow-400 mb-2" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Premium Dashboard Preview
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-200 max-w-2xl mx-auto">
            Welcome, {user.firstName}! Here’s a sneak peek of your enterprise AI dashboard.
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
          <button className="bg-white hover:bg-slate-100 text-blue-600 font-bold py-3 px-10 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
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
    </section>
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
