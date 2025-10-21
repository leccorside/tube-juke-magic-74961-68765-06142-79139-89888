import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstallPrompt } from "@/components/InstallPrompt";
import { MusicPlayerWrapper } from "@/components/MusicPlayerWrapper";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Favorites from "./pages/Favorites";
import Playlists from "./pages/Playlists";
import PlaylistDetail from "./pages/PlaylistDetail";
import Offline from "./pages/Offline";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/install" element={<Install />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/playlists"
        element={
          <ProtectedRoute>
            <Playlists />
          </ProtectedRoute>
        }
      />
      <Route
        path="/playlist/:id"
        element={
          <ProtectedRoute>
            <PlaylistDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/offline"
        element={
          <ProtectedRoute>
            <Offline />
          </ProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MusicPlayerProvider>
            <AppContent />
            <InstallPrompt />
            <MusicPlayerWrapper />
          </MusicPlayerProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;