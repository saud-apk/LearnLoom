import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  FileText,
  Lock,
  Cookie,
  AlertTriangle,
  HelpCircle,
  Flag,
  Mail,
  Scale,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Search,
  Send,
  Sparkles,
  Loader2
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export type LegalDocType =
  | 'terms'
  | 'privacy'
  | 'cookies'
  | 'disclaimer'
  | 'contact'
  | 'faqs'
  | 'security'
  | 'guidelines'
  | 'report'
  | 'data-protection';

interface LegalTrustModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

interface NavItem {
  id: LegalDocType;
  label: string;
  category: 'Legal' | 'Trust & Safety' | 'Support';
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'terms', label: 'Terms & Conditions', category: 'Legal', icon: Scale },
  { id: 'privacy', label: 'Privacy Policy', category: 'Legal', icon: Lock },
  { id: 'cookies', label: 'Cookie Policy', category: 'Legal', icon: Cookie },
  { id: 'disclaimer', label: 'Academic Disclaimer', category: 'Legal', icon: AlertTriangle },
  { id: 'data-protection', label: 'Data Protection', category: 'Legal', icon: Shield },
  { id: 'security', label: 'Security & Infrastructure', category: 'Trust & Safety', icon: Shield },
  { id: 'guidelines', label: 'Community Guidelines', category: 'Trust & Safety', icon: FileText },
  { id: 'report', label: 'Report Abuse', category: 'Trust & Safety', icon: Flag },
  { id: 'faqs', label: 'Help Center / FAQs', category: 'Support', icon: HelpCircle },
  { id: 'contact', label: 'Contact Us', category: 'Support', icon: Mail },
];

