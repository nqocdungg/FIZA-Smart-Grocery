import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// Auth Pages
import { useAuth } from '@/context/AuthContext';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Profile
import ProfileDetail from '@/pages/profile/ProfileDetail';

// Customer Pages
import FamilyGroup from '@/pages/customer/group/FamilyGroup';
import ShoppingPlan from '@/pages/customer/ShoppingPlan';
import MyFridge from '@/pages/customer/fridge/MyFridge';
import MenuSuggestion from '@/pages/customer/MenuSuggestion';
import Reports from '@/pages/customer/Reports';

// Admin Pages
import FoodManagement from '@/pages/admin/FoodManagement';
import PerformanceManagement from '@/pages/admin/PerformanceManagement';
import RecipeManagement from '@/pages/admin/RecipeManagement';
import UserManagement from '@/pages/admin/UserManagement';
import ShoppingPlanPage from '@/pages/customer/shopping-plan/ShoppingPlanPage';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/fridge" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin/users' : '/fridge'} replace />;
  }

  return <>{children}</>;
};

const HomeRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user?.role === 'ADMIN' ? '/admin/users' : '/fridge'} replace />;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes - Public */}
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

      {/* Profile */}
      <Route path="/profile" element={<RequireAuth><ProfileDetail /></RequireAuth>} />

      {/* Customer Routes */}
      <Route path="/family" element={<RequireAuth><FamilyGroup /></RequireAuth>} />
      <Route path="/shopping" element={<RequireAuth><ShoppingPlanPage /></RequireAuth>} />
      <Route path="/fridge" element={<RequireAuth><MyFridge /></RequireAuth>} />
      <Route path="/suggestions" element={<RequireAuth><MenuSuggestion /></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />

      {/* Admin Routes */}
      <Route path="/admin/users" element={<RequireAdmin><UserManagement /></RequireAdmin>} />
      <Route path="/admin/foods" element={<RequireAdmin><FoodManagement /></RequireAdmin>} />
      <Route path="/admin/recipes" element={<RequireAdmin><RecipeManagement /></RequireAdmin>} />
      <Route path="/admin/performance" element={<RequireAdmin><PerformanceManagement /></RequireAdmin>} />

      {/* Default redirect */}
      <Route path="/" element={<HomeRedirect />} />
    </Routes>
  );
};

export default App;
