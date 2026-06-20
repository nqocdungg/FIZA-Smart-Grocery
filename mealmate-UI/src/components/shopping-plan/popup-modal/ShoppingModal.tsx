import DatePicker from "@/components/common/DatePicker";
import { useAuth } from "@/context/AuthContext";
import { deleteShoppingList, getFamilyMembers, getPlanDetail, importFromShopping, importToFridge, saveShoppingPlan, searchFoods, toggleItemStatus } from "@/features/shopping-plan/shoppingApi";
import { getPendingShoppingItems, type PendingShoppingItem } from "@/features/shopping-plan/shoppingSuggestions";
import api from "@/services/api";
import { Edit3, Filter, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import FrequentItems from "../FrequentItems";
import ReceivedItems from "../ReceivedItems";
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

const getCategoryInfo = (categoryName?: string) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('rau')) {
        return { icon: '🥦', color: '#B2EBD9', key: 'vegetable' };
    }
    if (name.includes('thịt') || name.includes('thit')) {
        return { icon: '🥩', color: '#FFD6D6', key: 'meat' };
    }
    if (name.includes('hải sản') || name.includes('hai san') || name.includes('cá') || name.includes('ca')) {
        return { icon: '🐟', color: '#D7ECFF', key: 'fish' };
    }
    if (name.includes('sữa') || name.includes('sua') || name.includes('trứng') || name.includes('trung') || name.includes('dairy')) {
        return { icon: '🥛', color: '#F3E8FF', key: 'dairy' };
    }
    if (name.includes('trái cây') || name.includes('trai cay') || name.includes('quả') || name.includes('qua') || name.includes('fruit')) {
        return { icon: '🍎', color: '#FFE1A8', key: 'fruit' };
    }
    if (name.includes('gia vị') || name.includes('gia vi') || name.includes('spice')) {
        return { icon: '🧂', color: '#ECEFF1', key: 'spice' };
    }
    if (name.includes('khô') || name.includes('kho') || name.includes('dry')) {
        return { icon: '🍞', color: '#F5E6D3', key: 'dry-food' };
    }
    if (name.includes('uống') || name.includes('uong') || name.includes('drink') || name.includes('nước') || name.includes('nuoc')) {
        return { icon: '🥤', color: '#E0F7FA', key: 'drink' };
    }
    return { icon: '📦', color: '#F1F5F9', key: 'other' };
};

