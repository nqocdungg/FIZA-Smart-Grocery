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
  LogOut,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import SharedModal from '../../components/admin/Modal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';


export interface Ingredient {
  name: string;
  amount: string;
}

export interface Recipe {
  id: number;
  name: string;
  instructions: string;
  referenceLink?: string;
  author?: string;
  preferredMealTime: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  imageUrl?: string;
  ingredients: Ingredient[];
  regionalNames?: string[];
}

const RecipeManagement: React.FC = () => {
  const { logout } = useAuth();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const [foodsCatalog, setFoodsCatalog] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tất cả');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Recipe | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // New Recipe State for Add Modal
  const [newIngredients, setNewIngredients] = useState<Ingredient[]>([{ name: '', amount: '' }]);

  // Regional names inline adding state
  const [inlineAdding, setInlineAdding] = useState(false);
  const [inlineValue, setInlineValue] = useState('');


  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/v1/catalogs/recipes');
      const data = response.data?.data || response.data || [];
      setRecipes(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách món ăn:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFoodsCatalog = async () => {
    try {
      const response = await api.get('/api/foods');
      const data = response.data?.data || response.data || [];
      setFoodsCatalog(data);
    } catch (err) {
      console.error('Lỗi khi tải danh mục thực phẩm:', err);
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchFoodsCatalog();
  }, []);

  // Helper to parse quantity and unit from amount string
  const parseAmount = (amountStr: string) => {
    const clean = amountStr.trim();
    const match = clean.match(/^([\d.,]+)\s*(.*)$/);
    if (match) {
      const qty = parseFloat(match[1].replace(',', '.'));
      return { quantity: isNaN(qty) ? 1.0 : qty, unit: match[2] ? match[2].trim() : '' };
    }
    return { quantity: 1.0, unit: clean };
  };

  // Helper to find food in catalog by name
  const findFoodInCatalog = (name: string) => {
    return foodsCatalog.find(f => f.name.toLowerCase().trim() === name.toLowerCase().trim());
  };

  // Filter Logic
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          recipe.id.toString().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Tất cả' || recipe.preferredMealTime === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const totalItems = filteredRecipes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecipes = filteredRecipes.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/v1/catalogs/recipes/${id}`);
      setRecipes(recipes.filter(r => r.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      alert('Xóa món ăn thất bại.');
    }
  };

  const handleEditClick = async (recipe: Recipe) => {
    try {
      const response = await api.get(`/api/v1/catalogs/recipes/${recipe.id}/ingredients`);
      const backendIngredients = response.data?.data || response.data || [];
      const mappedIngredients = backendIngredients.map((ri: any) => ({
        name: ri.food?.name || '',
        amount: `${ri.quantity} ${ri.unit || ''}`.trim()
      }));

      const updatedRecipe = {
        ...recipe,
        ingredients: mappedIngredients,
        regionalNames: recipe.regionalNames || []
      };
      setViewRecipe(updatedRecipe);
      setEditData(JSON.parse(JSON.stringify(updatedRecipe)));
      setIsEditing(false);

    } catch (err) {
      console.error(err);
      alert('Không thể tải danh sách nguyên liệu.');
    }
  };

  const handleAddInlineRegional = () => {
    if (inlineValue.trim() && editData) {
      const current = editData.regionalNames || [];
      if (!current.includes(inlineValue.trim())) {
        const updated = [...current, inlineValue.trim()];
        setEditData({ ...editData, regionalNames: updated });
      }
      setInlineValue('');
      setInlineAdding(false);
    }
  };


  const handleSaveEdit = async () => {
    if (!editData) return;

    const invalidIngredients: string[] = [];
    const recipeIngredientsPayload: any[] = [];

    for (const ing of editData.ingredients) {
      if (!ing.name.trim()) continue;
      const food = findFoodInCatalog(ing.name);
      if (!food) {
        invalidIngredients.push(ing.name);
      } else {
        const parsed = parseAmount(ing.amount);
        recipeIngredientsPayload.push({
          food: { id: food.id },
          quantity: parsed.quantity,
          unit: parsed.unit || food.unit || 'g'
        });
      }
    }

    if (invalidIngredients.length > 0) {
      alert(`Các thực phẩm sau không tồn tại trong danh mục hệ thống: ${invalidIngredients.join(', ')}. Vui lòng thêm thực phẩm trước.`);
      return;
    }

    try {
      // 1. Update recipe details
      const recipePayload = {
        name: editData.name,
        instructions: editData.instructions,
        referenceLink: editData.referenceLink || '',
        author: editData.author || 'Admin',
        preferredMealTime: editData.preferredMealTime,
        imageUrl: editData.imageUrl || ''
      };

      await api.put(`/api/v1/catalogs/recipes/${editData.id}`, recipePayload);

      // 2. Update ingredients
      await api.post(`/api/v1/catalogs/recipes/${editData.id}/ingredients`, recipeIngredientsPayload);

      alert('Cập nhật món ăn thành công!');
      setViewRecipe(null);
      setIsEditing(false);
      fetchRecipes();
    } catch (err) {
      console.error(err);
      alert('Cập nhật món ăn thất bại.');
    }
  };

  const handleAddRecipe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const invalidIngredients: string[] = [];
    const recipeIngredientsPayload: any[] = [];

    for (const ing of newIngredients) {
      if (!ing.name.trim()) continue;
      const food = findFoodInCatalog(ing.name);
      if (!food) {
        invalidIngredients.push(ing.name);
      } else {
        const parsed = parseAmount(ing.amount);
        recipeIngredientsPayload.push({
          food: { id: food.id },
          quantity: parsed.quantity,
          unit: parsed.unit || food.unit || 'g'
        });
      }
    }

    if (invalidIngredients.length > 0) {
      alert(`Các thực phẩm sau không tồn tại trong danh mục hệ thống: ${invalidIngredients.join(', ')}. Vui lòng thêm thực phẩm trước.`);
      return;
    }

    try {
      const defaultImage = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500';
      const recipePayload = {
        name: formData.get('name') as string,
        instructions: formData.get('instructions') as string,
        referenceLink: formData.get('referenceLink') as string,
        author: (formData.get('author') as string) || 'Admin',
        preferredMealTime: formData.get('preferredMealTime') as any,
        imageUrl: (formData.get('imageUrl') as string) || defaultImage
      };

      // 1. Create Recipe
      const response = await api.post('/api/v1/catalogs/recipes', recipePayload);
      const newRecipe = response.data?.data || response.data;

      // 2. Save ingredients
      if (recipeIngredientsPayload.length > 0) {
        await api.post(`/api/v1/catalogs/recipes/${newRecipe.id}/ingredients`, recipeIngredientsPayload);
      }

      alert('Thêm món ăn thành công!');
      setShowAddModal(false);
      setNewIngredients([{ name: '', amount: '' }]);
      fetchRecipes();
    } catch (err) {
      console.error(err);
      alert('Thêm món ăn thất bại.');
    }
  };

  const handleUpdateIngredient = (idx: number, field: keyof Ingredient, value: string, isEditingModal: boolean) => {
    if (isEditingModal && editData) {
      const updated = [...editData.ingredients];
      updated[idx] = { ...updated[idx], [field]: value };
      setEditData({ ...editData, ingredients: updated });
    } else {
      const updated = [...newIngredients];
      updated[idx] = { ...updated[idx], [field]: value };
      setNewIngredients(updated);
    }
  };

  const handleAddIngredientRow = (isEditingModal: boolean) => {
    if (isEditingModal && editData) {
      setEditData({ ...editData, ingredients: [...editData.ingredients, { name: '', amount: '' }] });
    } else {
      setNewIngredients([...newIngredients, { name: '', amount: '' }]);
    }
  };

  const handleRemoveIngredientRow = (idx: number, isEditingModal: boolean) => {
    if (isEditingModal && editData) {
      setEditData({ ...editData, ingredients: editData.ingredients.filter((_, i) => i !== idx) });
    } else {
      setNewIngredients(newIngredients.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="um-layout">
      {/* Sidebar - Consistent with UserManagement */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="um-main unshifted">
        <header className="um-header">
          <div className="um-header-left">
            <h1 className="um-title">Quản lý món ăn</h1>
            <p className="um-subtitle">Danh mục công thức nấu ăn của hệ thống</p>
          </div>
          <div className="um-header-right">
            <HeaderBtn icon={<Bell size={20} />} hasBadge />
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
                    <input 
                      className="um-search-input" 
                      placeholder="Tìm kiếm món ăn..." 
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  <div className="um-role-badge" style={{ padding: '0.5rem 1.25rem', flexShrink: 0 }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', marginRight: '0.5rem' }}>Loại bữa ăn:</span>
                    <select 
                      style={{ background: 'transparent', border: 'none', color: 'var(--fiza-primary)', fontWeight: 700, fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                      value={categoryFilter}
                      onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    >
                      <option value="Tất cả">Tất cả</option>
                      <option value="BREAKFAST">Bữa sáng</option>
                      <option value="LUNCH">Bữa trưa</option>
                      <option value="DINNER">Bữa tối</option>
                    </select>
                  </div>
                </div>
                <button className="um-btn-primary" onClick={() => setShowAddModal(true)}>
                  <Plus size={20} />
                  Thêm món ăn
                </button>
              </div>

              {isLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Đang tải công thức nấu ăn...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="um-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>ID</th>
                        <th>Món ăn</th>
                        <th>Bữa ăn</th>
                        <th>Tác giả</th>
                        <th style={{ textAlign: 'center', width: '120px' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecipes.map(recipe => (
                        <tr key={recipe.id}>
                          <td style={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.875rem' }}>#{recipe.id}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden' }}>
                                <img src={recipe.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <span style={{ fontWeight: 700, color: '#1e293b' }}>{recipe.name}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            {recipe.preferredMealTime === 'BREAKFAST' ? 'Bữa sáng' : recipe.preferredMealTime === 'LUNCH' ? 'Bữa trưa' : 'Bữa tối'}
                          </td>
                          <td style={{ fontSize: '0.875rem', color: '#64748b' }}>{recipe.author || 'Admin'}</td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                              <ActionBtn icon={<Eye size={18} />} hoverColor="var(--fiza-primary)" onClick={() => handleEditClick(recipe)} />
                              <ActionBtn icon={<Trash2 size={18} />} hoverColor="#ef4444" onClick={() => setDeleteConfirm(recipe.id)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                      {currentRecipes.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                            Không tìm thấy món ăn nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} trên {totalItems} món ăn
                </p>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <PageArrow icon={<ChevronLeft size={18} />} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} />
                  {[...Array(totalPages)].map((_, i) => (
                    <PageNum key={i + 1} active={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)}>{i + 1}</PageNum>
                  ))}
                  <PageArrow icon={<ChevronRight size={18} />} disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} />
                </div>
              </div>
            </motion.div>
          </main>
        </div>

        {/* MODALS */}
        <AnimatePresence mode="wait">
          {showAddModal && (
            <SharedModal title="Thêm món ăn mới" onClose={() => setShowAddModal(false)} width="800px">
              <form onSubmit={handleAddRecipe} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <FormGroup label="Tên món ăn" name="name" placeholder="VD: Sườn xào chua ngọt" required />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Bữa ăn ưu tiên</label>
                    <select name="preferredMealTime" className="um-search-input" style={{ paddingLeft: '1rem' }}>
                      <option value="BREAKFAST">Bữa sáng</option>
                      <option value="LUNCH">Bữa trưa</option>
                      <option value="DINNER">Bữa tối</option>
                    </select>
                  </div>
                  <FormGroup label="Tác giả" name="author" placeholder="Bỏ trống để mặc định là Admin" />
                  <FormGroup label="Nguồn trích dẫn (Link)" name="referenceLink" placeholder="VD: https://food-source.com" />
                  <div style={{ gridColumn: 'span 2' }}>
                    <FormGroup label="Hình ảnh món ăn (URL)" name="imageUrl" placeholder="VD: https://images.unsplash.com/photo-..." />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <FormGroup label="Tên gọi khác / Từ đồng nghĩa (phân cách bằng dấu phẩy)" name="regionalNames" placeholder="VD: Nem rán, Chả giò" />
                  </div>
                </div>


                {/* Ingredients Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Danh sách nguyên liệu</label>
                    <button type="button" onClick={() => handleAddIngredientRow(false)} className="um-btn-add">
                      <Plus size={16} /> Thêm nguyên liệu
                    </button>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '1rem', padding: '1rem', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Tên nguyên liệu</th>
                          <th style={{ padding: '0.5rem', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Định mức (VD: 200g, 2 củ)</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {newIngredients.map((ing, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '0.25rem' }}>
                              <input 
                                type="text" 
                                value={ing.name} 
                                onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value, false)} 
                                placeholder="VD: Dầu ăn" 
                                list="foods-catalog-list" 
                                className="um-search-input" 
                                style={{ width: '100%', paddingLeft: '0.75rem', height: '36px' }} 
                              />
                            </td>
                            <td style={{ padding: '0.25rem' }}>
                              <input type="text" value={ing.amount} onChange={(e) => handleUpdateIngredient(idx, 'amount', e.target.value, false)} placeholder="VD: 200g" className="um-search-input" style={{ width: '100%', paddingLeft: '0.75rem', height: '36px' }} />
                            </td>
                            <td style={{ padding: '0.25rem', textAlign: 'center' }}>
                              <button type="button" onClick={() => handleRemoveIngredientRow(idx, false)} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Hướng dẫn chế biến</label>
                  <textarea name="instructions" className="um-textarea" style={{ height: '120px', resize: 'none' }} placeholder="Các bước thực hiện..." />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                  <button type="submit" className="um-btn-primary">Lưu món ăn</button>
                </div>
              </form>
            </SharedModal>
          )}

          {viewRecipe && editData && (
            <SharedModal title={isEditing ? "Chỉnh sửa món ăn" : "Chi tiết món ăn"} onClose={() => { setViewRecipe(null); setIsEditing(false); }} width="1000px">
              <div style={{ display: 'flex', gap: '2.5rem' }}>
                <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ width: '220px', height: '220px', borderRadius: '32px', overflow: 'hidden', backgroundColor: '#F1FAF6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                    <img src={viewRecipe.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>Thông tin chung</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <DetailItem label="Mã món ăn" value={`#${viewRecipe.id}`} />
                      <DetailItem 
                        label="Bữa ăn" 
                        value={viewRecipe.preferredMealTime === 'BREAKFAST' ? 'Bữa sáng' : viewRecipe.preferredMealTime === 'LUNCH' ? 'Bữa trưa' : 'Bữa tối'} 
                        isBadge 
                      />
                      <DetailItem label="Tác giả" value={viewRecipe.author || 'Admin'} />
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '600px', overflowY: 'auto', paddingRight: '1rem' }}>
                  {isEditing ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <FormGroup label="Tên món ăn" value={editData.name} onChange={(e: any) => setEditData({ ...editData, name: e.target.value })} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Bữa ăn ưu tiên</label>
                        <select className="um-search-input" value={editData.preferredMealTime} onChange={(e: any) => setEditData({ ...editData, preferredMealTime: e.target.value as any })} style={{ paddingLeft: '1rem' }}>
                          <option value="BREAKFAST">Bữa sáng</option>
                          <option value="LUNCH">Bữa trưa</option>
                          <option value="DINNER">Bữa tối</option>
                        </select>
                      </div>
                      <FormGroup label="Tác giả" value={editData.author} onChange={(e: any) => setEditData({ ...editData, author: e.target.value })} />
                      <FormGroup label="Nguồn (Link)" value={editData.referenceLink} onChange={(e: any) => setEditData({ ...editData, referenceLink: e.target.value })} />
                      <div style={{ gridColumn: 'span 2' }}>
                        <FormGroup label="Hình ảnh món ăn (URL)" value={editData.imageUrl} onChange={(e: any) => setEditData({ ...editData, imageUrl: e.target.value })} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Tên gọi khác / Từ đồng nghĩa</label>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                          {editData.regionalNames?.map((name, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.85rem', backgroundColor: '#E1F2EB', borderRadius: '9999px', border: '1px solid #6DD4B4' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fiza-primary)' }}>{name}</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  const updated = editData.regionalNames?.filter((_, i) => i !== idx) || [];
                                  setEditData({ ...editData, regionalNames: updated });
                                }}
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
                                onKeyDown={(e) => e.key === 'Enter' && handleAddInlineRegional()}
                                onBlur={() => {
                                  if (!inlineValue.trim()) setInlineAdding(false);
                                  else handleAddInlineRegional();
                                }}
                                placeholder="Nhập tên..."
                                className="um-search-input"
                                style={{ width: '130px', height: '28px', paddingLeft: '0.5rem', fontSize: '12px', background: 'white' }}
                              />
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => { setInlineAdding(true); setInlineValue(''); }}
                              className="um-btn-add"
                              style={{ padding: '0.25rem 0.75rem', height: '28px', fontSize: '10px' }}
                            >
                              <Plus size={12} /> Thêm
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Nguyên liệu & Định mức</label>
                          <button type="button" onClick={() => handleAddIngredientRow(true)} className="um-btn-add">
                            <Plus size={14} /> Thêm nguyên liệu
                          </button>
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: '1rem', padding: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ textAlign: 'left', backgroundColor: '#f1f5f9' }}>
                                <th style={{ padding: '0.75rem', fontSize: '10px', color: '#64748b', fontWeight: 800, border: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Tên</th>
                                <th style={{ padding: '0.75rem', fontSize: '10px', color: '#64748b', fontWeight: 800, border: '1px solid #e2e8f0', textTransform: 'uppercase' }}>Định mức</th>
                                <th style={{ width: '40px', border: '1px solid #e2e8f0' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {editData.ingredients.map((ing, idx) => (
                                <tr key={idx}>
                                  <td style={{ border: '1px solid #e2e8f0', padding: '0.5rem' }}>
                                    <input 
                                      type="text" 
                                      value={ing.name} 
                                      onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value, true)} 
                                      list="foods-catalog-list" 
                                      className="um-search-input" 
                                      style={{ width: '100%', height: '36px', paddingLeft: '0.75rem', fontSize: '12px', background: 'white' }} 
                                    />
                                  </td>
                                  <td style={{ border: '1px solid #e2e8f0', padding: '0.5rem' }}>
                                    <input type="text" value={ing.amount} onChange={(e) => handleUpdateIngredient(idx, 'amount', e.target.value, true)} className="um-search-input" style={{ width: '100%', height: '36px', paddingLeft: '0.75rem', fontSize: '12px', background: 'white' }} />
                                  </td>
                                  <td style={{ border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                    <button onClick={() => handleRemoveIngredientRow(idx, true)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Hướng dẫn nấu</label>
                        <textarea value={editData.instructions} onChange={(e) => setEditData({ ...editData, instructions: e.target.value })} className="um-textarea" style={{ height: '150px', resize: 'none' }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <DetailItem label="Tên món ăn" value={viewRecipe.name} />
                        <DetailItem label="Tác giả" value={viewRecipe.author || 'Admin'} />
                        <DetailItem label="Nguồn" value={viewRecipe.referenceLink || 'Nội bộ'} />
                        <DetailItem label="Tên gọi khác" value={viewRecipe.regionalNames?.join(', ') || 'Không có'} />
                      </div>

                      
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>Nguyên liệu & Định mức</p>
                        <div style={{ background: '#f8fafc', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f1f5f9' }}>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '11px', color: '#64748b', fontWeight: 800, border: '1px solid #e2e8f0' }}>Nguyên liệu</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '11px', color: '#64748b', fontWeight: 800, border: '1px solid #e2e8f0' }}>Định mức</th>
                              </tr>
                            </thead>
                            <tbody>
                              {viewRecipe.ingredients?.map((ing, idx) => (
                                <tr key={idx}>
                                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1e293b', fontSize: '0.875rem', border: '1px solid #e2e8f0' }}>{ing.name}</td>
                                  <td style={{ padding: '0.75rem 1rem', color: 'var(--fiza-primary)', fontWeight: 700, fontSize: '0.875rem', border: '1px solid #e2e8f0' }}>{ing.amount}</td>
                                </tr>
                              )) || (
                                <tr><td colSpan={2} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>Chưa cập nhật nguyên liệu</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>Hướng dẫn chế biến</p>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #f1f5f9', whiteSpace: 'pre-line', color: '#475569', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                          {viewRecipe.instructions || 'Chưa có hướng dẫn chi tiết.'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                    <button onClick={handleSaveEdit} className="um-btn-primary">Lưu thay đổi</button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="um-btn-primary">Chỉnh sửa món ăn</button>
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
                <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>Xóa món ăn?</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2rem' }}>Dữ liệu này sẽ không thể khôi phục.</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                  <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', background: '#EF4444', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Xóa ngay</button>
                </div>
              </div>
            </SharedModal>
          )}
        </AnimatePresence>
      </div>

      <datalist id="foods-catalog-list">
        {foodsCatalog.map(f => (
          <option key={f.id} value={f.name} />
        ))}
      </datalist>
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

function PageNum({ children, active, onClick }: any) {
  return (
    <button onClick={onClick} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: active ? 'var(--mint-green)' : 'transparent', color: active ? 'white' : '#475569', boxShadow: active ? '0 10px 15px -3px rgba(109, 212, 180, 0.3)' : 'none' }}>{children}</button>
  );
}

function PageArrow({ icon, disabled, onClick }: any) {
  return (
    <button disabled={disabled} onClick={onClick} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', color: '#94a3b8', opacity: disabled ? 0.3 : 1 }}>{icon}</button>
  );
}

export default RecipeManagement;
