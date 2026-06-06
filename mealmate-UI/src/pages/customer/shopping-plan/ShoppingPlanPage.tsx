'use client';
import DatePicker from '@/components/common/DatePicker';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DailyPlanGrid from '@/components/shopping-plan/DailyPlanGrid';
import FrequentItems from '@/components/shopping-plan/FrequentItems';
import NoteSection from '@/components/shopping-plan/NoteSection';
import ProgressSection from '@/components/shopping-plan/ProgressSection';
// import { useAuth } from '@/context/AuthContext';

import ToggleSwitch from '@/components/common/ToggleSwitch';
import ShoppingModal from '@/components/shopping-plan/popup-modal/ShoppingModal';
import type { DailyPlanCardData } from '@/features/shopping-plan/shopping';
import { getCurrentFamily, getPlanDetail, getWeeklySummary } from '@/features/shopping-plan/shoppingApi';
import { Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import './ShoppingPlanPage.css';

const ShoppingPlanPage: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState('2026-06-01');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'CREATE' | 'DETAIL'>('CREATE');
    const [selectedListData, setSelectedListData] = useState<any>(null);
    // const canCreatePlan = user?.role === 'CUSTOMER'; // Thay đổi sau để pbiet với ng nội trợ
    const [, setLoading] = useState(false);
    const [familyId, setFamilyId] = useState<number | null>(null);
    const [plans, setPlans] = useState<DailyPlanCardData[]>([]);
    const [type, setType] = useState<'DAY' | 'WEEK'>('DAY');

    const fetchFamilyInfo = async () => {
        try {
            const family = await getCurrentFamily();
            if (family?.id) {
                setFamilyId(Number(family.id));
                if (family.name) {
                    localStorage.setItem("currentFamilyName", String(family.name).trim());
                }
            } else {
                setFamilyId(null);
                localStorage.removeItem("currentFamilyName");
            }
        } catch (error: any) {
            console.error("Lỗi lấy gia đình:", error.message);
            setFamilyId(null);
        }
    };
    const fetchSummary = async () => {
        if (!familyId) return;
        try {
            setLoading(true);
            const data = await getWeeklySummary(familyId, selectedDate);
            setPlans(data);
        } catch (error: any) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchFamilyInfo();
    }, []);
    useEffect(() => {
        if (familyId) {
            fetchSummary();
        }
    }, [familyId, selectedDate]);
    const fetchPlanDetail = async (date: string) => {
        if (!familyId) return;
        try {
            setLoading(true);
            const items = await getPlanDetail(familyId, date);
            return items;
        } catch (error: any) {
            console.error("Lỗi khi lấy chi tiết kế hoạch:", error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleOpenCreateModal = async (date: string) => {
        if (!familyId) return;
        try {
            setModalMode('CREATE');
            setSelectedDate(date);
            setIsModalOpen(true);
            setSelectedListData({
                planned_date: date,
                items: []
            });
        }
        catch (error: any) {
            console.log("Lỗi khi lấy chi tiết kế hoạch: ", error.message);
            setIsModalOpen(false);
        }

    };

    const handleOpenDetailModal = async (date: string) => {
        if (!familyId) return;
        try {
            const planSummary = plans.find(p => p.plannedDate === date);
            setModalMode('DETAIL');
            setIsModalOpen(true);
            setSelectedDate(date);
            const items = await fetchPlanDetail(date);
            setSelectedListData({
                planned_date: date,
                listId: planSummary?.listId,
                items: items || []
            });
        } catch (error: any) {
            console.log("Lỗi khi lấy chi tiết kế hoạch: ", error.message);
            setIsModalOpen(false);
        }
    };


    return (
        <>
            <div className="shopping-layout">
                <Sidebar />
                <div className="shopping-main-content">
                    <Topbar
                        title="Kế hoạch đi chợ"
                    />
                    <div className="shopping-page-body">
                        {/* 3. Toolbar: DatePicker và Nút lập kế hoạch */}
                        <div className="plan-toolbar">
                            <DatePicker
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                            />
                            <div className="toolbar-center">
                                <ToggleSwitch value={type} onChange={(val) => setType(val)} />
                            </div>
                            {/* canCreatePlan &&  */}
                            {(
                                <button className="btn-create-plan"
                                    onClick={() => handleOpenCreateModal(selectedDate)}>
                                    <Plus size={18} />
                                    <span></span>
                                    Lập kế hoạch mới
                                </button>
                            )}
                        </div>

                        <div className="shopping-plan-workspace">
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

                            {/* 5. Widgets bên cạnh board */}
                            <div className="dashboard-widgets">
                                <NoteSection
                                    note={plans.find(p => p.plannedDate === selectedDate)?.note || ''}
                                    listId={plans.find(p => p.plannedDate === selectedDate)?.listId}
                                    onSaveSuccess={fetchSummary}
                                />
                                <FrequentItems
                                    familyId={familyId}
                                    plans={plans}
                                    onAddSuccess={fetchSummary}
                                />
                                <ProgressSection
                                    percentage={45}
                                    message="Còn 6 danh mục cần hoàn thành cho hôm nay"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ShoppingModal
                isOpen={isModalOpen}
                mode={modalMode}
                data={selectedListData}
                familyId={familyId}
                onSuccess={fetchSummary}
                onModeChange={(newMode) => setModalMode(newMode)}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default ShoppingPlanPage;



