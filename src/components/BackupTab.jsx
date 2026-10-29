import React from 'react';

export default function BackupTab({ device, onRestoreAll }) {
  const isOnline = device && device.connected;

  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="specs-card" style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
        <div className="specs-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="svg-icon" style={{ color: '#f87171' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
            </span>
            <span style={{ color: '#f87171' }}>Khôi Phục Nguyên Bản Xuất Xưởng (Full Rollback)</span>
          </div>
          <button
            className="btn-tool danger"
            onClick={onRestoreAll}
            disabled={!isOnline}
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <polyline points="3 3 3 8 8 8"></polyline>
              </svg>
            </span>
            <span>Khôi Phục Toàn Bộ Về Gốc</span>
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6', margin: '12px 0 14px 0' }}>
          Sử dụng khi anh cần chuyển nhượng máy, bảo hành chính hãng, hoặc đưa điện thoại về 100% trạng thái xuất xưởng mặc định của Honor.
        </p>
        <ul style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.8', marginLeft: '20px' }}>
          <li>Cài đặt và kích hoạt lại toàn bộ các ứng dụng rác TQ đã gỡ (từ file sao lưu).</li>
          <li>Kích hoạt lại các dịch vụ Telemetry và thông báo nội địa.</li>
          <li>Trả mật độ hiển thị DPI và tần số quét màn hình về mặc định của hãng.</li>
          <li>Khôi phục máy chủ kiểm tra kết nối Captive Portal và tắt Private DNS DoT.</li>
        </ul>
      </div>
    </div>
  );
}
