import React from 'react';

import './DatePicker.css';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
}) => {
    return (
        <div className="custom-datepicker">
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export default DatePicker;