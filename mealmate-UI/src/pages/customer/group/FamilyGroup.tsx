import React, { useState, useEffect } from 'react';
// 🎯 GIỮ NGUYÊN: Sử dụng instance axios cấu hình chung của hệ thống
import api from "@/services/api";
import './FamilyGroup.css';

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import DeleteMember from "./DeleteMember"; 
import AddMember from "./AddMember"; 
// 🎯 BƯỚC NHÚNG GỐC: Gọi chính xác file ProfileModal của bạn vào trang cha
import ProfileModal from "@/components/layout/ProfileModal"; 

import iconEdit from "@/assets/icon/Icon-edit-eye.svg";  
import iconDelete from "@/assets/icon/Icon-delete.svg";

interface MemberType {
  id: number;
  fullName: string;
  roleName: string; 
  avatarClass: string; 
  email?: string;
  phone?: string;
  gender?: string;
  avatarUrl?: string;
}

const FamilyGroup: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [familyName, setFamilyName] = useState<string>("Đang tải...");
  
  const [familyId, setFamilyId] = useState<number | null>(null);
  const [isHousekeeper, setIsHousekeeper] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("Đang tải...");
  const [members, setMembers] = useState<MemberType[]>([]);
  const [loggedUserId, setLoggedUserId] = useState<number | null>(null);

  // State kiểm soát modal Xóa thành viên
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  // State kiểm soát modal Thêm thành viên
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const avatarColors = ["avatar-orange", "avatar-peach", "avatar-teal", "avatar-blue", "avatar-purple"];

  
  // =========================================================================
  // 🎯 LUỒNG QUẢN LÝ PROFILE MODAL CHUẨN CỦA BẠN
  // =========================================================================
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileTargetMember, setProfileTargetMember] = useState<MemberType | null>(null);
  
  useEffect(() => {
    const loadFamilyData = async () => {
      const token = localStorage.getItem("accessToken");
      const authUserString = localStorage.getItem("authUser");
      
      let currentUserId: number | null = null;

      if (authUserString) {
        try {
          const parsedUser = JSON.parse(authUserString);
          const rawId = parsedUser.userId || parsedUser.id;
          if (rawId) {
            currentUserId = Number(rawId);
            setLoggedUserId(currentUserId);
          }
          console.log("👉 [FRONTEND DEBUG] ID người dùng đăng nhập từ LocalStorage:", currentUserId);
        } catch (e) {
          console.error("❌ [FRONTEND DEBUG] Lỗi đọc localStorage:", e);
        }
      }

      let dbHousekeeperId: number | null = null;

      // =========================================================================
      // LUỒNG A: LẤY CHI TIẾT NHÓM GIA ĐÌNH HIỆN TẠI
      // =========================================================================
      try {
        const resGroup = await api.get('/api/v1/users/familys/current', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const groupData = resGroup.data.success ? resGroup.data.data : resGroup.data;
        
        if (groupData) {
          const cleanName = String(groupData.name || "Gia đình Fiza").trim();
          const familyIdFromDb = groupData.id;
          
          setFamilyName(cleanName);
          setEditName(cleanName);
          localStorage.setItem("currentFamilyName", cleanName); // Đồng bộ tên gia đình lên local storage
          familyIdFromDb && setFamilyId(familyIdFromDb);

          dbHousekeeperId = groupData.housekeeperId || groupData.ownerId || groupData.createdBy || (groupData.housekeeper && groupData.housekeeper.id);

          if (currentUserId && dbHousekeeperId && Number(currentUserId) === Number(dbHousekeeperId)) {
            setIsHousekeeper(true);
          } else {
            setIsHousekeeper(false);
          }
        }
      } catch (err) {
        console.error("❌ [FRONTEND DEBUG] Lỗi API luồng A (Chi tiết nhóm):", err);
        setFamilyName("Gia đình Fiza");
        setEditName("Gia đình Fiza");
      }

      // =========================================================================
      // LUỒNG B: TẢI DANH SÁCH THÀNH VIÊN HIỂN THỊ LÊN BẢNG (Đầy đủ thông tin)
      // =========================================================================
      try {
        console.log("👉 [FRONTEND DEBUG 1] Chuẩn bị gửi request lấy danh sách thành viên lên bảng...");
        
        const resMembers = await api.get('/api/v1/users/users/family/members', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("👉 [FRONTEND DEBUG 2] Dữ liệu thô (Raw Response) Server trả về:", resMembers.data);
        
        const dbMembers = resMembers.data.success ? resMembers.data.data : resMembers.data;
        console.log("👉 [FRONTEND DEBUG 3] Mảng dữ liệu sau khi bóc vỏ (.data):", dbMembers);

        if (Array.isArray(dbMembers)) {
          console.log(`👉 [FRONTEND DEBUG 4] Xác nhận dữ liệu là một mảng gồm ${dbMembers.length} thành viên. Tiến hành format dữ liệu...`);
          
          const formattedMembers = dbMembers.map((m: any, index: number) => {
            const roleNameFromDb = m.roleName || (m.role && typeof m.role === 'object' ? m.role.name : m.role);
            
            const isOwner = String(roleNameFromDb).toUpperCase().includes("ADMIN") || 
                            String(roleNameFromDb).toUpperCase().includes("HOUSEKEEPER") || 
                            String(roleNameFromDb).toUpperCase().includes("BOSS") ||
                            String(roleNameFromDb).toUpperCase().includes("CHỦ NHÀ") ||
                            (dbHousekeeperId && Number(m.id) === Number(dbHousekeeperId));

            return {
              id: m.id,
              fullName: m.fullName || m.full_name || "Thành viên ẩn danh",
              roleName: isOwner ? "Chủ nhà" : "Thành viên",
              avatarClass: avatarColors[index % avatarColors.length],
              email: m.email || "Chưa cập nhật",
              phone: m.phone || m.phoneNumber || "Chưa cập nhật",
              gender: m.gender || "OTHER",
              avatarUrl: m.avatarUrl || m.avatar_url   
            };
          });
          
          console.log("👉 [FRONTEND DEBUG 5] Cấu trúc mảng hoàn chỉnh chuẩn bị set vào State render lên UI:", formattedMembers);
          setMembers(formattedMembers);
          
          // Lưu lại bản sao đồng bộ xịn sò nhất vào bộ nhớ đệm
          localStorage.setItem("familyMembersCache", JSON.stringify(formattedMembers));
        } else {
          console.warn("⚠️ [FRONTEND DEBUG CẢNH BÁO] Kết quả Server trả về không phải là một Mảng (Array)!");
        }
      } catch (err) {
        console.error("❌ [FRONTEND DEBUG LỖI] API luồng B tải danh sách thành viên thất bại hoàn toàn:", err);
      }
    };

    loadFamilyData();
  }, []);

  const handleUpdateName = () => {
    const cleanedName = editName.trim();
    if (!familyId || !cleanedName || cleanedName === familyName.trim()) {
      setEditName(familyName);
      return;
    }

    const token = localStorage.getItem("accessToken");
    api.put(`/api/v1/users/familys/${familyId}`, 
      { id: familyId, name: cleanedName },
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    .then(() => {
      setFamilyName(cleanedName);
      setEditName(cleanedName);
      localStorage.setItem("currentFamilyName", cleanedName); // Cập nhật tên gia đình đổi mới
      alert("🎉 Đã cập nhật tên nhóm thành công!");
    })
    .catch(error => {
      alert(`Backend từ chối lưu! Lỗi HTTP: ${error.response?.status}`);
      setEditName(familyName);
    });
  };

  const handleSearchUser = async (emailOrPhone: string) => {
    const token = localStorage.getItem("accessToken");
    console.log("🔍 [SEARCH DEBUG 1] Bắt đầu kích hoạt tìm kiếm với từ khóa:", emailOrPhone);
    
    try {
      const res = await api.get(`/api/v1/users/users/search-member?keyword=${emailOrPhone}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log("🔍 [SEARCH DEBUG 2] Phản hồi thô nhận từ Server:", res.data);
      
      if (res.data && (res.data.success || res.data.status === true)) {
        console.log("🔍 [SEARCH DEBUG 3] Bóc tách dữ liệu thành công, Object User hợp lệ:", res.data.data);
        return res.data.data; 
      }
      
      console.warn("⚠️ [SEARCH DEBUG CẢNH BÁO] Server trả về thành công giả (success=false):", res.data.message);
      return null;
    } catch (err: any) {
      console.error("❌ [SEARCH DEBUG LỖI] API luồng C tìm kiếm thành viên sập hoàn toàn:", err);
      return null;
    }
  };

  const handleAddMemberConfirm = async (userId: number) => {
    const token = localStorage.getItem("accessToken");
    if (!familyId) return;

    try {
      const res = await api.post(`/api/v1/users/familys/${familyId}/invite`, 
        { userId: userId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.data && res.data.success) {
        alert("🎉 Đã gửi yêu cầu mời thành viên vào hệ thống thành công!");
        setIsAddModalOpen(false);
      }
    } catch (err) {
      console.error("Lỗi gửi lời mời:", err);
    }
  };

  const filteredMembers = [...members]
    .filter(member => member.fullName.toLowerCase().includes(keyword.toLowerCase()))
    .sort((a, b) => a.id - b.id);

  const handleDeleteMemberConfirm = async () => {
    if (!selectedMemberId) return;
    
    const token = localStorage.getItem("accessToken");
    try {
      console.log(`👉 [REMOVE DEBUG] Đang gửi lệnh trục xuất thành viên ID: #${selectedMemberId}`);
      
      const res = await api.post('/api/v1/users/users/remove-member', 
        { userId: selectedMemberId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (res.data && res.data.success) {
        alert("🎉 Đã trục xuất thành viên và trả về làm chủ nhà gốc thành công!");
        setIsModalOpen(false);
        
        // 🎯 LOGIC TỰ ĐỘNG LOAD CHO CHÍNH MÌNH:
        // Nếu người bị rời nhóm TRÙNG với ID của người đang đăng nhập -> Ép hệ thống reload dọn bối cảnh cũ
        if (Number(selectedMemberId) === Number(loggedUserId)) {
          console.log("👉 [RELOAD DEBUG] Chính mình rời nhóm, tiến hành dọn cache và làm mới hệ thống...");
          
          // Xóa tên gia đình cũ lưu trong bộ nhớ trình duyệt để luồng kế tiếp tự nạp lại tên nhà gốc
          localStorage.removeItem("currentFamilyName");
          localStorage.removeItem("familyMembersCache");
          
          // Tự động load lại trang ngay lập tức cho bạn, không bắt người dùng tự tay bấm F5 nữa
          window.location.reload();
        } else {
          // Nếu là chủ nhà xóa thành viên khác -> Chỉ cần lọc mảng xóa dòng đó trên UI như cũ là xong
          const updatedList = members.filter(m => Number(m.id) !== Number(selectedMemberId));
          setMembers([...updatedList]);
          localStorage.setItem("familyMembersCache", JSON.stringify(updatedList));
        }
        
      }
    } catch (err: any) {
      console.error("❌ Lỗi gọi API remove-member:", err);
      alert("Hệ thống từ chối xử lý hoặc lỗi kết nối mạng!");
    }
  };
  return (
    <div className="my-fridge-layout">
      <Sidebar />
      <div className="my-fridge-page">
        <Topbar 
          title="Nhóm gia đình" 
          searchPlaceholder="Tìm kiếm thành viên..."
          searchValue={keyword}
          onSearchChange={(value) => setKeyword(value)}
          familyName={familyName} 
        />

        <div className="family-group-main-wrapper">
          <div className="info-bar">
            <div className="info-bar-left">
              <div className="info-item-flex">
                <div className="info-label-box-wide">
                  <div className="info-label">TÊN NHÓM:</div>
                </div>
                
                <div className="info-value-name-box">
                  <input
                    type="text"
                    className="info-value-name-input-blank"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={!isHousekeeper} 
                    onBlur={handleUpdateName} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateName(); 
                    }}
                    style={{
                      border: 'none', background: 'transparent', fontFamily: 'inherit',
                      fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit',
                      width: '100%', outline: 'none', cursor: isHousekeeper ? 'text' : 'not-allowed',
                      pointerEvents: 'auto'
                    }}
                  />
                </div>
              </div>
              
              <div className="info-item-flex">
                <div className="info-label-box">
                  <div className="info-label">MÃ NHÓM:</div>
                </div>
                <div className="info-value-code-box">
                  <div className="info-value-code-text" style={{ userSelect: 'all', fontWeight: 'bold' }}>
                    {familyId ? `FZ-${String(familyId).padStart(2, '0')}` : "Đang tải..."}
                  </div>
                </div>
              </div>
            </div>
            
            <button className="btn-add-member" onClick={() => setIsAddModalOpen(true)}>
              <div className="btn-shadow" />
              <div className="btn-text">Thêm thành viên</div>
            </button>
          </div>

          <div className="table-wrapper">
            <div className="table-card">
              <div className="table-content">
                <div className="table-header-row">
                  <div className="th-id"><div className="th-text">MÃ ID</div></div>
                  <div className="th-member"><div className="th-text">THÀNH VIÊN</div></div>
                  <div className="th-role"><div className="th-text">VAI TRÒ</div></div>
                  <div className="th-action"><div className="th-text-right">HÀNH ĐỘNG</div></div>
                </div>

                <div className="table-body">
                  {filteredMembers.map((member, index) => {
                    const showDeleteButton = isHousekeeper 
                      ? member.id !== loggedUserId 
                      : member.id === loggedUserId;

                    return (
                      <div className={index === 0 ? "table-row" : "table-row-bordered"} key={member.id}>
                        <div className="td-id"><div className="td-id-text">#{member.id}</div></div>
                        <div className="td-member-info">
                          <div className={`avatar-wrapper ${member.avatarClass}`}>
                            <span className="avatar-text-placeholder">{member.fullName.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="member-name-box"><div className="member-name">{member.fullName}</div></div>
                        </div>
                        <div className="td-role">
                          <div className={member.roleName === "Chủ nhà" ? "role-badge-admin" : "role-badge-member"}>
                            <div className={member.roleName === "Chủ nhà" ? "role-text-admin" : "role-text-member"}>{member.roleName}</div>
                          </div>
                        </div>
                        <div className="td-actions">
                          <button 
                            className="action-btn-circle" 
                            title="Xem chi tiết"
                            onClick={() => {
                              console.log("👁️ [PROFILE DEBUG 1] Bấm xem chi tiết thành viên dòng:", member);
                              console.log(`👁️ [PROFILE DEBUG 2] Đối chiếu ID dòng (${member.id}) với ID đăng nhập đăng ký ở Local (${loggedUserId})`);
                              setProfileTargetMember(member);
                              setIsProfileModalOpen(true);
                            }}
                          >
                            <img src={iconEdit} alt="Xem" className="action-icon-img" />
                          </button>
                          
                          {showDeleteButton && (
                            <button 
                              className="action-btn-circle btn-delete" 
                              onClick={() => {
                                setSelectedMemberName(member.id === loggedUserId ? "bản thân" : member.fullName);
                                setSelectedMemberId(member.id);
                                setIsModalOpen(true);
                              }}
                              title={member.id === loggedUserId ? "Rời khỏi nhóm" : "Xóa khỏi nhóm"}
                            >
                              <img src={iconDelete} alt="Xóa" className="action-icon-img" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteMember
        isOpen={isModalOpen}
        memberName={selectedMemberName}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDeleteMemberConfirm}
      />

      <AddMember
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddMemberConfirm}
        onSearchUser={handleSearchUser}
        currentMemberCount={members.length}
      />

      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        familyName={familyName}
        memberData={profileTargetMember}
        isMe={profileTargetMember?.id === loggedUserId}
      />
    </div>
  );
};

export default FamilyGroup;