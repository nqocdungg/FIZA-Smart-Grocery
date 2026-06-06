import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ProfileDetail from '@/pages/profile/ProfileDetail';

import MyFridge from '@/pages/customer/fridge/MyFridge';
import FamilyGroup from '@/pages/customer/group/FamilyGroup';
import MenuSuggestion from '@/pages/customer/MenuSuggestion';
import RecipeLibrary from '@/pages/customer/recipes/RecipeLibrary';
import Reports from '@/pages/customer/Reports';
import ShoppingPlanPage from '@/pages/customer/shopping-plan/ShoppingPlanPage';

import FoodManagement from '@/pages/admin/FoodManagement';
import PerformanceManagement from '@/pages/admin/PerformanceManagement';
import RecipeManagement from '@/pages/admin/RecipeManagement';
import UserManagement from '@/pages/admin/UserManagement';
import { Toaster } from 'react-hot-toast';
import { getAuthRedirectPath, isAdminRole } from '@/features/auth/role';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RequireUser: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdminRole(user)) {
    return <Navigate to="/admin/users" replace />;
  }

  return <>{children}</>;
};

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminRole(user)) {
    return <Navigate to={getAuthRedirectPath(user)} replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={getAuthRedirectPath(user)} replace />;
  }

  return <>{children}</>;
};

const HomeRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getAuthRedirectPath(user)} replace />;
};

const App: React.FC = () => {
  return (
    <> <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        <Route path="/customer/fridge" element={<Navigate to="/fridge" replace />} />
        <Route path="/customer/family" element={<Navigate to="/family" replace />} />
        <Route path="/customer/shopping" element={<Navigate to="/shopping" replace />} />
        <Route path="/customer/suggestions" element={<Navigate to="/suggestions" replace />} />
        <Route path="/customer/reports" element={<Navigate to="/reports" replace />} />

        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

        <Route path="/profile" element={<RequireAuth><ProfileDetail /></RequireAuth>} />

        <Route path="/family" element={<RequireUser><FamilyGroup /></RequireUser>} />
        <Route path="/shopping" element={<RequireUser><ShoppingPlanPage /></RequireUser>} />
        <Route path="/fridge" element={<RequireUser><MyFridge /></RequireUser>} />
        <Route path="/recipes" element={<RequireUser><RecipeLibrary /></RequireUser>} />
        <Route path="/suggestions" element={<RequireUser><MenuSuggestion /></RequireUser>} />
        <Route path="/reports" element={<RequireUser><Reports /></RequireUser>} />

        {/* Admin Routes */}
        <Route path="/admin/users" element={<RequireAdmin><UserManagement /></RequireAdmin>} />
        <Route path="/admin/foods" element={<RequireAdmin><FoodManagement /></RequireAdmin>} />
        <Route path="/admin/recipes" element={<RequireAdmin><RecipeManagement /></RequireAdmin>} />
        <Route path="/admin/performance" element={<RequireAdmin><PerformanceManagement /></RequireAdmin>} />

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </>
  );
};

export default App;
