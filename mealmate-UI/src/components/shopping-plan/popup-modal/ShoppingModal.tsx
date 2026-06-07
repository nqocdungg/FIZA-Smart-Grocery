import DatePicker from "@/components/common/DatePicker";
import { useAuth } from "@/context/AuthContext";
import { deleteShoppingList, getFamilyMembers, getPlanDetail, importToFridge, saveShoppingPlan, searchFoods, toggleItemStatus } from "@/features/shopping-plan/shoppingApi";
import { Edit3, Filter, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import FrequentItems from "../FrequentItems";
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
    plans: any[];
    defaultFilter?: 'ALL' | 'PENDING' | 'DONE';
}

const ShoppingModal = ({ isOpen, mode, data, onModeChange, onClose, familyId, onSuccess, plans, defaultFilter = 'ALL' }: ShoppingModalProps) => {
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
    const filterRef = useRef<HTMLDivElement>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [localItems, setLocalItems] = useState<any[]>([]);
    const isHousekeeper = user?.role === 'HOUSEKEEPER';
    const [showSearchCue, setShowSearchCue] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [toggledPendingIds, setToggledPendingIds] = useState<Record<number, boolean>>({});
    const [showSuggestions, setShowSuggestions] = useState(false);

    const placeholderText = showSearchCue
        ? `Nhập thực phẩm muốn thêm cho hôm nay...`
        : (isHousekeeper ? "Tìm để thêm món mới..." : "Tìm món trong danh sách...");

    const handleTriggerAddFood = () => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
            setShowSearchCue(true);

            // Tự động ẩn cue sau 3 giây để không làm phiền user
            setTimeout(() => setShowSearchCue(false), 3000);
        }
    };

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
            setFilterStatus(defaultFilter);
            setToggledPendingIds({});
        }
    }, [isOpen, defaultFilter]);

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
        let items = localItems;

        // 1. Search term filter
        if (searchTerm.trim()) {
            items = items.filter(item =>
                item.foodName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Status filter
        items = items.filter(item => {
            if (filterStatus === 'PENDING') {
                return !item.isPurchased || toggledPendingIds[item.id];
            }
            if (filterStatus === 'DONE') {
                return item.isPurchased;
            }
            return true;
        });

        // 3. Sort by purchased status (unpurchased first)
        items = [...items].sort((a, b) => {
            const aVal = a.isPurchased ? 1 : 0;
            const bVal = b.isPurchased ? 1 : 0;
            return aVal - bVal;
        });

        return items;
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

    const handleDateChange = async (newDate: string) => {
        setCurrentDate(newDate);
        if (!familyId) return;

        // Check if there is an existing plan for this new date
        const existingPlan = plans.find(p => p.plannedDate === newDate);
        if (existingPlan && existingPlan.listId) {
            const confirmMerge = window.confirm('Ngày này đã có kế hoạch. Bạn có muốn chỉnh sửa kế hoạch cũ không?');
            if (confirmMerge) {
                try {
                    const loadToastId = toast.loading("Đang tải kế hoạch cũ...");
                    const items = await getPlanDetail(familyId, newDate);
                    setLocalItems(items || []);
                    setNote(existingPlan.note || '');
                    if (data) {
                        data.listId = existingPlan.listId;
                        data.note = existingPlan.note || '';
                    }
                    toast.success("Đã tải kế hoạch cũ! ✨", { id: loadToastId });
                } catch (error: any) {
                    toast.error("Lỗi tải kế hoạch cũ: " + error.message);
                }
            } else {
                setLocalItems([]);
                setNote('');
                if (data) {
                    data.listId = null;
                    data.note = '';
                }
            }
        } else {
            setLocalItems([]);
            setNote('');
            if (data) {
                data.listId = null;
                data.note = '';
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilterMenu(false);
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

    const handleAddFromSuggestions = (item: any) => {
        const isExist = localItems.some(i => (i.foodId || i.food?.id) === item.id);
        if (isExist) {
            toast.error(`"${item.foodName}" đã có trong danh sách.`);
            return;
        }

        const newItem: any = {
            id: Date.now(),
            foodId: item.id,
            foodName: item.foodName,
            quantity: 1,
            unit: item.unit || 'kg',
            categoryName: 'Khác',
            note: 'Gợi ý thường mua',
            assignedTo: null,
            isPurchased: false
        };

        setLocalItems(prev => [...prev, newItem]);
        toast.success(`Đã thêm "${item.foodName}" vào danh sách! ✨`);
    };

    const handleUpdateItem = (id: number, fields: Partial<any>) => {
        setLocalItems(prev => prev.map(item => item.id === id ? { ...item, ...fields } : item));
    };

    const handleDeleteItem = (id: number) => {
        setLocalItems(prev => prev.filter(item => item.id !== id));
    };

    const handleToggleItemStatus = async (itemId: number) => {
        const itemToToggle = localItems.find(item => item.id === itemId);
        if (!itemToToggle) return;

        const willBePurchased = !itemToToggle.isPurchased;

        // If filtering in 'PENDING' mode and toggling to completed (purchased)
        if (filterStatus === 'PENDING' && willBePurchased) {
            setToggledPendingIds(prev => ({ ...prev, [itemId]: true }));
            setTimeout(() => {
                setToggledPendingIds(prev => {
                    const copy = { ...prev };
                    delete copy[itemId];
                    return copy;
                });
            }, 1000);
        }

        setLocalItems(prev => prev.map(item => item.id === itemId ? { ...item, isPurchased: willBePurchased } : item));
        if (mode === 'DETAIL') {
            try {
                console.log("toggle itemId:", itemId);
                await toggleItemStatus(itemId);
            } catch (err: any) {
                toast.error("Không thể cập nhật trạng thái: " + err.message);
                setLocalItems(prev => prev.map(item =>
                    item.id === itemId ? { ...item, isPurchased: !item.isPurchased } : item
                ));
                // Remove from toggledPendingIds if API failed so it reverts immediately
                setToggledPendingIds(prev => {
                    const copy = { ...prev };
                    delete copy[itemId];
                    return copy;
                });
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

    const handleImportToFridge = async () => {
        const listId = data?.listId;
        if (!listId) {
            toast.error("Không tìm thấy ID danh sách để nhập tủ lạnh.");
            return;
        }
        try {
            const loadToastId = toast.loading("Đang nhập thực phẩm vào tủ lạnh...");
            await importToFridge(listId);
            toast.success("Đã nhập thực phẩm vào tủ lạnh thành công! 🧺✨", { id: loadToastId });

            const date = data.planned_date || data.plannedDate;
            if (familyId && date) {
                const updatedItems = await getPlanDetail(familyId, date);
                setLocalItems(updatedItems || []);
                if (data) {
                    data.items = updatedItems || [];
                }
            }

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            toast.error("Nhập tủ lạnh thất bại: " + error.message);
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
                                onChange={handleDateChange}
                            />
                        </div>
                    </div>

                    <div className="modal-header-right">
                        {/* Wrapper search cần position: relative */}
                        <div className="modal-search-outer" ref={searchRef}>
                            <div className={`modal-search-wrapper ${showSuggestions ? 'compact' : ''}`}>
                                <Search className="search-icon" size={18} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={placeholderText}
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onFocus={() => {
                                        if (isHousekeeper && searchTerm.length > 1) setShowResults(true);
                                        setShowSearchCue(false);
                                    }}
                                />
                                {showSearchCue && (
                                    <div className="search-active-cue">
                                        ✨ Hãy nhập tên món bạn muốn mua vào đây
                                    </div>
                                )}
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
                        <div className="filter-dropdown-container" ref={filterRef}>
                            <button
                                className={`filter-btn ${filterStatus !== 'ALL' ? 'active' : ''}`}
                                onClick={() => setShowFilterMenu(prev => !prev)}
                            >
                                <Filter size={20} />
                            </button>
                            {showFilterMenu && (
                                <div className="filter-menu-dropdown">
                                    <div
                                        className={`filter-menu-item ${filterStatus === 'ALL' ? 'active' : ''}`}
                                        onClick={() => { setFilterStatus('ALL'); setShowFilterMenu(false); }}
                                    >
                                        Tất cả
                                    </div>
                                    <div
                                        className={`filter-menu-item ${filterStatus === 'PENDING' ? 'active' : ''}`}
                                        onClick={() => { setFilterStatus('PENDING'); setShowFilterMenu(false); }}
                                    >
                                        Chưa mua
                                    </div>
                                    <div
                                        className={`filter-menu-item ${filterStatus === 'DONE' ? 'active' : ''}`}
                                        onClick={() => { setFilterStatus('DONE'); setShowFilterMenu(false); }}
                                    >
                                        Đã mua
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            className={`suggestions-toggle-btn ${showSuggestions ? 'active' : ''}`}
                            onClick={() => setShowSuggestions(prev => !prev)}
                            title="Bật/Tắt Gợi ý thực phẩm"
                        >
                            💡 Gợi ý
                        </button>
                        <button className="close-btn-top" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="modal-body-layout">
                    {showSuggestions && (
                        <div className="modal-left-column">
                            <FrequentItems
                                familyId={familyId}
                                plans={plans}
                                onItemAdd={handleAddFromSuggestions}
                            />
                        </div>
                    )}

                    <div className="modal-right-column">
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
                                    filterStatus={filterStatus}
                                />
                            ))}

                            {mode === 'CREATE' && isHousekeeper && (
                                <button className="add-food-dashed-btn" onClick={handleTriggerAddFood}>
                                    + Thêm thực phẩm
                                </button>
                            )}
                            <div style={{ height: '80px' }}></div>
                        </div>
                    </div>
                </div>
                {mode === 'DETAIL' && isHousekeeper && (
                    <button
                        className="fab-edit-btn"
                        onClick={() => onModeChange?.('CREATE')}
                    >
                        <Edit3 size={24} />
                    </button>
                )}

                {/* Footer: Khác biệt theo Mode */}
                <div className="modal-footer">
                    {mode === 'DETAIL' && isHousekeeper && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="delete-list-btn" onClick={handleDeleteList}> <Trash2 size={16} />Xóa danh sách</button>
                            {localItems.some(item => item.isPurchased && !item.imported_to_fridge_at && !item.importedToFridgeAt) && (
                                <button className="import-fridge-btn" onClick={handleImportToFridge}>
                                    🧺 Nhập vào tủ lạnh
                                </button>
                            )}
                        </div>
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
