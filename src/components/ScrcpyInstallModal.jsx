import React, { useState } from 'react';

export default function ScrcpyInstallModal({ isOpen, onClose, onOpenWebMirror, adbService }) {
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  const plat = (typeof navigator !== 'undefined' ? (navigator.userAgentData?.platform || navigator.platform) : '') || '';

  const isWin = /Win/i.test(plat) || /Windows/i.test(ua);
  const isMac = /Mac/i.test(plat) || /Macintosh/i.test(ua);

  const osTitle = isWin ? 'Windows PC' : isMac ? 'Apple macOS' : 'Linux (Ubuntu / Debian / Arch / Fedora)';
  const OsIcon = () => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  );

  // 1-line command to run bridge directly without manually saving file
  const oneLineCmd = isWin
    ? 'python -c "import urllib.request; exec(urllib.request.urlopen(\'https://tphntools.pages.dev/scrcpy_bridge.py\').read())"'
    : 'curl -sSL https://tphntools.pages.dev/scrcpy_bridge.py | python3';

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(oneLineCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '580px',
          maxWidth: '94vw',
          background: 'var(--panel-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          boxShadow: 'var(--card-shadow)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            background: 'var(--panel-alt)',
            borderBottom: '1px solid var(--border-light)',
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
                Bật Cầu Nối Scrcpy 120Hz Lên Desktop
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Cầu nối siêu nhẹ (chỉ 2 KB), không cần tải cả mã nguồn
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
          
          {/* Architecture Notice */}
          <div
            style={{
              background: '#232938',
              border: '1px solid #333d52',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '14px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>Mọi tính năng khác đang chạy trực tiếp 100% trên Web:</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              Tối ưu máy, gỡ app rác, cài Zalo/MoMo, kiểm tra pin, gán trợ lý Google... đều chạy trực tiếp trên web mà không cần tải bất kỳ file nào.
            </div>
          </div>

          {/* Bridge Guidance */}
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
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <span>Bật cầu nối nhẹ (2 KB) để mở Scrcpy Desktop:</span>
              </div>
              <span className="badge-tag tag-safe" style={{ fontSize: '10.5px', display: 'inline-flex', alignItems: 'center' }}>
                <OsIcon /> {osTitle}
              </span>
            </div>

            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '10px' }}>
              Do bảo mật Sandbox của trình duyệt chặn trang web tự mở app ngoài màn hình máy tính, bạn chỉ cần bật cầu nối Python siêu nhẹ (file độc lập chỉ 2 KB, không tải cả mã nguồn):
            </div>

            {/* Option A: Direct 1-Line Command */}
            <div
              style={{
                background: 'var(--panel-alt)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '4px' }}>
                Cách 1: Chạy trực tiếp 1 dòng lệnh (Không cần tải file về máy)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginBottom: '8px' }}>
                Mở {isWin ? 'PowerShell' : 'Terminal'} và dán lệnh sau để bật cầu nối ngay:
              </div>

              <div
                style={{
                  background: 'var(--panel-card)',
                  border: '1px solid var(--border-dark)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--magicos-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  wordBreak: 'break-all',
                }}
              >
                <span style={{ marginRight: '8px' }}>{oneLineCmd}</span>
                <button
                  type="button"
                  className="btn-tool"
                  style={{ padding: '3px 9px', fontSize: '11px', flexShrink: 0, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleCopyCmd}
                >
                  {copiedCmd ? (
                    <>
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Đã chép
                    </>
                  ) : (
                    'Sao chép lệnh'
                  )}
                </button>
              </div>
            </div>

            {/* Option B: Download single-file scrcpy_bridge.py */}
            <div
              style={{
                background: 'var(--panel-alt)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bright)' }}>
                  Cách 2: Hoặc tải file đơn <code>scrcpy_bridge.py</code> (2 KB)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Sau khi tải về, chỉ cần nhấp đúp hoặc gõ: <code>python scrcpy_bridge.py</code>
                </div>
              </div>
              <a
                href="/scrcpy_bridge.py"
                download="scrcpy_bridge.py"
                className="btn-tool primary"
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 600,
                }}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Tải file (2 KB)</span>
              </a>
            </div>

            <div style={{ marginTop: '10px', fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Khi cầu nối đang chạy ở cổng 5050, trang web sẽ <b>tự động bắt sóng</b> và mở Scrcpy 120 FPS lên màn hình máy tính mỗi khi bạn bấm nút!</span>
            </div>
          </div>

          {/* In-Browser Web Mirror Alternative */}
          {onOpenWebMirror && (
            <div
              style={{
                background: 'var(--panel-alt)',
                border: '1px dashed var(--border-dark)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  </svg>
                  <span>Không muốn tải hay bật cầu nối? Xem ngay trên Web:</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Bạn có thể dùng Web Mirror để xem và chạm màn hình trực tiếp trong tab trình duyệt mà không cần bất kỳ file nào.
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
            background: 'var(--panel-alt)',
            borderTop: '1px solid var(--border-light)',
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
