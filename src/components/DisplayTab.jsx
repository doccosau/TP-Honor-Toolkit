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

  // Navigation State: null = Master Hub (Cards View), 'refresh' | 'engine' | 'density' | 'aod' | 'gestures' = Dedicated Slide-Out Workspace
  const [activeModule, setActiveModule] = useState(null);
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

  // Handle ESC key to return to Hub or close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (inspectItem) {
          setInspectItem(null);
        } else if (activeModule !== null) {
          setActiveModule(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectItem, activeModule]);

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

  // Structured Display Items Inventory
  const displayItems = useMemo(
    () => [
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
        categoryLabel: 'AOD Màn Hình Khóa',
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
        categoryLabel: 'AOD Màn Hình Khóa',
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
        category: 'gestures',
        categoryLabel: 'Cử Chỉ Độc Quyền',
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
        category: 'gestures',
        categoryLabel: 'Cử Chỉ Độc Quyền',
        title: 'Trượt Cảm Biến Vân Tay Kéo Bảng Thông Báo',
        scope: 'secure: fingerprint_slide_switch = 1',
        summary: 'Vuốt ngón tay trên cảm biến vân tay để hạ thanh thông báo xuống.',
        desc: 'Cho phép dùng cử chỉ vuốt xuống trên khu vực cảm biến vân tay để kéo thanh thông báo và trung tâm điều khiển xuống nhanh chóng mà không cần với tay lên mép trên màn hình.',
        adbCommand: 'adb shell settings put secure fingerprint_slide_switch 1',
        impact: 'Thao tác sử dụng một tay trên các thiết bị màn hình lớn thuận tiện hơn.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: false,
        type: 'toggle',
        checked: fingerprintSlide,
        onChange: (checked) => setFingerprintSlide(checked),
      },
      {
        id: 'anim_scale',
        category: 'gestures',
        categoryLabel: 'Hoạt Ảnh Hệ Thống',
        title: 'Tốc Độ Hoạt Ảnh Chuyển Cảnh Window Animation (0.5x)',
        scope: 'global: window_animation_scale, transition_animation_scale, animator_duration_scale',
        summary: 'Tăng tốc hoạt ảnh mở ứng dụng lên gấp đôi (0.5x) cho cảm giác phản hồi tức thì.',
        desc: 'Rút ngắn thời gian diễn hoạt khung hình mở app, đóng app và chuyển đổi đa nhiệm từ 1.0x xuống 0.5x (hoặc 0x nếu muốn phản hồi ngay lập tức không trễ).',
        adbCommand: 'adb shell settings put global window_animation_scale 0.5\nadb shell settings put global transition_animation_scale 0.5\nadb shell settings put global animator_duration_scale 0.5',
        impact: 'Điện thoại cảm giác phản hồi nhanh hơn gấp 2 lần, không tốn tài nguyên GPU.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'select',
        value: selectedAnim,
        onChange: (val) => setSelectedAnim(val),
        options: [
          { value: '0.5', label: 'Tốc độ 0.5x (Phản Hồi Siêu Nhanh - Đề Xuất)' },
          { value: '0', label: 'Tắt hoạt ảnh 0x (Phản Hồi Ngay Lập Tức)' },
          { value: '1.0', label: 'Mặc định nhà sản xuất 1.0x' },
        ],
      },
    ],
    [
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
    ]
  );

  // 5 Master Display Modules for Hub
  const masterDisplayModules = useMemo(
    () => [
      {
        id: 'refresh',
        title: 'Khóa Cứng Tần Số Quét 120Hz/144Hz Không Tụt',
        subtitle: 'Triệt Tiêu Khựng Hình Khi Xem Video',
        badge: lockHighHz ? 'No-Drop 120Hz OK' : `${selectedHz}Hz`,
        badgeType: 'tag-safe',
        desc: 'Tắt cờ `reduce_refresh_rate_enabled` tự động hạ về 60Hz của MagicOS khi xem TikTok/YouTube, gõ bàn phím hoặc khi màn hình đứng yên. Duy trì độ mượt 100% thời gian.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        ),
        countLabel: '2 Tinh Chỉnh Khung Hình',
      },
      {
        id: 'engine',
        title: 'Động Cơ Hiển Thị Thiên Sơn Oasis & SDR->HDR',
        subtitle: 'Bảo Vệ Mắt & Tăng Dải Nhạy Sáng Video',
        badge: tianshan && sdr2hdr ? 'Oasis & HDR Bật' : 'Động Cơ Gốc',
        badgeType: 'tag-safe',
        desc: 'Kích hoạt thuật toán hiển thị cao cấp Thiên Sơn Oasis mô phỏng ánh sáng tự nhiên dịu mắt ban đêm, nâng cấp tương phản video SDR sang HDR và chống tự hạ độ phân giải khi máy ấm.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        ),
        countLabel: '4 Thuật Toán Màn Hình',
      },
      {
        id: 'density',
        title: 'Mật Độ DPI Chuẩn Vàng 385 dp',
        subtitle: 'Chuẩn Hóa Kích Thước Giao Diện Thanh Thoát',
        badge: selectedDpi === 'auto_sweet' ? `${sweetDpi} DPI Tối Ưu` : `${selectedDpi} DPI`,
        badgeType: 'tag-safe',
        desc: 'Khắc phục triệt để tình trạng giao diện ROM nội địa bị bè to thô ráp. Áp dụng công thức vàng (Pixel Width × 160) / 385 để thanh trạng thái, icon và phông chữ đạt tỷ lệ vàng thanh thoát.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        ),
        countLabel: '1 Tinh Chỉnh Render',
      },
      {
        id: 'aod',
        title: 'Always-On Display Toàn Màn Hình & Kéo Dài',
        subtitle: 'Màn Hình Khóa Sang Trọng StandBy',
        badge: fullScreenAod ? 'Full-Screen AOD' : 'AOD Tiêu Chuẩn',
        badgeType: fullScreenAod ? 'tag-safe' : 'tag-neutral',
        desc: 'Mở rộng AOD trên toàn bộ diện tích tấm nền OLED kèm hình nền mờ nghệ thuật tương tự chế độ StandBy của iOS và Flagship MagicOS, kéo dài thời gian sáng từ 30s lên 200s.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        ),
        countLabel: '2 Tinh Chỉnh Khóa',
      },
      {
        id: 'gestures',
        title: 'Cử Chỉ Khớp Ngón Tay & Hoạt Ảnh Siêu Nhanh',
        subtitle: 'Thao Tác Một Tay Thuận Tiện',
        badge: knuckleGestures ? 'Knuckle Sense OK' : 'Mặc Định',
        badgeType: 'tag-safe',
        desc: 'Kích hoạt nhận diện gõ khớp ngón tay (Knuckle Sense) chụp ảnh cuộn màn hình, cử chỉ trượt cảm biến vân tay để kéo thanh thông báo và tăng tốc hoạt ảnh chuyển cảnh lên 0.5x.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
          </svg>
        ),
        countLabel: '3 Tiện Ích Tương Tác',
      },
    ],
    [selectedHz, lockHighHz, tianshan, sdr2hdr, selectedDpi, sweetDpi, fullScreenAod, knuckleGestures]
  );

  const activeModuleMeta = useMemo(() => {
    return masterDisplayModules.find((m) => m.id === activeModule);
  }, [masterDisplayModules, activeModule]);

  // Items in active module view
  const currentItems = useMemo(() => {
    if (!activeModule) return [];
    return displayItems.filter((item) => item.category === activeModule);
  }, [displayItems, activeModule]);

  return (
    <div className="crm-workspace-layout">
      {/* =========================================================================
          VIEW A: MASTER HUB LAUNCHPAD (When activeModule === null)
          ========================================================================= */}
      {activeModule === null && (
        <>
          {/* Header & KPI Summary */}
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
                    Tối Ưu Hóa Màn Hình &amp; Tần Số Quét MagicOS
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Trung tâm điều khiển phân tầng: Chọn bất kỳ thẻ bên dưới để cấu hình chi tiết từng hệ thống hiển thị
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-tool"
                  onClick={handleResetDefaults}
                  disabled={!isOnline || isApplying}
                  style={{ fontSize: '11.5px', padding: '5px 12px' }}
                >
                  Khôi Phục Màn Hình Gốc
                </button>
                <button
                  type="button"
                  className="btn-tool primary"
                  onClick={handleApply}
                  disabled={!isOnline || isApplying}
                  style={{ fontSize: '11.5px', padding: '5px 14px', fontWeight: 600 }}
                >
                  {isApplying ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>

            {/* 4 Quick KPI Capsules */}
            <div className="metric-capsule-grid" style={{ marginTop: '14px' }}>
              <div className="metric-capsule">
                <span className="metric-capsule-label">Tần Số Quét Mục Tiêu</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: '#38bdf8' }}>
                    {lockHighHz ? 'Khóa 120Hz' : selectedHz}
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    No-Drop
                  </span>
                </div>
                <span className="metric-capsule-sub">Không tụt 60Hz khi xem video/TikTok</span>
              </div>

              <div className="metric-capsule">
                <span className="metric-capsule-label">Động Cơ Thiên Sơn &amp; HDR</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: tianshan && sdr2hdr ? '#10b981' : '#f59e0b' }}>
                    {tianshan && sdr2hdr ? 'Oasis & HDR OK' : 'Bật Một Phần'}
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Bảo Vệ Mắt
                  </span>
                </div>
                <span className="metric-capsule-sub">Dịu mắt ban đêm • Nâng dải màu video</span>
              </div>

              <div className="metric-capsule">
                <span className="metric-capsule-label">Mật Độ Điểm Ảnh DPI</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: '#a855f7' }}>
                    {selectedDpi === 'auto_sweet' ? `${sweetDpi} DPI` : selectedDpi}
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    385 dp Vàng
                  </span>
                </div>
                <span className="metric-capsule-sub">Hiển thị thanh thoát, không bè thô</span>
              </div>

              <div className="metric-capsule">
                <span className="metric-capsule-label">AOD &amp; Cử Chỉ Khớp Tay</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: knuckleGestures ? '#10b981' : '#94a3b8' }}>
                    {knuckleGestures ? 'Knuckle Bật' : 'Tắt'}
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Chụp Cuộn
                  </span>
                </div>
                <span className="metric-capsule-sub">Gõ 2 lần chụp màn hình • Vuốt vân tay</span>
              </div>
            </div>
          </div>

          {/* 5 Grand Master Display Tiles */}
          <div className="crm-hub-grid">
            {masterDisplayModules.map((mod) => (
              <div
                key={mod.id}
                className="crm-hub-tile"
                onClick={() => setActiveModule(mod.id)}
              >
                <div>
                  <div className="crm-hub-tile-header">
                    <div className="crm-hub-icon-container">{mod.icon}</div>
                    <span className={`badge-tag ${mod.badgeType}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {mod.badge}
                    </span>
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <div className="crm-hub-tile-title">{mod.title}</div>
                    <div className="crm-hub-tile-subtitle">{mod.subtitle}</div>
                    <div className="crm-hub-tile-desc" style={{ marginTop: '8px' }}>
                      {mod.desc}
                    </div>
                  </div>
                </div>

                <div className="crm-hub-tile-footer">
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {mod.countLabel}
                  </span>
                  <div className="crm-hub-action-prompt">
                    <span>Mở Cấu Hình</span>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW B: DEDICATED SLIDE-OUT WORKSPACE (When a Master Tile is Clicked)
          ========================================================================= */}
      {activeModule !== null && activeModuleMeta && (
        <div className="crm-slide-workspace">
          {/* Top Breadcrumb & Back Navigation Bar */}
          <div className="specs-card" style={{ width: '100%', marginBottom: 0, padding: '16px 20px' }}>
            <div className="crm-top-breadcrumb-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  type="button"
                  className="crm-back-button"
                  onClick={() => setActiveModule(null)}
                  title="Quay lại danh mục màn hình tổng quan (Phím ESC)"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>Quay Lại Tổng Quan</span>
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '3px' }}>
                    <span>TP TOOLKIT</span>
                    <span>/</span>
                    <span>MÀN HÌNH &amp; TẦN SỐ QUÉT</span>
                    <span>/</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{activeModuleMeta.title.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                    {activeModuleMeta.title}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                  <span>Display HAL: OK</span>
                </div>

                <button
                  type="button"
                  className="btn-tool primary"
                  onClick={handleApply}
                  disabled={!isOnline || isApplying}
                  style={{ fontSize: '11.5px', padding: '6px 16px', fontWeight: 600 }}
                >
                  {isApplying ? 'Đang Lưu...' : 'Lưu & Áp Dụng Ngay'}
                </button>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px', lineHeight: '1.5' }}>
              {activeModuleMeta.desc}
            </div>
          </div>

          {/* Dedicated Cards for this specific display subsystem */}
          <div className="crm-grid-matrix">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="crm-card"
                onClick={() => setInspectItem(item)}
              >
                <div className="crm-card-header">
                  <div className="crm-card-title-group">
                    <div>
                      <div className="crm-card-title">{item.title}</div>
                      <div className="crm-card-meta">
                        <span className="badge-tag tag-neutral" style={{ fontSize: '9px' }}>
                          {item.categoryLabel}
                        </span>
                        <span className="badge-tag tag-safe" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                          {item.scope}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Control */}
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
                      <select
                        className="tool-select"
                        value={item.value}
                        onChange={(e) => item.onChange(e.target.value)}
                        style={{ fontSize: '11px', padding: '4px 8px' }}
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

                {/* Plain-Language Explanation */}
                <div className="crm-card-desc">{item.summary}</div>

                {/* Collapsible Technical ADB Command */}
                {item.adbCommand && (
                  <details
                    className="crm-tech-accordion"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <summary>Xem lệnh kỹ thuật ADB Shell</summary>
                    <div style={{ padding: '8px 10px' }}>
                      <div className="crm-code-box" style={{ fontSize: '11px' }}>
                        {item.adbCommand}
                      </div>
                    </div>
                  </details>
                )}

                <div className="crm-card-footer">
                  <span style={{ color: 'var(--text-muted)' }}>
                    {item.impact || 'Bấm để xem thông số & tác động'}
                  </span>
                  <button
                    type="button"
                    className="crm-inspect-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectItem(item);
                    }}
                  >
                    <span>Giải phẫu chi tiết</span>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SLIDE-OVER INSPECTION DRAWER (For Deep Technical Breakdown)
          ========================================================================= */}
      {inspectItem && (
        <>
          <div className="crm-drawer-backdrop" onClick={() => setInspectItem(null)} />
          <div className="crm-drawer-panel">
            <div className="crm-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge-tag tag-safe" style={{ fontSize: '10.5px' }}>
                  {inspectItem.categoryLabel}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>
                  Giải Phẫu Kỹ Thuật
                </span>
              </div>
              <button
                type="button"
                className="crm-drawer-close"
                onClick={() => setInspectItem(null)}
                title="Đóng (ESC)"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="crm-drawer-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', lineHeight: '1.3' }}>
                  {inspectItem.title}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  Phạm vi: {inspectItem.scope}
                </div>
              </div>

              <div className="crm-drawer-section">
                <div className="crm-drawer-section-title">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Mục đích &amp; Cơ chế hoạt động</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                  {inspectItem.desc}
                </div>
              </div>

              {inspectItem.adbCommand && (
                <div className="crm-drawer-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="crm-drawer-section-title">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="4 17 10 11 4 5"></polyline>
                        <line x1="12" y1="19" x2="20" y2="19"></line>
                      </svg>
                      <span>Lệnh ADB Shell thực thi</span>
                    </div>
                    <button
                      type="button"
                      className="btn-tool"
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                      onClick={() => {
                        navigator.clipboard.writeText(inspectItem.adbCommand);
                        alert('Đã sao chép lệnh ADB vào clipboard!');
                      }}
                    >
                      Sao Chép
                    </button>
                  </div>
                  <div className="crm-code-box">{inspectItem.adbCommand}</div>
                </div>
              )}

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
                {isApplying ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
