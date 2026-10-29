import React, { useState, useEffect } from 'react';

export default function DeviceDetailModal({ device, onClose }) {
  const [viewMode, setViewMode] = useState('both'); // 'both' | 'front' | 'back'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!device) return null;

  const frontUrl = device.render_front || `images/devices/${device.sku}-front.png`;
  const backUrl = device.render_back || `images/devices/${device.sku}-back.png`;

  const handleCopySpecs = () => {
    const text = `=== THÔNG SỐ KỸ THUẬT CHUẨN HONOR ===
Model: ${device.name} (${device.name_cn || '荣耀'})
SKU: ${device.sku} | Dòng: ${device.series}
Năm ra mắt: ${device.release_year || '2024/2025'} (Bản Gốc Nội Địa C00)
Vi xử lý: ${device.soc}
Màn hình: ${device.screen} (${device.width_px}x${device.height_px})
Tần số quét: ${device.max_hz}Hz (Hỗ trợ: ${device.supported_hz?.join(', ') || '60, 120'}Hz)
DPI Tỉ Lệ Vàng: ${device.sweet_spot_dpi} DPI (Mặc định: ${device.default_dpi} DPI)
Pin: ${device.battery}
Kháng nước: ${device.waterproof || 'Tiêu chuẩn'}
Độ bền: ${device.durability || 'Chuẩn Honor'}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getCutoutText = (type) => {
    switch (type) {
      case 'center_pill':
        return 'Viên thuốc Dynamic Island giữa (Nhận diện 3D / Cảm biến)';
      case 'single_hole':
        return 'Nốt ruồi đơn siêu nhỏ ở giữa';
      case 'left_pill':
        return 'Viên thuốc kép góc trái';
      case 'pop_up':
        return 'Camera thụt thò Pop-up tràn viền 100%';
      case 'drop':
        return 'Giọt nước thanh lịch';
      default:
        return type || 'Nốt ruồi tiêu chuẩn';
    }
  };

  const getCurveText = (type) => {
    switch (type) {
      case 'quad_curved':
        return 'Màn cong 4 cạnh Quad-Curved cao cấp';
      case 'curved':
        return 'Màn cong hai bên 58° mềm mại';
      case 'flat':
        return 'Màn phẳng viền siêu mỏng';
      default:
        return type || 'Màn hình vát cong 2.5D';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalDeviceTitle"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 id="modalDeviceTitle" style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
              {device.name}
            </h2>
            {device.name_cn && (
              <span className="badge-tag" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '11px', fontWeight: 600 }}>
                {device.name_cn}
              </span>
            )}
            <span className="badge-tag tag-safe" style={{ fontSize: '10px' }}>
              {device.sku}
            </span>
            <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '10px' }}>
              Nội Địa C00
            </span>
          </div>

          <button
            type="button"
            className="toast-close-btn"
            style={{ padding: '6px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
            onClick={onClose}
            title="Đóng cửa sổ (Esc)"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Top Showcase: Official Studio Renders */}
          <div
            style={{
              background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            {/* View Switcher Controls */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <button
                type="button"
                className={`btn-tool ${viewMode === 'both' ? 'primary' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setViewMode('both')}
              >
                <span>Xem Cả Hai Mặt</span>
              </button>
              <button
                type="button"
                className={`btn-tool ${viewMode === 'front' ? 'primary' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setViewMode('front')}
              >
                <span>Chỉ Mặt Trước (Màn Hình)</span>
              </button>
              <button
                type="button"
                className={`btn-tool ${viewMode === 'back' ? 'primary' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setViewMode('back')}
              >
                <span>Chỉ Mặt Sau (Camera &amp; Lưng)</span>
              </button>
            </div>

            {/* Render Showcase Stage */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '24px',
                minHeight: '180px',
                width: '100%'
              }}
            >
              {/* Front Image */}
              {(viewMode === 'both' || viewMode === 'front') && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img
                    src={frontUrl}
                    alt={`${device.name} - Mặt Trước`}
                    style={{
                      maxHeight: '170px',
                      maxWidth: '120px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))',
                      transition: 'transform 0.2s ease'
                    }}
                    onError={(e) => { e.target.src = 'images/devices/BSN-AN00-front.png'; }}
                  />
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', fontWeight: 600 }}>
                    Mặt Trước (Display)
                  </span>
                </div>
              )}

              {/* Separator if both */}
              {viewMode === 'both' && (
                <div style={{ width: '1px', height: '120px', background: 'rgba(255, 255, 255, 0.1)' }} />
              )}

              {/* Back Image */}
              {(viewMode === 'both' || viewMode === 'back') && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img
                    src={backUrl}
                    alt={`${device.name} - Mặt Sau`}
                    style={{
                      maxHeight: '170px',
                      maxWidth: '120px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))',
                      transition: 'transform 0.2s ease'
                    }}
                    onError={(e) => { e.target.src = 'images/devices/BSN-AN00-back.png'; }}
                  />
                  <span style={{ fontSize: '10px', color: '#38bdf8', marginTop: '6px', fontWeight: 600 }}>
                    Mặt Sau (Camera &amp; Lưng)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Hardware Specs Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Section 1: Core Performance */}
            <div>
              <div className="specs-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="svg-icon" style={{ color: '#f59e0b' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </span>
                <span>Hiệu Năng &amp; Vi Xử Lý</span>
              </div>
              <div className="specs-grid-2col">
                <div className="spec-cell">
                  <span className="spec-cell-label">Vi xử lý (SoC / Chipset)</span>
                  <span className="spec-cell-value" style={{ color: '#38bdf8' }}>{device.soc}</span>
                </div>
                <div className="spec-cell">
                  <span className="spec-cell-label">Tần số quét màn hình</span>
                  <span className="spec-cell-value">
                    Tối đa <span style={{ color: '#f59e0b' }}>{device.max_hz || 120}Hz</span>
                    {device.supported_hz && ` (Hỗ trợ: ${device.supported_hz.join(', ')}Hz)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Display & Screen */}
            <div>
              <div className="specs-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="svg-icon" style={{ color: '#38bdf8' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  </svg>
                </span>
                <span>Màn Hình &amp; Bố Cục Thiết Kế</span>
              </div>
              <div className="specs-grid-2col">
                <div className="spec-cell">
                  <span className="spec-cell-label">Thông số tấm nền</span>
                  <span className="spec-cell-value">{device.screen}</span>
                </div>
                <div className="spec-cell">
                  <span className="spec-cell-label">Độ phân giải vật lý (Pixels)</span>
                  <span className="spec-cell-value font-mono">
                    {device.width_px || 'Đang cập nhật'} × {device.height_px || 'Đang cập nhật'} px
                  </span>
                </div>
                <div className="spec-cell">
                  <span className="spec-cell-label">Kiểu kính &amp; Viền màn</span>
                  <span className="spec-cell-value">{getCurveText(device.curve_type)}</span>
                </div>
                <div className="spec-cell">
                  <span className="spec-cell-label">Thiết kế camera trước</span>
                  <span className="spec-cell-value">{getCutoutText(device.cutout_type)}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Sweet-Spot DPI Tuning */}
            <div>
              <div className="specs-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="svg-icon" style={{ color: '#10b981' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                </span>
                <span>Tỉ Lệ Hiển Thị &amp; DPI Tối Ưu (Golden Ratio)</span>
              </div>
              <div className="specs-grid-2col">
                <div className="spec-cell" style={{ borderLeft: '3px solid #10b981' }}>
                  <span className="spec-cell-label">DPI Tỉ Lệ Vàng (Sweet-Spot 385dp)</span>
                  <span className="spec-cell-value font-mono" style={{ color: '#34d399', fontSize: '14px' }}>
                    {device.sweet_spot_dpi} DPI
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Cho không gian hiển thị rộng rãi, icon sắc nét, không bị phóng đại quá mức.
                  </span>
                </div>
                <div className="spec-cell">
                  <span className="spec-cell-label">DPI Mặc Định Xuất Xưởng</span>
                  <span className="spec-cell-value font-mono" style={{ color: '#e2e8f0' }}>
                    {device.default_dpi} DPI
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Mức DPI gốc ban đầu khi xuất xưởng từ nhà máy.
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: Battery & Durability */}
            <div>
              <div className="specs-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="svg-icon" style={{ color: '#34d399' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="6" width="18" height="12" rx="2"></rect>
                    <line x1="23" y1="11" x2="23" y2="13"></line>
                  </svg>
                </span>
                <span>Năng Lượng &amp; Độ Bền Thân Máy</span>
              </div>
              <div className="specs-grid-2col">
                <div className="spec-cell">
                  <span className="spec-cell-label">Dung lượng &amp; Công nghệ Pin</span>
                  <span className="spec-cell-value" style={{ color: '#34d399' }}>{device.battery}</span>
                </div>
                <div className="spec-cell">
                  <span className="spec-cell-label">Chuẩn kháng nước &amp; Bụi</span>
                  <span className="spec-cell-value">{device.waterproof || 'Tiêu chuẩn kháng nước'}</span>
                </div>
                <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                  <span className="spec-cell-label">Tiêu chuẩn độ bền &amp; Kính bảo vệ</span>
                  <span className="spec-cell-value">{device.durability || 'Chuẩn chống rơi vỡ Honor'}</span>
                </div>
              </div>
            </div>

            {/* Section 5: Identification & Series */}
            <div>
              <div className="specs-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="svg-icon" style={{ color: '#a855f7' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                </span>
                <span>Thông Tin Sản Phẩm &amp; Phân Nhóm</span>
              </div>
              <div className="specs-grid-2col">
                <div className="spec-cell">
                  <span className="spec-cell-label">Dòng máy (Product Series)</span>
                  <span className="spec-cell-value">{device.series}</span>
                </div>
                <div className="spec-cell">
                  <span className="spec-cell-label">Năm phát hành</span>
                  <span className="spec-cell-value">{device.release_year || '2024/2025'}</span>
                </div>
                <div className="spec-cell">
                  <span className="spec-cell-label">Mã SKU chính thức</span>
                  <span className="spec-cell-value font-mono">{device.sku}</span>
                </div>
                <div className="spec-cell">
                  <span className="spec-cell-label">Mã biến thể / Aliases</span>
                  <span className="spec-cell-value font-mono">
                    {device.aliases && device.aliases.length > 0 ? device.aliases.join(', ') : device.sku}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn-tool"
            onClick={handleCopySpecs}
            style={{ padding: '6px 14px' }}
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </span>
            <span>{copied ? 'Đã Sao Chép Thông Số' : 'Sao Chép Thông Số'}</span>
          </button>
          <button
            type="button"
            className="btn-tool primary"
            onClick={onClose}
            style={{ padding: '6px 18px' }}
          >
            <span>Đóng</span>
          </button>
        </div>
      </div>
    </div>
  );
}
