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
                {/* Hàng 1 (Icon thực phẩm + số món) */}
                <div className="shopping-card-row row-food">
                    <div className="icon-carrot-wrapper">🥕</div> {/* sau sẽ import svg icon vào cho đồng bộ */}
                    <span className="item-count-text">{data.totalItems} món</span>
                </div>

                {/* Hàng 2 (Icon người + 'Phụ trách' + Tên người + nút ...) */}
                <div className="shopping-card-row row-assignee">
                    <div className="assignee-label">
                        <div className="avatar-mini-placeholder">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <span>Phụ trách</span>
                    </div>

                    <div className="assignee-actions">
                        <div className={`name-tag ${data.assigneeNames?.length > 0 ? 'is-count' : ''}`}>
                            {data.assigneeNames && data.assigneeNames.length > 0
                                ? `${data.assigneeNames.length} người`
                                : 'Chưa giao'}
                        </div>
                    </div>
                </div>

                {/* Hàng 3 Badge Trạng thái Đã mua */}
                <div className="shopping-card-status-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Đã mua {data.purchasedItems}/{data.totalItems}
                </div>
            </div>
        </div>
    );
};
export default DailyPlanCard;