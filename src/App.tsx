import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";

import Login from "@/pages/Login";
import Overview from "@/pages/Overview";
import Briefings from "@/pages/Briefings";
import Findings from "@/pages/Findings";
import Strategy from "@/pages/Strategy";
import Workspace from "@/pages/Workspace";
import Assistant from "@/pages/Assistant";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="briefings" element={<Briefings />} />
              <Route
                path="findings"
                element={
                  <ProtectedRoute tier="admin">
                    <Findings />
                  </ProtectedRoute>
                }
              />
              <Route path="strategy" element={<Strategy />} />
              <Route path="workspace" element={<Workspace />} />
              <Route path="assistant" element={<Assistant />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
