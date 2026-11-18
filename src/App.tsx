/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Users,
  UserCheck,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Menu,
  X as CloseIcon,
  GraduationCap,
  Sparkles,
  FileText,
  Bookmark,
  Heart,
  Share2,
  CheckCircle2,
  Compass,
  MessageCircle,
  Clock,
  ArrowUpRight,
  Paperclip,
  Search,
  Check,
  Shield,
  LogOut,
  User as UserIcon,
  BarChart2,
  Zap,
  Mail
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { LegalTrustModal, LegalDocType } from './components/LegalTrustModal';
import { StudentOnboarding } from './components/StudentOnboarding';
import { StudentDashboard } from './components/StudentDashboard';

export default function App() {
  const { user, profile, loading, onboardingCompleted, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocType>('terms');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'landing'>('dashboard');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Open legal / trust modal directly to a specific document (e.g. 'contact', 'faqs', 'terms')
  const openLegal = (doc: LegalDocType) => {
    setActiveLegalDoc(doc);
    setLegalModalOpen(true);
  };

  // Handle route /signup or #signup or #login
  useEffect(() => {
    if (window.location.pathname === '/signup' || window.location.hash === '#signup') {
      setAuthMode('signup');
      setAuthModalOpen(true);
    } else if (window.location.pathname === '/login' || window.location.hash === '#login') {
      setAuthMode('login');
      setAuthModalOpen(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAuthModalOpen(false);
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const openAuth = (mode: 'login' | 'signup' = 'signup', e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const openSignup = (e?: React.MouseEvent) => openAuth('signup', e);
  const openLogin = (e?: React.MouseEvent) => openAuth('login', e);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // User is logged in, but has NOT completed onboarding -> force locked to Onboarding!
  if (user && !onboardingCompleted && !loading) {
    return <StudentOnboarding />;
  }

  // User is logged in AND completed onboarding -> direct route to Student Dashboard
  if (user && onboardingCompleted && activeView === 'dashboard' && !loading) {
    return (
      <StudentDashboard
        onViewLanding={() => setActiveView('landing')}
      />
    );
  }

  const avatarPhoto = (profile?.photoURL || user?.photoURL || '') as string;

  return (
    <div className="min-h-screen bg-[#090B0E] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#7C3AED] selection:text-white bg-academic-grid overflow-x-hidden w-full max-w-full relative">
      
      {/* Infinite Moving Top Marquee Ticker (Dark Theme) */}
      <div className="bg-[#06080B] text-[#F8FAFC] text-xs font-mono font-bold py-2.5 border-b-2 border-[#1E2536] overflow-hidden whitespace-nowrap select-none">
        <div className="animate-marquee flex items-center gap-6">
          <div className="flex items-center gap-6 shrink-0">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]"></span>
              LEARNLOOM // MADE FOR ALL STUDENTS
            </span>
            <span className="text-[#F59E0B]">✦</span>
            <span className="text-[#F59E0B]">CONNECT & SHARE KNOWLEDGE</span>
            <span className="text-[#7C3AED]">✦</span>
            <span className="text-[#F29AB5]">100% FREE FOR ALL STUDENTS</span>
            <span className="text-[#315BFF]">✦</span>
            <span className="text-[#315BFF]">JOIN STUDY CIRCLES</span>
            <span className="text-white">✦</span>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]"></span>
              LEARNLOOM // MADE FOR ALL STUDENTS
            </span>
            <span className="text-[#F59E0B]">✦</span>
            <span className="text-[#F59E0B]">CONNECT & SHARE KNOWLEDGE</span>
            <span className="text-[#7C3AED]">✦</span>
            <span className="text-[#F29AB5]">100% FREE FOR ALL STUDENTS</span>
            <span className="text-[#315BFF]">✦</span>
            <span className="text-[#315BFF]">JOIN STUDY CIRCLES</span>
            <span className="text-white">✦</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          NAVBAR (Ultra-Clean, Professional Header - ONLY LOGO ON PAGE)
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#090B0E]/95 backdrop-blur-md border-b border-[#1E2330] w-full">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Zone 1: Official Logo + Brand Lockup (ONLY CIRCULAR LOGO ON ENTIRE PAGE) */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group select-none shrink-0"
            aria-label="LearnLoom Home"
          >
            <div className="relative shrink-0">
              <img
                src="/assets/aistudio/Abstract_Ribbon_M_Emblem_4a31ed28.png"
                alt="LearnLoom Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full border border-white/10 bg-[#090B0E] p-0.5 shadow-sm transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white leading-none">
                LearnLoom
              </span>
              <span className="hidden sm:inline-block text-[9px] font-mono font-medium tracking-widest text-[#71767B] uppercase mt-0.5">
                STUDENT NETWORK
              </span>
            </div>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-display font-medium text-xs sm:text-sm tracking-wide text-[#94A3B8]" aria-label="Main Navigation">
            <a
              href="#capabilities"
              onClick={(e) => scrollToSection(e, 'capabilities')}
              className="hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a
              href="#about"
              onClick={(e) => scrollToSection(e, 'about')}
              className="hover:text-white transition-colors"
            >
              Why LearnLoom
            </a>
            <a
              href="#contact"
              onClick={(e) => scrollToSection(e, 'contact')}
              className="hover:text-white transition-colors"
            >
              Contact Us
            </a>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className="inline-flex items-center justify-center gap-1.5 font-display font-bold text-xs sm:text-sm bg-white text-black hover:bg-[#E2E8F0] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 p-1 sm:p-1.5 sm:pr-3 rounded-xl bg-[#141923] hover:bg-[#1E2536] border border-[#1E2536] cursor-pointer transition-colors"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-[#222] border border-white/10 flex items-center justify-center shrink-0">
                      {avatarPhoto ? (
                        <img
                          src={avatarPhoto}
                          alt="Avatar"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs select-none">{profile?.avatarIcon || '🎓'}</span>
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-display font-bold text-white leading-tight truncate max-w-[90px] md:max-w-[120px]">
                        {profile?.displayName || user.displayName || user.email?.split('@')[0]}
                      </span>
                      <span className="text-[10px] font-mono text-[#A78BFA] truncate max-w-[90px] md:max-w-[120px]">
                        {profile?.studentClass || 'Student'}
                      </span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#0F1219] border border-[#1E2536] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                      <div className="p-3 bg-[#181E2B] rounded-xl border border-[#232A3B] mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1A1A1A] border border-[#1E2536] flex items-center justify-center shrink-0">
                            {avatarPhoto ? (
                              <img
                                src={avatarPhoto}
                                alt="Profile"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl">{profile?.avatarIcon || '🎓'}</span>
                            )}
                          </div>
                          <div className="truncate">
                            <div className="font-display font-bold text-sm text-white truncate">
                              {profile?.displayName || user.displayName || 'LearnLoom Member'}
                            </div>
                            <div className="text-[11px] font-mono text-[#A78BFA] truncate">
                              {profile?.studentClass || 'Student'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-mono text-[#71767B] truncate mt-1">
                          {user.email}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setActiveView('dashboard');
                        }}
                        className="w-full mb-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span>Open Dashboard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/40 font-mono text-xs font-bold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openLogin}
                  className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-mono font-medium text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={openSignup}
                  className="px-4 py-2 rounded-full bg-white text-black hover:bg-[#E2E8F0] font-display font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-[#1E2536] bg-[#141923] text-white hover:bg-[#1E2536] transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <CloseIcon className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-[#1E2536] bg-[#0F1219] px-4 sm:px-6 py-5 sm:py-6 shadow-brutal-lg animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col gap-3 font-display font-medium text-sm">
              <a
                href="#capabilities"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  scrollToSection(e, 'capabilities');
                }}
                className="p-3 bg-[#141923] text-[#F8FAFC] rounded-xl border border-[#1E2536] hover:bg-[#1E2536] transition-colors"
              >
                How It Works
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  scrollToSection(e, 'about');
                }}
                className="p-3 bg-[#141923] text-[#F8FAFC] rounded-xl border border-[#1E2536] hover:bg-[#1E2536] transition-colors"
              >
                Why LearnLoom
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  scrollToSection(e, 'contact');
                }}
                className="p-3 bg-[#141923] text-[#F8FAFC] rounded-xl border border-[#1E2536] hover:bg-[#1E2536] transition-colors"
              >
                Contact Us
              </a>
              
              {user ? (
                <div className="mt-2 p-3 bg-[#181E2B] rounded-xl border border-[#1E2536]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1A1A1A] border border-[#1E2536] flex items-center justify-center shrink-0">
                      {avatarPhoto ? (
                        <img
                          src={avatarPhoto}
                          alt="Profile"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl p-1">{profile?.avatarIcon || '🚀'}</span>
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-bold text-white truncate">
                        {profile?.displayName || user.displayName || 'LearnLoom Student'}
                      </div>
                      <div className="text-xs font-mono text-[#F59E0B] truncate">
                        {profile?.studentClass || 'Student'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setActiveView('dashboard');
                    }}
                    className="w-full mb-2 py-2.5 bg-white text-black font-display font-bold text-xs rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/40 rounded-full text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      openSignup(e);
                    }}
                    className="w-full text-center font-display font-bold text-sm bg-white text-black py-3 rounded-full cursor-pointer shadow-sm"
                  >
                    Get Started Free
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      openLogin(e);
                    }}
                    className="w-full text-center font-display font-bold text-sm bg-[#141923] text-white border border-[#232938] py-2.5 rounded-full cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* =========================================================================
            HERO SECTION (Clean, Student-Friendly, High-Energy)
           ========================================================================= */}
        <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-36 overflow-hidden border-b border-[#1E2330]">
          {/* Ambient Lighting Gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[380px] bg-gradient-to-b from-[#315BFF]/12 via-[#7C3AED]/6 to-transparent blur-3xl pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
            
            {/* Minimalist Authority Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md text-[#94A3B8] text-xs font-medium tracking-wide mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>STUDENT STUDY NETWORK · 100% FREE</span>
            </div>

            {/* Hero Headline */}
            <h1 className="font-display font-semibold text-4xl sm:text-6xl md:text-7xl tracking-tight text-white leading-[1.1] max-w-3xl mb-6">
              Ask tough doubts. Learn faster together.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-[#94A3B8] max-w-2xl leading-relaxed mb-10 font-normal">
              Stuck on a tricky math problem, physics derivation, or code bug? Post your doubt, get step-by-step explanations from fellow students, and test yourself with daily MCQs.
            </p>

            {/* Centered Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-16">
              {user && onboardingCompleted ? (
                <button
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#0A0D14] font-medium text-sm hover:bg-[#E2E8F0] transition-colors cursor-pointer shadow-sm"
                >
                  <span>Launch Study Feed</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={openSignup}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#0A0D14] font-medium text-sm hover:bg-[#E2E8F0] transition-colors cursor-pointer shadow-sm"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#capabilities"
                    onClick={(e) => scrollToSection(e, 'capabilities')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#121622] text-[#F1F5F9] border border-[#232938] font-medium text-sm hover:bg-[#1A202E] hover:border-[#333C52] transition-colors cursor-pointer"
                  >
                    <span>See How It Works</span>
                  </a>
                </>
              )}
            </div>

            {/* Genuine Student Commitments (Zero Fake Claims) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 pt-10 border-t border-[#1E2330] w-full max-w-2xl text-center">
              <div>
                <div className="font-display font-semibold text-lg text-white">100% Free Forever</div>
                <div className="text-xs text-[#64748B] mt-1">No subscriptions, no paid locks. Made for students.</div>
              </div>
              <div>
                <div className="font-display font-semibold text-lg text-white">Real Peer Explanations</div>
                <div className="text-xs text-[#64748B] mt-1">Step-by-step logic from peers who just solved it</div>
              </div>
              <div>
                <div className="font-display font-semibold text-lg text-white">7-Day Fresh Discussions</div>
                <div className="text-xs text-[#64748B] mt-1">Active weekly syllabus, zero outdated dead threads</div>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            HOW IT WORKS (Simple, Practical, Student-Focused Bento)
           ========================================================================= */}
        <section id="capabilities" className="py-20 sm:py-28 border-b border-[#1E2330]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            
            <div className="text-center mb-16">
              <span className="text-xs font-mono font-medium text-[#64748B] uppercase tracking-widest">
                HOW IT WORKS
              </span>
              <h2 className="font-display font-semibold text-3xl sm:text-4xl text-white tracking-tight mt-2">
                Simple tools to help you study better.
              </h2>
              <p className="text-[#94A3B8] text-base max-w-xl mx-auto mt-3">
                No doomscrolling, no reels, no brainrot. Just quick help and active recall practice whenever you get stuck.
              </p>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Ask & Solve Doubts */}
              <div className="bg-[#0B0E14] border border-[#1E2330] rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#2D364A] transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#141924] border border-[#232B3C] flex items-center justify-center text-[#38BDF8] mb-5">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-medium text-xl text-white mb-2">
                    Ask & Solve Doubts
                  </h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed mb-6 font-normal">
                    Snap a photo of your notebook or type out equations. Get clear, step-by-step answers from students preparing for the same syllabus.
                  </p>
                </div>

                {/* Micro-Card */}
                <div className="bg-[#07090D] border border-[#1E2330] rounded-xl p-4 text-xs">
                  <div className="flex items-center justify-between text-[#64748B] text-[11px] font-mono mb-2">
                    <span>CALCULUS · DERIVATIVES</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> SOLVED
                    </span>
                  </div>
                  <div className="text-[#E2E8F0] font-mono mb-1.5">
                    d/dx [sin²(x)] = 2·sin(x)·cos(x) = sin(2x)
                  </div>
                  <p className="text-[#64748B] text-[11px]">
                    Verified by peer student using chain rule & double-angle identity.
                  </p>
                </div>
              </div>

              {/* Card 2: Daily MCQs & Practice Polls */}
              <div className="bg-[#0B0E14] border border-[#1E2330] rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#2D364A] transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#141924] border border-[#232B3C] flex items-center justify-center text-emerald-400 mb-5">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-medium text-xl text-white mb-2">
                    Daily MCQs & Quick Polls
                  </h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed mb-6 font-normal">
                    Test your memory with fast 10-second quizzes. See live percentages of what other students picked and learn from mistakes together.
                  </p>
                </div>

                {/* Micro-Card: Live Distribution */}
                <div className="bg-[#07090D] border border-[#1E2330] rounded-xl p-4 text-xs space-y-2">
                  <div className="text-[#E2E8F0] font-medium text-[11px] mb-2">
                    Action-reaction force pairs always act on:
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 flex items-center justify-between text-emerald-300 font-mono text-[11px]">
                    <span>Two different bodies</span>
                    <span className="font-bold">84% (Correct)</span>
                  </div>
                  <div className="bg-[#0E121B] border border-[#1E2330] rounded-lg p-2 flex items-center justify-between text-[#64748B] font-mono text-[11px]">
                    <span>The same single body</span>
                    <span>16%</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Fresh 7-Day Stream */}
              <div className="bg-[#0B0E14] border border-[#1E2330] rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#2D364A] transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#141924] border border-[#232B3C] flex items-center justify-center text-[#F59E0B] mb-5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-medium text-xl text-white mb-2">
                    Fresh 7-Day Stream
                  </h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed font-normal">
                    Doubt threads naturally refresh after 7 days. You only see active questions matching what students are revising right now, not outdated threads from 3 years ago.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#1E2330] flex items-center gap-2 text-xs font-mono text-[#64748B]">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <span>Automatic cleanup keeps your feed uncluttered and relevant</span>
                </div>
              </div>

              {/* Card 4: Subject & Exam Filters */}
              <div className="bg-[#0B0E14] border border-[#1E2330] rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#2D364A] transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#141924] border border-[#232B3C] flex items-center justify-center text-[#A78BFA] mb-5">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-medium text-xl text-white mb-2">
                    Pick Your Subject Cohort
                  </h3>
                  <p className="text-sm text-[#94A3B8] leading-relaxed font-normal">
                    Filter by Engineering, Medical (NEET), Coding, Pure Sciences, or Commerce. You only collaborate with peers working through your exact course syllabus.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#1E2330] flex items-center gap-2 text-xs font-mono text-[#64748B]">
                  <span className="w-2 h-2 rounded-full bg-[#A78BFA]" />
                  <span>Zero clutter from unrelated subjects or other grades</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* =========================================================================
            WHY LEARNLOOM (Distraction-Free Study Space)
           ========================================================================= */}
        <section id="about" className="py-20 sm:py-28 border-b border-[#1E2330]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#232938] bg-[#0E121B] text-[#94A3B8] text-xs font-medium mb-4">
              <span>WHY LEARNLOOM</span>
            </div>
            
            <h2 className="font-display font-semibold text-3xl sm:text-4xl text-white tracking-tight mb-4">
              Built for students, not for mindless scrolling.
            </h2>
            <p className="text-[#94A3B8] text-base max-w-xl mx-auto mb-14 font-normal">
              Most social apps try to steal your attention. LearnLoom is built to help you solve your doubt quickly so you can get back to your study desk.
            </p>

            {/* 3 Core Principles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              
              <div className="bg-[#0E121B] border border-[#1E2330] rounded-xl p-6 hover:border-[#2D364A] transition-colors">
                <div className="text-xs font-mono text-[#64748B] mb-2">01 / PURE STUDY, ZERO NOISE</div>
                <h3 className="font-display font-medium text-lg text-white mb-2">No Distractions</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed font-normal">
                  No influencers, no dance reels, and no addictive algorithms. Every post is an honest question, clean solution, or helpful study poll.
                </p>
              </div>

              <div className="bg-[#0E121B] border border-[#1E2330] rounded-xl p-6 hover:border-[#2D364A] transition-colors">
                <div className="text-xs font-mono text-[#64748B] mb-2">02 / CLEAR & INTUITIVE</div>
                <h3 className="font-display font-medium text-lg text-white mb-2">Peer Explanations</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed font-normal">
                  Textbook explanations can be rigid. Fellow students explain concepts in relatable everyday language so tough concepts finally make sense.
                </p>
              </div>

              <div className="bg-[#0E121B] border border-[#1E2330] rounded-xl p-6 hover:border-[#2D364A] transition-colors">
                <div className="text-xs font-mono text-[#64748B] mb-2">03 / COMPLETELY OPEN</div>
                <h3 className="font-display font-medium text-lg text-white mb-2">100% Free Always</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed font-normal">
                  No subscriptions, no blurred out answers, and no premium traps. Built by students, for every student everywhere.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* =========================================================================
            CONTACT US & DIRECT INQUIRIES (Popup-Driven, Real Official Channels)
           ========================================================================= */}
        <section id="contact" className="py-20 sm:py-28 border-b border-[#1E2330]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#232938] bg-[#0E121B] text-[#94A3B8] text-xs font-medium mb-4">
              <span>GET IN TOUCH</span>
            </div>
            
            <h2 className="font-display font-semibold text-3xl sm:text-4xl text-white tracking-tight mb-4">
              Have a question, feedback, or idea?
            </h2>
            <p className="text-[#94A3B8] text-base max-w-xl mx-auto mb-10 font-normal">
              Whether you need help, want a new subject added, or found a glitch — write to us anytime. We read and answer every student message.
            </p>

            {/* 3 Minimal Direct Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 max-w-2xl mx-auto gap-3.5 text-left mb-10">
              
              <a
                href="mailto:imsaud.apk@gmail.com"
                className="group p-4 rounded-xl bg-[#0E121B] border border-[#1E2330] hover:border-[#3B82F6] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono text-[#64748B] mb-1">OFFICIAL EMAIL</div>
                  <div className="font-medium text-xs text-white group-hover:text-[#60A5FA] truncate">imsaud.apk@gmail.com</div>
                  <div className="text-[11px] text-[#94A3B8] mt-1">Direct student inquiries</div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[#64748B] group-hover:text-white transition-colors">
                  <span>Send Mail</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </a>

              <a
                href="https://x.com/saud_apk"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl bg-[#0E121B] border border-[#1E2330] hover:border-white transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono text-[#64748B] mb-1">X (TWITTER)</div>
                  <div className="font-medium text-xs text-white group-hover:text-white">@saud_apk</div>
                  <div className="text-[11px] text-[#94A3B8] mt-1">Founder updates & DMs</div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[#64748B] group-hover:text-white transition-colors">
                  <span>Connect</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </a>

              <a
                href="https://wa.me/917378633612"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl bg-[#0E121B] border border-[#1E2330] hover:border-emerald-500 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono text-[#64748B] mb-1">WHATSAPP</div>
                  <div className="font-medium text-xs text-white group-hover:text-emerald-400">+91 73786 33612</div>
                  <div className="text-[11px] text-[#94A3B8] mt-1">Instant student feedback</div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[#64748B] group-hover:text-white transition-colors">
                  <span>Message</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </a>

            </div>

            {/* Direct Message Popup Trigger Card (No messy inline form!) */}
            <div className="max-w-xl mx-auto text-center bg-[#0B0E14] border border-[#1E2330] rounded-2xl p-8 sm:p-10 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-display font-medium text-xl text-white mb-2">
                Need Help or Want to Share Feedback?
              </h3>
              <p className="text-sm text-[#94A3B8] max-w-md mx-auto mb-6 leading-relaxed">
                Click below to open our interactive contact form. It directly dispatches to our official inbox at <span className="text-white font-medium">imsaud.apk@gmail.com</span>.
              </p>
              <button
                type="button"
                onClick={() => openLegal('contact')}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#0A0D14] hover:bg-[#E2E8F0] font-medium text-sm transition-all cursor-pointer shadow-md hover:scale-[1.01]"
              >
                <Mail className="w-4 h-4" />
                <span>Open Contact Form</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-[#64748B] mt-4">
                You can also find it in the footer under Support & Help → Contact Us
              </p>
            </div>

          </div>
        </section>

        {/* =========================================================================
            FINAL CALLOUT (Centered, Elegant Dark Surface)
           ========================================================================= */}
        <section className="py-20 sm:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            
            <h2 className="font-display font-semibold text-3xl sm:text-5xl text-white tracking-tight mb-4">
              Ready to solve your next doubt?
            </h2>
            <p className="text-[#94A3B8] text-base sm:text-lg max-w-xl mx-auto mb-8 font-normal">
              Join thousands of students learning together. Free forever, no credit card required.
            </p>

            {user && onboardingCompleted ? (
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#0A0D14] font-medium text-sm hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              >
                <span>Launch Study Feed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={openSignup}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#0A0D14] font-medium text-sm hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              >
                <span>Get Started Now — It's Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

          </div>
        </section>

      </main>

      {/* =========================================================================
          FOOTER (Centered, Minimalist, No Logo, Comprehensive Legal & Trust Directory)
         ========================================================================= */}
      <footer className="bg-[#07090D] pt-16 pb-12 text-white border-t border-[#1E2330]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          {/* Top Row: Wordmark, Primary Nav, and Socials */}
          <div className="flex flex-col items-center text-center pb-12 border-b border-[#1E2330]">
            <span className="font-display font-semibold text-xl tracking-tight text-white block">
              LearnLoom
            </span>
            <span className="text-xs text-[#64748B] mt-1 block max-w-md">
              The real-time peer study network for ambitious students.
            </span>

            {/* Quick Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-[#94A3B8] mt-6">
              <a
                href="#capabilities"
                onClick={(e) => scrollToSection(e, 'capabilities')}
                className="hover:text-white transition-colors"
              >
                How It Works
              </a>
              <a
                href="#about"
                onClick={(e) => scrollToSection(e, 'about')}
                className="hover:text-white transition-colors"
              >
                Why LearnLoom
              </a>
              <a
                href="#contact"
                onClick={(e) => scrollToSection(e, 'contact')}
                className="hover:text-white transition-colors"
              >
                Contact Us
              </a>
              {user && onboardingCompleted ? (
                <button
                  type="button"
                  onClick={() => setActiveView('dashboard')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openLogin}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Social Icons */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <a
                href="https://x.com/saud_apk"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#0E121B] border border-[#1E2330] flex items-center justify-center text-[#94A3B8] hover:text-white hover:border-[#333C52] transition-colors"
                aria-label="X Profile"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/_flx.saud/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#0E121B] border border-[#1E2330] flex items-center justify-center text-[#94A3B8] hover:text-[#F43F5E] hover:border-[#333C52] transition-colors"
                aria-label="Instagram Profile"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Middle Row: The 10 Legal, Trust & Safety Directory Columns */}
          <div className="py-12 grid grid-cols-2 sm:grid-cols-4 gap-8 text-left text-xs">
            
            {/* Column 1: Legal & Compliance */}
            <div>
              <div className="font-mono text-[11px] font-semibold text-white uppercase tracking-wider mb-4">
                Legal & Policy
              </div>
              <ul className="space-y-2.5 text-[#94A3B8]">
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('terms')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('privacy')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('cookies')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Cookie Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('disclaimer')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Academic Disclaimer
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('data-protection')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Data Protection Protocol
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Trust & Platform Safety */}
            <div>
              <div className="font-mono text-[11px] font-semibold text-white uppercase tracking-wider mb-4">
                Trust & Safety
              </div>
              <ul className="space-y-2.5 text-[#94A3B8]">
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('security')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Security & Infrastructure
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('guidelines')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Community Guidelines
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('report')}
                    className="text-red-400 hover:text-red-300 font-medium transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <span>Report Abuse</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Support & Help Center */}
            <div>
              <div className="font-mono text-[11px] font-semibold text-white uppercase tracking-wider mb-4">
                Support & Help
              </div>
              <ul className="space-y-2.5 text-[#94A3B8]">
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('faqs')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Help Center / FAQs
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openLegal('contact')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <a
                    href="mailto:imsaud.apk@gmail.com"
                    className="hover:text-white transition-colors text-left block text-[#64748B]"
                  >
                    imsaud.apk@gmail.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Platform Integrity */}
            <div>
              <div className="font-mono text-[11px] font-semibold text-white uppercase tracking-wider mb-4">
                Platform Status
              </div>
              <div className="p-3.5 rounded-xl bg-[#0E121B] border border-[#1E2330] space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>All Systems Operational</span>
                </div>
                <div className="text-[#64748B] text-[10px] leading-tight">
                  Real-time Firestore sync & encrypted academic delivery.
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Guarantee */}
          <div className="pt-8 border-t border-[#1E2330] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
            <div>
              © 2026 LearnLoom. Open academic network for verified peer collaboration.
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>100% Free For All Students</span>
              <span>·</span>
              <span>No Ad Tracking</span>
            </div>
          </div>

        </div>
      </footer>

      {/* =========================================================================
          AUTH MODAL (Sign Up & Log In, Google Recommended, Clean, No Forgot PW)
         ========================================================================= */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      {/* =========================================================================
          LEGAL & TRUST MODAL (All 10 Legal, Trust & Safety Documents)
         ========================================================================= */}
      <LegalTrustModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialDoc={activeLegalDoc}
      />

    </div>
  );
}
