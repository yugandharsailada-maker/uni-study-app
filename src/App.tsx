import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useCustomColors } from "@/hooks/useCustomColors";
import { Logo } from "./components/ui/Logo";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { BentoGridSkeleton } from "@/components/dashboard/BentoGridSkeleton";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized QueryClient with better cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-background lg:h-screen lg:overflow-hidden p-6 lg:p-0">
    <div className="max-w-[1400px] w-full mx-auto lg:h-full lg:pt-20">
      <BentoGridSkeleton />
    </div>
  </div>
);

const AppContent = () => {
  useCustomColors(); // Load saved custom colors

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalErrorBoundary>
      <AuthProvider>
        <ProfileProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PreferencesProvider>
              <ThemeProvider>
                <AppContent />
              </ThemeProvider>
            </PreferencesProvider>
          </TooltipProvider>
        </ProfileProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  </QueryClientProvider>
);

export default App;
