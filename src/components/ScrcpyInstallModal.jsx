import React, { useState, useEffect } from 'react';

const OS_CONFIGS = {
  windows: {
    id: 'windows',
    name: 'Windows 10 / 11',
    icon: '🪟',
    badge: 'PowerShell / Winget',
    desc: 'Chạy 1 lần duy nhất trong PowerShell để cài Scrcpy chính hãng từ Microsoft Store & đăng ký protocol mở 1-chạm từ Web lên Desktop:',
    command: 'winget install Genymobile.scrcpy ; reg add HKCU\\Software\\Classes\\scrcpy /ve /d "URL:Scrcpy" /f ; reg add HKCU\\Software\\Classes\\scrcpy /v "URL Protocol" /d "" /f ; reg add HKCU\\Software\\Classes\\scrcpy\\shell\\open\\command /ve /d "cmd.exe /c scrcpy -S" /f',
    note: '🛡️ Chuẩn Windows Registry URL Protocol (User-space HKCU - Không cần quyền Admin, sạch 100%).',
  },
  linux_deb: {
    id: 'linux_deb',
    name: 'Ubuntu / Debian / Mint',
    icon: '🐧',
    badge: 'APT Package Manager',
    desc: 'Chạy 1 lần trong Terminal Ubuntu/Debian để cài đặt qua APT & đăng ký chuẩn Freedesktop XDG Protocol:',
    command: 'sudo apt update && sudo apt install -y scrcpy adb && mkdir -p ~/.local/share/applications && printf \'[Desktop Entry]\\nName=Scrcpy Protocol\\nExec=scrcpy -S\\nType=Application\\nTerminal=false\\nNoDisplay=true\\nMimeType=x-scheme-handler/scrcpy;\\n\' > ~/.local/share/applications/scrcpy.desktop && xdg-mime default scrcpy.desktop x-scheme-handler/scrcpy',
    note: '🐧 Chuẩn Freedesktop.org XDG Desktop Entry Specification (Tương thích 100% mọi desktop GNOME, KDE, XFCE, Cinnamon).',
  },
  linux_arch: {
    id: 'linux_arch',
    name: 'Arch Linux / Manjaro',
    icon: '🐧',
    badge: 'Pacman Package Manager',
    desc: 'Chạy 1 lần trong Terminal Arch để cài đặt qua Pacman & đăng ký giao thức XDG:',
    command: 'sudo pacman -S --noconfirm scrcpy android-tools && mkdir -p ~/.local/share/applications && printf \'[Desktop Entry]\\nName=Scrcpy Protocol\\nExec=scrcpy -S\\nType=Application\\nTerminal=false\\nNoDisplay=true\\nMimeType=x-scheme-handler/scrcpy;\\n\' > ~/.local/share/applications/scrcpy.desktop && xdg-mime default scrcpy.desktop x-scheme-handler/scrcpy',
    note: '⚡ Kho gói chính thức Arch Linux Pacman + Freedesktop Scheme Handler.',
  },
  linux_fedora: {
    id: 'linux_fedora',
    name: 'Fedora / RHEL',
    icon: '🎩',
    badge: 'DNF Package Manager',
    desc: 'Chạy 1 lần trong Terminal Fedora để cài đặt qua DNF & đăng ký giao thức XDG:',
    command: 'sudo dnf install -y scrcpy android-tools && mkdir -p ~/.local/share/applications && printf \'[Desktop Entry]\\nName=Scrcpy Protocol\\nExec=scrcpy -S\\nType=Application\\nTerminal=false\\nNoDisplay=true\\nMimeType=x-scheme-handler/scrcpy;\\n\' > ~/.local/share/applications/scrcpy.desktop && xdg-mime default scrcpy.desktop x-scheme-handler/scrcpy',
    note: '🎩 Kho gói chính thức Fedora DNF + Freedesktop Scheme Handler.',
  },
  macos: {
    id: 'macos',
    name: 'macOS (MacBook/iMac)',
    icon: '🍎',
    badge: 'Homebrew',
    desc: 'Chạy 1 lần trong Terminal macOS qua Homebrew:',
    command: 'brew install scrcpy android-platform-tools',
    note: '🍏 Quản lý gói Homebrew chính thức trên macOS (Apple Silicon M1/M2/M3/M4 & Intel).',
  },
};

export default function ScrcpyInstallModal({ isOpen, onClose, onOpenWebMirror, adbService }) {
  const [selectedOs, setSelectedOs] = useState('windows');
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedRun, setCopiedRun] = useState(false);

  useEffect(() => {
    if (isOpen) {
      adbService.getSystemEnv().then((data) => {
        if (data?.os === 'windows') setSelectedOs('windows');
        else if (data?.os === 'linux') setSelectedOs('linux_deb');
        else if (data?.os === 'darwin') setSelectedOs('macos');
      });
      setCopiedInstall(false);
      setCopiedRun(false);
    }
  }, [isOpen, adbService]);

  if (!isOpen) return null;

  const currentConfig = OS_CONFIGS[selectedOs] || OS_CONFIGS.windows;
  const runCmd = 'scrcpy -S';

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(currentConfig.command);
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
          width: '640px',
          maxWidth: '95vw',
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
                Hệ thống liên kết 1-chạm chuẩn quốc tế Freedesktop &amp; Windows Protocol
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
          
          {/* OS Selector Tabs */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              Chọn hệ điều hành máy tính của bạn:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {Object.entries(OS_CONFIGS).map(([key, item]) => {
                const active = selectedOs === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedOs(key);
                      setCopiedInstall(false);
                    }}
                    style={{
                      background: active ? '#2563eb' : '#222938',
                      color: active ? '#fff' : '#94a3b8',
                      border: active ? '1px solid #3b82f6' : '1px solid #333d52',
                      borderRadius: '6px',
                      padding: '6px 11px',
                      fontSize: '11.5px',
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 1: Official Package Manager & Protocol Setup */}
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '12px',
            }}
          >
            <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Bước 1: Kích hoạt 1-chạm từ Web lên Desktop (Chạy 1 lần duy nhất trên máy)</span>
              </div>
              <span className="badge-tag tag-safe" style={{ fontSize: '10px' }}>
                {currentConfig.badge}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '8px' }}>
              {currentConfig.desc}
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
              <span style={{ marginRight: '8px' }}>{currentConfig.command}</span>
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
              {currentConfig.note}
            </div>
          </div>

          {/* Step 2: How It Works & Fallback Run Command */}
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
              <span>Bước 2: Bấm nút trên Web là tự động bung màn hình Scrcpy 120Hz</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '8px' }}>
              Sau khi đã chạy lệnh ở Bước 1, mỗi khi bạn vào <b>tphntools.pages.dev</b> và bấm nút <b>"Mở Scrcpy 120Hz"</b>, trình duyệt sẽ tự động kích hoạt cửa sổ Scrcpy Desktop 120 FPS ngay lập tức.
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
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Hệ thống 100% mã nguồn mở &amp; package manager chính thức của hệ điều hành.
          </div>
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
