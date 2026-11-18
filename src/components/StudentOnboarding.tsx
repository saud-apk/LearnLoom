import React, { useState, useRef } from 'react';
import {
  User,
  GraduationCap,
  Upload,
  Camera,
  RefreshCw,
  Loader2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadProfileAvatarToCloudinary } from '../services/cloudinary';

// Comprehensive classes from 5th to all students:
const STUDENT_CLASSES = [
  { value: 'Class 5th', label: 'Class 5th (Primary)' },
  { value: 'Class 6th', label: 'Class 6th (Middle School)' },
  { value: 'Class 7th', label: 'Class 7th (Middle School)' },
  { value: 'Class 8th', label: 'Class 8th (Middle School)' },
  { value: 'Class 9th', label: 'Class 9th (Secondary)' },
  { value: 'Class 10th', label: 'Class 10th (Secondary / Boards)' },
  { value: 'Class 11th - Science', label: 'Class 11th (Science PCM / PCB)' },
  { value: 'Class 11th - Commerce', label: 'Class 11th (Commerce)' },
  { value: 'Class 11th - Arts', label: 'Class 11th (Arts / Humanities)' },
  { value: 'Class 12th - Science', label: 'Class 12th (Science PCM / PCB)' },
  { value: 'Class 12th - Commerce', label: 'Class 12th (Commerce)' },
  { value: 'Class 12th - Arts', label: 'Class 12th (Arts / Humanities)' },
  { value: 'College / Undergrad', label: 'College / Undergrad (Degree / Diploma)' },
  { value: 'Postgraduate / Masters', label: 'Postgraduate / Masters' },
  { value: 'Competitive Exams', label: 'Competitive Exams (JEE / NEET / UPSC / CA)' },
  { value: 'Self-Learner', label: 'Self-Directed / Lifelong Learner' }
];

