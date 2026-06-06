import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UtensilsCrossed, 
  BookOpen, 
  Bell, 
  Settings, 
  Search, 
  Plus, 
  Eye, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Leaf,
  BarChart3,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import SharedModal from '../../components/admin/Modal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AUTH_ROLES, getRoleId, getRoleLabel } from '../../features/auth/role';


interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  avatarUrl?: string;
  emailVerified?: boolean;
  role?: Role;
  roleName?: string;
}

const ROLE_FILTER_ALL = 'ALL';
const ROLE_OPTIONS = [
  { value: AUTH_ROLES.ADMIN, label: getRoleLabel(AUTH_ROLES.ADMIN) },
  { value: AUTH_ROLES.HOUSEKEEPER, label: getRoleLabel(AUTH_ROLES.HOUSEKEEPER) },
  { value: AUTH_ROLES.CUSTOMER, label: getRoleLabel(AUTH_ROLES.CUSTOMER) },
];

const readUsersResponse = (payload: any): User[] => {
  const users = payload?.success ? payload.data : payload;
  if (!Array.isArray(users)) return [];

  return users
    .filter((user) => user && typeof user === 'object')
    .map((user) => {
      const rawRole = user.role ?? user.roleName;
      const role = typeof rawRole === 'string' ? { id: getRoleId(rawRole), name: rawRole } : rawRole;

      return {
        ...user,
        id: Number(user.id ?? 0),
        fullName: String(user.fullName ?? user.full_name ?? ''),
        email: String(user.email ?? ''),
        role,
        roleName: typeof rawRole === 'string' ? rawRole : rawRole?.name,
      };
    });
};

