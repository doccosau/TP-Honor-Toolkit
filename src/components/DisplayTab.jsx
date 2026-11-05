import React, { useState, useEffect, useMemo } from 'react';

export default function DisplayTab({ device, onApplyDisplay }) {
  const [selectedDpi, setSelectedDpi] = useState('auto_sweet');
  const [selectedHz, setSelectedHz] = useState('auto');
  const [lockHighHz, setLockHighHz] = useState(true);
  const [selectedAnim, setSelectedAnim] = useState('0.5');

  // HonorHook MagicOS Display Engine switches
  const [sdr2hdr, setSdr2hdr] = useState(true);
  const [sdrPlus, setSdrPlus] = useState(true);
  const [tianshan, setTianshan] = useState(true);
  const [disableLowRes, setDisableLowRes] = useState(true);

  // AOD & Gesture switches
  const [fullScreenAod, setFullScreenAod] = useState(false);
  const [extendAodDuration, setExtendAodDuration] = useState(false);
  const [knuckleGestures, setKnuckleGestures] = useState(true);
  const [fingerprintSlide, setFingerprintSlide] = useState(false);

  const [activeModule, setActiveModule] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const isOnline = Boolean(device && device.connected);
  const maxHz = device?.max_hz || 120;
  const sweetDpi = device?.sweet_spot_dpi || 532;
  const currentDpi = device?.current_dpi || 480;

  useEffect(() => {
    if (device?.max_hz) {
      setSelectedHz(String(device.max_hz));
    }
  }, [device]);

  const handleApply = async () => {
    if (!isOnline) return;
    setIsApplying(true);
    try {
      await onApplyDisplay({
        dpi: selectedDpi,
        hz: selectedHz,
        lockHighHz,
        anim: selectedAnim,
        sdr2hdr,
        sdrPlus,
        tianshan,
        fullScreenAod,
        extendAodDuration,
        knuckleGestures,
        fingerprintSlide,
        disableLowRes,
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!isOnline) return;
    if (!window.confirm('Khôi phục toàn bộ thiết lập Màn hình, Tần số quét, DPI và Hoạt ảnh về mặc định ban đầu của máy?')) return;
    setIsApplying(true);
    try {
      await onApplyDisplay({
        resetDefaults: true,
      });
      setSelectedDpi('reset');
      setSelectedHz('auto');
      setLockHighHz(false);
      setSelectedAnim('1.0');
      setSdr2hdr(false);
      setSdrPlus(false);
      setTianshan(false);
      setFullScreenAod(false);
      setExtendAodDuration(false);
      setKnuckleGestures(false);
      setFingerprintSlide(false);
      setDisableLowRes(false);
    } finally {
      setIsApplying(false);
    }
  };

  const displayItems = useMemo(() => [
    {
      id: 'refresh_rate',
      category: 'refresh',
      categoryLabel: 'Tần Số Quét',
      title: 'Tần Số Quét Màn Hình Mục Tiêu (Refresh Rate Hz)',
      scope: 'system: min_refresh_rate & peak_refresh_rate',
      desc: 'Thiết lập mức quét khung hình tối đa và tối thiểu của tấm nền OLED/LTPO.',
      impact: 'Trải nghiệm cuộn lướt mượt mà vượt trội ở mức 120Hz/144Hz/165Hz.',
      recommended: true,
      type: 'select',
      value: selectedHz,
      onChange: (val) => setSelectedHz(val),
      options: [
        { value: 'auto', label: 'Tự Động Dynamic (Hệ thống Honor tự quyết định)' },
        { value: '165', label: 'Khóa Cứng 165Hz (Dòng Chuyên Game eSports WIN2)' },
        { value: '144', label: 'Khóa Cứng 144Hz (Dòng WIN Gen 1 / GT / X60 GT)' },
        { value: '120', label: 'Khóa Cứng 120Hz (Chuẩn Flagship Magic / Number / X80)' },
        { value: '90', label: 'Khóa Cứng 90Hz (Dòng Changwan / Play 10 / X50i)' },
        { value: '60', label: 'Khóa Cứng 60Hz (Tiết kiệm pin tối đa)' },
      ],
    },
    {
      id: 'lock_high_hz_no_drop',
      category: 'refresh',
      categoryLabel: 'Tần Số Quét',
      title: 'Khóa Cứng Tần Số Quét Không Tự Hạ (No-Drop Refresh Rate)',
      scope: 'secure: reduce_refresh_rate_enabled = 0',
      desc: 'Tắt tính năng tự ý hạ tần số quét xuống 60Hz của MagicOS khi xem video YouTube/TikTok, gõ bàn phím hoặc khi màn hình đứng yên.',
      impact: 'Màn hình luôn duy trì tốc độ quét tối đa, loại bỏ hoàn toàn hiện tượng khựng giật (stutter) khi vuốt app.',
      recommended: true,
      type: 'toggle',
      checked: lockHighHz,
      onChange: (checked) => setLockHighHz(checked),
    },
    {
      id: 'sdr2hdr',
      category: 'engine',
      categoryLabel: 'Động Cơ Hiển Thị',
      title: 'Nâng Cấp Tự Động SDR Sang HDR (Honor Video Engine)',
      scope: 'secure: hn_sdr2hdr_switch = 1',
      desc: 'Kích hoạt thuật toán nội bộ của MagicOS tự động mở rộng dải tương phản động (Dynamic Range) cho các video SDR thông thường.',
      impact: 'Video YouTube, TikTok, Netflix SDR có màu sắc rực rỡ, độ sâu màu đen và độ sáng vùng highlight tương tự HDR thực tế.',
      recommended: true,
      type: 'toggle',
      checked: sdr2hdr,
      onChange: (checked) => setSdr2hdr(checked),
    },
    {
      id: 'sdr_plus',
      category: 'engine',
      categoryLabel: 'Động Cơ Hiển Thị',
      title: 'Chế Độ Tăng Cường Độ Sáng Đỉnh Ngoài Trời (SDR+ Boost)',
      scope: 'secure: hn_sdrplus_switch = 1',
      desc: 'Mở khóa giới hạn độ sáng đỉnh (Peak Nit) của tấm nền màn hình khi xem nội dung dưới ánh nắng mặt trời trực tiếp.',
      impact: 'Nội dung hiển thị rõ nét ngoài trời nắng gắt, không bị tối mờ hay lóa mắt khi sử dụng ngoài đường.',
      recommended: true,
      type: 'toggle',
      checked: sdrPlus,
      onChange: (checked) => setSdrPlus(checked),
    },
    {
      id: 'tianshan',
      category: 'engine',
      categoryLabel: 'Động Cơ Hiển Thị',
      title: 'Siêu Hiển Thị Thiên Sơn Oasis (Tianshan Eye-Protection Display)',
      scope: 'secure: hn_tianshan_switch = 1',
      desc: 'Bật động cơ hiển thị màn hình bảo vệ mắt cao cấp Thiên Sơn / Oasis Display của Honor trên các dòng máy Magic, X80, X70.',
      impact: 'Tối ưu phổ ánh sáng dịu mắt, giảm ánh sáng xanh có hại và nâng cao độ sắc nét của phông chữ văn bản.',
      recommended: true,
      type: 'toggle',
      checked: tianshan,
      onChange: (checked) => setTianshan(checked),
    },
    {
      id: 'anti_low_res',
      category: 'engine',
      categoryLabel: 'Động Cơ Hiển Thị',
      title: 'Chống Tự Hạ Độ Phân Giải Thông Minh (Anti-Downscaling)',
      scope: 'system: low_resolution_switch = 0 & smart_resolution_mode = 0',
      desc: 'Vô hiệu hóa toàn bộ các cờ tự động giảm độ phân giải xuống 1080p hoặc 720p khi nhiệt độ máy tăng lên.',
      impact: 'Màn hình luôn hiển thị ở độ phân giải gốc 1.5K hoặc 2K sắc nét 100%, không bị vỡ hạt icon và phông chữ.',
      recommended: true,
      type: 'toggle',
      checked: disableLowRes,
      onChange: (checked) => setDisableLowRes(checked),
    },
    {
      id: 'dpi_density',
      category: 'density',
      categoryLabel: 'Mật Độ DPI',
      title: 'Mật Độ Điểm Ảnh DPI Chuẩn Vàng (Sweet-Spot 385 dp)',
      scope: 'wm density & secure: display_density_forced',
      desc: 'Áp dụng công thức chuẩn vàng DPI = (Chiều rộng pixel vật lý × 160) / 385 để giao diện ứng dụng hiển thị vừa vặn, không bị phóng đại quá khổ.',
      impact: 'Không gian hiển thị nhiều nội dung hơn, các icon và chữ thanh thoát, chuẩn thị giác người dùng chuyên nghiệp.',
      recommended: true,
      type: 'select',
      value: selectedDpi,
      onChange: (val) => setSelectedDpi(val),
      options: [
        { value: 'auto_sweet', label: `Tự tính theo màn hình (Chuẩn ${sweetDpi} DPI / 385 dp - Đề Xuất)` },
        { value: '545', label: '545 DPI (Màn hình 2K QuadHD - Magic 9/5/4 Pro)' },
        { value: '532', label: '532 DPI (Màn hình 1.5K 1280px - X80 Pro Max / Magic 8/7/6 Pro)' },
        { value: '508', label: '508 DPI (Màn hình 1.5K 1224px - X70/X60 Pro/WIN/Number)' },
        { value: '449', label: '449 DPI (Màn hình 1080p FHD+ - X60/Play11/X80i)' },
        { value: '300', label: '300 DPI (Màn hình 720p HD+ - Changwan/Play 9T)' },
        { value: 'reset', label: 'Mặc định gốc của máy (Reset Density)' },
      ],
    },
    {
      id: 'full_screen_aod',
      category: 'aod',
      categoryLabel: 'AOD & Cử Chỉ',
      title: 'Always-On Display Toàn Màn Hình (Full-Screen AOD)',
      scope: 'secure: enable_full_screen_AOD = 1',
      desc: 'Mở rộng giao diện hiển thị màn hình khóa Always-On Display trên toàn bộ tấm nền thay vì chỉ ở một vùng nhỏ ở giữa.',
      impact: 'Giao diện AOD hiển thị hình nền mờ nghệ thuật tương tự iOS StandBy và MagicOS 9.0 cao cấp.',
      recommended: false,
      type: 'toggle',
      checked: fullScreenAod,
      onChange: (checked) => setFullScreenAod(checked),
    },
    {
      id: 'extend_aod_duration',
      category: 'aod',
      categoryLabel: 'AOD & Cử Chỉ',
      title: 'Kéo Dài Thời Gian Duy Trì AOD Lên 200 Giây',
      scope: 'secure: lock_to_aod_duration = 200',
      desc: 'Tăng thời gian hiển thị Always-On Display sau khi khóa màn hình từ 30 giây mặc định lên 200 giây.',
      impact: 'Dễ dàng quan sát giờ và thông báo mà không cần chạm tay đánh thức máy liên tục.',
      recommended: false,
      type: 'toggle',
      checked: extendAodDuration,
      onChange: (checked) => setExtendAodDuration(checked),
    },
    {
      id: 'knuckle_gestures',
      category: 'aod',
      categoryLabel: 'AOD & Cử Chỉ',
      title: 'Cử Chỉ Khớp Ngón Tay (Knuckle Gestures)',
      scope: 'secure: fingersense_letters_enabled = 1',
      desc: 'Kích hoạt nhận diện cử chỉ gõ và vẽ chữ bằng khớp ngón tay (Knuckle Sense) trứ danh của MagicOS.',
      impact: 'Gõ 2 lần để chụp ảnh màn hình, vẽ chữ S để cuộn chụp dài, vẽ chữ C để mở nhanh camera.',
      recommended: true,
      type: 'toggle',
      checked: knuckleGestures,
      onChange: (checked) => setKnuckleGestures(checked),
    },
    {
      id: 'fingerprint_slide',
      category: 'aod',
      categoryLabel: 'AOD & Cử Chỉ',
      title: 'Trượt Cảm Biến Vân Tay Kéo Thanh Thông Báo',
      scope: 'secure: fingerprint_slide_switch = 1',
      desc: 'Cho phép vuốt ngón tay xuống trên cảm biến vân tay để hạ bảng điều khiển thông báo xuống mà không cần với tay lên đỉnh màn hình.',
      impact: 'Thao tác sử dụng một tay trên các thiết bị màn hình lớn trở nên thuận tiện và nhanh chóng.',
      recommended: false,
      type: 'toggle',
      checked: fingerprintSlide,
      onChange: (checked) => setFingerprintSlide(checked),
    },
    {
      id: 'animation_scale',
      category: 'animation',
      categoryLabel: 'Tốc Độ Hoạt Ảnh',
      title: 'Tỷ Lệ Tốc Độ Hoạt Ảnh Hệ Thống (Animation Scale)',
      scope: 'global: window_animation_scale, transition_scale, animator_scale',
      desc: 'Điều chỉnh tốc độ hiệu ứng mở ứng dụng, chuyển trang và thu nhỏ màn hình trong hệ điều hành Android.',
      impact: 'Mức 0.5x cho cảm giác máy phản hồi tức thì, thao tác vuốt nhanh gấp đôi mà vẫn giữ được độ mượt mà.',
      recommended: true,
      type: 'select',
      value: selectedAnim,
      onChange: (val) => setSelectedAnim(val),
      options: [
        { value: '0.5', label: '0.5x (Phản hồi siêu tốc, mở app tức thì - Đề Xuất)' },
        { value: '0.75', label: '0.75x (Mượt mà cân bằng, chuyển cảnh tinh tế)' },
        { value: '1.0', label: '1.0x (Chuẩn MagicOS mặc định)' },
        { value: '0.0', label: '0.0x (Tắt hoàn toàn hoạt ảnh - Không độ trễ)' },
      ],
    },
  ], [
    selectedHz,
    lockHighHz,
    sdr2hdr,
    sdrPlus,
    tianshan,
    disableLowRes,
    selectedDpi,
    sweetDpi,
    fullScreenAod,
    extendAodDuration,
    knuckleGestures,
    fingerprintSlide,
    selectedAnim,
  ]);

  const filteredItems = useMemo(() => {
    return displayItems.filter((item) => {
      const matchCat = activeModule === 'all' || item.category === activeModule;
      if (!matchCat) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.scope.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [displayItems, activeModule, searchQuery]);

  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Header & KPI Metric Ribbon */}
      <div className="specs-card" style={{ width: '100%' }}>
        <div className="specs-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="svg-icon" style={{ color: 'var(--brand-accent)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-bright)' }}>
                Quản Lý Màn Hình, Tần Số Quét Hz, DPI Vàng &amp; Động Cơ MagicOS
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Tích hợp công nghệ HonorHook: Khóa 120Hz không tụt, Nâng cấp SDR-HDR, SDR+ Peak &amp; Thiên Sơn Oasis
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn-tool"
              onClick={handleResetDefaults}
              disabled={!isOnline || isApplying}
              title="Khôi phục các tham số màn hình về giá trị ban đầu của máy"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
              <span>Mặc Định Gốc</span>
            </button>

            <button
              type="button"
              className="btn-tool primary"
              onClick={handleApply}
              disabled={!isOnline || isApplying}
              style={{ fontSize: '12px', padding: '6px 16px', fontWeight: 600 }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span>{isApplying ? 'Đang Áp Dụng...' : 'Áp Dụng Thiết Lập Màn Hình'}</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metric Capsules */}
        <div className="metric-capsule-grid" style={{ marginTop: '14px' }}>
          <div className="metric-capsule">
            <span className="metric-capsule-label">Tần Số Quét Thực Tế</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: '#38bdf8' }}>
                {selectedHz === 'auto' ? 'Dynamic' : `${selectedHz}Hz`}
              </span>
              <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                {lockHighHz ? 'Khóa No-Drop' : 'Auto Scale'}
              </span>
            </div>
            <span className="metric-capsule-sub">Hỗ trợ tối đa phần cứng: {maxHz}Hz</span>
          </div>

          <div className="metric-capsule">
            <span className="metric-capsule-label">Mật Độ Điểm Ảnh DPI</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: '#10b981' }}>
                {selectedDpi === 'auto_sweet' ? `${sweetDpi} DPI` : selectedDpi === 'reset' ? 'Gốc' : `${selectedDpi} DPI`}
              </span>
              <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                385 dp
              </span>
            </div>
            <span className="metric-capsule-sub">Hiện tại máy: {currentDpi} DPI • Chuẩn vàng: {sweetDpi} DPI</span>
          </div>

          <div className="metric-capsule">
            <span className="metric-capsule-label">Động Cơ Hình Ảnh MagicOS</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: '#a855f7' }}>
                {sdr2hdr || sdrPlus || tianshan ? 'SDR-HDR • Oasis' : 'Gốc'}
              </span>
            </div>
            <span className="metric-capsule-sub">Nâng cấp dải sáng &amp; Bảo vệ mắt Thiên Sơn</span>
          </div>

          <div className="metric-capsule">
            <span className="metric-capsule-label">Tốc Độ Hoạt Ảnh</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: selectedAnim === '0.5' ? '#10b981' : '#f59e0b' }}>
                {selectedAnim}x
              </span>
            </div>
            <span className="metric-capsule-sub">{selectedAnim === '0.5' ? 'Phản hồi siêu tốc, mở app tức thì' : selectedAnim === '0.0' ? 'Không độ trễ' : 'Chuẩn MagicOS'}</span>
          </div>
        </div>
      </div>

      {/* 2. CRM / ERP Subnav & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div className="crm-subnav" style={{ margin: 0 }}>
          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'all' ? 'active' : ''}`}
            onClick={() => setActiveModule('all')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Tất Cả Tùy Chọn</span>
            <span className="crm-subnav-badge">{displayItems.length}</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'refresh' ? 'active' : ''}`}
            onClick={() => setActiveModule('refresh')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <span>Tần Số Quét Hz</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'engine' ? 'active' : ''}`}
            onClick={() => setActiveModule('engine')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <span>Động Cơ Hình Ảnh MagicOS</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'density' ? 'active' : ''}`}
            onClick={() => setActiveModule('density')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span>Độ Phân Giải &amp; DPI</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'aod' ? 'active' : ''}`}
            onClick={() => setActiveModule('aod')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>AOD &amp; Cử Chỉ</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'animation' ? 'active' : ''}`}
            onClick={() => setActiveModule('animation')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>Tốc Độ Hoạt Ảnh</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            className="tool-input"
            placeholder="Tìm kiếm tham số màn hình..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px' }}
          />
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            style={{ position: 'absolute', left: '10px', top: '10px', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', top: '7px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 3. Detailed Parameter Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="telemetry-card"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--panel-alt)',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
            }}
          >
            {/* Row Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
                <span className="svg-icon" style={{ color: 'var(--brand-accent)', marginTop: '2px' }}>
                  {item.category === 'refresh' && (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                  )}
                  {item.category === 'engine' && (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                    </svg>
                  )}
                  {item.category === 'density' && (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  )}
                  {item.category === 'aod' && (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  )}
                  {item.category === 'animation' && (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  )}
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)' }}>
                      {item.title}
                    </span>
                    <span className="badge-tag tag-neutral" style={{ fontSize: '10px' }}>
                      {item.categoryLabel}
                    </span>
                    <span className="badge-tag tag-safe" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                      {item.scope}
                    </span>
                    {item.recommended && (
                      <span className="badge-tag" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '9px' }}>
                        Khuyên Dùng
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px', lineHeight: '1.5' }}>
                    {item.desc}
                  </div>
                </div>
              </div>

              {/* Action Control: Switch or Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.type === 'toggle' && (
                  <label className="magicos-switch">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.onChange(e.target.checked)}
                      disabled={!isOnline}
                    />
                    <span className="magicos-slider"></span>
                  </label>
                )}

                {item.type === 'select' && (
                  <select
                    className="tool-select"
                    value={item.value}
                    onChange={(e) => item.onChange(e.target.value)}
                    disabled={!isOnline}
                    style={{ minWidth: '240px', maxWidth: '340px', fontSize: '12px' }}
                  >
                    {item.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Impact Note */}
            {item.impact && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  background: 'rgba(56, 189, 248, 0.05)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  borderLeft: '2px solid #38bdf8',
                  lineHeight: '1.4',
                }}
              >
                <b style={{ color: '#38bdf8' }}>Hiệu quả:</b> {item.impact}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}