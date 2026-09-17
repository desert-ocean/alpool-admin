import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AdminLayout } from './layouts/AdminLayout';
import { LeadDetailsPage } from './pages/LeadDetailsPage';
import { LeadsPage } from './pages/LeadsPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { isDemoMode } from './config/runtime';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isDemoMode() || isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isDemoMode() || isAuthenticated ? '/leads' : '/login'} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/:id" element={<LeadDetailsPage />} />
        </Route>
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
