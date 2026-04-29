import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { Sparkles, Target, TrendingUp, Award } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import logo from "@/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Coaching",
      description: "Get instant feedback on your communication with advanced AI analysis",
    },
    {
      icon: Target,
      title: "Personalized Practice",
      description: "Choose topics and scenarios that match your career goals",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your improvement with detailed analytics and insights",
    },
    {
      icon: Award,
      title: "Build Confidence",
      description: "Practice in a safe environment and ace real conversations",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-transparent">
              <img src={logo} alt="VANI logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-foreground">VANI</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 animate-glow" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 animate-fade-up">
              <div className="inline-block">
                <span className="px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-sm font-medium text-primary border border-white/40">
                  ✨ Your AI Communication Coach
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Master English
                <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Speak with Confidence
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Transform your communication skills with AI-powered practice sessions. 
                Perfect for interviews, presentations, and everyday conversations.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="hero" 
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="group"
                  id="start-practicing-btn"
                >
                  Start Practicing
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </Button>
                <Button 
                  variant="glass" 
                  size="lg"
                  onClick={() => navigate("/blog")}
                  id="explore-features-btn"
                >
                  Explore & Learn
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-3xl blur-3xl animate-float" />
              <img 
                src={heroImage} 
                alt="Confident professional speaking" 
                className="relative rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-4 animate-fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Why Choose VANI?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built specifically for Indian professionals and students to excel in English communication
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <GlassCard 
                key={feature.title}
                className="text-center space-y-4 animate-fade-up"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <GlassCard className="text-center space-y-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ready to Transform Your Communication?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of professionals improving their English speaking skills every day
          </p>
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-12"
          >
            Get Started Now
          </Button>
        </GlassCard>
      </section>

      <BottomNav />
    </div>
  );
};

export default Index;
