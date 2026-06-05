import React from 'react';
import './CategoryCard.css';

interface CategoryCardProps {
    title: string;
    icon: string;
    itemCount: number;
    children: React.ReactNode;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, icon, itemCount, children }) => {
    return (
        <div className="weekly-category-card">
            <div className="card-header">
                <div className="header-left">
                    <div className="category-icon-wrap">{icon}</div>
                    <h3 className="category-title">{title}</h3>
                </div>
                <span className="item-count-label">{itemCount} MỤC</span>
            </div>
            <div className="card-body-list">
                {children}
            </div>
        </div>
    );
};

export default CategoryCard;