import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UtensilsCrossed, 
  BookOpen, 
  Bell, 
  Settings, 
  Leaf,
  BarChart3,
  Search,
  Plus,
  Trash2,
  X,
  ChevronRight,
  LogOut,
  Eye,
  Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from 'react-router-dom';
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
  id: string;
  type: 'meat' | 'ingredient';
  generalName: string; 
  actualName: string;  
  note: string;
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
  
  // Unidentified items (kept local since it's a review queue)
  const [unidentifiedItems, setUnidentifiedItems] = useState<UnidentifiedItem[]>([
    { id: 'ui-1', type: 'meat', generalName: 'Thịt chung 1', actualName: 'Thịt cá sấu', note: 'Mua tại chợ đầu mối, cần cách chế biến phù hợp', submittedBy: 'Nguyễn Văn A', submittedAt: '2026-05-15' },
    { id: 'ui-2', type: 'meat', generalName: 'Thịt chung 2', actualName: 'Thịt lươn đồng', note: 'Đặc sản vùng quê', submittedBy: 'Trần Thị B', submittedAt: '2026-05-16' },
    { id: 'ui-3', type: 'ingredient', generalName: 'Nguyên liệu chung 1', actualName: 'Gia vị Tây Bắc', note: 'Mắc khén, hạt dổi hỗn hợp', submittedBy: 'Lê Văn C', submittedAt: '2026-05-14' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [uiSearchQuery, setUiSearchQuery] = useState('');
  const [inlineAdding, setInlineAdding] = useState<number | null>(null);
  const [inlineValue, setInlineValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [step, setStep] = useState(2); // Start directly at step 2 (Select food)
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newVariants, setNewVariants] = useState<string>('');
  const [itemSearch, setItemSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [approvingItem, setApprovingItem] = useState<UnidentifiedItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<UnidentifiedItem | null>(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [selectedLinkFood, setSelectedLinkFood] = useState<any | null>(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  
  // Fields for approval modal
  const [approveName, setApproveName] = useState('');
  const [approveCategory, setApproveCategory] = useState<number>(1);
  const [approveUnit, setApproveUnit] = useState('kg');
  const [approveSynonyms, setApproveSynonyms] = useState('');


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

  const handleOpenApproveModal = (item: UnidentifiedItem) => {
    setApprovingItem(item);
    setApproveName(item.actualName);
    setApproveCategory(item.type === 'meat' ? 1 : 6);
    setApproveUnit('kg');
    setApproveSynonyms(item.generalName);
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
      alert(`Đã duyệt thực phẩm "${approveName}" vào hệ thống.`);
      setUnidentifiedItems(unidentifiedItems.filter(i => i.id !== approvingItem.id));
      setApprovingItem(null);
      fetchFoods();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('Duyệt thực phẩm thất bại.');
    }
  };

  const handleConfirmDeleteQueue = (id: string) => {
    setUnidentifiedItems(unidentifiedItems.filter(i => i.id !== id));
    setConfirmDeleteId(null);
  };

  const handleSaveSynonymMapping = async () => {
    if (!viewingItem || !selectedLinkFood) return;
    try {
      const food = selectedLinkFood;
      const currentVariants = food.synonyms ? food.synonyms.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [];
      if (!currentVariants.includes(viewingItem.actualName.trim())) {
        const updatedVariants = [...currentVariants, viewingItem.actualName.trim()].join(', ');
        const payload = {
          name: food.name,
          categoryId: food.categoryId || food.category?.id || 1,
          unit: food.unit,
          imageUrl: food.imageUrl || '',
          synonyms: updatedVariants
        };
        await api.put(`/api/foods/${food.id}`, payload);
        alert(`Đã liên kết thành công! Đã thêm "${viewingItem.actualName}" làm từ đồng nghĩa của "${food.name}".`);
      } else {
        alert(`"${viewingItem.actualName}" đã tồn tại trong từ đồng nghĩa của "${food.name}".`);
      }
      setUnidentifiedItems(unidentifiedItems.filter(i => i.id !== viewingItem.id));
      setViewingItem(null);
      setIsLinkingMode(false);
      fetchFoods();
    } catch (err) {
      console.error(err);
      alert('Liên kết từ đồng nghĩa thất bại.');
    }
  };


  // Filter foods for synonym display
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
      {/* Sidebar */}
      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`um-sidebar ${isSidebarHovered ? 'expanded' : 'collapsed'}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '3rem', padding: isSidebarHovered ? '0 1.25rem' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: isSidebarHovered ? 'flex-start' : 'center' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--fiza-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', flexShrink: 0, margin: isSidebarHovered ? '0' : '0 auto' }}>
              <Leaf color="white" fill="white" size={28} />
            </div>
            <AnimatePresence>
              {isSidebarHovered && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--mint-green)', marginLeft: '0.75rem', whiteSpace: 'nowrap' }}>
                  Fiza
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SidebarLink icon={<Users size={22} />} label="Quản lý người dùng" to="/admin/users" isExpanded={isSidebarHovered} />
          <SidebarLink icon={<UtensilsCrossed size={22} />} label="Quản lý thực phẩm" to="/admin/foods" isExpanded={isSidebarHovered} />
          <SidebarLink icon={<BookOpen size={22} />} label="Quản lý món ăn" to="/admin/recipes" isExpanded={isSidebarHovered} />
          <SidebarLink icon={<BarChart3 size={22} />} label="Quản lý hiệu suất" to="/admin/performance" isExpanded={isSidebarHovered} active />
          <SidebarLink icon={<LogOut size={22} />} label="Đăng xuất" to="#" isExpanded={isSidebarHovered} onClick={logout} />
        </nav>


        <div style={{ width: '100%', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 1rem', margin: '0.5rem 0.5rem 0', borderRadius: '1rem', cursor: 'pointer' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--fiza-primary)', flexShrink: 0, margin: isSidebarHovered ? '0' : '0 auto' }}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <AnimatePresence>
              {isSidebarHovered && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ marginLeft: '0.75rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Admin Fiza</p>
                  <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Super Admin</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`um-main ${isSidebarHovered ? 'shifted' : 'unshifted'}`}>
        <header className="um-header">
          <div className="um-header-left">
            <h1 className="um-title">Quản lý hiệu suất</h1>
            <p className="um-subtitle">Theo dõi báo cáo và tối ưu hóa hệ thống</p>
          </div>
          <div className="um-header-right">
            <HeaderBtn icon={<Bell size={20} />} hasBadge />
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
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="um-card" style={{ height: '400px' }}>
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
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="um-card" style={{ height: '400px' }}>
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
                      {stats.foodStats.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Unidentified Items Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="um-card">
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
                      <th style={{ width: '120px' }}>Phân loại</th>
                      <th style={{ width: '150px' }}>Tên loại chung</th>
                      <th>Cụ thể (Người dùng nhập)</th>
                      <th>Ghi chú / Chú thích</th>
                      <th>Người gửi</th>
                      <th>Ngày gửi</th>
                      <th style={{ textAlign: 'center', width: '100px' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unidentifiedItems.filter(item => 
                      item.actualName.toLowerCase().includes(uiSearchQuery.toLowerCase()) || 
                      item.generalName.toLowerCase().includes(uiSearchQuery.toLowerCase()) ||
                      (item.type === 'meat' ? 'thịt' : 'nguyên liệu').includes(uiSearchQuery.toLowerCase())
                    ).map(item => (
                      <tr key={item.id}>
                        <td>
                          {item.type === 'meat' ? (
                            <span style={{ 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '9999px', 
                              fontSize: '10px', 
                              fontWeight: 800, 
                              textTransform: 'uppercase',
                              backgroundColor: '#FEF3C7',
                              color: '#D97706'
                            }}>
                              Thịt
                            </span>
                          ) : (
                            <span style={{ 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '9999px', 
                              fontSize: '10px', 
                              fontWeight: 800, 
                              textTransform: 'uppercase',
                              backgroundColor: '#F3E8FF',
                              color: '#9333EA'
                            }}>
                              Nguyên liệu
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.875rem' }}>
                            {item.generalName}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--fiza-primary)' }}>{item.actualName}</td>
                        <td style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '300px' }}>{item.note}</td>
                        <td style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 600 }}>{item.submittedBy}</td>
                        <td style={{ fontSize: '0.875rem', color: '#64748b' }}>{item.submittedAt}</td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <ActionBtn icon={<Eye size={18} />} hoverColor="var(--fiza-primary)" onClick={() => { setViewingItem(item); setIsLinkingMode(false); }} />
                            <ActionBtn icon={<Trash2 size={18} />} hoverColor="#ef4444" onClick={() => setConfirmDeleteId(item.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {unidentifiedItems.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                          Không có yêu cầu định danh thực phẩm nào cần xử lý.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Synonym Management */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="um-card">
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

              {isLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Đang tải danh sách tên gọi...</div>
              ) : (
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
                                      border: '1.5px solid var(--mint-green)', 
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
              )}
            </motion.div>

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
                <p style={{ fontWeight: 800, color: '#1e293b' }}>{approvingItem.actualName} ({approvingItem.generalName})</p>
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
                  <p style={{ fontWeight: 800, color: '#1e293b' }}>{viewingItem.actualName} ({viewingItem.generalName})</p>
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
                  <DetailItem label="Tên loại chung" value={viewingItem.generalName} isBadge />
                  <DetailItem label="Tên cụ thể (Người dùng nhập)" value={viewingItem.actualName} />
                  <DetailItem label="Loại" value={viewingItem.type === 'meat' ? 'Thịt' : 'Nguyên liệu/Gia vị'} />
                  <DetailItem label="Người gửi" value={viewingItem.submittedBy} />
                  <DetailItem label="Ngày gửi" value={viewingItem.submittedAt} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Ghi chú / Chú thích của người dùng</span>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                    {viewingItem.note || 'Không có ghi chú.'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={() => setViewingItem(null)} 
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Đóng
                    </button>
                    <button 
                      onClick={() => {
                        setIsLinkingMode(true);
                        setSelectedLinkFood(null);
                        setLinkSearchQuery('');
                      }}
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Liên kết thực phẩm sẵn có
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
                    Duyệt thực phẩm mới
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

// --- Copy helpers ---
function SidebarLink({ icon, label, to, isExpanded, active, onClick }: any) {
  return (
    <NavLink to={to} onClick={onClick} className={`um-nav-item ${active ? 'active' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}>
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
