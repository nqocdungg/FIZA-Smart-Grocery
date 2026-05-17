import DatePicker from '@/components/common/DatePicker';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DailyPlanGrid from '@/components/shopping-plan/DailyPlanGrid';
import FrequentItems from '@/components/shopping-plan/FrequentItems';
import NoteSection from '@/components/shopping-plan/NoteSection';
import ProgressSection from '@/components/shopping-plan/ProgressSection';
// import { useAuth } from '@/context/AuthContext';

import MOCK_DETAIL_DATA from '@/components/shopping-plan/mock';
import ShoppingModal from '@/components/shopping-plan/popup-modal/ShoppingModal';
import type { DailyPlanCardData } from '@/features/shopping-plan/shopping';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import './ShoppingPlanPage.css';

const ShoppingPlanPage: React.FC = () => {
    // const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState('2026-05-09');
    const [isModalOpen, setIsModalOpen] = useState(false); // State để điều khiển mở/đóng modal
    const [modalMode, setModalMode] = useState<'CREATE' | 'DETAIL'>('CREATE'); // State để xác định mode của modal
    const [selectedListData, setSelectedListData] = useState<any>(null); // State để lưu data khi mở modal ở mode DETAIL
    // const canCreatePlan = user?.role === 'CUSTOMER'; // Thay đổi sau để pbiet với ng nội trợ

    const handleOpenCreateModal = () => {
        setModalMode('CREATE');
        setSelectedListData(null); // Tạo mới nên không có data cũ
        setIsModalOpen(true);
    };

    const handleOpenDetailModal = (date: string) => {
        const plan = plans.find(p => p.planned_date === date);
        setModalMode('DETAIL');
        // 3. Truyền data (sau này sẽ gọi API lấy detail theo listId)
        // Tạm thời truyền mock hoặc object rỗng để test giao diện
        setSelectedListData({
            planned_date: date,
            items: MOCK_DETAIL_DATA.items // Dùng mock data để hiện list món ăn
        });

        setIsModalOpen(true);
    };


    // Mock data cho 7 ngày (sau này sẽ gọi từ shoppingApi.ts)
    const [plans, setPlans] = useState<DailyPlanCardData[]>([
        { planned_date: '2026-05-04', dayOfWeek: 'Thứ 2', displayDate: '4/5', totalItems: 6, purchasedItems: 3, assigneeNames: ['Xuân'] },
        { planned_date: '2026-05-05', dayOfWeek: 'Thứ 3', displayDate: '5/5', totalItems: 7, purchasedItems: 3, assigneeNames: ['Xuân'] },
        { planned_date: '2026-05-06', dayOfWeek: 'Thứ 4', displayDate: '6/5', totalItems: 4, purchasedItems: 3, assigneeNames: ['Xuân'] },
        { planned_date: '2026-05-07', dayOfWeek: 'Thứ 5', displayDate: '7/5', totalItems: 5, purchasedItems: 3, assigneeNames: ['Xuân'] },
        { planned_date: '2026-05-08', dayOfWeek: 'Thứ 6', displayDate: '8/5', totalItems: 12, purchasedItems: 3, assigneeNames: ['Xuân'] },
        { planned_date: '2026-05-09', dayOfWeek: 'Thứ 7', displayDate: '9/5', totalItems: 3, purchasedItems: 3, assigneeNames: ['Xuân'] },
        { planned_date: '2026-05-09', dayOfWeek: 'CN', displayDate: '10/5', totalItems: 8, purchasedItems: 3, assigneeNames: ['Xuân'] },
    ]);

    return (
        <>
            <div className="shopping-layout">
                <Sidebar />
                <div className="shopping-main-content">
                    {/* 2. Topbar chung của dự án, cần thay đổi tham số vào */}
                    <Topbar />
                    {/* title="Kế hoạch đi chợ" */}
                    <div className="shopping-page-body">
                        {/* 3. Toolbar: DatePicker và Nút lập kế hoạch */}
                        <div className="plan-toolbar">
                            <DatePicker
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                            />
                            {/* canCreatePlan &&  */}
                            {(
                                <button className="btn-create-plan"
                                    onClick={handleOpenCreateModal}>
                                    <Plus size={18} />
                                    <span></span>
                                    Lập kế hoạch mới
                                </button>
                            )}
                        </div>

                        {/* 4. Grid hiển thị 7 ngày */}
                        <div className="grid-section">
                            <DailyPlanGrid
                                plans={plans}
                                activeDate={selectedDate}
                                onCardClick={(date) => {
                                    setSelectedDate(date);
                                    handleOpenDetailModal(date);
                                }}

                            />
                        </div>

                        {/* 5. Widgets phía dưới (Progress, Frequent, Notes) */}
                        <div className="dashboard-widgets">
                            <ProgressSection
                                percentage={45}
                                message="Còn 6 danh mục cần hoàn thành cho hôm nay"
                            />
                            <FrequentItems />
                            <NoteSection />
                        </div>
                    </div>
                </div>
            </div>
            <ShoppingModal
                isOpen={isModalOpen}
                mode={modalMode}
                data={selectedListData}
                onModeChange={(newMode) => setModalMode(newMode)}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default ShoppingPlanPage;



