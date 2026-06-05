import React, { useState } from 'react';
import './AddMember.css';

import iconMail from "@/assets/icon/Icon-Mail.svg";

// Định dạng dữ liệu thành viên nhận về từ API của trang cha
interface SearchedUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
}

interface AddMemberProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: number) => void; // Nhận userId dạng số từ hàm handleAddMemberConfirm trang cha
  onSearchUser: (emailOrPhone: string) => Promise<SearchedUser | null>; // Nhận hàm API search từ trang cha
  currentMemberCount: number; 
}

const AddMember: React.FC<AddMemberProps> = ({ isOpen, onClose, onConfirm, onSearchUser, currentMemberCount }) => {
  const [inputValue, setInputValue] = useState("");
  const [searchedUser, setSearchedUser] = useState<SearchedUser | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);

  if (!isOpen) return null;

  // Gọi API search từ trang cha khi submit form tìm kiếm
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = inputValue.trim();
    if (!cleanValue) return;

    setSearching(true);
    setHasSearched(false);
    
    const result = await onSearchUser(cleanValue);
    
    setSearchedUser(result);
    setHasSearched(true);
    setSearching(false);
  };

  // Reset sạch dữ liệu khi đóng hoặc bấm Hủy bỏ
  const handleCloseReset = () => {
    setInputValue("");
    setSearchedUser(null);
    setHasSearched(false);
    onClose();
  };

  return (
    <div className="add-member-overlay" onClick={handleCloseReset}>
      <div className="add-member-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Khối Icon đầu tiên */}
        <div className="add-member-icon-wrapper">
          <div className="add-member-icon-circle">
            <img src={iconMail} alt="Mail" className="add-member-mail-img" />
          </div>
        </div>

        {/* Tiêu đề */}
        <div className="add-member-title-box">
          <h2 className="add-member-title">Thêm thành viên</h2>
        </div>

        {/* Mô tả phụ */}
        <div className="add-member-desc-box">
          <p className="add-member-desc">
            Bạn vui lòng điền Email/SDT của thành viên trong gia đình:
          </p>
        </div>

        {/* Form nhập liệu ô tìm kiếm */}
        <form onSubmit={handleSearchSubmit} className="add-member-form">
          <div className="add-member-input-container">
            <input
              type="text"
              placeholder="name@gmail.com hoặc 090..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="add-member-input-field"
              disabled={searching}
            />
            {/* Thay thế suffix bằng nút Tìm lồng bên trong input */}
            <button type="submit" className="add-member-inside-search-btn" disabled={searching}>
              {searching ? "..." : "Tìm"}
            </button>
          </div>
        </form>

        {/* VÙNG ĐỘNG: Hiển thị kết quả tìm kiếm thực tế từ CSDL Backend */}
        <div className="add-member-result-wrapper">
          {searching && <div className="add-member-status-info">Đang truy vấn dữ liệu...</div>}
          
          {!searching && hasSearched && searchedUser && (
            <div className="add-member-user-card">
              <div className="add-member-card-left">
                <div className="add-member-user-avatar-circle">
                  {searchedUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="add-member-card-details">
                  <div className="add-member-card-name">{searchedUser.fullName}</div>
                  <div className="add-member-card-sub">
                    {searchedUser.email} {searchedUser.phone ? `| ${searchedUser.phone}` : ''}
                  </div>
                </div>
              </div>
              <button className="add-member-invite-btn-trigger" onClick={() => onConfirm(searchedUser.id)}>
                Gửi lời mời
              </button>
            </div>
          )}

          {!searching && hasSearched && !searchedUser && (
            <div className="add-member-status-error">
              ❌ Không tìm thấy thông tin thành viên này trên hệ thống!
            </div>
          )}
        </div>

        {/* Khối Nút bấm hành động */}
        <div className="add-member-action-group">
          <button type="button" className="add-member-btn-cancel" onClick={handleCloseReset}>
            Hủy bỏ
          </button>
        </div>

        {/* Khối Footer đếm số thành viên */}
        <div className="add-member-footer">
          {currentMemberCount > 0 && (
            <div className="add-member-avatar-stack">
              <div className="add-member-mini-avatar avatar-one">
                <img src="https://placehold.co/28x28" alt="member" />
              </div>
              {currentMemberCount > 1 && (
                <div className="add-member-mini-avatar avatar-two">
                  <img src="https://placehold.co/28x28" alt="member" />
                </div>
              )}
            </div>
          )}
          <span className="add-member-footer-text">
            Gia đình bạn đang có {currentMemberCount} thành viên
          </span>
        </div>

      </div>
    </div>
  );
};

export default AddMember;