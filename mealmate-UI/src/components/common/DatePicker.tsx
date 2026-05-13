import React from 'react';
// import './DatePicker.css';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
    return (
        <div className="custom-datepicker">
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <div className="calendar-icon">📅</div>  {/* sau này thay icon này bằng svg hoặc thư viện để đồng bộ với thiết kế hơn */}
        </div>
    );
};

export default DatePicker;