import type { DailyPlanCardData } from '@/features/shopping-plan/shopping';
import React from 'react';
import DailyPlanCard from './DailyPlanCard';
import './DailyPlanGrid.css';

interface DailyPlanGridProps {
    plans: DailyPlanCardData[];
    activeDate?: string; // Ngày đang được chọn (để truyền vào isActive của Card)
    onCardClick?: (date: string) => void;
}

const DailyPlanGrid: React.FC<DailyPlanGridProps> = ({ plans, activeDate, onCardClick }) => {
    return (
        <div className="daily-plan-grid-wrapper">
            <div className="daily-plan-grid-container">
                {plans.map((plan) => (
                    <DailyPlanCard
                        key={plan.planned_date}
                        data={plan}
                        isActive={plan.planned_date === activeDate}
                        onClick={() => onCardClick?.(plan.planned_date)}
                    />
                ))}
            </div>

            {/* Scroll indicator (Thanh cuộn giả lập nếu cần giống Figma, 
          tuy nhiên dùng scroll mặc định của trình duyệt sẽ tốt hơn) */}
            {/* <div className="custom-scrollbar-track">
        <div className="custom-scrollbar-thumb"></div>
      </div> */}
        </div>
    );
};

export default DailyPlanGrid;