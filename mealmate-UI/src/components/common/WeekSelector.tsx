import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import './WeekSelector.css';

interface WeekSelectorProps {
    label: string;
    onPrev: () => void;
    onNext: () => void;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({ label, onPrev, onNext }) => {
    return (
        <div className="week-selector">
            <button className="nav-btn" onClick={onPrev}>
                <ChevronLeft size={20} />
            </button>

            <span className="week-label">{label}</span>

            <button className="nav-btn" onClick={onNext}>
                <ChevronRight size={20} />
            </button>
        </div>
    );
};

export default WeekSelector;