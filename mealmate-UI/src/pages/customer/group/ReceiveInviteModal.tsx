import React from 'react';
import './ReceiveInviteModal.css';

interface ReceiveInviteModalProps {
  isOpen: boolean;
  familyName: string;
  onAccept: () => void;
  onDecline: () => void;
}

const ReceiveInviteModal: React.FC<ReceiveInviteModalProps> = ({ isOpen, familyName, onAccept, onDecline }) => {
  if (!isOpen) return null;

  return (
    <div className="invite-overlay">
      <div className="invite-modal-card">
        <div className="invite-icon-bell">🔔</div>
        <h2 className="invite-modal-title">Lời mời vào gia đình</h2>
        <p className="invite-modal-desc">
          Tài khoản của bạn nhận được lời mời gia nhập vào nhóm gia đình: <br />
          <strong className="invite-family-highlight">"{familyName}"</strong>
        </p>
        
        <div className="invite-modal-actions">
          <button className="invite-btn-accept" onClick={onAccept}>
            Đồng ý gia nhập
          </button>
          <button className="invite-btn-decline" onClick={onDecline}>
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiveInviteModal;