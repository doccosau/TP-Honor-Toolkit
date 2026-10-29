import React from 'react';

export default function ScrcpyInstallModal({ isOpen, onClose, onOpenWebMirror, adbService }) {
  if (!isOpen) return null;

  // Client-side auto detection
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  const plat = (typeof navigator !== 'undefined' ? (navigator.userAgentData?.platform || navigator.platform) : '') || '';

  const isWin = /Win/i.test(plat) || /Windows/i.test(ua);
  const isMac = /Mac/i.test(plat) || /Macintosh/i.test(ua);

  const osTitle = isWin ? 'Windows PC (10 / 11)' : isMac ? 'Apple macOS' : 'Linux (Ubuntu / Debian / Arch / Fedora)';
  const osIcon = isWin ? '🪟' : isMac ? '🍎' : '🐧';
  const helperFileName = isWin ? 'run.bat' : './run.sh';

  const handleCopyCmd = (cmd) => {
    navigator.clipboard.writeText(cmd);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '580px',
          maxWidth: '94vw',
          background: '#1c212d',
          border: '1px solid #2e3547',
          borderRadius: '10px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.75)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            background: '#161a24',
            borderBottom: '1px solid #2e3547',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                Chiếu Màn Hình Scrcpy 120Hz Siêu Mượt
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Kết hợp Web &amp; Local Helper cho trải nghiệm Native 120 FPS
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6', maxHeight: '78vh', overflowY: 'auto' }}>
          
          {/* Architecture Concept Notice */}
          <div
            style={{
              background: '#232938',
              border: '1px solid #333d52',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '14px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '3px' }}>
              🌐 Mọi tính năng khác đang chạy trực tiếp 100% trên Web:
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              Tối ưu máy, gỡ app rác Trung Quốc, cài Zalo/MoMo, kiểm tra pin, gán trợ lý Google... đều hoạt động mượt mà ngay trên web mà không cần cài đặt bất kỳ file nào.
            </div>
          </div>

          {/* Local Helper Guidance */}
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🖥️ Riêng chiếu màn hình Native 120 FPS ngoài Desktop:</span>
              </div>
              <span className="badge-tag tag-safe" style={{ fontSize: '10.5px' }}>
                {osIcon} {osTitle}
              </span>
            </div>

            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '10px' }}>
              Do cơ chế bảo mật Sandbox của trình duyệt chặn web tự mở app ngoài màn hình máy tính, bạn chỉ cần bật <b>Local Helper</b> chạy ngầm trên máy:
            </div>

            {/* Action Card */}
            <div
              style={{
                background: '#11141c',
                border: '1px solid #2e3547',
                borderRadius: '6px',
                padding: '10px 12px',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                Cách 1: Chạy file Helper có sẵn trong thư mục công cụ
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '8px' }}>
                {isWin ? (
                  <>Mở thư mục tool và nhấp đúp vào file <code style={{ color: '#38bdf8' }}>run.bat</code></>
                ) : (
                  <>Mở Terminal trong thư mục tool và chạy: <code style={{ color: '#38bdf8' }}>./run.sh</code></>
                )}
              </div>

              <div style={{ fontSize: '11px', color: '#10b981' }}>
                ✓ Khi Local Helper chạy, trang web sẽ <b>tự động bắt sóng</b> và mở ngay cửa sổ Scrcpy 120Hz lên màn hình máy tính mỗi khi bạn bấm nút!
              </div>
            </div>

            {/* Quick manual terminal command fallback */}
            <div
              style={{
                background: '#11141c',
                border: '1px solid #2e3547',
                borderRadius: '6px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Cách 2: Hoặc gõ lệnh trực tiếp: </span>
                <code style={{ color: '#4ade80', fontSize: '12px' }}>scrcpy -S</code>
              </div>
              <button
                type="button"
                className="btn-tool"
                style={{ padding: '3px 8px', fontSize: '11px' }}
                onClick={() => handleCopyCmd('scrcpy -S')}
              >
                Sao chép lệnh
              </button>
            </div>

            {/* Download Link */}
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <a
                href="https://github.com/doccosau/TP-Honor-Toolkit/archive/refs/heads/main.zip"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '11.5px',
                  color: '#38bdf8',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>⬇️ Tải gói Local Helper đầy đủ (.zip từ GitHub)</span>
              </a>
            </div>
          </div>

          {/* In-Browser Web Mirror Alternative */}
          {onOpenWebMirror && (
            <div
              style={{
                background: '#171d2b',
                border: '1px dashed #283348',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '2px' }}>
                  📱 Hoặc xem &amp; chạm trực tiếp ngay trên Web (Không cần tải file)
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Nếu bạn không muốn tải hay bật Local Helper, hãy dùng Web Mirror để xem màn hình ngay trong trình duyệt.
                </div>
              </div>
              <button
                type="button"
                className="btn-tool primary"
                style={{ padding: '6px 14px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
                onClick={() => {
                  onClose();
                  onOpenWebMirror();
                }}
              >
                Mở Web Mirror
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 18px',
            background: '#161a24',
            borderTop: '1px solid #2e3547',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            className="btn-tool primary"
            onClick={onClose}
            style={{ padding: '6px 20px', fontWeight: 600 }}
          >
            Đã Hiểu &amp; Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
