import React, { useState } from 'react';
import devicesData from '../data/devices.json';
import DeviceDetailModal from './DeviceDetailModal';

export default function DeviceDatabaseTab() {
  const [selectedSeries, setSelectedSeries] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);

  const devices = devicesData.devices || [];

  const seriesList = [
    { id: 'all', name: `Tất Cả (${devices.length} Models)` },
    { id: 'Magic Flagship', name: 'Magic Flagship (Magic 9/8/7/6)' },
    { id: 'WIN Series', name: 'Dòng Gaming WIN (WIN2/Turbo/RT)' },
    { id: 'Magic Foldable', name: 'Màn Hình Gập (Magic V3/V2/Flip)' },
    { id: 'Number Series', name: 'Number Series (50 - 600)' },
    { id: 'X Series', name: 'X Series (X80/X70/X60/X50/X40)' },
    { id: 'GT Series', name: 'GT Series Hiệu Năng Cao' },
    { id: 'Play', name: 'Play & Changwan' },
    { id: 'Tablet', name: 'Máy Tính Bảng (MagicPad / Pad)' },
  ];

  const filtered = devices.filter((d) => {
    if (selectedSeries !== 'all') {
      const s = selectedSeries.toLowerCase();
      const devSeries = (d.series || '').toLowerCase();
      const devName = (d.name || '').toLowerCase();
      if (s === 'tablet') {
        if (!devSeries.includes('pad') && !devName.includes('pad') && !devName.includes('bảng')) return false;
      } else if (!devSeries.includes(s) && !devName.includes(s)) {
        return false;
      }
    }
    const q = query.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.name_cn || '').toLowerCase().includes(q) ||
      d.sku.toLowerCase().includes(q) ||
      (d.soc || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Filter Bar */}
      <div className="specs-card" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>
              Kho Dữ Liệu {devices.length} Dòng Máy Honor Nội Địa Trung Quốc (Bản Gốc C00 - Cập Nhật 2026)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
              Tra cứu thông số kỹ thuật, ảnh render chuẩn mặt trước / mặt sau trực tiếp từ Honor Studio, độ phân giải &amp; DPI tỉ lệ vàng (sweet-spot 385dp).
            </div>
          </div>

          <div>
            <input
              type="text"
              className="select-input"
              style={{ width: '220px', padding: '4px 8px', fontSize: '11px' }}
              placeholder="Tìm kiếm model, SKU, vi xử lý..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Series Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
          {seriesList.map((s) => (
            <button
              key={s.id}
              className={`btn-tool ${selectedSeries === s.id ? 'primary' : ''}`}
              onClick={() => setSelectedSeries(s.id)}
            >
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Device Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
        {filtered.map((dev) => {
          const frontUrl = dev.render_front || `images/devices/${dev.sku}-front.png`;
          const backUrl = dev.render_back || `images/devices/${dev.sku}-back.png`;

          return (
            <div
              key={dev.sku}
              className="specs-card device-card-clickable"
              style={{ padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              onClick={() => setSelectedDevice(dev)}
              title={`Nhấn để xem thông số chi tiết của ${dev.name}`}
            >
              <div>
                {/* Dual Front & Back Authentic Studio Renders */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    height: '145px',
                    marginBottom: '10px',
                    background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'relative'
                  }}
                >
                  {/* Front Render (Screen) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={frontUrl}
                        alt={`${dev.name} - Mặt Trước`}
                        title={`${dev.name} - Mặt Trước (Màn Hình Chuẩn)`}
                        style={{
                          maxHeight: '115px',
                          maxWidth: '75px',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))'
                        }}
                        onError={(e) => {
                          e.target.src = 'images/devices/BSN-AN00-front.png';
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>
                      Mặt Trước
                    </span>
                  </div>

                  {/* Divider */}
                  <div style={{ width: '1px', height: '70%', background: 'rgba(255,255,255,0.08)' }} />

                  {/* Back Render (Camera & Body) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={backUrl}
                        alt={`${dev.name} - Mặt Sau`}
                        title={`${dev.name} - Mặt Sau (Cụm Camera & Lưng Máy Chuẩn)`}
                        style={{
                          maxHeight: '115px',
                          maxWidth: '75px',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))'
                        }}
                        onError={(e) => {
                          e.target.src = 'images/devices/BSN-AN00-back.png';
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '9px', color: '#38bdf8', fontWeight: 500, marginTop: '2px' }}>
                      Mặt Sau
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px', gap: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: '13px', letterSpacing: '-0.2px' }}>
                    {dev.name}
                  </div>
                  {dev.name_cn && (
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', flexShrink: 0 }}>
                      {dev.name_cn}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px' }}>{dev.sku}</span>
                  <span className="badge-tag tag-warning" style={{ fontSize: '9px' }}>{dev.max_hz || 120}Hz</span>
                </div>
                <div style={{ fontSize: '11px', color: '#38bdf8', marginBottom: '2px' }}>
                  <b>SoC:</b> {dev.soc}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>
                  <b>Màn:</b> {dev.screen}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  <b>DPI Vàng:</b> <span className="font-mono">{dev.sweet_spot_dpi} DPI</span> (Mặc định: {dev.default_dpi})
                </div>
              </div>

              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px'
                }}
              >
                <span style={{ color: '#94a3b8' }}>Pin: {dev.battery}</span>
                <span style={{ color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  Chi Tiết ➔
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hardware Specifications Detail Modal */}
      {selectedDevice && (
        <DeviceDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
}
