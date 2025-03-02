import { Routes, Route } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import AuthPage from './pages/auth/index';
import AppLayout from './pages/app/index';
import { UserProfile } from './pages/app/pages/UserProfile';
import { Analytics } from '@vercel/analytics/react';
import { ToastProvider } from './components/ui/toast';
import { Toaster } from 'react-hot-toast';

console.log('App rendering');

export default function App() {
  return (
    <>
      <ToastProvider>
        <ScrollToTop />
        <Routes>
          {/* Main entry point to AuthPage */}
          <Route path="/" element={<AuthPage />} />
          
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