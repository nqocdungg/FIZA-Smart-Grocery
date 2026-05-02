import React from 'react';

/**
 * 1. Component ô nhập liệu (Input) dùng chung
 */
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  rightLabel?: React.ReactNode;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, rightLabel, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '14px', color: '#0B735F', fontWeight: '500' }}>
          {label}
        </label>
        {rightLabel}
      </div>
      <input
        {...props}
        style={{
          width: '100%',
          padding: '16px 24px',
          backgroundColor: '#F7FAFC',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
          ...props.style,
        }}
      />
    </div>
  );
};

/**
 * 2. Component Nút bấm (Button) dùng chung
 */
interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ children, ...props }) => {
  return (
    <button
      {...props}
      style={{
        width: '100%',
        padding: '16px',
        backgroundColor: '#4D9A80',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        letterSpacing: '1px',
        cursor: 'pointer',
        marginTop: '8px',
        transition: '0.3s',
        ...props.style,
      }}
    >
      {children}
    </button>
  );
};

/**
 * 3. Component Bố cục chính (Layout) dùng chung cho Login & Register
 */
interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div style={layoutStyles.viewport}>
      <div style={layoutStyles.mainCard}>
        {/* Cột trái: Branding */}
        <div style={layoutStyles.leftSection}>
          <div style={layoutStyles.brandContent}>
            <div style={layoutStyles.logoRow}>
              <div style={layoutStyles.logoIcon} />
              <span style={layoutStyles.logoText}>FIZA</span>
            </div>
            <div style={layoutStyles.welcomeGroup}>
              <h1 style={layoutStyles.title}>Chào mừng bạn đến với Fiza</h1>
              <p style={layoutStyles.slogan}>Fiza gắn kết - Bếp nhà gọn hết</p>
            </div>
          </div>
          <div style={layoutStyles.illustrationWrapper}>
            <img 
              src="https://placehold.co/492x463" 
              alt="Illustration" 
              style={{ width: '100%', display: 'block' }} 
            />
          </div>
        </div>

        {/* Cột phải: Form Content */}
        <div style={layoutStyles.rightSection}>
          <div style={layoutStyles.formContainer}>
            <header style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '16px', color: '#0B735F', fontWeight: '600' }}>{title}</h2>
              <p style={{ fontSize: '14px', color: '#88938E' }}>{subtitle}</p>
            </header>
            {children}
          </div>
        </div>
      </div>

      {/* Footer chung */}
      <div style={layoutStyles.pageFooter}>
        <span>© 2024 FIZA Smart Kitchen Systems</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          <span>Chính sách</span>
          <span>Tư vấn khách hàng</span>
          <span>Trở thành Fiza-ers</span>
        </div>
      </div>
    </div>
  );
};

const layoutStyles: Record<string, React.CSSProperties> = {
  viewport: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#4D9A80',
    padding: '20px 40px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: 'border-box',
  },
  mainCard: {
    display: 'flex',
    width: '100%',
    maxWidth: '1240px',
    height: 'auto',
    minHeight: '750px',
    backgroundColor: 'white',
    borderRadius: '32px',
    boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    marginBottom: '40px',
  },
  leftSection: {
    flex: 1,
    backgroundColor: '#F0F4F2',
    padding: '48px 64px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  brandContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  logoRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoIcon: { width: '24px', height: '30px', backgroundColor: '#0B735F' },
  logoText: { fontSize: '28px', fontWeight: '600', color: '#0B735F' },
  welcomeGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  title: { fontSize: '40px', fontWeight: '700', color: '#0B735F', lineHeight: '1.2', maxWidth: '400px' },
  slogan: { fontSize: '16px', fontStyle: 'italic', color: '#0B735F', opacity: 0.8 },
  illustrationWrapper: { borderRadius: '24px', overflow: 'hidden', backgroundColor: 'white', marginTop: '24px' },
  rightSection: { flex: 1, backgroundColor: 'white', padding: '48px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  formContainer: { width: '100%', maxWidth: '400px', margin: '0 auto' },
  pageFooter: {
    width: '100%',
    maxWidth: '1240px',
    display: 'flex',
    justifyContent: 'space-between',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '12px',
    paddingBottom: '20px',
  },
};