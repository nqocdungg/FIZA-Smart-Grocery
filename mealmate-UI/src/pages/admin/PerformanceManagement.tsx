import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UtensilsCrossed, 
  BookOpen, 
  Settings, 
  Leaf,
  Search,
  Plus,
  Trash2,
  X,
  ChevronRight,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import NotificationPanel from '../../components/common/NotificationPanel';
import { useAuth } from '../../context/AuthContext';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Modal from '../../components/admin/Modal';
import api from '../../services/api';

export interface UnidentifiedItem {
  id: number; 
  type: 'meat' | 'ingredient';
  familyId?: number;
  foodId?: number;
  generalName: string;
  actualName: string;
  quantity?: number;
  storageLocation?: string;
  specificLocation?: string;
  addedDate?: string;
  expiryDate?: string;
  status?: string;
  imageUrl?: string;
  note: string;
  removedReason?: string;
  removedReasonNote?: string;
  removedAt?: string;
  removedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  submittedBy: string;
  submittedAt: string;
}

const COLORS = ['#6DD4B4', '#F99F1B', '#FF7E7E', '#64748b', '#0EA5E9', '#A855F7', '#EC4899', '#F59E0B'];

const PerformanceManagement: React.FC = () => {
  const { logout } = useAuth();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [foods, setFoods] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalFamilies: 0,
    totalFoods: 0,
    totalRecipes: 0,
    foodStats: [],
    userActivity: []
  });
  
  const [unidentifiedItems, setUnidentifiedItems] = useState<UnidentifiedItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [uiSearchQuery, setUiSearchQuery] = useState('');
  const [inlineAdding, setInlineAdding] = useState<number | null>(null);
  const [inlineValue, setInlineValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [step, setStep] = useState(2); 
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newVariants, setNewVariants] = useState<string>('');
  const [itemSearch, setItemSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [approvingItem, setApprovingItem] = useState<UnidentifiedItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null); 
  const [viewingItem, setViewingItem] = useState<UnidentifiedItem | null>(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [selectedLinkFood, setSelectedLinkFood] = useState<any | null>(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  
  // Fields for approval modal
  const [approveName, setApproveName] = useState('');
  const [approveCategory, setApproveCategory] = useState<number>(1);
  const [approveUnit, setApproveUnit] = useState('kg');
  const [approveSynonyms, setApproveSynonyms] = useState('');

  const translateStorageLocation = (loc: string) => {
    if (!loc) return '—';
    switch (loc.toUpperCase()) {
      case 'COOL': return 'Ngăn mát';
      case 'FREEZER': return 'Ngăn đông';
      case 'DRY': return 'Tủ đồ khô';
      default: return loc;
    }
  };

  const translateSpecificLocation = (loc: string) => {
    if (!loc) return '—';
    switch (loc.toUpperCase()) {
      case 'VEGETABLE_DRAWER': return 'Ngăn hộc rau củ';
      case 'DOOR_SHELF': return 'Cánh cửa tủ lạnh';
      case 'TOP_SHELF': return 'Kệ ngăn trên cùng';
      case 'MIDDLE_SHELF': return 'Kệ ngăn giữa';
      case 'BOTTOM_SHELF': return 'Kệ ngăn dưới';
      default: return loc.replace(/_/g, ' ');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/v1/admin/stats');
      if (response.data?.success) {
        setStats(response.data.data);
      } else {
        setStats(response.data || {});
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err);
    }
  };

  const fetchUnidentifiedItems = async () => {
    try {
      const response = await api.get('/api/v1/admin/unidentified-items');
      const data = response.data?.data || response.data || [];
      setUnidentifiedItems(data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách định danh từ DB:', err?.response?.data || err?.message || err);
      setUnidentifiedItems([]);
    }
  };

  const fetchFoods = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/foods');
      const data = response.data?.data || response.data || [];
      setFoods(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách thực phẩm:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchFoods();
    fetchCategories();
    fetchUnidentifiedItems(); 
  }, []);

  const handleAddInlineVariant = async (foodId: number) => {
    if (!inlineValue.trim()) return;

    const food = foods.find(f => f.id === foodId);
    if (!food) return;

    const currentVariants = food.synonyms ? food.synonyms.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [];
    if (!currentVariants.includes(inlineValue.trim())) {
      const updatedVariants = [...currentVariants, inlineValue.trim()].join(',');
      try {
        const payload = {
          name: food.name,
          categoryId: food.categoryId,
          unit: food.unit,
          imageUrl: food.imageUrl,
          synonyms: updatedVariants
        };
        await api.put(`/api/foods/${foodId}`, payload);
        setInlineValue('');
        setInlineAdding(null);
        fetchFoods();
      } catch (err) {
        console.error(err);
        alert('Lỗi khi thêm tên gọi khác.');
      }
    }
  };

  const handleRemoveVariant = async (foodId: number, index: number) => {
    const food = foods.find(f => f.id === foodId);
    if (!food) return;

    const currentVariants = food.synonyms ? food.synonyms.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [];
    const updatedVariants = currentVariants.filter((_: string, i: number) => i !== index).join(',');
    try {
      const payload = {
        name: food.name,
        categoryId: food.categoryId,
        unit: food.unit,
        imageUrl: food.imageUrl,
        synonyms: updatedVariants
      };
      await api.put(`/api/foods/${foodId}`, payload);
      fetchFoods();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa tên gọi khác.');
    }
  };

  const handleFinalAdd = async () => {
    if (!selectedItem) return;
    const variantsList = newVariants.split(',').map(v => v.trim()).filter(v => v !== '');
    const currentVariants = selectedItem.synonyms ? selectedItem.synonyms.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [];
    const combined = Array.from(new Set([...currentVariants, ...variantsList])).join(',');
    
    try {
      const payload = {
        name: selectedItem.name,
        categoryId: selectedItem.categoryId,
        unit: selectedItem.unit,
        imageUrl: selectedItem.imageUrl,
        synonyms: combined
      };
      await api.put(`/api/foods/${selectedItem.id}`, payload);
      fetchFoods();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert('Không thể lưu tên gọi địa phương.');
    }
  };

  const handleDeleteSynonymMapping = async (foodId: number) => {
    const food = foods.find(f => f.id === foodId);
    if (!food) return;
    try {
      const payload = {
        name: food.name,
        categoryId: food.categoryId,
        unit: food.unit,
        imageUrl: food.imageUrl,
        synonyms: ''
      };
      await api.put(`/api/foods/${foodId}`, payload);
      fetchFoods();
    } catch (err) {
      console.error(err);
      alert('Không thể xóa tên gọi địa phương.');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setStep(2);
    setSelectedItem(null);
    setNewVariants('');
    setItemSearch('');
  };

  // 🎯 SỬA CHÍNH XÁC LOGIC MAP TỪ GENERALNAME SANG DROPDOWN VÀ HIỂN THỊ TỪ ĐỒNG NGHĨA
  const handleOpenApproveModal = (item: UnidentifiedItem) => {
    setApprovingItem(item);
    
    const actualName = item.actualName || (item as any).actualname || '';
    const generalName = item.generalName || (item as any).generalname || '';
    
    setApproveName(actualName);
    
    // Tìm ID danh mục trong mảng categories khớp với chuỗi tiếng Việt lấy lên từ DB
    const matchedCategory = categories.find(
      cat => cat.name?.toLowerCase() === generalName.toLowerCase()
    );
    // Nếu tìm thấy thì tự chọn danh mục đó, nếu không thì fallback về giá trị mặc định đầu tiên
    setApproveCategory(matchedCategory ? matchedCategory.id : (categories[0]?.id || 1));
    
    setApproveUnit('kg');
    // Từ đồng nghĩa ban đầu mặc định gợi ý chính là tên người dùng gõ vào
    setApproveSynonyms(actualName);
  };

  const handleSaveApproval = async () => {
    if (!approvingItem) return;
    try {
      const payload = {
        name: approveName,
        categoryId: approveCategory,
        unit: approveUnit,
        synonyms: approveSynonyms,
        imageUrl: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500'
      };
      
      await api.post('/api/foods', payload);
      await api.delete(`/api/v1/admin/unidentified-items/${approvingItem.id}`);
      
      alert(`Đã duyệt thực phẩm "${approveName}" vào hệ thống.`);
      setApprovingItem(null);
      fetchUnidentifiedItems();
      fetchFoods();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('Duyệt thực phẩm thất bại.');
    }
  };

  const handleConfirmDeleteQueue = async (id: number) => {
    try {
      await api.delete(`/api/v1/admin/unidentified-items/${Number(id)}`);
      setConfirmDeleteId(null);
      fetchUnidentifiedItems();
    } catch (err) {
      console.error('Xóa hàng chờ lỗi:', err);
      alert('Không thể xóa mục hàng chờ này.');
    }
  };

  const handleSaveSynonymMapping = async () => {
    if (!viewingItem || !selectedLinkFood) return;
    try {
      const food = selectedLinkFood;
      const viewingActualName = viewingItem.actualName || (viewingItem as any).actualname || '';
      const currentVariants = food.synonyms ? food.synonyms.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [];
      if (!currentVariants.includes(viewingActualName.trim())) {
        const updatedVariants = [...currentVariants, viewingActualName.trim()].join(', ');
        const payload = {
          name: food.name,
          categoryId: food.categoryId || food.category?.id || 1,
          unit: food.unit,
          imageUrl: food.imageUrl || '',
          synonyms: updatedVariants
        };
        await api.put(`/api/foods/${food.id}`, payload);
        await api.delete(`/api/v1/admin/unidentified-items/${viewingItem.id}`);
        alert(`Đã liên kết thành công! Đã thêm "${viewingActualName}" làm từ đồng nghĩa của "${food.name}".`);
      } else {
        alert(`"${viewingActualName}" đã tồn tại trong từ đồng nghĩa của "${food.name}".`);
      }
      setViewingItem(null);
      setIsLinkingMode(false);
      fetchUnidentifiedItems();
      fetchFoods();
    } catch (err) {
      console.error(err);
      alert('Liên kết từ đồng nghĩa thất bại.');
    }
  };

  const foodSynonyms = foods.filter(f => f.synonyms && (f.synonyms as string).trim().length > 0).map(f => ({
    id: f.id,
    originalName: f.name,
    type: 'food',
    variants: (f.synonyms as string).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
  }));

  const filteredSynonyms = foodSynonyms.filter(s => 
    s.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.variants.some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const itemsToSelect = foods.filter(f => 
    (!f.synonyms || f.synonyms.trim().length === 0) &&
    f.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="um-layout">
      <AdminSidebar />

      <div className="um-main unshifted">
        <header className="um-header">
          <div className="um-header-left">
            <h1 className="um-title">Quản lý hiệu suất</h1>
          </div>
          <div className="um-header-right">
            <NotificationPanel variant="admin" />
            <HeaderBtn icon={<Settings size={20} />} />
          </div>
        </header>

        <div className="um-main-container" style={{ paddingBottom: '4rem' }}>
          <main className="um-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Stats Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              <div className="um-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Người dùng</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{stats.totalUsers}</p>
                </div>
              </div>
              <div className="um-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Leaf size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Gia đình</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{stats.totalFamilies}</p>
                </div>
              </div>
              <div className="um-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#DCFCE7', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UtensilsCrossed size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Thực phẩm</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{stats.totalFoods}</p>
                </div>
              </div>
              <div className="um-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#F3E8FF', color: '#A855F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Món ăn</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{stats.totalRecipes}</p>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="um-card" style={{ height: '400px' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 800, color: 'var(--fiza-primary)' }}>Lượt truy cập trong tuần</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={stats.userActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="users" fill="var(--mint-green)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="um-card" style={{ height: '400px' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 800, color: 'var(--fiza-primary)' }}>Phân loại thực phẩm</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={stats.foodStats}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.foodStats?.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Unidentified Items Section */}
            <div className="um-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--fiza-primary)' }}>Yêu cầu định danh thực phẩm (Người dùng nhập)</h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Các loại thực phẩm hoặc nguyên liệu mới do người dùng gửi lên</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
                  <div className="um-search-container" style={{ maxWidth: '300px' }}>
                    <Search className="um-search-icon" size={18} />
                    <input 
                      type="text" 
                      placeholder="Tìm yêu cầu..." 
                      className="um-search-input"
                      value={uiSearchQuery}
                      onChange={(e) => setUiSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="um-table">
                  <thead>
                    <tr>
                      <th style={{ width: '150px' }}>Phân loại</th>
                      <th>Cụ thể (Người dùng nhập)</th>
                      <th style={{ width: '120px' }}>Trạng thái</th>
                      <th>Ghi chú</th>
                      <th style={{ width: '140px' }}>Ngày gửi</th>
                      <th style={{ textAlign: 'center', width: '100px' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unidentifiedItems.filter(item => {
                      const actualNameStr = item?.actualName || (item as any)?.actualname || '';
                      const generalNameStr = item?.generalName || (item as any)?.generalname || '';
                      
                      return (
                        actualNameStr.toLowerCase().includes(uiSearchQuery.toLowerCase()) ||
                        generalNameStr.toLowerCase().includes(uiSearchQuery.toLowerCase())
                      );
                    }).map(item => {
                      const id = item.id;
                      const actualName = item.actualName || (item as any).actualname || '-';
                      const status = item.status || '-';
                      const note = item.note || '-';
                      const submittedAt = item.submittedAt || (item as any).submittedat || '-';
                      const generalName = item.generalName || (item as any).generalname || 'Khác';

                      let badgeStyle = { backgroundColor: '#F3E8FF', color: '#9333EA' }; 
                      
                      if (generalName.toLowerCase().includes("thịt")) {
                        badgeStyle = { backgroundColor: '#FEF3C7', color: '#D97706' }; 
                      } else if (generalName.toLowerCase().includes("hải sản") || generalName.toLowerCase().includes("cá")) {
                        badgeStyle = { backgroundColor: '#E0F2FE', color: '#0369A1' }; 
                      } else if (generalName.toLowerCase().includes("rau") || generalName.toLowerCase().includes("củ") || generalName.toLowerCase().includes("trái cây")) {
                        badgeStyle = { backgroundColor: '#DCFCE7', color: '#15803D' }; 
                      } else if (generalName.toLowerCase().includes("trứng") || generalName.toLowerCase().includes("sữa")) {
                        badgeStyle = { backgroundColor: '#FCE7F3', color: '#C11574' }; 
                      }

                      return (
                        <tr key={id}>
                          <td>
                            <span style={{ 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '9999px', 
                              fontSize: '10px', 
                              fontWeight: 800, 
                              textTransform: 'uppercase',
                              ...badgeStyle
                            }}>
                              {generalName}
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, color: 'var(--fiza-primary)' }}>{actualName}</td>
                          <td style={{ fontSize: '0.875rem', color: '#64748b' }}>{status}</td>
                          <td style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note}</td>
                          <td style={{ fontSize: '0.875rem', color: '#64748b' }}>{submittedAt}</td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                              <ActionBtn icon={<Eye size={18} />} hoverColor="var(--fiza-primary)" onClick={() => { setViewingItem(item); setIsLinkingMode(false); }} />
                              <ActionBtn icon={<Trash2 size={18} />} hoverColor="#ef4444" onClick={() => setConfirmDeleteId(id)} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {unidentifiedItems.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                          Không có yêu cầu định danh thực phẩm nào cần xử lý.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Synonym Management */}
            <div className="um-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--fiza-primary)' }}>Quản lý tên gọi địa phương</h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Đồng nhất tên gọi thực phẩm cho các vùng miền</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
                  <div className="um-search-container" style={{ maxWidth: '300px' }}>
                    <Search className="um-search-icon" size={18} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm tên gọi..." 
                      className="um-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button onClick={() => { setSelectedItem(null); setStep(2); setShowAddModal(true); }} className="um-btn-primary">
                    <Plus size={20} />
                    Thêm từ đồng nghĩa
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="um-table">
                  <thead>
                    <tr>
                      <th>Tên chuẩn</th>
                      <th style={{ width: '120px' }}>Loại</th>
                      <th>Các biến thể / Tên gọi khác</th>
                      <th style={{ textAlign: 'center', width: '120px' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSynonyms.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 800, color: 'var(--fiza-primary)' }}>{item.originalName}</td>
                        <td>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '9999px', 
                            fontSize: '10px', 
                            fontWeight: 800, 
                            textTransform: 'uppercase',
                            backgroundColor: '#E1F2EB',
                            color: 'var(--mint-green)'
                          }}>
                            Thực phẩm
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
                            {item.variants.map((v, idx) => (
                              <div key={idx} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.35rem', 
                                padding: '0.25rem 0.85rem', 
                                backgroundColor: '#E1F2EB', 
                                borderRadius: '9999px', 
                                border: '1px solid #6DD4B4',
                                transition: 'all 0.2s'
                              }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--fiza-primary)' }}>{v}</span>
                                <button 
                                  onClick={() => handleRemoveVariant(item.id, idx)}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', padding: 0 }}
                                >
                                  <X size={14} color="var(--fiza-primary)" />
                                </button>
                              </div>
                            ))}
                            {inlineAdding === item.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input 
                                  autoFocus 
                                  value={inlineValue}
                                  onChange={(e) => setInlineValue(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddInlineVariant(item.id)}
                                  onBlur={() => {
                                    if (!inlineValue.trim()) setInlineAdding(null);
                                    else handleAddInlineVariant(item.id);
                                  }}
                                  placeholder="Nhập tên gọi khác..."
                                  style={{ 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: '9999px', 
                                    border: '1px solid var(--mint-green)', 
                                    fontSize: '0.8125rem',
                                    outline: 'none',
                                    width: '180px',
                                    background: 'white'
                                  }}
                                />
                                <button onClick={() => handleAddInlineVariant(item.id)} style={{ border: 'none', background: 'var(--mint-green)', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(109, 212, 180, 0.2)' }}>
                                  <Plus size={16} />
                                </button>
                                <button onClick={() => { setInlineValue(''); setInlineAdding(null); }} style={{ border: 'none', background: '#f1f5f9', color: '#94a3b8', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => { setInlineAdding(item.id); setInlineValue(''); }}
                                className="um-btn-add"
                                style={{ padding: '0.25rem 1rem', height: '32px' }}
                              >
                                <Plus size={16} /> THÊM
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <ActionBtn icon={<Trash2 size={18} />} hoverColor="#ef4444" onClick={() => handleDeleteSynonymMapping(item.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredSynonyms.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                          Không tìm thấy tên gọi địa phương nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <Modal title="Thêm từ đồng nghĩa / Tên gọi địa phương" onClose={handleCloseModal}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontWeight: 700, color: '#475569' }}>Chọn thực phẩm cần thêm tên gọi khác:</p>
                  <div className="um-search-container">
                    <Search className="um-search-icon" size={18} />
                    <input 
                      type="text" 
                      placeholder="Tìm thực phẩm..." 
                      className="um-search-input"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                    />
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                    {itemsToSelect.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => { setSelectedItem(item); setStep(3); }}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1rem', 
                          padding: '0.75rem 1rem', 
                          borderRadius: '1rem', 
                          border: '1px solid #f1f5f9',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                          <img src={item.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 700, color: 'var(--fiza-primary)', fontSize: '0.9375rem' }}>{item.name}</p>
                          <p style={{ fontSize: '11px', color: '#94a3b8' }}>Đơn vị: {item.unit}</p>
                        </div>
                        <ChevronRight size={18} color="#cbd5e1" />
                      </div>
                    ))}
                    {itemsToSelect.length === 0 && (
                      <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Không tìm thấy thực phẩm phù hợp.</p>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && selectedItem && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden' }}>
                        <img src={selectedItem.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, color: 'var(--fiza-primary)' }}>{selectedItem.name}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>Đơn vị: {selectedItem.unit}</p>
                      </div>
                    </div>
                    <button onClick={() => setStep(2)} style={{ fontSize: '12px', color: '#94a3b8', border: 'none', background: 'transparent', cursor: 'pointer' }}>Đổi mục khác</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Nhập các tên gọi khác / Từ đồng nghĩa</label>
                    <textarea 
                      placeholder="Cách nhau bằng dấu phẩy. VD: Thịt lợn, Heo, Lợn nái..." 
                      className="um-textarea"
                      style={{ height: '120px', resize: 'none' }}
                      value={newVariants}
                      onChange={(e) => setNewVariants(e.target.value)}
                    />
                    <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>* Lưu ý: Các tên này sẽ giúp người dùng tìm kiếm chính xác hơn khi sử dụng ứng dụng.</p>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button onClick={handleCloseModal} style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', border: '1px solid #f1f5f9', background: 'white', fontWeight: 600 }}>Hủy</button>
                    <button onClick={handleFinalAdd} className="um-btn-primary" style={{ flex: 2 }}>Hoàn tất</button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {approvingItem && (
          <Modal title="Duyệt thực phẩm mới" onClose={() => setApprovingItem(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
                <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>Người dùng nhập:</p>
                <p style={{ fontWeight: 800, color: '#1e293b' }}>
                  {(approvingItem.actualName || (approvingItem as any).actualname)} ({(approvingItem.generalName || (approvingItem as any).generalname)})
                </p>
                {approvingItem.note && <p style={{ color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>Ghi chú: {approvingItem.note}</p>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Tên chuẩn hóa hệ thống</label>
                <input 
                  type="text" 
                  value={approveName} 
                  onChange={(e) => setApproveName(e.target.value)} 
                  className="um-search-input" 
                  style={{ paddingLeft: '1rem' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Nhóm thực phẩm</label>
                {/* 🎯 DROPDOWN ĐÃ ĐƯỢC CHỌN SẴN THEO GENERALNAME LẤY TỪ DATABASE */}
                <select 
                  value={approveCategory} 
                  onChange={(e) => setApproveCategory(Number(e.target.value))} 
                  className="um-search-input" 
                  style={{ paddingLeft: '1rem' }}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Đơn vị tính</label>
                <select 
                  value={approveUnit} 
                  onChange={(e) => setApproveUnit(e.target.value)} 
                  className="um-search-input" 
                  style={{ paddingLeft: '1rem' }}
                >
                  <option value="kg">kg (Ki-lô-gam)</option>
                  <option value="g">g (Gam)</option>
                  <option value="ml">ml (Mi-li-lít)</option>
                  <option value="l">l (Lít)</option>
                  <option value="quả">quả</option>
                  <option value="hộp">hộp</option>
                  <option value="gói">gói</option>
                  <option value="lon">lon</option>
                  <option value="chai">chai</option>
                  <option value="cái">cái</option>
                  <option value="bó">bó</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Từ đồng nghĩa / Tên gọi khác (phân cách bằng dấu phẩy)</label>
                {/* 🎯 ĐÃ ĐƯỢC ĐỔI THÀNH APPROVESYNONYMS ĐỂ HIỂN THỊ ĐÚNG MÓN NGƯỜI DÙNG TỰ GÕ */}
                <input 
                  type="text" 
                  value={approveSynonyms} 
                  onChange={(e) => setApproveSynonyms(e.target.value)} 
                  className="um-search-input" 
                  style={{ paddingLeft: '1rem' }}
                  placeholder="VD: Lợn nái, Heo nái..." 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  onClick={() => setApprovingItem(null)} 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSaveApproval} 
                  className="um-btn-primary" 
                  style={{ flex: 2 }}
                >
                  Lưu & Duyệt vào danh mục
                </button>
              </div>
            </div>
          </Modal>
        )}

        {viewingItem && (
          <Modal 
            title={isLinkingMode ? "Liên kết tên gọi địa phương" : "Chi tiết yêu cầu định danh"} 
            onClose={() => { setViewingItem(null); setIsLinkingMode(false); }} 
            width="500px"
          >
            {isLinkingMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
                  <p style={{ color: '#64748b', marginBottom: '0.25rem' }}>Liên kết tên gọi của người dùng:</p>
                  <p style={{ fontWeight: 800, color: '#1e293b' }}>
                    {(viewingItem.actualName || (viewingItem as any).actualname)} ({(viewingItem.generalName || (viewingItem as any).generalname)})
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Chọn thực phẩm hệ thống sẵn có để liên kết làm từ đồng nghĩa</label>
                  <div className="um-search-container" style={{ width: '100%' }}>
                    <Search className="um-search-icon" size={18} style={{ left: '1rem' }} />
                    <input 
                      type="text" 
                      placeholder="Tìm thực phẩm hệ thống..." 
                      value={linkSearchQuery}
                      onChange={(e) => setLinkSearchQuery(e.target.value)}
                      className="um-search-input"
                      style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '1rem', background: 'white' }}>
                  {foods
                    .filter(f => f.name.toLowerCase().includes(linkSearchQuery.toLowerCase()))
                    .map(f => (
                      <div 
                        key={f.id} 
                        onClick={() => setSelectedLinkFood(f)}
                        style={{ 
                          padding: '0.75rem 1rem', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          backgroundColor: selectedLinkFood?.id === f.id ? '#E1F2EB' : 'transparent',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{f.name}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '0.5rem' }}>({f.unit})</span>
                        </div>
                        {selectedLinkFood?.id === f.id && (
                          <span style={{ color: 'var(--mint-green)', fontWeight: 800, fontSize: '12px' }}>ĐÃ CHỌN</span>
                        )}
                      </div>
                    ))}
                  {foods.filter(f => f.name.toLowerCase().includes(linkSearchQuery.toLowerCase())).length === 0 && (
                    <p style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>Không tìm thấy thực phẩm nào.</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button 
                    onClick={() => setIsLinkingMode(false)} 
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Quay lại
                  </button>
                  <button 
                    onClick={handleSaveSynonymMapping} 
                    disabled={!selectedLinkFood}
                    className="um-btn-primary" 
                    style={{ flex: 1.5, opacity: selectedLinkFood ? 1 : 0.6 }}
                  >
                    Xác nhận liên kết
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <DetailItem label="Nhóm phân loại" value={viewingItem.generalName || (viewingItem as any).generalname} isBadge />
                  <DetailItem label="Tên cụ thể (Người dùng nhập)" value={viewingItem.actualName || (viewingItem as any).actualname} />
                  <DetailItem label="Số lượng trong tủ" value={viewingItem.quantity != null ? `${viewingItem.quantity}` : '—'} />
                  <DetailItem label="Khu vực lưu trữ chính" value={translateStorageLocation(viewingItem.storageLocation || (viewingItem as any).storagelocation)} />
                  <DetailItem label="Vị trí chi tiết trong tủ" value={translateSpecificLocation(viewingItem.specificLocation || (viewingItem as any).specificlocation)} />
                  <DetailItem label="Hạn sử dụng" value={viewingItem.expiryDate || (viewingItem as any).expirydate || '—'} />
                  <DetailItem label="Trạng thái lưu trữ" value={(viewingItem.status === 'STORED' ? 'Đang lưu trữ' : viewingItem.status) || '—'} />
                  <DetailItem label="Ngày đưa vào tủ" value={viewingItem.submittedAt || (viewingItem as any).submittedat} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
                  <DetailItem label="Mã gia đình (Family ID)" value={viewingItem.familyId || (viewingItem as any).familyid ? `${viewingItem.familyId || (viewingItem as any).familyid}` : '—'} />
                  <DetailItem label="Mã thực phẩm (Food ID)" value={viewingItem.foodId || (viewingItem as any).foodid ? `${viewingItem.foodId || (viewingItem as any).foodid}` : '—'} />
                  <DetailItem label="Thời điểm tạo bản ghi" value={viewingItem.createdAt || (viewingItem as any).createdat || '—'} />
                  <DetailItem label="Thời điểm cập nhật" value={viewingItem.updatedAt || (viewingItem as any).updatedat || '—'} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Ghi chú / Chú thích của người dùng</span>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                    {viewingItem.note || 'Không có ghi chú từ gia đình.'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={() => setViewingItem(null)} 
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Đóng cửa sổ
                    </button>
                    <button 
                      onClick={() => {
                        setIsLinkingMode(true);
                        setSelectedLinkFood(null);
                        setLinkSearchQuery('');
                      }}
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Liên kết món sẵn có
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      setViewingItem(null);
                      handleOpenApproveModal(viewingItem);
                    }}
                    className="um-btn-primary" 
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    Duyệt tạo thực phẩm mới hệ thống
                  </button>
                </div>
              </div>
            )}
          </Modal>
        )}

        {confirmDeleteId && (
          <Modal title="Xác nhận xóa hàng chờ" onClose={() => setConfirmDeleteId(null)} width="400px">
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Trash2 size={32} />
              </div>
              <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>Xóa yêu cầu duyệt?</p>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}>Yêu cầu này sẽ bị loại bỏ khỏi hàng chờ duyệt.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setConfirmDeleteId(null)} 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button 
                  onClick={() => handleConfirmDeleteQueue(confirmDeleteId)} 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', background: '#EF4444', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  Xóa bỏ
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
};

function SidebarLink({ icon, label, to, isExpanded, active, onClick }: any) {
  return (
    <NavLink to={to} onClick={onClick} className={`um-nav-item ${active ? 'active' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`} >
      <div className="um-nav-icon">{icon}</div>
      <AnimatePresence>
        {isExpanded && (
          <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="um-nav-label">
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );
}

function HeaderBtn({ icon, hasBadge }: any) {
  return (
    <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
      {icon}
      {hasBadge && <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #F0F4F2' }} />}
    </button>
  );
}

function ActionBtn({ icon, hoverColor, onClick }: any) {
  const [hover, setHover] = useState(false);
  return (
    <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onClick} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: hover ? hoverColor : '#94a3b8', backgroundColor: hover ? 'white' : 'transparent', boxShadow: hover ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none' }}>{icon}</button>
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

export default PerformanceManagement;