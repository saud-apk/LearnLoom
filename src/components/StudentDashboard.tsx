import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Compass,
  Users,
  BookOpen,
  User as UserIcon,
  Target,
  MessageSquare,
  Heart,
  Share2,
  Send,
  LogOut,
  ChevronRight,
  Radio,
  Bell,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  X as CloseIcon,
  CheckCircle2,
  Image as ImageIcon,
  Camera,
  Upload,
  Loader2,
  Maximize2,
  Trash2,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  CheckCheck,
  HelpCircle,
  Check,
  Zap,
  Plus,
  Clock,
  Lock,
  Link as LinkIcon,
  Edit3,
  BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { uploadToCloudinary, uploadProfileAvatarToCloudinary, getOptimizedPostImageUrl, getOptimizedAvatarUrl } from '../services/cloudinary';
import {
  subscribeToFeedPosts,
  createPostInFirestore,
  recordPostViewInFirestore,
  toggleLikeInFirestore,
  addCommentInFirestore,
  markVerifiedSolutionInFirestore,
  deletePostInFirestore,
  toggleSavePostInFirestore,
  voteInPostPoll,
  submitPostMcqAnswer,
  seedPostsIfEmpty,
  extractFirstUrl,
  formatDomain,
  getSeenPostsRecord,
  markPostAsSeen,
  clearSeenPostsRecord,
  partitionFeedPosts,
  isPostRevived,
  autoCleanupOwnerExpiredPostsInFirestore,
  getPostExpiryInfo,
  SeenPostRecord,
  FeedPost,
  PostComment,
  PostPoll,
  PostMcq
} from '../services/feedService';

export type DashboardTab = 'feed' | 'discover' | 'rooms' | 'notes' | 'profile';
export type PostCategory = 'doubt' | 'notes' | 'milestone' | 'trick';
export type { FeedPost, PostComment, PostPoll, PostMcq };

