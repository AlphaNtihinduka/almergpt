"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Brain, Zap, BarChart3, ShieldCheck, Code, ArrowRight, ChevronDown, Bot, Users, Database, Settings, Moon, Sun } from 'lucide-react';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Helper component for icons - adjust as needed
const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-3 bg-slate-700/50 rounded-lg inline-block ${className}`}>
    {children}
  </div>
);

// Mock data for features
const featuresData = [
  {
    icon: <Brain size={32} className="text-cyan-400" />,
    title: 'Intelligent Automation',
    description: 'Streamline complex workflows with our cutting-edge AI automation engine.',
  },
  {
    icon: <BarChart3 size={32} className="text-green-400" />,
    title: 'Predictive Analytics',
    description: 'Leverage AI-driven insights to forecast trends and make data-backed decisions.',
  },
  {
    icon: <Zap size={32} className="text-yellow-400" />,
    title: 'Hyper-Personalization',
    description: 'Deliver unique customer experiences at scale with AI-powered personalization.',
  },
  {
    icon: <ShieldCheck size={32} className="text-purple-400" />,
    title: 'Enhanced Security',
    description: 'Protect your assets with AI-driven threat detection and anomaly identification.',
  },
];

// Mock data for showcase items
const showcaseItems = [
  { id: 1, title: "AI Core Processing", value: "Active", statusColor: "bg-green-500" },
  { id: 2, title: "Data Ingestion Pipeline", value: "Nominal", statusColor: "bg-cyan-500" },
  { id: 3, title: "Neural Network Training", value: "Optimizing", statusColor: "bg-yellow-500" },
  { id: 4, title: "Security Layer", value: "Secure", statusColor: "bg-purple-500" },
];

// Main App Component (Simulates Next.js Page Structure)
const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={appRef} className={`min-h-screen bg-slate-900 text-slate-100 dark overflow-x-hidden font-sans transition-colors duration-500 ${!darkMode ? 'bg-gray-100 text-slate-900' : ''}`}>
      {/* Background Gradient Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600/30 dark:bg-purple-600/50 rounded-full filter blur-3xl opacity-50 animate-pulse-slow"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/30 dark:bg-cyan-500/50 rounded-full filter blur-3xl opacity-50 animate-pulse-slower"></div>
      </div>
      
      <Navbar scrollToSection={scrollToSection} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ShowcaseSection />
        <CallToActionSection scrollToSection={scrollToSection} />
      </main>
      <Footer />
    </div>
  );
};

// Navbar Component
const Navbar: React.FC<{ scrollToSection: (id: string) => void; darkMode: boolean; setDarkMode: (mode: boolean) => void }> = ({ scrollToSection, darkMode, setDarkMode }) => {
  const navRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // GSAP animation for Navbar entrance
    gsap.fromTo(navRef.current, 
      { y: -100, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.5 }
    );

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'features', label: 'Features' },
    { id: 'showcase', label: 'Showcase' },
    { id: 'pricing', label: 'Pricing (Demo)' }, // Example, not implemented
    { id: 'contact', label: 'Contact (Demo)' }, // Example, not implemented
  ];

  return (
    <nav 
      ref={navRef} 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-3xl font-bold tracking-tight">
          <span className="text-cyan-400">AI</span>
          <span className="dark:text-white text-slate-800">SaaS</span>
        </div>
        <div className="hidden md:flex space-x-6 items-center">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="text-slate-300 dark:text-slate-300 hover:text-cyan-400 dark:hover:text-cyan-400 transition-colors duration-200 text-sm font-medium"
            >
              {link.label}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="p-2 rounded-full hover:bg-slate-700/50 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
          <button 
            onClick={() => scrollToSection('cta')}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-sm"
          >
            Get Started
          </button>
          <button className="md:hidden text-slate-300 dark:text-slate-300 hover:text-cyan-400">
            <ChevronDown size={24} /> {/* Placeholder for mobile menu icon */}
          </button>
        </div>
      </div>
    </nav>
  );
};

// Hero Section Component
const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaButtonRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null); // For a conceptual image/graphic

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Animate title words
    if (titleRef.current) {
      const words = titleRef.current.innerText.split(' ');
      titleRef.current.innerHTML = words.map(word => `<span class="inline-block opacity-0 translate-y-10">${word}</span>`).join(' ');
      
      tl.to(titleRef.current.children, {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.8,
        delay: 1, // After nav
      });
    }
    
    // Animate subtitle
    tl.fromTo(subtitleRef.current, 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.8 }, 
      "-=0.5" // Overlap with title animation
    );

    // Animate CTA button
    tl.fromTo(ctaButtonRef.current, 
      { opacity: 0, scale: 0.8 }, 
      { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }, 
      "-=0.4"
    );

    // Animate conceptual image/graphic (e.g., a futuristic orb or abstract shape)
    tl.fromTo(imageRef.current,
      { opacity: 0, scale: 0.5, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'power3.out' },
      "-=0.6"
    );

    // Subtle floating animation for the image
    gsap.to(imageRef.current, {
      y: "-=15px",
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 2 // Start after initial animations
    });

  }, []);

  return (
    <section ref={heroRef} id="hero" className="min-h-screen flex items-center justify-center relative pt-20 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center text-center md:text-left">
        <div className="space-y-6 md:space-y-8">
          <h1 ref={titleRef} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="block">Future of AI</span>
            <span className="block text-cyan-400">Is Here. Today.</span>
          </h1>
          <p ref={subtitleRef} className="text-lg sm:text-xl text-slate-300 dark:text-slate-400 max-w-xl mx-auto md:mx-0">
            Unlock unparalleled efficiency and innovation with our next-generation AI platform. Transform your business with intelligent solutions designed for tomorrow&apos;s challenges.
          </p>
          <div ref={ctaButtonRef} className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Explore Platform <ArrowRight size={20} className="inline ml-2" />
            </button>
            <button className="bg-slate-700/50 dark:bg-slate-700 hover:bg-slate-600 dark:hover:bg-slate-600 text-slate-100 dark:text-slate-200 font-semibold py-3 px-8 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              Request Demo
            </button>
          </div>
        </div>
        <div ref={imageRef} className="hidden md:flex justify-center items-center mt-10 md:mt-0">
          {/* Conceptual Futuristic Graphic */}
          <div className="relative w-80 h-80 lg:w-96 lg:h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-cyan-500 to-green-400 rounded-full opacity-30 dark:opacity-50 filter blur-2xl"></div>
            <Bot size={180} className="absolute inset-0 m-auto text-cyan-300/70 dark:text-cyan-400/80 opacity-80 transform scale-x-[-1]" />
            <div className="absolute w-full h-full border-2 border-cyan-500/30 dark:border-cyan-500/50 rounded-full animate-spin-slow"></div>
            <div className="absolute w-3/4 h-3/4 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-purple-500/30 dark:border-purple-500/50 rounded-full animate-ping-slow opacity-70"></div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
        <ChevronDown size={32} className="text-cyan-400" />
      </div>
    </section>
  );
};

// Features Section Component
const FeaturesSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

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
            start: 'top 85%', // Start animation when 85% of the card is visible
            toggleActions: 'play none none none', // Play animation once
            // markers: true, // For debugging
          }
        }
      );
    });
  }, []);

  return (
    <section ref={sectionRef} id="features" className="py-16 sm:py-24 bg-slate-800/30 dark:bg-slate-800/50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Revolutionize Your Workflow
          </h2>
          <p className="text-lg text-slate-300 dark:text-slate-400 max-w-2xl mx-auto">
            Discover the powerful capabilities that set our AI platform apart. Built for performance, scalability, and seamless integration.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuresData.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card bg-slate-700/50 dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-cyan-500/20 dark:hover:shadow-cyan-400/30 transition-shadow duration-300 transform hover:-translate-y-1"
            >
              <IconWrapper className="mb-4 bg-slate-600/70 dark:bg-slate-700">
                {feature.icon}
              </IconWrapper>
              <h3 className="text-xl font-semibold mb-2 text-white dark:text-white">{feature.title}</h3>
              <p className="text-sm text-slate-300 dark:text-slate-400">{feature.description}</p>
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
      { opacity: 0, y:30 },
      { opacity: 1, y:0, duration: 0.8, scrollTrigger: { trigger: titleRef.current, start: "top 80%"}}
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
                    background: `rgba(${Math.random()*100 + 100}, ${Math.random()*155 + 100}, 255, ${Math.random()*0.3 + 0.2})`,
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
