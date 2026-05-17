import DatePicker from "@/components/common/DatePicker";
import { Edit3, Filter, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MOCK_DETAIL_DATA from "../mock";
import AddItemPopover from "../popover-modal/AddItemPopover";
import CategoryGroup from "./CategoryGroup";
import './ShoppingModal.css';
interface ShoppingModalProps {
    isOpen: boolean;
    mode: 'CREATE' | 'DETAIL';
    data?: any; // Nếu là DETAIL thì truyền data vào
    onModeChange?: (newMode: 'CREATE' | 'DETAIL') => void;
    onClose: () => void;
}

const ShoppingModal = ({ isOpen, mode, data, onModeChange, onClose }: ShoppingModalProps) => {
    if (!isOpen) return null;
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [activeFood, setActiveFood] = useState<any | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const displayData = data || MOCK_DETAIL_DATA;
    const getItemsByCategory = (category: string) => {
        return displayData?.items?.filter((item: any) => item.food?.category === category) || [];
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.trim().length > 1) {
                // Gọi API thực tế ở đây
                // const results = await searchFoods(searchTerm);
                // setSearchResults(results);

                // MOCK DATA để test UI
                setSearchResults([
                    { id: 101, name: 'Cà rốt Đà Lạt', unit: 'kg', category: 'Rau củ' },
                    { id: 102, name: 'Cà chua bi', unit: 'kg', category: 'Rau củ' }
                ]);
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
        setActiveFood(food); // Lưu món ăn đang chọn để hiện Popover
        setShowResults(false); // Ẩn danh sách tìm kiếm
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header: Dùng chung */}
                <div className="modal-header">
                    <div className="modal-header-left">
                        <h2 className="modal-title">
                            {mode === 'CREATE' ? 'Lập kế hoạch mới' : 'Chi tiết kế hoạch'}
                        </h2>
                        <div className="modal-datepicker-wrapper">
                            <DatePicker
                                value={displayData?.planned_date || '2026-05-01'}
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
                                        <div key={food.id} className="search-result-item">
                                            <div className="result-info">
                                                <span className="result-icon">🥕</span>
                                                <span className="result-name">{food.name}</span>
                                            </div>
                                            <button className="add-btn-small" onClick={() => handleAddClick(food)}>
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
                                        foodName={activeFood.name}
                                        unit={activeFood.unit}
                                        onConfirm={(config) => {
                                            console.log("Thêm món:", activeFood, config);
                                            setActiveFood(null); // Đóng popover
                                            setSearchTerm(''); // Xóa ô search
                                        }}
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
                <div className="modal-body" >
                    <div className="modal-body-scroll">
                        <CategoryGroup
                            categoryName="Rau củ"
                            mode={mode}
                            items={getItemsByCategory('Rau củ')}
                        />
                        <CategoryGroup
                            categoryName="Thịt & Hải sản"
                            mode={mode}
                            items={getItemsByCategory('Thịt & Hải sản')}
                        />

                        <CategoryGroup
                            categoryName="Sữa & Trứng"
                            mode={mode}
                            items={getItemsByCategory('Sữa & Trứng')}
                        />
                        {mode === 'CREATE' && (
                            <button className="add-food-dashed-btn">+ Thêm thực phẩm</button>
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
                        <button className="delete-list-btn"> <Trash2 size={16} />Xóa danh sách</button>
                    )}

                    <div className="footer-actions">
                        <button className="cancel-btn" onClick={onClose}>Hủy</button>
                        <button className="confirm-btn">Xác nhận</button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ShoppingModal;