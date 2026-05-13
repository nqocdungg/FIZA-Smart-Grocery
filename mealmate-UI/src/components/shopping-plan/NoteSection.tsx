import React from 'react';
import './NoteSection.css';

interface NoteSectionProps {
    note?: string;
}

const NoteSection: React.FC<NoteSectionProps> = ({ note }) => {
    // Logic: Tách nội dung ghi chú thành từng dòng nếu có dấu xuống dòng
    // Nếu không có note từ props, ta hiển thị nội dung mặc định hoặc để trống
    const noteLines = note ? note.split('\n') : [
        'Nhớ hoàn thành trước thứ Sáu',
        'Mua thịt về để ngăn đông tủ lạnh'
    ];

    return (
        <div className="note-section-container">
            <div className="note-header">
                <div className="note-icon-wrapper">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/1201/1201111.png"
                        alt="note-icon"
                        className="note-floating-icon"
                    />
                </div>
                <h3 className="note-title">Ghi chú</h3>
            </div>

            <div className="note-content-box">
                {noteLines.map((line, index) => (
                    <div key={index} className="note-line">
                        {line}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NoteSection;