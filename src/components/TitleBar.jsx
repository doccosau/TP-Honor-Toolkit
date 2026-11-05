import React from 'react';

export default function TitleBar({ device, isConnecting, onConnectWebUsb, onRefresh, onOpenGuide, theme = 'light', onToggleTheme }) {
  const isOnline = device && device.connected;

  return (
    <header className="window-titlebar">
      <div className="window-brand">
        <img src="/logo.png" alt="TP Honor Toolkit" className="app-logo" />
        <span className="app-title-text">TP HONOR TOOLKIT</span>
        <span className="app-version-badge">MagicOS 10/11 Ready</span>
      </div>

      <div className="connection-indicator">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--panel-alt)',
            border: '1px solid var(--border-light)',
            padding: '4px 12px',
            borderRadius: '20px',
          }}
        >
          <span className={`conn-led ${isOnline ? 'online' : ''}`}></span>
          <span style={{ color: isOnline ? 'var(--magicos-blue)' : 'var(--text-dim)', fontSize: '11.5px', fontWeight: isOnline ? 600 : 400 }}>
            {isOnline
              ? `${device.commercial_name || device.model} (${device.serial} • ${device.mode === 'webusb' ? 'WebUSB' : 'Local ADB'})`
              : isConnecting
              ? 'Đang tự động nhận diện thiết bị...'
              : 'Chờ kết nối (Cắm cáp USB để tự động nhận)'}
          </span>
        </div>

        {!isOnline && (
          <button
            className="btn-tool primary"
            style={{ padding: '4px 12px', fontSize: '11.5px', marginLeft: '6px' }}
            onClick={onConnectWebUsb}
            disabled={isConnecting}
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </span>
            <span>{isConnecting ? 'Đang kết nối...' : 'Kết Nối WebUSB'}</span>
          </button>
        )}

        <button
          className="btn-tool"
          style={{ padding: '4px 10px', fontSize: '11.5px', marginLeft: '4px' }}
          onClick={onRefresh}
          title="Làm mới trạng thái thiết bị"
        >
          <span className="svg-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </span>
          <span>Làm mới</span>
        </button>

        <button
          className="btn-tool"
          style={{ padding: '4px 10px', fontSize: '11.5px', marginLeft: '4px' }}
          onClick={onOpenGuide}
          title="Hướng dẫn bật gỡ lỗi USB trên MagicOS"
        >
          <span className="svg-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </span>
          <span>Hướng dẫn</span>
        </button>

        {/* Theme Toggle Button: 3uTools Sáng / Tối */}
        <button
          type="button"
          className="btn-tool"
          style={{
            padding: '4px 11px',
            fontSize: '11.5px',
            marginLeft: '6px',
            fontWeight: 600,
            color: 'var(--magicos-blue)',
            borderColor: 'var(--border-highlight)',
          }}
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Chuyển sang Giao diện Tối' : 'Chuyển sang Giao diện Sáng (3uTools)'}
        >
          <span className="svg-icon">
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </span>
          <span>{theme === 'light' ? 'Bản Sáng 3uTools' : 'Bản Tối'}</span>
        </button>
      </div>
    </header>
  );
}