const getFirstUnit = (unitStr?: string) => {
    if (!unitStr) return 'kg';
    const parts = unitStr.split(',').map(u => u.trim()).filter(Boolean);
    return parts[0] || 'kg';
};

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
    const [genericFoods, setGenericFoods] = useState<any[]>([]);
    const [systemUnits, setSystemUnits] = useState<string[]>([]);
    const [foodUnitsMap, setFoodUnitsMap] = useState<Record<number, string>>({});
    const [showImportReview, setShowImportReview] = useState(false);

    interface ImportDraft {
        quantity: number;
        storageLocation: 'COOL' | 'FREEZER' | 'DRY';
        specificLocation: string;
        expiryDate: string;
        note: string;
    }
    const [importDrafts, setImportDrafts] = useState<Record<number, ImportDraft>>({});

    const storageLocationOptions = [
        { label: "Ngăn mát", value: "COOL" },
        { label: "Ngăn đông", value: "FREEZER" },
        { label: "Tủ đồ khô", value: "DRY" },
    ];

    const specificLocationOptions = [
        { label: "Kệ trên", value: "TOP_SHELF" },
        { label: "Kệ giữa", value: "MIDDLE_SHELF" },
        { label: "Kệ dưới", value: "BOTTOM_SHELF" },
        { label: "Ngăn rau củ", value: "VEGETABLE_DRAWER" },
        { label: "Ngăn trái cây", value: "FRUIT_DRAWER" },
        { label: "Cánh tủ", value: "DOOR_SHELF" },
    ];

    const itemsToImport = localItems.filter(item => item.isPurchased && !item.importedToFridgeAt && !item.imported_to_fridge_at);

    useEffect(() => {
        if (showImportReview) {
            const drafts: Record<number, ImportDraft> = {};
            itemsToImport.forEach(item => {
                drafts[item.id] = {
                    quantity: item.quantity,
                    storageLocation: 'COOL',
                    specificLocation: '',
                    expiryDate: '',
                    note: item.note || ''
                };
            });
            setImportDrafts(drafts);
        }
    }, [showImportReview, localItems]);

    const handleConfirmImport = async () => {
        for (const item of itemsToImport) {
            const draft = importDrafts[item.id];
            if (!draft || !draft.expiryDate) {
                toast.error(`Vui lòng chọn hạn sử dụng cho món "${item.customName || item.custom_name || item.foodName}"`);
                return;
            }
            if (draft.quantity <= 0) {
                toast.error(`Số lượng của món "${item.customName || item.custom_name || item.foodName}" phải lớn hơn 0`);
                return;
            }
        }

        const payloadItems = itemsToImport.map(item => {
            const draft = importDrafts[item.id];
            return {
                shoppingListItemId: item.id,
                foodId: item.foodId,
                customName: item.customName || item.custom_name || null,
                quantity: draft.quantity,
                storageLocation: draft.storageLocation,
                specificLocation: draft.specificLocation || null,
                addedDate: new Date().toISOString().slice(0, 10),
                expiryDate: draft.expiryDate,
                note: draft.note.trim() || null,
                unit: item.unit || null
            };
        });

        try {
            const loadToastId = toast.loading("Đang nhập thực phẩm vào tủ lạnh...");
            await importFromShopping(payloadItems);
            toast.success("Đã nhập thực phẩm vào tủ lạnh thành công! 🧺✨", { id: loadToastId });
            setShowImportReview(false);

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

    const placeholderText = showSearchCue
        ? `Nhập thực phẩm muốn thêm cho hôm nay...`
        : (mode === 'DETAIL' ? "Tìm món trong danh sách..." : "Tìm để thêm món mới...");

    const handleTriggerAddFood = () => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
            setShowSearchCue(true);
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
            if (mode === 'CREATE' || getPendingShoppingItems().length > 0) {
                setShowSuggestions(true);
            }

            // Fetch generic foods to append to search fallback and extract system units
            api.get('/api/foods')
                .then(res => {
                    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                    const filtered = list.filter((f: any) => f.name.toLowerCase().includes('khác'));
                    setGenericFoods(filtered);

                    // Build food units map
                    const unitMap: Record<number, string> = {};
                    list.forEach((f: any) => {
                        if (f.id) {
                            unitMap[f.id] = f.unit || '';
                        }
                    });
                    setFoodUnitsMap(unitMap);

                    // Extract distinct units
                    const unitsSet = new Set<string>();
                    list.forEach((f: any) => {
                        if (f.unit) {
                            f.unit.split(',').forEach((u: string) => {
                                const trimmed = u.trim().toLowerCase();
                                if (trimmed) {
                                    unitsSet.add(trimmed);
                                }
                            });
                        }
                    });
                    setSystemUnits(Array.from(unitsSet));
                })
                .catch(err => {
                    console.error("Lỗi lấy generic foods:", err);
                });
        }
    }, [isOpen, defaultFilter]);


    const categoryIconMap: Record<string, string> = {
        'vegetable': '🥦',
        'meat': '🥩',
        'dairy': '🥛',
        'fish': '🐟',
        'fruit': '🍎',
        'spice': '🧂',
        'dry-food': '🍞',
        'drink': '🥤'
    };

    useEffect(() => {
        if (mode === 'DETAIL') return;
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
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, mode]);

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
        const categoryName = item.categoryName || 'Khác';
        if (!acc[categoryName]) acc[categoryName] = {
            items: [],
            iconKey: item.foodIcon,
            color: item.colorCode
        };
        acc[categoryName].items.push(item);
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
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleAddClick = (food: any) => {
        setActiveFood(food);
        setShowResults(false);
    };

    const handleConfirmAddItem = (config: { quantity: number; assignedTo: number | null; note: string; customName?: string; unit?: string }) => {
        if (!activeFood) return;

        const category = activeFood.category || activeFood.categoryName || 'Khác';
        const catInfo = getCategoryInfo(category);

        const newItem: any = {
            id: Date.now(),
            foodId: activeFood.id,
            foodName: activeFood.name || activeFood.foodName,
            customName: config.customName,
            custom_name: config.customName,
            quantity: config.quantity,
            unit: config.unit || getFirstUnit(activeFood.unit),
            categoryName: category,
            foodIcon: catInfo.key,
            colorCode: catInfo.color,
            note: config.note,
            assignedTo: config.assignedTo,
            isPurchased: false
        };

        setLocalItems(prev => [...prev, newItem]);
        setActiveFood(null);
        setSearchTerm('');
    };

    const handleAddFromSuggestions = (item: any) => {
        const isExist = localItems.some(i => (i.foodId || i.food?.id) === item.id);
        if (isExist) {
            toast.error(`"${item.foodName}" đã có trong danh sách.`);
            return;
        }

        const isGeneric = genericFoods.some(gf => gf.id === item.id);

        const newItem: any = {
            id: Date.now(),
            foodId: item.id,
            foodName: item.foodName,
            customName: isGeneric ? item.foodName : null,
            custom_name: isGeneric ? item.foodName : null,
            quantity: 1,
            unit: getFirstUnit(item.unit),
            categoryName: 'Khác',
            note: 'Gợi ý thường mua',
            assignedTo: null,
            isPurchased: false
        };

        setLocalItems(prev => [...prev, newItem]);
        toast.success(`Đã thêm "${item.foodName}" vào danh sách! ✨`);
    };

    const handleAddFromReceived = (item: PendingShoppingItem) => {
        const isExist = localItems.some(i => (i.foodId || i.food?.id) === item.foodId);
        if (isExist) {
            toast.error(`"${item.foodName}" đã có trong danh sách.`);
            return;
        }

        const isGeneric = genericFoods.some(gf => gf.id === item.foodId);

        const newItem: any = {
            id: Date.now(),
            foodId: item.foodId,
            foodName: item.foodName,
            customName: isGeneric ? item.foodName : null,
            custom_name: isGeneric ? item.foodName : null,
            quantity: item.quantity || 1,
            unit: getFirstUnit(item.unit),
            categoryName: 'Khác',
            note: item.note || 'Bổ sung từ gợi ý',
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
        if (mode === 'CREATE' && !isHousekeeper) {
            toast.error("Chỉ người nội trợ mới có thể lập kế hoạch mới.");
            return;
        }
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
                id: (item.id && item.id < 1000000000000) ? item.id : null,
                foodId: item.foodId,
                customName: item.customName || item.custom_name || null,
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
                                        if (mode === 'CREATE') setShowResults(true);
                                        setShowSearchCue(false);
                                    }}
                                    onClick={() => {
                                        if (mode === 'CREATE') setShowResults(true);
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
                            {mode === 'CREATE' && showResults && (
                                <div className="search-results-dropdown">
                                    {searchResults.map(food => {
                                        const catInfo = getCategoryInfo(food.category || food.categoryName);
                                        return (
                                            <div key={food.id} className="search-result-item" onClick={() => handleAddClick(food)}>
                                                <span className="result-icon-wrapper" style={{ backgroundColor: catInfo.color }}>
                                                    {catInfo.icon}
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
                                        );
                                    })}
                                    {searchResults.length === 0 && (
                                        <>
                                            {searchTerm.trim().length > 1 ? (
                                                <div className="no-result">Không tìm thấy thực phẩm. Bạn có thể chọn loại khác bên dưới:</div>
                                            ) : (
                                                <div className="no-result" style={{ fontWeight: 600, color: '#4D9A80' }}>Chọn loại thực phẩm bên dưới để tự nhập:</div>
                                            )}
                                            {genericFoods.map(food => {
                                                const catInfo = getCategoryInfo(food.category || food.categoryName || food.name);
                                                return (
                                                    <div key={food.id} className="search-result-item fallback-item" onClick={() => handleAddClick(food)}>
                                                        <span className="result-icon-wrapper" style={{ backgroundColor: catInfo.color }}>
                                                            {catInfo.icon}
                                                        </span>
                                                        <span className="result-name" style={{ fontWeight: 600 }}>{food.name || food.foodName}</span>
                                                        <span className="result-unit">{food.unit || 'kg'}</span>
                                                        <button className="add-btn-small" onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddClick(food);
                                                        }}>
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* 4. HIỂN THỊ POPOVER KHI CÓ ACTIVE FOOD */}
                            {mode === 'CREATE' && activeFood && (
                                <div className="popover-anchor">
                                    <AddItemPopover
                                        foodName={activeFood.name || activeFood.foodName}
                                        foodIcon={getCategoryInfo(activeFood.category || activeFood.categoryName).icon}
                                        unit={activeFood.unit || 'kg'}
                                        members={members}
                                        onConfirm={handleConfirmAddItem}
                                        onCancel={() => setActiveFood(null)}
                                        commonUnits={systemUnits}
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
                        {isHousekeeper && (<button
                            className={`suggestions-toggle-btn ${showSuggestions ? 'active' : ''}`}
                            onClick={() => setShowSuggestions(prev => !prev)}
                            title="Bật/Tắt Gợi ý thực phẩm"
                        >
                            💡 Gợi ý
                        </button>
                        )}
                        <button className="close-btn-top" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="modal-body-layout">
                    {showSuggestions && (
                        <div className="modal-left-column">
                            <ReceivedItems onItemAdd={handleAddFromReceived} />
                            <FrequentItems
                                familyId={familyId}
                                plans={plans}
                                onItemAdd={handleAddFromSuggestions}
                                canCreatePlan={isHousekeeper}
                            />
                        </div>
                    )}

                    <div className="modal-right-column">
                        <div className="modal-body-scroll">
                            {groupedItems && Object.keys(groupedItems).map(categoryName => {
                                const group = groupedItems[categoryName];
                                return (
                                    <CategoryGroup
                                        key={categoryName}
                                        categoryName={categoryName}
                                        mode={mode}
                                        members={members}
                                        items={group.items}
                                        icon={categoryIconMap[group.iconKey] || '📦'}
                                        categoryColor={group.color || '#F1F5F9'}
                                        onUpdate={handleUpdateItem}
                                        onDelete={handleDeleteItem}
                                        onToggleStatus={handleToggleItemStatus}
                                        filterStatus={filterStatus}
                                        foodUnitsMap={foodUnitsMap}
                                        systemUnits={systemUnits}
                                    />
                                )
                            }
                            )};

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
                                <button className="import-fridge-btn" onClick={() => setShowImportReview(true)}>
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

            {showImportReview && (
                <div className="import-review-overlay" onClick={() => setShowImportReview(false)}>
                    <div className="import-review-container" onClick={(e) => e.stopPropagation()}>
                        <div className="import-review-header">
                            <h3>Nhập thực phẩm vào tủ lạnh</h3>
                            <button className="close-btn-top" onClick={() => setShowImportReview(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="import-review-body">
                            {itemsToImport.map(item => {
                                const draft = importDrafts[item.id] || {
                                    quantity: item.quantity,
                                    storageLocation: 'COOL',
                                    specificLocation: '',
                                    expiryDate: '',
                                    note: item.note || ''
                                };
                                const updateDraft = (fields: Partial<ImportDraft>) => {
                                    setImportDrafts(prev => ({
                                        ...prev,
                                        [item.id]: {
                                            ...prev[item.id],
                                            ...fields
                                        }
                                    }));
                                };
                                const catInfo = getCategoryInfo(item.categoryName || item.food?.category);
                                return (
                                    <div key={item.id} className="import-review-item-card">
                                        <div className="import-review-item-info">
                                            <div className="import-review-item-icon" style={{ backgroundColor: catInfo.color }}>
                                                {catInfo.icon}
                                            </div>
                                            <div className="import-review-item-name">
                                                {item.customName || item.custom_name || item.foodName}
                                            </div>
                                        </div>
                                        <div className="import-review-fields-grid">
                                            <div className="import-review-field">
                                                <label>Số lượng nhập <span className="required-star">*</span></label>
                                                <input
                                                    type="number"
                                                    value={draft.quantity}
                                                    min="0.1"
                                                    step="any"
                                                    onChange={(e) => updateDraft({ quantity: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="import-review-field">
                                                <label>Đơn vị</label>
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    disabled
                                                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                                                />
                                            </div>
                                            <div className="import-review-field">
                                                <label>Hạn sử dụng <span className="required-star">*</span></label>
                                                <input
                                                    type="date"
                                                    value={draft.expiryDate}
                                                    onChange={(e) => updateDraft({ expiryDate: e.target.value })}
                                                />
                                            </div>
                                            <div className="import-review-field">
                                                <label>Vị trí lưu trữ <span className="required-star">*</span></label>
                                                <select
                                                    value={draft.storageLocation}
                                                    onChange={(e) => updateDraft({ storageLocation: e.target.value as any })}
                                                >
                                                    {storageLocationOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="import-review-field">
                                                <label>Vị trí cụ thể</label>
                                                <select
                                                    value={draft.specificLocation}
                                                    onChange={(e) => updateDraft({ specificLocation: e.target.value })}
                                                >
                                                    <option value="">Chọn vị trí cụ thể</option>
                                                    {specificLocationOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="import-review-field wide">
                                                <label>Ghi chú</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ghi chú thêm..."
                                                    value={draft.note}
                                                    onChange={(e) => updateDraft({ note: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="import-review-footer">
                            <button className="import-review-btn-cancel" onClick={() => setShowImportReview(false)}>Hủy</button>
                            <button className="import-review-btn-confirm" onClick={handleConfirmImport}>Nhập vào tủ lạnh</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShoppingModal;
