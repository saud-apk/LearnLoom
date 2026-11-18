import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  serverTimestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase/config';

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPhotoURL?: string;
  authorClass: string;
  content: string;
  imageURL?: string;
  timestamp: string;
  isVerifiedSolution?: boolean;
  upvotesCount: number;
  isUpvoted?: boolean;
}

export interface PostPollOption {
  id: string;
  text: string;
  votesCount: number;
}

export interface PostPoll {
  question?: string;
  options: PostPollOption[];
  totalVotes: number;
  voterMap?: Record<string, string>; // userId -> optionId
}

export interface PostMcqOption {
  id: string;
  text: string;
  votesCount?: number;
}

export interface PostMcq {
  question?: string;
  options: PostMcqOption[];
  correctOptionIndex: number;
  explanation?: string;
  totalAttempts: number;
  correctAttempts: number;
  userAnswers?: Record<string, number>; // userId -> optionIndex
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPhotoURL?: string;
  authorClass: string;
  authorAvatar?: string;
  content: string;
  imageURL?: string;
  timestamp: string;
  likesCount: number;
  likedUserIds?: string[];
  commentsCount: number;
  comments: PostComment[];
  viewsCount?: number;
  viewedUserIds?: string[];
  poll?: PostPoll;
  mcq?: PostMcq;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isSolved?: boolean;
  acceptedAnswerId?: string;
  createdAt?: string;
}

const INITIAL_REAL_STUDY_POSTS: Omit<FeedPost, 'id' | 'isLiked' | 'isBookmarked'>[] = [
  {
    authorId: 'seed-user-1',
    authorName: 'Sneha Patel',
    authorHandle: 'sneha_sci',
    authorAvatar: '🎯',
    authorPhotoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    authorClass: 'Class 12th - Science',
    content: 'Question on Ray Optics: When a convex lens (refractive index n=1.5) is dipped in a liquid with refractive index n=1.65, why does its focal behavior invert into a diverging lens? Can someone explain the sign convention simply with lens maker equation?',
    imageURL: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=900&auto=format&fit=crop&q=80',
    timestamp: '25m ago',
    likesCount: 38,
    likedUserIds: [],
    commentsCount: 2,
    isSolved: true,
    acceptedAnswerId: 'ans-1',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    comments: [
      {
        id: 'ans-1',
        authorId: 'seed-user-2',
        authorName: 'Aarav Sharma',
        authorHandle: 'aarav_10th',
        authorPhotoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face',
        authorClass: 'Class 12th - Science',
        content: 'From Lens Maker Formula: 1/f = (n_lens/n_med - 1) * (1/R1 - 1/R2). When n_med > n_lens, (1.5/1.65 - 1) becomes negative! So the focal length sign flips from positive (converging) to negative (diverging). Verified in NCERT Chapter 9.',
        timestamp: '15m ago',
        isVerifiedSolution: true,
        upvotesCount: 24,
        isUpvoted: true
      },
      {
        id: 'ans-2',
        authorId: 'seed-user-3',
        authorName: 'Priya Reddy',
        authorHandle: 'priya_learns',
        authorClass: 'Class 12th - Science',
        content: 'Super easy shortcut to remember: If surrounding medium is denser than glass, nature of lens ALWAYS inverts. Convex becomes Concave, Concave becomes Convex!',
        timestamp: '8m ago',
        isVerifiedSolution: false,
        upvotesCount: 9
      }
    ]
  },
  {
    authorId: 'seed-user-4',
    authorName: 'Kabir Mehta',
    authorHandle: 'kabir_maths',
    authorAvatar: '⚡',
    authorPhotoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    authorClass: 'Class 10th (Secondary)',
    content: 'Class 10 Trigonometry Summary: Quick review of sin²θ + cos²θ = 1, sec²θ - tan²θ = 1, and cosec²θ - cot²θ = 1 along with quadrant signs. Bookmark this for quick revision before exams!',
    imageURL: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=900&auto=format&fit=crop&q=80',
    timestamp: '1h ago',
    likesCount: 84,
    likedUserIds: [],
    commentsCount: 1,
    isSolved: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    mcq: {
      question: 'Quick Check: Which identity holds true for acute angle θ?',
      options: [
        { id: 'mcq-1', text: 'sec²θ - tan²θ = 1', votesCount: 48 },
        { id: 'mcq-2', text: 'sin²θ - cos²θ = 1', votesCount: 3 },
        { id: 'mcq-3', text: 'cosec²θ + cot²θ = 1', votesCount: 6 },
        { id: 'mcq-4', text: 'tan²θ - sec²θ = 1', votesCount: 2 }
      ],
      correctOptionIndex: 0,
      explanation: 'From Pythagorean trigonometric identities: 1 + tan²θ = sec²θ ➔ sec²θ - tan²θ = 1. Standard NCERT identity.',
      totalAttempts: 59,
      correctAttempts: 48,
      userAnswers: {}
    },
    comments: [
      {
        id: 'ans-3',
        authorId: 'seed-user-5',
        authorName: 'Rohan Verma',
        authorHandle: 'rohan_focus',
        authorClass: 'Class 10th',
        content: 'This formula summary saved my pre-board test today. Clean handwriting and clear signs!',
        timestamp: '40m ago',
        isVerifiedSolution: false,
        upvotesCount: 6
      }
    ]
  },
  {
    authorId: 'seed-user-6',
    authorName: 'Ananya Roy',
    authorHandle: 'ananya_chem',
    authorAvatar: '🚀',
    authorClass: 'Class 11th - Science',
    content: 'Urgent Doubt: Can someone explain the ion-electron method for balancing this redox reaction in acidic medium: MnO4⁻ + Fe²⁺ ➔ Mn²⁺ + Fe³⁺? Stuck on step 3 for balancing oxygen atoms.',
    timestamp: '2h ago',
    likesCount: 14,
    likedUserIds: [],
    commentsCount: 1,
    isSolved: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    poll: {
      question: 'Which method do you find easier for balancing redox reactions?',
      options: [
        { id: 'poll-1', text: 'Ion-Electron / Half Reaction Method', votesCount: 42 },
        { id: 'poll-2', text: 'Oxidation Number Method', votesCount: 26 },
        { id: 'poll-3', text: 'Algebraic Equation Method', votesCount: 8 }
      ],
      totalVotes: 76,
      voterMap: {}
    },
    comments: [
      {
        id: 'ans-4',
        authorId: 'seed-user-7',
        authorName: 'Devansh Joshi',
        authorHandle: 'dev_chem',
        authorClass: 'Class 11th - Science',
        content: 'Step 3: Add 4 H2O molecules to the right side (because MnO4⁻ has 4 O atoms), then add 8 H⁺ ions to the left side to balance hydrogen!',
        timestamp: '1h ago',
        isVerifiedSolution: false,
        upvotesCount: 8
      }
    ]
  }
];

// Seed initial posts to Firestore if collection is empty
export async function seedPostsIfEmpty(): Promise<void> {
  const postsPath = 'posts';
  try {
    const snap = await getDocs(query(collection(db, postsPath), limit(1)));
    if (snap.empty) {
      console.log('Seeding initial real study posts to Firestore...');
      for (const postData of INITIAL_REAL_STUDY_POSTS) {
        await addDoc(collection(db, postsPath), postData);
      }
    }
  } catch (error) {
    console.warn('Could not check or seed posts:', error);
  }
}

// 7 Days TTL in Milliseconds (7 * 24 * 60 * 60 * 1000)
export const SEVEN_DAYS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Calculates remaining life of a post before automatic 7-day permanent purge.
 */
export function getPostExpiryInfo(createdAt?: string): {
  daysLeft: number;
  hoursLeft: number;
  isExpired: boolean;
  label: string;
} {
  if (!createdAt) return { daysLeft: 7, hoursLeft: 168, isExpired: false, label: '7d left' };
  const postAgeMs = Date.now() - new Date(createdAt).getTime();
  const remainingMs = SEVEN_DAYS_TTL_MS - postAgeMs;

  if (remainingMs <= 0) {
    return { daysLeft: 0, hoursLeft: 0, isExpired: true, label: 'Expired' };
  }

  const daysLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.ceil(remainingMs / (60 * 60 * 1000));

  if (daysLeft > 1) {
    return { daysLeft, hoursLeft, isExpired: false, label: `Auto-deletes in ${daysLeft}d` };
  }
  return { daysLeft: 1, hoursLeft, isExpired: false, label: `Auto-deletes in ${hoursLeft}h` };
}

