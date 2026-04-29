import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/GlassCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileEditDialog } from "@/components/ProfileEditDialog";
import { Button } from "@/components/ui/button";
import { User, Settings, Bell, HelpCircle, LogOut, Palette } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Profile = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user) {
      // Create profile from Firebase user data
      setProfile({
        display_name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        avatar_url: user.photoURL || null
      });
    }
  }, [user, loading, navigate]);

  if (loading || !user || !profile) {
    return null;
  }

  const initials = profile.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {/* User Info */}
        <GlassCard className="text-center space-y-4">
          <Avatar className="w-24 h-24 mx-auto">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold text-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{profile.display_name || 'VANI User'}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" className="mx-auto" onClick={() => setEditDialogOpen(true)}>
            Edit Profile
          </Button>
        </GlassCard>

        {/* Settings Menu */}
        <GlassCard className="divide-y divide-border/50">
          {[
            { icon: User, label: "Account Settings", desc: "Manage your personal information" },
            { icon: Palette, label: "Theme", desc: "Dark mode toggle", component: <ThemeToggle /> },
            { icon: Bell, label: "Notifications", desc: "Configure your alerts" },
            { icon: Settings, label: "App Preferences", desc: "Customize your experience" },
            { icon: HelpCircle, label: "Help & Support", desc: "Get assistance" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="w-full flex items-center gap-4 p-4 first:rounded-t-2xl last:rounded-b-2xl"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-foreground">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {'component' in item && item.component}
              </div>
            );
          })}
        </GlassCard>

        {/* Logout */}
        <Button variant="destructive" className="w-full" onClick={signOut}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>

      <ProfileEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} />
      <BottomNav />
    </div>
  );
};

export default Profile;
