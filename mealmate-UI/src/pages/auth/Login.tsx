import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { login as loginRequest } from '@/features/auth/api/authApi';
import { AuthInput, AuthButton, AuthLayout } from '@/components/auth/AuthComponents';
import './Login.css'; // Import trực tiếp file css cùng cấp

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
      const response = await loginRequest({ email, password });

      login({
        userId: response.userId,
        email: response.email,
        fullName: response.fullName,
        accessToken: response.accessToken ?? '',
        tokenType: response.tokenType,
      });

      navigate('/fridge', { replace: true });
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

          <AuthButton type="submit" style={{ marginTop: '8px' }} disabled={isSubmitting}>
            {isSubmitting ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
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