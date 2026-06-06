import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import "./Topbar.css";

import iconSearch from "@/assets/icon/Icon-search.svg";
import ReceiveInviteModal from "@/pages/customer/group/ReceiveInviteModal"; 

interface TopbarProps {
  title?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  familyName?: string;
  showSearch?: boolean;
}

const Topbar: React.FC<TopbarProps> = ({
  title = "Tủ lạnh nhà tôi",
  searchPlaceholder = "Tìm kiếm",
  searchValue = "",
  onSearchChange,
  familyName,
  showSearch = true
}) => {
  const navigate = useNavigate();
  const [localFamilyName, setLocalFamilyName] = useState<string>(() => (familyName && familyName !== "Đang tải..." ? familyName : localStorage.getItem("currentFamilyName") || "Chưa có gia đình"));
  const [inviteInfo, setInviteInfo] = useState<{ isOpen: boolean; familyName: string; familyId: number | null }>({
    isOpen: false,
    familyName: "",
    familyId: null
  });

  // 🎯 THÊM CỜ HIỆU: Khóa không cho Polling chạy khi đang thực hiện xử lý nút bấm
  const isProcessingAction = useRef<boolean>(false);

  // Luồng lấy tên gia đình hiện tại
  useEffect(() => {
    if (familyName && familyName !== "Đang tải...") {
      setLocalFamilyName(familyName);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    api.get('/api/v1/users/familys/current', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
      if (response.data) {
        if (response.data.success && response.data.data && response.data.data.name) {
          setLocalFamilyName(response.data.data.name);
          localStorage.setItem("currentFamilyName", response.data.data.name);
        } else if (response.data.name) {
          setLocalFamilyName(response.data.name);
          localStorage.setItem("currentFamilyName", response.data.name);
        } else {
          setLocalFamilyName("Chưa có gia đình");
          localStorage.removeItem("currentFamilyName");
        }
      }
    })
    .catch(error => {
      console.error("Topbar tự gọi API lấy tên gia đình bị lỗi:", error);
      setLocalFamilyName("Chưa có gia đình");
      localStorage.removeItem("currentFamilyName");
    });
  }, [familyName]);

  // Luồng Polling kiểm tra lời mời ngầm
  useEffect(() => {
    const checkIncomingInvite = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token || token === "null" || token === "undefined") return;
      
      // 🎯 ĐÃ SỬA CHỐNG SẬP: Nếu đang xử lý nút bấm HOẶC modal đang mở thì NGẮT TUYỆT ĐỐI không gọi API ngầm nữa
      if (isProcessingAction.current || inviteInfo.isOpen) {
        return; 
      }

      try {
        const res = await api.get('/api/v1/users/users/check-invite', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Chỉ cập nhật state mở modal nếu thực sự không có hành động nào đang xử lý
        if (res.data && res.data.success && res.data.data && !isProcessingAction.current) {
          setInviteInfo({
            isOpen: true,
            familyName: res.data.data.familyName,
            familyId: res.data.data.familyId
          });
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          console.warn("⚠️ Token không hợp lệ hoặc đã hết hạn.");
        }
      }
    };

    checkIncomingInvite();
    const timer = setInterval(checkIncomingInvite, 5000); 
    
    return () => clearInterval(timer);
  }, [inviteInfo.isOpen]);

  const handleAcceptInvite = async () => {
    const token = localStorage.getItem("accessToken");
    if (!inviteInfo.familyId) {
      console.error("❌ [FRONTEND LỖI] Click Chấp nhận nhưng state familyId đang rỗng!");
      return;
    }

    // Khóa trạng thái Polling chạy ngầm để bảo vệ Modal đứng im khi đang xử lý
    isProcessingAction.current = true;

    console.log("%c================ 🚀 BẮT ĐẦU LUỒNG CHUYỂN GIA ĐÌNH ================", "color: #00bcd4; font-weight: bold;");
    console.log("[BƯỚC 1] Dữ liệu chuẩn bị gửi đi gửi lên Server:", { familyId: inviteInfo.familyId });

    try {
      console.log("[BƯỚC 2] Đang bắn Request POST sang đúng cổng API có 2 chữ users...");
      
      // 🎯 ĐÃ SỬA: Bảo đảm đường dẫn khớp 100% với cấu trúc Router `/users/users/`
      const res = await api.post(`/api/v1/users/users/accept-invite`, 
        { familyId: inviteInfo.familyId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log("%c[BƯỚC 3 SUCCESS] Backend xử lý đổi nhà thành công thành công!", "color: #4caf50; font-weight: bold;");
      console.log("-> Phản hồi từ Server:", res.data);

      // 🎯 BƯỚC 4: ĐỒNG BỘ LOCAL STORAGE ĐỂ SIDEBAR VÀ FAMILYGROUP ĂN THEO NHÀ MỚI
      if (inviteInfo.familyName) {
        localStorage.setItem("currentFamilyName", inviteInfo.familyName.trim());
        console.log("-> Đã cập nhật tên nhà mới lên bộ nhớ tạm:", inviteInfo.familyName.trim());
      }

      // Ép cục authUser lưu ở trình duyệt đổi hẳn sang ID nhà mới
      const authUserString = localStorage.getItem("authUser");
      if (authUserString) {
        try {
          const authUser = JSON.parse(authUserString);
          authUser.familyId = inviteInfo.familyId; // Đổi nhà cho User trong phiên làm việc hiện tại
          localStorage.setItem("authUser", JSON.stringify(authUser));
          console.log("-> Đã đồng bộ thông tin authUser cục bộ sang familyId mới:", inviteInfo.familyId);
        } catch (e) {
          console.error("❌ Lỗi cấu trúc JSON khi đồng bộ authUser:", e);
        }
      }

      // Xóa cache danh sách thành viên cũ để ép trang FamilyGroup phải tải lại mảng mới từ Server
      localStorage.removeItem("familyMembersCache");

      alert("🎉 Chúc mừng! Bạn đã gia nhập nhóm gia đình mới thành công.");
      
      // Đóng modal an toàn
      setInviteInfo({ isOpen: false, familyName: "", familyId: null });
      
      // Điều hướng sút thẳng về trang tủ lạnh và ép nạp mới toàn bộ UI
      navigate('/fridge', { replace: true });
      window.location.reload();

    } catch (err: any) {
      console.log("%c❌ [BƯỚC 3 THẤT BẠI] API trả về lỗi từ Server!", "color: #f44336; font-weight: bold;");
      console.error("-> Mã trạng thái lỗi HTTP:", err.response?.status);
      console.error("-> Chi tiết lỗi báo tử:", err.response?.data);
      
      alert(`Chuyển nhà thất bại! Server báo lỗi mã: ${err.response?.status}. Hãy kiểm tra lại log của Backend.`);
      
      // Mở lại khóa Polling để có thể bấm thử lại sau khi sửa code Backend
      isProcessingAction.current = false;
    }
    console.log("%c==================================================================", "color: #00bcd4; font-weight: bold;");
  };

  // =========================================================================
  // 🎯 LUỒNG XỬ LÝ TỪ CHỐI GIA NHẬP (BẤM DECLINE)
  // =========================================================================
  const handleDeclineInvite = async () => {
    const token = localStorage.getItem("accessToken");
    if (!inviteInfo.familyId) return;

    // 🎯 KÍCH HOẠT KHÓA
    isProcessingAction.current = true;

    try {
      await api.post(`/api/v1/users/users/decline-invite`, 
        { familyId: inviteInfo.familyId }, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Từ chối lời mời thất bại:", err);
    }

    setInviteInfo({ isOpen: false, familyName: "", familyId: null });
    
    // Mở khóa lại sau khi hoàn thành dọn dẹp state để tiếp tục nhận lời mời khác về sau
    setTimeout(() => {
      isProcessingAction.current = false;
    }, 1000);
  };

  return (
    <header className="topbar">
      <div className="topbar-title-wrapper">
        <div className="topbar-title">{title}</div>
      </div>

      <div className="topbar-actions">
        {showSearch && (
          <div className="topbar-search">
            <div className="topbar-search-input">
              <input
                type="text"
                className="topbar-search-field"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              />
            </div>

            <div className="topbar-search-icon-wrapper">
              <img src={iconSearch} alt="" className="topbar-search-icon" />
            </div>
          </div>
        )}

        <button type="button" className="topbar-notification" aria-label="Thông báo" title="Thông báo">
          {/* Bell SVG mập mạp */}
          <svg className="topbar-bell-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C11.1716 2 10.5 2.67157 10.5 3.5V4.07089C7.9145 4.55612 6 6.77185 6 9.5V14.5L4 16.5V17.5H20V16.5L18 14.5V9.5C18 6.77185 16.0855 4.55612 13.5 4.07089V3.5C13.5 2.67157 12.8284 2 12 2Z"/>
            <path d="M9.26756 18.5C9.61337 19.6411 10.7066 20.5 12 20.5C13.2934 20.5 14.3866 19.6411 14.7324 18.5H9.26756Z"/>
          </svg>
          {/* Chấm đỏ thông báo */}
          <span className="topbar-notification-dot" aria-hidden="true" />
        </button>

        <div className="topbar-family-button">
          <div>{localFamilyName}</div>
        </div>
      </div>

      <ReceiveInviteModal 
        isOpen={inviteInfo.isOpen}
        familyName={inviteInfo.familyName}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />
    </header>
  );
};

export default Topbar;
