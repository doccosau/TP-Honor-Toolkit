import React, { useState, useEffect } from 'react';

export default function ScrcpyInstallModal({ isOpen, onClose, onOpenWebMirror, adbService }) {
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedRun, setCopiedRun] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopiedInstall(false);
      setCopiedRun(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-detect client operating system cleanly without user having to think or click tabs
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  const plat = (typeof navigator !== 'undefined' ? (navigator.userAgentData?.platform || navigator.platform) : '') || '';

  const isWin = /Win/i.test(plat) || /Windows/i.test(ua);
  const isMac = /Mac/i.test(plat) || /Macintosh/i.test(ua);
  const isLinux = !isWin && !isMac;

  let osTitle = 'Windows PC (10/11)';
  let osIcon = '🪟';
  let osTerminalName = 'PowerShell';
  let installCmd = '';
  let installDesc = '';
  let osNote = '';

  if (isWin) {
    osTitle = 'Windows PC (10 / 11)';
    osIcon = '🪟';
    osTerminalName = 'PowerShell';
    installDesc = 'Mở PowerShell và dán 1 dòng lệnh chính thức Microsoft này (Chạy 1 lần duy nhất để vừa cài Scrcpy sạch, vừa cho phép bấm trên Web là tự bung cửa sổ 120Hz):';
    installCmd = 'winget install Genymobile.scrcpy ; reg add HKCU\\Software\\Classes\\scrcpy /ve /d "URL:Scrcpy" /f ; reg add HKCU\\Software\\Classes\\scrcpy /v "URL Protocol" /d "" /f ; reg add HKCU\\Software\\Classes\\scrcpy\\shell\\open\\command /ve /d "cmd.exe /c scrcpy -S" /f';
    osNote = '🛡️ Chuẩn Windows Registry URL Protocol (User-space HKCU - Không cần quyền Admin, an toàn 100%).';
  } else if (isMac) {
    osTitle = 'Apple macOS';
    osIcon = '🍎';
    osTerminalName = 'Terminal';
    installDesc = 'Mở Terminal trên Mac và chạy lệnh cài đặt qua Homebrew chính thức:';
    installCmd = 'brew install scrcpy android-platform-tools';
    osNote = '🍏 Quản lý gói Homebrew chính hãng trên macOS (Hỗ trợ chip Apple M1/M2/M3/M4 & Intel).';
  } else {
    osTitle = 'Linux (Ubuntu / Debian / Mint / Zorin)';
    osIcon = '🐧';
    osTerminalName = 'Terminal';
    installDesc = 'Mở Terminal và dán 1 dòng lệnh chuẩn này (Chạy 1 lần duy nhất để cài đặt & đăng ký mở 1-chạm từ Web lên Desktop):';
    installCmd = 'sudo apt update && sudo apt install -y scrcpy adb && mkdir -p ~/.local/share/applications && printf \'[Desktop Entry]\\nName=Scrcpy Protocol\\nExec=scrcpy -S\\nType=Application\\nTerminal=false\\nNoDisplay=true\\nMimeType=x-scheme-handler/scrcpy;\\n\' > ~/.local/share/applications/scrcpy.desktop && xdg-mime default scrcpy.desktop x-scheme-handler/scrcpy';
    osNote = '🐧 Chuẩn Freedesktop.org XDG Desktop Entry (Nếu dùng Arch: sudo pacman -S scrcpy | Fedora: sudo dnf install scrcpy).';
  }

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
                Kích Hoạt Scrcpy 120Hz 1-Chạm Từ Web
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Chuẩn hệ điều hành chính thức, không tải file lạ, sạch 100%
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
          
          {/* OS Auto-Detected Banner */}
          <div
            style={{
              background: '#232938',
              border: '1px solid #333d52',
              borderRadius: '8px',
              padding: '9px 12px',
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{osIcon}</span>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Hệ điều hành nhận diện: </span>
                <b style={{ color: '#38bdf8' }}>{osTitle}</b>
              </div>
            </div>
            <span className="badge-tag tag-safe" style={{ fontSize: '10.5px' }}>
              Tự Động Cấu Hình
            </span>
          </div>

          {/* Step 1: 1-Click Setup Command */}
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '12px',
            }}
          >
            <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
              Bước 1: Chạy lệnh sau trong {osTerminalName} (Chỉ làm 1 lần duy nhất trên máy)
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '8px' }}>
              {installDesc}
            </div>

            <div
              style={{
                background: '#11141c',
                border: '1px solid #2e3547',
                borderRadius: '6px',
                padding: '8px 12px',
                fontFamily: 'monospace',
                fontSize: '11.5px',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                wordBreak: 'break-all',
              }}
            >
              <span style={{ marginRight: '8px' }}>{installCmd}</span>
              <button
                type="button"
                className="btn-tool"
                style={{ padding: '4px 10px', fontSize: '11px', flexShrink: 0, fontWeight: 600 }}
                onClick={handleCopyInstall}
              >
                {copiedInstall ? '✓ Đã chép' : 'Sao chép lệnh'}
              </button>
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '6px' }}>
              {osNote}
            </div>
          </div>

          {/* Step 2: Confirmation & 1-Click Experience */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '12px',
            }}
          >
            <div style={{ fontWeight: 600, color: '#10b981', marginBottom: '4px' }}>
              Bước 2: Bấm nút trên Web là tự động bung màn hình Scrcpy 120Hz
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '8px' }}>
              Sau khi đã chạy lệnh ở Bước 1, mỗi khi bạn vào <b>tphntools.pages.dev</b> và bấm nút <b>"Mở Scrcpy 120Hz"</b>, cửa sổ Scrcpy Desktop 120 FPS sẽ tự động bung lên màn hình ngay lập tức!
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
                {copiedRun ? '✓ Đã chép' : 'Sao chép lệnh chạy thủ công'}
              </button>
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
                  Xem và chạm thử màn hình ngay trên web mà không cần mở Terminal/PowerShell
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
