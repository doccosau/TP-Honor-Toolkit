import React from 'react';

export default function TitleBar({ device, isConnecting, onConnectWebUsb, onRefresh, onOpenGuide }) {
  const isOnline = device && device.connected;

  return (
    <header className="window-titlebar">
      <div className="window-brand">
        <img src="/logo.png" alt="TP Honor Toolkit" className="app-logo" />
        <span className="app-title-text">TP HONOR TOOLKIT</span>
        <span className="app-version-badge">v2.0-PRO</span>
      </div>

      <div className="connection-indicator">
        <span className={`conn-led ${isOnline ? 'online' : ''}`}></span>
        <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
          {isOnline
            ? `Thiết bị kết nối: ${device.serial} (${device.mode === 'webusb' ? 'WebUSB Trực Tiếp' : 'Local ADB'})`
            : isConnecting
            ? 'Đang bắt tay kết nối USB...'
            : 'Chưa phát hiện thiết bị (Cần cắm cáp USB)'}
        </span>

        {!isOnline && (
          <button
            className="btn-tool primary"
            style={{ padding: '3px 10px', fontSize: '11px', marginLeft: '10px' }}
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
          style={{ padding: '3px 8px', fontSize: '11px', marginLeft: '6px' }}
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
          style={{ padding: '3px 8px', fontSize: '11px', marginLeft: '4px' }}
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
      </div>
    </header>
  );
}
