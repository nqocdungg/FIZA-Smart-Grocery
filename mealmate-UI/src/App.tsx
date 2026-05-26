import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ProfileDetail from '@/pages/profile/ProfileDetail';

import FamilyGroup from '@/pages/customer/group/FamilyGroup';
import MyFridge from '@/pages/customer/fridge/MyFridge';
import MenuSuggestion from '@/pages/customer/MenuSuggestion';
import Reports from '@/pages/customer/Reports';
import ShoppingPlanPage from '@/pages/customer/shopping-plan/ShoppingPlanPage';

import FoodManagement from '@/pages/admin/FoodManagement';
import RecipeManagement from '@/pages/admin/RecipeManagement';
import UserManagement from '@/pages/admin/UserManagement';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/fridge" replace />;
  return <>{children}</>;
};

const HomeRedirect: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/fridge' : '/login'} replace />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/customer/fridge" element={<Navigate to="/fridge" replace />} />
      <Route path="/customer/family" element={<Navigate to="/family" replace />} />
      <Route path="/customer/shopping" element={<Navigate to="/shopping" replace />} />
      <Route path="/customer/suggestions" element={<Navigate to="/suggestions" replace />} />
      <Route path="/customer/reports" element={<Navigate to="/reports" replace />} />

      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

      <Route path="/profile" element={<RequireAuth><ProfileDetail /></RequireAuth>} />

      <Route path="/family" element={<RequireAuth><FamilyGroup /></RequireAuth>} />
      <Route path="/shopping" element={<RequireAuth><ShoppingPlanPage /></RequireAuth>} />
      <Route path="/fridge" element={<RequireAuth><MyFridge /></RequireAuth>} />
      <Route path="/suggestions" element={<RequireAuth><MenuSuggestion /></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />

      <Route path="/admin/users" element={<RequireAuth><UserManagement /></RequireAuth>} />
      <Route path="/admin/foods" element={<RequireAuth><FoodManagement /></RequireAuth>} />
      <Route path="/admin/recipes" element={<RequireAuth><RecipeManagement /></RequireAuth>} />

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
};

export default App;
