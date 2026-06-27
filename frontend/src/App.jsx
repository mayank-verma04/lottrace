import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';

import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// App Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OrganizationPage = lazy(() => import('./pages/settings/OrganizationPage'));
const UsersPage = lazy(() => import('./pages/settings/UsersPage'));

// Locations & Products
const LocationsListPage = lazy(() => import('./pages/locations/LocationsListPage'));
const LocationDetailPage = lazy(() => import('./pages/locations/LocationDetailPage'));
const ProductsListPage = lazy(() => import('./pages/products/ProductsListPage'));
const ProductDetailPage = lazy(() => import('./pages/products/ProductDetailPage'));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* App Routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<OrganizationPage />} />
              <Route path="/settings/users" element={<UsersPage />} />
              
              {/* Locations & Products */}
              <Route path="/locations" element={<LocationsListPage />} />
              <Route path="/locations/:locationId" element={<LocationDetailPage />} />
              <Route path="/products" element={<ProductsListPage />} />
              <Route path="/products/:productId" element={<ProductDetailPage />} />

              {/* Placeholders for remaining routes */}
              <Route path="/lots" element={<div>Lots Placeholder</div>} />
              <Route path="/events/record" element={<div>Record Event Placeholder</div>} />
              <Route path="/trace" element={<div>Trace Placeholder</div>} />
              <Route path="/imports" element={<div>Imports Placeholder</div>} />
              <Route path="/reports" element={<div>Reports Placeholder</div>} />
              <Route path="/recall" element={<div>Recall Placeholder</div>} />
              <Route path="/audit" element={<div>Audit Placeholder</div>} />
            </Route>
            
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
