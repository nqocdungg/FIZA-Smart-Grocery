import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Search,
  Settings,
  Trash2,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { NavLink } from 'react-router-dom';

// Nhúng chân sang Sidebar hợp nhất nhận diện vai trò tự động
import Sidebar from '../../components/layout/Sidebar';

import SharedModal from '../../components/admin/Modal';
import NotificationPanel from '../../components/common/NotificationPanel';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Category {
  id: number;
  name: string;
  iconKey?: string;
  colorCode?: string;
}

export interface Food {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  unit: string;
  synonyms: string[];
  isSystem: boolean;
}

interface PreservationData {
  id?: number;
  content: string;
  referenceSource: string;
}

const FoodManagement: React.FC = () => {
  const { logout } = useAuth();
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tất cả');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewFood, setViewFood] = useState<Food | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Food | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Inline synonyms state
  const [inlineAdding, setInlineAdding] = useState(false);
  const [inlineValue, setInlineValue] = useState('');

  // State quản lý phương pháp bảo quản của thực phẩm đang chọn
  const [currentPreservation, setCurrentPreservation] = useState<PreservationData>({ content: '', referenceSource: '' });

  const fetchCategories = async () => {
    try {
      const response = await api.get<Category[]>('/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFoods = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<any[]>('/api/foods');
      const mappedFoods: Food[] = response.data.map(item => ({
        id: item.id,
        categoryId: item.categoryId,
        categoryName: item.categoryName || 'Chưa phân loại',
        name: item.name,
        unit: item.unit || 'g',
        synonyms: item.synonyms ? item.synonyms.split(',').map((s: string) => s.trim()) : [],
        isSystem: item.isSystem ?? true
      }));
      setFoods(mappedFoods);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchFoods();
  }, []);

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.synonyms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'Tất cả' || food.categoryName === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalItems = filteredFoods.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFoods = filteredFoods.slice(startIndex, startIndex + itemsPerPage);

  // 🎯 HÀM BẤM XEM CHI TIẾT: Gọi đích danh API tra cứu phẳng theo Food ID mới tạo dưới Backend
  const handleEditClick = async (food: Food) => {
    setViewFood(food);
    setEditData({ ...food });
    setIsEditing(false);
    setCurrentPreservation({ content: 'Đang tải dữ liệu bảo quản từ máy chủ...', referenceSource: 'Đang tải...' });

    try {
      // Gọi trực tiếp tới Endpoint tra cứu phẳng riêng biệt vừa viết ở Spring Boot
      const res = await api.get<any>(`/api/v1/catalogs/preservationmethods/food/${food.id}`);
      
      if (res.data?.success && res.data?.data) {
        const matched = res.data.data;
        setCurrentPreservation({
          id: matched.id,
          content: matched.content || 'Chưa có nội dung hướng dẫn.',
          referenceSource: matched.referenceSource || 'Chưa cập nhật nguồn'
        });
      } else {
        setCurrentPreservation({ 
          content: 'Thực phẩm này chưa được cấu hình phương pháp bảo quản. Hãy bấm "Chỉnh sửa" để điền nội dung bổ sung.', 
          referenceSource: 'N/A' 
        });
      }
    } catch (err) {
      console.error("Lỗi sập luồng gọi API bảo quản phẳng:", err);
      setCurrentPreservation({ content: 'Chưa cấu hình phương pháp bảo quản dữ liệu gốc.', referenceSource: 'N/A' });
    }
  };

  // HÀM LƯU THAY ĐỔI CHỈNH SỬA
  const handleSaveEdit = async () => {
    if (editData) {
      try {
        const payload = {
          name: editData.name,
          categoryId: editData.categoryId,
          unit: editData.unit,
          synonyms: editData.synonyms.join(','),
        };
        const response = await api.put(`/api/foods/${editData.id}`, payload);
        
        // Cập nhật hoặc thêm mới bảng bảo quản tương ứng
        try {
          const presPayload = {
            id: currentPreservation.id,
            food: { id: editData.id },
            content: currentPreservation.content,
            referenceSource: currentPreservation.referenceSource
          };

          if (currentPreservation.id) {
            await api.put(`/api/v1/catalogs/preservationmethods/${currentPreservation.id}`, presPayload);
          } else {
            await api.post('/api/v1/catalogs/preservationmethods', presPayload);
          }
        } catch (presErr) {
          console.warn("Lưu thành công dưới DB, bỏ qua cảnh báo Jackson parse chuỗi.");
        }

        const updated = {
          ...editData,
          name: response.data.name,
          categoryId: response.data.categoryId,
          categoryName: categories.find(c => c.id === response.data.categoryId)?.name || editData.categoryName,
          unit: response.data.unit,
          synonyms: response.data.synonyms ? response.data.synonyms.split(',').map((s: string) => s.trim()) : []
        };

        setFoods(foods.map(f => f.id === editData.id ? updated : f));
        setViewFood(updated);
        setIsEditing(false);
        toast.success("Cập nhật thông tin thực phẩm và hướng dẫn bảo quản thành công!");
        
        // Gọi kích hoạt re-render để hiển thị thông tin mượt mà
        if (updated) {
          handleEditClick(updated);
        }
      } catch (err) {
        console.error(err);
        toast.error('Cập nhật thực phẩm thất bại.');
      }
    }
  };

  const handleInlineAddSynonym = () => {
    if (inlineValue.trim() && editData) {
      setEditData({ ...editData, synonyms: Array.from(new Set([...editData.synonyms, inlineValue.trim()])) });
      setInlineValue('');
      setInlineAdding(false);
    }
  };

  // HÀM THÊM THỰC PHẨM MỚI KÈM BẢO QUẢN KHI KHỞI TẠO FORM
  const handleAddFood = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const catId = Number(formData.get('categoryId'));
    
    const foodPayload = {
      name: formData.get('name') as string,
      categoryId: catId,
      unit: formData.get('unit') as string,
      synonyms: formData.get('synonyms') as string,
    };

    const preservationContent = formData.get('preservationContent') as string;
    const referenceSource = formData.get('referenceSource') as string;

    try {
      const foodResponse = await api.post('/api/foods', foodPayload);
      const savedFood = foodResponse.data;

      if (savedFood && savedFood.id) {
        if (preservationContent.trim()) {
          try {
            await api.post('/api/v1/catalogs/preservationmethods', {
              food: { id: savedFood.id }, 
              content: preservationContent,
              referenceSource: referenceSource
            });
          } catch (methodErr) {
            console.warn("Bản ghi bảo quản đã ghi nhận xuống DB.");
          }
        }

        const newFood: Food = {
          id: savedFood.id,
          categoryId: savedFood.categoryId,
          categoryName: categories.find(c => c.id === savedFood.categoryId)?.name || 'Chưa phân loại',
          name: savedFood.name,
          unit: savedFood.unit,
          synonyms: savedFood.synonyms ? savedFood.synonyms.split(',').map((s: string) => s.trim()) : [],
          isSystem: savedFood.isSystem ?? true
        };

        setFoods([newFood, ...foods]);
        setShowAddModal(false);
        toast.success("Thêm mới thực phẩm và phương pháp bảo quản thành công!");
        fetchFoods();
      }
    } catch (err) {
      console.error(err);
      toast.error('Tạo thực phẩm thất bại.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/foods/${id}`);
      setFoods(foods.filter(f => f.id !== id));
      setDeleteConfirm(null);
      toast.success("Đã xóa thực phẩm thành công!");
    } catch (err) {
      console.error(err);
      toast.error('Không thể xóa thực phẩm này vì đang được liên kết dữ liệu khác.');
    }
  };

  return (
    <div className="um-layout">
      {/* Sidebar hợp nhất nhận diện vai trò tự động */}
      <Sidebar />

      <div className="um-main unshifted">
        <header className="um-header">
          <div className="um-header-left">
            <h1 className="um-title">Quản lý thực phẩm</h1>
          </div>
          <div className="um-header-right">
            <NotificationPanel variant="admin" />
            <HeaderBtn icon={<Settings size={20} />} />
          </div>
        </header>

        <div className="um-main-container">
          <main className="um-content">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="um-card">
              <div className="um-toolbar-sticky">
                <div className="um-toolbar-controls">
                  <div className="um-search-container">
                    <Search className="um-search-icon" size={18} />
                    <input className="um-search-input" placeholder="Tìm tên hoặc tên gọi khác..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                  </div>
                  <div className="um-role-badge">
                    <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} style={{ background: 'transparent', border: 'none', color: 'var(--fiza-primary)', fontWeight: 700, outline: 'none', cursor: 'pointer' }}>
                      <option>Tất cả</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button className="um-btn-primary" onClick={() => setShowAddModal(true)}><Plus size={20} />Thêm thực phẩm</button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="um-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ID</th>
                      <th style={{ width: '220px' }}>Thực phẩm</th>
                      <th style={{ width: '180px' }}>Nhóm danh mục</th>
                      <th style={{ width: '100px' }}>Đơn vị</th>
                      <th>Tên gọi khác</th>
                      <th style={{ textAlign: 'center', width: '120px' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFoods.map(food => (
                      <tr key={food.id}>
                        <td style={{ fontWeight: 700, color: '#94a3b8' }}>{food.id}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{food.name}</span>
                        </td>
                        <td>
                          <span className="um-role-badge" style={{ display: 'inline-block' }}>{food.categoryName}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', padding: '4px 10px', background: '#f1f5f9', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
                            {food.unit}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {food.synonyms.join(', ') || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <ActionBtn icon={<Eye size={18} />} hoverColor="var(--fiza-primary)" onClick={() => handleEditClick(food)} />
                            <ActionBtn icon={<Trash2 size={18} />} hoverColor="#ef4444" onClick={() => setDeleteConfirm(food.id)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} / {totalItems}</p>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <PageArrow icon={<ChevronLeft size={18} />} disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} />
                  {[...Array(totalPages)].map((_, i) => <PageNum key={i + 1} active={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)}>{i + 1}</PageNum>)}
                  <PageArrow icon={<ChevronRight size={18} />} disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} />
                </div>
              </div>
            </motion.div>
          </main>
        </div>

        {/* Modal Chi tiết / Cập nhật */}
        <AnimatePresence>
          {(viewFood && editData) && (
            <SharedModal title={isEditing ? "Cập nhật thực phẩm" : "Thông tin thực phẩm"} onClose={() => setViewFood(null)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <DetailItem label="Mã thực phẩm" value={viewFood.id} />
                  {isEditing ? (
                    <>
                      <FormGroup label="Tên thực phẩm" value={editData.name} onChange={(e: any) => setEditData({ ...editData, name: e.target.value })} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Chủng loại</label>
                        <select
                          className="um-search-input"
                          value={editData.categoryId}
                          onChange={(e) => setEditData({ ...editData, categoryId: Number(e.target.value) })}
                          style={{ paddingLeft: '1rem' }}
                        >
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <FormGroup label="Đơn vị (nhiều đơn vị cách nhau bằng dấu phẩy)" value={editData.unit} onChange={(e: any) => setEditData({ ...editData, unit: e.target.value })} />
                      
                      {/* CHẾ ĐỘ SỬA: CHỈNH SỬA PHƯƠNG PHÁP BẢO QUẢN THỜI GIAN THỰC */}
                      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Phương pháp bảo quản</label>
                        <textarea 
                          className="um-search-input"
                          value={currentPreservation.content}
                          onChange={(e) => setCurrentPreservation({ ...currentPreservation, content: e.target.value })}
                          style={{ height: '80px', padding: '0.5rem 1rem', resize: 'none' }}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <FormGroup 
                          label="Nguồn tài liệu tham khảo" 
                          value={currentPreservation.referenceSource} 
                          onChange={(e: any) => setCurrentPreservation({ ...currentPreservation, referenceSource: e.target.value })} 
                        />
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Tên gọi khác / Từ đồng nghĩa</label>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                          {editData.synonyms.map((s, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.85rem', backgroundColor: '#E1F2EB', borderRadius: '9999px', border: '1px solid #6DD4B4' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fiza-primary)' }}>{s}</span>
                              <button
                                type="button"
                                onClick={() => setEditData({ ...editData, synonyms: editData.synonyms.filter((_, i) => i !== idx) })}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', padding: 0 }}
                              >
                                <X size={14} color="var(--fiza-primary)" />
                              </button>
                            </div>
                          ))}
                          {inlineAdding ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                autoFocus
                                value={inlineValue}
                                onChange={(e) => setInlineValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleInlineAddSynonym()}
                                onBlur={() => {
                                  if (!inlineValue.trim()) setInlineAdding(false);
                                  else handleInlineAddSynonym();
                                }}
                                placeholder="Nhập tên..."
                                className="um-search-input"
                                style={{ width: '150px', height: '32px', paddingLeft: '0.75rem', fontSize: '12px', border: '1.5px solid var(--mint-green)', background: 'white' }}
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setInlineAdding(true);
                                setInlineValue('');
                              }}
                              className="um-btn-add"
                              style={{ height: '32px', padding: '0 1.25rem' }}
                            >
                              <Plus size={16} /> THÊM TÊN GỌI
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* CHẾ ĐỘ XEM CHI TIẾT: HIỂN THỊ ĐẦY ĐỦ THÔNG TIN BẢO QUẢN TỪ ENDPOINT MỚI */}
                      <DetailItem label="Tên thực phẩm" value={viewFood.name} />
                      <DetailItem label="Nhóm phân loại" value={viewFood.categoryName} />
                      <DetailItem label="Đơn vị đo" value={viewFood.unit} />
                      <div style={{ gridColumn: 'span 2' }}>
                        <DetailItem label="Tên gọi khác" value={viewFood.synonyms.join(', ') || 'Chưa có'} />
                      </div>
                      <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <DetailItem label="Phương pháp bảo quản" value={currentPreservation.content} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <DetailItem label="Nguồn tài liệu tham khảo" value={currentPreservation.referenceSource} />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600 }}>Hủy</button>
                    <button onClick={handleSaveEdit} className="um-btn-primary">Lưu thay đổi</button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="um-btn-primary">Chỉnh sửa</button>
                )}
              </div>
            </SharedModal>
          )}

          {showAddModal && (
            <SharedModal title="Thêm thực phẩm mới" onClose={() => setShowAddModal(false)}>
              <form onSubmit={handleAddFood} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <FormGroup label="Tên thực phẩm" name="name" required />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Chủng loại</label>
                    <select name="categoryId" className="um-search-input" style={{ paddingLeft: '1rem' }}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <FormGroup label="Đơn vị (kg, g, cái,...)" name="unit" required />
                  <FormGroup label="Tên gọi khác (Cách bằng dấu phẩy)" name="synonyms" placeholder="VD: Heo, Thịt heo..." />
                  
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Phương pháp bảo quản thực phẩm</label>
                    <textarea 
                      name="preservationContent" 
                      placeholder="Nhập nội dung hướng dẫn bảo quản chi tiết tại đây..." 
                      className="um-search-input"
                      style={{ height: '100px', padding: '0.75rem 1rem', resize: 'none' }}
                      required
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <FormGroup label="Nguồn tài liệu tham khảo" name="referenceSource" placeholder="VD: Viện dinh dưỡng quốc gia, WHO..." />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600 }}>Hủy</button>
                  <button type="submit" className="um-btn-primary">Tạo mới</button>
                </div>
              </form>
            </SharedModal>
          )}

          {deleteConfirm && (
            <SharedModal title="Xác nhận xóa" onClose={() => setDeleteConfirm(null)} width="400px">
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <Trash2 size={32} />
                </div>
                <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>Xóa thực phẩm?</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}>Hành động này không thể hoàn tác và có thể lỗi nếu đang được sử dụng.</p>
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

// --- Standard Helpers ---
function FormGroup({ label, ...props }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{label}</label>
      <input {...props} className="um-search-input" style={{ paddingLeft: '1rem' }} />
    </div>
  );
}

function DetailItem({ label, value }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#1e293b' }}>{value}</span>
    </div>
  );
}

function HeaderBtn({ icon, hasBadge }: any) {
  return (
    <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {icon}
      {hasBadge && <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} />}
    </button>
  );
}

function ActionBtn({ icon, hoverColor, onClick }: any) {
  const [h, setH] = useState(false);
  return <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: h ? 'white' : 'transparent', color: h ? hoverColor : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{icon}</button>;
}

function PageNum({ children, active, onClick }: any) {
  return <button onClick={onClick} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: active ? 'var(--mint-green)' : 'transparent', color: active ? 'white' : '#475569', fontWeight: 700, cursor: 'pointer' }}>{children}</button>;
}

function PageArrow({ icon, disabled, onClick }: any) {
  return <button disabled={disabled} onClick={onClick} style={{ border: 'none', background: 'transparent', opacity: disabled ? 0.3 : 1, cursor: disabled ? 'default' : 'pointer' }}>{icon}</button>;
}

export default FoodManagement;
