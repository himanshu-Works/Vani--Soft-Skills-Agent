import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isFirebaseConfigured } from "@/integrations/firebase";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If Firebase is not configured, redirect to /auth so user can see setup guide
    if (!isFirebaseConfigured) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary animate-pulse flex items-center justify-center shadow-xl">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading VANI...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — null while redirect happens
  if (!isFirebaseConfigured || !user) return null;

  return <>{children}</>;
};
