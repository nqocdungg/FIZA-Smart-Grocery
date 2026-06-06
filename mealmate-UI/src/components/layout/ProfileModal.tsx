import React, { useState, useEffect } from "react";
// 🎯 GIỮ NGUYÊN VẸN: createPortal giúp đẩy modal lên front, không bao giờ bị che khuất
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api"; 
import "./ProfileModal.css"; 

import defaultAvatar from "@/assets/avatar/26.svg";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyName?: string;
  memberData?: any;
  isMe?: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, familyName, memberData, isMe = false }) => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const userFromContext = authContext?.user;
  const logoutFromContext = (authContext as any)?.logout; 

  let userFromLocalStorage = null;
  const authUserString = localStorage.getItem("authUser");
  if (authUserString) {
    try {
      userFromLocalStorage = JSON.parse(authUserString);
    } catch (e) {
      console.error("Lỗi đọc thông tin local tại ProfileModal:", e);
    }
  }

  const displayUser = memberData || (isMe ? (userFromContext || userFromLocalStorage) : null);

  // =========================================================================
  // 🎯 QUẢN LÝ TRẠNG THÁI FORM CHỈNH SỬA & MẬT KHẨU KHÓA ĐÔI
  // =========================================================================
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [editGender, setEditGender] = useState<string>("OTHER");
  
  // State phục vụ luồng kiểm tra trùng khớp mật khẩu mới (NEW)
  const [editPassword, setEditPassword] = useState<string>(""); 
  const [confirmPassword, setConfirmPassword] = useState<string>(""); 
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Đồng bộ dữ liệu người dùng vào Form khi mở Modal
  useEffect(() => {
    if (isOpen && displayUser) {
      setEditFullName(displayUser?.fullName || displayUser?.full_name || displayUser?.name || "");
      setEditPhone(displayUser?.phone || displayUser?.phoneNumber || "");
      setEditGender(String(displayUser?.gender || "OTHER").toUpperCase());
      
      // Reset sạch form mật khẩu ẩn về rỗng khi mở modal
      setEditPassword(""); 
      setConfirmPassword("");
      setIsEditing(false); 
    }
  }, [isOpen, displayUser]);

  if (!isOpen) return null;
  if (!displayUser) return null;

  const email = displayUser?.email || "Chưa cập nhật";
  const avatarUrl = displayUser?.avatarUrl || displayUser?.avatar_url || displayUser?.avatar || defaultAvatar;
  const roleObj = displayUser?.role;
  const roleName = (typeof roleObj === "object" && roleObj !== null ? roleObj.name : roleObj) 
                    || displayUser?.roleName 
                    || "";
  const normalizedRoleName = String(roleName).toUpperCase();
  const isAdminRole = normalizedRoleName.includes("ADMIN");
  const isHousekeeperRole = normalizedRoleName.includes("HOUSEKEEPER") ||
                            normalizedRoleName.includes("CHỦ NHÀ");
  const roleLabel = isAdminRole ? "Quản trị viên" : isHousekeeperRole ? "Chủ nhà" : "Thành viên";

  const handleLogoutClick = () => {
    const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất tài khoản khỏi hệ thống không?");
    if (!confirmLogout) return;

    if (typeof logoutFromContext === "function") {
      logoutFromContext();
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");
      localStorage.removeItem("currentFamilyName");
    }
    
    onClose(); 
    navigate("/login"); 
    window.location.reload(); 
  };

  // =========================================================================
  // 🎯 HÀM XỬ LÝ LƯU THÔNG TIN LÊN BACKEND (Kiểm tra đối khớp mật khẩu)
  // =========================================================================
  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      alert("⚠️ Họ và tên không được để trống!");
      return;
    }

    // Kiểm tra xem người dùng có thực sự muốn đổi mật khẩu hay không
    const hasPasswordInput = editPassword.trim().length > 0 || confirmPassword.trim().length > 0;
    
    if (hasPasswordInput) {
      if (editPassword.trim().length < 6) {
        alert("⚠️ Mật khẩu mới phải có độ dài từ 6 ký tự trở lên!");
        return;
      }
      if (editPassword.trim() !== confirmPassword.trim()) {
        alert("❌ Xác nhận mật khẩu mới không trùng khớp! Vui lòng kiểm tra lại.");
        return;
      }
    }

    const token = localStorage.getItem("accessToken");
    setIsSubmitting(true);

    try {
      // 🎯 CHIẾN THUẬT DỰ PHÒNG KÉP: Bắn cả CamelCase lẫn SnakeCase để triệt tiêu lỗi lệch DTO ở Backend
      const payload: any = {
        fullName: editFullName.trim(),
        full_name: editFullName.trim(),     // Dự phòng nếu Backend dùng snake_case
        phone: editPhone.trim(),
        phoneNumber: editPhone.trim(),      // Dự phòng nếu Backend dùng phoneNumber
        phone_number: editPhone.trim(),     // Dự phòng nếu Backend dùng phone_number
        gender: editGender
      };

      // 🎯 Chỉ đính kèm password nếu có nội dung nhập mới hợp lệ
      if (hasPasswordInput) {
        payload.password = editPassword.trim();
      }

      console.log("👉 [PUT PROFILE DEBUG] Gửi dữ liệu cập nhật lên Server:", payload);

      const res = await api.put("/api/v1/users/users/profile", payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        alert("🎉 Cập nhật thông tin tài khoản thành công!");
        setIsEditing(false);

        // Đồng bộ ngay dữ liệu mới vào bộ nhớ trình duyệt để các trang khác nhận diện luôn
        if (userFromLocalStorage) {
          const updatedUser = { 
            ...userFromLocalStorage, 
            fullName: editFullName.trim(), 
            full_name: editFullName.trim(), 
            phone: editPhone.trim(), 
            phoneNumber: editPhone.trim(),
            gender: editGender 
          };
          localStorage.setItem("authUser", JSON.stringify(updatedUser));
        }

        // Tải lại trang nhẹ nhàng để cập nhật toàn diện
        window.location.reload();
      } else {
        alert(`Thất bại: ${res.data.message || "Không thể lưu thông tin"}`);
      }
    } catch (err: any) {
      console.error("❌ Lỗi API cập nhật Profile:", err);
      alert("Hệ thống từ chối cập nhật! Vui lòng kiểm tra log Console của Spring Boot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        
        <button type="button" className="profile-modal-close-btn" onClick={onClose} aria-label="Đóng">
          ×
        </button>

        <div className="profile-modal-tag-wrapper">
          <span className="profile-modal-tag">
            {isMe ? "THÔNG TIN TÀI KHOẢN" : "THÔNG TIN THÀNH VIÊN"}
          </span>
        </div>

        <div className="profile-modal-body">
          
          <div className="profile-modal-sidebar">
            <div className="profile-modal-avatar-container">
              <img 
                className="profile-modal-avatar-img" 
                src={avatarUrl} 
                onError={(e) => { (e.target as HTMLImageElement).src = defaultAvatar; }}
                alt="Avatar"
              />
              <div className="profile-modal-avatar-badge">
                <div className="profile-modal-avatar-badge-icon" />
              </div>
            </div>

            <div className="profile-modal-meta-info">
              <h3 className="profile-modal-username">{isEditing ? editFullName : (displayUser?.fullName || displayUser?.full_name || displayUser?.name)}</h3>
              <span className="profile-modal-role-badge">{roleLabel}</span>
            </div>
          </div>

          <div className="profile-modal-content">
            <h4 className="profile-modal-section-title">Thông tin chi tiết</h4>

            <div className="profile-modal-info-grid">
              
              {/* Họ và tên */}
              <div className="profile-modal-info-col">
                <span className="profile-modal-info-label">Họ và tên</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="profile-modal-input-editing" 
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                  />
                ) : (
                  <span className="profile-modal-info-value">{editFullName}</span>
                )}
              </div>

              {/* Vai trò: KHÓA CHẶT */}
              <div className="profile-modal-info-col">
                <span className="profile-modal-info-label">Vai trò</span>
                {isEditing ? (
                  <input type="text" className="profile-modal-input-disabled" value={roleLabel} disabled />
                ) : (
                  <span className="profile-modal-info-value">{roleLabel}</span>
                )}
              </div>

              {/* Gia đình: KHÓA CHẶT */}
              <div className="profile-modal-info-col">
                <span className="profile-modal-info-label">Gia đình</span>
                {isEditing ? (
                  <input type="text" className="profile-modal-input-disabled" value={familyName || "Chưa có gia đình"} disabled />
                ) : (
                  <span className="profile-modal-info-value">{familyName || "Chưa có gia đình"}</span>
                )}
              </div>

              {/* Số điện thoại */}
              <div className="profile-modal-info-col">
                <span className="profile-modal-info-label">Số điện thoại</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    className="profile-modal-input-editing" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                ) : (
                  <span className="profile-modal-info-value">{editPhone || "Chưa cập nhật"}</span>
                )}
              </div>

              {/* Giới tính - Dropdown */}
              <div className="profile-modal-info-col">
                <span className="profile-modal-info-label">Giới tính</span>
                {isEditing ? (
                  <select 
                    className="profile-modal-select-editing"
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                ) : (
                  <span className="profile-modal-info-value">
                    {editGender === "MALE" ? "Nam" : editGender === "FEMALE" ? "Nữ" : "Khác"}
                  </span>
                )}
              </div>

              {/* Email: KHÓA CHẶT */}
              <div className="profile-modal-info-col">
                <span className="profile-modal-info-label">Email</span>
                {isEditing ? (
                  <input type="text" className="profile-modal-input-disabled" value={email} disabled />
                ) : (
                  <span className="profile-modal-info-value">{email}</span>
                )}
              </div>

            </div>

            {/* =========================================================================
                🎯 KHỐI XỬ LÝ MẬT KHẨU MỚI & XÁC NHẬN MẬT KHẨU VIỀN XANH (NEW)
                ========================================================================= */}
            {isMe && (
              <div className="profile-modal-password-section-wrapper" style={{ marginTop: '16px' }}>
                {isEditing ? (
                  /* 🎯 TRẠNG THÁI EDIT: Tách đôi thành 2 ô input viền xanh song song */
                  <div className="profile-modal-password-edit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
                    <div className="profile-modal-info-col">
                      <span className="profile-modal-info-label" style={{ color: '#10B981', fontWeight: 'bold' }}>Mật khẩu mới</span>
                      <input 
                        type="password" 
                        className="profile-modal-input-editing" 
                        placeholder="Để trống nếu không đổi..."
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                      />
                    </div>
                    <div className="profile-modal-info-col">
                      <span className="profile-modal-info-label" style={{ color: '#10B981', fontWeight: 'bold' }}>Xác nhận mật khẩu mới</span>
                      <input 
                        type="password" 
                        className="profile-modal-input-editing" 
                        placeholder="Nhập lại mật khẩu mới..."
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  /* TRẠNG THÁI XEM: Giữ nguyên dòng bảo mật cũ */
                  <div className="profile-modal-password-row">
                    <div className="profile-modal-password-left">
                      <span className="profile-modal-info-label">Mật khẩu</span>
                      <span className="profile-modal-info-value">••••••••</span>
                    </div>
                    <button type="button" className="profile-modal-password-btn" onClick={() => setIsEditing(true)}>
                      Đổi mật khẩu
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="profile-modal-actions">
              {isMe && (
                <>
                  {!isEditing ? (
                    <>
                      <button 
                        type="button" 
                        className="profile-modal-btn-close" 
                        onClick={handleLogoutClick}
                        style={{ 
                          borderColor: '#FEE2E2', 
                          color: '#EF4444', 
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          fontWeight: '600'
                        }}
                      >
                        Đăng xuất
                      </button>
                      <button 
                        type="button" 
                        className="profile-modal-btn-edit"
                        onClick={() => setIsEditing(true)}
                      >
                        Chỉnh sửa thông tin
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        className="profile-modal-btn-close" 
                        onClick={() => setIsEditing(false)} 
                        disabled={isSubmitting}
                        style={{ borderColor: '#D1D5DB', color: '#4B5563', backgroundColor: '#F3F4F6' }}
                      >
                        Hủy bỏ
                      </button>
                      <button 
                        type="button" 
                        className="profile-modal-btn-edit"
                        onClick={handleSaveProfile} 
                        disabled={isSubmitting}
                        style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFF' }}
                      >
                        {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileModal;