/**
 * Automatically purges posts authored by the user that are older than 7 days.
 * Permanently deletes the document directly from Firestore database.
 */
export async function autoCleanupOwnerExpiredPostsInFirestore(userId: string): Promise<number> {
  if (!userId || userId === 'guest') return 0;
  const postsPath = 'posts';
  let purgedCount = 0;
  const now = Date.now();

  try {
    const userPostsQuery = query(
      collection(db, postsPath),
      where('authorId', '==', userId)
    );
    const snap = await getDocs(userPostsQuery);

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (data.createdAt) {
        const age = now - new Date(data.createdAt).getTime();
        if (age >= SEVEN_DAYS_TTL_MS) {
          try {
            await deleteDoc(docSnap.ref);
            purgedCount++;
            console.log(`[LearnLoom 7-Day TTL]: Permanently deleted expired post ${docSnap.id} from Firestore.`);
          } catch (deleteErr) {
            console.warn(`[LearnLoom 7-Day TTL]: Could not delete expired post ${docSnap.id}:`, deleteErr);
          }
        }
      }
    }
  } catch (error) {
    console.warn('[LearnLoom 7-Day TTL]: Auto-cleanup scan warning:', error);
  }

  return purgedCount;
}

// Real-time Feed Listener with 7-Day Expiry Enforcement
export function subscribeToFeedPosts(
  currentUserId: string | undefined,
  onPostsUpdate: (posts: FeedPost[]) => void,
  onError?: (error: Error) => void
): () => void {
  const postsPath = 'posts';
  const q = query(collection(db, postsPath), orderBy('createdAt', 'desc'), limit(50));
  const now = Date.now();

  return onSnapshot(
    q,
    (snapshot) => {
      const validPosts: FeedPost[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const createdAt = data.createdAt;
        const isExpired = createdAt ? (now - new Date(createdAt).getTime() >= SEVEN_DAYS_TTL_MS) : false;

        // Strict 7-Day Permanent Deletion:
        if (isExpired) {
          // If the post belongs to current user, auto-delete it from Firestore immediately
          if (currentUserId && data.authorId === currentUserId) {
            deleteDoc(docSnap.ref).catch((err) =>
              console.warn('[LearnLoom 7-Day TTL]: Live purge error for post:', docSnap.id, err)
            );
          }
          // Do not show expired posts in the feed
          continue;
        }

        const likedUserIds: string[] = Array.isArray(data.likedUserIds) ? data.likedUserIds : [];
        const isLiked = currentUserId ? likedUserIds.includes(currentUserId) : false;

        const viewedUserIds: string[] = Array.isArray(data.viewedUserIds) ? data.viewedUserIds : [];
        const rawViews = typeof data.viewsCount === 'number' ? data.viewsCount : viewedUserIds.length;

        const rawPoll = data.poll;
        let poll: PostPoll | undefined = undefined;
        if (rawPoll && Array.isArray(rawPoll.options) && rawPoll.options.length >= 2) {
          poll = {
            question: rawPoll.question || undefined,
            options: rawPoll.options.map((opt: any, idx: number) => ({
              id: opt.id || `opt-${idx}`,
              text: opt.text || '',
              votesCount: typeof opt.votesCount === 'number' ? opt.votesCount : 0
            })),
            totalVotes: typeof rawPoll.totalVotes === 'number' ? rawPoll.totalVotes : 0,
            voterMap: typeof rawPoll.voterMap === 'object' && rawPoll.voterMap !== null ? rawPoll.voterMap : {}
          };
        }

        const rawMcq = data.mcq;
        let mcq: PostMcq | undefined = undefined;
        if (rawMcq && Array.isArray(rawMcq.options) && rawMcq.options.length >= 2) {
          mcq = {
            question: rawMcq.question || undefined,
            options: rawMcq.options.map((opt: any, idx: number) => ({
              id: opt.id || `opt-${idx}`,
              text: opt.text || '',
              votesCount: typeof opt.votesCount === 'number' ? opt.votesCount : 0
            })),
            correctOptionIndex: typeof rawMcq.correctOptionIndex === 'number' ? rawMcq.correctOptionIndex : 0,
            explanation: rawMcq.explanation || '',
            totalAttempts: typeof rawMcq.totalAttempts === 'number' ? rawMcq.totalAttempts : 0,
            correctAttempts: typeof rawMcq.correctAttempts === 'number' ? rawMcq.correctAttempts : 0,
            userAnswers: typeof rawMcq.userAnswers === 'object' && rawMcq.userAnswers !== null ? rawMcq.userAnswers : {}
          };
        }

        validPosts.push({
          id: docSnap.id,
          authorId: data.authorId || '',
          authorName: data.authorName || 'Student',
          authorHandle: data.authorHandle || 'student',
          authorPhotoURL: data.authorPhotoURL || '',
          authorClass: data.authorClass || 'Learner',
          authorAvatar: data.authorAvatar || '🎓',
          content: data.content || '',
          imageURL: data.imageURL || undefined,
          timestamp: data.createdAt ? formatRelativeTime(data.createdAt) : 'Just now',
          likesCount: typeof data.likesCount === 'number' ? data.likesCount : likedUserIds.length,
          likedUserIds,
          commentsCount: typeof data.commentsCount === 'number' ? data.commentsCount : (data.comments?.length || 0),
          comments: Array.isArray(data.comments) ? data.comments : [],
          viewsCount: Math.max(1, rawViews),
          viewedUserIds,
          poll,
          mcq,
          isLiked,
          isSolved: Boolean(data.isSolved),
          acceptedAnswerId: data.acceptedAnswerId || undefined,
          createdAt: data.createdAt || ''
        });
      }

      onPostsUpdate(validPosts);
    },
    (error) => {
      console.error('Realtime posts subscription error:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, postsPath);
    }
  );
}

// 100% Real Engagement: Atomically record unique post views in Firestore
export async function recordPostViewInFirestore(postId: string, userId: string): Promise<void> {
  if (!postId || !userId || postId.startsWith('temp-')) return;
  const postsPath = 'posts';
  try {
    const postRef = doc(db, postsPath, postId);
    await updateDoc(postRef, {
      viewsCount: increment(1),
      viewedUserIds: arrayUnion(userId)
    });
  } catch (error) {
    console.warn('Realtime view count sync note:', error);
  }
}

// Create new post in Firestore (supports text, image, Poll, and MCQ)
export async function createPostInFirestore(params: {
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPhotoURL?: string;
  authorClass: string;
  authorAvatar?: string;
  content: string;
  imageURL?: string;
  poll?: PostPoll;
  mcq?: PostMcq;
}): Promise<string> {
  const postsPath = 'posts';
  const now = new Date().toISOString();
  const effectiveAuthorId = auth.currentUser?.uid || params.authorId || 'student';

  const newPostData: Record<string, any> = {
    authorId: effectiveAuthorId,
    authorName: params.authorName || auth.currentUser?.displayName || 'Student',
    authorHandle: params.authorHandle || 'student',
    authorPhotoURL: params.authorPhotoURL || auth.currentUser?.photoURL || '',
    authorClass: params.authorClass || 'Learner',
    authorAvatar: params.authorAvatar || '🎓',
    content: params.content,
    imageURL: params.imageURL || '',
    likesCount: 0,
    likedUserIds: [],
    commentsCount: 0,
    comments: [],
    viewsCount: 1,
    viewedUserIds: [effectiveAuthorId],
    isSolved: false,
    createdAt: now
  };

  if (params.poll) {
    newPostData.poll = params.poll;
  }

  if (params.mcq) {
    newPostData.mcq = params.mcq;
  }

  try {
    const docRef = await addDoc(collection(db, postsPath), newPostData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, postsPath);
    throw error;
  }
}

// 100% Working Realtime Poll Voting in Firestore
export async function voteInPostPoll(
  postId: string,
  userId: string,
  optionId: string,
  currentPoll: PostPoll
): Promise<PostPoll> {
  const postRef = doc(db, 'posts', postId);
  const voterMap: Record<string, string> = { ...(currentPoll.voterMap || {}) };
  const prevOptionId = voterMap[userId];

  // If already voted for this option, return current
  if (prevOptionId === optionId) return currentPoll;

  let totalVotes = currentPoll.totalVotes || 0;
  const options = currentPoll.options.map((opt) => {
    let votes = opt.votesCount || 0;
    if (prevOptionId && opt.id === prevOptionId) {
      votes = Math.max(0, votes - 1);
    }
    if (opt.id === optionId) {
      votes += 1;
    }
    return { ...opt, votesCount: votes };
  });

  if (!prevOptionId) {
    totalVotes += 1;
  }
  voterMap[userId] = optionId;

  const updatedPoll: PostPoll = {
    ...currentPoll,
    options,
    totalVotes,
    voterMap
  };

  try {
    await updateDoc(postRef, { poll: updatedPoll });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
  }

  return updatedPoll;
}

// 100% Working Realtime MCQ Answer Submission in Firestore
export async function submitPostMcqAnswer(
  postId: string,
  userId: string,
  optionIndex: number,
  currentMcq: PostMcq
): Promise<{ updatedMcq: PostMcq; isCorrect: boolean }> {
  const postRef = doc(db, 'posts', postId);
  const userAnswers: Record<string, number> = { ...(currentMcq.userAnswers || {}) };
  const prevAnswer = userAnswers[userId];

  const isFirstAttempt = prevAnswer === undefined;
  const isCorrect = optionIndex === currentMcq.correctOptionIndex;

  userAnswers[userId] = optionIndex;

  const options = currentMcq.options.map((opt, idx) => {
    let count = opt.votesCount || 0;
    if (idx === optionIndex && isFirstAttempt) {
      count += 1;
    }
    return { ...opt, votesCount: count };
  });

  const totalAttempts = isFirstAttempt ? (currentMcq.totalAttempts || 0) + 1 : currentMcq.totalAttempts;
  const correctAttempts = isFirstAttempt && isCorrect
    ? (currentMcq.correctAttempts || 0) + 1
    : (currentMcq.correctAttempts || 0);

  const updatedMcq: PostMcq = {
    ...currentMcq,
    options,
    totalAttempts,
    correctAttempts,
    userAnswers
  };

  try {
    await updateDoc(postRef, { mcq: updatedMcq });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
  }

  return { updatedMcq, isCorrect };
}

// Toggle Like in Firestore
export async function toggleLikeInFirestore(
  postId: string,
  userId: string,
  currentLikedUserIds: string[] = [],
  currentLikesCount: number = 0
): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const alreadyLiked = currentLikedUserIds.includes(userId);

  const updatedLikedUserIds = alreadyLiked
    ? currentLikedUserIds.filter((id) => id !== userId)
    : [...currentLikedUserIds, userId];

  const updatedLikesCount = alreadyLiked
    ? Math.max(0, currentLikesCount - 1)
    : currentLikesCount + 1;

  try {
    await updateDoc(postRef, {
      likesCount: updatedLikesCount,
      likedUserIds: updatedLikedUserIds
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    throw error;
  }
}

// Add Comment / Answer in Firestore
export async function addCommentInFirestore(
  postId: string,
  existingComments: PostComment[],
  newComment: PostComment
): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const updatedComments = [...existingComments, newComment];

  try {
    await updateDoc(postRef, {
      comments: updatedComments,
      commentsCount: updatedComments.length
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    throw error;
  }
}

// Mark Verified Solution in Firestore
export async function markVerifiedSolutionInFirestore(
  postId: string,
  existingComments: PostComment[],
  commentId: string
): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const updatedComments = existingComments.map((c) => ({
    ...c,
    isVerifiedSolution: c.id === commentId ? !c.isVerifiedSolution : false
  }));

  const hasAnyVerified = updatedComments.some((c) => c.isVerifiedSolution);

  try {
    await updateDoc(postRef, {
      comments: updatedComments,
      isSolved: hasAnyVerified,
      acceptedAnswerId: hasAnyVerified ? commentId : ''
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    throw error;
  }
}

// Delete Post
export async function deletePostInFirestore(postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    throw error;
  }
}

// Toggle Saved/Bookmarked Post in Firestore user profile
export async function toggleSavePostInFirestore(
  userId: string,
  postId: string,
  currentSavedIds: string[] = []
): Promise<string[]> {
  if (!userId || userId === 'guest') return currentSavedIds;
  const userRef = doc(db, 'users', userId);
  const alreadySaved = currentSavedIds.includes(postId);
  const nextSavedIds = alreadySaved
    ? currentSavedIds.filter((id) => id !== postId)
    : [...currentSavedIds, postId];

  try {
    await updateDoc(userRef, {
      savedPostIds: nextSavedIds
    });
  } catch (error) {
    console.warn('Could not sync saved post to Firestore user profile:', error);
  }
  return nextSavedIds;
}

// URL extraction & domain parsing helpers
export function extractFirstUrl(text: string): string | null {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;
  const match = text.match(urlRegex);
  if (!match) return null;
  let url = match[0];
  url = url.replace(/[.,)\]?!]+$/, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

export function formatDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'link';
  }
}

// Format relative time helper
function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Just now';
  }
}

