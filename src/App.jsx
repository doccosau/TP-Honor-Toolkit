import React, { useState, useEffect, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import RibbonNav from './components/RibbonNav';
import DeviceChassis from './components/DeviceChassis';
import SpecsGrid from './components/SpecsGrid';
import InspectionTab from './components/InspectionTab';
import AppManagerTab from './components/AppManagerTab';
import DebloatTab from './components/DebloatTab';
import NetworkTab from './components/NetworkTab';
import DisplayTab from './components/DisplayTab';
import ToolboxTab from './components/ToolboxTab';
import BackupTab from './components/BackupTab';
import DeviceDatabaseTab from './components/DeviceDatabaseTab';
import TerminalConsole from './components/TerminalConsole';
import WebUsbGuideModal from './components/WebUsbGuideModal';
import ToastContainer from './components/ToastContainer';
import ScrcpyInstallModal from './components/ScrcpyInstallModal';
import WebMirrorModal from './components/WebMirrorModal';
import { adbService } from './services/adbService';

export default function App() {
  const [activeTab, setActiveTab] = useState('device');
  const [device, setDevice] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [showScrcpyModal, setShowScrcpyModal] = useState(false);
  const [showWebMirrorModal, setShowWebMirrorModal] = useState(false);
  const [isDraggingApk, setIsDraggingApk] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [scannedPackages, setScannedPackages] = useState({ connected: false, vn_apps: [], bloatware: {} });
  const [isScanning, setIsScanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingTask, setExecutingTask] = useState('');

  // Toast dispatch helper
  const addToast = useCallback((type, title, message, action = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Scan packages on device
  const refreshScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const data = await adbService.scanPackages();
      if (data) {
        setScannedPackages(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Poll local daemon
  const pollLocalDevice = useCallback(async () => {
    try {
      const resp = await fetch('/api/device');
      if (resp.ok) {
        const dev = await resp.json();
        if (dev && dev.connected) {
          setDevice(dev);
        } else if (device && device.mode === 'local') {
          setDevice(null);
        }
      }
    } catch (e) {
      // Running standalone
    }
  }, [device]);

  // Subscribe to adbService logs and state changes, plus live polling daemon /api/logs
  useEffect(() => {
    let isMounted = true;
    let localServerAvailable = false;

    const pollLogs = async () => {
      try {
        const resp = await fetch('/api/logs');
        if (resp.ok) {
          localServerAvailable = true;
          const data = await resp.json();
          if (data && Array.isArray(data.logs) && isMounted) {
            setLogs(data.logs);
          }
        } else {
          localServerAvailable = false;
        }
      } catch (e) {
        localServerAvailable = false;
      }
    };

    pollLogs();
    const logInterval = setInterval(pollLogs, 600);

    const unsub = adbService.onStateChange((state) => {
      if (!isMounted) return;
      if (state.type === 'log' && !localServerAvailable) {
        setLogs(state.logs);
      } else if (state.type === 'disconnected') {
        setDevice(null);
      }
    });

    pollLocalDevice();
    const devInterval = setInterval(pollLocalDevice, 3500);

    return () => {
      isMounted = false;
      clearInterval(logInterval);
      clearInterval(devInterval);
      unsub();
    };
  }, [pollLocalDevice]);

  const handleClearLogs = async () => {
    setLogs([]);
    adbService.clearLogs?.();
    try {
      await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_logs' }),
      });
    } catch (e) {}
  };

  // Auto connect paired USB device on mount
  useEffect(() => {
    let active = true;
    adbService.autoConnectPairedDevice().then((dev) => {
      if (dev && active) {
        setDevice(dev);
        addToast('success', 'Tự Động Kết Nối', `Đã đồng bộ thiết bị: ${dev.commercial_name}`);
      }
    });
    return () => { active = false; };
  }, [addToast]);

  // Auto scan when device connects
  useEffect(() => {
    if (device && device.connected) {
      refreshScan();
    }
  }, [device?.connected, refreshScan]);

  const handleConnectWebUsb = async () => {
    setIsConnecting(true);
    try {
      const devInfo = await adbService.connectWebUsb();
      setDevice(devInfo);
      addToast('success', 'Kết nối thành công', `Đã đồng bộ thiết bị: ${devInfo.commercial_name}`);
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('already in use') ||
        msg.includes('claimInterface') ||
        msg.includes('NetworkError')
      ) {
        adbService.addLog('warning', 'Cổng USB đang bị tiến trình ADB máy tính chiếm giữ.');
        
        // Auto-check local ADB bridge
        try {
          const resp = await fetch('/api/device');
          if (resp.ok) {
            const dev = await resp.json();
            if (dev && dev.connected) {
              setDevice(dev);
              addToast(
                'info',
                'Kết Nối Local ADB',
                `Đã phát hiện và kết nối trực tiếp với ${dev.commercial_name} qua ADB máy tính.`
              );
              return;
            }
          }
        } catch (e) {}

        addToast(
          'warning',
          'Cổng USB đang bận',
          'Cổng USB đang bị ADB của máy tính chiếm dụng. Bạn có thể giải phóng cổng USB để tiếp tục WebUSB.',
          {
            label: 'Giải Phóng USB (adb kill-server)',
            onClick: async () => {
              try {
                await fetch('/api/action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'kill_adb_server' }),
                });
                addToast('success', 'Đã giải phóng USB', 'Bây giờ bạn có thể bấm lại "Kết Nối WebUSB".');
              } catch (e) {
                addToast('error', 'Lỗi', 'Không thể giải phóng tự động. Vui lòng tắt các phần mềm giả lập hoặc trình quản lý thiết bị khác.');
              }
            },
          }
        );
      } else {
        addToast('error', 'Lỗi kết nối WebUSB', msg);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefresh = async () => {
    adbService.addLog('info', 'Đang làm mới thông tin thiết bị...');
    try {
      const devInfo = await adbService.getDeviceInfo();
      if (devInfo && devInfo.connected) {
        setDevice(devInfo);
        addToast('success', 'Đã cập nhật', 'Thông số thiết bị đã được đồng bộ mới nhất.');
      } else {
        setDevice(null);
        addToast('info', 'Thông báo', 'Chưa có thiết bị nào được cắm cáp USB.');
      }
    } catch (e) {
      setDevice(null);
      addToast('warning', 'Chưa kết nối', 'Vui lòng cắm cáp USB hoặc bấm Kết Nối WebUSB.');
    }
  };

  const handleMasterOptimize = async () => {
    if (!device?.connected) return;

    setIsExecuting(true);
    setExecutingTask('Tối ưu 8 bước Playbook');
    adbService.addLog('info', '=== BẮT ĐẦU TỐI ƯU HÓA TOÀN DIỆN 1-CLICK (PLAYBOOK MAGICOS) ===');
    addToast('info', 'Đang xử lý', 'Đang thực hiện quy trình 8 bước tối ưu hóa chuyên sâu theo Playbook...');
    try {
      await adbService.masterOptimize();
      addToast('success', 'Tối ưu hoàn tất', 'Đã hoàn tất toàn bộ 8 bước tối ưu hóa Playbook cho máy!');
      await refreshScan();
      handleRefresh();
    } catch (e) {
      adbService.addLog('error', `Lỗi: ${e.message}`);
      addToast('error', 'Lỗi tối ưu', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleDisableTelemetry = async () => {
    try {
      await adbService.disableTelemetry();
      addToast('success', 'Chặn Telemetry', 'Đã tắt sạch Telemetry & thu thập log ngầm TQ!');
    } catch (e) {
      addToast('error', 'Lỗi chặn Telemetry', e.message);
    }
  };

  const handleFixWeather = async () => {
    try {
      await adbService.fixWeatherLocale();
      addToast('success', 'Thời Tiết Độ C', 'Đã chuyển app Thời tiết sang Tiếng Anh quốc tế en-GB (Độ C)!');
    } catch (e) {
      addToast('error', 'Lỗi đổi ngôn ngữ thời tiết', e.message);
    }
  };

  const handleApplyNetwork = async (params) => {
    try {
      await adbService.applyNetworkSettings(params);
      addToast('success', 'Mạng & Private DNS', `Đã lưu và áp dụng cấu hình Mạng! Private DNS: ${params.customDns || 'Tắt'}`);
      handleRefresh();
    } catch (e) {
      addToast('error', 'Lỗi mạng', e.message);
    }
  };

  const handleApplyDisplay = async (params) => {
    try {
      await adbService.applyDisplaySettings(params);
      addToast('success', 'Màn Hình & DPI', 'Đã áp dụng độ phân giải và tần số quét màn hình thành công!');
      handleRefresh();
    } catch (e) {
      addToast('error', 'Lỗi màn hình', e.message);
    }
  };

  const handleLaunchScrcpy = async (params) => {
    // 1. Try local server backend if running
    if (adbService.mode !== 'webusb') {
      try {
        const res = await adbService.launchScrcpy(params);
        if (res?.success) {
          addToast('success', 'Scrcpy 120Hz', 'Đã mở cửa sổ điều khiển màn hình Scrcpy 120Hz!');
          return;
        }
      } catch (e) {}
    }

    // 2. On WebUSB (Cloudflare Pages):
    // DO NOT disconnect USB! Keep web connection active.
    // Open the official Scrcpy guidance modal with 1-click winget commands and Web Mirror option.
    setShowScrcpyModal(true);
  };

  const handleSetAssistant = async () => {
    setIsExecuting(true);
    setExecutingTask('Cấu hình Trợ lý Google/Gemini');
    try {
      await adbService.setAssistantGoogle();
      addToast('success', 'Trợ lý ảo', 'Đã gán Google Assistant / Gemini làm trợ lý mặc định!');
    } catch (e) {
      addToast('error', 'Lỗi gán trợ lý', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleInstallGestureSearch = async () => {
    setIsExecuting(true);
    setExecutingTask('Cài đặt Gesture Search');
    try {
      addToast('info', 'Gesture Search', 'Đang cài đặt và cấp quyền cho thanh vuốt gọi Gemini...');
      const res = await adbService.installGestureSearch();
      if (res && res.success) {
        addToast('success', 'Cài đặt thành công', 'Gesture Search đã sẵn sàng! Đã bật thanh cử chỉ vuốt đáy màn hình.');
      } else {
        addToast('error', 'Lỗi cài đặt', res?.error || 'Không thể cài đặt Gesture Search');
      }
    } catch (e) {
      addToast('error', 'Lỗi cài đặt', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleInstallVxMAssistant = async () => {
    setIsExecuting(true);
    setExecutingTask('Cài đặt Trợ Lý VXM');
    try {
      addToast('info', 'Trợ Lý VXM', 'Đang cài đặt và cấp quyền nhận diện giọng nói "Hey Google" 24/7...');
      const res = await adbService.installVxMAssistant();
      if (res && res.success) {
        addToast('success', 'Cài đặt thành công', 'Trợ Lý VXM đã sẵn sàng! Bạn có thể gọi "OK Google" mọi lúc.');
      } else {
        addToast('error', 'Lỗi cài đặt', res?.error || 'Không thể cài đặt Trợ Lý VXM');
      }
    } catch (e) {
      addToast('error', 'Lỗi cài đặt', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleSetupFullAssistantSuite = async () => {
    setIsExecuting(true);
    setExecutingTask('Kích hoạt Bộ Trợ Lý Toàn Diện');
    try {
      addToast('info', 'Bộ Trợ Lý Toàn Diện', 'Đang kích hoạt Core OS + Gesture Search + Trợ Lý VXM...');
      const res = await adbService.setupFullAssistantSuite();
      if (res && res.success) {
        addToast('success', 'Kích hoạt thành công', 'Đã thiết lập trọn bộ Trợ lý Google & Gemini toàn diện!');
      } else {
        addToast('error', 'Lỗi thiết lập', res?.error || 'Không thể thiết lập bộ trợ lý');
      }
    } catch (e) {
      addToast('error', 'Lỗi thiết lập', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleEnableGoogleServices = async () => {
    setIsExecuting(true);
    setExecutingTask('Bật Google Basic Services');
    try {
      addToast('info', 'Dịch vụ Google', 'Đang bật GMS Core & GSF trong hệ thống MagicOS...');
      const res = await adbService.enableGoogleServices();
      if (res && res.success) {
        addToast('success', 'Thành công', 'Đã kích hoạt toàn bộ Dịch Vụ Google Cơ Bản (GMS/GSF)!');
      } else {
        addToast('error', 'Lỗi bật Google', res?.error || 'Không thể kích hoạt GMS');
      }
    } catch (e) {
      addToast('error', 'Lỗi bật Google', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleInstallPlayStore = async (apkUrl = '') => {
    setIsExecuting(true);
    setExecutingTask('Cài đặt Google Play Store');
    try {
      addToast('info', 'CH Play Store', 'Đang nhận diện phần cứng & cài đặt Google Play Store...');
      const res = await adbService.installPlayStore(apkUrl);
      if (res && res.success) {
        addToast('success', 'Thành công', 'Đã cài đặt CH Play Store và mở ứng dụng để đăng nhập!');
      } else {
        addToast('error', 'Lỗi cài CH Play', res?.error || 'Không thể cài đặt Play Store');
      }
    } catch (e) {
      addToast('error', 'Lỗi cài CH Play', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleSetupFullGoogleEcosystem = async (apkUrl = '') => {
    setIsExecuting(true);
    setExecutingTask('Kích hoạt Trọn Gói Google & CH Play');
    try {
      addToast('info', 'Google & CH Play', 'Đang kích hoạt Dịch Vụ Google & Cài đặt Cửa Hàng CH Play...');
      const res = await adbService.setupFullGoogleEcosystem(apkUrl);
      if (res && res.success) {
        addToast('success', 'Hoàn tất', 'Hệ sinh thái Google & CH Play đã sẵn sàng trên máy Honor!');
      } else {
        addToast('error', 'Lỗi kích hoạt', res?.error || 'Không thể kích hoạt trọn gói Google');
      }
    } catch (e) {
      addToast('error', 'Lỗi kích hoạt', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleCompileApps = async () => {
    setIsExecuting(true);
    setExecutingTask('Biên dịch Native ARM64 AOT');
    try {
      addToast('info', 'Đang biên dịch', 'Đang tăng tốc Native ARM64 cho Zalo và app ngân hàng...');
      await adbService.compileApps();
      addToast('success', 'Biên dịch hoàn tất', 'Đã biên dịch mã máy Native cho app mượt mà tức thì!');
    } catch (e) {
      addToast('error', 'Lỗi biên dịch', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleDebloat = async (packages) => {
    setIsExecuting(true);
    setExecutingTask(`Gỡ ${packages.length} Bloatware`);
    try {
      await adbService.debloatPackages(packages);
      addToast('success', 'Gỡ Bloatware', `Đã gỡ bỏ thành công ${packages.length} ứng dụng rác nội địa!`);
      await refreshScan();
      handleRefresh();
    } catch (e) {
      addToast('error', 'Lỗi gỡ app', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleRestore = async (packages) => {
    setIsExecuting(true);
    setExecutingTask(`Khôi phục ${packages?.length || 0} app`);
    try {
      const pkgsToRestore = Array.isArray(packages) && packages.length > 0
        ? packages
        : ['com.hihonor.servicecenter', 'com.baidu.swan', 'com.parallelc.micts'];
      await adbService.restorePackages(pkgsToRestore);
      addToast('success', 'Khôi phục thành công', `Đã khôi phục ${pkgsToRestore.length} ứng dụng đã chọn!`);
      await refreshScan();
      handleRefresh();
    } catch (e) {
      addToast('error', 'Lỗi khôi phục', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleRestoreAll = async () => {
    if (!window.confirm('CẢNH BÁO: Thao tác này sẽ cài đặt lại toàn bộ ứng dụng rác TQ và khôi phục cài đặt xuất xưởng. Tiếp tục?')) return;
    setIsExecuting(true);
    setExecutingTask('Khôi phục xuất xưởng');
    try {
      const res = await adbService.restorePackages([]);
      addToast('success', 'Khôi Phục Gốc', `Đã hoàn tất khôi phục ${res.count || 0} package về xuất xưởng!`);
      await refreshScan();
      handleRefresh();
    } catch (e) {
      addToast('error', 'Lỗi khôi phục', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleWhitelist = async (packages) => {
    let list = Array.isArray(packages) ? packages : [];
    if (list.length === 0) {
      list = (scannedPackages?.vn_apps || []).filter((a) => a.installed).map((a) => a.package);
    }
    if (list.length === 0) {
      addToast('warning', 'Không có app', 'Không tìm thấy ứng dụng Việt Nam nào đang cài đặt trên máy để cấp Doze.');
      return;
    }

    setIsExecuting(true);
    setExecutingTask(`Whitelist ${list.length} app VN`);
    try {
      await adbService.whitelistApps(list);
      addToast('success', 'Doze Whitelist', `Đã cấp quyền chạy nền không trễ thông báo cho ${list.length} ứng dụng VN!`);
      await refreshScan();
      handleRefresh();
    } catch (e) {
      addToast('error', 'Lỗi cấp quyền Doze', e.message);
    } finally {
      setIsExecuting(false);
      setExecutingTask('');
    }
  };

  const handleReboot = async (mode) => {
    try {
      await adbService.reboot(mode);
      addToast('warning', 'Khởi động lại', `Đang khởi động lại điện thoại (Chế độ: ${mode})...`);
    } catch (e) {
      addToast('error', 'Lỗi khởi động lại', e.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingApk) setIsDraggingApk(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget === null) {
      setIsDraggingApk(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingApk(false);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.apk')) {
        addToast('error', 'Định dạng không hợp lệ', `File "${file.name}" không phải file .apk`);
        continue;
      }

      addToast('info', 'Đang nạp file APK', `Đang đọc ${file.name} (${Math.round(file.size / (1024 * 1024) * 10) / 10} MB)...`);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          addToast('info', 'Đang cài đặt', `Đang cài đặt ${file.name} qua ADB...`);
          const res = await adbService.installUploadedApk(file.name, base64Data);
          if (res && res.success) {
            addToast('success', 'Cài đặt thành công', `Đã cài đặt thành công ${file.name}!`);
            refreshScan();
          } else {
            addToast('error', 'Lỗi cài đặt', res?.error || 'Không thể cài đặt APK');
          }
        } catch (err) {
          addToast('error', 'Lỗi xử lý file', err.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="app-window-shell"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Window Titlebar */}
      <TitleBar
        device={device}
        isConnecting={isConnecting}
        onConnectWebUsb={handleConnectWebUsb}
        onRefresh={handleRefresh}
        onOpenGuide={() => setShowGuide(true)}
      />

      {/* Main Ribbon Navigation */}
      <RibbonNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Workspace */}
      <div className="workspace-container">
        {activeTab === 'device' && (
          <div id="tab-device" className="tab-pane active">
            <DeviceChassis
              device={device}
              onMasterOptimize={handleMasterOptimize}
              onLaunchScrcpy={handleLaunchScrcpy}
              onReboot={handleReboot}
            />
            <SpecsGrid device={device} />
          </div>
        )}

        {activeTab === 'inspection' && (
          <InspectionTab device={device} />
        )}

        {activeTab === 'apps' && (
          <AppManagerTab
            device={device}
            scannedPackages={scannedPackages}
            isScanning={isScanning}
            onWhitelistAll={handleWhitelist}
            onRefreshScan={refreshScan}
          />
        )}

        {activeTab === 'debloat' && (
          <DebloatTab
            device={device}
            scannedPackages={scannedPackages}
            isScanning={isScanning}
            onDebloat={handleDebloat}
            onRestore={handleRestore}
            onRefreshScan={refreshScan}
          />
        )}

        {activeTab === 'network' && (
          <NetworkTab
            device={device}
            onApplyNetwork={handleApplyNetwork}
          />
        )}

        {activeTab === 'display' && (
          <DisplayTab
            device={device}
            onApplyDisplay={handleApplyDisplay}
          />
        )}

        {activeTab === 'toolbox' && (
          <ToolboxTab
            device={device}
            onLaunchScrcpy={handleLaunchScrcpy}
            onOpenWebMirror={() => setShowWebMirrorModal(true)}
            onSetAssistant={handleSetAssistant}
            onInstallGestureSearch={handleInstallGestureSearch}
            onInstallVxMAssistant={handleInstallVxMAssistant}
            onSetupFullAssistantSuite={handleSetupFullAssistantSuite}
            onEnableGoogleServices={handleEnableGoogleServices}
            onInstallPlayStore={handleInstallPlayStore}
            onSetupFullGoogleEcosystem={handleSetupFullGoogleEcosystem}
            onCompileApps={handleCompileApps}
            onDisableTelemetry={handleDisableTelemetry}
            onFixWeather={handleFixWeather}
            onReboot={handleReboot}
          />
        )}

        {activeTab === 'backup' && (
          <BackupTab
            device={device}
            onRestoreAll={handleRestoreAll}
          />
        )}

        {activeTab === 'database' && (
          <DeviceDatabaseTab />
        )}
      </div>

      {/* Hardware Execution Console */}
      <TerminalConsole
        logs={logs}
        isExecuting={isExecuting}
        executingTask={executingTask}
        onClear={handleClearLogs}
      />

      {/* Bottom Status Bar (Exact 1:1 Match) */}
      <footer className="window-statusbar">
        <div className="statusbar-section">
          <span id="sbSerial">SN: {device?.serial || 'Chưa kết nối'}</span>
          <span id="sbModel">Model: {device?.model || '--'}</span>
          <span id="sbMagic">OS: {device?.magic_version || '--'}</span>
        </div>
        <div className="statusbar-section">
          <span>ADB Server: 127.0.0.1:5037</span>
          <span>Cổng: 5050</span>
          <span id="sbStatus">Trạng thái: {device?.connected ? 'Sẵn sàng thực thi' : 'Đang chờ thiết bị'}</span>
        </div>
      </footer>

      {/* WebUSB Guide Modal */}
      <WebUsbGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        onConnect={handleConnectWebUsb}
      />

      {/* Web Live Screen Mirror Modal */}
      <WebMirrorModal
        isOpen={showWebMirrorModal}
        onClose={() => setShowWebMirrorModal(false)}
        device={device}
        adbService={adbService}
        onOpenScrcpyModal={() => {
          setShowWebMirrorModal(false);
          setShowScrcpyModal(true);
        }}
      />

      {/* Scrcpy Auto-Install & OS Guidance Modal */}
      <ScrcpyInstallModal
        isOpen={showScrcpyModal}
        onClose={() => setShowScrcpyModal(false)}
        onOpenWebMirror={() => {
          setShowScrcpyModal(false);
          setShowWebMirrorModal(true);
        }}
        onInstallSuccess={() => {
          addToast('success', 'Scrcpy Sẵn Sàng', 'Đã cài đặt Scrcpy thành công! Đang mở màn hình 120Hz...');
          handleLaunchScrcpy({ turnOffScreen: true, stayAwake: true });
        }}
        adbService={adbService}
      />

      {/* Custom Desktop Toast System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Global Drag & Drop APK Overlay */}
      {isDraggingApk && (
        <div className="apk-dropzone-overlay">
          <div className="apk-dropzone-box">
            <div className="apk-dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h3>Thả File .APK Vào Đây Để Cài Đặt</h3>
            <p>Hệ thống sẽ tự động truyền file và cài đặt lên điện thoại Honor qua lệnh ADB chuẩn</p>
          </div>
        </div>
      )}
    </div>
  );
}
