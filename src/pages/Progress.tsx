import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/GlassCard";
import { TrendingUp, Calendar, Award, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Progress = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgScore: 0,
    thisWeekSessions: 0,
  });
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user && isSupabaseConfigured) {
      fetchProgress();
    }
  }, [user, loading, navigate]);

  const fetchProgress = async () => {
    if (!user || !isSupabaseConfigured) return;

    try {
      // Fetch all practice sessions
      const { data: sessions, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching progress:', error);
        return;
      }

      if (sessions) {
        const totalSessions = sessions.length;
        const avgScore = sessions.reduce((acc, s) => acc + (s.score || 0), 0) / totalSessions || 0;
        
        // Calculate this week's sessions
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeekSessions = sessions.filter(
          s => new Date(s.completed_at) > oneWeekAgo
        ).length;

        setStats({ totalSessions, avgScore: Math.round(avgScore), thisWeekSessions });

        // Calculate weekly activity (last 7 days)
        const activity = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        sessions.forEach(session => {
          const sessionDate = new Date(session.completed_at);
          sessionDate.setHours(0, 0, 0, 0);
          const daysAgo = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysAgo >= 0 && daysAgo < 7) {
            activity[6 - daysAgo]++;
          }
        });
        
        setWeeklyActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your improvement journey</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {!isSupabaseConfigured && (
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <AlertDescription className="text-yellow-600 dark:text-yellow-400">
              Supabase is not configured. Progress data will not be saved. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.
            </AlertDescription>
          </Alert>
        )}
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard hover={false} className="text-center space-y-2">
            <TrendingUp className="w-8 h-8 mx-auto text-primary" />
            <div className="text-2xl font-bold text-foreground">{stats.avgScore}%</div>
            <p className="text-xs text-muted-foreground">Average Score</p>
          </GlassCard>
          
          <GlassCard hover={false} className="text-center space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-secondary" />
            <div className="text-2xl font-bold text-foreground">{stats.thisWeekSessions}</div>
            <p className="text-xs text-muted-foreground">This Week</p>
          </GlassCard>
          
          <GlassCard hover={false} className="text-center space-y-2">
            <Target className="w-8 h-8 mx-auto text-accent" />
            <div className="text-2xl font-bold text-foreground">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </GlassCard>
          
          <GlassCard hover={false} className="text-center space-y-2">
            <Award className="w-8 h-8 mx-auto text-primary" />
            <div className="text-2xl font-bold text-foreground">{Math.floor(stats.totalSessions / 3)}</div>
            <p className="text-xs text-muted-foreground">Badges Earned</p>
          </GlassCard>
        </div>

        {/* Weekly Activity */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Activity</h3>
          <div className="flex justify-between items-end h-40 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
              const maxSessions = Math.max(...weeklyActivity, 1);
              const height = (weeklyActivity[index] / maxSessions) * 100;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all duration-300 hover:opacity-80"
                    style={{ height: `${height || 10}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Recent Achievements */}
        <GlassCard>
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Achievements</h3>
          <div className="space-y-3">
            {[
              { title: "5 Day Streak", desc: "Keep practicing daily!", icon: "🔥" },
              { title: "First Interview", desc: "Completed mock interview", icon: "🎯" },
              { title: "Speech Master", desc: "10 speech sessions done", icon: "🎤" },
            ].map((achievement) => (
              <div key={achievement.title} className="flex items-center gap-4 p-3 rounded-xl bg-card/40 hover:bg-card/60 transition-all">
                <div className="text-3xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{achievement.title}</h4>
                  <p className="text-xs text-muted-foreground">{achievement.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <BottomNav />
    </div>
  );
};

export default Progress;
