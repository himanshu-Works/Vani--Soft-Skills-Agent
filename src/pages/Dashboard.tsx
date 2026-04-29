import { useState, useEffect } from "react";
import { PracticeCard } from "@/components/PracticeCard";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/GlassCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mic, Briefcase, Presentation, Users, BookOpen, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { loadSession, clearSession } = useSessionPersistence("practice");

  const [stats, setStats] = useState({ totalSessions: 0, streak: 0, avgScore: 0 });

  const practiceModesData = [
    {
      title: "AI Speech Practice",
      description: "Practice speaking on any topic with AI feedback on fluency, grammar, and clarity",
      icon: Mic,
      gradient: "bg-gradient-to-br from-primary to-primary-glow",
      path: "/practice/speech",
    },
    {
      title: "Mock Interview",
      description: "Prepare for job interviews with customized questions, CV upload, and detailed feedback",
      icon: Briefcase,
      gradient: "bg-gradient-to-br from-secondary to-accent",
      path: "/practice/interview",
    },
    {
      title: "Presentation Practice",
      description: "Upload your slides or pick a topic and practice delivering confident presentations",
      icon: Presentation,
      gradient: "bg-gradient-to-br from-accent to-primary",
      path: "/practice/presentation",
    },
    {
      title: "Group Discussion",
      description: "Simulate group discussions with AI participants in a realistic GD environment",
      icon: Users,
      gradient: "bg-gradient-to-br from-primary to-secondary",
      path: "/practice/group",
    },
  ];

  useEffect(() => {
    // Check for incomplete session and offer resume
    const session = loadSession();
    if (session && session.step !== "setup") {
      const path = session.page === "speech" ? "/practice/speech"
        : session.page === "interview" ? "/practice/interview"
        : session.page === "presentation" ? "/practice/presentation"
        : session.page === "group" ? "/practice/group"
        : null;

      if (path) {
        toast({
          title: "Session Found",
          description: `You have an incomplete ${session.page} session. Navigate to ${path} to resume.`,
        });
      }
    }

    // Fetch real stats
    if (user && isSupabaseConfigured) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user || !isSupabaseConfigured) return;
    try {
      const { data: sessions, error } = await supabase
        .from("practice_sessions")
        .select("score, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (error || !sessions) return;

      const totalSessions = sessions.length;
      const avgScore =
        totalSessions > 0
          ? Math.round(sessions.reduce((acc, s) => acc + (s.score || 0), 0) / totalSessions)
          : 0;

      // Calculate streak (consecutive days)
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dates = [...new Set(sessions.map((s) => {
        const d = new Date(s.completed_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }))].sort((a, b) => b - a);

      for (let i = 0; i < dates.length; i++) {
        const diff = (today.getTime() - dates[i]) / (1000 * 60 * 60 * 24);
        if (diff <= i + 1) streak++;
        else break;
      }

      setStats({ totalSessions, streak, avgScore });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Practice Modes</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome back, <span className="text-primary font-medium">{displayName}</span> 👋
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                {initial}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Daily Goal */}
        <GlassCard className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Daily Goal</h3>
              <p className="text-sm text-muted-foreground">Complete 2 practice sessions today</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {Math.min(stats.totalSessions % 2, 2)}/2
              </div>
              <p className="text-xs text-muted-foreground">sessions</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stats.totalSessions % 2) * 50, 100)}%` }}
            />
          </div>
        </GlassCard>

        {/* Practice Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practiceModesData.map((mode, index) => (
            <div
              key={mode.title}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PracticeCard
                title={mode.title}
                description={mode.description}
                icon={mode.icon}
                gradient={mode.gradient}
                onClick={() => navigate(mode.path)}
              />
            </div>
          ))}
        </div>

        {/* New Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard
            className="cursor-pointer hover:scale-[1.02] transition-all bg-gradient-to-br from-secondary/10 to-accent/10"
            onClick={() => navigate("/chatbot")}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg flex-shrink-0">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">English Expert AI</h3>
                <p className="text-sm text-muted-foreground">Ask anything about English grammar, vocab & more</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard
            className="cursor-pointer hover:scale-[1.02] transition-all bg-gradient-to-br from-accent/10 to-primary/10"
            onClick={() => navigate("/blog")}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg flex-shrink-0">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Learn from the Best</h3>
                <p className="text-sm text-muted-foreground">Insights from Churchill, Carnegie, Sinek & more</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <GlassCard hover={false} className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalSessions || "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Sessions</p>
          </GlassCard>
          <GlassCard hover={false} className="text-center">
            <div className="text-2xl font-bold text-secondary">{stats.streak || "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">Day Streak</p>
          </GlassCard>
          <GlassCard hover={false} className="text-center">
            <div className="text-2xl font-bold text-accent">
              {stats.avgScore ? `${stats.avgScore}%` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
          </GlassCard>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
