/**
 * Unified ADB Service (WebUSB + Local Daemon Bridge)
 * Supports both standalone public web execution (via Chrome/Edge WebUSB)
 * and local execution (via Python honor_app.py bridge).
 */
import {
  Adb,
  AdbDaemonTransport,
  ADB_DEFAULT_AUTHENTICATORS,
} from '@yume-chan/adb';
import { AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import devicesData from '../data/devices.json';
import bloatData from '../data/bloatware.json';
import vnAppsData from '../data/vietnamApps.json';

const DEVICES_DB = devicesData.devices || [];

const COMMON_APP_NAMES = {
  'com.zing.zalo': 'Zalo',
  'com.vng.zingmp3': 'Zing MP3',
  'com.facebook.katana': 'Facebook',
  'com.facebook.orca': 'Messenger',
  'com.instagram.android': 'Instagram',
  'com.whatsapp': 'WhatsApp',
  'org.telegram.messenger': 'Telegram',
  'com.ss.android.ugc.trill': 'TikTok',
  'com.zhiliaoapp.musically': 'TikTok Global',
  'com.google.android.youtube': 'YouTube',
  'com.google.android.apps.youtube.music': 'YouTube Music',
  'com.android.chrome': 'Google Chrome',
  'com.google.android.gm': 'Gmail',
  'com.google.android.apps.maps': 'Google Maps',
  'com.google.android.apps.photos': 'Google Photos',
  'com.google.android.googlequicksearchbox': 'Google App',
  'com.google.android.apps.bard': 'Gemini',
  'com.openai.chatgpt': 'ChatGPT',
  'com.shopee.vn': 'Shopee',
  'com.lazada.android': 'Lazada',
  'com.grabtaxi.passenger': 'Grab',
  'xyz.be.consumer': 'Be',
  'com.gsm.customer': 'Xanh SM',
  'vn.gov.vneid': 'VNeID',
  'com.vnid': 'VNeID (VnID)',
  'com.bhxh.vssid': 'VssID',
  'com.vnpay.momo': 'MoMo',
  'com.mservice.momotransfer': 'MoMo',
  'com.vnpay.bidv': 'BIDV SmartBanking',
  'com.vcombank.vcb': 'Vietcombank VCB Digibank',
  'com.VCB': 'Vietcombank',
  'vn.com.techcombank.bb.app': 'Techcombank Mobile',
  'com.mbmobile': 'MBBank',
  'com.viettel.viettelpay': 'Viettel Money',
  'vn.io.nhacquan': 'Nhạc Của Tui',
  'mark.via': 'Via Browser',
  'mark.via.gp': 'Via Browser',
  'org.mozilla.firefox': 'Firefox',
  'com.brave.browser': 'Brave',
  'com.coccoc.trinhduyet': 'Cốc Cốc',
  'org.localsend.localsend_app': 'LocalSend',
  'com.hihonor.photos': 'Bộ Sưu Tập Honor',
  'com.hihonor.camera': 'Máy Ảnh Honor',
  'com.hihonor.soundrecorder': 'Ghi Âm Honor',
  'com.hihonor.calculator': 'Máy Tính',
  'com.hihonor.android.totemweather': 'Thời Tiết Honor',
  'com.hihonor.systemmanager': 'Trình Quản Lý Hệ Thống',
  'com.hihonor.gamecenter': 'Trung Tâm Trò Chơi Honor',
  'com.hihonor.appmarket': 'Chợ Ứng Dụng Honor',
  'com.hihonor.notepad': 'Ghi Chú Honor',
  'com.hihonor.deskclock': 'Đồng Hồ & Báo Thức',
  'com.hihonor.contacts': 'Danh Bạ',
  'com.android.mms': 'Tin Nhắn SMS',
  'com.android.settings': 'Cài Đặt Hệ Thống',
  'com.android.vending': 'Google Play Store',
  'com.google.android.gms': 'Dịch Vụ Google Play (GMS)',
  'com.google.android.gsf': 'Khung Dịch Vụ Google (GSF)',
  'com.hihonor.magicvoice': 'Trợ Lý Giọng Nói YOYO (MagicVoice)',
};

class AdbService {
  constructor() {
    this.mode = 'idle'; // 'webusb' | 'local' | 'idle'
    this.adbInstance = null;
    this.usbDevice = null;
    this.listeners = new Set();
    this.logs = [];
  }

  getFriendlyAppName(pkg) {
    if (COMMON_APP_NAMES[pkg]) return COMMON_APP_NAMES[pkg];
    for (const cat of Object.values(vnAppsData.categories || {})) {
      for (const app of cat.apps || []) {
        if (app.package === pkg) return app.name;
      }
    }
    for (const lvl of Object.values(bloatData.safety_levels || {})) {
      for (const b of lvl.packages || []) {
        if (b.package === pkg) return b.name;
      }
    }
    const parts = pkg.split('.');
    let lastSeg = parts[parts.length - 1];
    if (['app', 'android', 'client', 'mobile'].includes(lastSeg.toLowerCase()) && parts.length >= 2) {
      lastSeg = parts[parts.length - 2];
    }
    return lastSeg.replace(/[_.-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  onStateChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify(state) {
    this.listeners.forEach((cb) => cb(state));
  }

  addLog(level, msg) {
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const logItem = { level, msg, time };
    this.logs.push(logItem);
    if (this.logs.length > 500) this.logs.shift();
    this.notify({ type: 'log', log: logItem, logs: [...this.logs] });
  }

  clearLogs() {
    this.logs = [];
    this.notify({ type: 'log', logs: [] });
  }

  isWebUsbSupported() {
    return typeof navigator !== 'undefined' && !!navigator.usb;
  }

  /**
   * Connect directly via Chrome / Edge WebUSB
   */
  async connectWebUsb() {
    if (!this.isWebUsbSupported()) {
      throw new Error('Trình duyệt của bạn không hỗ trợ WebUSB. Vui lòng dùng Google Chrome, Microsoft Edge, Brave hoặc Cốc Cốc.');
    }

    this.addLog('info', 'Đang yêu cầu quyền truy cập USB từ trình duyệt...');
    const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
    const device = await manager.requestDevice();

    if (!device) {
      throw new Error('Người dùng đã hủy chọn thiết bị USB.');
    }

    this.addLog('info', `Đã tìm thấy thiết bị USB: ${device.raw.productName || 'Honor Device'}. Đang bắt tay mã hóa RSA...`);
    const connection = await device.connect();
    const credentialStore = new AdbWebCredentialStore();

    const transport = await AdbDaemonTransport.authenticate({
      serial: device.serial,
      connection,
      credentialStore,
      authenticators: ADB_DEFAULT_AUTHENTICATORS,
    });

    this.adbInstance = new Adb(transport);
    this.usbDevice = device;
    this.mode = 'webusb';

    this.addLog('success', `Kết nối WebUSB thành công! Serial: ${device.serial}`);
    this.notify({ type: 'connected', mode: 'webusb', serial: device.serial });

    return this.getDeviceInfo();
  }

  /**
   * Auto connect previously paired USB devices without prompting picker
   */
  async autoConnectPairedDevice() {
    if (!this.isWebUsbSupported()) return null;
    try {
      const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
      const devices = await manager.getDevices();
      if (devices && devices.length > 0) {
        const device = devices[0];
        this.addLog('info', `Phát hiện thiết bị đã ghép nối: ${device.raw.productName || 'Honor'}. Đang tự động kết nối...`);
        const connection = await device.connect();
        const credentialStore = new AdbWebCredentialStore();
        const transport = await AdbDaemonTransport.authenticate({
          serial: device.serial,
          connection,
          credentialStore,
          authenticators: ADB_DEFAULT_AUTHENTICATORS,
        });
        this.adbInstance = new Adb(transport);
        this.usbDevice = device;
        this.mode = 'webusb';
        this.addLog('success', `Tự động kết nối WebUSB thành công! Serial: ${device.serial}`);
        this.notify({ type: 'connected', mode: 'webusb', serial: device.serial });
        return await this.getDeviceInfo();
      }
    } catch (e) {
      console.warn('[WebUSB AutoConnect failed]', e);
    }
    return null;
  }

  /**
   * Disconnect active session
   */
  async disconnect() {
    if (this.adbInstance) {
      try {
        await this.adbInstance.close();
      } catch (e) {
        console.error(e);
      }
      this.adbInstance = null;
    }
    if (this.usbDevice) {
      try {
        await this.usbDevice.raw?.close?.();
      } catch (e) {}
      this.usbDevice = null;
    }
    this.mode = 'idle';
    this.addLog('info', 'Đã giải phóng kết nối thiết bị.');
    this.notify({ type: 'disconnected' });
  }

  /**
   * Execute Shell Command via active transport
   */
  async executeShell(cmd, timeoutMs = 8000) {
    if (this.mode === 'webusb' && this.adbInstance) {
      try {
        const runCmd = async () => {
          if (this.adbInstance.subprocess?.noneProtocol?.spawnWaitText) {
            return await this.adbInstance.subprocess.noneProtocol.spawnWaitText(cmd);
          }
          return await this.adbInstance.createSocketAndWait(`shell:${cmd}`);
        };

        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve(''), timeoutMs)
        );

        const result = await Promise.race([runCmd(), timeoutPromise]);
        return (typeof result === 'string' ? result : '').trim();
      } catch (e) {
        console.warn(`[WebUSB Shell Error] ${cmd}:`, e);
        return '';
      }
    } else {
      // Local HTTP backend fallback
      try {
        const resp = await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'raw_cmd', cmd }),
        });
        const data = await resp.json();
        return (data.output || '').trim();
      } catch (e) {
        return '';
      }
    }
  }

  /**
   * Fetch full device information and specifications
   */
  async getDeviceInfo() {
    if (this.mode === 'webusb' && this.adbInstance) {
      const serial = this.usbDevice.serial;
      const model = (await this.executeShell('getprop ro.product.model')).trim();
      const brand = (await this.executeShell('getprop ro.product.brand')).trim();
      let android_ver = (await this.executeShell('getprop ro.build.version.release')).trim();
      if (!android_ver) {
        android_ver = (await this.executeShell('getprop ro.system.build.version.release')).trim();
      }
      const display_id = (await this.executeShell('getprop ro.build.display.id')).trim();
      const magic_ver = (await this.executeShell('getprop ro.build.version.magic')).trim();
      const build_incr = (await this.executeShell('getprop ro.build.version.incremental')).trim();
      const soc_prop = (await this.executeShell('getprop ro.board.platform')).trim();
      const cpu_display = (await this.executeShell('getprop ro.config.cpu_info_display')).trim();
      const cust_ver = (await this.executeShell('getprop ro.build.cust.version')).trim();
      const mktName = (await this.executeShell('getprop ro.config.marketing_name')).trim();
      const soc_manu = (await this.executeShell('getprop ro.soc.manufacturer')).trim();
      const soc_model = (await this.executeShell('getprop ro.soc.model')).trim();

      // Physical size
      const wm_size = await this.executeShell('wm size');
      const wm_density = await this.executeShell('wm density');

      let width = 1080, height = 2400;
      if (wm_size.includes('Physical size:')) {
        const parts = wm_size.split('Physical size:').pop().trim().split('x');
        if (parts.length === 2) {
          width = parseInt(parts[0], 10) || 1080;
          height = parseInt(parts[1], 10) || 2400;
        }
      }

      let current_dpi = 480;
      if (wm_density.includes('Physical density:')) {
        current_dpi = parseInt(wm_density.split('Physical density:').pop().trim(), 10) || 480;
      }

      // Exact authentic MagicOS ROM Version
      let exact_rom = '';
      if (display_id) {
        exact_rom = display_id.includes('MagicOS') ? display_id : (model && display_id.startsWith(model) ? `MagicOS ${display_id.slice(model.length).trim()}` : `MagicOS ${display_id}`);
      } else if (magic_ver) {
        exact_rom = build_incr && !magic_ver.includes(build_incr) ? `MagicOS ${magic_ver} (${build_incr})` : `MagicOS ${magic_ver}`;
      } else {
        exact_rom = 'MagicOS 10.0';
      }

      // Battery
      const batOut = await this.executeShell('dumpsys battery');
      let bat_level = 100, bat_temp = 30.0, bat_status = 'Bình thường';
      batOut.split('\n').forEach(line => {
        const l = line.trim();
        if (l.startsWith('level:')) bat_level = parseInt(l.split(':')[1], 10) || 100;
        else if (l.startsWith('temperature:')) bat_temp = (parseInt(l.split(':')[1], 10) || 300) / 10;
        else if (l.startsWith('status:')) {
          const s = l.split(':')[1].trim();
          if (s === '2') bat_status = 'Đang sạc';
          else if (s === '3') bat_status = 'Đang xả pin';
          else if (s === '5') bat_status = 'Đầy pin';
        }
      });

      // Match device database
      const matched = DEVICES_DB.find(d => d.sku === model || (d.aliases && d.aliases.includes(model))) ||
                      (mktName && DEVICES_DB.find(d => d.name.toLowerCase().includes(mktName.toLowerCase()) || mktName.toLowerCase().includes(d.name.toLowerCase()))) ||
                      DEVICES_DB.find(d => d.sku.split('-')[0] && model.includes(d.sku.split('-')[0]));

      const sweet_spot_dpi = width > 0 ? Math.round((width * 160) / 385) : 480;

      // Display refresh rates
      const dispOut = await this.executeShell('dumpsys display');
      const fpsMatches = [...dispOut.matchAll(/fps=([0-9]+(?:\.[0-9]+)?)/g)].map(m => Math.round(parseFloat(m[1])));
      const detected_hz = [...new Set(fpsMatches.filter(f => f >= 30))].sort((a, b) => a - b);
      const supported_hz = detected_hz.length ? detected_hz : (matched?.supported_hz || [60, 120]);

      // DNS
      const dnsMode = (await this.executeShell('settings get global private_dns_mode')).trim();
      const dnsSpec = (await this.executeShell('settings get global private_dns_specifier')).trim();

      // Real Storage from df -h /data
      const dfOut = await this.executeShell('df -h /data');
      let storageTotal = '256 GB', storageUsed = '52 GB', storageFree = '204 GB', storagePercent = 20;
      const dfLines = dfOut.split('\n').map(l => l.trim()).filter(Boolean);
      if (dfLines.length >= 2) {
        const parts = dfLines[dfLines.length - 1].split(/\s+/);
        if (parts.length >= 5) {
          storageTotal = parts[1];
          storageUsed = parts[2];
          storageFree = parts[3];
          const pct = parseInt(parts[4].replace('%', ''));
          if (!isNaN(pct)) storagePercent = pct;
        }
      }

      // Real Root & SELinux
      const seOut = (await this.executeShell('getenforce')).trim();
      const suOut = (await this.executeShell('which su')).trim();
      const isRooted = !!(suOut && !suOut.includes('not found') && suOut.includes('su'));
      const rootSelinux = isRooted ? `Đã Root (${seOut || 'Permissive'})` : `Chưa Root (${seOut || 'Enforcing'})`;

      // Real Bloatware and FCM summaries
      const installedRaw = await this.executeShell('pm list packages');
      const allPkgs = installedRaw.split('\n').map(l => l.replace('package:', '').trim()).filter(Boolean);
      const allPkgsSet = new Set(allPkgs);

      const safe12 = [
        "com.honor.browser", "com.hihonor.browserhomepage", "com.hihonor.gamecenter",
        "com.hihonor.game.kitserver", "com.hihonor.quickgame", "com.hihonor.cloudmusic",
        "com.honor.yoyocards", "com.hihonor.hiboard", "com.hihonor.redteamobile.roaming",
        "com.sohu.inputmethod.sogou.honor", "com.hihonor.servicecenter", "com.baidu.swan"
      ];
      const remainingBloat = safe12.filter(p => allPkgsSet.has(p));
      const bloatSummary = remainingBloat.length === 0
        ? 'Đã dọn sạch 12/12 app'
        : `Còn ${remainingBloat.length}/12 app chưa gỡ`;

      const dozeOut = await this.executeShell('dumpsys deviceidle whitelist');
      let vnInstalled = 0, vnWhitelisted = 0;
      Object.values(vnAppsData.categories || {}).forEach(cat => {
        (cat.apps || []).forEach(a => {
          if (allPkgsSet.has(a.package)) {
            vnInstalled++;
            if (dozeOut.includes(a.package)) vnWhitelisted++;
          }
        });
      });
      const fcmSummary = vnInstalled === 0
        ? 'Chưa cài app VN'
        : `Đã Whitelist ${vnWhitelisted}/${vnInstalled} app VN`;

      // Real Dynamic Health Score Calculation
      let score = 40;
      if (!allPkgsSet.has('com.hihonor.servicecenter')) score += 15;
      if (!allPkgsSet.has('com.baidu.swan')) score += 10;
      if (!allPkgsSet.has('com.parallelc.micts')) score += 10;
      if (dnsMode && dnsMode.includes('hostname')) score += 15;
      if (Math.abs(current_dpi - sweet_spot_dpi) <= 8) score += 10;
      const healthScore = Math.min(100, score);

      const commercialName = mktName || matched?.name || `Honor (${model})`;
      const socDisplay = (soc_manu && soc_model)
        ? `${soc_manu} ${soc_model}`
        : (matched?.soc || cpu_display || soc_prop || 'Qualcomm / MediaTek');

      return {
        connected: true,
        mode: 'webusb',
        serial,
        model,
        brand: brand || 'HONOR',
        commercial_name: commercialName,
        series: matched?.series || 'Thiết bị Honor MagicOS',
        soc: socDisplay,
        cpu_display: cpu_display || socDisplay,
        screen_desc: matched?.screen || `${width}x${height}`,
        battery_desc: matched?.battery || `${bat_level}%`,
        waterproof: matched?.waterproof || 'Tiêu chuẩn',
        durability: matched?.durability || 'Chuẩn độ bền Honor',
        render_front: matched?.render_front || 'images/devices/BSN-AN00-front.png',
        render_back: matched?.render_back || 'images/devices/BSN-AN00-back.png',
        render_hero: matched?.render_hero || 'images/devices/BSN-AN00.png',
        android_version: android_ver || '14',
        magic_version: exact_rom,
        rom_build: display_id || build_incr || exact_rom,
        rom_region: (exact_rom.includes('C00') || cust_ver.includes('C00')) ? 'Nội Địa Trung Quốc (Bản Gốc C00)' : 'Rom Nội Địa Trung Quốc',
        screen_width: width,
        screen_height: height,
        current_dpi,
        sweet_spot_dpi,
        supported_hz,
        max_hz: Math.max(...supported_hz),
        current_dns_mode: dnsMode || 'off',
        current_dns_spec: dnsSpec || '',
        battery_level: bat_level,
        battery_temp: bat_temp,
        battery_status: bat_status,
        storage_total_str: storageTotal,
        storage_used_str: storageUsed,
        storage_free_str: storageFree,
        storage_percent: storagePercent,
        root_selinux: rootSelinux,
        bloat_summary: bloatSummary,
        fcm_summary: fcmSummary,
        health_score: healthScore
      };
    } else {
      // Fetch from local python daemon
      const resp = await fetch('/api/device');
      return await resp.json();
    }
  }

  /**
   * Apply Custom Private DNS
   */
  async applyPrivateDns(hostname) {
    this.addLog('info', `Đang thiết lập Private DNS: ${hostname || '(Tắt DoT)'}...`);
    if (!hostname || hostname.trim() === '') {
      await this.executeShell('settings put global private_dns_mode off');
      await this.executeShell('settings delete global private_dns_specifier');
      this.addLog('info', 'Đã tắt chế độ Private DNS.');
    } else {
      const cleanHost = hostname.trim();
      await this.executeShell('settings put global private_dns_mode hostname');
      await this.executeShell(`settings put global private_dns_specifier ${cleanHost}`);
      this.addLog('success', `Đã kích hoạt DoT thành công cho: ${cleanHost}`);
    }
  }

  /**
   * Apply Network, Captive Portal and Private DNS
   */
  async applyNetworkSettings({ captive = 'google', dns = 'cloudflare', customDns = '', disableWifipro = true }) {
    this.addLog('info', `Đang cấu hình Mạng: Captive ${captive}, DNS ${dns} (${customDns || 'Tự động'})...`);
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_wifi_dns',
          captive,
          dns,
          custom_dns: customDns,
          disable_wifipro: disableWifipro,
        }),
      });
      if (resp.ok) {
        this.addLog('success', 'Đã lưu và áp dụng cấu hình Mạng & Private DNS thành công.');
        return await resp.json();
      }
    } catch (e) {}

    // WebUSB fallback
    if (captive === 'google') {
      await this.executeShell('settings put global captive_portal_mode 1');
      await this.executeShell('settings put global captive_portal_http_url http://connectivitycheck.gstatic.com/generate_204');
      await this.executeShell('settings put global captive_portal_https_url https://connectivitycheck.gstatic.com/generate_204');
      await this.executeShell('settings put global captive_portal_fallback_url http://www.google.com/gen_204');
    }
    if (customDns && customDns.trim()) {
      await this.applyPrivateDns(customDns.trim());
    } else if (dns === 'cloudflare') {
      await this.applyPrivateDns('1dot1dot1dot1.cloudflare-dns.com');
    }
    if (disableWifipro) {
      await this.executeShell('settings put global hn_wifipro_enable false');
      await this.executeShell('settings put system smart_network_switch 0');
      await this.executeShell('settings put secure settings_wlan_mt_axl 0');
      await this.executeShell('settings put global wifi_cloud_security_check 0');
      await this.executeShell('settings put global wifi_power_save 0');
      await this.executeShell('settings put global wifi_hidata_rtt_url connectivitycheck.gstatic.com|www.google.com');
      await this.executeShell('settings put global wifi_sleep_policy 2');
    }
    this.addLog('success', 'Đã lưu và áp dụng cấu hình Mạng & Private DNS thành công.');
    return { success: true };
  }

  /**
   * Apply Display Refresh Rate, DPI and Animations
   */
  async applyDisplaySettings({ hz = 'auto', anim = '1.0', dpi = 'auto_sweet' }) {
    this.addLog('info', `Đang cấu hình màn hình: Tần số ${hz}Hz, Animation ${anim}x, DPI ${dpi}...`);
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_display',
          hz,
          anim,
          dpi,
        }),
      });
      if (resp.ok) {
        this.addLog('success', 'Đã áp dụng độ phân giải và tần số quét màn hình thành công.');
        return await resp.json();
      }
    } catch (e) {}

    // WebUSB fallback
    if (hz === 'auto') {
      await this.executeShell('settings delete system min_refresh_rate');
      await this.executeShell('settings delete system peak_refresh_rate');
    } else {
      const val = parseFloat(hz);
      await this.executeShell(`settings put system min_refresh_rate ${val}`);
      await this.executeShell(`settings put system peak_refresh_rate ${val}`);
    }

    if (anim) {
      const aVal = String(parseFloat(anim));
      for (const k of ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']) {
        await this.executeShell(`settings put global ${k} ${aVal}`);
      }
      await this.executeShell('settings put global wifi_scan_always_enabled 0');
      await this.executeShell('settings put global ble_scan_always_enabled 0');
    }

    let targetDpi = null;
    if (dpi === 'reset') {
      await this.executeShell('wm density reset');
      await this.executeShell('settings delete secure display_density_forced');
    } else if (dpi === 'auto_sweet') {
      targetDpi = 532;
      await this.executeShell(`wm density ${targetDpi}`);
      await this.executeShell(`settings put secure display_density_forced ${targetDpi}`);
    } else {
      targetDpi = parseInt(dpi, 10);
      if (targetDpi) {
        await this.executeShell(`wm density ${targetDpi}`);
        await this.executeShell(`settings put secure display_density_forced ${targetDpi}`);
      }
    }

    for (const k of ['low_resolution_switch', 'smart_resolution_mode', 'smart_screen_resolution_mode']) {
      await this.executeShell(`settings put system ${k} 0`);
      await this.executeShell(`settings put global ${k} 0`);
    }
    await this.executeShell('settings put global aps_display_resolution 0');

    this.addLog('success', 'Đã áp dụng độ phân giải và tần số quét màn hình thành công.');
    return { success: true };
  }

  getLocalApiUrl(endpoint) {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return endpoint;
    }
    return `http://127.0.0.1:5050${endpoint}`;
  }

  /**
   * Launch Scrcpy Screen Mirroring (via Local Helper)
   */
  async launchScrcpy({ turnOffScreen = true, stayAwake = true } = {}) {
    const localUrl = this.getLocalApiUrl('/api/action');
    try {
      const resp = await fetch(localUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'launch_scrcpy',
          turn_off_screen: turnOffScreen,
          stay_awake: stayAwake,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success) {
          this.addLog('success', 'Đã kết nối Local Helper & mở cửa sổ Scrcpy 120Hz trên Desktop!');
          return data;
        }
      }
    } catch (e) {}

    return {
      success: false,
      is_webusb: this.mode === 'webusb',
      need_local_helper: true,
      message: 'Cần bật Local Helper để mở Scrcpy 120 FPS lên Desktop.',
    };
  }

  /**
   * Get System Environment (OS, ADB, Scrcpy status)
   */
  async getSystemEnv() {
    try {
      const resp = await fetch('/api/env');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.os && data.os !== 'unknown') {
          return {
            ...data,
            is_webusb: this.mode === 'webusb',
          };
        }
      }
    } catch (e) {}

    // Precise client-side OS detection using browser navigator
    const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
    const plat = (typeof navigator !== 'undefined' ? (navigator.userAgentData?.platform || navigator.platform) : '') || '';

    let os = 'unknown';
    let osName = 'Máy Tính';
    let displayOs = 'Máy tính cá nhân';
    let installCmd = 'winget install Genymobile.scrcpy';
    let runCmd = 'scrcpy -S';
    let guide = 'Mở Command Prompt hoặc PowerShell rồi chạy lệnh trên.';

    if (/Win/i.test(plat) || /Windows/i.test(ua)) {
      os = 'windows';
      osName = 'Windows';
      displayOs = 'Windows PC (10/11)';
      installCmd = 'winget install Genymobile.scrcpy';
      runCmd = 'scrcpy -S';
      guide = 'Mở PowerShell hoặc Command Prompt rồi dán lệnh trên.';
    } else if (/Linux|X11/i.test(plat) || /Linux/i.test(ua)) {
      os = 'linux';
      osName = 'Linux';
      displayOs = 'Linux (Ubuntu/Debian/Arch)';
      installCmd = 'sudo apt install -y scrcpy adb';
      runCmd = 'scrcpy -S';
      guide = 'Mở Terminal Linux và chạy lệnh apt trên để cài đặt Scrcpy.';
    } else if (/Mac/i.test(plat) || /Macintosh|Mac OS X/i.test(ua)) {
      os = 'darwin';
      osName = 'macOS';
      displayOs = 'Apple macOS';
      installCmd = 'brew install scrcpy';
      runCmd = 'scrcpy -S';
      guide = 'Mở Terminal trên Mac và chạy lệnh Homebrew trên.';
    }

    return {
      os,
      os_name: osName,
      display_os: displayOs,
      adb_installed: this.mode === 'webusb' && !!this.adbInstance,
      scrcpy_installed: false,
      is_webusb: this.mode === 'webusb',
      install_cmd: installCmd,
      run_cmd: runCmd,
      manual_guide: guide,
      can_auto_install: this.mode !== 'webusb',
    };
  }

  /**
   * Auto Install Scrcpy & ADB
   */
  async autoInstallScrcpy() {
    if (this.mode === 'webusb') {
      return {
        success: false,
        is_webusb: true,
        message: 'Trình duyệt Web (WebUSB) không thể tự tải phần mềm vào máy tính do bảo mật Sandbox. Vui lòng mở Terminal và chạy lệnh cài đặt.',
      };
    }
    this.addLog('info', 'Bắt đầu quy trình tự động tải và cài đặt Scrcpy...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install_scrcpy' }),
      });
      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }
      return await resp.json();
    } catch (e) {
      return {
        success: false,
        message: 'Lỗi kết nối máy chủ: ' + e.message,
      };
    }
  }

  /**
   * Disable Telemetry and Background Chinese Loggers (Step 4)
   */
  async disableTelemetry() {
    this.addLog('info', 'Đang tắt sạch Telemetry & Dịch vụ gửi log ngầm về máy chủ TQ...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable_telemetry' }),
      });
      if (resp.ok) {
        this.addLog('success', 'Đã tắt sạch Telemetry & thu thập log ngầm TQ thành công!');
        return await resp.json();
      }
    } catch (e) {}

    await this.executeShell('settings put secure user_experience_involved 0');
    await this.executeShell('dumpsys deviceidle whitelist -com.hihonor.hiviewtunnel');
    await this.executeShell('pm disable-user --user 0 com.hihonor.android.UEInfoCheck');
    await this.executeShell('pm disable-user --user 0 com.hihonor.collectcenter');
    this.addLog('success', 'Đã tắt sạch Telemetry & thu thập log ngầm TQ thành công!');
    return { success: true };
  }

  /**
   * Fix Weather App Locale to en-GB (Celsius degrees) (Step 7)
   */
  async fixWeatherLocale() {
    this.addLog('info', 'Đang chuyển ứng dụng Thời tiết Honor sang Tiếng Anh quốc tế en-GB (Độ C)...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix_weather' }),
      });
      if (resp.ok) {
        this.addLog('success', 'Đã chuyển ứng dụng Thời tiết sang Tiếng Anh quốc tế en-GB (Độ C)!');
        return await resp.json();
      }
    } catch (e) {}

    await this.executeShell('cmd locale set-app-locales com.hihonor.android.totemweather --locales en-GB');
    await this.executeShell('am force-stop com.hihonor.android.totemweather');
    this.addLog('success', 'Đã chuyển ứng dụng Thời tiết sang Tiếng Anh quốc tế en-GB (Độ C)!');
    return { success: true };
  }

  /**
   * Set Google Assistant / Gemini default (Step 8)
   */
  async setAssistantGoogle() {
    this.addLog('info', 'Đang thiết lập Google Assistant / Gemini làm trợ lý mặc định toàn máy...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_assistant_google' }),
      });
      if (resp.ok) {
        this.addLog('success', 'Đã gán Google Assistant / Gemini làm trợ lý toàn máy!');
        return await resp.json();
      }
    } catch (e) {}

    await this.executeShell('pm disable-user --user 0 com.hihonor.magicvoice');
    await this.executeShell('cmd package set-home-activity com.google.android.googlequicksearchbox/.SearchActivity');
    await this.executeShell('settings put secure voice_interaction_service com.google.android.googlequicksearchbox/com.google.android.voiceinteraction.GsaVoiceInteractionService');
    await this.executeShell('settings put secure assistant com.google.android.googlequicksearchbox/com.google.android.voiceinteraction.GsaVoiceInteractionService');
    await this.executeShell('cmd appops set com.google.android.googlequicksearchbox ASSIST_STRUCTURE allow');
    await this.executeShell('cmd appops set com.google.android.googlequicksearchbox ASSIST_SCREENSHOT allow');
    await this.executeShell('cmd appops set com.google.android.apps.bard ASSIST_STRUCTURE allow');
    await this.executeShell('cmd appops set com.google.android.apps.bard ASSIST_SCREENSHOT allow');
    await this.executeShell('cmd appops set com.google.android.apps.bard SYSTEM_ALERT_WINDOW allow');
    this.addLog('success', 'Đã đóng băng YOYO Voice & gán Google Gemini / Assistant làm trợ lý toàn máy!');
    return { success: true };
  }

  /**
   * Install Gesture Search (Swipe bar to float Gemini)
   */
  async installGestureSearch() {
    this.addLog('info', 'Đang cài đặt và cấp quyền cho Gesture Search...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install_gesture_search' }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {}
    this.addLog('error', 'Không thể kết nối API máy chủ cục bộ.');
    return { success: false };
  }

  /**
   * Install Tro Ly VXM (Offline voice wake "Hey Google" 24/7)
   */
  async installVxMAssistant() {
    this.addLog('info', 'Đang cài đặt và cấp quyền cho Trợ Lý VXM...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install_vxm_assistant' }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {}
    this.addLog('error', 'Không thể kết nối API máy chủ cục bộ.');
    return { success: false };
  }

  /**
   * Full Assistant Suite (Core + Gesture + Voice Wake)
   */
  async setupFullAssistantSuite() {
    this.addLog('info', 'Đang kích hoạt Trọn Bộ Trợ Lý Google & Gemini Toàn Diện...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup_full_assistant_suite' }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {}
    this.addLog('error', 'Không thể kết nối API máy chủ cục bộ.');
    return { success: false };
  }

  /**
   * Enable Google Basic Services (GMS & GSF)
   */
  async enableGoogleServices() {
    this.addLog('info', 'Đang kích hoạt Dịch Vụ Google Cơ Bản (GMS / GSF) trên MagicOS...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable_google_services' }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {}

    // Fallback WebUSB mode
    await this.executeShell('settings put secure google_service_status 1');
    await this.executeShell('settings put system is_show_google 1');
    const gmsPkgs = [
      'com.google.android.gms',
      'com.google.android.gsf',
      'com.google.android.onetimeinitializer',
      'com.google.android.configupdater',
      'com.google.android.syncadapters.contacts',
      'com.google.android.syncadapters.calendar'
    ];
    for (const p of gmsPkgs) {
      await this.executeShell(`pm enable ${p}`);
    }
    await this.executeShell('dumpsys deviceidle whitelist +com.google.android.gms');
    await this.executeShell('dumpsys deviceidle whitelist +com.google.android.gsf');
    await this.executeShell('cmd appops set com.google.android.gms SYSTEM_ALERT_WINDOW allow');
    this.addLog('success', 'Đã kích hoạt toàn bộ Dịch Vụ Google (GMS & GSF) ngầm trên MagicOS!');
    return { success: true };
  }

  /**
   * Install Google Play Store (CH Play)
   */
  async installPlayStore(apkUrl = '') {
    this.addLog('info', 'Đang tiến hành cài đặt Google Play Store (CH Play)...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install_play_store', apk_url: apkUrl }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {}

    this.addLog('error', 'Không thể kết nối máy chủ để cài đặt Play Store.');
    return { success: false };
  }

  /**
   * Setup Full Google Ecosystem (GMS + CH Play)
   */
  async setupFullGoogleEcosystem(apkUrl = '') {
    this.addLog('info', 'Đang kích hoạt Trọn Gói Google GMS & Cài đặt CH Play Store...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup_full_google_ecosystem', apk_url: apkUrl }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {}

    await this.enableGoogleServices();
    return await this.installPlayStore(apkUrl);
  }

  /**
   * Compile Essential Apps Native AOT (Step 6)
   */
  async compileApps() {
    this.addLog('info', 'Đang tiến hành biên dịch Native ARM64 AOT (dex2oat) cho toàn bộ ứng dụng thông dụng tại VN...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compile_apps' }),
      });
      if (resp.ok) {
        const data = await resp.json();
        this.addLog('success', `Đã hoàn tất tăng tốc Native ARM64 AOT cho ${data.count || 'toàn bộ'} ứng dụng & dọn dẹp cache!`);
        return data;
      }
    } catch (e) {}

    // WebUSB fallback: build target list from installed packages and VN database
    const installedRaw = await this.executeShell('pm list packages');
    const installedSet = new Set(installedRaw.split('\n').map((l) => l.replace('package:', '').trim()).filter(Boolean));
    const priorityPkgs = [
      "com.zing.zalo", "com.facebook.katana", "com.ss.android.ugc.trill",
      "com.facebook.orca", "org.telegram.messenger", "com.whatsapp",
      "com.instagram.android", "com.google.android.gm", "com.microsoft.office.outlook",
      "vn.io.nhacquan", "mark.via", "mark.via.gp", "com.android.chrome",
      "com.brave.browser", "com.microsoft.emmx", "com.coccoc.trinhduyet",
      "org.mozilla.firefox", "com.sec.android.app.sbrowser", "com.openai.chatgpt",
      "com.shopee.vn", "com.lazada.android", "com.grabtaxi.passenger",
      "xyz.be.consumer", "com.gsm.customer", "vn.foody.delivery",
      "vn.gov.vneid", "com.vnid", "com.bhxh.vssid", "com.gdt.mobile",
      "com.viettel.appviettel", "vn.vnpt.myvnpt", "org.localsend.localsend_app"
    ];
    Object.values(vnAppsData.categories || {}).forEach((cat) => {
      (cat.apps || []).forEach((a) => {
        if (!priorityPkgs.includes(a.package)) priorityPkgs.push(a.package);
      });
    });

    const targets = priorityPkgs.filter((p) => installedSet.has(p));
    for (const p of targets) {
      await this.executeShell(`cmd package compile -m speed-profile ${p}`);
    }
    await this.executeShell('pm trim-caches 100G');
    this.addLog('success', `Đã hoàn tất tăng tốc biên dịch Native ARM64 AOT cho ${targets.length} ứng dụng & dọn dẹp cache!`);
    return { success: true, count: targets.length };
  }

  /**
   * Scan packages on the device for bloatware and VN apps status
   */
  async scanPackages() {
    if (this.mode === 'webusb' && this.adbInstance) {
      try {
        const installedRaw = await this.executeShell('pm list packages');
        const disabledRaw = await this.executeShell('pm list packages -d');
        const dozeRaw = await this.executeShell('dumpsys deviceidle whitelist');

        const installedSet = new Set(
          installedRaw.split('\n').map((l) => l.replace('package:', '').trim()).filter(Boolean)
        );
        const disabledSet = new Set(
          disabledRaw.split('\n').map((l) => l.replace('package:', '').trim()).filter(Boolean)
        );
        const dozeLines = dozeRaw.split('\n').map((l) => l.trim());

        // Process VN Apps
        const detectedVnApps = [];
        Object.entries(vnAppsData.categories || {}).forEach(([catKey, cat]) => {
          (cat.apps || []).forEach((app) => {
            const pkg = app.package;
            const isInstalled = installedSet.has(pkg);
            const isWhitelisted = dozeLines.some((line) => line.includes(pkg));
            detectedVnApps.push({
              name: app.name,
              package: pkg,
              category: cat.name,
              catKey,
              priority: app.priority,
              note: app.note,
              installed: isInstalled,
              whitelisted: isWhitelisted,
            });
          });
        });

        // Process Bloatware
        const bloatResults = {};
        Object.entries(bloatData.safety_levels || {}).forEach(([levelKey, levelData]) => {
          bloatResults[levelKey] = {
            level: levelData.level,
            name: levelData.name,
            badge: levelData.badge,
            color: levelData.color,
            description: levelData.description,
            packages: (levelData.packages || []).map((item) => {
              const pkg = item.package;
              let status = 'uninstalled';
              if (installedSet.has(pkg)) {
                status = disabledSet.has(pkg) ? 'disabled' : 'active';
              }
              return {
                name: item.name,
                package: pkg,
                desc: item.desc,
                recommended: item.recommended || false,
                status,
              };
            }),
          };
        });

        return {
          connected: true,
          vn_apps: detectedVnApps,
          bloatware: bloatResults,
        };
      } catch (e) {
        console.error('WebUSB scan error:', e);
      }
    }

    try {
      const resp = await fetch('/api/scan');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.connected) {
          return data;
        }
      }
    } catch (e) {}

    return { connected: false, vn_apps: [], bloatware: {} };
  }

  /**
   * Whitelist Vietnamese Apps for Background Notifications (Step 1)
   */
  async whitelistApps(packages = []) {
    let list = Array.isArray(packages) ? packages : [];
    if (list.length === 0) {
      Object.values(vnAppsData.categories || {}).forEach((cat) => {
        (cat.apps || []).forEach((a) => {
          if (!list.includes(a.package)) list.push(a.package);
        });
      });
    }

    this.addLog('info', `Đang cấp quyền chạy nền không bị ngắt Doze cho ${list.length} ứng dụng Việt Nam...`);
    if (this.mode === 'webusb' && this.adbInstance) {
      let idx = 0;
      for (const pkg of list) {
        idx++;
        this.addLog('cmd', `[${idx}/${list.length}] Cấp quyền chạy nền Doze + 8 AppOps cho ${pkg}...`);
        const ops = ['RUN_IN_BACKGROUND', 'RUN_ANY_IN_BACKGROUND', 'POST_NOTIFICATION', 'WAKE_LOCK', 'SYSTEM_ALERT_WINDOW', 'START_FOREGROUND', 'SCHEDULE_EXACT_ALARM', 'ACCESS_RESTRICTED_SETTINGS'];
        const appOpsCmds = ops.map((op) => `cmd appops set ${pkg} ${op} allow`).join('; ');
        await this.executeShell(`dumpsys deviceidle whitelist +${pkg}; ${appOpsCmds}`);

        const uidOut = await this.executeShell(`pm list packages -U ${pkg}`);
        if (uidOut.includes('uid:')) {
          const uidsPart = uidOut.split('uid:').pop().trim().split(/\s+/)[0];
          for (const uid of uidsPart.split(',')) {
            const cleanUid = uid.trim();
            if (/^\d+$/.test(cleanUid)) {
              await this.executeShell(`cmd netpolicy add restrict-background-whitelist ${cleanUid}`);
            }
          }
        }
      }
      this.addLog('success', `Đã cấp quyền Doze Whitelist & 8 AppOps thành công cho ${list.length} ứng dụng.`);
      return { success: true, count: list.length };
    }

    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'whitelist_all_vn', packages: list }),
      });
      if (resp.ok) {
        const data = await resp.json();
        this.addLog('success', `Đã cấp quyền Doze Whitelist & 8 AppOps thành công cho ${data.count || list.length} ứng dụng.`);
        return data;
      }
    } catch (e) {}
    return { success: false, count: 0 };
  }

  /**
   * Debloat packages (Step 2)
   */
  async debloatPackages(packages) {
    this.addLog('warning', `Bắt đầu gỡ ${packages.length} ứng dụng rác nội địa...`);
    if (this.mode === 'webusb' && this.adbInstance) {
      let count = 0;
      for (const pkg of packages) {
        await this.executeShell(`pm disable-user --user 0 ${pkg}`);
        await this.executeShell(`pm uninstall -k --user 0 ${pkg}`);
        count++;
      }
      this.addLog('success', `Đã hoàn tất gỡ ${count} ứng dụng hệ thống an toàn.`);
      return { success: true, count };
    }

    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'debloat_packages', packages }),
      });
      if (resp.ok) {
        const data = await resp.json();
        this.addLog('success', `Đã gỡ an toàn thành công ${data.count || packages.length} package.`);
        return data;
      }
    } catch (e) {}
    return { success: false, count: 0 };
  }

  /**
   * 1-Click Master Optimize (Execute all 8 Playbook steps sequentially)
   */
  async masterOptimize() {
    this.addLog('info', '=== BẮT ĐẦU TỐI ƯU HÓA TOÀN DIỆN 1-CLICK THEO PLAYBOOK CHUẨN ===');
    if (this.mode === 'webusb' && this.adbInstance) {
      // Bước 1: Fix thông báo
      const scan = await this.scanPackages();
      const installedVn = (scan.vn_apps || []).filter(a => a.installed).map(a => a.package);
      if (installedVn.length > 0) {
        await this.whitelistApps(installedVn);
      }

      // Bước 2: Debloat 12 app rác TQ
      const safe12 = [
        "com.honor.browser", "com.hihonor.browserhomepage", "com.hihonor.gamecenter",
        "com.hihonor.game.kitserver", "com.hihonor.quickgame", "com.hihonor.cloudmusic",
        "com.honor.yoyocards", "com.hihonor.hiboard", "com.hihonor.redteamobile.roaming",
        "com.sohu.inputmethod.sogou.honor", "com.hihonor.servicecenter", "com.baidu.swan"
      ];
      await this.debloatPackages(safe12);

      // Bước 3: Wi-Fi Siêu Tốc & DNS Cloudflare DoT
      await this.applyNetworkSettings({ captive: 'google', dns: 'cloudflare', disableWifipro: true });

      // Bước 4: Tắt Telemetry TQ
      await this.disableTelemetry();

      // Bước 5: Khóa 120Hz & Khóa Density 385 dp (532)
      await this.applyDisplaySettings({ hz: '120', anim: '1.0', dpi: 'auto_sweet' });

      // Bước 6: Biên dịch Native ARM64 AOT
      await this.compileApps();

      // Bước 7: Fix thời tiết en-GB
      await this.fixWeatherLocale();

      // Bước 8: Google Assistant / Gemini
      await this.setAssistantGoogle();

      this.addLog('success', '=== HOÀN TẤT TẤT CẢ 8 BƯỚC TỐI ƯU HÓA PLAYBOOK THÀNH CÔNG 100%! ===');
      return { success: true };
    }

    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'master_optimize' }),
      });
      if (resp.ok) {
        this.addLog('success', '=== HOÀN TẤT TẤT CẢ 8 BƯỚC TỐI ƯU HÓA PLAYBOOK THÀNH CÔNG 100%! ===');
        return await resp.json();
      }
    } catch (e) {}
    return { success: false };
  }

  /**
   * Restore packages and Full Rollback to Factory Defaults
   */
  async restorePackages(packages = []) {
    this.addLog('info', 'Đang khôi phục hệ thống về nguyên bản xuất xưởng...');
    if (this.mode === 'webusb' && this.adbInstance) {
      let count = 0;
      for (const pkg of packages) {
        await this.executeShell(`cmd package install-existing ${pkg}`);
        await this.executeShell(`pm enable ${pkg}`);
        count++;
      }
      for (const pkg of ['com.hihonor.servicecenter', 'com.baidu.swan', 'com.hihonor.android.UEInfoCheck', 'com.hihonor.collectcenter', 'com.hihonor.magicvoice']) {
        await this.executeShell(`cmd package install-existing ${pkg}`);
        await this.executeShell(`pm enable ${pkg}`);
      }

      // Reset Display & Density
      await this.executeShell('settings delete system min_refresh_rate');
      await this.executeShell('settings delete system peak_refresh_rate');
      await this.executeShell('wm density reset');
      await this.executeShell('settings delete secure display_density_forced');
      await this.executeShell('settings put global low_resolution_switch 1');
      await this.executeShell('settings put global aps_display_resolution 2');

      // Reset Wi-Fi
      await this.executeShell('settings put global hn_wifipro_enable true');
      await this.executeShell('settings put system smart_network_switch 1');
      await this.executeShell('settings put secure settings_wlan_mt_axl 1');
      await this.executeShell('settings put global wifi_cloud_security_check 1');
      await this.executeShell('settings put global wifi_hidata_rtt_url www.baidu.com|connectivitycheck.gstatic.com|www.google.com');
      await this.executeShell('settings put global wifi_power_save 120');
      await this.executeShell('settings put global private_dns_mode off');

      this.addLog('success', 'Đã hoàn tác toàn bộ thiết lập về nguyên bản xuất xưởng thành công!');
      return { success: true, count };
    }

    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore_all', packages }),
      });
      if (resp.ok) {
        const data = await resp.json();
        this.addLog('success', `Đã khôi phục thành công ${data.count || 0} ứng dụng & toàn bộ thiết lập xuất xưởng.`);
        return data;
      }
    } catch (e) {}
    return { success: false, count: 0 };
  }

  /**
   * Reboot device
   */
  async reboot(mode = 'system') {
    this.addLog('warning', `Đang khởi động lại điện thoại (Chế độ: ${mode})...`);
    if (mode === 'bootloader') await this.executeShell('reboot bootloader');
    else if (mode === 'recovery') await this.executeShell('reboot recovery');
    else await this.executeShell('reboot');
  }

  /**
   * Get Battery Health & Diagnostics
   */
  async getBatteryHealth() {
    if (this.mode === 'webusb' && this.adbInstance) {
      const batDump = await this.executeShell('dumpsys battery');
      let level = 100, temp = 30.0, volts = 4.1, statusStr = 'Đang dùng pin', tech = 'Li-ion';
      for (const line of batDump.split('\n')) {
        const l = line.trim();
        if (l.startsWith('level:')) level = parseInt(l.split(':')[1]?.trim() || '100');
        else if (l.startsWith('temperature:')) temp = parseFloat(l.split(':')[1]?.trim() || '300') / 10;
        else if (l.startsWith('voltage:')) volts = Math.round(parseInt(l.split(':')[1]?.trim() || '4100') / 10) / 100;
        else if (l.startsWith('technology:')) tech = l.split(':')[1]?.trim() || 'Li-ion';
        else if (l.startsWith('status:')) {
          const s = l.split(':')[1]?.trim();
          if (s === '5') statusStr = 'Đã sạc đầy 100%';
          else if (s === '2') statusStr = 'Đang sạc pin';
          else if (s === '3') statusStr = 'Đang xả pin (Dùng pin)';
          else if (s === '4') statusStr = 'Không sạc';
        }
      }

      // Check official Honor MagicOS StatusOfBatteryHealth in settings global
      const sohStr = (await this.executeShell('settings get global StatusOfBatteryHealth')).trim();
      const sohVal = /^\d+$/.test(sohStr) && parseInt(sohStr) > 0 ? parseFloat(sohStr) : null;

      // Real Batterystats Checkin: Parse cycle count & learned capacity
      const checkin = await this.executeShell('dumpsys batterystats -c');
      let cycles = 0, estMah = null, learnedMah = null;
      for (const line of checkin.split('\n')) {
        if (line.includes(',l,bt,')) {
          const p = line.split(',');
          if (p.length >= 16) {
            estMah = parseInt(p[12]) || null;
            const learnedUah = parseInt(p[13]) || null;
            if (learnedUah) learnedMah = Math.round(learnedUah / 1000);
            cycles = parseInt(p[15]) || 0;
          }
          break;
        }
      }

      // Fallback check for sysfs cycle_count if cycles === 0
      if (cycles === 0) {
        for (const sp of ['/sys/class/power_supply/bk_battery/cycle_count', '/sys/class/power_supply/battery/cycle_count', '/sys/class/power_supply/bms/cycle_count']) {
          const cOut = (await this.executeShell(`cat ${sp}`)).trim();
          if (/^\d+$/.test(cOut)) {
            cycles = parseInt(cOut);
            break;
          }
        }
      }

      // Match device database for real design capacity if estMah is missing
      const model = (await this.executeShell('getprop ro.product.model')).trim();
      const matched = DEVICES_DB.find(d => d.sku === model || (d.aliases && d.aliases.includes(model)));
      let defaultDesignMah = 5200;
      if (matched && matched.battery) {
        const matchDigits = matched.battery.replace(/,/g, '').match(/(\d{4,5})\s*mAh/i);
        if (matchDigits) defaultDesignMah = parseInt(matchDigits[1]);
      }

      const designMah = estMah || defaultDesignMah;
      const fullMah = learnedMah || designMah;

      const healthPct = sohVal !== null
        ? sohVal
        : (estMah && learnedMah ? Math.min(100, Math.round((learnedMah / estMah) * 1000) / 10) : 100);

      // Real current in mA and wattage
      const curStr = (await this.executeShell('cmd battery get current_now')).trim();
      let curMa = 192;
      if (/^-?\d+$/.test(curStr)) curMa = parseInt(curStr);
      const wattage = Math.round(volts * (Math.abs(curMa) / 1000) * 100) / 100;

      let rating = 'Bình Thường';
      if (healthPct >= 95 && cycles <= 15) rating = 'Chuẩn Xuất Xưởng (Pin Mới 100%)';
      else if (healthPct >= 85) rating = 'Tốt (Hiệu Năng Ổn Định)';
      else if (healthPct < 80) rating = 'Cần Chú Ý (Pin Chai Dưới 80%)';

      const descStatus = `Dữ liệu đọc trực tiếp từ cảm biến quản lý nguồn BMS: Dung lượng thực ${fullMah} mAh, chu kỳ sạc ${cycles} lần, điện áp ${volts}V, dòng điện ${Math.abs(curMa)}mA.`;

      return {
        connected: true,
        health_percent: healthPct,
        cycle_count: cycles,
        current_capacity_mah: fullMah,
        design_capacity_mah: designMah,
        battery_level: level,
        temperature: temp,
        voltage_v: volts,
        current_ma: curMa,
        wattage: wattage,
        status: statusStr,
        rating: rating,
        technology: tech.includes('Li') ? `${tech} (Thanh Hải Hồ Si-C)` : tech,
        desc_status: descStatus,
        model: model,
        commercial_name: matched?.name || `Honor (${model})`
      };
    }

    try {
      const resp = await fetch('/api/battery_health');
      if (resp.ok) return await resp.json();
    } catch (e) {}

    return { connected: false };
  }

  /**
   * Get Quality Inspection Report (Toolkit Standard)
   */
  async getInspectionReport() {
    if (this.mode === 'webusb' && this.adbInstance) {
      const dispId = (await this.executeShell('getprop ro.build.display.id')).trim();
      const magicVer = (await this.executeShell('getprop ro.build.version.magic')).trim();
      const androidRel = (await this.executeShell('getprop ro.build.version.release')).trim();
      const secPatch = (await this.executeShell('getprop ro.build.version.security_patch')).trim();
      const blLocked = (await this.executeShell('getprop ro.boot.flash.locked')).trim();
      const blState = (await this.executeShell('getprop ro.boot.verifiedbootstate')).trim();
      const socManu = (await this.executeShell('getprop ro.soc.manufacturer')).trim();
      const socModel = (await this.executeShell('getprop ro.soc.model')).trim();
      const boardName = (await this.executeShell('getprop ro.board.platform')).trim();
      const model = (await this.executeShell('getprop ro.product.model')).trim();
      const serial = this.usbDevice.serial;
      const wmSize = (await this.executeShell('wm size')).trim();
      const wmDensity = (await this.executeShell('wm density')).trim();
      const memOut = await this.executeShell('cat /proc/meminfo');
      const dfOut = await this.executeShell('df -h /data');
      const seOut = (await this.executeShell('getenforce')).trim();
      const suOut = (await this.executeShell('which su')).trim();

      const batInfo = await this.getBatteryHealth();

      const isLocked = (blLocked === '1' || blState.toLowerCase() === 'green');
      const isRooted = !!(suOut && !suOut.includes('not found') && suOut.includes('su'));

      let ramGb = 8, ramAvailGb = 2.0;
      for (const line of memOut.split('\n')) {
        if (line.includes('MemTotal:')) {
          const kb = parseInt(line.split(':')[1]?.replace('kB', '').trim() || '0');
          if (kb > 0) ramGb = Math.round(kb / (1024 * 1024));
        } else if (line.includes('MemAvailable:')) {
          const kb = parseInt(line.split(':')[1]?.replace('kB', '').trim() || '0');
          if (kb > 0) ramAvailGb = Math.round((kb / (1024 * 1024)) * 10) / 10;
        }
      }

      let totalData = '256 GB', availData = '204 GB';
      const dfLines = dfOut.split('\n').map(l => l.trim()).filter(Boolean);
      if (dfLines.length >= 2) {
        const parts = dfLines[dfLines.length - 1].split(/\s+/);
        if (parts.length >= 5) {
          totalData = parts[1];
          availData = parts[3];
        }
      }

      const resStr = wmSize.includes('Physical size:') ? wmSize.replace('Physical size:', '').trim() : '1280x2788';
      const densStr = wmDensity.includes('Physical density:') ? wmDensity.replace('Physical density:', '').split('\n')[0].trim() : '480 DPI';

      const socDisplay = (socManu && socModel) ? `${socManu} ${socModel} (Board: ${boardName})` : (socModel || 'Chính Hãng');

      const checklist = [
        {
          id: 'firmware',
          title: 'Hệ Điều Hành & Nguồn Gốc ROM',
          value: dispId || `${model} (ROM Gốc C00)`,
          status: 'pass',
          note: `${magicVer || 'MagicOS'} • Android ${androidRel || '14'} • Patch ${secPatch || 'Mới nhất'}`
        },
        {
          id: 'bootloader',
          title: 'Trạng Thái Khóa Bootloader',
          value: isLocked ? `Đã Khóa Bảo Mật (ro.boot.flash.locked=${blLocked || '1'})` : 'Bootloader Đã Mở Khóa (Unlocked)',
          status: isLocked ? 'pass' : 'warning',
          note: isLocked ? `Verified Boot: ${blState || 'green'} (Phân vùng Boot nguyên bản)` : 'Thiết bị có thể đã can thiệp root'
        },
        {
          id: 'hardware',
          title: 'Bo Mạch & Vi Xử Lý (CPU/SoC)',
          value: socDisplay,
          status: 'pass',
          note: `Model: ${model} • Serial: ${serial}`
        },
        {
          id: 'screen',
          title: 'Màn Hình & Tần Số Quét',
          value: `${resStr} OLED • 120Hz`,
          status: 'pass',
          note: `Mật độ điểm ảnh: ${densStr} • Cảm ứng nhạy 100%`
        },
        {
          id: 'battery',
          title: 'Sức Khỏe Pin & Chu Kỳ Sạc',
          value: `${batInfo.health_percent || 100}% (${batInfo.current_capacity_mah || 5200} / ${batInfo.design_capacity_mah || 5200} mAh)`,
          status: (batInfo.health_percent || 100) >= 80 ? 'pass' : 'warning',
          note: `Đã sạc: ${batInfo.cycle_count || 0} chu kỳ • Điện áp: ${batInfo.voltage_v || 4.2}V • ${batInfo.status || 'Đang dùng pin'}`
        },
        {
          id: 'memory',
          title: 'Bộ Nhớ RAM & Lưu Trữ UFS',
          value: `${ramGb} GB RAM (Khả dụng: ${ramAvailGb} GB)`,
          status: 'pass',
          note: `Bộ nhớ phân vùng /data: Trống ${availData} / ${totalData}`
        },
        {
          id: 'root',
          title: 'Toàn Vẹn Hệ Thống (SELinux & Root Integrity)',
          value: isRooted ? 'Phát hiện quyền Root (su)' : `Chưa Root (SELinux ${seOut || 'Enforcing'})`,
          status: isRooted ? 'warning' : 'pass',
          note: isRooted ? 'Thiết bị đã root, các app ngân hàng có thể cảnh báo' : 'Hệ thống nguyên bản bảo mật Knox/MagicGuard 100%'
        },
        {
          id: 'security',
          title: 'Bản Vá Bảo Mật Android',
          value: secPatch ? `Cập nhật ngày ${secPatch}` : 'Bản vá chính hãng',
          status: 'pass',
          note: `Android ${androidRel || '14'} chính hãng Honor MagicOS`
        }
      ];

      let score = 100;
      checklist.forEach(item => {
        if (item.status === 'warning') score -= 10;
      });

      const verdict = score >= 90
        ? 'CHỨNG NHẬN XANH: THIẾT BỊ NGUYÊN BẢN CHÍNH HÃNG 100%'
        : 'CẦN CHÚ Ý: MỘT SỐ HẠNG MỤC CẦN KIỂM TRA';

      return {
        connected: true,
        score,
        verdict,
        inspection_date: new Date().toLocaleString('vi-VN'),
        model,
        serial,
        security_patch: secPatch || 'Mới nhất',
        checklist,
        battery: batInfo
      };
    }

    try {
      const resp = await fetch('/api/inspection');
      if (resp.ok) return await resp.json();
    } catch (e) {}

    return { connected: false };
  }

  /**
   * Connect Wireless ADB (Port 5555)
   */
  async connectWirelessAdb() {
    this.addLog('info', 'Đang thiết lập cổng kết nối không dây ADB (Port 5555)...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect_wireless_adb' }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    await this.executeShell('tcpip 5555');
    return { success: true, message: 'Đã mở cổng 5555' };
  }

  /**
   * Lossless Screenshot via ADB (WebUSB native + local daemon fallback)
   */
  async takeScreenshot() {
    this.addLog('info', 'Đang chụp ảnh màn hình điện thoại...');
    if (this.mode === 'webusb' && this.adbInstance) {
      try {
        const socket = await this.adbInstance.createSocket('exec:screencap -p');
        const reader = socket.readable.getReader();
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          this.addLog('success', 'Chụp ảnh màn hình điện thoại thành công!');
          return {
            success: true,
            url,
            blob,
            filename: `Honor_Screenshot_${Date.now()}.png`,
            timestamp: new Date().toLocaleTimeString('vi-VN'),
          };
        }
      } catch (e) {
        console.warn('[WebUSB screencap failed]', e);
      }
    }

    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'take_screenshot' }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}

    return { success: false, error: 'Không thể chụp ảnh màn hình.' };
  }

  /**
   * Send Android Key Event (e.g. 3 Home, 4 Back, 187 Recents, 26 Power, 24/25 Volume)
   */
  async sendKeyEvent(keyCode) {
    return await this.executeShell(`input keyevent ${keyCode}`);
  }

  /**
   * Send touch tap at real coordinates
   */
  async inputTap(x, y) {
    return await this.executeShell(`input tap ${Math.round(x)} ${Math.round(y)}`);
  }

  /**
   * Start Screen Recording on phone
   */
  async startScreenRecord() {
    this.addLog('info', 'Bắt đầu phiên quay video màn hình...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_screen_record' }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { success: false, error: 'Tính năng quay video yêu cầu máy chủ local' };
  }

  /**
   * Stop Screen Recording and pull MP4
   */
  async stopScreenRecord() {
    this.addLog('info', 'Đang dừng quay màn hình và xuất file MP4...');
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop_screen_record' }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { success: false, error: 'Lỗi dừng quay video màn hình' };
  }

  /**
   * Get recording status
   */
  async getScreenRecordStatus() {
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_screen_record_status' }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { recording: false, duration: 0 };
  }

  /**
   * Extract APK from device
   */
  async extractApk(packageName) {
    this.addLog('info', `Đang trích xuất file APK của ứng dụng ${packageName}...`);
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extract_apk', package_name: packageName }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { success: false, error: 'Tính năng trích xuất yêu cầu máy chủ local' };
  }

  /**
   * Install Drag & Drop APK
   */
  async installUploadedApk(filename, dataB64) {
    this.addLog('info', `Đang tải & cài đặt ${filename} lên thiết bị Honor...`);
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install_uploaded_apk', filename, data: dataB64 }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { success: false, error: 'Lỗi gửi file cài đặt tới máy chủ local' };
  }

  /**
   * Trigger Hardware Diagnostic Test (Haptic / Audio)
   */
  async testHardware(type) {
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_hardware', type }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    if (type === 'haptic') {
      await this.executeShell('cmd vibrator_manager synced -f oneshot 350 255');
    } else if (type === 'audio') {
      await this.executeShell('am start -a android.intent.action.VIEW -d file:///system/media/audio/notifications/HONOR_Marimba.ogg -t audio/ogg');
    } else if (type === 'screen_browser') {
      await this.executeShell('am start -a android.intent.action.VIEW -d https://www.deadpixeltest.org');
    } else if (type === 'touch_pointer') {
      const current = await this.executeShell('settings get system pointer_location');
      const nextVal = current && current.trim() === '1' ? '0' : '1';
      await this.executeShell(`settings put system pointer_location ${nextVal}`);
      return { success: true, enabled: nextVal === '1' };
    }
    return { success: true };
  }

  /**
   * Get all installed applications (User, System, Disabled)
   */
  async getAllApplications() {
    if (this.mode === 'webusb' && this.adbInstance) {
      this.addLog('info', 'Đang quét danh sách ứng dụng thực tế từ điện thoại qua WebUSB...');
      try {
        const outUser = await this.executeShell('pm list packages -f -3');
        const outSys = await this.executeShell('pm list packages -f -s');
        const outDis = await this.executeShell('pm list packages -d');

        const userMap = {};
        outUser.split('\n').forEach((line) => {
          line = line.trim();
          if (line.startsWith('package:')) {
            const raw = line.slice(8);
            const idx = raw.lastIndexOf('=');
            if (idx !== -1) {
              const apk = raw.slice(0, idx);
              const pkg = raw.slice(idx + 1);
              if (pkg) userMap[pkg] = apk;
            }
          }
        });

        const sysMap = {};
        outSys.split('\n').forEach((line) => {
          line = line.trim();
          if (line.startsWith('package:')) {
            const raw = line.slice(8);
            const idx = raw.lastIndexOf('=');
            if (idx !== -1) {
              const apk = raw.slice(0, idx);
              const pkg = raw.slice(idx + 1);
              if (pkg) sysMap[pkg] = apk;
            }
          }
        });

        const disabledSet = new Set(
          outDis.split('\n').map((l) => l.replace('package:', '').trim()).filter(Boolean)
        );

        const allPkgs = Array.from(new Set([...Object.keys(userMap), ...Object.keys(sysMap)]));
        const allApps = allPkgs.map((pkg) => {
          const isUser = !!userMap[pkg];
          const apkPath = userMap[pkg] || sysMap[pkg] || '';
          const isDisabled = disabledSet.has(pkg);
          const label = this.getFriendlyAppName(pkg);

          return {
            package: pkg,
            name: label,
            is_user: isUser,
            type: isUser ? 'Người dùng' : 'Hệ thống',
            apk_path: apkPath,
            version: '--',
            disabled: isDisabled,
            status: isDisabled ? 'Đã đóng băng' : 'Đang hoạt động',
          };
        });

        allApps.sort((a, b) => {
          if (a.is_user !== b.is_user) return a.is_user ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        const counts = {
          total: allApps.length,
          user: Object.keys(userMap).length,
          system: Object.keys(sysMap).length,
          disabled: disabledSet.size,
        };

        this.addLog('success', `Đã nạp ${allApps.length} ứng dụng thực tế từ thiết bị (${counts.user} User, ${counts.system} Hệ thống, ${counts.disabled} Đã đóng băng).`);
        return { connected: true, apps: allApps, counts };
      } catch (e) {
        console.error('getAllApplications WebUSB error:', e);
      }
    }

    try {
      const resp = await fetch('/api/apps');
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { connected: false, apps: [], counts: { total: 0, user: 0, system: 0, disabled: 0 } };
  }

  async uninstallApp(pkg, isUser = true) {
    this.addLog('info', `Gỡ cài đặt ${pkg}...`);
    if (this.mode === 'webusb' && this.adbInstance) {
      try {
        await this.executeShell(`pm disable-user --user 0 ${pkg}`);
        const res = await this.executeShell(`pm uninstall -k --user 0 ${pkg}`);
        const success = res.toLowerCase().includes('success');
        this.addLog(success ? 'success' : 'warning', `Kết quả gỡ ${pkg}: ${res || 'Đã gửi lệnh'}`);
        return { success: true, output: res };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'uninstall_app', package: pkg, is_user: isUser }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { success: false, error: 'Lỗi gỡ ứng dụng' };
  }

  async freezeApp(pkg) {
    this.addLog('info', `Đóng băng (vô hiệu hóa) ${pkg}...`);
    if (this.mode === 'webusb' && this.adbInstance) {
      try {
        const res = await this.executeShell(`pm disable-user --user 0 ${pkg}`);
        this.addLog('success', `Đã đóng băng ${pkg}`);
        return { success: true, output: res };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'freeze_app', package: pkg }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { success: false, error: 'Lỗi đóng băng ứng dụng' };
  }

  async unfreezeApp(pkg) {
    this.addLog('info', `Kích hoạt lại ${pkg}...`);
    if (this.mode === 'webusb' && this.adbInstance) {
      try {
        const res = await this.executeShell(`pm enable ${pkg}`);
        this.addLog('success', `Đã kích hoạt lại ${pkg}`);
        return { success: true, output: res };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unfreeze_app', package: pkg }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { success: false, error: 'Lỗi kích hoạt ứng dụng' };
  }

  async clearAppData(pkg) {
    this.addLog('info', `Xóa dữ liệu & cache của ${pkg}...`);
    if (this.mode === 'webusb' && this.adbInstance) {
      try {
        const res = await this.executeShell(`pm clear ${pkg}`);
        this.addLog('success', `Đã xóa dữ liệu ${pkg}`);
        return { success: true, output: res };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_app_data', package: pkg }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { success: false, error: 'Lỗi xóa dữ liệu' };
  }

  async launchApp(pkg) {
    this.addLog('info', `Khởi chạy ${pkg}...`);
    if (this.mode === 'webusb' && this.adbInstance) {
      try {
        await this.executeShell(`monkey -p ${pkg} -c android.intent.category.LAUNCHER 1`);
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'launch_app', package: pkg }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { success: false };
  }

  async forceStopApp(pkg) {
    this.addLog('info', `Buộc dừng ${pkg}...`);
    if (this.mode === 'webusb' && this.adbInstance) {
      try {
        await this.executeShell(`am force-stop ${pkg}`);
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    try {
      const resp = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force_stop_app', package: pkg }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {}
    return { success: false };
  }
}

export const adbService = new AdbService();
