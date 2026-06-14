import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { login as loginRequest } from '@/features/auth/api/authApi';
import { AuthInput, AuthButton, AuthLayout } from '@/components/auth/AuthComponents';
import { getAuthRedirectPath } from '@/features/auth/role';
import api from "@/services/api"; // 🎯 GIỮ NGUYÊN: Sử dụng instance axios cấu hình chung để gọi các API bổ sung
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal'; // 🎯 THÊM MỚI: Nhúng modal quên mật khẩu
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // 🎯 ĐỔI TÊN ĐỂ ĐỒNG BỘ: Sử dụng 'identifier' đại diện cho cả Email lẫn Số điện thoại
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 THÊM MỚI: Cờ hiệu kiểm soát ẩn hiện Modal Quên mật khẩu
  const [isForgotOpen, setIsForgotOpen] = useState<boolean>(false);

  // 🎯 CẬP NHẬT: Cho phép validate cả định dạng Email HOẶC Số điện thoại (chỉ chứa số, 9-11 ký tự)
  const validate = () => {
    const newErrors: { identifier?: string; password?: string } = {};
    const inputTrimmed = identifier.trim();

    if (!inputTrimmed) {
      newErrors.identifier = 'Vui lòng nhập Email hoặc Số điện thoại.';
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputTrimmed);
      const isPhone = /^\d{9,11}$/.test(inputTrimmed);

      if (!isEmail && !isPhone) {
        newErrors.identifier = 'Email hoặc Số điện thoại không hợp lệ.';
      }
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      if (response?.data?.message) {
        return response.data.message;
      }
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Đăng nhập thất bại. Vui lòng thử lại.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      localStorage.removeItem("currentFamilyName");
      localStorage.removeItem("familyMembersCache");

      // 1. Gọi API đăng nhập (truyền giá trị identifier đã gõ vào trường email của request body)
      const response = await loginRequest({ email: identifier.trim(), password });
      const currentToken = response.accessToken ?? '';

      // Đặt các biến cục bộ bọc lót dữ liệu chi tiết
      let detailedPhone = "Chưa cập nhật";
      let detailedGender = "OTHER";
      let detailedRoleName = response.role;
      let detailedFamilyId: number | undefined = response.familyId;
      let detailedFamilyName: string | undefined = response.familyName;

      if (detailedFamilyName) {
        localStorage.setItem("currentFamilyName", detailedFamilyName.trim());
      }

      const rawResponse = response as any;
      let detailedAvatar = rawResponse.avatarUrl || rawResponse.avatar_url || undefined;

      // 2. KỸ THUẬT NẠP TRƯỚC (PRE-FETCH)
      if (currentToken) {
        try {
          const resCurrentUser = await api.get('/api/v1/users/users/current', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
          });
          if (resCurrentUser.data?.success && resCurrentUser.data?.data) {
            const curUserData = resCurrentUser.data.data;
            detailedAvatar = curUserData.avatarUrl || detailedAvatar;
            detailedPhone = curUserData.phone || detailedPhone;
            detailedGender = curUserData.gender || detailedGender;
            detailedRoleName = curUserData.roleName || detailedRoleName;
          }

          const resGroup = await api.get('/api/v1/users/familys/current', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
          });
          const groupData = resGroup.data.success ? resGroup.data.data : resGroup.data;
          if (groupData?.name) {
            detailedFamilyName = String(groupData.name).trim();
            localStorage.setItem("currentFamilyName", detailedFamilyName);
          }
          if (groupData?.id) {
            detailedFamilyId = Number(groupData.id);
          }

          const resMembers = await api.get('/api/v1/users/users/family/members', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
          });
          const dbMembers = resMembers.data.success ? resMembers.data.data : resMembers.data;
          
          if (Array.isArray(dbMembers)) {
            const familyMeta = dbMembers[0];
            if (familyMeta?.familyId) {
              detailedFamilyId = Number(familyMeta.familyId);
            }
            if (familyMeta?.familyName) {
              detailedFamilyName = String(familyMeta.familyName).trim();
              localStorage.setItem("currentFamilyName", detailedFamilyName);
            }

            const formattedMembers = dbMembers.map((m: any) => {
              const rName = String(m.roleName || m.role?.name || m.role).toUpperCase();
              const isOwner = rName.includes("CHỦ NHÀ") || rName.includes("HOUSEKEEPER");
              return {
                id: m.id,
                fullName: m.fullName || m.full_name || "Thành viên ẩn danh",
                roleName: isOwner ? "Chủ nhà" : "Thành viên",
                email: m.email || "Chưa cập nhật",
                phone: m.phone || m.phoneNumber || "Chưa cập nhật",
                gender: m.gender || "OTHER",
                avatarUrl: m.avatarUrl || m.avatar_url   
              };
            });
            localStorage.setItem("familyMembersCache", JSON.stringify(formattedMembers));

            const mySelf = formattedMembers.find((m: any) => Number(m.id) === Number(response.userId));
            if (mySelf) {
              detailedPhone = mySelf.phone;
              detailedGender = mySelf.gender;
              detailedRoleName = mySelf.roleName;
              detailedAvatar = mySelf.avatarUrl || detailedAvatar;
            }
          }
        } catch (extraErr) {
          console.warn("⚠️ Không thể tải trước dữ liệu chi tiết, sử dụng cấu trúc mặc định phòng thủ:", extraErr);
        }
      }

      // 3. Đồng bộ dữ liệu lên Global State & LocalStorage
      login({
        userId: response.userId,
        email: response.email,
        fullName: response.fullName,
        accessToken: currentToken,
        tokenType: response.tokenType,
        role: response.role,
        phone: detailedPhone,
        gender: detailedGender,
        roleName: detailedRoleName,
        familyId: detailedFamilyId,
        familyName: detailedFamilyName,
        avatarUrl: detailedAvatar 
      });

      // 4. Điều hướng sau đăng nhập
      navigate(getAuthRedirectPath(response.role), { replace: true });
      
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout 
      title="Đăng nhập" 
      subtitle="Quản lý không gian bếp thông minh của bạn"
    >
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          
          {/* 🎯 CẬP NHẬT: Cho phép nhập Email hoặc Số điện thoại */}
          <div className="input-group">
            <AuthInput 
              label="Tài khoản"
              placeholder="Nhập email hoặc số điện thoại của bạn"
              value={identifier}
              autoComplete="username"
              disabled={isSubmitting}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) setErrors({ ...errors, identifier: '' });
              }}
              className={errors.identifier ? 'input-error' : ''}
            />
            {errors.identifier && <span className="error-text">{errors.identifier}</span>}
          </div>

          {/* 🎯 CẬP NHẬT: Tích hợp sự kiện click mở modal Quên mật khẩu vào rightLabel */}
          <div className="input-group">
            <AuthInput 
              label="Mật khẩu"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              autoComplete="current-password"
              disabled={isSubmitting}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              rightLabel={
                <span 
                  className="forgot-pass" 
                  onClick={() => !isSubmitting && setIsForgotOpen(true)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Quên mật khẩu?
                </span>
              }
              endAdornment={
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {submitError && <span className="error-text" style={{ marginTop: '-4px' }}>{submitError}</span>}

          <AuthButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
          </AuthButton>
        </form>

        <footer className="login-footer">
          <span style={{ color: '#88938E' }}>Chưa có tài khoản?</span>
          <span onClick={() => !isSubmitting && navigate('/register')} className="register-link">
            Đăng ký ngay
          </span>
        </footer>
      </div>

      {/* 🎯 THÊM MỚI: Thả component Modal Quên mật khẩu nằm ở đáy layout */}
      <ForgotPasswordModal 
        isOpen={isForgotOpen} 
        onClose={() => setIsForgotOpen(false)} 
      />
    </AuthLayout>
  );
};

export default Login;