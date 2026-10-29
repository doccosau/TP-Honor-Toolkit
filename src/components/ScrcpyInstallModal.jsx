import React, { useState, useEffect } from 'react';

export default function ScrcpyInstallModal({ isOpen, onClose, onInstallSuccess, onOpenWebMirror, adbService }) {
  const [env, setEnv] = useState(null);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedRun, setCopiedRun] = useState(false);

  useEffect(() => {
    if (isOpen) {
      adbService.getSystemEnv().then((data) => {
        setEnv(data);
      });
      setCopiedInstall(false);
      setCopiedRun(false);
    }
  }, [isOpen, adbService]);

  if (!isOpen) return null;

  const isWin = env?.os === 'windows';
  const isLinux = env?.os === 'linux';
  const isMac = env?.os === 'darwin';

  const installCmd = isWin
    ? 'winget install Genymobile.scrcpy'
    : isLinux
    ? 'sudo apt install -y scrcpy adb'
    : isMac
    ? 'brew install scrcpy'
    : 'winget install Genymobile.scrcpy';

  const runCmd = 'scrcpy -S';

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(installCmd);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2500);
  };

  const handleCopyRun = () => {
    navigator.clipboard.writeText(runCmd);
    setCopiedRun(true);
    setTimeout(() => setCopiedRun(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '560px',
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
                Chuẩn chính hãng Microsoft Package Manager &amp; Genymobile (Không tải file lạ)
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
        <div style={{ padding: '18px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.6', maxHeight: '78vh', overflowY: 'auto' }}>
          {/* OS Banner */}
          <div
            style={{
              background: '#232938',
              border: '1px solid #333d52',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Hệ điều hành nhận diện:</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                {env?.display_os || (isWin ? 'Windows PC (10/11)' : isLinux ? 'Linux (Ubuntu/Debian/Arch)' : isMac ? 'Apple macOS' : env?.os_name || 'Máy Tính')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="badge-tag tag-safe">
                ADB WebUSB: Sẵn sàng
              </span>
              <span className="badge-tag tag-neutral">
                Chuẩn: 120 FPS Siêu Mượt
              </span>
            </div>
          </div>

          {/* Step 1: Official Package Manager Install */}
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '12px',
            }}
          >
            <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Bước 1: Cài đặt Scrcpy chính hãng (Nếu máy tính chưa có)</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '8px' }}>
              {isWin
                ? 'Mở PowerShell hoặc Command Prompt rồi chạy lệnh Microsoft Package Manager (winget) chính hãng:'
                : isLinux
                ? 'Mở Terminal Linux và dán lệnh cài đặt gói apt/pacman chính thức:'
                : 'Mở Terminal trên Mac và chạy lệnh Homebrew chính thức:'}
            </div>

            <div
              style={{
                background: '#11141c',
                border: '1px solid #2e3547',
                borderRadius: '6px',
                padding: '8px 12px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{installCmd}</span>
              <button
                type="button"
                className="btn-tool"
                style={{ padding: '3px 8px', fontSize: '11px', marginLeft: '8px' }}
                onClick={handleCopyInstall}
              >
                {copiedInstall ? '✓ Đã chép' : 'Sao chép lệnh'}
              </button>
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '5px' }}>
              🛡️ Nguồn chính thức từ Microsoft Windows Store / GitHub Genymobile. Đảm bảo sạch 100%, không cài file lạ.
            </div>
          </div>

          {/* Step 2: Launch Command */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '12px',
            }}
          >
            <div style={{ fontWeight: 600, color: '#10b981', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Bước 2: Lệnh khởi chạy Scrcpy 120Hz siêu mượt</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '8px' }}>
              Chạy lệnh sau để bật cửa sổ chiếu màn hình 120 FPS không độ trễ:
            </div>

            <div
              style={{
                background: '#11141c',
                border: '1px solid #2e3547',
                borderRadius: '6px',
                padding: '8px 12px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{runCmd}</span>
              <button
                type="button"
                className="btn-tool"
                style={{ padding: '3px 8px', fontSize: '11px', marginLeft: '8px' }}
                onClick={handleCopyRun}
              >
                {copiedRun ? '✓ Đã chép' : 'Sao chép lệnh'}
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
              💡 Cờ <code>-S</code> giúp tự động tắt màn hình điện thoại khi chiếu để máy luôn mát và tiết kiệm pin tối đa.
            </div>

            <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '11px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠️</span>
                <span>
                  <b>Lưu ý:</b> Cổng USB đang kết nối trên Web. Khi bạn sẵn sàng chạy lệnh Scrcpy ngoài Terminal:
                </span>
              </div>
              <button
                type="button"
                className="btn-tool"
                style={{ padding: '3px 9px', fontSize: '11px', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.4)' }}
                onClick={() => {
                  adbService?.disconnect?.();
                  onClose();
                }}
                title="Ngắt kết nối WebUSB để nhường cổng USB cho lệnh scrcpy trong Terminal/PowerShell"
              >
                🔌 Giải Phóng USB Ngay
              </button>
            </div>
          </div>

          {/* In-Browser Web Mirror Alternative */}
          {onOpenWebMirror && (
            <div
              style={{
                background: '#171d2b',
                border: '1px dashed #283348',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                  📱 Lựa chọn: Xem nhanh trực tiếp trong trình duyệt
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Xem và chạm thử màn hình ngay trên web mà không cần mở PowerShell
                </div>
              </div>
              <button
                type="button"
                className="btn-tool"
                style={{ padding: '4px 10px', fontSize: '11px' }}
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
            className="btn-tool"
            onClick={handleCopyRun}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </span>
            <span>{copiedRun ? '✓ Đã sao chép scrcpy -S' : 'Sao chép lệnh: scrcpy -S'}</span>
          </button>

          <button
            type="button"
            className="btn-tool primary"
            onClick={onClose}
            style={{ padding: '6px 18px', fontWeight: 600 }}
          >
            Đã Hiểu &amp; Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
