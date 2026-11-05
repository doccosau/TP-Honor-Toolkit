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

  // CRM State
  const [activeModule, setActiveModule] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectItem, setInspectItem] = useState(null);
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

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && inspectItem) {
        setInspectItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectItem]);

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
      summary: 'Thiết lập mức quét khung hình 120Hz/144Hz/165Hz cho tấm nền OLED/LTPO.',
      desc: 'Hệ thống cho phép ép tần số quét tối thiểu và tối đa ngang bằng nhau, giúp các thao tác vuốt cuộn Facebook, TikTok, Chrome luôn ở ngưỡng mượt mà cao nhất.',
      adbCommand: 'adb shell settings put system min_refresh_rate 120\nadb shell settings put system peak_refresh_rate 120',
      impact: 'Khung hình siêu mượt, loại bỏ độ trễ mắt nhìn khi lướt mạng xã hội và chơi game.',
      safety: 'Chuẩn tham số Android Display HAL',
      recommended: true,
      type: 'select',
      value: selectedHz,
      onChange: (val) => setSelectedHz(val),
      options: [
        { value: 'auto', label: 'Tự Động Dynamic (Hệ thống Honor tự quản lý)' },
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
      title: 'Khóa Cứng Tần Số Quét Không Tự Hạ (No-Drop Hz)',
      scope: 'secure: reduce_refresh_rate_enabled = 0',
      summary: 'Tắt cờ tự động hạ về 60Hz khi xem video hoặc khi màn hình đứng yên.',
      desc: 'HonorHook phát hiện MagicOS sở hữu cơ chế hạ xung màn hình ngầm `reduce_refresh_rate_enabled`. Khi tắt cờ này (0), màn hình không bao giờ tự ý tụt xung, triệt tiêu hiện tượng khựng hình khi vuốt app sau khi tạm dừng.',
      adbCommand: 'adb shell settings put secure reduce_refresh_rate_enabled 0',
      impact: 'Duy trì 120Hz/144Hz thực thụ mọi lúc, không giật lag khi chuyển tiếp ứng dụng.',
      safety: 'An Toàn Tuyệt Đối',
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
      summary: 'Tự động mở rộng dải tương phản cho video SDR thông thường.',
      desc: 'Kích hoạt thuật toán xử lý video phần cứng của MagicOS, phân tích từng khung hình của video SDR thông thường (YouTube, TikTok, Netflix SDR) để mở rộng độ sâu màu sắc và độ sáng vùng highlight tương tự chuẩn HDR.',
      adbCommand: 'adb shell settings put secure hn_sdr2hdr_switch 1',
      impact: 'Video có độ tương phản sống động hơn, chi tiết vùng tối rõ nét hơn rõ rệt.',
      safety: 'An Toàn Tuyệt Đối (Tận dụng NPU/GPU có sẵn của máy)',
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
      summary: 'Mở khóa giới hạn độ sáng đỉnh ngoài trời khi xem nội dung dưới nắng gắt.',
      desc: 'Mở khóa thuật toán SDR+ của MagicOS, cho phép tấm nền OLED đẩy độ sáng tức thời lên mức Nit tối đa của màn hình khi cảm biến quang học nhận diện môi trường ngoài trời nắng to.',
      adbCommand: 'adb shell settings put secure hn_sdrplus_switch 1',
      impact: 'Nhìn rõ nét nội dung bản đồ Google Maps, tin nhắn dưới trời nắng gắt.',
      safety: 'An Toàn (Phần cứng tự động điều tiết theo nhiệt độ)',
      recommended: true,
      type: 'toggle',
      checked: sdrPlus,
      onChange: (checked) => setSdrPlus(checked),
    },
    {
      id: 'tianshan',
      category: 'engine',
      categoryLabel: 'Động Cơ Hiển Thị',
      title: 'Siêu Hiển Thị Thiên Sơn Oasis (Tianshan Display Engine)',
      scope: 'secure: hn_tianshan_switch = 1',
      summary: 'Kích hoạt động cơ màn hình bảo vệ mắt cao cấp Thiên Sơn Oasis của Honor.',
      desc: 'Bật thuật toán hiển thị cao cấp Thiên Sơn / Oasis Eye-Protection của Honor trên các dòng Flagship Magic và Series X. Thuật toán mô phỏng ánh sáng tự nhiên dịu mắt và tăng cường độ sắc nét cạnh chữ.',
      adbCommand: 'adb shell settings put secure hn_tianshan_switch 1',
      impact: 'Giảm mỏi mắt khi đọc sách, phông chữ hiển thị thanh mảnh và sắc sảo hơn.',
      safety: 'An Toàn Tuyệt Đối',
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
      scope: 'system: low_resolution_switch = 0',
      summary: 'Khóa chết cờ tự động giảm độ phân giải xuống 1080p/720p khi máy ấm lên.',
      desc: 'MagicOS có cơ chế "Độ phân giải thông minh" tự động hạ kích thước render xuống 1080p hoặc 720p để tiết kiệm pin, khiến chữ bị mờ và icon vỡ hạt. Tùy chọn này tắt hoàn toàn 4 cờ hạ phân giải ngầm.',
      adbCommand: 'adb shell settings put system low_resolution_switch 0\nadb shell settings put global low_resolution_switch 0\nadb shell settings put system smart_resolution_mode 0\nadb shell settings put global aps_display_resolution 0',
      impact: 'Màn hình giữ nguyên độ phân giải vật lý 1.5K/2K siêu sắc nét 100% thời gian.',
      safety: 'An Toàn Tuyệt Đối',
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
      summary: 'Áp dụng công thức 385 dp để giao diện vừa vặn, không bị phóng to thô ráp.',
      desc: 'Giao diện mặc định của máy nội địa thường phóng to quá mức khiến thanh trạng thái và font chữ bị bè to. Toolkit tính toán chính xác DPI = (Chiều rộng pixel vật lý × 160) / 385 để chuẩn hóa tỷ lệ hiển thị vàng 385 dp chuẩn chuyên nghiệp.',
      adbCommand: `adb shell wm density ${sweetDpi}\nadb shell settings put secure display_density_forced ${sweetDpi}`,
      impact: 'Hiển thị nhiều thông tin hơn trên màn hình, layout thanh thoát và chuyên nghiệp.',
      safety: 'Có thể khôi phục bằng nút "Mặc Định Gốc" bất kỳ lúc nào',
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
      summary: 'Mở rộng hiển thị AOD trên toàn bộ tấm nền kèm hình nền nghệ thuật.',
      desc: 'Mặc định AOD chỉ hiển thị đồng hồ nhỏ giữa màn hình đen. Cờ ẩn `enable_full_screen_AOD` cho phép AOD hiển thị hình nền mờ toàn màn hình tuyệt đẹp tương tự chế độ StandBy của iOS và MagicOS Flagship.',
      adbCommand: 'adb shell settings put secure enable_full_screen_AOD 1',
      impact: 'Màn hình khóa sang trọng, hiện đại và thẩm mỹ cao khi đặt máy trên bàn làm việc.',
      safety: 'Tấm nền LTPO tự hạ xuống 1Hz tiết kiệm điện',
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
      summary: 'Tăng thời gian sáng AOD sau khi khóa máy từ 30s lên 200s.',
      desc: 'MagicOS thường tắt AOD sau 30 giây để ép tiết kiệm pin. Tùy chọn này kéo dài thời gian duy trì lên 200 giây (hoặc chạm để sáng lâu hơn), tiện lợi quan sát thông báo.',
      adbCommand: 'adb shell settings put secure lock_to_aod_duration 200',
      impact: 'Xem giờ và thông báo dễ dàng mà không cần liên tục gõ tay vào màn hình.',
      safety: 'An Toàn Tuyệt Đối',
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
      summary: 'Gõ 2 lần chụp màn hình, vẽ chữ S cuộn dài, vẽ chữ C mở camera.',
      desc: 'Kích hoạt công nghệ nhận diện cảm ứng khớp ngón tay (Knuckle Sense) độc quyền của Honor, phân biệt giữa đầu ngón tay và khớp đốt ngón tay.',
      adbCommand: 'adb shell settings put secure fingersense_letters_enabled 1',
      impact: 'Thao tác chụp cuộn màn hình và kích hoạt ứng dụng nhanh gấp 3 lần.',
      safety: 'Tính năng chính thức của MagicOS',
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
      summary: 'Vuốt ngón tay trên cảm biến vân tay để hạ bảng thông báo xuống.',
      desc: 'Cho phép dùng cử chỉ vuốt xuống trên khu vực cảm biến vân tay để kéo thanh thông báo và trung tâm điều khiển xuống nhanh chóng mà không cần với tay lên mép trên màn hình.',
      adbCommand: 'adb shell settings put secure fingerprint_slide_switch 1',
      impact: 'Rất tiện lợi khi sử dụng điện thoại màn hình lớn bằng 1 tay khi đi lại.',
      safety: 'An Toàn Tuyệt Đối',
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
      summary: 'Mức 0.5x cho phản hồi tức thì, mở ứng dụng và chuyển cảnh nhanh gấp đôi.',
      desc: 'Android mặc định đặt tốc độ hoạt ảnh là 1.0x tạo cảm giác hơi trôi chậm. Đặt về 0.5x giúp các hiệu ứng đóng/mở app và vuốt trang nhanh hơn 50% trong khi vẫn giữ trọn vẹn vẻ mượt mà.',
      adbCommand: 'adb shell settings put global window_animation_scale 0.5\nadb shell settings put global transition_animation_scale 0.5\nadb shell settings put global animator_duration_scale 0.5',
      impact: 'Máy mượt và nhanh như chớp, phản hồi cảm ứng nhạy bén hơn đáng kể.',
      safety: 'Chuẩn tham số Android AOSP Developer Options',
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
        item.summary.toLowerCase().includes(q) ||
        item.scope.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [displayItems, activeModule, searchQuery]);

  return (
    <div className="crm-workspace-layout">
      {/* 1. Header & KPI Metric Ribbon */}
      <div className="specs-card" style={{ width: '100%', marginBottom: 0 }}>
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
                Hệ thống CRM Matrix: Click vào từng mục để trượt cửa sổ chi tiết &amp; xem giải phẫu lệnh ADB
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

      {/* 3. Compact CRM Grid Matrix (No more infinite scrolling!) */}
      <div className="crm-grid-matrix">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`crm-card ${inspectItem?.id === item.id ? 'active-selected' : ''}`}
            onClick={() => setInspectItem(item)}
          >
            <div className="crm-card-header">
              <div className="crm-card-title-group">
                <div className="crm-card-icon">
                  {item.category === 'refresh' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                  )}
                  {item.category === 'engine' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  )}
                  {item.category === 'aod' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  )}
                  {item.category === 'animation' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  )}
                </div>

                <div>
                  <div className="crm-card-title">{item.title}</div>
                  <div className="crm-card-meta">
                    <span className="badge-tag tag-neutral" style={{ fontSize: '9px', padding: '1px 5px' }}>
                      {item.categoryLabel}
                    </span>
                    <span className="badge-tag tag-safe" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', padding: '1px 5px' }}>
                      {item.scope}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick interactive control directly on card */}
              <div onClick={(e) => e.stopPropagation()}>
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
                  <span className="badge-tag tag-safe" style={{ fontSize: '10px', padding: '3px 8px' }}>
                    {item.options.find((o) => o.value === item.value)?.value || item.value}
                  </span>
                )}
              </div>
            </div>

            <div className="crm-card-desc">{item.summary}</div>

            <div className="crm-card-footer">
              <span style={{ color: 'var(--text-muted)' }}>
                {item.recommended ? 'Đề xuất kích hoạt' : 'Tùy chọn nâng cao'}
              </span>
              <button
                type="button"
                className="crm-inspect-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectItem(item);
                }}
              >
                <span>Chi tiết &amp; Lệnh ADB</span>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Slide-Over Inspection Drawer (Trượt từ phải sang trái) */}
      {inspectItem && (
        <>
          <div className="crm-drawer-backdrop" onClick={() => setInspectItem(null)} />
          <div className="crm-drawer-panel">
            {/* Drawer Header */}
            <div className="crm-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge-tag tag-safe" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  {inspectItem.scope}
                </span>
                <span className="badge-tag tag-neutral" style={{ fontSize: '10px' }}>
                  {inspectItem.categoryLabel}
                </span>
              </div>
              <button
                type="button"
                className="crm-drawer-close"
                onClick={() => setInspectItem(null)}
                title="Đóng cửa sổ (Esc)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="crm-drawer-body">
              {/* Title & Quick Switch */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)', lineHeight: '1.4' }}>
                    {inspectItem.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {inspectItem.summary}
                  </div>
                </div>

                {inspectItem.type === 'toggle' && (
                  <label className="magicos-switch" style={{ flexShrink: 0, marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={inspectItem.checked}
                      onChange={(e) => inspectItem.onChange(e.target.checked)}
                      disabled={!isOnline}
                    />
                    <span className="magicos-slider"></span>
                  </label>
                )}
              </div>

              {/* Direct Controls in Drawer if Select */}
              {inspectItem.type === 'select' && (
                <div className="crm-drawer-section">
                  <div className="crm-drawer-section-title">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                      <polyline points="2 17 12 22 22 17"></polyline>
                      <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                    <span>Lựa chọn giá trị mục tiêu</span>
                  </div>
                  <select
                    className="tool-select"
                    value={inspectItem.value}
                    onChange={(e) => inspectItem.onChange(e.target.value)}
                    disabled={!isOnline}
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    {inspectItem.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Technical Description */}
              <div className="crm-drawer-section">
                <div className="crm-drawer-section-title">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Mục đích &amp; Cơ chế can thiệp</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                  {inspectItem.desc}
                </div>
              </div>

              {/* Exact ADB Command executed */}
              {inspectItem.adbCommand && (
                <div className="crm-drawer-section">
                  <div className="crm-drawer-section-title">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 17 10 11 4 5"></polyline>
                      <line x1="12" y1="19" x2="20" y2="19"></line>
                    </svg>
                    <span>Lệnh ADB Shell thực thi</span>
                  </div>
                  <div className="crm-code-box">{inspectItem.adbCommand}</div>
                </div>
              )}

              {/* Real-world Impact */}
              {inspectItem.impact && (
                <div className="crm-drawer-section" style={{ borderLeft: '3px solid #38bdf8' }}>
                  <div className="crm-drawer-section-title" style={{ color: '#38bdf8' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    <span>Lợi ích thực tế</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                    {inspectItem.impact}
                  </div>
                </div>
              )}

              {/* Safety Rating */}
              {inspectItem.safety && (
                <div className="crm-drawer-section" style={{ borderLeft: '3px solid #10b981' }}>
                  <div className="crm-drawer-section-title" style={{ color: '#10b981' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>Mức độ an toàn</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                    {inspectItem.safety}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="crm-drawer-footer">
              <button
                type="button"
                className="btn-tool"
                onClick={() => setInspectItem(null)}
                style={{ fontSize: '12px' }}
              >
                Đóng
              </button>

              <button
                type="button"
                className="btn-tool primary"
                onClick={handleApply}
                disabled={!isOnline || isApplying}
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                {isApplying ? 'Đang Lưu...' : 'Lưu Thiết Lập'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}