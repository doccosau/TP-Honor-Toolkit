import React, { useState } from 'react';
import { adbService } from '../services/adbService';

export default function ThemeStudioModal({ isOpen, onClose, device, adbService: propAdbService }) {
  const activeAdb = propAdbService || adbService;
  const [activeTab, setActiveTab] = useState('extract'); // 'extract' | 'upload'
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState(null);
  const [extractError, setExtractError] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const isOnline = Boolean(
    (device && device.connected) ||
    activeAdb?.isConnected?.() ||
    (activeAdb?.mode === 'webusb' && activeAdb?.adbInstance) ||
    activeAdb?.deviceInfo?.connected
  );

  if (!isOpen) return null;

  const handleExtractTrialTheme = async () => {
    setIsExtracting(true);
    setExtractResult(null);
    setExtractError(null);
    try {
      const res = await activeAdb.extractTrialTheme();
      if (res && res.success) {
        setExtractResult(res);
      } else {
        setExtractError(res?.message || 'Không thể trích xuất theme. Vui lòng đảm bảo bạn đã bấm "Dùng thử" trên điện thoại trước.');
      }
    } catch (e) {
      setExtractError(e.message || 'Lỗi không xác định trong quá trình trích xuất.');
    } finally {
      setIsExtracting(false);
    }
  };

  const processThemeFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.hnt')) {
      alert('Vui lòng chỉ chọn file theme định dạng chuẩn .hnt của MagicOS!');
      return;
    }
    setIsUploading(true);
    setUploadResult(null);
    setUploadError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const b64 = e.target.result.split(',')[1];
          const res = await activeAdb.deployThemeFile(file.name, b64);
          if (res && res.success) {
            setUploadResult(res);
          } else {
            setUploadError(res?.message || 'Nạp theme thất bại.');
          }
        } catch (err) {
          setUploadError(err.message || 'Lỗi đọc file theme.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      setIsUploading(false);
      setUploadError(e.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processThemeFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processThemeFile(file);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border-light)',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--panel-alt)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="svg-icon" style={{ color: 'var(--primary)', display: 'inline-flex' }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path>
              </svg>
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-bright)' }}>
                TP Theme Studio - Quản Lý &amp; Trích Xuất Theme MagicOS (.hnt)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Chuẩn hóa tệp .hnt, nạp trực tiếp vào thư mục hệ thống &amp; không lưu rác bộ nhớ máy
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-tool"
            style={{ padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Đóng"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--panel)',
            padding: '0 20px',
          }}
        >
          <button
            onClick={() => setActiveTab('extract')}
            style={{
              padding: '12px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'extract' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'extract' ? 'var(--primary)' : 'var(--text-dim)',
              fontWeight: activeTab === 'extract' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span className="svg-icon" style={{ display: 'inline-flex' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </span>
            <span>Trích Xuất Theme VIP Đang Thử (1-Click)</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '12px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'upload' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'upload' ? 'var(--primary)' : 'var(--text-dim)',
              fontWeight: activeTab === 'upload' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span className="svg-icon" style={{ display: 'inline-flex' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </span>
            <span>Nạp File .hnt Có Sẵn Vào Máy</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'extract' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Instruction banner */}
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '6px',
                  padding: '14px 16px',
                  fontSize: '12.5px',
                  lineHeight: '1.6',
                  color: 'var(--text)',
                }}
              >
                <div style={{ fontWeight: 600, color: '#3b82f6', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="svg-icon" style={{ display: 'inline-flex' }}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </span>
                  <span>Cơ chế trích xuất Theme VIP độc quyền:</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '18px' }}>
                  <li>Trên điện thoại Honor: Mở app <b>Chủ Đề (Theme Store)</b> chính hãng.</li>
                  <li>Chọn bất kỳ <b>Theme VIP hoặc Trả phí</b> nào bạn thích → Bấm <b>Dùng thử (5 phút)</b>.</li>
                  <li>Quay lại màn hình này và bấm nút <b>"Bắt Đầu Trích Xuất Theme"</b> bên dưới.</li>
                  <li>Toolkit sẽ tự động trích xuất toàn bộ tài nguyên đã giải mã, loại bỏ cờ trial, đóng gói lại chuẩn ZIP Deflate <b>.hnt</b> và nạp vĩnh viễn vào máy!</li>
                </ol>
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                <button
                  className="btn-tool primary"
                  style={{
                    padding: '12px 28px',
                    fontSize: '14px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    cursor: isExtracting || !isOnline ? 'not-allowed' : 'pointer',
                    opacity: isExtracting || !isOnline ? 0.6 : 1,
                  }}
                  onClick={handleExtractTrialTheme}
                  disabled={isExtracting || !isOnline}
                >
                  {isExtracting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="spinner" style={{ width: '14px', height: '14px' }}></span>
                      <span>Đang trích xuất &amp; đóng gói .hnt...</span>
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                      <span>Bắt Đầu Trích Xuất Theme Vĩnh Viễn</span>
                    </span>
                  )}
                </button>
                {!isOnline && (
                  <span style={{ fontSize: '11px', color: '#ef4444' }}>
                    * Thiết bị chưa kết nối qua ADB. Vui lòng cắm cáp USB để sử dụng.
                  </span>
                )}
              </div>

              {/* Error Display */}
              {extractError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    color: '#ef4444',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span><b>Lỗi:</b> {extractError}</span>
                </div>
              )}

              {/* Success Result Display */}
              {extractResult && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    padding: '16px',
                    fontSize: '12.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#10b981', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>ĐÃ TRÍCH XUẤT THÀNH CÔNG THEME: {extractResult.title}</span>
                  </div>
                  <div style={{ color: 'var(--text)' }}>
                    • Tên file chuẩn: <b>{extractResult.filename}</b> ({extractResult.size_mb} MB)
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '11.5px', wordBreak: 'break-all' }}>
                    • Nạp hệ thống: <code>{extractResult.sys_path}</code>
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '11.5px', wordBreak: 'break-all' }}>
                    • Bản sao chia sẻ: <code>{extractResult.public_path}</code>
                  </div>
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '8px 12px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      borderRadius: '4px',
                      color: 'var(--text-bright)',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                    <span><b>Cách áp dụng ngay:</b> Mở app Chủ Đề trên điện thoại → Tab <b>"Tôi"</b> → <b>"Chủ đề của tôi"</b> → Chọn theme và bấm <b>Áp dụng</b> để dùng vĩnh viễn!</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border-light)'}`,
                  borderRadius: '8px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: dragOver ? 'rgba(59, 130, 246, 0.05)' : 'var(--panel-alt)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('theme-file-input')?.click()}
              >
                <input
                  id="theme-file-input"
                  type="file"
                  accept=".hnt"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--primary)" strokeWidth="1.5">
                    <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-1.78 0L2 6.35v11.3a1.78 1.78 0 0 0 .89 1.54l3.78 2.18a1.78 1.78 0 0 0 1.78 0l13.66-7.89a1.78 1.78 0 0 0 .89-1.54V6.35l-3.78-2.18a1.78 1.78 0 0 0-1.78 0z"></path>
                    <polyline points="3.29 7 12 12 20.71 7"></polyline>
                    <line x1="12" y1="22" x2="12" y2="12"></line>
                  </svg>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: '4px' }}>
                  Kéo thả file .hnt vào đây hoặc bấm để chọn file
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  Hỗ trợ định dạng <b>.hnt</b> (Honor Native Theme chuẩn MagicOS)
                </div>
              </div>

              {isUploading && (
                <div style={{ textAlign: 'center', padding: '12px', color: 'var(--primary)', fontSize: '13px' }}>
                  Đang nạp file theme vào thư mục hệ thống và khởi động lại ThemeManager...
                </div>
              )}

              {uploadError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    color: '#ef4444',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span><b>Lỗi nạp theme:</b> {uploadError}</span>
                </div>
              )}

              {uploadResult && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    padding: '14px',
                    color: '#10b981',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span><b>Đã nạp thành công:</b> {uploadResult.filename} vào ứng dụng Chủ Đề! Hãy mở app Chủ Đề trên điện thoại để áp dụng.</span>
                </div>
              )}

              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                * File sẽ được nạp chính xác vào:  
                <code>/sdcard/Android/data/com.hihonor.android.thememanager/files/Download/Honor/Themes/</code>  
                và bản sao tại <code>/sdcard/Honor/Themes/</code> để bạn chia sẻ.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--panel-alt)',
          }}
        >
          <button
            onClick={onClose}
            className="btn-tool"
            style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '4px' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

