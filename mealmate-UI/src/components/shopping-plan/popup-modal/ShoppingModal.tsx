import DatePicker from "@/components/common/DatePicker";
import { deleteShoppingList, saveShoppingPlan, searchFoods, toggleItemStatus } from "@/features/shopping-plan/shoppingApi";
import { Edit3, Filter, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AddItemPopover from "../popover-modal/AddItemPopover";
import CategoryGroup from "./CategoryGroup";
import './ShoppingModal.css';

interface ShoppingModalProps {
    isOpen: boolean;
    mode: 'CREATE' | 'DETAIL';
    data?: any; // Nếu là DETAIL thì truyền data vào
    onModeChange?: (newMode: 'CREATE' | 'DETAIL') => void;
    onClose: () => void;
    familyId: number | null;
    onSuccess: () => void;
}

const ShoppingModal = ({ isOpen, mode, data, onModeChange, onClose }: ShoppingModalProps) => {
    if (!isOpen) return null;
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [activeFood, setActiveFood] = useState<any | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [localItems, setLocalItems] = useState<any[]>([]);

    useEffect(() => {
        if (data && data.items) {
            setLocalItems(data.items);
        } else {
            setLocalItems([]);
        }
    }, [data, isOpen]);

    const categoryIcons: Record<string, string> = {
        'Rau củ': '🥦',
        'Thịt & Hải sản': '🥩',
        'Sữa & Trứng': '🥛',
        'Gia vị': '🧂',
        'Đồ khô': '🍞'
    };

    const groupedItems = localItems.reduce((acc: any, item: any) => {
        const category = item.categoryName || item.category || 'Khác';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {});

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.trim().length > 1) {
                try {
                    // Nhập xong thì gọi API tìm kiếm thực phẩm thực tế
                    const results = await searchFoods(searchTerm);
                    setSearchResults(results);
                } catch (error) {
                    console.error("Lỗi khi tìm kiếm thực phẩm:", error);
                    // Fallback to mock data if API fails
                    setSearchResults([
                        { id: 101, name: 'Cà rốt Đà Lạt', unit: 'kg', category: 'Rau củ' },
                        { id: 102, name: 'Cà chua bi', unit: 'kg', category: 'Rau củ' }
                    ]);
                }
                setShowResults(true);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300); // Đợi 300ms sau khi ngừng gõ mới gọi API

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddClick = (food: any) => {
        setActiveFood(food);
        setShowResults(false);
    };

    const handleConfirmAddItem = (config: { quantity: number; assignee: string; note: string }) => {
        if (!activeFood) return;

        const newItem: any = {
            id: Date.now(), // ID tạm thời để hiển thị
            foodId: activeFood.id,
            foodName: activeFood.name || activeFood.foodName,
            quantity: config.quantity,
            unit: activeFood.unit || 'kg',
            categoryName: activeFood.category || 'Khác',
            note: config.note,
            assignee: {
                id: Date.now() + 1,
                name: config.assignee
            },
            isPurchased: false
        };

        setLocalItems(prev => [...prev, newItem]);
        setActiveFood(null); // Đóng popover
        setSearchTerm(''); // Xóa ô search
    };

    const handleUpdateItem = (id: number, fields: Partial<any>) => {
        setLocalItems(prev => prev.map(item => item.id === id ? { ...item, ...fields } : item));
    };

    const handleDeleteItem = (id: number) => {
        setLocalItems(prev => prev.filter(item => item.id !== id));
    };

    const handleToggleItemStatus = (id: number) => {
        setLocalItems(prev => prev.map(item => item.id === id ? { ...item, isPurchased: !item.isPurchased } : item));
        if (mode === 'DETAIL') {
            toggleItemStatus(id).catch(err => console.error("Toggle item status failed:", err));
        }
    };

    const handleConfirmSave = async () => {
        try {
            const familyId = Number(data?.familyId);
            const plannedDate = data?.plannedDate || data?.planned_date;

            if (!familyId) {
                alert("Lỗi: Không tìm thấy familyId.");
                return;
            }
            if (!plannedDate) {
                alert("Lỗi: Không tìm thấy plannedDate.");
                return;
            }

            const formattedItems = localItems.map(item => ({
                foodId: Number(item.foodId || item.food?.id),
                quantity: Number(item.quantity),
                unit: item.unit || "kg",
                assignedTo: item.assignedTo || item.assignee?.id || null,
                note: item.note || ""
            }));

            const payload = {
                familyId,
                plannedDate,
                items: formattedItems,
                note: data?.note || ""
            };

            console.log("Saving plan payload:", payload);
            await saveShoppingPlan(payload);
            alert("Lưu kế hoạch thành công!");
            onClose();
            window.location.reload();
        } catch (error: any) {
            console.error("Lỗi khi lưu kế hoạch:", error);
            alert("Lưu kế hoạch thất bại: " + error.message);
        }
    };

    const handleDeleteList = async () => {
        console.log("Dữ liệu modal:", data);
        const listId = data?.listId;
        try {
            if (!listId) {
                throw new Error("Không tìm thấy ID danh sách để xóa (listId bị undefined).");
            }
            if (window.confirm("Bạn có chắc chắn muốn xóa danh sách này không?")) {
                await deleteShoppingList(listId);
                alert("Xóa danh sách thành công!");
                onClose();
                window.location.reload();
            }
        } catch (error: any) {
            console.error("Lỗi khi xóa danh sách:", error);
            alert("Xóa danh sách thất bại: " + error.message);
        }
    };

    const getTitle = () => {
        if (mode === 'DETAIL') return 'Chi tiết kế hoạch';
        if (mode === 'CREATE') {
            if (data?.items && data.items.length > 0) {
                return 'Chỉnh sửa kế hoạch';
            }
            return 'Lập kế hoạch mới';
        }
        return 'Lập kế hoạch mới';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header: Dùng chung */}
                <div className="modal-header">
                    <div className="modal-header-left">
                        <h2 className="modal-title">
                            {getTitle()}
                        </h2>
                        <div className="modal-datepicker-wrapper">
                            <DatePicker
                                value={data?.plannedDate || data?.planned_date || '2026-05-01'}
                                onChange={() => { }}
                            />
                        </div>
                    </div>

                    <div className="modal-header-right">
                        {/* Wrapper search cần position: relative */}
                        <div className="modal-search-outer" ref={searchRef}>
                            <div className="modal-search-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Tìm kiếm thực phẩm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => searchTerm.length > 1 && setShowResults(true)}
                                />
                                {searchTerm && <X size={14} className="clear-search" onClick={() => setSearchTerm('')} />}
                            </div>

                            {/* 3. RENDER SEARCH RESULTS (Dropdown nổi) */}
                            {showResults && (
                                <div className="search-results-dropdown">
                                    {searchResults.map(food => (
                                        <div key={food.id} className="search-result-item" onClick={() => handleAddClick(food)}>
                                            <span className="result-icon-wrapper">
                                                {categoryIcons[food.category] || '📦'}
                                            </span>
                                            <span className="result-name">{food.name || food.foodName}</span>
                                            <span className="result-unit">{food.unit || 'kg'}</span>
                                            <button className="add-btn-small" onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddClick(food);
                                            }}>
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {searchResults.length === 0 && <div className="no-result">Không tìm thấy thực phẩm</div>}
                                </div>
                            )}

                            {/* 4. HIỂN THỊ POPOVER KHI CÓ ACTIVE FOOD */}
                            {activeFood && (
                                <div className="popover-anchor">
                                    <AddItemPopover
                                        foodName={activeFood.name || activeFood.foodName}
                                        unit={activeFood.unit || 'kg'}
                                        onConfirm={handleConfirmAddItem}
                                        onCancel={() => setActiveFood(null)}
                                    />
                                </div>
                            )}
                        </div>
                        <button className="filter-btn">
                            <Filter size={20} />
                        </button>
                        <button className="close-btn-top" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content: Scrollable */}
                <div className="modal-body">
                    <div className="modal-body-scroll">
                        {groupedItems && Object.keys(groupedItems).map(categoryName => (
                            <CategoryGroup
                                key={categoryName}
                                categoryName={categoryName}
                                mode={mode}
                                items={groupedItems[categoryName]}
                                icon={categoryIcons[categoryName] || '📦'}
                                onUpdate={handleUpdateItem}
                                onDelete={handleDeleteItem}
                                onToggleStatus={handleToggleItemStatus}
                            />
                        ))}

                        {mode === 'CREATE' && (
                            <button className="add-food-dashed-btn" onClick={() => searchInputRef.current?.focus()}>
                                + Thêm thực phẩm
                            </button>
                        )}
                        {/* Tạo một khoảng trống ở cuối để nội dung cuối cùng không bị nút che mất */}
                        <div style={{ height: '80px' }}></div>
                    </div>
                    {mode === 'DETAIL' && (
                        <button
                            className="fab-edit-btn"
                            onClick={() => onModeChange?.('CREATE')}
                        >
                            <Edit3 size={24} />
                        </button>
                    )}
                </div>

                {/* Footer: Khác biệt theo Mode */}
                <div className="modal-footer">
                    {mode === 'DETAIL' && (
                        <button className="delete-list-btn" onClick={handleDeleteList}> <Trash2 size={16} />Xóa danh sách</button>
                    )}

                    <div className="footer-actions">
                        <button className="cancel-btn" onClick={onClose}>Hủy</button>
                        <button className="confirm-btn" onClick={handleConfirmSave}>Xác nhận</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShoppingModal;