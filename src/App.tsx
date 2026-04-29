import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import SpeechPractice from "./pages/SpeechPractice";
import MockInterview from "./pages/MockInterview";
import PresentationPractice from "./pages/PresentationPractice";
import GroupDiscussion from "./pages/GroupDiscussion";
import Chatbot from "./pages/Chatbot";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vani-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/blog" element={<Blog />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute>
                    <Progress />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chatbot"
                element={
                  <ProtectedRoute>
                    <Chatbot />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice/speech"
                element={
                  <ProtectedRoute>
                    <SpeechPractice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice/interview"
                element={
                  <ProtectedRoute>
                    <MockInterview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice/presentation"
                element={
                  <ProtectedRoute>
                    <PresentationPractice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice/group"
                element={
                  <ProtectedRoute>
                    <GroupDiscussion />
                  </ProtectedRoute>
                }
              />
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
