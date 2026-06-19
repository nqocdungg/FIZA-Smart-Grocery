import { updateShoppingListNote } from '@/features/shopping-plan/shoppingApi';
import { Check, Edit3 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import './NoteSection.css';

interface NoteSectionProps {
    note?: string;
    listId?: number;
    onSaveSuccess?: () => void;
    date?: string;
}

const NoteSection: React.FC<NoteSectionProps> = ({ note = '', listId, onSaveSuccess, date }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempNote, setTempNote] = useState(note);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setTempNote(note || '');
    }, [note]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [isEditing]);

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

    const noteLines = tempNote.trim() !== '' ? tempNote.split('\n') : (listId && ['(Chưa có ghi chú)']);
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short' }).format(d);
    };
    return (
        <div className={`note-container ${isEditing ? 'is-editing' : ''}`}>
            <div className="note-header">
                <div className="note-title-group">
                    <div className="note-accent-dot"></div>
                    <h3 className="note-title">Ghi chú</h3>
                    <div className="note-subtitle">{formatDate(date)}</div>
                </div>
                <div className="note-actions">
                    {isEditing ? (
                        <button className="note-btn save" onClick={handleSave}>
                            <Check size={16} />
                            <span>Lưu</span>
                        </button>
                    ) : (
                        <button className="note-btn edit" onClick={() => setIsEditing(true)}>
                            <Edit3 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="note-body">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        className="note-textarea"
                        value={tempNote}
                        onChange={(e) => {
                            setTempNote(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder="Nhập nội dung cần ghi chú..."
                    />
                ) : (
                    <div className="note-display">
                        {tempNote ? (
                            tempNote.split('\n').map((line, i) => (
                                <p key={i} className="note-text-line">{line}</p>
                            ))
                        ) : (
                            <p className="note-placeholder">Không có ghi chú cho ngày này.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoteSection;
