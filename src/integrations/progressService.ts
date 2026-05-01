/**
 * Firestore Progress Service
 * Handles storing/retrieving user progress data in Firebase Firestore
 */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  arrayUnion,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

export interface SessionRecord {
  type: 'speech' | 'interview' | 'presentation' | 'group' | 'chatbot';
  score: number;
  date: string; // ISO date string
  durationSeconds?: number;
}

export interface UserProgress {
  uid: string;
  displayName: string;
  totalSessions: number;
  totalScore: number;
  avgScore: number;
  thisWeekSessions: number;
  currentStreak: number;
  longestStreak: number;
  weeklyActivity: number[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  recentSessions: SessionRecord[];
  badges: string[];
  lastActive: string;
  updatedAt?: any;
}

const USERS_COLLECTION = 'user_progress';

function getWeekDay(): number {
  // 0=Mon ... 6=Sun (matching our weeklyActivity array)
  const day = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return day === 0 ? 6 : day - 1;
}

function getThisWeekDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export async function getUserProgress(uid: string): Promise<UserProgress | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProgress;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return null;
  }
}

export async function initUserProgress(uid: string, displayName: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      const initialProgress: UserProgress = {
        uid,
        displayName: displayName || 'Vani User',
        totalSessions: 0,
        totalScore: 0,
        avgScore: 0,
        thisWeekSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
        recentSessions: [],
        badges: [],
        lastActive: new Date().toISOString().split('T')[0],
      };
      await setDoc(docRef, initialProgress);
    }
  } catch (error) {
    console.error('Error initializing user progress:', error);
  }
}

export async function recordSession(
  uid: string,
  displayName: string,
  session: SessionRecord
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    await initUserProgress(uid, displayName);
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data() as UserProgress;
    const today = new Date().toISOString().split('T')[0];
    const weekDates = getThisWeekDates();

    // Recalculate weekly activity from recent sessions + new session
    const allSessions = [...(data.recentSessions || []), { ...session, date: today }];
    const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
    allSessions.forEach((s) => {
      const idx = weekDates.indexOf(s.date);
      if (idx !== -1) weeklyActivity[idx]++;
    });

    // Recalculate thisWeekSessions
    const thisWeekSessions = weeklyActivity.reduce((a, b) => a + b, 0);

    // Recalculate streak
    let currentStreak = data.currentStreak || 0;
    const lastActive = data.lastActive;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActive === today) {
      // Already recorded today — streak unchanged
    } else if (lastActive === yesterdayStr) {
      currentStreak += 1;
    } else {
      currentStreak = 1; // Reset
    }

    const longestStreak = Math.max(currentStreak, data.longestStreak || 0);

    // New totals
    const totalSessions = (data.totalSessions || 0) + 1;
    const totalScore = (data.totalScore || 0) + session.score;
    const avgScore = Math.round(totalScore / totalSessions);

    // Keep only last 20 sessions
    const recentSessions = [...allSessions].slice(-20);

    // Compute badges
    const badges = computeBadges(totalSessions, currentStreak, avgScore);

    await updateDoc(docRef, {
      displayName: displayName || data.displayName,
      totalSessions,
      totalScore,
      avgScore,
      thisWeekSessions,
      currentStreak,
      longestStreak,
      weeklyActivity,
      recentSessions,
      badges,
      lastActive: today,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error recording session:', error);
  }
}

function computeBadges(totalSessions: number, streak: number, avgScore: number): string[] {
  const badges: string[] = [];
  if (totalSessions >= 1) badges.push('first_session');
  if (totalSessions >= 10) badges.push('ten_sessions');
  if (totalSessions >= 50) badges.push('fifty_sessions');
  if (streak >= 3) badges.push('three_day_streak');
  if (streak >= 5) badges.push('five_day_streak');
  if (streak >= 10) badges.push('ten_day_streak');
  if (avgScore >= 70) badges.push('good_score');
  if (avgScore >= 85) badges.push('great_score');
  if (avgScore >= 95) badges.push('perfect_score');
  return badges;
}

export async function getLeaderboard(limitCount: number = 10): Promise<UserProgress[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      orderBy('totalSessions', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserProgress);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}
