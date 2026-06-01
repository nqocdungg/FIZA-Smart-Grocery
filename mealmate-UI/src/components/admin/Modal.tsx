import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, width = '600px' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--fiza-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: '#f8fafc', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Modal;
