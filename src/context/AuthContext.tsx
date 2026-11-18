import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

export interface StudentProfile {
  uid: string;
  email: string;
  displayName: string;
  handle?: string;
  photoURL?: string;
  avatarIcon?: string;
  avatarLabel?: string;
  avatar?: {
    icon: string;
    label: string;
  };
  age?: string | number;
  personal?: {
    fullName: string;
    age: string | number;
  };
  studentClass?: string;
  educationStage?: string;
  gradeBadge?: string;
  institutionName?: string;
  college?: string;
  academic?: {
    stageId: string;
    levelTitle: string;
    gradeBadge: string;
    studentClass: string;
    institutionName: string;
  };
  subjects?: string[];
  dailyGoal?: string;
  dailyCommitment?: string;
  primaryGoal?: string;
  studyTimePreference?: string;
  studyMotto?: string;
  bio?: string;
  studyPlan?: {
    primaryGoal: string;
    dailyCommitment: string;
    focusSubjects: string[];
    studyMotto: string;
  };
  role?: string;
  accountStatus?: string;
  streakDays?: number;
  lastActiveDate?: string;
  status?: {
    role: string;
    accountStatus: string;
    streakDays: number;
    onboardingCompleted: boolean;
  };
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
  savedPostIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  profileLoading: boolean;
  onboardingCompleted: boolean;
  loginWithGoogle: () => Promise<User>;
  signUpWithEmail: (email: string, pass: string, fullName: string) => Promise<User>;
  loginWithEmail: (email: string, pass: string) => Promise<User>;
  completeOnboarding: (data: Partial<StudentProfile>) => Promise<void>;
  updateUserProfilePhoto: (photoURL: string) => Promise<void>;
  updateUserProfile: (data: Partial<StudentProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Sync basic user document in Firestore on auth
  const syncUserProfile = async (firebaseUser: User, customDisplayName?: string) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const existingSnap = await getDoc(userRef);
      const now = new Date().toISOString();
      const displayName = customDisplayName || firebaseUser.displayName || '';
      const fallbackHandle = (displayName || firebaseUser.email?.split('@')[0] || 'student')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 15);

      if (!existingSnap.exists()) {
        const initialDoc: Record<string, any> = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: displayName,
          handle: fallbackHandle,
          photoURL: firebaseUser.photoURL || '',
          avatarIcon: '🚀',
          avatarLabel: 'Explorer',
          avatar: {
            icon: '🚀',
            label: 'Explorer'
          },
          role: 'student',
          accountStatus: 'active',
          streakDays: 1,
          status: {
            role: 'student',
            accountStatus: 'active',
            streakDays: 1,
            onboardingCompleted: false
          },
          onboardingCompleted: false,
          createdAt: now,
          updatedAt: now
        };
        await setDoc(userRef, initialDoc);
      } else {
        const existingData = existingSnap.data();
        await setDoc(
          userRef,
          {
            updatedAt: now,
            email: firebaseUser.email || existingData?.email || '',
            ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
            ...(displayName && !existingData?.displayName ? { displayName } : {}),
            ...(fallbackHandle && !existingData?.handle ? { handle: fallbackHandle } : {})
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('Note: Could not sync user profile doc', err);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen to the Firestore user profile doc whenever user is authenticated
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const userRef = doc(db, 'users', user.uid);

    const unsubscribeProfile = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StudentProfile;
          setProfile(data);
        } else {
          // If no doc yet, create one
          syncUserProfile(user);
        }
        setProfileLoading(false);
      },
      (error) => {
        console.warn('Profile snapshot error (using offline fallback):', error);
        setProfileLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user]);

  const loginWithGoogle = async (): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user);
      return result.user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, fullName: string): Promise<User> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (fullName.trim()) {
        await updateProfile(result.user, { displayName: fullName.trim() });
      }
      await syncUserProfile(result.user, fullName.trim());
      return result.user;
    } catch (error) {
      console.error('Email Sign-Up Error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await syncUserProfile(result.user);
      return result.user;
    } catch (error) {
      console.error('Email Login Error:', error);
      throw error;
    }
  };

  const completeOnboarding = async (data: Partial<StudentProfile>) => {
    if (!user) throw new Error('No user is currently authenticated.');

    const userRef = doc(db, 'users', user.uid);
    const now = new Date().toISOString();

    const fullName = (data.displayName || user.displayName || profile?.displayName || 'Learner').trim();
    const userEmail = (user.email || profile?.email || '').trim();
    const ageVal = data.age || profile?.age || '';
    const avatarIcon = data.avatarIcon || profile?.avatarIcon || '🎯';
    const avatarLabel = data.avatarLabel || profile?.avatarLabel || 'Achiever';
    const studentClass = data.studentClass || profile?.studentClass || 'Student';
    const educationStage = data.educationStage || profile?.educationStage || 'high_school';
    const gradeBadge = data.gradeBadge || profile?.gradeBadge || '';
    const institutionName = (data.institutionName || profile?.institutionName || '').trim();
    const primaryGoal = data.primaryGoal || profile?.primaryGoal || 'Exam Prep';
    const dailyCommitment = data.dailyGoal || data.dailyCommitment || profile?.dailyGoal || '1 – 2 hours / day';
    const subjects = data.subjects && data.subjects.length > 0 ? data.subjects : (profile?.subjects || ['Mathematics', 'General Science']);
    const studyMotto = data.studyMotto || `Committed to ${primaryGoal.toLowerCase()}`;
    const handle = (data.handle || profile?.handle || (userEmail ? userEmail.split('@')[0] : 'student')).trim();
    const activePhoto = (data.photoURL || profile?.photoURL || user.photoURL || '').trim();

    const payload: Partial<StudentProfile> = {
      uid: user.uid,
      email: userEmail,
      displayName: fullName,
      handle: handle,
      photoURL: activePhoto,
      age: ageVal,
      avatarIcon: avatarIcon,
      avatarLabel: avatarLabel,
      studentClass: studentClass,
      educationStage: educationStage,
      gradeBadge: gradeBadge,
      institutionName: institutionName,
      college: institutionName,
      subjects: subjects,
      dailyGoal: dailyCommitment,
      dailyCommitment: dailyCommitment,
      primaryGoal: primaryGoal,
      studyTimePreference: dailyCommitment,
      studyMotto: studyMotto,
      role: 'student',
      accountStatus: 'active',
      streakDays: profile?.streakDays || 1,
      lastActiveDate: now,
      onboardingCompleted: true,
      onboardingCompletedAt: now,
      updatedAt: now,

      // Structured groupings for Firebase Console and analytical readability:
      avatar: {
        icon: avatarIcon,
        label: avatarLabel
      },
      personal: {
        fullName: fullName,
        age: ageVal
      },
      academic: {
        stageId: educationStage,
        levelTitle: studentClass,
        gradeBadge: gradeBadge,
        studentClass: studentClass,
        institutionName: institutionName
      },
      studyPlan: {
        primaryGoal: primaryGoal,
        dailyCommitment: dailyCommitment,
        focusSubjects: subjects,
        studyMotto: studyMotto
      },
      status: {
        role: 'student',
        accountStatus: 'active',
        streakDays: profile?.streakDays || 1,
        onboardingCompleted: true
      }
    };

    const authUpdates: { displayName?: string; photoURL?: string } = {};
    if (fullName && fullName !== user.displayName) authUpdates.displayName = fullName;
    if (activePhoto && activePhoto !== user.photoURL) authUpdates.photoURL = activePhoto;

    if (Object.keys(authUpdates).length > 0) {
      try {
        await updateProfile(user, authUpdates);
      } catch (e) {
        console.warn('Could not update Firebase Auth user profile', e);
      }
    }

    // Strip any undefined keys so Firestore never encounters unsupported undefined values
    const cleanPayload: Record<string, any> = {};
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined) {
        cleanPayload[k] = v;
      }
    });

    await setDoc(userRef, cleanPayload, { merge: true });

    // Optimistically update local profile state for instant response
    setProfile((prev) => ({
      ...(prev || {}),
      ...payload,
      uid: user.uid,
      email: userEmail,
      displayName: fullName,
      onboardingCompleted: true
    } as StudentProfile));
  };

  const updateUserProfilePhoto = async (newPhotoURL: string) => {
    if (!user) return;
    try {
      await updateProfile(user, { photoURL: newPhotoURL });
    } catch (e) {
      console.warn('Could not update Firebase Auth photoURL', e);
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { photoURL: newPhotoURL, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Could not update Firestore user photoURL', e);
    }

    setProfile((prev) => (prev ? { ...prev, photoURL: newPhotoURL } : null));
  };

  const updateUserProfile = async (data: Partial<StudentProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const now = new Date().toISOString();

    const cleanPayload: Record<string, any> = { updatedAt: now };
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) {
        cleanPayload[k] = v;
      }
    });

    if (data.displayName && data.displayName !== user.displayName) {
      try {
        await updateProfile(user, { displayName: data.displayName });
      } catch (e) {
        console.warn('Could not update Firebase Auth displayName', e);
      }
    }

    await setDoc(userRef, cleanPayload, { merge: true });

    setProfile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...data,
        updatedAt: now
      };
    });
  };

  const logout = async () => {
    setProfile(null);
    await signOut(auth);
  };

  const onboardingCompleted = Boolean(profile?.onboardingCompleted);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        onboardingCompleted,
        loginWithGoogle,
        signUpWithEmail,
        loginWithEmail,
        completeOnboarding,
        updateUserProfilePhoto,
        updateUserProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