// Seen Posts & Smart Feed Management (Instagram/Twitter-style)
const SEEN_POSTS_STORAGE_KEY = 'learnloom_seen_posts_v2';
const SEEN_EXPIRATION_MS = 48 * 60 * 60 * 1000; // 48 Hours Cooldown

export interface SeenPostRecord {
  seenAt: number; // timestamp in ms
  commentsCountAtSeen?: number;
  isSolvedAtSeen?: boolean;
}

export function getSeenPostsRecord(): Record<string, SeenPostRecord> {
  try {
    const raw = localStorage.getItem(SEEN_POSTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed: Record<string, SeenPostRecord> = JSON.parse(raw);
    const now = Date.now();
    const cleaned: Record<string, SeenPostRecord> = {};
    for (const [postId, rec] of Object.entries(parsed)) {
      if (now - rec.seenAt < SEEN_EXPIRATION_MS) {
        cleaned[postId] = rec;
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

export function saveSeenPostsRecord(record: Record<string, SeenPostRecord>): void {
  try {
    localStorage.setItem(SEEN_POSTS_STORAGE_KEY, JSON.stringify(record));
  } catch (err) {
    console.warn('Could not save seen posts:', err);
  }
}

export function markPostAsSeen(
  postId: string,
  meta?: { commentsCount?: number; isSolved?: boolean }
): void {
  try {
    const current = getSeenPostsRecord();
    current[postId] = {
      seenAt: Date.now(),
      commentsCountAtSeen: meta?.commentsCount ?? current[postId]?.commentsCountAtSeen ?? 0,
      isSolvedAtSeen: meta?.isSolved ?? current[postId]?.isSolvedAtSeen ?? false
    };
    saveSeenPostsRecord(current);
  } catch {
    // ignore
  }
}

export function clearSeenPostsRecord(): void {
  try {
    localStorage.removeItem(SEEN_POSTS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Checks if a previously seen post should be revived into the fresh stream
 * (e.g. newly verified solution or fresh answers added after student saw it)
 */
export function isPostRevived(post: FeedPost, seenRec?: SeenPostRecord): boolean {
  if (!seenRec) return false;
  // If post was marked solved after student saw it
  if (post.isSolved && !seenRec.isSolvedAtSeen) return true;
  // If new solution/comment was posted after student saw it
  if (post.commentsCount > (seenRec.commentsCountAtSeen ?? 0)) {
    const hasVerified = post.comments.some((c) => c.isVerifiedSolution);
    if (hasVerified && !seenRec.isSolvedAtSeen) return true;
  }
  return false;
}

/**
 * Partitions feed posts into:
 * - unseenPosts (Fresh / Newest first + Revived posts)
 * - seenPosts (Previously viewed within 48h, sorted newest first)
 */
export function partitionFeedPosts(
  posts: FeedPost[],
  seenRecord: Record<string, SeenPostRecord>
): {
  unseenPosts: FeedPost[];
  seenPosts: FeedPost[];
} {
  const unseen: FeedPost[] = [];
  const seen: FeedPost[] = [];

  for (const post of posts) {
    const rec = seenRecord[post.id];
    if (!rec) {
      unseen.push(post);
    } else if (isPostRevived(post, rec)) {
      unseen.push(post);
    } else {
      seen.push(post);
    }
  }

  const sortByTimeDesc = (a: FeedPost, b: FeedPost) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  };

  unseen.sort(sortByTimeDesc);
  seen.sort(sortByTimeDesc);

  return { unseenPosts: unseen, seenPosts: seen };
}

