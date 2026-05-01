import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/GlassCard";
import {
  TrendingUp,
  Calendar,
  Award,
  Target,
  Flame,
  Trophy,
  Zap,
  Star,
  Medal,
  RefreshCw,
} from "lucide-react";
import { getUserProgress, getLeaderboard, initUserProgress, UserProgress } from "@/integrations/progressService";

const BADGE_META: Record<string, { label: string; icon: string; desc: string }> = {
  first_session:    { label: "First Step",      icon: "🚀", desc: "Completed your first session!" },
  ten_sessions:     { label: "Consistent",      icon: "📚", desc: "10 sessions completed" },
  fifty_sessions:   { label: "Dedicated",       icon: "🏆", desc: "50 sessions completed" },
  three_day_streak: { label: "3-Day Streak",    icon: "🔥", desc: "3 days in a row!" },
  five_day_streak:  { label: "5-Day Streak",    icon: "⚡", desc: "5 days in a row!" },
  ten_day_streak:   { label: "10-Day Streak",   icon: "💪", desc: "10 days in a row!" },
  good_score:       { label: "Good Score",      icon: "🎯", desc: "Average score ≥ 70%" },
  great_score:      { label: "High Achiever",   icon: "⭐", desc: "Average score ≥ 85%" },
  perfect_score:    { label: "Perfectionist",   icon: "💎", desc: "Average score ≥ 95%" },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Progress = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserProgress[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "leaderboard">("stats");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      loadData();
    }
  }, [user, loading, navigate]);

  const loadData = async () => {
    if (!user) return;
    setFetching(true);
    try {
      await initUserProgress(user.uid, user.displayName || user.email?.split("@")[0] || "User");
      const [prog, lb] = await Promise.all([
        getUserProgress(user.uid),
        getLeaderboard(10),
      ]);
      setProgress(prog);
      setLeaderboard(lb);
    } catch (e) {
      console.error("Failed to load progress:", e);
    } finally {
      setFetching(false);
    }
  };

  if (loading || !user) return null;

  const stats = {
    totalSessions: progress?.totalSessions ?? 0,
    avgScore: progress?.avgScore ?? 0,
    thisWeekSessions: progress?.thisWeekSessions ?? 0,
    currentStreak: progress?.currentStreak ?? 0,
  };

  const weeklyActivity = progress?.weeklyActivity ?? [0, 0, 0, 0, 0, 0, 0];
  const maxActivity = Math.max(...weeklyActivity, 1);
  const earnedBadges = (progress?.badges ?? [])
    .filter((b) => BADGE_META[b])
    .map((b) => ({ id: b, ...BADGE_META[b] }));

  const userRank = leaderboard.findIndex((u) => u.uid === user.uid) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track your improvement journey</p>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${fetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-2 p-1 rounded-xl bg-card/50 border border-border w-fit">
          {(["stats", "leaderboard"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "leaderboard" ? "🏆 Leaderboard" : "📊 My Stats"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {activeTab === "stats" ? (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, label: "Avg Score",      value: `${stats.avgScore}%`,           color: "text-primary" },
                { icon: Calendar,   label: "This Week",      value: stats.thisWeekSessions,          color: "text-secondary" },
                { icon: Target,     label: "Total Sessions", value: stats.totalSessions,             color: "text-accent" },
                { icon: Flame,      label: "Day Streak",     value: stats.currentStreak,             color: "text-orange-400" },
              ].map(({ icon: Icon, label, value, color }) => (
                <GlassCard key={label} hover={false} className="text-center space-y-2 py-5">
                  <Icon className={`w-8 h-8 mx-auto ${color}`} />
                  <div className="text-2xl font-bold text-foreground">{value}</div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </GlassCard>
              ))}
            </div>

            {/* Weekly Activity Chart */}
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-1">Weekly Activity</h3>
              <p className="text-xs text-muted-foreground mb-4">Sessions completed each day this week</p>
              <div className="flex justify-between items-end h-40 gap-2">
                {DAYS.map((day, idx) => {
                  const count = weeklyActivity[idx];
                  const heightPct = (count / maxActivity) * 100;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      {count > 0 && (
                        <span className="text-xs font-medium text-primary">{count}</span>
                      )}
                      <div
                        className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${heightPct || 8}%`,
                          background:
                            count > 0
                              ? "linear-gradient(to top, hsl(var(--primary)), hsl(var(--secondary)))"
                              : "hsl(var(--muted))",
                          opacity: count > 0 ? 1 : 0.4,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{day}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Badges */}
            <GlassCard>
              <h3 className="text-lg font-semibold text-foreground mb-1">Achievements</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {earnedBadges.length} of {Object.keys(BADGE_META).length} badges earned
              </p>
              {earnedBadges.length === 0 && !fetching ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🌱</div>
                  <p className="text-muted-foreground text-sm">
                    Complete practice sessions to earn badges!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {earnedBadges.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
                    >
                      <div className="text-2xl">{b.icon}</div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{b.label}</p>
                        <p className="text-xs text-muted-foreground">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                  {/* Locked badges */}
                  {Object.entries(BADGE_META)
                    .filter(([id]) => !earnedBadges.find((b) => b.id === id))
                    .map(([id, meta]) => (
                      <div
                        key={id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-border opacity-50"
                      >
                        <div className="text-2xl grayscale">{meta.icon}</div>
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground">{meta.label}</p>
                          <p className="text-xs text-muted-foreground/60">{meta.desc}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </GlassCard>

            {/* Recent Sessions */}
            {(progress?.recentSessions?.length ?? 0) > 0 && (
              <GlassCard>
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Sessions</h3>
                <div className="space-y-2">
                  {[...(progress?.recentSessions ?? [])].reverse().slice(0, 6).map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-card/40 hover:bg-card/60 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-sm">
                          {s.type === "speech" ? "🎤" : s.type === "interview" ? "💼" : s.type === "presentation" ? "📊" : s.type === "group" ? "👥" : "💬"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">{s.type} Practice</p>
                          <p className="text-xs text-muted-foreground">{s.date}</p>
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${s.score >= 80 ? "text-green-400" : s.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                        {s.score}%
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </>
        ) : (
          /* Leaderboard Tab */
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Global Leaderboard</h3>
                <p className="text-xs text-muted-foreground">Top learners ranked by total sessions</p>
              </div>
            </div>

            {userRank > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-center">
                <p className="text-sm font-medium text-foreground">
                  Your Rank: <span className="text-primary font-bold">#{userRank}</span> of {leaderboard.length}
                </p>
              </div>
            )}

            {leaderboard.length === 0 && !fetching ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">👤</div>
                <p className="text-muted-foreground text-sm">
                  Be the first! Complete a session to appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => {
                  const isMe = entry.uid === user.uid;
                  const rank = idx + 1;
                  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                  return (
                    <div
                      key={entry.uid}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                        isMe
                          ? "bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/40"
                          : "bg-card/40 hover:bg-card/60"
                      }`}
                    >
                      <div className="w-8 text-center font-bold text-lg">
                        {medal ?? <span className="text-muted-foreground text-sm">#{rank}</span>}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-sm font-bold text-white">
                        {(entry.displayName || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                          {isMe ? `${entry.displayName} (You)` : entry.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.totalSessions} sessions · avg {entry.avgScore}%</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">{entry.currentStreak}🔥</div>
                        <div className="text-xs text-muted-foreground">streak</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Progress;
