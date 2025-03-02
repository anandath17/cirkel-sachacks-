import { Routes, Route } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import AuthPage from './pages/auth/index';
import AppLayout from './pages/app/index';
import { UserProfile } from './pages/app/pages/UserProfile';
import { Analytics } from '@vercel/analytics/react';
import { ToastProvider } from './components/ui/toast';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <>
      <ToastProvider>
        <ScrollToTop />
        <Routes>
          {/* Redirect root to auth page */}
          <Route path="/" element={<Navigate to="/auth#login" replace />} />
          
          {/* Auth route */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected routes */}
          <Route path="/app/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="profile/:userId" element={<UserProfile />} />
          </Route>
        </Routes>
      </ToastProvider>
      <Analytics />
      <Toaster />
    </>
  );
} 