import React, { useState } from 'react';

export default function DeviceChassis({ device, onMasterOptimize, onLaunchScrcpy, onReboot }) {
  const [viewMode, setViewMode] = useState('front'); // 'front' | 'back'

  const isOnline = device && device.connected;
  const devSku = device?.sku || device?.model;
  const frontImg = isOnline ? (device.render_front || (devSku ? `images/devices/${devSku}-front.png` : null) || device.render_hero) : null;
  const backImg = isOnline ? (device.render_back || (devSku ? `images/devices/${devSku}-back.png` : null) || device.render_hero) : null;
  const currentImg = viewMode === 'front' ? frontImg : backImg;

  return (
    <aside className="device-sidebar-pane">
      {/* Real Product Render Showcase */}
      <div className="device-render-container">
        {/* Front / Back Switcher */}
        <div className="device-view-switcher">
          <button
            id="btnViewFront"
            className={`btn-view-toggle ${viewMode === 'front' ? 'active' : ''}`}
            onClick={() => setViewMode('front')}
            type="button"
            title="Xem ảnh render mặt trước (Màn hình)"
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </span>
            <span>Mặt Trước</span>
          </button>
          <button
            id="btnViewBack"
            className={`btn-view-toggle ${viewMode === 'back' ? 'active' : ''}`}
            onClick={() => setViewMode('back')}
            type="button"
            title="Xem ảnh render mặt sau (Cụm camera & Lưng máy)"
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <circle cx="12" cy="7" r="2.5"></circle>
              </svg>
            </span>
            <span>Mặt Sau</span>
          </button>
        </div>

        {/* Real Product Render Image */}
        <div className="device-render-stage" id="renderStage">
          {currentImg ? (
            <img
              id="imgDeviceRender"
              className="device-render-img"
              src={currentImg}
              alt={device?.commercial_name || "Honor China Device"}
              onError={(e) => {
                if (!e.target.dataset.triedJpg && devSku) {
                  e.target.dataset.triedJpg = 'true';
                  e.target.src = `images/devices/${devSku}.jpg`;
                } else if (!e.target.dataset.triedPng && devSku) {
                  e.target.dataset.triedPng = 'true';
                  e.target.src = `images/devices/${devSku}-front.png`;
                }
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', padding: '20px 10px', color: 'var(--text-muted)' }}>
              <div style={{ width: '84px', height: '154px', borderRadius: '18px', border: '2px dashed rgba(255, 255, 255, 0.16)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ width: '26px', height: '4px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '2px' }} />
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.18)' }} />
              </div>
              <span style={{ fontSize: '11px', textAlign: 'center', lineHeight: '1.4', opacity: 0.8 }}>
                Cắm cáp USB để nhận diện<br />mọi dòng máy Honor nội địa
              </span>
            </div>
          )}
          <span id="screenModelSub" style={{ display: 'none' }}>
            {device?.model || '--'}
          </span>
        </div>
      </div>

      {/* Model Headings */}
      <div id="labelDeviceName" className="device-name-heading">
        {isOnline ? device.commercial_name : 'Chưa kết nối điện thoại'}
      </div>
      <div id="labelDeviceSku" className="device-sku-sub">
        {isOnline
          ? `${device.model} • ${device.magic_version} (${device.rom_region || 'Nội Địa Trung Quốc (Bản Gốc C00)'})`
          : 'Vui lòng cắm cáp USB và bật Gỡ lỗi ADB'}
      </div>

      {/* Quick Action Buttons (Exact 3 buttons from original web) */}
      <div className="device-quick-buttons">
        <button
          id="btn1ClickMaster"
          className="btn-tool primary"
          style={{ justifyContent: 'center', padding: '7px 10px' }}
          onClick={onMasterOptimize}
        >
          <span className="svg-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </span>
          <span>Tối Ưu Hóa Toàn Diện</span>
        </button>

        <button
          id="btnQuickScrcpy"
          className="btn-tool"
          style={{ justifyContent: 'center' }}
          onClick={() => onLaunchScrcpy?.({ turnOffScreen: true, stayAwake: true })}
        >
          <span className="svg-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"></path>
              <polyline points="8 21 12 17 16 21"></polyline>
              <line x1="12" y1="17" x2="12" y2="21"></line>
              <path d="M17 8l5-5"></path>
              <path d="M17 3h5v5"></path>
            </svg>
          </span>
          <span>Chiếu Màn Hình 120Hz</span>
        </button>

        <button
          id="btnQuickReboot"
          className="btn-tool"
          style={{ justifyContent: 'center' }}
          onClick={() => onReboot('system')}
        >
          <span className="svg-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
              <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
          </span>
          <span>Khởi Động Lại Máy</span>
        </button>
      </div>
    </aside>
  );
}
