import type { DailyPlanCardData } from '@/features/shopping-plan/shopping';
import './DailyPlanCard.css';

interface DailyPlanCardProps {
    data: DailyPlanCardData;
    isActive?: boolean; // truyền thêm prop để highlight card
    onClick?: () => void;
}
const DailyPlanCard = ({ data, isActive, onClick }: DailyPlanCardProps) => {
    return (
        <div className={`shopping-card-container ${isActive ? 'active' : ''}`}
            onClick={onClick}>
            <div className={`shopping-card-date-badge ${isActive ? 'active' : ''}`}>
                <span className={`shopping-card-day-text ${isActive ? 'active' : ''}`}>
                    {data.dayOfWeek}
                </span>
                <span className={`shopping-card-date-text ${isActive ? 'active' : ''}`}>
                    {data.displayDate}
                </span>
            </div>

            <div className="shopping-card-body">
                <div className="shopping-card-row">
                    <div className="icon-carrot-wrapper">🥕</div> {/* sau sẽ import svg icon vào cho đồng bộ */}
                    <span className="item-count-text">{data.totalItems} món</span>
                </div>

                <div className="shopping-card-row">
                    <div className="assignee-label">
                        <div className="avatar-mini-placeholder"></div>
                        <span>Phụ trách</span>
                    </div>
                    {/* Hiển thị tên người đầu tiên trong mảng hoặc báo 'Chưa giao' */}
                    <div className="name-tag">
                        {data.assigneeNames && data.assigneeNames.length > 0 ? data.assigneeNames[0] : 'Chưa giao'}
                    </div>
                    <div className="more-icon">•••</div>
                </div>
                {/* Badge Trạng thái Đã mua */}
                <div className="shopping-card-status-badge">
                    Đã mua {data.purchasedItems}/{data.totalItems}
                </div>
            </div>
        </div>
    );
};
export default DailyPlanCard;