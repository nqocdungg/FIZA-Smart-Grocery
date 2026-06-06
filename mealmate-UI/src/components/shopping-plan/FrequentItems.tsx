import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getFrequentItems, getPlanDetail, saveShoppingPlan } from '@/features/shopping-plan/shoppingApi';
import type { DailyPlanCardData } from '@/features/shopping-plan/shopping';
import './FrequentItems.css';

interface FrequentItemsProps {
    familyId: number | null;
    plans: DailyPlanCardData[];
    onAddSuccess?: () => void;
}

const FrequentItems: React.FC<FrequentItemsProps> = ({ familyId, plans, onAddSuccess }) => {
    const [frequentItems, setFrequentItems] = useState<any[]>([]);

    useEffect(() => {
        if (familyId) {
            getFrequentItems(familyId)
                .then(data => setFrequentItems(data))
                .catch(err => {
                    console.error("Lỗi khi lấy thực phẩm thường mua:", err);
                });
        }
    }, [familyId]);

    const getTodayDateString = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const handleAddClick = async (item: any) => {
        if (!familyId) {
            toast.error("Không tìm thấy thông tin gia đình.");
            return;
        }

        const todayDate = getTodayDateString();
        
        try {
            toast.loading(`Đang thêm ${item.foodName}...`, { id: "frequent-add" });
            
            // Tìm xem ngày hôm nay đã có kế hoạch chưa
            const todayPlan = plans.find(p => p.plannedDate === todayDate);
            let existingItems: any[] = [];
            
            if (todayPlan && todayPlan.listId) {
                // Fetch danh sách hiện tại của hôm nay
                const details = await getPlanDetail(familyId, todayDate);
                existingItems = details || [];
            }

            // Kiểm tra xem món ăn này đã có sẵn trong danh sách hôm nay chưa
            const isExist = existingItems.some((ex: any) => (ex.foodId || ex.food?.id) === item.id);
            if (isExist) {
                toast.error(`"${item.foodName}" đã có trong danh sách hôm nay rồi.`, { id: "frequent-add" });
                return;
            }

            // Map danh sách hiện tại thành DTO payload
            const formattedExisting = existingItems.map((ex: any) => ({
                foodId: Number(ex.foodId || ex.food?.id),
                quantity: Number(ex.quantity),
                unit: ex.unit || "kg",
                assignedTo: ex.assignedTo || ex.assignee?.id || null,
                note: ex.note || "",
                isPurchased: ex.isPurchased || false
            }));

            // Thêm thực phẩm thường mua
            const newItem = {
                foodId: Number(item.id),
                quantity: 1,
                unit: item.unit || "kg",
                assignedTo: null,
                note: "Thêm nhanh từ thực phẩm thường mua",
                isPurchased: false
            };

            const payload = {
                familyId,
                plannedDate: todayDate,
                items: [...formattedExisting, newItem]
            };

            await saveShoppingPlan(payload);
            toast.success(`Đã thêm "${item.foodName}" vào hôm nay! ✨`, { id: "frequent-add" });
            
            if (onAddSuccess) {
                onAddSuccess();
            }
        } catch (error: any) {
            console.error("Lỗi khi thêm nhanh thực phẩm:", error);
            toast.error("Thêm thực phẩm thất bại: " + error.message, { id: "frequent-add" });
        }
    };

    // Fallback data nếu danh sách trống hoặc API chưa có dữ liệu
    const displayItems = frequentItems.length > 0 ? frequentItems : [
        { id: 101, foodName: 'Sữa tươi nguyên chất', unit: '2L' },
        { id: 102, foodName: 'Trứng gà ta', unit: '10 quả' },
    ];

    return (
        <div className="frequent-items-container">
            {/* Header */}
            <div className="frequent-header">
                <div className="frequent-icon-box">
                    <div className="frequent-icon-inner">🛒</div>
                </div>
                <h3 className="frequent-title">Thực phẩm thường mua</h3>
            </div>

            {/* List Items */}
            <div className="frequent-list">
                {displayItems.map((item) => (
                    <div key={item.id} className="frequent-row">
                        <div className="frequent-row-left">
                            <div className="frequent-item-check">
                                <div className="check-dot"></div>
                            </div>
                            <span className="frequent-item-name">{item.foodName}</span>
                        </div>

                        <div className="frequent-row-right">
                            <span className="frequent-item-unit">{item.unit}</span>
                            <button
                                className="frequent-add-btn"
                                onClick={() => handleAddClick(item)}
                                title="Thêm vào hôm nay"
                            >
                                +
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FrequentItems;