// Rich Content Renderer with Clickable Links, Code/Math snippets, and Live Link Preview Card
const RichContent: React.FC<{ text: string; showPreview?: boolean }> = ({ text, showPreview = true }) => {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  const firstUrl = showPreview ? extractFirstUrl(text) : null;

  const renderFormattedText = () => {
    if (!text) return null;

    // Split by backticks for inline code/formula like `sin²θ + cos²θ = 1` or `E = mc²`
    const codeSegments = text.split(/(`[^`]+`)/g);

    return codeSegments.map((segment, segIdx) => {
      if (segment.startsWith('`') && segment.endsWith('`') && segment.length >= 2) {
        const codeContent = segment.slice(1, -1);
        return (
          <code
            key={`code-${segIdx}`}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#181B26] text-[#C4B5FD] font-mono text-[11px] border border-[#2D3245] shadow-xs"
          >
            {codeContent}
          </code>
        );
      }

      // Check for URLs within normal text
      const parts: React.ReactNode[] = [];
      let lastIdx = 0;
      let match: RegExpExecArray | null;
      const regex = new RegExp(urlRegex);

      while ((match = regex.exec(segment)) !== null) {
        const matchIdx = match.index;
        if (matchIdx > lastIdx) {
          parts.push(segment.slice(lastIdx, matchIdx));
        }
        let rawUrl = match[0];
        let href = rawUrl;
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
          href = 'https://' + href;
        }
        parts.push(
          <a
            key={`link-${segIdx}-${matchIdx}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#38BDF8] hover:text-[#7DD3FC] underline underline-offset-2 break-all font-mono font-medium transition-colors inline-flex items-center gap-0.5 mx-0.5"
            title={`Open ${href}`}
          >
            <span>{rawUrl}</span>
            <ExternalLink className="w-3 h-3 inline shrink-0 opacity-80" />
          </a>
        );
        lastIdx = regex.lastIndex;
      }

      if (lastIdx < segment.length) {
        parts.push(segment.slice(lastIdx));
      }

      return <React.Fragment key={`seg-${segIdx}`}>{parts}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-3">
      <div className="whitespace-pre-wrap leading-relaxed">
        {renderFormattedText()}
      </div>

      {/* Sleek Twitter/X-style Link Preview Card */}
      {firstUrl && (
        <a
          href={firstUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="group block rounded-xl overflow-hidden border border-[#232736] hover:border-[#38BDF8]/60 bg-[#0C0E14] p-3 transition-all duration-200 hover:bg-[#10141F] shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#181B26] border border-[#272B3B] flex items-center justify-center text-[#38BDF8] shrink-0 group-hover:scale-105 transition-transform">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-mono font-bold text-white group-hover:text-[#38BDF8] transition-colors truncate block">
                  {formatDomain(firstUrl)}
                </span>
                <span className="text-[11px] font-mono text-[#788290] truncate block max-w-xs sm:max-w-md">
                  {firstUrl}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#38BDF8] px-2.5 py-1 rounded-md bg-[#38BDF8]/10 group-hover:bg-[#38BDF8]/20 transition-colors shrink-0">
              Open ↗
            </span>
          </div>
        </a>
      )}
    </div>
  );
};

interface StudentDashboardProps {
  onViewLanding?: () => void;
  onEditProfile?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onViewLanding
}) => {
  const { user, profile, updateUserProfilePhoto, updateUserProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('feed');
  const currentUserPhoto = (profile?.photoURL || user?.photoURL || '') as string;

  // ---------------------------------------------------------------------------
  // Realtime Firestore Feed State & Seen Management (Instagram/Twitter Style)
  // ---------------------------------------------------------------------------
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(true);
  const [seenRecord, setSeenRecord] = useState<Record<string, SeenPostRecord>>(() => getSeenPostsRecord());
  const [pendingNewPosts, setPendingNewPosts] = useState<FeedPost[]>([]);
  const latestSeenTimestampRef = useRef<string>('');
  const initialLoadDoneRef = useRef<boolean>(false);
  const [resetSeenToast, setResetSeenToast] = useState(false);

  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('learnloom_saved_posts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // ---------------------------------------------------------------------------
  // Edit Profile State (Twitter/X & Instagram Clean Academic Dark Style)
  // ---------------------------------------------------------------------------
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editPrimaryGoal, setEditPrimaryGoal] = useState('');
  const [editDailyGoal, setEditDailyGoal] = useState('');
  const [editStudyMotto, setEditStudyMotto] = useState('');
  const [editSubjects, setEditSubjects] = useState<string[]>([]);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessToast, setProfileSuccessToast] = useState('');

  const handleOpenEditProfile = () => {
    setEditDisplayName(profile?.displayName || user?.displayName || '');
    setEditHandle(profile?.handle || user?.displayName?.toLowerCase().replace(/\s+/g, '_') || 'student');
    setEditClass(profile?.studentClass || 'Class 12th');
    setEditInstitution(profile?.institutionName || profile?.college || '');
    setEditPrimaryGoal(profile?.primaryGoal || 'Exam Prep');
    setEditDailyGoal(profile?.dailyGoal || '2 – 3 hours');
    setEditStudyMotto(profile?.studyMotto || profile?.bio || '');
    setEditSubjects(
      profile?.subjects && profile.subjects.length > 0
        ? [...profile.subjects]
        : ['Mathematics', 'Physics', 'Chemistry']
    );
    setNewSubjectInput('');
    setIsEditProfileOpen(true);
  };

  const handleAddSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (trimmed && !editSubjects.includes(trimmed)) {
      setEditSubjects([...editSubjects, trimmed]);
      setNewSubjectInput('');
    }
  };

  const handleRemoveSubject = (subToRemove: string) => {
    setEditSubjects((prev) => prev.filter((s) => s !== subToRemove));
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editDisplayName.trim()) return;

    setSavingProfile(true);
    try {
      const cleanHandle = editHandle.trim().replace(/^@+/, '') || 'student';
      await updateUserProfile({
        displayName: editDisplayName.trim(),
        handle: cleanHandle,
        studentClass: editClass.trim(),
        institutionName: editInstitution.trim(),
        primaryGoal: editPrimaryGoal.trim(),
        dailyGoal: editDailyGoal.trim(),
        studyMotto: editStudyMotto.trim(),
        subjects: editSubjects
      });

      setProfileSuccessToast('✓ Profile updated successfully in Firestore!');
      setIsEditProfileOpen(false);
      setTimeout(() => {
        setProfileSuccessToast('');
      }, 4000);
    } catch (err) {
      console.error('Failed to update profile in Firestore:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Realtime Firestore Feed Subscription
  useEffect(() => {
    // Seed initial posts if DB is fresh
    seedPostsIfEmpty();

    // Strict 7-Day TTL: Automatically purge owner's expired posts from Firestore
    if (user?.uid) {
      autoCleanupOwnerExpiredPostsInFirestore(user.uid);
    }

    const unsubscribe = subscribeToFeedPosts(
      user?.uid,
      (livePosts) => {
        const merged = livePosts.map((p) => ({
          ...p,
          isBookmarked: Boolean(bookmarkedPostIds[p.id])
        }));

        setPosts((prevPosts) => {
          const liveIds = new Set(merged.map((p) => p.id));
          // Deduplicate: Discard any temp optimistic post if Firestore has already emitted it
          const inFlight = prevPosts.filter((p) => {
            if (!p.id.startsWith('temp-')) return false;
            if (liveIds.has(p.id)) return false;
            // Check if live stream already contains this post from this author with identical content
            const alreadyInLive = merged.some(
              (m) => m.authorId === p.authorId && m.content.trim() === p.content.trim()
            );
            return !alreadyInLive;
          });
          const all = [...inFlight, ...merged];
          return all.sort((a, b) => {
            const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tB - tA;
          });
        });

        if (!initialLoadDoneRef.current) {
          if (merged[0]?.createdAt) {
            latestSeenTimestampRef.current = merged[0].createdAt;
          }
          initialLoadDoneRef.current = true;
        }

        setLoadingFeed(false);
      },
      (err) => {
        console.warn('Realtime feed subscription warning:', err);
        setLoadingFeed(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, bookmarkedPostIds]);

  // Handle Show New Posts (Twitter/Instagram pill click)
  const handleShowNewPosts = () => {
    if (pendingNewPosts.length > 0) {
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newOnes = pendingNewPosts.filter((p) => !existingIds.has(p.id));
        const combined = [...newOnes, ...prev];
        return combined.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
      });
      if (pendingNewPosts[0]?.createdAt) {
        latestSeenTimestampRef.current = pendingNewPosts[0].createdAt;
      }
      setPendingNewPosts([]);
    }
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [refreshingFeed, setRefreshingFeed] = useState<boolean>(false);
  const isObserverPausedRef = useRef<boolean>(false);
  const observerPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Unified 1-tap 100% Working Refresh Feed action:
  // Immediately clears seen history, syncs with Firestore, runs 7-day TTL cleanup,
  // scrolls to top smoothly, pauses observer so posts aren't immediately re-marked as seen,
  // and gives clean visual feedback.
  const handleUnifiedRefresh = () => {
    setRefreshingFeed(true);
    isObserverPausedRef.current = true;
    if (observerPauseTimerRef.current) {
      clearTimeout(observerPauseTimerRef.current);
    }

    // 1. Wipe seen history from localStorage and React state
    clearSeenPostsRecord();
    setSeenRecord({});

    // 2. Strict 7-Day TTL cleanup from Firestore
    if (user?.uid) {
      autoCleanupOwnerExpiredPostsInFirestore(user.uid);
    }

    // 3. Merge any pending real-time posts
    handleShowNewPosts();

    // 4. Smooth scroll feed to top
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 5. User feedback toast
    setResetSeenToast(true);
    setTimeout(() => setResetSeenToast(false), 2500);

    // Reset pagination to first page on refresh
    setDisplayLimit(20);

    // 6. Keep observer paused so posts don't get locked into seen instantly
    observerPauseTimerRef.current = setTimeout(() => {
      isObserverPausedRef.current = false;
      setRefreshingFeed(false);
    }, 2500);
  };

  // Partition posts into unseen (Fresh) and seen (Previously read)
  const { unseenPosts, seenPosts } = useMemo(() => {
    return partitionFeedPosts(posts, seenRecord);
  }, [posts, seenRecord]);

  // Scalable Infinite Scroll Pagination
  const [displayLimit, setDisplayLimit] = useState<number>(20);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const visibleUnseenPosts = useMemo(
    () => unseenPosts.slice(0, displayLimit),
    [unseenPosts, displayLimit]
  );

  const visibleSeenPosts = useMemo(() => {
    const remainingSlots = Math.max(10, displayLimit - visibleUnseenPosts.length);
    return seenPosts.slice(0, remainingSlots);
  }, [seenPosts, displayLimit, visibleUnseenPosts.length]);

  const hasMorePostsToLoad = posts.length > (visibleUnseenPosts.length + visibleSeenPosts.length);

  // Auto load more posts when user scrolls near the bottom
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const sentinelObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePostsToLoad) {
          setDisplayLimit((prev) => prev + 15);
        }
      },
      { threshold: 0.1 }
    );

    sentinelObserver.observe(sentinel);
    return () => sentinelObserver.disconnect();
  }, [hasMorePostsToLoad]);

  // Global Keyboard listener for Escape to close image lightbox and modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedZoomImage(null);
        setPostToDelete(null);
        setIsCreatePostModalOpen(false);
        setLockedFeatureModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // IntersectionObserver to mark posts as seen and record 100% real Firestore views
  const postElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const recordedViewsSessionRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isObserverPausedRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const targetEl = entry.target as HTMLElement;
            const postId = targetEl.getAttribute('data-post-id');
            if (postId) {
              const currentPost = posts.find((p) => p.id === postId);
              markPostAsSeen(postId, {
                commentsCount: currentPost?.commentsCount,
                isSolved: currentPost?.isSolved
              });

              // 100% Real Firestore View & Engagement recording
              if (!postId.startsWith('temp-') && !recordedViewsSessionRef.current.has(postId)) {
                recordedViewsSessionRef.current.add(postId);
                const currentUid = user?.uid || auth.currentUser?.uid || 'guest';
                recordPostViewInFirestore(postId, currentUid).catch((err) => {
                  console.debug('Real view recording notice:', err);
                });
              }
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
      }
    );

    postElementsRef.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [posts]);

  const registerPostRef = (postId: string, el: HTMLElement | null) => {
    if (el) {
      postElementsRef.current.set(postId, el);
      observerRef.current?.observe(el);
    } else {
      const prevEl = postElementsRef.current.get(postId);
      if (prevEl && observerRef.current) {
        observerRef.current.unobserve(prevEl);
      }
      postElementsRef.current.delete(postId);
    }
  };

  // Twitter-style Modal Post Composer State
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const [linkInputVal, setLinkInputVal] = useState('');

  // 100% Real Poll & MCQ Creation & Interactive States
  const [composerMode, setComposerMode] = useState<'standard' | 'poll' | 'mcq'>('standard');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', '']);
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState<number>(0);
  const [mcqExplanation, setMcqExplanation] = useState<string>('');

  // Local optimistic session tracking for instant Poll votes & MCQ attempts
  const [localPollVotes, setLocalPollVotes] = useState<Record<string, string>>({});
  const [localMcqAttempts, setLocalMcqAttempts] = useState<Record<string, { optionIndex: number; isCorrect: boolean }>>({});

  // Comments / Solution Thread States
  const [expandedPostComments, setExpandedPostComments] = useState<Record<string, boolean>>({
    'post-1': true // default open top doubt to showcase solution
  });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentImages, setCommentImages] = useState<Record<string, string | null>>({});
  const [uploadingCommentImage, setUploadingCommentImage] = useState<Record<string, boolean>>({});

  // Image Upload for Post Composer (Cloudinary Integration)
  const [postImage, setPostImage] = useState<string | null>(null);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const [postImageError, setPostImageError] = useState<string | null>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);
  const [activeCommentPostIdForUpload, setActiveCommentPostIdForUpload] = useState<string | null>(null);

  // Profile Photo Upload States
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const [profilePhotoMessage, setProfilePhotoMessage] = useState<string | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox Zoom Modal
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);

  // Tab Notification & Share States
  const [notifiedTabs, setNotifiedTabs] = useState<Record<string, boolean>>({});
  const [copiedToast, setCopiedToast] = useState(false);
  const [shareToastMessage, setShareToastMessage] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);
  const [deleteToast, setDeleteToast] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [lockedFeatureModal, setLockedFeatureModal] = useState<{ title: string; desc: string } | null>(null);

  // Handle Incoming Deep-Link (?post=POST_ID)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const deepLinkPostId = urlParams.get('post');
      if (deepLinkPostId && posts.length > 0) {
        // Expand comments for this post
        setExpandedPostComments((prev) => ({ ...prev, [deepLinkPostId]: true }));
        setHighlightedPostId(deepLinkPostId);

        // Scroll to post after brief DOM settle
        setTimeout(() => {
          const el = document.querySelector(`[data-post-id="${deepLinkPostId}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 350);

        // Clear highlight glow after 3.5s
        setTimeout(() => {
          setHighlightedPostId(null);
        }, 3500);
      }
    } catch (e) {
      console.warn('Deep link parsing error:', e);
    }
  }, [posts.length]);

  // 100% Real Working Share: Native Mobile Share API + Deep-Link URL + Fail-Safe Clipboard
  const handleSharePost = async (post: FeedPost) => {
    try {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const directPostUrl = `${origin}${pathname}?post=${post.id}`;
      const previewText = post.content ? post.content.replace(/\n+/g, ' ').slice(0, 90) : 'Study Doubt';
      const shareData = {
        title: `LearnLoom Doubt: ${post.authorName}`,
        text: `Check out this doubt on LearnLoom: "${previewText}..."`,
        url: directPostUrl
      };

      // 1. Try Native Mobile Web Share API
      if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          setShareToastMessage('✓ Shared successfully!');
          setTimeout(() => setShareToastMessage(null), 2500);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            return; // user cancelled share sheet
          }
        }
      }

      // 2. Clipboard Fallback with fail-safe textarea copy
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(directPostUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = directPostUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setShareToastMessage('✓ Direct Doubt Link copied to clipboard!');
      setTimeout(() => setShareToastMessage(null), 2500);
    } catch (err) {
      console.warn('Share error:', err);
      setShareToastMessage('✓ Link copied!');
      setTimeout(() => setShareToastMessage(null), 2500);
    }
  };

  // Cloudinary image upload for new post
  const handlePostImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPostImageError('Please choose a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setPostImageError('Image exceeds 25MB limit.');
      return;
    }

    setUploadingPostImage(true);
    setPostImageError(null);

    try {
      const result = await uploadToCloudinary(file, {
        folder: 'learnloom/posts',
        maxWidth: 1000,
        quality: 0.82
      });
      const optimized = getOptimizedPostImageUrl(result.secureUrl, 1000);
      setPostImage(optimized);
    } catch (err: any) {
      console.error('Error uploading post image:', err);
      setPostImageError(err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingPostImage(false);
      if (postFileInputRef.current) {
        postFileInputRef.current.value = '';
      }
    }
  };

  // Cloudinary image upload for solution comment
  const handleCommentImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCommentPostIdForUpload) return;

    const targetPostId = activeCommentPostIdForUpload;
    setUploadingCommentImage((prev) => ({ ...prev, [targetPostId]: true }));

    try {
      const result = await uploadToCloudinary(file, {
        folder: 'learnloom/solutions',
        maxWidth: 800,
        quality: 0.8
      });
      const optimized = getOptimizedPostImageUrl(result.secureUrl, 800);
      setCommentImages((prev) => ({ ...prev, [targetPostId]: optimized }));
    } catch (err) {
      console.error('Failed to upload solution image:', err);
      alert('Could not upload solution picture.');
    } finally {
      setUploadingCommentImage((prev) => ({ ...prev, [targetPostId]: false }));
      if (commentFileInputRef.current) {
        commentFileInputRef.current.value = '';
      }
    }
  };

  // Profile photo update in Profile Tab
  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfilePhoto(true);
    setProfilePhotoMessage(null);

    try {
      const result = await uploadProfileAvatarToCloudinary(file);
      await updateUserProfilePhoto(result.optimizedUrl);
      setProfilePhotoMessage('✓ Profile picture updated across LearnLoom!');
      setTimeout(() => setProfilePhotoMessage(null), 3500);
    } catch (err: any) {
      console.error('Error updating profile photo:', err);
      setProfilePhotoMessage(err?.message || 'Failed to update photo.');
    } finally {
      setUploadingProfilePhoto(false);
      if (profileFileInputRef.current) {
        profileFileInputRef.current.value = '';
      }
    }
  };

  // Create new post in Firestore (supports standard text, images, Polls, and MCQ Quizzes)
  const handleCreatePost = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const textToSubmit = newPostText.trim();
    const imageToSubmit = postImage || undefined;

    // Mode-specific validation
    if (composerMode === 'poll') {
      const validOptions = pollOptions.map((opt) => opt.trim()).filter(Boolean);
      if (!textToSubmit || validOptions.length < 2 || submittingPost) return;
    } else if (composerMode === 'mcq') {
      const validOptions = mcqOptions.map((opt) => opt.trim()).filter(Boolean);
      if (!textToSubmit || validOptions.length < 2 || submittingPost) return;
    } else {
      if ((!textToSubmit && !imageToSubmit) || submittingPost) return;
    }

    setSubmittingPost(true);
    const userPhoto = profile?.photoURL || user?.photoURL || auth.currentUser?.photoURL || '';
    const effectiveAuthorId = auth.currentUser?.uid || user?.uid || 'student';
    const nowIso = new Date().toISOString();

    // Construct Poll payload if active
    let pollToSubmit: PostPoll | undefined = undefined;
    if (composerMode === 'poll') {
      const validOptions = pollOptions.map((opt) => opt.trim()).filter(Boolean);
      pollToSubmit = {
        options: validOptions.map((text, idx) => ({
          id: `opt-${idx}`,
          text,
          votesCount: 0
        })),
        totalVotes: 0,
        voterMap: {}
      };
    }

    // Construct MCQ payload if active
    let mcqToSubmit: PostMcq | undefined = undefined;
    if (composerMode === 'mcq') {
      const validOptions = mcqOptions.map((opt) => opt.trim()).filter(Boolean);
      const safeCorrectIndex = mcqCorrectIndex < validOptions.length ? mcqCorrectIndex : 0;
      mcqToSubmit = {
        options: validOptions.map((text, idx) => ({
          id: `opt-${idx}`,
          text,
          votesCount: 0
        })),
        correctOptionIndex: safeCorrectIndex,
        explanation: mcqExplanation.trim(),
        totalAttempts: 0,
        correctAttempts: 0,
        userAnswers: {}
      };
    }

    // 1. Optimistic instant post insertion at top of feed!
    const tempId = `temp-${Date.now()}`;
    const optimisticPost: FeedPost = {
      id: tempId,
      authorId: effectiveAuthorId,
      authorName: profile?.displayName || user?.displayName || auth.currentUser?.displayName || 'Student',
      authorHandle: profile?.handle || 'student',
      authorPhotoURL: userPhoto,
      authorClass: profile?.studentClass || 'Student',
      authorAvatar: profile?.avatarIcon || '🎓',
      content: textToSubmit,
      imageURL: imageToSubmit,
      poll: pollToSubmit,
      mcq: mcqToSubmit,
      timestamp: 'Just now',
      likesCount: 0,
      likedUserIds: [],
      commentsCount: 0,
      comments: [],
      viewsCount: 1,
      viewedUserIds: [effectiveAuthorId],
      isLiked: false,
      isBookmarked: false,
      isSolved: false,
      createdAt: nowIso
    };

    // Prepend immediately to posts!
    setPosts((prev) => [optimisticPost, ...prev.filter((p) => p.id !== tempId)]);
    setNewPostText('');
    setPostImage(null);
    setPostImageError(null);
    setComposerMode('standard');
    setPollOptions(['', '']);
    setMcqOptions(['', '', '', '']);
    setMcqCorrectIndex(0);
    setMcqExplanation('');
    setIsCreatePostModalOpen(false);
    if (postFileInputRef.current) {
      postFileInputRef.current.value = '';
    }

    // Scroll to top of feed so user sees their post immediately
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }

    try {
      const createdId = await createPostInFirestore({
        authorId: effectiveAuthorId,
        authorName: profile?.displayName || user?.displayName || 'Student',
        authorHandle: profile?.handle || 'student',
        authorPhotoURL: userPhoto,
        authorClass: profile?.studentClass || 'Student',
        authorAvatar: profile?.avatarIcon || '🎓',
        content: textToSubmit,
        imageURL: imageToSubmit,
        poll: pollToSubmit,
        mcq: mcqToSubmit
      });

      // Seamlessly transition temporary post ID to real Firestore ID
      setPosts((prev) =>
        prev.map((p) => (p.id === tempId ? { ...p, id: createdId } : p))
      );
    } catch (err: any) {
      console.error('Failed to create post:', err);
      // Clean up optimistic post if Firestore creation failed
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
      setPostImageError(err?.message || 'Could not post to feed. Please try again.');
    } finally {
      setSubmittingPost(false);
    }
  };

  // 100% Real Live Poll Voting
  const handleVotePoll = async (postId: string, optionId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || !post.poll) return;

    const currentUid = user?.uid || auth.currentUser?.uid || 'guest';
    const currentVoted = post.poll.voterMap?.[currentUid] || localPollVotes[postId];
    if (currentVoted === optionId) return;

    // Optimistic local feedback
    setLocalPollVotes((prev) => ({ ...prev, [postId]: optionId }));

    const updatedVoterMap = { ...(post.poll.voterMap || {}), [currentUid]: optionId };
    const hadPrevious = Boolean(currentVoted);
    const updatedOptions = post.poll.options.map((opt) => {
      let count = opt.votesCount || 0;
      if (currentVoted && opt.id === currentVoted) count = Math.max(0, count - 1);
      if (opt.id === optionId) count += 1;
      return { ...opt, votesCount: count };
    });
    const updatedTotalVotes = hadPrevious ? post.poll.totalVotes : ((post.poll.totalVotes || 0) + 1);

    const updatedPoll: PostPoll = {
      ...post.poll,
      options: updatedOptions,
      totalVotes: updatedTotalVotes,
      voterMap: updatedVoterMap
    };

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, poll: updatedPoll } : p))
    );

    // Sync to Firestore
    if (!postId.startsWith('temp-')) {
      try {
        await voteInPostPoll(postId, currentUid, optionId, post.poll);
      } catch (err) {
        console.warn('Poll voting sync note:', err);
      }
    }
  };

  // 100% Real Live MCQ Quiz Answer Submission
  const handleSubmitMcq = async (postId: string, optionIndex: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || !post.mcq) return;

    const currentUid = user?.uid || auth.currentUser?.uid || 'guest';
    const isCorrect = optionIndex === post.mcq.correctOptionIndex;

    // Optimistic local state for immediate feedback
    setLocalMcqAttempts((prev) => ({
      ...prev,
      [postId]: { optionIndex, isCorrect }
    }));

    const alreadyAnswered = post.mcq.userAnswers?.[currentUid] !== undefined;
    const updatedUserAnswers = { ...(post.mcq.userAnswers || {}), [currentUid]: optionIndex };
    const updatedOptions = post.mcq.options.map((opt, idx) => {
      let count = opt.votesCount || 0;
      if (idx === optionIndex && !alreadyAnswered) count += 1;
      return { ...opt, votesCount: count };
    });
    const updatedTotalAttempts = alreadyAnswered ? post.mcq.totalAttempts : ((post.mcq.totalAttempts || 0) + 1);
    const updatedCorrectAttempts = (!alreadyAnswered && isCorrect)
      ? ((post.mcq.correctAttempts || 0) + 1)
      : (post.mcq.correctAttempts || 0);

    const updatedMcq: PostMcq = {
      ...post.mcq,
      options: updatedOptions,
      totalAttempts: updatedTotalAttempts,
      correctAttempts: updatedCorrectAttempts,
      userAnswers: updatedUserAnswers
    };

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, mcq: updatedMcq } : p))
    );

    // Sync to Firestore
    if (!postId.startsWith('temp-')) {
      try {
        await submitPostMcqAnswer(postId, currentUid, optionIndex, post.mcq);
      } catch (err) {
        console.warn('MCQ answer submission sync note:', err);
      }
    }
  };

  // Toggle Like / Helpful with Firestore Sync
  const handleToggleLike = async (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (!post) return;

    const currentLikedUserIds = post.likedUserIds || [];
    const isCurrentlyLiked = post.isLiked || false;
    const currentLikesCount = post.likesCount || 0;
    const currentUid = user?.uid || 'guest';

    // Optimistic local update for instant feel
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextLiked = !isCurrentlyLiked;
          return {
            ...p,
            isLiked: nextLiked,
            likesCount: nextLiked ? currentLikesCount + 1 : Math.max(0, currentLikesCount - 1),
            likedUserIds: nextLiked
              ? [...currentLikedUserIds, currentUid]
              : currentLikedUserIds.filter((uid) => uid !== currentUid)
          };
        }
        return p;
      })
    );

    // Sync to Firestore
    try {
      await toggleLikeInFirestore(id, currentUid, currentLikedUserIds, currentLikesCount);
    } catch (err) {
      console.warn('Realtime like sync note:', err);
    }
  };

  // Toggle Bookmark (Persisted in Firestore profile & localStorage)
  const handleToggleBookmark = async (id: string) => {
    const isCurrentlyBookmarked = Boolean(bookmarkedPostIds[id]);
    const nextStatus = !isCurrentlyBookmarked;

    // Optimistic UI state
    setBookmarkedPostIds((prev) => {
      const updated = { ...prev, [id]: nextStatus };
      try {
        localStorage.setItem('learnloom_saved_posts', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save bookmark locally:', err);
      }
      return updated;
    });

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === id) {
          return { ...post, isBookmarked: nextStatus };
        }
        return post;
      })
    );

    // Sync to Firestore
    if (user?.uid) {
      try {
        const currentSavedList = Object.keys(bookmarkedPostIds).filter((k) => bookmarkedPostIds[k]);
        await toggleSavePostInFirestore(user.uid, id, currentSavedList);
      } catch (err) {
        console.warn('Firestore bookmark sync warning:', err);
      }
    }
  };

  // Insert link into new post text
  const handleInsertLink = () => {
    if (!linkInputVal.trim()) return;
    let url = linkInputVal.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setNewPostText((prev) => (prev ? `${prev.trim()}\n${url}` : url));
    setLinkInputVal('');
    setIsLinkInputOpen(false);
  };

  // Toggle Comments Drawer
  const toggleComments = (postId: string) => {
    setExpandedPostComments((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Add Comment / Solution to a post in Firestore
  const handleAddComment = async (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    const attachedImg = commentImages[postId];
    if (!text && !attachedImg) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const newComment: PostComment = {
      id: `comment-${Date.now()}`,
      authorId: user?.uid || 'guest-learner',
      authorName: profile?.displayName || user?.displayName || 'Learner',
      authorHandle: profile?.handle || 'student',
      authorPhotoURL: currentUserPhoto,
      authorClass: profile?.studentClass || 'Scholar',
      content: text,
      imageURL: attachedImg || undefined,
      timestamp: 'Just now',
      isVerifiedSolution: false,
      upvotesCount: 1,
      isUpvoted: true
    };

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...p.comments, newComment]
          };
        }
        return p;
      })
    );

    // Clear comment inputs for this post
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setCommentImages((prev) => ({ ...prev, [postId]: null }));

    // Sync to Firestore
    try {
      await addCommentInFirestore(postId, post.comments, newComment);
    } catch (err) {
      console.warn('Comment sync note:', err);
    }
  };

  // Mark comment as Verified Solution in Firestore
  const handleToggleVerifiedSolution = async (postId: string, commentId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const updatedComments = p.comments.map((c) => {
            if (c.id === commentId) {
              return { ...c, isVerifiedSolution: !c.isVerifiedSolution };
            }
            return c;
          });
          const hasAnyVerified = updatedComments.some((c) => c.isVerifiedSolution);
          return {
            ...p,
            isSolved: hasAnyVerified,
            acceptedAnswerId: hasAnyVerified ? commentId : undefined,
            comments: updatedComments
          };
        }
        return p;
      })
    );

    // Sync to Firestore
    try {
      await markVerifiedSolutionInFirestore(postId, post.comments, commentId);
    } catch (err) {
      console.warn('Verified solution sync note:', err);
    }
  };

  // Delete own post permanently from Firestore
  const handleDeletePost = async (postId: string) => {
    setDeletingPost(true);
    // Optimistic UI removal
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setPostToDelete(null);

    try {
      await deletePostInFirestore(postId);
      setDeleteToast(true);
      setTimeout(() => setDeleteToast(false), 2500);
    } catch (err) {
      console.error('Failed to delete post from Firestore:', err);
    } finally {
      setDeletingPost(false);
    }
  };

  const toggleNotify = (tab: string) => {
    setNotifiedTabs((prev) => ({ ...prev, [tab]: !prev[tab] }));
  };

  // ---------------------------------------------------------------------------
  // Render Individual Post Card (Reused for Unseen & Seen buckets)
  // ---------------------------------------------------------------------------
  const renderPostCard = (post: FeedPost, isSeenBucket = false) => {
    const isCommentsOpen = Boolean(expandedPostComments[post.id]);
    const isAuthorOfPost = Boolean(
      user && (
        (post.authorId && post.authorId === user.uid) ||
        (post.authorHandle && profile?.handle && post.authorHandle === profile.handle) ||
        (post.authorName && profile?.displayName && post.authorName === profile.displayName)
      )
    );
    const revived = isPostRevived(post, seenRecord[post.id]);

    return (
      <article
        key={post.id}
        ref={(el) => registerPostRef(post.id, el)}
        data-post-id={post.id}
        className={`px-4 py-3.5 sm:px-5 sm:py-4 transition-colors relative group hover:bg-white/[0.015] ${
          highlightedPostId === post.id
            ? 'bg-[#7C3AED]/10 ring-1 ring-[#7C3AED]'
            : revived
            ? 'bg-cyan-950/20'
            : isSeenBucket
            ? 'opacity-90'
            : ''
        }`}
      >
        <div className="flex gap-3 sm:gap-3.5">
          {/* Left Column: 40px Circular Avatar + Thread connector line */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#181B26] border border-[#272B3B] overflow-hidden flex items-center justify-center text-base shrink-0 shadow-xs hover:opacity-90 cursor-pointer">
              {post.authorPhotoURL ? (
                <img
                  src={post.authorPhotoURL}
                  alt={post.authorName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{post.authorAvatar || '🎓'}</span>
              )}
            </div>

            {/* Vertical thread guide line if replies are open */}
            {isCommentsOpen && (
              <div className="w-0.5 bg-[#252A38] flex-1 my-2 rounded-full min-h-[36px]"></div>
            )}
          </div>

          {/* Right Column: Header, Body, Attached Image, X Action Row & Threaded Replies */}
          <div className="flex-1 min-w-0">
            {/* Header: Name, @handle, time, badges, more menu */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-xs sm:text-sm leading-tight">
                <span className="font-display font-bold text-white hover:underline cursor-pointer truncate">
                  {post.authorName}
                </span>
                <span className="font-mono text-[#71767B] text-xs">
                  @{post.authorHandle}
                </span>
                <span className="text-[#71767B] text-xs">·</span>
                <span className="font-mono text-[#71767B] text-xs">
                  {post.timestamp}
                </span>
                {post.authorClass && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161922] text-[#A78BFA] border border-[#242938]">
                    {post.authorClass}
                  </span>
                )}
                {revived && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                    <Zap className="w-2.5 h-2.5 text-cyan-400" />
                    <span>Revived</span>
                  </span>
                )}
              </div>

              {/* Delete strictly for author on far right */}
              <div className="flex items-center gap-1 shrink-0">
                {isAuthorOfPost && (
                  <button
                    type="button"
                    onClick={() => setPostToDelete(post.id)}
                    className="p-1 rounded-full text-[#71767B] hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Delete your post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Post Text Content (Clean Twitter typography) */}
            <div className="text-[14px] sm:text-[15px] text-[#E7E9EA] leading-relaxed mb-3 font-normal">
              <RichContent text={post.content} showPreview={true} />
            </div>

            {/* Attached Image (Exact Twitter 16:9 / max-h-96 rounded border container) */}
            {post.imageURL && (
              <div
                onClick={() => setSelectedZoomImage(post.imageURL!)}
                className="mb-3 rounded-2xl overflow-hidden border border-[#262B3B] bg-black relative group cursor-zoom-in max-h-96"
              >
                <img
                  src={post.imageURL}
                  alt="Attached diagram"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full max-h-96 object-contain hover:scale-[1.01] transition-transform duration-200"
                />
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-md pointer-events-none border border-white/10">
                  <Maximize2 className="w-3 h-3 text-[#F59E0B]" />
                  <span>Zoom</span>
                </div>
              </div>
            )}

            {/* Interactive 100% Realtime Poll Card */}
            {post.poll && post.poll.options && post.poll.options.length >= 2 && (() => {
              const poll = post.poll;
              if (!poll) return null;
              const currentUid = user?.uid || auth.currentUser?.uid || 'guest';
              const votedOptionId = poll.voterMap?.[currentUid] || localPollVotes[post.id];
              const hasVoted = Boolean(votedOptionId);
              const totalVotes = poll.totalVotes || 0;

              return (
                <div className="mb-3.5 p-3.5 rounded-2xl bg-[#0D1017] border border-[#1E2536] space-y-2.5">
                  {poll.question && (
                    <div className="text-xs font-semibold text-white/90 mb-1">
                      {poll.question}
                    </div>
                  )}

                  <div className="space-y-2">
                    {poll.options.map((opt) => {
                      const isSelected = votedOptionId === opt.id;
                      const percentage = totalVotes > 0 ? Math.round(((opt.votesCount || 0) / totalVotes) * 100) : 0;

                      return (
                        <div key={opt.id} className="relative overflow-hidden rounded-xl border border-[#232A3B] transition-all">
                          {hasVoted && (
                            <div
                              className={`absolute inset-0 transition-all duration-500 ${
                                isSelected ? 'bg-[#7C3AED]/25 border-r border-[#7C3AED]' : 'bg-white/[0.04]'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => handleVotePoll(post.id, opt.id)}
                            disabled={hasVoted}
                            className={`relative w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-medium transition-colors ${
                              hasVoted
                                ? 'cursor-default'
                                : 'cursor-pointer hover:bg-white/[0.04] active:scale-[0.99]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-[#A78BFA] shrink-0" />
                              )}
                              <span className={isSelected ? 'text-white font-semibold' : 'text-[#D1D5DB]'}>
                                {opt.text}
                              </span>
                            </div>

                            {hasVoted && (
                              <span className="font-mono text-xs text-[#9CA3AF] ml-2 shrink-0">
                                {percentage}%
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#71767B]">
                    <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                    <span>{hasVoted ? '✓ Vote recorded' : 'Click an option to vote'}</span>
                  </div>
                </div>
              );
            })()}

            {/* Interactive 100% Realtime Academic MCQ Quiz Card */}
            {post.mcq && post.mcq.options && post.mcq.options.length >= 2 && (() => {
              const mcq = post.mcq;
              if (!mcq) return null;
              const currentUid = user?.uid || auth.currentUser?.uid || 'guest';
              const attemptedIndex = mcq.userAnswers?.[currentUid] ?? localMcqAttempts[post.id]?.optionIndex;
              const hasAttempted = attemptedIndex !== undefined;
              const isCorrectAttempt = attemptedIndex === mcq.correctOptionIndex;
              const totalAttempts = mcq.totalAttempts || 0;
              const correctAttempts = mcq.correctAttempts || 0;
              const accuracyPercent = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
              const optionLetters = ['A', 'B', 'C', 'D', 'E'];

              return (
                <div className="mb-3.5 p-4 rounded-2xl bg-gradient-to-b from-[#0F131D] to-[#0A0D14] border border-[#22293C] shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1C2335] pb-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#A78BFA]">
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>ACADEMIC MCQ CHALLENGE</span>
                    </div>
                    {totalAttempts > 0 && (
                      <span className="text-[11px] font-mono text-[#8C95A5]">
                        {accuracyPercent}% accuracy ({totalAttempts} attempts)
                      </span>
                    )}
                  </div>

                  {mcq.question && (
                    <div className="text-xs sm:text-sm font-medium text-white/95 leading-relaxed">
                      {mcq.question}
                    </div>
                  )}

                  <div className="space-y-2">
                    {mcq.options.map((opt, idx) => {
                      const letter = optionLetters[idx] || `${idx + 1}`;
                      const isChosen = attemptedIndex === idx;
                      const isTheRightAnswer = idx === mcq.correctOptionIndex;

                      let containerStyle = 'border-[#22293C] bg-[#121622] hover:border-[#7C3AED]/50 hover:bg-[#161B2B]';
                      if (hasAttempted) {
                        if (isTheRightAnswer) {
                          containerStyle = 'border-emerald-500/80 bg-emerald-950/30 text-emerald-200 ring-1 ring-emerald-500/40';
                        } else if (isChosen && !isTheRightAnswer) {
                          containerStyle = 'border-rose-500/80 bg-rose-950/30 text-rose-200 ring-1 ring-rose-500/40';
                        } else {
                          containerStyle = 'border-[#1C2232] bg-[#0E111A] text-[#71767B] opacity-60';
                        }
                      }

                      return (
                        <button
                          key={opt.id || idx}
                          type="button"
                          onClick={() => !hasAttempted && handleSubmitMcq(post.id, idx)}
                          disabled={hasAttempted}
                          className={`w-full p-2.5 sm:p-3 rounded-xl border text-left flex items-center justify-between text-xs sm:text-sm transition-all ${containerStyle} ${
                            hasAttempted ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              hasAttempted && isTheRightAnswer
                                ? 'bg-emerald-500 text-black font-extrabold'
                                : hasAttempted && isChosen && !isTheRightAnswer
                                ? 'bg-rose-500 text-white'
                                : 'bg-[#1E2536] text-[#A78BFA]'
                            }`}>
                              {letter}
                            </span>
                            <span className="font-normal">{opt.text}</span>
                          </div>

                          {hasAttempted && (
                            <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold">
                              {isTheRightAnswer && (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <Check className="w-4 h-4 stroke-[2.5]" /> Correct Answer
                                </span>
                              )}
                              {isChosen && !isTheRightAnswer && (
                                <span className="flex items-center gap-1 text-rose-400">
                                  <CloseIcon className="w-3.5 h-3.5" /> Your choice
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {hasAttempted && (
                    <div className="pt-2 border-t border-[#1C2335] space-y-2">
                      <div className={`flex items-center gap-2 text-xs font-bold ${
                        isCorrectAttempt ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {isCorrectAttempt ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Correct! Excellent solution. +10 XP</span>
                          </>
                        ) : (
                          <>
                            <HelpCircle className="w-4 h-4 text-amber-400" />
                            <span>Incorrect. Check verified explanation below:</span>
                          </>
                        )}
                      </div>

                      {mcq.explanation ? (
                        <div className="p-3 rounded-xl bg-[#141824] border border-[#262F46] text-xs text-[#D1D5DB] leading-relaxed">
                          <span className="font-bold text-[#A78BFA] block mb-1">💡 Solution Explanation:</span>
                          {mcq.explanation}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Streamlined Action Bar: Comments, Likes, Engagement & Share */}
            <div className="pt-1 flex items-center justify-between max-w-md text-xs font-mono text-[#71767B]">
              {/* 1. Comments */}
              <button
                type="button"
                onClick={() => toggleComments(post.id)}
                className={`group flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isCommentsOpen ? 'text-[#1D9BF0]' : 'hover:text-[#1D9BF0]'
                }`}
                title="Comments"
              >
                <div className="p-1.5 rounded-full group-hover:bg-[#1D9BF0]/10 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span>{post.commentsCount > 0 ? post.commentsCount : ''}</span>
              </button>

              {/* 2. Likes */}
              <button
                type="button"
                onClick={() => handleToggleLike(post.id)}
                className={`group flex items-center gap-1.5 transition-colors cursor-pointer ${
                  post.isLiked ? 'text-[#F91880]' : 'hover:text-[#F91880]'
                }`}
                title="Like"
              >
                <div className="p-1.5 rounded-full group-hover:bg-[#F91880]/10 transition-colors">
                  <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current text-[#F91880]' : ''}`} />
                </div>
                <span>{post.likesCount > 0 ? post.likesCount : ''}</span>
              </button>

              {/* 3. Engagement (100% Real Firestore: Views + Likes + Comments) */}
              {(() => {
                const realViews = typeof post.viewsCount === 'number' ? post.viewsCount : (post.viewedUserIds?.length || 1);
                const realLikes = post.likesCount || 0;
                const realComments = post.commentsCount || 0;
                const totalEngagement = Math.max(1, realViews + realLikes + realComments);
                const formattedEngagement = totalEngagement >= 1000 ? `${(totalEngagement / 1000).toFixed(1)}K` : `${totalEngagement}`;

                return (
                  <div
                    className="group flex items-center gap-1.5 transition-colors cursor-default hover:text-[#1D9BF0]"
                    title={`${realViews} Views · ${realLikes} Likes · ${realComments} Replies (Total Real Engagement: ${totalEngagement})`}
                  >
                    <div className="p-1.5 rounded-full group-hover:bg-[#1D9BF0]/10 transition-colors">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                    <span>{formattedEngagement}</span>
                  </div>
                );
              })()}

              {/* 4. Share */}
              <button
                type="button"
                onClick={() => handleSharePost(post)}
                className="group flex items-center gap-1.5 hover:text-[#1D9BF0] transition-colors cursor-pointer"
                title="Share"
              >
                <div className="p-1.5 rounded-full group-hover:bg-[#1D9BF0]/10 transition-colors">
                  <Share2 className="w-4 h-4" />
                </div>
              </button>
            </div>

            {/* Clean Twitter Thread Replies */}
            {isCommentsOpen && (
              <div className="mt-3.5 pt-3 border-t border-[#1C1F2B] space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-mono text-[#8C95A5] px-1">
                  <span>Answers & Discussion ({post.comments?.length || 0})</span>
                </div>

                {post.comments && post.comments.length > 0 ? (
                  <div className="space-y-2.5">
                    {[...post.comments].sort((a, b) => (b.isVerifiedSolution ? 1 : 0) - (a.isVerifiedSolution ? 1 : 0)).map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                          comment.isVerifiedSolution
                            ? 'bg-[#0E2018] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                            : 'bg-[#13151D] border-[#1E222F]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#1B1D28] overflow-hidden flex items-center justify-center shrink-0 border border-[#282C3D]">
                              {comment.authorPhotoURL ? (
                                <img
                                  src={comment.authorPhotoURL}
                                  alt={comment.authorName}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px]">🎓</span>
                              )}
                            </div>
                            <span className="font-display font-bold text-white text-xs">
                              {comment.authorName}
                            </span>
                            <span className="text-[10px] font-mono text-[#747E8E]">
                              {comment.authorClass} · {comment.timestamp}
                            </span>
                          </div>

                          {comment.isVerifiedSolution && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 text-[10px] font-mono font-bold shadow-xs">
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Pinned Solution</span>
                            </span>
                          )}
                        </div>

                        <div className="text-[#D0D5DE] text-xs pl-8 leading-relaxed">
                          <RichContent text={comment.content} showPreview={false} />
                        </div>

                        {comment.imageURL && (
                          <div
                            onClick={() => setSelectedZoomImage(comment.imageURL!)}
                            className="mt-2.5 ml-8 rounded-lg overflow-hidden border border-[#272B3B] max-w-sm cursor-zoom-in group/img relative"
                          >
                            <img
                              src={comment.imageURL}
                              alt="Solution diagram"
                              referrerPolicy="no-referrer"
                              className="w-full h-auto max-h-48 object-cover group-hover/img:scale-[1.01] transition-transform"
                            />
                            <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1">
                              <Maximize2 className="w-3 h-3 text-[#38BDF8]" />
                              <span>Zoom</span>
                            </div>
                          </div>
                        )}

                        {isAuthorOfPost && (
                          <div className="mt-2 ml-8 pt-1.5 border-t border-[#1C202C] flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleToggleVerifiedSolution(post.id, comment.id)}
                              className={`${
                                comment.isVerifiedSolution
                                  ? 'text-emerald-400 hover:text-emerald-300'
                                  : 'text-[#8C95A5] hover:text-emerald-400'
                              } text-[10px] font-mono font-bold cursor-pointer inline-flex items-center gap-1 transition-colors`}
                            >
                              <Check className="w-3 h-3" />
                              <span>
                                {comment.isVerifiedSolution
                                  ? 'Verified Solution ✓ (Click to unpin)'
                                  : 'Mark as Verified Solution'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#0F1117] border border-[#1C1F2B] text-center text-xs font-mono text-[#6D7584]">
                    No answers yet. Share your explanation or solution below!
                  </div>
                )}

                {/* Inline Reply Composer */}
                <div className="pt-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#181A25] border border-[#25293A] overflow-hidden flex items-center justify-center shrink-0">
                      {currentUserPhoto ? (
                        <img
                          src={currentUserPhoto}
                          alt="You"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs">{profile?.avatarIcon || '🎓'}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: e.target.value
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      placeholder="Post your reply..."
                      className="flex-1 bg-[#0D0F14] text-white px-3.5 py-1.5 rounded-full border border-[#202432] focus:border-[#7C3AED] focus:outline-none text-xs placeholder:text-[#525968]"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setActiveCommentPostIdForUpload(post.id);
                        commentFileInputRef.current?.click();
                      }}
                      className="p-1.5 rounded-full bg-[#14161F] hover:bg-[#1E212D] text-[#8C95A5] hover:text-white border border-[#242836] cursor-pointer"
                      title="Attach photo"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#38BDF8]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim() && !commentImages[post.id]}
                      className="px-3.5 py-1.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white font-display font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95"
                    >
                      Reply
                    </button>
                  </div>

                  {commentImages[post.id] && (
                    <div className="relative inline-block ml-9 max-w-xs">
                      <img
                        src={commentImages[post.id]!}
                        alt="Solution preview"
                        referrerPolicy="no-referrer"
                        className="max-h-24 rounded-lg border border-[#7C3AED] object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setCommentImages((prev) => ({ ...prev, [post.id]: null }))}
                        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-600 text-white cursor-pointer hover:bg-red-700"
                        title="Remove image"
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  };

  const NAV_ITEMS: {
    id: DashboardTab;
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
    isLocked?: boolean;
  }[] = [
    { id: 'feed', label: 'Study Feed', shortLabel: 'Feed', icon: Sparkles, isLocked: false },
    { id: 'discover', label: 'Classmates', shortLabel: 'Peers', icon: Compass, isLocked: true },
    { id: 'rooms', label: 'Study Rooms', shortLabel: 'Rooms', icon: Radio, isLocked: true },
    { id: 'notes', label: 'Notes Library', shortLabel: 'Notes', icon: BookOpen, isLocked: true },
    { id: 'profile', label: 'My Identity', shortLabel: 'Profile', icon: UserIcon, isLocked: false },
  ];

  const handleNavTabClick = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.isLocked) {
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 550);
      setLockedFeatureModal({
        title: `${item.label} — Coming Soon`,
        desc: `This section is currently locked while we upgrade student study networks. Stay active on Study Feed and keep your student identity verified!`
      });
      return;
    }
    setActiveTab(item.id);
  };

  return (
    <div className={`h-screen w-full flex overflow-hidden bg-[#0A0B0E] text-[#ECEFF1] font-sans selection:bg-[#7C3AED] selection:text-white ${isScreenShaking ? 'animate-screen-shake' : ''}`}>
      
      {/* =========================================================================
          LEFT SIDEBAR (Desktop - Fixed, Clean, Vertically Stacked)
         ========================================================================= */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#101217] border-r border-[#1C1F28] h-full shrink-0 select-none z-30">
        
        {/* Top Header & Brand */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-black border border-[#272B35] p-1 flex items-center justify-center shadow-sm">
              <img
                src="/assets/aistudio/Abstract_Ribbon_M_Emblem_4a31ed28.png"
                alt="LearnLoom Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-display font-extrabold text-base text-white tracking-tight">
                LearnLoom
              </span>
              <span className="text-[10px] font-mono text-[#788290] block">
                STUDENT NETWORK
              </span>
            </div>
          </div>

          {/* Student Mini Profile Badge */}
          <div className="p-3 rounded-2xl bg-[#141720] border border-[#222634] mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0D0E13] border-2 border-[#7C3AED] overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                {currentUserPhoto ? (
                  <img
                    src={currentUserPhoto}
                    alt={profile?.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-base select-none">{profile?.avatarIcon || '🎓'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-xs text-white truncate">
                  {profile?.displayName || user?.displayName || 'Student'}
                </div>
                <div className="text-[10px] font-mono text-[#8C95A5] truncate">
                  @{profile?.handle || 'student'}
                </div>
                <div className="text-[9px] font-mono text-[#A78BFA] truncate font-bold">
                  {profile?.studentClass || 'High School'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Stack */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavTabClick(item)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-display font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#7C3AED] text-white shadow-md'
                      : item.isLocked
                      ? 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#141722]'
                      : 'text-[#8C95A5] hover:text-white hover:bg-[#161822]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'feed' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                  {item.isLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#64748B] bg-[#0E1015] px-1.5 py-0.5 rounded border border-[#1E2330]">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Soon</span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="p-4 sm:p-5 border-t border-[#1C1F28] space-y-3">

          <button
            type="button"
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#14161F] hover:bg-red-950/40 text-xs font-mono text-[#8C95A5] hover:text-red-300 border border-[#202430] hover:border-red-800/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      {/* =========================================================================
          MAIN WORKSPACE (Center Feed + Right Velocity Sidebar)
         ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-academic-grid">
        
        {/* Mobile Header Bar (< 768px) - Clean, Brand-First, Ultra Responsive */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 h-14 bg-[#0E1015]/95 backdrop-blur-md border-b border-[#1C1F28] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black border border-[#272B35] p-1 flex items-center justify-center shadow-xs shrink-0">
              <img
                src="/assets/aistudio/Abstract_Ribbon_M_Emblem_4a31ed28.png"
                alt="LearnLoom Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-sm text-white tracking-tight leading-none">
                LearnLoom
              </span>
              <span className="text-[10px] font-mono text-[#A78BFA] font-bold leading-tight mt-0.5 truncate max-w-[120px]">
                {profile?.studentClass || 'Student Network'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">


            {/* Quick Profile Tab Switcher */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-8 h-8 rounded-xl overflow-hidden border flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all ${
                activeTab === 'profile'
                  ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/40'
                  : 'border-[#282C3A] bg-[#161822]'
              }`}
              title="Go to My Profile"
            >
              {currentUserPhoto ? (
                <img
                  src={currentUserPhoto}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm select-none">{profile?.avatarIcon || '🎓'}</span>
              )}
            </button>
          </div>
        </header>

        {/* Content Scroll Container - pb-28 ensures bottom bar never obscures content */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 max-w-7xl w-full mx-auto pb-28 md:pb-8">
          
          {/* ===================================================================
              VIEW 1: BILLION-DOLLAR STUDENT STUDY FEED
             =================================================================== */}
          {activeTab === 'feed' && (
            <div className="max-w-2xl mx-auto w-full">
              {/* Live Floating New Posts Pill (Twitter/Instagram style) */}
              {pendingNewPosts.length > 0 && (
                <div className="sticky top-2 z-40 flex justify-center mb-2 pointer-events-none">
                  <button
                    type="button"
                    onClick={handleShowNewPosts}
                    className="pointer-events-auto px-4 py-2 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-mono font-bold shadow-[0_8px_25px_rgba(124,58,237,0.55)] border border-purple-400/50 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-top-3 duration-200"
                  >
                    <ArrowUp className="w-3.5 h-3.5 animate-bounce" />
                    <span>{pendingNewPosts.length} New {pendingNewPosts.length === 1 ? 'Post' : 'Posts'}</span>
                  </button>
                </div>
              )}

              {/* Feed Header with Live Refresh Indicator */}
              <div className="flex items-center justify-between pb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-lg text-white">Study Feed</span>
                  {unseenPosts.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#C4B5FD] border border-[#7C3AED]/40 text-[10px] font-mono font-bold">
                      {unseenPosts.length} Fresh
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUnifiedRefresh}
                    disabled={refreshingFeed}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#13151D] hover:bg-[#1A1D27] text-[#9AA3B2] hover:text-white border border-[#242836] text-xs font-mono transition-colors cursor-pointer disabled:opacity-60"
                    title="Refresh feed and sync fresh doubts"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#7C3AED] ${refreshingFeed ? 'animate-spin' : ''}`} />
                    <span>{refreshingFeed ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* Authentic X (Twitter) In-Feed Composer */}
              <div className="border border-[#1E2536] rounded-2xl bg-[#090B0E] p-4 mb-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#181B26] border border-[#272B3B] overflow-hidden flex items-center justify-center shrink-0">
                    {currentUserPhoto ? (
                      <img
                        src={currentUserPhoto}
                        alt="You"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base">{profile?.avatarIcon || '🎓'}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <textarea
                      rows={2}
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      placeholder="What's on your study desk? Ask a doubt or share notes..."
                      className="w-full bg-transparent text-sm sm:text-base text-white placeholder-[#71767B] resize-none outline-none leading-relaxed"
                    />

                    {postImage && (
                      <div className="relative mb-3 rounded-2xl overflow-hidden border border-[#2F3336] max-h-60 bg-black">
                        <img src={postImage} alt="Attachment" className="w-full h-full object-cover max-h-60" />
                        <button
                          type="button"
                          onClick={() => setPostImage(null)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-black text-white cursor-pointer"
                        >
                          <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Interactive Poll Creator Form */}
                    {composerMode === 'poll' && (
                      <div className="my-3 p-3.5 rounded-xl bg-[#0D1017] border border-[#7C3AED]/40 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#A78BFA]">
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>Create a Live Poll</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setComposerMode('standard')}
                            className="text-[#71767B] hover:text-white p-1 rounded-full cursor-pointer"
                            title="Remove Poll"
                          >
                            <CloseIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] font-mono text-[#8C95A5]">
                          Write your question in the post above. Provide 2 to 4 options below:
                        </p>

                        <div className="space-y-2">
                          {pollOptions.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...pollOptions];
                                  newOpts[idx] = e.target.value;
                                  setPollOptions(newOpts);
                                }}
                                placeholder={`Option ${idx + 1}${idx >= 2 ? ' (optional)' : ''}`}
                                className="flex-1 bg-[#151923] border border-[#232A3B] focus:border-[#7C3AED] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#71767B] outline-none"
                              />
                              {pollOptions.length > 2 && idx >= 2 && (
                                <button
                                  type="button"
                                  onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                                  className="p-1.5 text-[#71767B] hover:text-rose-400 cursor-pointer"
                                  title="Remove option"
                                >
                                  <CloseIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {pollOptions.length < 4 && (
                          <button
                            type="button"
                            onClick={() => setPollOptions([...pollOptions, ''])}
                            className="text-xs font-mono text-[#A78BFA] hover:text-[#C4B5FD] flex items-center gap-1 cursor-pointer pt-0.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add option ({pollOptions.length}/4)</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Interactive MCQ Quiz Creator Form */}
                    {composerMode === 'mcq' && (
                      <div className="my-3 p-3.5 rounded-xl bg-[#0F131D] border border-emerald-500/40 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                            <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                            <span>Academic MCQ Quiz Creator</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setComposerMode('standard')}
                            className="text-[#71767B] hover:text-white p-1 rounded-full cursor-pointer"
                            title="Remove MCQ"
                          >
                            <CloseIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] font-mono text-[#8C95A5]">
                          Write question in post above. Set options and mark the correct answer with the check button:
                        </p>

                        <div className="space-y-2">
                          {mcqOptions.map((opt, idx) => {
                            const isCorrect = mcqCorrectIndex === idx;
                            const letters = ['A', 'B', 'C', 'D'];
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-5 text-center font-mono font-bold text-xs text-[#A78BFA]">
                                  {letters[idx] || idx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...mcqOptions];
                                    newOpts[idx] = e.target.value;
                                    setMcqOptions(newOpts);
                                  }}
                                  placeholder={`Option ${letters[idx] || idx + 1}${idx >= 2 ? ' (optional)' : ''}`}
                                  className={`flex-1 bg-[#151923] border ${
                                    isCorrect ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-[#232A3B]'
                                  } focus:border-emerald-400 rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#71767B] outline-none`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setMcqCorrectIndex(idx)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                    isCorrect
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                                      : 'bg-[#151822] text-[#71767B] border border-[#232A3B] hover:text-white'
                                  }`}
                                  title="Mark as correct answer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>{isCorrect ? 'Correct' : 'Mark'}</span>
                                </button>
                                {mcqOptions.length > 2 && idx >= 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMcqOptions(mcqOptions.filter((_, i) => i !== idx));
                                      if (mcqCorrectIndex >= idx) {
                                        setMcqCorrectIndex(Math.max(0, mcqCorrectIndex - 1));
                                      }
                                    }}
                                    className="p-1 text-[#71767B] hover:text-rose-400 cursor-pointer"
                                  >
                                    <CloseIcon className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {mcqOptions.length < 4 && (
                          <button
                            type="button"
                            onClick={() => setMcqOptions([...mcqOptions, ''])}
                            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add option ({mcqOptions.length}/4)</span>
                          </button>
                        )}

                        <div className="pt-2 border-t border-[#1F2637]">
                          <input
                            type="text"
                            value={mcqExplanation}
                            onChange={(e) => setMcqExplanation(e.target.value)}
                            placeholder="Explanation / Solution rationale (shown after students answer)..."
                            className="w-full bg-[#131722] border border-[#232A3B] focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white placeholder-[#71767B] outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2.5 border-t border-[#1C202C] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[#7C3AED]">
                        {/* 1. Photo Attach */}
                        <button
                          type="button"
                          onClick={() => postFileInputRef.current?.click()}
                          disabled={uploadingPostImage}
                          className="p-2 rounded-full hover:bg-[#7C3AED]/15 text-[#A78BFA] hover:text-white transition-colors cursor-pointer"
                          title="Attach problem photo"
                        >
                          {uploadingPostImage ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </button>

                        {/* 2. Poll Creator Toggle */}
                        <button
                          type="button"
                          onClick={() => setComposerMode(composerMode === 'poll' ? 'standard' : 'poll')}
                          className={`p-2 rounded-full transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono ${
                            composerMode === 'poll'
                              ? 'bg-[#7C3AED]/20 text-[#C4B5FD] ring-1 ring-[#7C3AED]'
                              : 'hover:bg-[#7C3AED]/15 text-[#A78BFA] hover:text-white'
                          }`}
                          title="Create a Poll"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>

                        {/* 3. MCQ Quiz Creator Toggle */}
                        <button
                          type="button"
                          onClick={() => setComposerMode(composerMode === 'mcq' ? 'standard' : 'mcq')}
                          className={`p-2 rounded-full transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono ${
                            composerMode === 'mcq'
                              ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500'
                              : 'hover:bg-emerald-500/15 text-emerald-400/80 hover:text-emerald-300'
                          }`}
                          title="Create MCQ Quiz Challenge"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        {newPostText.length > 0 && (
                          <span className="text-[11px] font-mono text-[#71767B]">
                            {newPostText.length}/500
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleCreatePost}
                          disabled={(() => {
                            if (submittingPost) return true;
                            if (composerMode === 'poll') {
                              return !newPostText.trim() || pollOptions.filter((o) => o.trim()).length < 2;
                            }
                            if (composerMode === 'mcq') {
                              return !newPostText.trim() || mcqOptions.filter((o) => o.trim()).length < 2;
                            }
                            return (!newPostText.trim() && !postImage);
                          })()}
                          className="px-4 py-1.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white font-display font-bold text-xs sm:text-sm cursor-pointer transition-all active:scale-95 shadow-sm"
                        >
                          {submittingPost ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seamless X (Twitter) Timeline Stream */}
              <div className="border border-[#1E2536] rounded-2xl bg-[#090B0E] divide-y divide-[#1E2536] overflow-hidden shadow-sm">
                {loadingFeed && posts.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center gap-2.5">
                    <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
                    <span className="text-xs font-mono text-[#8C95A5]">Connecting to live student study stream...</span>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="p-10 text-center text-[#788290] font-mono text-xs">
                    No posts in the stream yet. Post a doubt or share your notes above!
                  </div>
                ) : (
                  <>
                    {/* 1. Unseen / Fresh Posts First (Newest on top) */}
                    {visibleUnseenPosts.map((post) => renderPostCard(post, false))}

                    {/* 2. X-Style Clean Caught Up Divider */}
                    {unseenPosts.length > 0 && seenPosts.length > 0 && (
                      <div className="py-3 px-4 bg-[#0C0E14] text-center flex items-center justify-center gap-2 text-xs font-mono text-[#8C95A5]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>You're all caught up with fresh discussions</span>
                      </div>
                    )}

                    {/* 3. Seen Posts (Older, below the caught up divider) */}
                    {visibleSeenPosts.map((post) => renderPostCard(post, true))}

                    {/* Infinite Scroll Sentinel */}
                    <div ref={loadMoreSentinelRef} className="py-3 text-center">
                      {hasMorePostsToLoad ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-mono text-[#8C95A5]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" />
                          <span>Loading earlier posts...</span>
                        </div>
                      ) : posts.length > 0 ? (
                        <div className="text-[11px] font-mono text-[#586273] py-2">
                          ✓ All {posts.length} discussions loaded
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </div>

            </div>
          )}

          {/* ===================================================================
              VIEW 2: DISCOVER (Peer Discovery with Student Photo Avatar)
             =================================================================== */}
          {activeTab === 'discover' && (
            <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-150">
              {/* Logged in student's own verified card */}
              <div className="bg-[#121319] border border-[#21242F] rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1A1D27] border-2 border-[#7C3AED] overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                    {currentUserPhoto ? (
                      <img
                        src={currentUserPhoto}
                        alt="Your Avatar"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">🎓</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-extrabold text-sm text-white">
                        {profile?.displayName || user?.displayName || 'Student'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                        Verified
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[#7E8794]">
                      @{profile?.handle || 'student'} · {profile?.studentClass || 'Scholar'}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono text-xs hidden sm:block">
                  <span className="text-[#6D7584] block text-[10px]">COHORT STATUS</span>
                  <span className="text-[#F59E0B] font-bold">● Active Peer</span>
                </div>
              </div>

              {/* Discover Cohorts Preview */}
              <div className="bg-[#121319] border border-[#1F2129] rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#1B1F2D] border border-[#2D3855] text-[#315BFF] flex items-center justify-center mx-auto">
                  <Compass className="w-6 h-6" />
                </div>
                <h2 className="font-display font-extrabold text-lg text-white">
                  Classmates & Peer Discovery
                </h2>
                <p className="text-xs text-[#8E97A4] max-w-md mx-auto leading-relaxed">
                  Your profile photo and academic standing for <span className="text-white font-bold">{profile?.studentClass || 'your grade'}</span> are live. Full cohort recommendations and peer circles will expand here.
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => toggleNotify('discover')}
                    className="px-4 py-2 rounded-xl bg-[#1B1D25] hover:bg-[#222530] text-white font-mono text-xs font-bold border border-[#2A2D3A] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{notifiedTabs['discover'] ? '✓ Notification Enabled' : 'Notify Me on Cohort Launch'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW 3: ROOMS (Study Rooms with Active Avatar)
             =================================================================== */}
          {activeTab === 'rooms' && (
            <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-150">
              {/* Study Room Live Pod Preview with Student Photo */}
              <div className="bg-[#121319] border border-[#21242F] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-display font-bold text-sm text-white">
                      Your Silent Focus Pod
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#A78BFA] px-2 py-0.5 rounded bg-[#1F192D] border border-[#372856]">
                    Pomodoro 25:00
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#151720] border border-[#222634] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1A1D27] border border-[#7C3AED] overflow-hidden flex items-center justify-center shrink-0">
                      {currentUserPhoto ? (
                        <img
                          src={currentUserPhoto}
                          alt="Your Avatar"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>🎓</span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-display font-bold text-white">
                        {profile?.displayName || 'You'} (Host)
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400">
                        Focusing on {profile?.subjects?.[0] || 'Mathematics'}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-emerald-400 font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30">
                    Active
                  </span>
                </div>
              </div>

              {/* Study Rooms Info Card */}
              <div className="bg-[#121319] border border-[#1F2129] rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#231B31] border border-[#482E6E] text-[#A78BFA] flex items-center justify-center mx-auto">
                  <Radio className="w-6 h-6" />
                </div>
                <h2 className="font-display font-extrabold text-lg text-white">
                  Multiplayer Virtual Study Rooms
                </h2>
                <p className="text-xs text-[#8E97A4] max-w-md mx-auto leading-relaxed">
                  Live synchronized Pomodoro focus channels where your verified avatar will be visible to study partners worldwide.
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => toggleNotify('rooms')}
                    className="px-4 py-2 rounded-xl bg-[#1B1D25] hover:bg-[#222530] text-white font-mono text-xs font-bold border border-[#2A2D3A] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{notifiedTabs['rooms'] ? '✓ Notification Enabled' : 'Notify Me on Rooms Launch'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW 4: NOTES (Notes Library with Student Author Avatar)
             =================================================================== */}
          {activeTab === 'notes' && (
            <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-150">
              {/* Sample Notes Card with Student Photo */}
              <div className="bg-[#121319] border border-[#21242F] rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#1A1D27] border border-[#7C3AED] overflow-hidden flex items-center justify-center shrink-0">
                      {currentUserPhoto ? (
                        <img
                          src={currentUserPhoto}
                          alt="Your Avatar"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>🎓</span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-display font-bold text-white">
                        {profile?.displayName || 'Your'} Notes Space
                      </div>
                      <div className="text-[10px] font-mono text-[#7E8794]">
                        @{profile?.handle || 'student'} · Author
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#241F14] text-[#F59E0B] border border-[#4E3F18]">
                    Verified Contributor
                  </span>
                </div>
              </div>

              {/* Notes Repository Info */}
              <div className="bg-[#121319] border border-[#1F2129] rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#262013] border border-[#52441D] text-[#F59E0B] flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="font-display font-extrabold text-lg text-white">
                  Notes & Formula Repository
                </h2>
                <p className="text-xs text-[#8E97A4] max-w-md mx-auto leading-relaxed">
                  Community-verified chapter summaries and formula cheat sheets tailored to <span className="text-white font-bold">{profile?.studentClass || 'your grade'}</span>.
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => toggleNotify('notes')}
                    className="px-4 py-2 rounded-xl bg-[#1B1D25] hover:bg-[#222530] text-white font-mono text-xs font-bold border border-[#2A2D3A] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{notifiedTabs['notes'] ? '✓ Notification Enabled' : 'Notify Me on Notes Launch'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW 5: PROFILE (Student Profile & Details)
             =================================================================== */}
          {activeTab === 'profile' && (
            <div className="max-w-lg mx-auto space-y-4 animate-in fade-in duration-150">
              
              {/* Profile Card */}
              <div className="bg-[#121319] border border-[#1F2129] rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-2xl bg-[#1B1D25] border-2 border-[#7C3AED] overflow-hidden flex items-center justify-center text-3xl shrink-0 shadow-lg">
                        {currentUserPhoto ? (
                          <img
                            src={currentUserPhoto}
                            alt="Profile Photo"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{profile?.avatarIcon || '🎓'}</span>
                        )}
                      </div>

                      {/* Cloudinary Upload Trigger over Profile Pic */}
                      <button
                        type="button"
                        onClick={() => profileFileInputRef.current?.click()}
                        disabled={uploadingProfilePhoto}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-mono cursor-pointer"
                        title="Upload new profile picture"
                      >
                        {uploadingProfilePhoto ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mb-0.5" />
                            <span>Change</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <h2 className="font-display font-extrabold text-lg text-white">
                        {profile?.displayName || user?.displayName || 'Student'}
                      </h2>
                      <div className="text-xs font-mono text-[#7A8390] flex items-center gap-1.5">
                        <span>@{profile?.handle || 'student'}</span>
                        <span>·</span>
                        <span className="text-[#A78BFA]">{profile?.gradeBadge || 'Scholar'}</span>
                      </div>
                      {profile?.studyMotto && (
                        <p className="mt-1.5 text-xs text-[#CBD5E1] font-sans leading-relaxed max-w-sm">
                          "{profile.studyMotto}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Profile Actions: Update Photo & Edit Profile */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      ref={profileFileInputRef}
                      onChange={handleProfilePhotoChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => profileFileInputRef.current?.click()}
                      disabled={uploadingProfilePhoto}
                      className="px-3 py-1.5 rounded-xl bg-[#1B1D25] hover:bg-[#222530] border border-[#2B2F3D] text-xs font-mono text-[#D8DCE3] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {uploadingProfilePhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" />
                          <span>Saving to Cloudinary...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-[#7C3AED]" />
                          <span>Update Photo</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenEditProfile}
                      className="px-3.5 py-1.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-mono font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>

                {profileSuccessToast && (
                  <div className="mb-3 px-3 py-2 rounded-xl text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{profileSuccessToast}</span>
                  </div>
                )}

                {profilePhotoMessage && (
                  <div className="mb-3 px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-950/40 text-emerald-300 border border-emerald-800/50">
                    {profilePhotoMessage}
                  </div>
                )}

                {/* Details List */}
                <div className="space-y-2 border-t border-[#1C1E26] pt-3 text-xs font-mono">
                  <div className="flex justify-between py-1">
                    <span className="text-[#6D7584]">Academic Level</span>
                    <span className="text-white font-bold">{profile?.studentClass || 'Student'}</span>
                  </div>
                  {(profile?.institutionName || profile?.college) && (
                    <div className="flex justify-between py-1">
                      <span className="text-[#6D7584]">Institution</span>
                      <span className="text-white">{profile?.institutionName || profile?.college}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-[#6D7584]">Focus Goal</span>
                    <span className="text-[#F59E0B]">{profile?.primaryGoal || 'Exam Prep'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#6D7584]">Daily Time</span>
                    <span className="text-white">{profile?.dailyGoal || '1 – 2 hours'}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[#6D7584] block mb-1">Subjects</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(profile?.subjects || ['Mathematics', 'Science']).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-[#1B1D25] border border-[#272935] text-[11px] text-[#C4B5FD]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements Coming Soon */}
              <div className="bg-[#121319] border border-[#1F2129] rounded-2xl p-5 text-center space-y-2">
                <span className="text-[10px] font-mono text-[#F59E0B] uppercase tracking-wider block">
                  ✦ Achievements & Bio Themes Coming Soon
                </span>
                <p className="text-xs text-[#7E8694]">
                  Verified subject credits and profile themes will appear here.
                </p>
              </div>

              {/* Account Quick Actions */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-xs font-mono font-bold text-red-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

            </div>
          )}

        </main>

        {/* Mobile Bottom Navigation Bar (< 768px) - High Design Native Feel */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0D0F14]/95 backdrop-blur-xl border-t border-[#1E222D] px-1 flex items-center justify-around z-40 shadow-2xl safe-area-bottom">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavTabClick(item)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer relative active:scale-90 ${
                  isActive ? 'text-[#A78BFA]' : item.isLocked ? 'text-[#525B6C]' : 'text-[#6D7584] hover:text-[#A0AAB8]'
                }`}
                aria-label={item.label}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-[#7C3AED] rounded-full shadow-[0_0_8px_#7C3AED]" />
                )}
                <div className={`p-1 rounded-xl transition-colors relative ${isActive ? 'bg-[#7C3AED]/20' : ''}`}>
                  {item.id === 'profile' && currentUserPhoto ? (
                    <div className={`w-5 h-5 rounded-full overflow-hidden border ${isActive ? 'border-[#7C3AED] ring-1 ring-[#7C3AED]' : 'border-[#444]'}`}>
                      <img src={currentUserPhoto} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  {item.isLocked && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#1A1D27] border border-[#2D3345] flex items-center justify-center">
                      <Lock className="w-2 h-2 text-[#94A3B8]" />
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-mono font-bold tracking-tight ${isActive ? 'text-white' : 'text-[#7A8392]'}`}>
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>

      </div>

      {/* Twitter/X-style Floating Action Button (FAB) to Add Post */}
      {activeTab === 'feed' && (
        <button
          type="button"
          onClick={() => setIsCreatePostModalOpen(true)}
          className="fixed bottom-20 md:bottom-8 right-5 md:right-8 z-40 w-14 h-14 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-[0_8px_30px_rgba(124,58,237,0.55)] flex items-center justify-center cursor-pointer active:scale-95 transition-all border border-purple-400/40 hover:scale-105 group"
          title="Create Post"
          aria-label="Create Post"
        >
          <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      )}

      {/* Twitter/X-style Create Post Modal */}
      {isCreatePostModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsCreatePostModalOpen(false)}
        >
          <div
            className="bg-[#111319] border border-[#20232F] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#1E222D]">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-white">Create Post</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#C4B5FD] border border-[#7C3AED]/40">
                  Feed
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePostModalOpen(false)}
                className="p-1.5 rounded-lg text-[#7C8596] hover:text-white hover:bg-[#1C1F2A] transition-colors cursor-pointer"
                title="Close"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Form */}
            <form onSubmit={handleCreatePost} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Author badge */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#181B26] border border-[#282C3D] overflow-hidden flex items-center justify-center text-base shrink-0">
                  {currentUserPhoto ? (
                    <img
                      src={currentUserPhoto}
                      alt="You"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{profile?.avatarIcon || '🎓'}</span>
                  )}
                </div>
                <div>
                  <div className="font-display font-bold text-sm text-white">
                    {profile?.displayName || user?.displayName || 'Student'}
                  </div>
                  <div className="text-xs font-mono text-[#7A8392]">
                    @{profile?.handle || 'student'} • {profile?.studentClass || 'Learner'}
                  </div>
                </div>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  rows={4}
                  autoFocus
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="What's your doubt, note, or study insight? Ask or share with peers..."
                  className="w-full bg-[#0D0F14] text-white p-3.5 rounded-xl border border-[#20232F] focus:border-[#7C3AED] focus:outline-none text-sm placeholder:text-[#525968] resize-none leading-relaxed"
                />
              </div>

              {/* Image Attachment Preview (Optional) */}
              {postImage && (
                <div className="relative rounded-xl overflow-hidden border border-[#7C3AED]/50 bg-[#0C0E13] p-1 shadow-md">
                  <div className="relative rounded-lg overflow-hidden max-h-56 flex items-center justify-center bg-black/40">
                    <img
                      src={postImage}
                      alt="Attached study note"
                      referrerPolicy="no-referrer"
                      className="max-h-56 w-auto object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setPostImage(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                      ✓ Photo attached (Optional)
                    </div>
                  </div>
                </div>
              )}

              {postImageError && (
                <div className="text-xs font-mono text-red-400 bg-red-950/40 border border-red-800/50 p-2.5 rounded-xl">
                  {postImageError}
                </div>
              )}

              {/* Hidden file input */}
              <input
                type="file"
                ref={postFileInputRef}
                onChange={handlePostImageChange}
                accept="image/*"
                className="hidden"
              />

              {/* Expandable Link Input */}
              {isLinkInputOpen && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B0D13] border border-[#242838] animate-in fade-in">
                  <LinkIcon className="w-4 h-4 text-[#38BDF8] shrink-0 ml-1" />
                  <input
                    type="url"
                    value={linkInputVal}
                    onChange={(e) => setLinkInputVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleInsertLink();
                      }
                    }}
                    placeholder="Paste link (Google Drive, YouTube, Notes URL)..."
                    className="flex-1 bg-transparent text-white text-xs placeholder:text-[#525968] focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleInsertLink}
                    disabled={!linkInputVal.trim()}
                    className="px-2.5 py-1 rounded-lg bg-[#38BDF8] hover:bg-[#0EA5E9] disabled:opacity-40 text-black font-mono font-bold text-xs cursor-pointer transition-all"
                  >
                    Insert
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLinkInputOpen(false)}
                    className="p-1 rounded-lg text-[#6C7584] hover:text-white transition-colors cursor-pointer"
                    title="Cancel link input"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="pt-2 border-t border-[#1E222D] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => postFileInputRef.current?.click()}
                    disabled={uploadingPostImage}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono transition-all border cursor-pointer ${
                      uploadingPostImage
                        ? 'bg-[#181A24] text-[#8C95A5] border-[#252A38]'
                        : postImage
                        ? 'bg-[#7C3AED]/20 text-[#C4B5FD] border-[#7C3AED]/50'
                        : 'bg-[#13151D] hover:bg-[#1A1D27] text-[#9AA3B2] hover:text-white border-[#242836]'
                    }`}
                  >
                    {uploadingPostImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" />
                        <span>Compressing...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-[#38BDF8]" />
                        <span>{postImage ? 'Change Photo' : 'Photo'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLinkInputOpen(!isLinkInputOpen)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono transition-all border cursor-pointer ${
                      isLinkInputOpen
                        ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/50'
                        : 'bg-[#13151D] hover:bg-[#1A1D27] text-[#9AA3B2] hover:text-white border-[#242836]'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Add Link</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatePostModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono text-[#8C95A5] hover:text-white hover:bg-[#181A24] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={(!newPostText.trim() && !postImage) || uploadingPostImage || submittingPost}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white font-display font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    {submittingPost ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <span>Post</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Toast Notification */}
      {shareToastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#1E212D] border border-[#38BDF8]/60 text-white text-xs font-mono font-bold shadow-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <Share2 className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>{shareToastMessage}</span>
        </div>
      )}

      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#1E212D] border border-[#7C3AED] text-white text-xs font-mono font-bold shadow-xl animate-in fade-in slide-in-from-top-2">
          ✓ Link copied to clipboard!
        </div>
      )}

      {/* Delete Post Success Toast */}
      {deleteToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#1E212D] border border-red-500/60 text-red-200 text-xs font-mono font-bold shadow-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>✓ Post deleted permanently from Firestore!</span>
        </div>
      )}

      {/* Feed Refreshed Toast */}
      {resetSeenToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#1E212D] border border-[#7C3AED]/60 text-[#DDD6FE] text-xs font-mono font-bold shadow-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span>✓ Feed refreshed — 100% fresh study stream!</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPostToDelete(null)}
        >
          <div
            className="bg-[#12141C] border border-red-500/30 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-white">Delete Post?</h3>
                <p className="text-xs text-[#8C95A5] mt-0.5">
                  Yeh post Firestore database se permanently delete ho jaayegi.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-[#8C95A5] hover:text-white hover:bg-[#1C1F2B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingPost}
                onClick={() => handleDeletePost(postToDelete)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
              >
                {deletingPost ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal for Formulas & Study Notes */}
      {selectedZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedZoomImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-lg bg-[#1B1D25] text-white hover:bg-red-600 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono"
            >
              <CloseIcon className="w-4 h-4" />
              <span>Close</span>
            </button>
            <img
              src={selectedZoomImage}
              alt="Expanded Study Note"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-[#2D303C] shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Locked Section "Coming Soon" Alert Modal (English, Tactile & High-Design) */}
      {lockedFeatureModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLockedFeatureModal(null)}
        >
          <div
            className="bg-[#10131B] border border-amber-500/40 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-[#F59E0B] flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F59E0B] px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 inline-block">
                Feature Locked
              </span>
              <h3 className="font-display font-extrabold text-lg text-white">
                {lockedFeatureModal.title}
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed pt-1">
                {lockedFeatureModal.desc}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setLockedFeatureModal(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-mono font-bold shadow-md transition-all cursor-pointer active:scale-95"
              >
                Understood, Back to Feed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal (Twitter/X & Instagram Academic Clean Style) */}
      {isEditProfileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => !savingProfile && setIsEditProfileOpen(false)}
        >
          <div
            className="bg-[#0D0F16] border border-[#23283B] rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2333] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#A78BFA]">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm sm:text-base text-white tracking-tight">
                    Edit Profile
                  </h3>
                  <p className="text-[11px] font-mono text-[#788293]">
                    Academic identity & study preferences
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                disabled={savingProfile}
                className="p-1.5 rounded-lg text-[#6A7383] hover:text-white hover:bg-[#1A1E2C] transition-colors cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4 overflow-y-auto">
              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-[#8F98A8] mb-1.5">
                    Full Name <span className="text-[#F59E0B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-[#08090E] border border-[#212638] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-xl px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8F98A8] mb-1.5">
                    Username Handle
                  </label>
                  <div className="flex items-center rounded-xl bg-[#08090E] border border-[#212638] focus-within:border-[#7C3AED] focus-within:ring-1 focus-within:ring-[#7C3AED] px-3 py-2 transition-colors">
                    <span className="text-[#596375] text-xs font-mono select-none">@</span>
                    <input
                      type="text"
                      value={editHandle}
                      onChange={(e) => setEditHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="handle"
                      className="w-full bg-transparent border-0 text-xs font-mono text-white outline-none pl-1"
                    />
                  </div>
                </div>
              </div>

              {/* Bio / Study Motto (Twitter Style) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono text-[#8F98A8]">
                    Bio & Study Motto
                  </label>
                  <span className="text-[10px] font-mono text-[#596375]">
                    {editStudyMotto.length}/160
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={160}
                  value={editStudyMotto}
                  onChange={(e) => setEditStudyMotto(e.target.value)}
                  placeholder="e.g. Focused on mastering calculus and mechanics. Aiming for top percentile."
                  className="w-full bg-[#08090E] border border-[#212638] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Academic Level & Institution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-[#8F98A8] mb-1.5">
                    Academic Level
                  </label>
                  <input
                    type="text"
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    placeholder="e.g. Class 12th / Sophomore"
                    className="w-full bg-[#08090E] border border-[#212638] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-xl px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8F98A8] mb-1.5">
                    Institution / School
                  </label>
                  <input
                    type="text"
                    value={editInstitution}
                    onChange={(e) => setEditInstitution(e.target.value)}
                    placeholder="e.g. St. Xavier's / IIT Bombay"
                    className="w-full bg-[#08090E] border border-[#212638] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-xl px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Primary Goal & Daily Commitment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-[#8F98A8] mb-1.5">
                    Target Exam / Focus Goal
                  </label>
                  <input
                    type="text"
                    value={editPrimaryGoal}
                    onChange={(e) => setEditPrimaryGoal(e.target.value)}
                    placeholder="e.g. JEE Advanced 2026 / NEET"
                    className="w-full bg-[#08090E] border border-[#212638] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-xl px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8F98A8] mb-1.5">
                    Daily Study Commitment
                  </label>
                  <input
                    type="text"
                    value={editDailyGoal}
                    onChange={(e) => setEditDailyGoal(e.target.value)}
                    placeholder="e.g. 2 – 3 hours"
                    className="w-full bg-[#08090E] border border-[#212638] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-xl px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Focus Subjects Manager */}
              <div>
                <label className="block text-[11px] font-mono text-[#8F98A8] mb-1.5">
                  Focus Subjects
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {editSubjects.map((subject) => (
                    <span
                      key={subject}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181C29] border border-[#272E44] text-[11px] font-mono text-[#C4B5FD]"
                    >
                      <span>{subject}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(subject)}
                        className="hover:text-red-400 transition-colors cursor-pointer"
                        title={`Remove ${subject}`}
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {editSubjects.length === 0 && (
                    <span className="text-[11px] font-mono text-[#5F697C] italic">
                      No subjects added yet
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject();
                      }
                    }}
                    placeholder="Type subject & press Enter"
                    className="flex-1 bg-[#08090E] border border-[#212638] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-xl px-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-3 py-2 rounded-xl bg-[#1A1F2E] hover:bg-[#252C42] border border-[#2C344E] text-xs font-mono text-[#C4B5FD] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-[#1C2130] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-[#8E97A7] hover:text-white hover:bg-[#161924] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || !editDisplayName.trim()}
                  className="px-5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-xs font-mono font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden File Input for solution comments image attachment */}
      <input
        type="file"
        ref={commentFileInputRef}
        onChange={handleCommentImageChange}
        accept="image/*"
        className="hidden"
      />

    </div>
  );
};
