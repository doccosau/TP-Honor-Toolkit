import React, { useState, useEffect } from 'react';

export default function DisplayTab({ device, onApplyDisplay }) {
  const [selectedDpi, setSelectedDpi] = useState('auto_sweet');
  const [selectedHz, setSelectedHz] = useState('auto');
  const [selectedAnim, setSelectedAnim] = useState('1.0');

  const isOnline = device && device.connected;
  const maxHz = device?.max_hz || 120;
  const sweetDpi = device?.sweet_spot_dpi || 532;

  useEffect(() => {
    if (device?.max_hz) {
      setSelectedHz(String(device.max_hz));
    }
  }, [device]);

  const handleApply = () => {
    onApplyDisplay({
      dpi: selectedDpi,
      hz: selectedHz,
      anim: selectedAnim,
    });
  };

  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="specs-card" style={{ width: '100%' }}>
        {/* Header */}
        <div className="specs-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </span>
            <span>Quản Lý Độ Phân Giải, Mật Độ Điểm Ảnh (DPI) & Khóa Tần Số Quét</span>
          </div>
          <button className="btn-tool primary" onClick={handleApply} disabled={!isOnline}>
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            </span>
            <span>Áp Dụng Thiết Lập</span>
          </button>
        </div>

        {/* 3 Columns Settings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', margin: '14px 0' }}>
          {/* DPI Density */}
          <div style={{ background: 'var(--panel-alt)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: '8px' }}>
              Mật Độ Điểm Ảnh (DPI Density)
            </div>
            <select
              className="tool-select"
              style={{ width: '100%', marginBottom: '6px' }}
              value={selectedDpi}
              onChange={(e) => setSelectedDpi(e.target.value)}
              disabled={!isOnline}
            >
              <option value="auto_sweet">Tự tính theo màn hình (Chuẩn {sweetDpi} DPI / 385 dp)</option>
              <option value="545">545 DPI (Màn 2K - Magic 9/5/4 Pro)</option>
              <option value="532">532 DPI (Màn 1.5K 1280px - X80 Pro Max / Magic 8/7/6 Pro)</option>
              <option value="508">508 DPI (Màn 1.5K 1224px - X70/X60 Pro/WIN/Number)</option>
              <option value="449">449 DPI (Màn 1080p FHD+ - X60/Play11/X80i)</option>
              <option value="300">300 DPI (Màn 720p HD+ - Changwan/Play 9T)</option>
              <option value="reset">Mặc định của máy (Reset Density)</option>
            </select>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
              Hiện tại: <b style={{ color: '#38bdf8' }}>{device?.current_dpi || '--'} DPI</b> • Chuẩn vàng: <b style={{ color: '#10b981' }}>{sweetDpi} DPI</b>
            </div>
          </div>

          {/* Refresh Rate */}
          <div style={{ background: 'var(--panel-alt)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>Khóa Tần Số Quét (Hz)</span>
              <span className="badge-tag tag-safe" style={{ fontSize: '10px' }}>
                Hỗ trợ tối đa: {maxHz}Hz
              </span>
            </div>
            <select
              className="tool-select"
              style={{ width: '100%', marginBottom: '6px' }}
              value={selectedHz}
              onChange={(e) => setSelectedHz(e.target.value)}
              disabled={!isOnline}
            >
              <option value="auto">Chế độ tự động Dynamic (Hệ thống quản lý)</option>
              <option value="165">Khóa 165Hz (Dòng WIN2 eSports)</option>
              <option value="144">Khóa 144Hz (Dòng WIN Gen 1 / GT / X60 GT)</option>
              <option value="120">Khóa 120Hz (Chuẩn Flagship Magic / Number / X80 / X70)</option>
              <option value="90">Khóa 90Hz (Dòng Changwan / Play 10 / X50i)</option>
              <option value="60">Khóa 60Hz (Chuẩn tiết kiệm pin)</option>
            </select>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
              Khóa cứng mức quét giúp mượt mà khi cuộn Facebook, TikTok và lướt web.
            </div>
          </div>

          {/* Animation Scale */}
          <div style={{ background: 'var(--panel-alt)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: '8px' }}>
              Tốc Độ Hiệu Ứng Chuyển Động (Animation)
            </div>
            <select
              className="tool-select"
              style={{ width: '100%', marginBottom: '6px' }}
              value={selectedAnim}
              onChange={(e) => setSelectedAnim(e.target.value)}
              disabled={!isOnline}
            >
              <option value="1.0">1.0x (Chuẩn MagicOS mặc định)</option>
              <option value="0.5">0.5x (Nhanh tức thì, phản hồi siêu tốc)</option>
              <option value="0.0">Tắt hiệu ứng chuyển động (Không độ trễ)</option>
            </select>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
              Giảm tốc độ chuyển cảnh giúp mở app và thao tác vuốt nhanh gấp đôi.
            </div>
          </div>
        </div>

        {/* Technical Explanations */}
        <div style={{ background: 'var(--panel-alt)', padding: '14px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: '4px' }}>
            Công Thức Chuẩn Hóa Giao Diện 385 dp:
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
            Tool sẽ tính toán chính xác giá trị DPI = (Chiều rộng pixel vật lý × 160) / 385. Đồng thời vô hiệu hóa cờ hạ độ phân giải thông minh (<code>low_resolution_switch = 0</code>) để MagicOS không tự ý reset màn hình về tỉ lệ phóng to thô ráp.
          </p>
        </div>
      </div>
    </div>
  );
}
