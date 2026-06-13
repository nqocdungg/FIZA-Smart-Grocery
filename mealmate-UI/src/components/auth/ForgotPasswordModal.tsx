import React, { useState } from "react";
import { X, KeyRound } from "lucide-react";
import api from "@/services/api";
import { AuthInput, AuthButton } from "@/components/auth/AuthComponents";
import "./ForgotPasswordModal.css";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [keyword, setKeyword] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");
  const [successText, setSuccessText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setKeyword("");
    setErrorText("");
    setSuccessText("");
    onClose();
  };

  const handleRequestPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");
    if (!keyword.trim()) return setErrorText("Vui lòng nhập Email hoặc Số điện thoại.");

    setLoading(true);
    try {
      // Gọi lên API rút gọn duy nhất ở Backend
      const res = await api.post("/api/v1/users/users/forgot-password/request", { keyword: keyword.trim() });
      if (res.data?.success) {
        setSuccessText("🎉 Mật khẩu tạm thời đã được gửi! Vui lòng kiểm tra email/tin nhắn để lấy mật khẩu đăng nhập.");
        setKeyword(""); // Làm sạch ô nhập
      } else {
        setErrorText(res.data?.message || "Không thể yêu cầu mật khẩu mới.");
      }
    } catch (err: any) {
      setErrorText(err.response?.data?.message || "Tài khoản không tồn tại trên hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fiza-forgot-overlay">
      <div className="fiza-forgot-modal">
        
        <div className="fiza-forgot-header">
          <div className="fiza-forgot-title-group">
            <h4>Khôi phục mật khẩu</h4>
          </div>
          <button className="fiza-forgot-close" onClick={handleClose}><X size={20} /></button>
        </div>

        {errorText && <div className="fiza-forgot-error-banner" style={{backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', marginBottom: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 500}}>{errorText}</div>}
        {successText && <div className="fiza-forgot-success-banner" style={{backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', lineHeight: '1.5', fontWeight: 500}}>{successText}</div>}

        <div className="fiza-forgot-body">
          {!successText && (
            <form onSubmit={handleRequestPassword}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <KeyRound size={44} style={{ color: '#00bcd4' }} />
              </div>
              <p style={{ fontSize: '14px', color: '#68736f', textAlign: 'center', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                Nhập <strong>Email</strong> hoặc <strong>Số điện thoại</strong> của bạn. Hệ thống Fiza sẽ tự động đặt lại và cấp một mật khẩu ngẫu nhiên mới ngay lập tức.
              </p>
              <AuthInput
                label="Thông tin tài khoản"
                placeholder="Ví dụ: name@example.com hoặc 0912..."
                value={keyword}
                disabled={loading}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  if (errorText) setErrorText("");
                }}
              />
              <AuthButton type="submit" disabled={loading}>
                {loading ? "ĐANG XỬ LÝ..." : "CẤP MẬT KHẨU MỚI"}
              </AuthButton>
            </form>
          )}

          {successText && (
            <AuthButton type="button" onClick={handleClose}>
              QUAY LẠI ĐĂNG NHẬP
            </AuthButton>
          )}
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordModal;