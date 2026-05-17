import React from 'react';
import './ProgressSection.css';

interface ProgressSectionProps {
    percentage: number; // Ví dụ: 45
    message: string;    // Ví dụ: "Còn 6 danh mục cần hoàn thành cho hôm nay"
}

const ProgressSection: React.FC<ProgressSectionProps> = ({ percentage, message }) => {
    return (
        <div className="progress-section-container">
            {/* Header của Widget */}
            <div className="progress-header">
                <h3 className="progress-title">Tiến độ mua sắm</h3>
                <div className="progress-icon-check">
                    {/* Icon check trắng mờ từ Figma */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }} />
                    </svg>
                </div>
            </div>

            {/* Phần hiển thị con số và thanh tiến độ */}
            <div className="progress-body">
                <h1 className="progress-percentage-text">{percentage}%</h1>

                <div className="progress-bar-track">
                    {/* Thanh fill màu trắng, chiều rộng thay đổi theo props percentage */}
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>

                <p className="progress-message">{message}</p>
            </div>
        </div>
    );
};

export default ProgressSection;