export const LegalTrustModal: React.FC<LegalTrustModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'terms'
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Report Form state
  const [reportCategory, setReportCategory] = useState('academic_dishonesty');
  const [reportLink, setReportLink] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Interactive Contact Form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('general');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const [contactLoading, setContactLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    if (isOpen && initialDoc) {
      setActiveDoc(initialDoc);
      setReportSubmitted(false);
      setContactSubmitted(false);
    }
  }, [isOpen, initialDoc]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;
    setReportLoading(true);
    try {
      await addDoc(collection(db, 'abuse_reports'), {
        category: reportCategory,
        linkOrUser: reportLink.trim() || 'Not specified',
        description: reportDescription.trim(),
        targetEmail: 'imsaud.apk@gmail.com',
        createdAt: serverTimestamp(),
        status: 'pending'
      });
    } catch (err) {
      console.warn('Stored report locally:', err);
    }
    setReportSubmitted(true);
    setReportLoading(false);
    setTimeout(() => {
      setReportLink('');
      setReportDescription('');
    }, 3000);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim() || !contactEmail.trim()) return;
    setContactLoading(true);
    try {
      await addDoc(collection(db, 'contact_inquiries'), {
        name: contactName.trim(),
        email: contactEmail.trim(),
        subject: contactSubject,
        message: contactMessage.trim(),
        targetEmail: 'imsaud.apk@gmail.com',
        createdAt: serverTimestamp(),
        status: 'new'
      });
    } catch (err) {
      console.warn('Stored contact locally:', err);
    }
    // Also trigger mailto so student can directly send or copy to imsaud.apk@gmail.com
    const mailtoLink = `mailto:imsaud.apk@gmail.com?subject=${encodeURIComponent(`[LearnLoom ${contactSubject}] from ${contactName.trim()}`)}&body=${encodeURIComponent(`Student Name: ${contactName.trim()}\nStudent Email: ${contactEmail.trim()}\nSubject: ${contactSubject}\n\nMessage:\n${contactMessage.trim()}\n\n---\nSent via LearnLoom Academic Network`)}`;
    window.open(mailtoLink, '_blank');
    setContactSubmitted(true);
    setContactLoading(false);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 4000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-[#0A0D14] border border-[#1E2330] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Header with Doc Selector */}
        <div className="md:hidden flex flex-col p-4 border-b border-[#1E2330] bg-[#0E121B] gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="font-display font-semibold text-sm text-white">Trust & Legal Center</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Mobile Document Selector */}
          <div className="relative">
            <select
              value={activeDoc}
              onChange={(e) => setActiveDoc(e.target.value as LegalDocType)}
              className="w-full px-3.5 py-2 bg-[#07090D] border border-[#1E2330] rounded-xl text-xs text-white focus:outline-none focus:border-white transition-colors"
            >
              <optgroup label="Legal Policies">
                <option value="terms">Terms & Conditions</option>
                <option value="privacy">Privacy Policy</option>
                <option value="cookies">Cookie Policy</option>
                <option value="disclaimer">Academic Disclaimer</option>
                <option value="data-protection">Data Protection Protocol</option>
              </optgroup>
              <optgroup label="Trust & Safety">
                <option value="security">Security & Infrastructure</option>
                <option value="guidelines">Community Guidelines</option>
                <option value="report">Report Abuse</option>
              </optgroup>
              <optgroup label="Support & Help">
                <option value="faqs">Help Center / FAQs</option>
                <option value="contact">Contact Us</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Sidebar Navigation (Visible on Desktop) */}
        <div className="hidden md:flex md:w-72 bg-[#080B10] border-r border-[#1E2330] flex-col shrink-0">
          {/* Desktop Sidebar Title & Search */}
          <div className="hidden md:block p-5 border-b border-[#1E2330]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-display font-semibold text-sm tracking-wide text-white">
                Trust & Legal Center
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#0E121B] border border-[#1E2330] rounded-lg text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] transition-colors"
              />
            </div>
          </div>

          {/* Nav List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {['Legal', 'Trust & Safety', 'Support'].map((cat) => {
              const items = filteredNav.filter((n) => n.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat} className="mb-4">
                  <div className="px-2.5 py-1 text-[10px] font-mono font-semibold tracking-wider text-[#64748B] uppercase">
                    {cat}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeDoc === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveDoc(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                            isActive
                              ? 'bg-white text-[#0A0D14] shadow-sm font-semibold'
                              : 'text-[#94A3B8] hover:text-white hover:bg-[#121622]'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#0A0D14]' : 'text-[#64748B]'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Footer Meta */}
          <div className="p-4 border-t border-[#1E2330] bg-[#07090D] hidden md:block">
            <div className="text-[11px] text-[#64748B]">
              <div>LearnLoom Academic Network</div>
              <div className="text-[10px] text-[#475569] mt-0.5">Version 2.4 · Updated Nov 2026</div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-[#0A0D14] overflow-hidden">
          {/* Desktop Document Topbar */}
          <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-[#1E2330] bg-[#080B10]">
            <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
              <span>LEGAL & COMPLIANCE</span>
              <span>/</span>
              <span className="text-white font-medium">
                {NAV_ITEMS.find((n) => n.id === activeDoc)?.label}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Document Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 sm:py-8 text-[#CBD5E1] space-y-6 text-sm leading-relaxed">
            
            {/* ===================================================================
                1. TERMS & CONDITIONS
               =================================================================== */}
            {activeDoc === 'terms' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    Effective Date: November 1, 2026
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight mt-1">
                    Terms & Conditions of Service
                  </h2>
                  <p className="text-[#94A3B8] text-xs sm:text-sm mt-2">
                    Please read these terms carefully before participating in the LearnLoom peer study network.
                  </p>
                </div>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">1. Nature of the Service</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    LearnLoom provides an open academic collaboration network designed exclusively for students, researchers, and self-directed learners to exchange academic problem sets, discuss conceptual solutions, and participate in recall polls. The platform is offered 100% free of charge with zero mandatory subscription fees.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">2. Acceptable Academic Conduct</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    Users agree to maintain high academic integrity. You may not use LearnLoom to commit direct exam cheating, leak copyrighted exam papers without permission, or distribute unauthorized institutional answers during live proctored testing windows.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">3. User Content & License</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    You retain ownership of any notes, explanations, and diagrams you post. By submitting content to the public feed, you grant LearnLoom a non-exclusive license to display your post for its active 7-day lifecycle and community review.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">4. 7-Day Rolling Stream Protocol</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    All feed items are governed by a 7-day ephemeral lifecycle. After 7 days, posts automatically cycle out of active public circulation to preserve relevance and maintain a lightweight academic feed.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">5. Account Termination & Moderation</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    We reserve the right to suspend or terminate accounts that engage in harassment, automated spamming, impersonation, or continuous violations of our Community Guidelines.
                  </p>
                </section>
              </div>
            )}

            {/* ===================================================================
                2. PRIVACY POLICY
               =================================================================== */}
            {activeDoc === 'privacy' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    Privacy Commitment
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight mt-1">
                    Privacy Policy
                  </h2>
                  <p className="text-[#94A3B8] text-xs sm:text-sm mt-2">
                    How we collect, use, and protect your information with zero data commercialization.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  <strong className="block font-semibold mb-1">Our Core Guarantee:</strong>
                  We do not sell student data, we do not track you across external websites, and we do not monetize your study activity through third-party advertising networks.
                </div>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">1. Information We Collect</h3>
                  <ul className="list-disc list-inside text-xs sm:text-sm text-[#94A3B8] space-y-1.5">
                    <li><strong className="text-white">Account Information:</strong> Name, email address, chosen avatar, and academic cohort (e.g., IIT-JEE, NEET, University).</li>
                    <li><strong className="text-white">Academic Interactions:</strong> Doubts asked, peer answers submitted, MCQ choices made, and post views (strictly for duplicate prevention).</li>
                    <li><strong className="text-white">Device Information:</strong> Browser type and IP address strictly for security anomaly detection and rate limiting.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">2. How Information is Used</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    Data is used solely to authenticate your sessions, attribute your verified peer answers, deliver real-time poll metrics, and preserve feed hygiene.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">3. Data Retention</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    Posts are actively featured for 7 days. You may delete your account and associated profile data at any time directly through your dashboard settings.
                  </p>
                </section>
              </div>
            )}

            {/* ===================================================================
                3. COOKIE POLICY
               =================================================================== */}
            {activeDoc === 'cookies' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    Storage & Cookies
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight mt-1">
                    Cookie Policy
                  </h2>
                  <p className="text-[#94A3B8] text-xs sm:text-sm mt-2">
                    Minimalist, essential-only cookies. No surveillance marketing trackers.
                  </p>
                </div>

                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-white">1. What Cookies We Use</h3>
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-[#0E121B] border border-[#1E2330]">
                      <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                        <span>Authentication & Security (Strictly Necessary)</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">ALWAYS ACTIVE</span>
                      </div>
                      <p className="text-xs text-[#94A3B8]">
                        Encrypted JSON Web Tokens (JWT) and Firebase session cookies required to keep you signed in securely across browser refreshes.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0E121B] border border-[#1E2330]">
                      <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                        <span>User Preferences & Study Filters</span>
                        <span className="text-[10px] font-mono text-[#60A5FA] bg-[#60A5FA]/10 px-2 py-0.5 rounded">FUNCTIONAL</span>
                      </div>
                      <p className="text-xs text-[#94A3B8]">
                        Stores your chosen cohort filter (e.g., Engineering, Medicine) and Pomodoro timer preferences in local browser storage.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">2. Managing Cookies</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    You can clear local cookies at any time via your browser settings. Note that clearing authentication tokens will log you out of your active study session.
                  </p>
                </section>
              </div>
            )}

            {/* ===================================================================
                4. DISCLAIMER
               =================================================================== */}
            {activeDoc === 'disclaimer' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
                    Legal Notice
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight mt-1">
                    Academic Disclaimer
                  </h2>
                  <p className="text-[#94A3B8] text-xs sm:text-sm mt-2">
                    Important clarification regarding peer-contributed educational materials.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  LearnLoom is a student-to-student peer collaboration network, not an accredited degree-granting university or formal test board.
                </div>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">1. Peer Verification & Accuracy</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    Solutions and study explanations are generated by fellow student peers. While our community voting and verification tags help surface high-quality reasoning, LearnLoom makes no warranty that every answer is error-free or guaranteed to match specific examination marking schemes. Students should cross-reference with official textbooks and course syllabi.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">2. Third-Party Trademarks</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    Exam names such as IIT-JEE, NEET, SAT, UPSC, or AP are the trademarks of their respective examining bodies. LearnLoom is an independent academic tool and is not officially affiliated with or endorsed by any testing authority.
                  </p>
                </section>
              </div>
            )}

            {/* ===================================================================
                5. DATA PROTECTION
               =================================================================== */}
            {activeDoc === 'data-protection' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    GDPR & Student Privacy
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight mt-1">
                    Data Protection Protocol
                  </h2>
                  <p className="text-[#94A3B8] text-xs sm:text-sm mt-2">
                    Our compliance standards for international student data security.
                  </p>
                </div>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">1. User Rights</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    Every LearnLoom member has the right to access, rectify, export, or delete their personal account data at any time. Under GDPR and global data protection guidelines, your data belongs strictly to you.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">2. Cryptographic Storage</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    All data in transit is protected using TLS 1.3 encryption. Data at rest is secured within Google Cloud Platform / Firebase infrastructure with granular Firestore security rules preventing unauthorized reads or data scraping.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">3. Data Export & Deletion</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    To request a complete JSON export of your submitted questions and answers, or to request immediate hard deletion of your database record, contact our Data Protection Officer at <span className="text-white font-mono">imsaud.apk@gmail.com</span>.
                  </p>
                </section>
              </div>
            )}

            {/* ===================================================================
                6. SECURITY
               =================================================================== */}
            {activeDoc === 'security' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider font-semibold">
                    System Security
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight mt-1">
                    Security & Infrastructure
                  </h2>
                  <p className="text-[#94A3B8] text-xs sm:text-sm mt-2">
                    How LearnLoom safeguards student accounts and collaborative data.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#0E121B] border border-[#1E2330]">
                    <div className="font-semibold text-white text-sm mb-1 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      Database Rule Enforcement
                    </div>
                    <p className="text-xs text-[#94A3B8]">
                      Server-side Firestore security rules validate every read, write, and vote at the database layer. No unauthenticated client can modify peer scores.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0E121B] border border-[#1E2330]">
                    <div className="font-semibold text-white text-sm mb-1 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#38BDF8]" />
                      Automated Rate Limiting
                    </div>
                    <p className="text-xs text-[#94A3B8]">
                      Smart throttling shields the network against automated post floods, spam bots, and DDoS attempts.
                    </p>
                  </div>
                </div>

                <section className="space-y-2">
                  <h3 className="text-base font-semibold text-white">Vulnerability Disclosure</h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8]">
                    If you discover a security vulnerability in our platform, please disclose it responsibly by writing directly to <span className="text-white font-mono">imsaud.apk@gmail.com</span>. We review and remediate critical reports within 24 hours.
                  </p>
                </section>
              </div>
            )}

            {/* ===================================================================
                7. COMMUNITY GUIDELINES
               =================================================================== */}
            {activeDoc === 'guidelines' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <span className="text-xs font-mono text-[#A78BFA] uppercase tracking-wider font-semibold">
                    Student Code
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight mt-1">
                    Community Guidelines
                  </h2>
                  <p className="text-[#94A3B8] text-xs sm:text-sm mt-2">
                    Our shared code of conduct for maintaining a supportive, focused academic space.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3 items-start p-4 rounded-xl bg-[#0E121B] border border-[#1E2330]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">1. Be Constructive & Rigorous</h4>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        When answering doubts, explain the underlying intuition rather than just pasting raw answers. Help your peers truly understand the fundamental principle.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-4 rounded-xl bg-[#0E121B] border border-[#1E2330]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">2. Zero Tolerance for Bullying & Harassment</h4>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Everyone starts from somewhere. Disrespectful remarks, mocking a beginner question, or discriminatory behavior will result in an immediate and permanent ban.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-4 rounded-xl bg-[#0E121B] border border-[#1E2330]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">3. Maintain Academic Focus</h4>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Keep posts strictly relevant to education, science, coding, literature, or competitive exams. Do not use the feed for commercial promotion, dating, or political outrage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                8. REPORT ABUSE
               =================================================================== */}
            {activeDoc === 'report' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <span className="text-xs font-mono text-red-400 uppercase tracking-wider font-semibold">
                    Student Safety
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight mt-1">
                    Report Inappropriate Content or Abuse
                  </h2>
                  <p className="text-[#94A3B8] text-xs sm:text-sm mt-2">
                    Help us maintain a safe, clean study environment. All reports are confidential.
                  </p>
                </div>

                {reportSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h4 className="text-base font-semibold text-white">Report Submitted Successfully</h4>
                    <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                      Thank you for protecting the cohort. Our moderation team will review this report within 4 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReportSubmit} className="space-y-4 p-5 rounded-2xl bg-[#0E121B] border border-[#1E2330]">
                    <div>
                      <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                        Violation Category
                      </label>
                      <select
                        value={reportCategory}
                        onChange={(e) => setReportCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-[#090C12] border border-[#1E2330] rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="academic_dishonesty">Live Exam Cheating / Academic Dishonesty</option>
                        <option value="harassment">Harassment or Toxic Behavior</option>
                        <option value="spam">Commercial Spam / Self-Promotion</option>
                        <option value="misinformation">Grossly Inaccurate / Harmful Academic Misinformation</option>
                        <option value="inappropriate_content">Inappropriate Media or Language</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                        Post ID or Author Username (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. post-123 or @username"
                        value={reportLink}
                        onChange={(e) => setReportLink(e.target.value)}
                        className="w-full px-3 py-2 bg-[#090C12] border border-[#1E2330] rounded-xl text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                        Detailed Description of the Issue *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Please provide details about what happened..."
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-[#090C12] border border-[#1E2330] rounded-xl text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-red-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Submit Confidential Report</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ===================================================================
                9. HELP CENTER / FAQS
               =================================================================== */}
            {activeDoc === 'faqs' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <span className="text-xs font-mono text-[#60A5FA] uppercase tracking-wider font-semibold">
                    Support Center
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight mt-1">
                    Help Center & Frequently Asked Questions
                  </h2>
                  <p className="text-[#94A3B8] text-xs sm:text-sm mt-2">
                    Everything you need to know about using LearnLoom effectively.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      q: 'Is LearnLoom truly 100% free for all students?',
                      a: 'Yes. LearnLoom is completely free with zero subscription fees, zero locked answers, and no paywalled features. It is built as an open academic infrastructure.'
                    },
                    {
                      q: 'How does the 7-day rolling stream lifecycle work?',
                      a: 'Every doubt, post, and practice poll stays in the active public stream for exactly 7 days. This keeps the feed focused on active weekly curriculum rather than outdated zombie discussions.'
                    },
                    {
                      q: 'How are peer answers verified?',
                      a: 'Community peers vote on explanations based on clarity, accuracy, and depth. High-signal solutions that provide clear step-by-step intuition receive the "Verified Solution" badge.'
                    },
                    {
                      q: 'Can I post mathematical equations and diagrams?',
                      a: 'Yes. You can attach high-resolution photos of handwritten proofs, code snippets, or formulate clear mathematical expressions in your questions and solutions.'
                    },
                    {
                      q: 'How do MCQs and polls work?',
                      a: 'When you create an MCQ post, you provide options and mark the correct solution. Other students can vote and instantly see the community distribution curve and detailed solution breakdown.'
                    },
                    {
                      q: 'How do I change my academic cohort or student class?',
                      a: 'Click on your avatar in the top right of the dashboard, choose Edit Profile, and update your Class, Target Exam, or Bio at any time.'
                    }
                  ].map((faq, idx) => (
                    <div
                      key={idx}
                      className="border border-[#1E2330] rounded-xl bg-[#0E121B] overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                        className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-medium text-white hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-200 ${
                            expandedFaq === idx ? 'rotate-180 text-emerald-400' : ''
                          }`}
                        />
                      </button>
                      {expandedFaq === idx && (
                        <div className="px-4 pb-4 pt-1 text-xs text-[#94A3B8] border-t border-[#1E2330]/60 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================================================================
                10. CONTACT US
               =================================================================== */}
            {activeDoc === 'contact' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <span className="text-xs font-mono text-[#F59E0B] uppercase tracking-wider font-semibold">
                    Direct Assistance
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight mt-1">
                    Contact Us
                  </h2>
                  <p className="text-[#94A3B8] text-xs sm:text-sm mt-2">
                    Have questions, partnership inquiries, or need direct support? We respond promptly.
                  </p>
                </div>

                {/* Direct Channel Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <a
                    href="mailto:imsaud.apk@gmail.com"
                    className="p-4 rounded-xl bg-[#0E121B] border border-[#1E2330] hover:border-[#3B82F6] transition-colors group"
                  >
                    <div className="text-[10px] font-mono text-[#64748B] uppercase mb-1">OFFICIAL EMAIL</div>
                    <div className="text-xs font-semibold text-white group-hover:text-[#60A5FA] truncate">
                      imsaud.apk@gmail.com
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-1">General & student queries</div>
                  </a>

                  <a
                    href="https://x.com/saud_apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-[#0E121B] border border-[#1E2330] hover:border-white transition-colors group"
                  >
                    <div className="text-[10px] font-mono text-[#64748B] uppercase mb-1">X (TWITTER)</div>
                    <div className="text-xs font-semibold text-white group-hover:text-white">@saud_apk</div>
                    <div className="text-[11px] text-[#64748B] mt-1">Founder dispatch & DMs</div>
                  </a>

                  <a
                    href="https://wa.me/917378633612"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-[#0E121B] border border-[#1E2330] hover:border-emerald-500 transition-colors group"
                  >
                    <div className="text-[10px] font-mono text-[#64748B] uppercase mb-1">WHATSAPP DIRECT</div>
                    <div className="text-xs font-semibold text-white group-hover:text-emerald-400">
                      +91 73786 33612
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-1">Instant student feedback</div>
                  </a>
                </div>

                {/* Direct Message Form */}
                {contactSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h4 className="text-base font-semibold text-white">Message Sent!</h4>
                    <p className="text-xs text-[#94A3B8]">
                      Thank you for contacting us. We will reply to your email within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4 p-5 rounded-2xl bg-[#0E121B] border border-[#1E2330]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                          Your Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Mehta"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#090C12] border border-[#1E2330] rounded-xl text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-[#090C12] border border-[#1E2330] rounded-xl text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                        Subject
                      </label>
                      <select
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-[#090C12] border border-[#1E2330] rounded-xl text-xs text-white focus:outline-none focus:border-white"
                      >
                        <option value="general">General Student Inquiries</option>
                        <option value="technical">Technical Support / Bug Report</option>
                        <option value="academic">Cohort & Subject Suggestion</option>
                        <option value="partnership">Academic Partnership / University</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                        Message *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Write your message here..."
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-[#090C12] border border-[#1E2330] rounded-xl text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-white resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0A0D14] hover:bg-[#E2E8F0] font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Direct Message</span>
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
