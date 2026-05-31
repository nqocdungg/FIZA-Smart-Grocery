import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthInput, AuthButton } from '@/components/auth/AuthComponents';
import { register as registerRequest } from '@/features/auth/api/authApi';
import './Register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    gender: 'Nam',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

    if (!phoneRegex.test(formData.phone)) newErrors.phone = "SĐT chưa đúng định dạng VN (10 số).";
    if (!formData.email.includes('@')) newErrors.email = "Email phải có ký tự '@'.";
    if (formData.password.length < 6) newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";

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

    return 'Đăng ký thất bại. Vui lòng thử lại.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 🎯 BƯỚC ĐỒNG BỘ: Chuyển đổi chữ Tiếng Việt sang ENUM chuẩn CSDL Backend nhận dạng
      const backendGender = formData.gender === 'Nam' ? 'MALE' 
                          : formData.gender === 'Nữ' ? 'FEMALE' 
                          : 'OTHER';

      const response = await registerRequest({
        fullName: formData.fullName,
        phone: formData.phone,
        gender: backendGender, // 🎯 THÊM DÒNG NÀY: Đã bắn chuẩn trường giới tính lên hệ thống API
        email: formData.email,
        password: formData.password,
      });

      setSuccessMessage(response?.email ? 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.' : 'Đăng ký thành công.');
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-overlay">
      <div className="register-bg-layer" />

      <div className="register-modal">
        <button onClick={() => navigate(-1)} className="close-btn">✕</button>

        <div className="register-header">
          <span className="logo-text">FIZA</span>
          <h1 className="register-title">Đăng ký tài khoản Fiza</h1>
          <p className="register-subtitle">Gia nhập bếp nhà thông minh</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {submitError && <span className="error-text" style={{ marginBottom: '8px' }}>{submitError}</span>}
          {successMessage && <span className="error-text" style={{ marginBottom: '8px', color: '#0b735f' }}>{successMessage}</span>}

          <AuthInput 
            label="HỌ TÊN" 
            name="fullName"
            placeholder="VD: Nguyễn Văn A" 
            value={formData.fullName}
            onChange={handleInputChange}
          />
          
          <div className="input-with-error">
            <AuthInput 
              label="SDT" 
              name="phone"
              placeholder="Số điện thoại của bạn"
              value={formData.phone}
              onChange={handleInputChange}
              className={errors.phone ? 'input-error' : ''}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>
          
          <div className="gender-group">
            <label className="label-caps">GIỚI TÍNH</label>
            <div className="radio-container">
              {['Nam', 'Nữ', 'Khác'].map((g) => (
                <label key={g} className="radio-label">
                  <input 
                    type="radio" 
                    name="gender" 
                    checked={formData.gender === g} 
                    onChange={() => setFormData(prev => ({ ...prev, gender: g }))} 
                    className="radio-input" 
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>

          <div className="input-with-error">
            <AuthInput 
              label="EMAIL" 
              name="email"
              placeholder="user@fiza.vn"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="register-grid">
            <div className="input-with-error">
              <AuthInput 
                label="MẬT KHẨU" 
                name="password"
                type="password" 
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'input-error' : ''}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>
            <div className="input-with-error">
              <AuthInput 
                label="XÁC NHẬN" 
                name="confirmPassword"
                type="password" 
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'input-error' : ''}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>

          <AuthButton type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'ĐANG GỬI...' : 'GỬI ĐĂNG KÝ'}
          </AuthButton>
        </form>

        <div className="register-footer">
          <span style={{ color: '#718096' }}>Đã có tài khoản? </span>
          <span onClick={() => navigate('/login')} className="login-link">Đăng nhập ngay</span>
        </div>
      </div>
    </div>
  );
};

export default Register;