const UserManagement: React.FC = () => {
  const { logout } = useAuth();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(ROLE_FILTER_ALL);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get('/api/v1/users/users');
      setUsers(readUsersResponse(response.data));
    } catch (err) {
      console.error(err);
      setErrorMessage('Không tải được danh sách người dùng từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter Logic
  const filteredUsers = users.filter(user => {
    const roleName = user.role?.name ?? user.roleName;
    const matchesSearch = (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(user.id ?? '').includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === ROLE_FILTER_ALL || roleName === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination Logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/v1/users/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      alert('Không thể xóa người dùng. Hãy chắc chắn rằng tài khoản này không bị ràng buộc dữ liệu khác.');
    }
  };

  const handleEditClick = (user: User) => {
    setViewUser(user);
    setEditData({ ...user });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (editData) {
      try {
        const payload = {
          fullName: editData.fullName,
          email: editData.email,
          phone: editData.phone,
          gender: editData.gender,
          role: editData.role
        };
        const response = await api.put(`/api/v1/users/users/${editData.id}`, payload);
        if (response.data?.success) {
          const updatedUser = response.data.data;
          setUsers(users.map(u => u.id === editData.id ? updatedUser : u));
          setViewUser(updatedUser);
          setIsEditing(false);
        }
      } catch (err) {
        console.error(err);
        alert('Cập nhật thông tin thất bại.');
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const roleName = formData.get('role') as string;
    
    const newUser = {
      fullName: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      gender: formData.get('gender') as string,
      passwordHash: 'dummy_hash', // Mật khẩu tạm thời cho admin tạo
      role: {
        id: getRoleId(roleName),
        name: roleName
      }
    };

    try {
      const response = await api.post('/api/v1/users/users', newUser);
      if (response.data?.success) {
        setUsers([response.data.data, ...users]);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="um-layout">
      {/* Sidebar - Consistent with RecipeManagement */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="um-main unshifted">
        <header className="um-header">
          <div className="um-header-left">
            <h1 className="um-title">Quản lý người dùng</h1>
            <p className="um-subtitle">Quản trị danh sách tài khoản toàn hệ thống</p>
          </div>
          <div className="um-header-right">
            <HeaderBtn icon={<Bell size={20} />} hasBadge />
            <HeaderBtn icon={<Settings size={20} />} />
          </div>
        </header>

        <div className="um-main-container">
          <main className="um-content">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="um-card">
              {/* Toolbar Section */}
              <div className="um-toolbar-sticky">
                <div className="um-toolbar-controls">
                  <div className="um-search-container">
                    <Search className="um-search-icon" size={18} />
                    <input 
                      className="um-search-input" 
                      placeholder="Tìm kiếm theo tên, email..." 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to page 1 on search
                      }}
                    />
                  </div>
                  <div className="um-role-badge" style={{ padding: '0.5rem 1.25rem', flexShrink: 0 }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', marginRight: '0.5rem', whiteSpace: 'nowrap' }}>Vai trò:</span>
                    <select 
                      style={{ background: 'transparent', border: 'none', color: 'var(--fiza-primary)', fontWeight: 700, fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                      value={roleFilter}
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1); // Reset to page 1 on filter
                      }}
                    >
                      <option value={ROLE_FILTER_ALL}>Tất cả</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button className="um-btn-primary" style={{ flexShrink: 0 }} onClick={() => setShowAddModal(true)}>
                  <Plus size={20} />
                  Thêm người dùng
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="um-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ID</th>
                      <th>Họ tên</th>
                      <th>Số điện thoại</th>
                      <th>Email</th>
                      <th style={{ textAlign: 'center' }}>Vai trò</th>
                      <th style={{ textAlign: 'center', width: '120px' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map(user => (
                      <tr key={user.id}>
                        <td style={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.875rem' }}>{user.id}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden' }}>
                              <img 
                                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} 
                                alt="" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>{user.fullName}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.875rem', color: '#64748b' }}>{user.phone || 'N/A'}</td>
                        <td style={{ fontSize: '0.875rem', color: '#64748b' }}>{user.email}</td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="um-role-badge">
                              {getRoleLabel(user.role ?? user.roleName)}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <ActionBtn 
                              icon={<Eye size={18} />} 
                              hoverColor="var(--fiza-primary)" 
                              onClick={() => handleEditClick(user)}
                            />
                            <ActionBtn 
                              icon={<Trash2 size={18} />} 
                              hoverColor="#ef4444" 
                              onClick={() => setDeleteConfirm(user.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                          Không tìm thấy người dùng phù hợp
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} trên {totalItems} người dùng
                </p>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <PageArrow 
                    icon={<ChevronLeft size={18} />} 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  />
                  {[...Array(totalPages)].map((_, i) => (
                    <PageNum 
                      key={i + 1} 
                      active={currentPage === i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </PageNum>
                  ))}
                  <PageArrow 
                    icon={<ChevronRight size={18} />} 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  />
                </div>
              </div>
            </motion.div>
          </main>
        </div>

        {/* MODALS */}
        <AnimatePresence mode="wait">
          {showAddModal && (
            <SharedModal title="Thêm người dùng mới" onClose={() => setShowAddModal(false)}>
              <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <FormGroup label="Họ tên" name="name" placeholder="VD: Nguyễn Văn A" required />
                  <FormGroup label="Số điện thoại" name="phone" placeholder="090..." required />
                  <FormGroup label="Email" name="email" type="email" placeholder="email@example.com" required />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Vai trò</label>
                    <select name="role" className="um-search-input" style={{ paddingLeft: '1rem' }}>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Giới tính</label>
                    <select name="gender" className="um-search-input" style={{ paddingLeft: '1rem' }}>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Ảnh đại diện</label>
                    <input type="file" name="avatar" className="um-search-input" style={{ paddingLeft: '1rem', paddingTop: '0.5rem' }} accept="image/*" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                  <button type="submit" className="um-btn-primary">Lưu người dùng</button>
                </div>
              </form>
            </SharedModal>
          )}

          {viewUser && editData && (
            <SharedModal title={isEditing ? "Chỉnh sửa người dùng" : "Chi tiết người dùng"} onClose={() => { setViewUser(null); setIsEditing(false); }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '24px', overflow: 'hidden', backgroundColor: '#F1FAF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={viewUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewUser.fullName}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <DetailItem label="Mã người dùng" value={viewUser.id} readOnly />
                  {isEditing ? (
                    <>
                      <FormGroup 
                        label="Họ tên" 
                        value={editData.fullName} 
                        onChange={(e: any) => setEditData({ ...editData, fullName: e.target.value })} 
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Vai trò</label>
                        <select 
                          className="um-search-input" 
                          style={{ paddingLeft: '1rem' }}
                          value={editData.role?.name}
                          onChange={(e) => setEditData({ 
                            ...editData, 
                            role: { id: getRoleId(e.target.value), name: e.target.value }
                          })}
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Giới tính</label>
                        <select 
                          className="um-search-input" 
                          style={{ paddingLeft: '1rem' }}
                          value={editData.gender}
                          onChange={(e) => setEditData({ ...editData, gender: e.target.value as any })}
                        >
                          <option value="MALE">Nam</option>
                          <option value="FEMALE">Nữ</option>
                          <option value="OTHER">Khác</option>
                        </select>
                      </div>
                      <FormGroup 
                        label="Số điện thoại" 
                        value={editData.phone} 
                        onChange={(e: any) => setEditData({ ...editData, phone: e.target.value })} 
                      />
                      <FormGroup 
                        label="Email" 
                        value={editData.email} 
                        onChange={(e: any) => setEditData({ ...editData, email: e.target.value })} 
                      />
                    </>
                  ) : (
                    <>
                      <DetailItem label="Họ tên" value={viewUser.fullName} />
                      <DetailItem label="Vai trò" value={getRoleLabel(viewUser.role ?? viewUser.roleName)} isBadge />
                      <DetailItem label="Giới tính" value={viewUser.gender === 'MALE' ? 'Nam' : viewUser.gender === 'FEMALE' ? 'Nữ' : 'Khác'} />
                      <DetailItem label="Số điện thoại" value={viewUser.phone} />
                      <DetailItem label="Email" value={viewUser.email} />
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(false)} 
                      style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={handleSaveEdit} 
                      className="um-btn-primary"
                    >
                      Lưu thay đổi
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="um-btn-primary"
                  >
                    Chỉnh sửa thông tin
                  </button>
                )}
              </div>
            </SharedModal>
          )}

          {deleteConfirm && (
            <SharedModal title="Xác nhận xóa" onClose={() => setDeleteConfirm(null)} width="400px">
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <Trash2 size={32} />
                </div>
                <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>Bạn có chắc chắn muốn xóa?</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}>Hành động này không thể hoàn tác.</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                  <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', background: '#EF4444', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Xóa ngay</button>
                </div>
              </div>
            </SharedModal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Sidebar Helpers ---
function FormGroup({ label, ...props }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{label}</label>
      <input {...props} className="um-search-input" style={{ paddingLeft: '1rem' }} />
    </div>
  );
}

function DetailItem({ label, value, isBadge }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</span>
      {isBadge ? (
        <span className="um-role-badge" style={{ alignSelf: 'flex-start' }}>{value}</span>
      ) : (
        <span style={{ fontWeight: 600, color: '#1e293b' }}>{value || 'N/A'}</span>
      )}
    </div>
  );
}

function SidebarLink({ icon, label, to, isExpanded, active, onClick }: any) {
  return (
    <NavLink 
      to={to} 
      onClick={onClick}
      className={`um-nav-item ${active ? 'active' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}
    >

      <div className="um-nav-icon">
        {icon}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -10 }}
            className="um-nav-label"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );
}

function HeaderBtn({ icon, hasBadge }: any) {
  return (
    <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'box-shadow 0.2s' }}>
      {icon}
      {hasBadge && <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #F0F4F2' }} />}
    </button>
  );
}

function ActionBtn({ icon, hoverColor, onClick }: any) {
  const [hover, setHover] = useState(false);
  return (
    <button 
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: hover ? hoverColor : '#94a3b8', backgroundColor: hover ? 'white' : 'transparent', boxShadow: hover ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none' }}
    >
      {icon}
    </button>
  );
}

function PageNum({ children, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: active ? 'var(--mint-green)' : 'transparent', color: active ? 'white' : '#475569', boxShadow: active ? '0 10px 15px -3px rgba(109, 212, 180, 0.3)' : 'none' }}>
      {children}
    </button>
  );
}

function PageArrow({ icon, disabled, onClick }: any) {
  return (
    <button 
      disabled={disabled} 
      onClick={onClick}
      style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', color: '#94a3b8', opacity: disabled ? 0.3 : 1 }}>
      {icon}
    </button>
  );
}

export default UserManagement;
