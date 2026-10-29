import React from 'react';

export default function WebUsbGuideModal({ isOpen, onClose, onConnect }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="specs-card" style={{ maxWidth: '560px', width: '100%', padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', border: '1px solid #3b82f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </span>
            Hướng Dẫn Bật Gỡ Lỗi USB (ADB) Trên Honor MagicOS
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}
          >
            ✕
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-bright)', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <b>Bước 1: Mở chế độ Nhà phát triển</b>
            <div style={{ color: 'var(--text-dim)', marginLeft: '12px' }}>
              Vào <code>Cài đặt (Settings)</code> ➔ <code>Về điện thoại (About Phone)</code> ➔ Nhấp liên tục <b>7 lần</b> vào <code>Số bản dựng (Build Number)</code>.
            </div>
          </div>

          <div>
            <b>Bước 2: Bật Gỡ lỗi USB</b>
            <div style={{ color: 'var(--text-dim)', marginLeft: '12px' }}>
              Quay lại <code>Cài đặt</code> ➔ <code>Hệ thống & Cập nhật</code> ➔ <code>Tùy chọn nhà phát triển (Developer Options)</code> ➔ Gạt bật <b>Gỡ lỗi USB (USB Debugging)</b>.
            </div>
          </div>

          <div>
            <b>Bước 3: Cắm cáp & Cấp quyền RSA</b>
            <div style={{ color: 'var(--text-dim)', marginLeft: '12px' }}>
              Cắm cáp Type-C nối điện thoại với máy tính. Khi màn hình điện thoại hiện bảng hỏi <i>"Cho phép gỡ lỗi USB từ máy tính này?"</i> ➔ Hãy tích vào ô <b>"Luôn cho phép"</b> rồi bấm <b>OK</b>.
            </div>
          </div>

          <div>
            <b>Bước 4: Bấm nút Kết Nối trên Web</b>
            <div style={{ color: 'var(--text-dim)', marginLeft: '12px' }}>
              Dùng trình duyệt <b>Google Chrome</b> hoặc <b>Microsoft Edge</b> ➔ Bấm nút <b>"Kết Nối WebUSB"</b> màu xanh ở thanh tiêu đề phía trên và chọn thiết bị Honor của bạn!
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <button className="btn-tool" onClick={onClose}>
            Đóng
          </button>
          <button
            className="btn-tool primary"
            onClick={() => {
              onClose();
              onConnect();
            }}
          >
            <span>Bắt Đầu Kết Nối WebUSB</span>
          </button>
        </div>
      </div>
    </div>
  );
}
