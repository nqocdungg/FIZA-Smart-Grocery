import React from 'react';
import './ToggleSwitch.css';

interface ToggleSwitchProps {
    value: 'DAY' | 'WEEK';
    onChange: (val: 'DAY' | 'WEEK') => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onChange }) => {
    return (
        <div className="toggle-container">
            {/* Lớp nền trượt (Slider) giúp hiệu ứng mượt hơn */}
            <div className={`toggle-slider ${value === 'WEEK' ? 'is-week' : 'is-day'}`}></div>

            <button
                type="button"
                className={`toggle-btn ${value === 'DAY' ? 'active' : ''}`}
                onClick={() => onChange('DAY')}
            >
                Ngày
            </button>

            <button
                type="button"
                className={`toggle-btn ${value === 'WEEK' ? 'active' : ''}`}
                onClick={() => onChange('WEEK')}
            >
                Tuần
            </button>
        </div>
    );
};

export default ToggleSwitch;