import type { DailyPlanCardData } from '@/features/shopping-plan/shopping';
import { getFrequentItems, getPlanDetail, saveShoppingPlan } from '@/features/shopping-plan/shoppingApi';
import api from '@/services/api';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import './FrequentItems.css';

interface FrequentItemsProps {
    familyId: number | null;
    plans: DailyPlanCardData[];
    onAddSuccess?: () => void;
    onItemAdd?: (item: any) => void;
    canCreatePlan?: boolean;
}

const FrequentItems: React.FC<FrequentItemsProps> = ({ familyId, plans, onAddSuccess, onItemAdd, canCreatePlan }) => {
    const [frequentItems, setFrequentItems] = useState<any[]>([]);
    const [genericFoodIds, setGenericFoodIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (familyId) {
            getFrequentItems(familyId)
                .then(data => setFrequentItems(data))
                .catch(err => {
                    console.error("Lỗi khi lấy thực phẩm thường mua:", err);
                });
        }
    }, [familyId]);

    useEffect(() => {
        api.get('/api/foods')
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                const ids = list
                    .filter((f: any) => f.name.toLowerCase().includes('khác'))
                    .map((f: any) => Number(f.id));
                setGenericFoodIds(new Set(ids));
            })
            .catch(err => {
                console.error("Lỗi lấy generic foods trong FrequentItems:", err);
            });
    }, []);

    const getTodayDateString = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const handleAddClick = async (item: any) => {
        if (onItemAdd) {
            onItemAdd(item);
            return;
        }

        if (!familyId) {
            toast.error("Không tìm thấy thông tin gia đình.");
            return;
        }

        const todayDate = getTodayDateString();

        try {
            toast.loading(`Đang thêm ${item.foodName}...`, { id: "frequent-add" });
            const todayPlan = plans.find(p => p.plannedDate === todayDate);
            let existingItems: any[] = [];

            if (todayPlan && todayPlan.listId) {
                // Fetch danh sách hiện tại của hôm nay
                const details = await getPlanDetail(familyId, todayDate);
                existingItems = details || [];
            }
            const isExist = existingItems.some((ex: any) => (ex.foodId || ex.food?.id) === item.id);
            if (isExist) {
                toast.error(`"${item.foodName}" đã có trong danh sách hôm nay rồi.`, { id: "frequent-add" });
                return;
            }

            const formattedExisting = existingItems.map((ex: any) => ({
                id: (ex.id && ex.id < 1000000000000) ? ex.id : null,
                foodId: Number(ex.foodId || ex.food?.id),
                customName: ex.customName || ex.custom_name || null,
                quantity: Number(ex.quantity),
                unit: ex.unit || "kg",
                assignedTo: ex.assignedTo || ex.assignee?.id || null,
                note: ex.note || "",
                isPurchased: ex.isPurchased || false
            }));

            // Thêm thực phẩm thường mua
            const isGeneric = genericFoodIds.has(Number(item.id));
            const newItem = {
                id: null,
                foodId: Number(item.id),
                customName: isGeneric ? item.foodName : (item.customName || item.custom_name || null),
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

    const displayItems = frequentItems.length > 0 ? frequentItems : [
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
                        <div className="frequent-item-check">
                            <div className="check-dot"></div>
                        </div>
                        <span className="frequent-item-name">{item.foodName}</span>
                        <span className="frequent-item-unit">{item.unit}</span>
                        {canCreatePlan && (<button
                            className="frequent-add-btn"
                            onClick={() => handleAddClick(item)}
                            title="Thêm vào danh sách"
                        >
                            +
                        </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FrequentItems;