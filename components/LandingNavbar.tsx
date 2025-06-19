"use client";


import React, { useRef, useState, useEffect } from 'react';
import { Sun, Moon, Crown } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser
} from '@clerk/nextjs';
import Link from 'next/link';

// Enhanced LandingNavbar Component
const LandingNavbar: React.FC<{
  scrollToSection: (id: string) => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
}> = ({ scrollToSection, darkMode, setDarkMode }) => {
  const navRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Use Clerk's useUser hook for client-side authentication
  const { isSignedIn } = useUser();

  useEffect(() => {
    // Animation using GSAP (assuming it's imported elsewhere)
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(navRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.5 }
      );
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'features', label: 'Features' },
    { id: 'showcase', label: 'Showcase' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-slate-800/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl'
        : 'bg-transparent'
        }`}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-3xl font-bold tracking-tight flex items-center">
          <span className="text-cyan-400">AI</span>
          <span className="dark:text-white text-slate-800">SaaS</span>
          {isSignedIn && (
            <div className="ml-3 flex items-center">
              <Crown size={20} className="text-yellow-400 mr-1" />
              <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent font-semibold">
                PREMIUM
              </span>
            </div>
          )}
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
            {darkMode ?
              <Sun size={20} className="text-yellow-400" /> :
              <Moon size={20} className="text-slate-600" />
            }
          </button>

          {isSignedIn ? (
            <div className="flex items-center space-x-3">
              <SignedIn>
                <UserButton />
              </SignedIn>
              <Link href="/dashboard" className="text-sm font-medium text-cyan-400 hover:text-cyan-500 transition-colors">
                Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <SignedOut>
                <SignInButton >
                  Sign In
                </SignInButton>
                <SignUpButton>
                  Sign Up
                </SignUpButton>
              </SignedOut>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;