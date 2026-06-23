import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import { LazyMotion, loadMotionFeatures } from "@/lib/motion";
import { features } from "@/config/features";

import Login from "@/pages/Login";
import Overview from "@/pages/Overview";
import Briefings from "@/pages/Briefings";
import Findings from "@/pages/Findings";
import Strategy from "@/pages/Strategy";
import Workspace from "@/pages/Workspace";
import WorkspaceCallback from "@/pages/WorkspaceCallback";
import Assistant from "@/pages/Assistant";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Calendar from "@/pages/Calendar";
import Value from "@/pages/Value";
import Audits from "@/pages/Audits";
import AuditDetail from "@/pages/AuditDetail";
import Connectors from "@/pages/Connectors";
import Loops from "@/pages/Loops";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures} strict>
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
                {features.projects && <Route path="projects" element={<Projects />} />}
                {features.projects && <Route path="projects/:id" element={<ProjectDetail />} />}
                {features.calendar && <Route path="calendar" element={<Calendar />} />}
                {features.value && <Route path="value" element={<Value />} />}
                {features.audits && (
                  <Route path="audits" element={<ProtectedRoute tier="admin"><Audits /></ProtectedRoute>} />
                )}
                {features.audits && (
                  <Route path="audits/:id" element={<ProtectedRoute tier="admin"><AuditDetail /></ProtectedRoute>} />
                )}
                {features.connectors && (
                  <Route path="connectors" element={<ProtectedRoute tier="admin"><Connectors /></ProtectedRoute>} />
                )}
                {features.loops && (
                  <Route path="loops" element={<ProtectedRoute tier="admin"><Loops /></ProtectedRoute>} />
                )}
                {features.briefings && <Route path="briefings" element={<Briefings />} />}
                {features.findings && (
                  <Route
                    path="findings"
                    element={
                      <ProtectedRoute tier="admin">
                        <Findings />
                      </ProtectedRoute>
                    }
                  />
                )}
                {features.strategy && <Route path="strategy" element={<Strategy />} />}
                {features.workspace && <Route path="workspace" element={<Workspace />} />}
                {features.workspace && (
                  <Route path="workspace/callback" element={<WorkspaceCallback />} />
                )}
                {features.assistant && <Route path="assistant" element={<Assistant />} />}
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </LazyMotion>
    </QueryClientProvider>
  );
}
