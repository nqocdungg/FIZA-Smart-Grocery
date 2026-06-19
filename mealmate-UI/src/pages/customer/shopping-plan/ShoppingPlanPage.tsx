'use client';
import DatePicker from '@/components/common/DatePicker';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DailyPlanGrid from '@/components/shopping-plan/DailyPlanGrid';
import FrequentItems from '@/components/shopping-plan/FrequentItems';
import NoteSection from '@/components/shopping-plan/NoteSection';
import ProgressSection from '@/components/shopping-plan/ProgressSection';
import WeeklyAggregateView from '@/components/shopping-plan/weekly/WeeklyAggregateView';
import { useAuth } from '@/context/AuthContext';

import ToggleSwitch from '@/components/common/ToggleSwitch';
import ShoppingModal from '@/components/shopping-plan/popup-modal/ShoppingModal';
import type { DailyPlanCardData } from '@/features/shopping-plan/shopping';
import { getCurrentFamily, getPlanDetail, getWeeklySummary } from '@/features/shopping-plan/shoppingApi';
import { Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import './ShoppingPlanPage.css';

const ShoppingPlanPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        return today.toISOString().split('T')[0];
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'CREATE' | 'DETAIL'>('CREATE');
    const [selectedListData, setSelectedListData] = useState<any>(null);
    const canCreatePlan = user?.role === 'HOUSEKEEPER'; // Thay đổi sau để pbiet với ng nội trợ
    const [, setLoading] = useState(false);
    const [familyId, setFamilyId] = useState<number | null>(null);
    const [plans, setPlans] = useState<DailyPlanCardData[]>([]);
    const [type, setType] = useState<'DAY' | 'WEEK'>('DAY');
    const [modalDefaultFilter, setModalDefaultFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');


    // For progress section
    let total = 0;
    let purchased = 0;

    if (type === 'WEEK') {
        plans.forEach(p => {
            total += p.totalItems || 0;
            purchased += p.purchasedItems || 0;
        });
    } else {
        const activePlan = plans.find(p => p.plannedDate === selectedDate);
        total = activePlan?.totalItems || 0;
        purchased = activePlan?.purchasedItems || 0;
    }

    const percentage = total > 0 ? Math.round((purchased / total) * 100) : 0;
    const remaining = total - purchased;

    const progressMessage = total > 0
        ? (remaining > 0 ? `Còn ${remaining} món cần mua` : "Đã hoàn thành mục tiêu! ✨")
        : (type === 'WEEK' ? "Chưa có kế hoạch cho tuần này" : "Chưa có kế hoạch cho ngày này");

    const fetchFamilyInfo = async () => {
        try {
            const family = await getCurrentFamily();
            const resolvedFamilyId = Number(family?.id ?? family?.familyId);
            if (Number.isFinite(resolvedFamilyId) && resolvedFamilyId > 0) {
                setFamilyId(resolvedFamilyId);
                const resolvedFamilyName = family?.name || family?.familyName;
                if (resolvedFamilyName) {
                    localStorage.setItem("currentFamilyName", String(resolvedFamilyName).trim());
                }
            } else {
                setFamilyId(null);
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
        setModalDefaultFilter('ALL');
        const existingPlan = plans.find(p => p.plannedDate === date);
        try {
            setModalMode('CREATE');
            setSelectedDate(date);
            setIsModalOpen(true);
            if (existingPlan && existingPlan.listId) {
                const items = await fetchPlanDetail(date);
                setSelectedListData({
                    plannedDate: date,
                    listId: existingPlan.listId,
                    note: existingPlan.note || '',
                    items: items || []
                });
                toast.success("Ngày này đã có kế hoạch, bạn có thể thêm món mới vào! ✨");
            } else {
                setSelectedListData({
                    plannedDate: date,
                    listId: null,
                    note: '',
                    items: []
                });
            }
        }
        catch (error: any) {
            console.log("Lỗi khi lấy chi tiết kế hoạch: ", error.message);
            setIsModalOpen(false);
        }
    };

    const handleOpenDetailModal = async (date: string, filter: 'ALL' | 'PENDING' | 'DONE' = 'ALL') => {
        if (!familyId) return;
        try {
            setModalDefaultFilter(filter);
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
                            <div className="toolbar-center">
                                <ToggleSwitch value={type} onChange={(val) => setType(val)} />
                            </div>
                            <DatePicker
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                            />
                            {canCreatePlan &&
                                (
                                    <button className="btn-create-plan"
                                        onClick={() => handleOpenCreateModal(selectedDate)}>
                                        <Plus size={18} />
                                        <span></span>
                                        Lập kế hoạch mới
                                    </button>
                                )}
                        </div>

                        <div className="shopping-plan-workspace">
                            {/* 4. Grid hiển thị 7 ngày hoặc danh sách gộp tuần */}
                            <div className="grid-section">
                                {type === 'WEEK' ? (
                                    <WeeklyAggregateView
                                        familyId={familyId}
                                        startDate={selectedDate}
                                        onToggleSuccess={fetchSummary}
                                    />
                                ) : (
                                    <DailyPlanGrid
                                        plans={plans}
                                        activeDate={selectedDate}
                                        onCardClick={(date) => {
                                            if (selectedDate === date) {
                                                handleOpenDetailModal(date);
                                            } else {
                                                setSelectedDate(date);
                                            }
                                        }}
                                    />
                                )}
                            </div>

                            {/* 5. Widgets bên cạnh board */}
                            <div className="dashboard-widgets">
                                <ProgressSection
                                    percentage={percentage}
                                    message={progressMessage}
                                    detail={`${purchased}/${total} thực phẩm`}
                                    onClick={() => handleOpenDetailModal(selectedDate, 'PENDING')}
                                />
                                <NoteSection
                                    note={plans.find(p => p.plannedDate === selectedDate)?.note || ''}
                                    listId={plans.find(p => p.plannedDate === selectedDate)?.listId}
                                    onSaveSuccess={fetchSummary}
                                    date={selectedDate}
                                />
                                <FrequentItems
                                    familyId={familyId}
                                    plans={plans}
                                    onAddSuccess={fetchSummary}
                                    canCreatePlan={canCreatePlan}
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
                plans={plans}
                defaultFilter={modalDefaultFilter}
                onSuccess={fetchSummary}
                onModeChange={(newMode) => setModalMode(newMode)}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default ShoppingPlanPage;



