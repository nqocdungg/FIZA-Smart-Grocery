import React, { useState, useEffect } from 'react';
import { Edit3, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateShoppingListNote } from '@/features/shopping-plan/shoppingApi';
import './NoteSection.css';

interface NoteSectionProps {
    note?: string;
    listId?: number;
    onSaveSuccess?: () => void;
}

const NoteSection: React.FC<NoteSectionProps> = ({ note = '', listId, onSaveSuccess }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempNote, setTempNote] = useState(note);

    useEffect(() => {
        setTempNote(note || '');
    }, [note]);

    const handleSave = async () => {
        if (!listId) {
            toast.error('Vui lòng chọn ngày có kế hoạch để sửa ghi chú.');
            return;
        }
        try {
            await updateShoppingListNote(listId, tempNote);
            setIsEditing(false);
            toast.success('Lưu ghi chú thành công! ✨');
            if (onSaveSuccess) {
                onSaveSuccess();
            }
        } catch (error: any) {
            toast.error('Lưu ghi chú thất bại: ' + error.message);
        }
    };

    const noteLines = tempNote.trim() !== '' ? tempNote.split('\n') : (listId ? ['(Chưa có ghi chú)'] : [
        'Nhớ hoàn thành trước thứ Sáu',
        'Mua thịt về để ngăn đông tủ lạnh'
    ]);

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
                <div className="note-actions">
                    {isEditing ? (
                        <button className="note-edit-btn" onClick={handleSave} title="Lưu ghi chú">
                            <Check size={18} color="#44BD97" />
                        </button>
                    ) : (
                        <button className="note-edit-btn" onClick={() => setIsEditing(true)} title="Sửa ghi chú">
                            <Edit3 size={18} color="#6E7A74" />
                        </button>
                    )}
                </div>
            </div>

            <div className="note-content-box">
                {isEditing ? (
                    <textarea
                        className="note-textarea"
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        placeholder="Nhập ghi chú..."
                        rows={5}
                    />
                ) : (
                    noteLines.map((line, index) => (
                        <div key={index} className="note-line">
                            {line}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NoteSection;