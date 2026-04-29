import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Profile
import ProfileDetail from '@/pages/profile/ProfileDetail';

// Customer Pages
import FamilyGroup from '@/pages/customer/FamilyGroup';
import ShoppingPlan from '@/pages/customer/ShoppingPlan';
import MyFridge from '@/pages/customer/MyFridge';
import MenuSuggestion from '@/pages/customer/MenuSuggestion';
import Reports from '@/pages/customer/Reports';

// Admin Pages
import UserManagement from '@/pages/admin/UserManagement';
import FoodManagement from '@/pages/admin/FoodManagement';
import RecipeManagement from '@/pages/admin/RecipeManagement';
import Performance from '@/pages/admin/Performance';

const App: React.FC = () => {
  return (
    <Routes>
      {/* TODO: Implement route guards based on AuthContext role (ADMIN / CUSTOMER) */}

      {/* Auth Routes - Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Profile */}
      <Route path="/profile" element={<ProfileDetail />} />

      {/* Customer Routes */}
      <Route path="/family" element={<FamilyGroup />} />
      <Route path="/shopping" element={<ShoppingPlan />} />
      <Route path="/fridge" element={<MyFridge />} />
      <Route path="/suggestions" element={<MenuSuggestion />} />
      <Route path="/reports" element={<Reports />} />

      {/* Admin Routes */}
      <Route path="/admin/users" element={<UserManagement />} />
      <Route path="/admin/foods" element={<FoodManagement />} />
      <Route path="/admin/recipes" element={<RecipeManagement />} />
      <Route path="/admin/performance" element={<Performance />} />

      {/* Default redirect */}
      <Route path="/" element={<Login />} />
    </Routes>
  );
};

export default App;
