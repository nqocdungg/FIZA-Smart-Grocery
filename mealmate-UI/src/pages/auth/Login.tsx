import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthInput, AuthButton, AuthLayout } from '@/components/auth/AuthComponents';
import './Login.css'; // Import trực tiếp file css cùng cấp

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { identifier?: string; password?: string } = {};
    if (!emailOrPhone.trim()) {
      newErrors.identifier = "Vui lòng nhập Email hoặc Số điện thoại.";
    } else if (emailOrPhone.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone)) {
        newErrors.identifier = "Định dạng Email không hợp lệ.";
      }
    } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(emailOrPhone)) {
      newErrors.identifier = "SĐT chưa đúng định dạng VN.";
    }

    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      console.log("Login data:", { emailOrPhone, password });
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
              label="Email/SĐT"
              placeholder="Nhập email hoặc số điện thoại"
              value={emailOrPhone}
              onChange={(e) => {
                setEmailOrPhone(e.target.value);
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
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              rightLabel={<span className="forgot-pass">Quên mật khẩu?</span>}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <AuthButton type="submit" style={{ marginTop: '8px' }}>
            ĐĂNG NHẬP
          </AuthButton>
        </form>

        <footer className="login-footer">
          <span style={{ color: 'var(--fiza-gray-500)' }}>Chưa có tài khoản?</span>
          <span onClick={() => navigate('/register')} className="register-link">
            Đăng ký ngay
          </span>
        </footer>
      </div>
    </AuthLayout>
  );
};

export default Login;