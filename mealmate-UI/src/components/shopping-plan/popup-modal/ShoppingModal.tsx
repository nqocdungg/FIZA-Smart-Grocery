import DatePicker from "@/components/common/DatePicker";
import { useAuth } from "@/context/AuthContext";
import { deleteShoppingList, getFamilyMembers, saveShoppingPlan, searchFoods, toggleItemStatus } from "@/features/shopping-plan/shoppingApi";
import { Edit3, Filter, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
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

const ShoppingModal = ({ isOpen, mode, data, onModeChange, onClose, familyId, onSuccess }: ShoppingModalProps) => {
    if (!isOpen) return null;
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [activeFood, setActiveFood] = useState<any | null>(null);
    const [note, setNote] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [localItems, setLocalItems] = useState<any[]>([]);
    const isHousekeeper = user?.role === 'HOUSEKEEPER' || user?.role === 'ADMIN';

    useEffect(() => {
        if (data && data.items) {
            setLocalItems(data.items);
        } else {
            setLocalItems([]);
        }
    }, [data, isOpen]);

    useEffect(() => {
        if (isOpen) {
            const initialDate = data?.plannedDate || data?.planned_date || '';
            setCurrentDate(initialDate);
            setLocalItems(data?.items || []);
            setNote(data?.note || '');
        }
    }, [isOpen, data]);

    useEffect(() => {
        if (isOpen) {
            getFamilyMembers().then(data => setMembers(data));
        }
    }, [isOpen]);

    const categoryIcons: Record<string, string> = {
        'Rau củ': '🥦',
        'Thịt & Hải sản': '🥩',
        'Sữa & Trứng': '🥛',
        'Gia vị': '🧂',
        'Đồ khô': '🍞'
    };

    useEffect(() => {
        if (!isHousekeeper) return;
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.trim().length > 1) {
                try {
                    const results = await searchFoods(searchTerm);
                    setSearchResults(results);
                    setShowResults(true);
                } catch (error) {
                    console.error("Lỗi search:", error);
                    setSearchResults([]);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, isHousekeeper]);

    const getFilteredLocalItems = () => {
        if (!searchTerm.trim()) return localItems;

        return localItems.filter(item =>
            item.foodName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };
    const groupedItems = getFilteredLocalItems().reduce((acc: any, item: any) => {
        const category = item.categoryName || item.category || 'Khác';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {});
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

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

    const handleConfirmAddItem = (config: { quantity: number; assignedTo: number | null; note: string }) => {
        if (!activeFood) return;

        const newItem: any = {
            id: Date.now(),
            foodId: activeFood.id,
            foodName: activeFood.name || activeFood.foodName,
            quantity: config.quantity,
            unit: activeFood.unit || 'kg',
            categoryName: activeFood.category || 'Khác',
            note: config.note,
            assignedTo: config.assignedTo,
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

    const handleToggleItemStatus = async (itemId: number) => {
        setLocalItems(prev => prev.map(item => item.id === itemId ? { ...item, isPurchased: !item.isPurchased } : item));
        if (mode === 'DETAIL') {
            try {
                console.log("toggle itemId:", itemId);
                await toggleItemStatus(itemId);
            } catch (err: any) {
                toast.error("Không thể cập nhật trạng thái: " + err.message);
                setLocalItems(prev => prev.map(item =>
                    item.id === itemId ? { ...item, isPurchased: !item.isPurchased } : item
                ));
            }
        }
    };

    const handleConfirmSave = async () => {
        if (!familyId) {
            toast.error("Lỗi: Không xác định được gia đình để lưu!");
            return;
        }
        if (!currentDate) {
            toast.error("Vui lòng chọn ngày kế hoạch!");
            return;
        }
        const payload = {
            familyId: familyId,
            plannedDate: currentDate,
            note: note,
            items: localItems.map(item => ({
                foodId: item.foodId,
                quantity: item.quantity,
                unit: item.unit,
                assignedTo: item.assignedTo || null,
                isPurchased: item.isPurchased,
                note: item.note || ''
            }))
        };
        try {
            console.log("Saving plan payload:", payload);
            await saveShoppingPlan(payload);
            if (onSuccess) {
                onSuccess();
            }
            onClose();
            toast.success('Lưu kế hoạch thành công! ✨', {
                style: {
                    borderRadius: '16px',
                    background: '#44BD97',
                    color: '#fff',
                    fontWeight: 'bold'
                },
                iconTheme: {
                    primary: '#fff',
                    secondary: '#44BD97',
                },
            });
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
                onSuccess();
                onClose();
                toast.success('Đã xóa danh sách thành công!', {
                    icon: '🗑️',
                    duration: 3000
                });

            }
        } catch (error: any) {
            console.error("Lỗi khi xóa danh sách:", error);
            toast.error('Xóa thất bại: ' + error.message);
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
                                value={currentDate}
                                onChange={(newDate) => setCurrentDate(newDate)}
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
                                    placeholder={isHousekeeper ? "Tìm để thêm món mới..." : "Tìm món trong danh sách..."}
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onFocus={() => isHousekeeper && searchTerm.length > 1 && setShowResults(true)}
                                />
                                {searchTerm && <X size={14} className="clear-search" onClick={() => setSearchTerm('')} />}
                            </div>

                            {/* 3. RENDER SEARCH RESULTS (Dropdown nổi) */}
                            {isHousekeeper && showResults && (
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
                            {isHousekeeper && activeFood && (
                                <div className="popover-anchor">
                                    <AddItemPopover
                                        foodName={activeFood.name || activeFood.foodName}
                                        unit={activeFood.unit || 'kg'}
                                        members={members}
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
                                members={members}
                                items={groupedItems[categoryName]}
                                icon={categoryIcons[categoryName] || '📦'}
                                onUpdate={handleUpdateItem}
                                onDelete={handleDeleteItem}
                                onToggleStatus={handleToggleItemStatus}
                            />
                        ))}

                        {mode === 'CREATE' && isHousekeeper && (
                            <button className="add-food-dashed-btn" onClick={() => searchInputRef.current?.focus()}>
                                + Thêm thực phẩm
                            </button>
                        )}
                        {/* Tạo một khoảng trống ở cuối để nội dung cuối cùng không bị nút che mất */}
                        <div style={{ height: '80px' }}></div>
                    </div>
                    {mode === 'DETAIL' && isHousekeeper && (
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
                    {mode === 'DETAIL' && isHousekeeper && (
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