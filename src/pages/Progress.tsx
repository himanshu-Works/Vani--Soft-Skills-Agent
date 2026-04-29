import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
    } else if (user) {
      fetchProgress();
    }
  }, [user, loading, navigate]);

  const fetchProgress = async () => {
    if (!user) return;
    
    // For now, return default stats since Supabase is removed
    setStats({ totalSessions: 0, avgScore: 0, thisWeekSessions: 0 });
    setWeeklyActivity([0, 0, 0, 0, 0, 0, 0]);
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
