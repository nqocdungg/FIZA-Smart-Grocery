import React from 'react';

interface FizaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const FizaModal: React.FC<FizaModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div>
      {/* TODO: Base modal component:
        - Overlay nền tối
        - Nút X đóng ở góc trên bên phải
        - Tất cả popup không có ngoại lệ đều có nút cancel X
        - Title ở trên cùng
        - Content area cho children
      */}
      <div>
        <div>
          <h2>{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default FizaModal;
