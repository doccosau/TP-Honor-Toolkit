import React, { useState, useEffect } from 'react';

export default function ScrcpyInstallModal({ isOpen, onClose, onInstallSuccess, adbService }) {
  const [env, setEnv] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedRun, setCopiedRun] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      adbService.getSystemEnv().then((data) => {
        setEnv(data);
      });
      setErrorMsg('');
      setCopiedInstall(false);
      setCopiedRun(false);
    }
  }, [isOpen, adbService]);

  if (!isOpen) return null;

  const isWeb = env?.is_webusb || adbService?.mode === 'webusb';
  const isWin = env?.os === 'windows';
  const isLinux = env?.os === 'linux';
  const isMac = env?.os === 'darwin';

  const installCmd = env?.install_cmd || (isWin ? 'winget install Genymobile.scrcpy' : isLinux ? 'sudo apt install -y scrcpy adb' : isMac ? 'brew install scrcpy' : 'winget install Genymobile.scrcpy');
  const runCmd = isWin ? 'scrcpy -S' : 'scrcpy -S';

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

  const handleAutoInstall = async () => {
    if (isWeb) {
      setErrorMsg('Bạn đang dùng bản Web qua trình duyệt. Trình duyệt không thể tự cài file vào hệ điều hành. Vui lòng chạy lệnh cài đặt trong Terminal.');
      return;
    }
    setIsInstalling(true);
    setErrorMsg('');
    try {
      const res = await adbService.autoInstallScrcpy();
      if (res?.success) {
        onInstallSuccess?.(res);
        onClose();
      } else {
        setErrorMsg(res?.message || 'Không thể tự động tải và cài đặt. Vui lòng thử cách cài thủ công.');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Lỗi mạng khi tải Scrcpy.');
    } finally {
      setIsInstalling(false);
    }
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
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"></path>
                <polyline points="8 21 12 17 16 21"></polyline>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                Chiếu Màn Hình Scrcpy 120Hz
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Truyền hình ảnh siêu mượt &amp; điều khiển điện thoại bằng bàn phím, chuột
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
          {/* OS & Mode Banner */}
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
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Hệ điều hành máy tính:</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                {env?.display_os || (isWin ? 'Windows PC (10/11)' : isLinux ? 'Linux (Ubuntu/Debian/Arch)' : isMac ? 'Apple macOS' : env?.os_name || 'Máy Tính')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className={`badge-tag ${env?.adb_installed ? 'tag-safe' : 'tag-neutral'}`}>
                {isWeb ? 'ADB: WebUSB Sẵn sàng' : (env?.adb_installed ? 'ADB: Sẵn sàng' : 'Chưa có ADB')}
              </span>
              <span className={`badge-tag ${isWeb ? 'tag-neutral' : (env?.scrcpy_installed ? 'tag-safe' : 'tag-danger')}`}>
                {isWeb ? 'Chế độ: WebUSB Trình duyệt' : (env?.scrcpy_installed ? 'Scrcpy: Đã cài' : 'Scrcpy: Chưa cài')}
              </span>
            </div>
          </div>

          {/* WebUSB Explanation & Quick Launch */}
          {isWeb ? (
            <div>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="svg-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </span>
                  <span>Máy tính của bạn đã có sẵn Scrcpy?</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Do cơ chế bảo mật của trình duyệt web (Sandbox), trang web online <b>không thể tự quét ổ cứng PC</b> hay tự bật ứng dụng màn hình Desktop.
                  Nếu máy tính của bạn đã cài Scrcpy (như Ubuntu/Debian/Arch/Windows), bạn có thể chiếu ngay từ Terminal:
                </div>

                {/* Direct Launch Command */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                    1. Mở Terminal / PowerShell và gõ lệnh:
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
                      {copiedRun ? '✓ Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '8px', fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠️</span>
                  <span>
                    <b>Mẹo:</b> Nếu Terminal báo thiết bị đang bận, hãy bấm nút <b>"Ngắt kết nối"</b> trên web để nhường cổng USB cho lệnh <code>scrcpy</code>.
                  </span>
                </div>
              </div>

              {/* Install guide if not installed */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  2. Nếu máy tính chưa cài Scrcpy, chạy lệnh cài đặt sau trong Terminal:
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
                  }}
                >
                  <span>{installCmd}</span>
                  <button
                    type="button"
                    className="btn-tool"
                    style={{ padding: '3px 8px', fontSize: '11px', marginLeft: '8px' }}
                    onClick={handleCopyInstall}
                  >
                    {copiedInstall ? '✓ Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Local Python Desktop Mode */
            <div>
              <p style={{ marginBottom: '12px', color: '#e2e8f0' }}>
                Để truyền hình ảnh màn hình điện thoại siêu mượt <b>120Hz</b> và điều khiển bằng chuột/bàn phím, máy tính cần phần mềm <b>Scrcpy</b>.
              </p>

              {isWin && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#10b981', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="svg-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                    </span>
                    <span>Tự Động Cài Đặt Không Cần Cài App Ngoài:</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Hệ thống sẽ tự động tải file nén chính hãng từ GitHub <b>Genymobile/scrcpy</b> và giải nén sẵn vào thư mục công cụ. Sau khi tải xong bạn có thể chiếu màn hình ngay lập tức!
                  </div>
                </div>
              )}

              {/* Terminal Command box */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  Hoặc chạy lệnh cài đặt thủ công qua Terminal / PowerShell:
                </div>
                <div
                  style={{
                    background: '#11141c',
                    border: '1px solid #2e3547',
                    borderRadius: '4px',
                    padding: '8px 10px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
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
                    {copiedInstall ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '6px',
                padding: '8px 12px',
                marginBottom: '14px',
                fontSize: '11.5px',
              }}
            >
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
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
          {isWeb ? (
            <>
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
                <span>{copiedRun ? '✓ Đã chép "scrcpy -S"' : 'Sao chép lệnh: scrcpy -S'}</span>
              </button>

              <button
                type="button"
                className="btn-tool primary"
                onClick={onClose}
                style={{ padding: '6px 18px', fontWeight: 600 }}
              >
                Đã Hiểu &amp; Đóng
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-tool"
                onClick={onClose}
                disabled={isInstalling}
              >
                Đóng
              </button>

              <button
                type="button"
                className="btn-tool primary"
                onClick={handleAutoInstall}
                disabled={isInstalling}
                style={{ padding: '6px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span className="svg-icon">
                  {isInstalling ? (
                    <svg className="spin-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  )}
                </span>
                <span>{isInstalling ? 'Đang tải & cài đặt Scrcpy...' : 'Tự Động Cài Đặt Ngay'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