export const StudentOnboarding: React.FC = () => {
  const { user, profile, completeOnboarding, logout } = useAuth();

  // 1. Profile Picture (Compulsory)
  const [photoURL, setPhotoURL] = useState<string>(profile?.photoURL || user?.photoURL || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Full Name (Compulsory)
  const [fullName, setFullName] = useState(profile?.displayName || user?.displayName || '');

  // 3. Unique Username (Compulsory)
  const [username, setUsername] = useState(
    (profile?.handle || user?.displayName || user?.email?.split('@')[0] || '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 15)
  );

  // 4. Class (Compulsory - starts unselected or from profile)
  const [selectedClass, setSelectedClass] = useState(profile?.studentClass || '');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick photo upload to Cloudinary with automatic client-side compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Image size is too large (max 25MB).');
      return;
    }

    setUploadingImage(true);
    setErrorMessage(null);

    try {
      const uploadResult = await uploadProfileAvatarToCloudinary(file);
      setPhotoURL(uploadResult.optimizedUrl);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setErrorMessage(err?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Strict Validation: ALL 4 FIELDS ARE 100% COMPULSORY
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validate Profile Photo (Compulsory)
    const activePhoto = (photoURL || user?.photoURL || '').trim();
    if (!activePhoto) {
      setErrorMessage('Profile Photo is compulsory. Please upload a picture from your device or camera.');
      fileInputRef.current?.click();
      return;
    }

    // 2. Validate Full Name (Compulsory)
    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Full Name is compulsory (minimum 2 characters).');
      return;
    }

    // 3. Validate Unique Username (Compulsory)
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Unique Username is compulsory (minimum 3 characters, lowercase letters, numbers, and _ only).');
      return;
    }

    // 4. Validate Class (Compulsory)
    if (!selectedClass || selectedClass.trim() === '') {
      setErrorMessage('Selecting your Class is compulsory. Please choose your current grade or education level.');
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        displayName: cleanName,
        handle: cleanUsername,
        photoURL: activePhoto,
        studentClass: selectedClass,
        educationStage: selectedClass.toLowerCase().includes('class') ? 'school' : 'higher_ed',
        gradeBadge: selectedClass,
        subjects: ['Mathematics', 'Science', 'General Study'],
        dailyGoal: '1 – 2 hours / day',
        dailyCommitment: '1 – 2 hours / day',
        primaryGoal: 'Academic Excellence & Focus',
        role: 'student',
        accountStatus: 'active',
        streakDays: 1
      });
      // Auth context triggers immediate redirect to StudentDashboard upon Firestore write
    } catch (err: any) {
      console.error('Error saving onboarding data:', err);
      setErrorMessage(err?.message || 'Failed to save profile. Please try again.');
      setSubmitting(false);
    }
  };

  const hasPhoto = Boolean(photoURL.trim() || user?.photoURL?.trim());

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#ECEFF1] flex flex-col items-center justify-center p-4 sm:p-6 font-sans selection:bg-[#7C3AED] selection:text-white relative overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-academic-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-violet-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Brand Top Bar */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between mb-4 z-10 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-black border border-[#242732] p-1 flex items-center justify-center shadow-sm">
            <img
              src="/assets/aistudio/Abstract_Ribbon_M_Emblem_4a31ed28.png"
              alt="LearnLoom Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-display font-extrabold text-base text-white tracking-tight">
            LearnLoom
          </span>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="text-xs font-mono text-[#7E8794] hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-[#14161F]"
        >
          Sign Out
        </button>
      </header>

      {/* Main Single-Screen Onboarding Card */}
      <main className="w-full max-w-md bg-[#101217] border border-[#21242E] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl relative z-10 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="mb-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#181B24] border border-[#262B3A] text-[10px] font-mono text-[#A78BFA] font-bold mb-1.5">
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
            <span>Fast Student Registration</span>
          </div>
          <h1 className="font-display font-extrabold text-xl sm:text-2xl text-white tracking-tight">
            Complete your profile
          </h1>
          <p className="text-xs text-[#808998] mt-0.5">
            All 4 fields below are <span className="text-[#F29AB5] font-bold">compulsory</span> to verify your student account.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-800/70 text-red-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. PROFILE PICTURE (COMPULSORY) */}
          <div className={`p-3.5 rounded-2xl transition-all ${
            hasPhoto
              ? 'bg-[#14161E] border border-[#212530]'
              : 'bg-[#18151D] border-2 border-dashed border-[#F29AB5]/50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#B8C2CE] flex items-center gap-1.5">
                <span>1. Profile Photo</span>
                <span className="text-red-400">*</span>
              </label>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                hasPhoto
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                  : 'bg-red-950/60 text-red-300 border border-red-500/40 animate-pulse'
              }`}>
                {hasPhoto ? '✓ Completed' : 'Compulsory'}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className={`w-16 h-16 rounded-2xl bg-[#0C0D11] border-2 overflow-hidden flex items-center justify-center relative shadow-md ${
                  hasPhoto ? 'border-[#7C3AED]' : 'border-red-400/80'
                }`}>
                  {uploadingImage ? (
                    <div className="w-full h-full flex items-center justify-center bg-[#101218]">
                      <Loader2 className="w-5 h-5 animate-spin text-[#F59E0B]" />
                    </div>
                  ) : photoURL ? (
                    <img
                      src={photoURL}
                      alt="Profile Avatar"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Google Avatar"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1A1822] flex flex-col items-center justify-center text-[#F29AB5]">
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[8px] font-mono font-bold uppercase">Add Photo</span>
                    </div>
                  )}
                </div>

                {/* Camera Trigger */}
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] border-2 border-[#101217] text-white shadow cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  title="Upload image"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-display font-bold text-white">
                  {hasPhoto ? 'Photo Ready' : 'Upload Student Photo'}
                </p>
                <p className="text-[11px] font-mono text-[#747E8E] truncate mt-0.5">
                  {hasPhoto ? (user?.email || 'Cloudinary Optimized') : 'Camera or device upload required'}
                </p>

                <div className="pt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-all cursor-pointer ${
                      hasPhoto
                        ? 'bg-[#1C202C] hover:bg-[#252A3A] text-[#A78BFA] border border-[#2E3547]'
                        : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>{uploadingImage ? 'Uploading...' : hasPhoto ? 'Change Photo' : 'Upload Photo Now'}</span>
                  </button>

                  {user?.photoURL && photoURL !== user.photoURL && (
                    <button
                      type="button"
                      onClick={() => setPhotoURL(user.photoURL || '')}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-[#747E8E] hover:text-white transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Google Sync</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. FULL NAME (COMPULSORY) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#B8C2CE] flex items-center gap-1">
                <span>2. Full Name</span>
                <span className="text-red-400">*</span>
              </label>
              <span className="text-[10px] font-mono text-[#F29AB5] font-bold">Compulsory</span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full bg-[#14161E] text-white px-3.5 py-2.5 rounded-xl border border-[#222633] focus:border-[#7C3AED] focus:outline-none text-sm placeholder:text-[#4F5766]"
              />
              <User className="w-4 h-4 text-[#4F5766] absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 3. UNIQUE USERNAME (COMPULSORY) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#B8C2CE] flex items-center gap-1">
                <span>3. Unique Username</span>
                <span className="text-red-400">*</span>
              </label>
              <span className="text-[10px] font-mono text-[#F29AB5] font-bold">Compulsory</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-[#5D6677] font-mono pointer-events-none">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="aarav_learns"
                className="w-full bg-[#14161E] text-white pl-8 pr-3.5 py-2.5 rounded-xl border border-[#222633] focus:border-[#7C3AED] focus:outline-none text-sm font-mono placeholder:text-[#4F5766]"
              />
            </div>
            <span className="text-[10px] text-[#606979] mt-1 block font-mono">
              Only lowercase letters, numbers, and underscore (_)
            </span>
          </div>

          {/* 4. CLASS (FROM 5TH TO ALL - COMPULSORY) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#B8C2CE] flex items-center gap-1">
                <span>4. Select Your Class</span>
                <span className="text-red-400">*</span>
              </label>
              <span className="text-[10px] font-mono text-[#F29AB5] font-bold">Compulsory</span>
            </div>
            <div className="relative">
              <select
                required
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className={`w-full bg-[#14161E] text-white px-3.5 py-2.5 rounded-xl border focus:border-[#7C3AED] focus:outline-none text-sm appearance-none cursor-pointer pr-10 ${
                  selectedClass ? 'border-[#222633]' : 'border-[#F29AB5]/50'
                }`}
              >
                <option value="" disabled className="bg-[#14161E] text-[#6E7888]">
                  -- Choose your current class / level (Compulsory) --
                </option>
                {STUDENT_CLASSES.map((item) => (
                  <option key={item.value} value={item.value} className="bg-[#14161E] text-white py-1.5">
                    {item.label}
                  </option>
                ))}
              </select>
              <GraduationCap className="w-4 h-4 text-[#7C3AED] absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="w-full flex items-center justify-center gap-2 font-display font-bold text-sm bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3.5 rounded-xl border border-[#9061F9] transition-all cursor-pointer shadow-lg hover:shadow-violet-900/30 active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying & Entering LearnLoom...</span>
                </>
              ) : (
                <>
                  <span>Enter LearnLoom</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

      </main>

      {/* Security Assurance */}
      <footer className="w-full max-w-md mx-auto mt-4 text-center text-[10px] font-mono text-[#525966] flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        <span>100% Free · Realtime verified student profiles on LearnLoom</span>
      </footer>

    </div>
  );
};
