import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { login as loginRequest } from '@/features/auth/api/authApi';
import { AuthInput, AuthButton, AuthLayout } from '@/components/auth/AuthComponents';
import api from "@/services/api"; // 🎯 GIỮ NGUYÊN: Sử dụng instance axios cấu hình chung để gọi các API bổ sung
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: { identifier?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.identifier = 'Vui lòng nhập Email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.identifier = 'Định dạng Email không hợp lệ.';
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
      // 1. Gọi API đăng nhập để bốc thông tin Token xác thực cơ bản
      const response = await loginRequest({ email, password });
      const currentToken = response.accessToken ?? '';

      // Đặt các biến cục bộ bọc lót dữ liệu chi tiết
      let detailedPhone = "Chưa cập nhật";
      let detailedGender = "OTHER";
      let detailedRoleName = "Thành viên";

      // 🎯 Ép kiểu trung gian sang 'any' để bypass qua bộ lọc TypeScript của AuthResponse gốc
      const rawResponse = response as any;
      let detailedAvatar = rawResponse.avatarUrl || rawResponse.avatar_url || undefined;

      // 2. KỸ THUẬT NẠP TRƯỚC (PRE-FETCH): Gọi ngay các API phụ để kéo thông tin chi tiết
      if (currentToken) {
        try {
          // A. Tải thông tin tên nhóm gia đình hiện tại
          const resGroup = await api.get('/api/v1/users/familys/current', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
          });
          const groupData = resGroup.data.success ? resGroup.data.data : resGroup.data;
          if (groupData?.name) {
            localStorage.setItem("currentFamilyName", String(groupData.name).trim());
          }

          // B. Tải danh sách thành viên đầy đủ trường để bóc tách thông tin cá nhân của chính mình
          const resMembers = await api.get('/api/v1/users/users/family/members', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
          });
          const dbMembers = resMembers.data.success ? resMembers.data.data : resMembers.data;
          
          if (Array.isArray(dbMembers)) {
            // Định dạng và lưu bộ nhớ đệm danh sách thành viên phục vụ hệ thống
            const formattedMembers = dbMembers.map((m: any) => {
              const rName = String(m.roleName || m.role?.name || m.role).toUpperCase();
              const isOwner = rName.includes("BOSS") || rName.includes("CHỦ NHÀ") || rName.includes("ADMIN") || rName.includes("HOUSEKEEPER");
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

            // Tìm kiếm chính xác bản ghi của bản thân trong danh sách theo userId nhận về lúc login
            const mySelf = formattedMembers.find((m: any) => Number(m.id) === Number(response.userId));
            if (mySelf) {
              detailedPhone = mySelf.phone;
              detailedGender = mySelf.gender;
              detailedRoleName = mySelf.roleName;
              detailedAvatar = mySelf.avatarUrl || detailedAvatar; // Đồng bộ avatarUrl chuẩn chỉ
            }
          }
        } catch (extraErr) {
          console.warn("⚠️ Không thể tải trước dữ liệu chi tiết, sử dụng cấu trúc mặc định phòng thủ:", extraErr);
        }
      }

      // 3. Gọi hàm login của AuthContext để đồng bộ cục dữ liệu HOÀN HẢO lên Global State & LocalStorage
      login({
        userId: response.userId,
        email: response.email,
        fullName: response.fullName,
        accessToken: currentToken,
        tokenType: response.tokenType,
        role: response.role, // Giữ lại cho phân quyền admin
        phone: detailedPhone,
        gender: detailedGender,
        roleName: detailedRoleName,
        avatarUrl: detailedAvatar 
      });

      // 4. KIỂM TRA PHÂN QUYỀN VÀ ĐIỀU HƯỚNG CHUẨN XÁC
      if (response.role === 'ADMIN') {
        navigate('/admin/users', { replace: true });
      } else {
        navigate('/fridge', { replace: true });
      }
      
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
          
          <div className="input-group">
            <AuthInput 
              label="Email"
              placeholder="Nhập email của bạn"
              value={email}
              autoComplete="email"
              disabled={isSubmitting}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.identifier) setErrors({ ...errors, identifier: '' });
              }}
              className={errors.identifier ? 'input-error' : ''}
            />
            {errors.identifier && <span className="error-text">{errors.identifier}</span>}
          </div>

          <div className="input-group">
            <AuthInput 
              label="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              autoComplete="current-password"
              disabled={isSubmitting}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              rightLabel={<span className="forgot-pass">Quên mật khẩu?</span>}
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
    </AuthLayout>
  );
};

export default Login;