import React, { useState, useEffect, useMemo, useRef } from 'react';
import vnAppsData from '../data/vietnamApps.json';
import { adbService } from '../services/adbService';

export default function AppManagerTab({
  device,
  scannedPackages,
  isScanning,
  onWhitelistAll,
  onRefreshScan,
}) {
  // Top-level View Mode: 'all_apps' | 'vn_fcm'
  const [viewMode, setViewMode] = useState('all_apps');

  // All Apps State
  const [appsData, setAppsData] = useState({ apps: [], counts: { total: 0, user: 0, system: 0, disabled: 0 } });
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [appFilter, setAppFilter] = useState('user'); // 'all' | 'user' | 'system' | 'disabled'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPkgs, setSelectedPkgs] = useState(new Set());
  const [actionLoadingPkg, setActionLoadingPkg] = useState(null);
  const apkInputRef = useRef(null);

  // VN FCM View State
  const [vnStatusFilter, setVnStatusFilter] = useState('installed');
  const [vnSelectedCat, setVnSelectedCat] = useState('all');
  const [vnSearch, setVnSearch] = useState('');
  const [vnSelectedPackages, setVnSelectedPackages] = useState(new Set());
  const [vnIsExtracting, setVnIsExtracting] = useState(false);

  const isOnline = device && device.connected;

  // Load all applications from device
  const loadAllApps = async () => {
    if (!isOnline) return;
    setIsLoadingApps(true);
    try {
      const res = await adbService.getAllApplications();
      if (res && res.apps) {
        setAppsData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingApps(false);
    }
  };

  useEffect(() => {
    if (isOnline && (!appsData.apps || appsData.apps.length === 0)) {
      loadAllApps();
    }
  }, [isOnline, device?.serial]);

  // Filtered Apps for All Apps table
  const filteredApps = useMemo(() => {
    let list = appsData.apps || [];
    if (appFilter === 'user') list = list.filter((a) => a.is_user);
    else if (appFilter === 'system') list = list.filter((a) => !a.is_user);
    else if (appFilter === 'disabled') list = list.filter((a) => a.disabled);

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (a) =>
          (a.name || '').toLowerCase().includes(q) ||
          (a.package || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [appsData, appFilter, searchQuery]);

  // Actions for All Apps
  const handleToggleSelectAll = () => {
    if (selectedPkgs.size === filteredApps.length && filteredApps.length > 0) {
      setSelectedPkgs(new Set());
    } else {
      setSelectedPkgs(new Set(filteredApps.map((a) => a.package)));
    }
  };

  const handleToggleSelect = (pkg) => {
    setSelectedPkgs((prev) => {
      const next = new Set(prev);
      if (next.has(pkg)) next.delete(pkg);
      else next.add(pkg);
      return next;
    });
  };

  const handleUninstall = async (pkg, isUser) => {
    if (!window.confirm(`Bạn có chắc chắn muốn gỡ cài đặt ứng dụng "${pkg}"?`)) return;
    setActionLoadingPkg(pkg);
    try {
      const res = await adbService.uninstallApp(pkg, isUser);
      if (res && res.success) {
        await loadAllApps();
        onRefreshScan?.();
      } else {
        alert(res?.error || 'Gỡ cài đặt thất bại');
      }
    } finally {
      setActionLoadingPkg(null);
    }
  };

  const handleFreeze = async (pkg) => {
    setActionLoadingPkg(pkg);
    try {
      const res = await adbService.freezeApp(pkg);
      if (res && res.success) {
        await loadAllApps();
      } else {
        alert(res?.error || 'Đóng băng thất bại');
      }
    } finally {
      setActionLoadingPkg(null);
    }
  };

  const handleUnfreeze = async (pkg) => {
    setActionLoadingPkg(pkg);
    try {
      const res = await adbService.unfreezeApp(pkg);
      if (res && res.success) {
        await loadAllApps();
      } else {
        alert(res?.error || 'Rã đông thất bại');
      }
    } finally {
      setActionLoadingPkg(null);
    }
  };

  const handleClearData = async (pkg) => {
    if (!window.confirm(`Xóa toàn bộ dữ liệu & cache của "${pkg}"? Ứng dụng sẽ trở về trạng thái vừa cài đặt.`)) return;
    setActionLoadingPkg(pkg);
    try {
      const res = await adbService.clearAppData(pkg);
      if (res && res.success) {
        alert(`Đã xóa sạch dữ liệu của ${pkg}!`);
      } else {
        alert(res?.error || 'Xóa dữ liệu thất bại');
      }
    } finally {
      setActionLoadingPkg(null);
    }
  };

  const handleLaunch = async (pkg) => {
    await adbService.launchApp(pkg);
  };

  const handleExtractSingle = async (pkg) => {
    setActionLoadingPkg(pkg);
    try {
      const res = await adbService.extractApk(pkg);
      if (res && res.success) {
        const a = document.createElement('a');
        a.href = res.url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(res?.error || 'Lỗi trích xuất APK');
      }
    } finally {
      setActionLoadingPkg(null);
    }
  };

  const handleBulkExtract = async () => {
    const list = Array.from(selectedPkgs);
    if (!list.length) return;
    for (const p of list) {
      await handleExtractSingle(p);
    }
  };

  const handleBulkUninstall = async () => {
    const list = Array.from(selectedPkgs);
    if (!list.length) return;
    if (!window.confirm(`Bạn có chắc muốn gỡ bỏ ${list.length} ứng dụng đã chọn?`)) return;
    setIsLoadingApps(true);
    try {
      for (const p of list) {
        const item = appsData.apps.find((a) => a.package === p);
        await adbService.uninstallApp(p, item?.is_user ?? true);
      }
      setSelectedPkgs(new Set());
      await loadAllApps();
      onRefreshScan?.();
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleBulkFreeze = async () => {
    const list = Array.from(selectedPkgs);
    if (!list.length) return;
    setIsLoadingApps(true);
    try {
      for (const p of list) {
        await adbService.freezeApp(p);
      }
      setSelectedPkgs(new Set());
      await loadAllApps();
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleBulkUnfreeze = async () => {
    const list = Array.from(selectedPkgs);
    if (!list.length) return;
    setIsLoadingApps(true);
    try {
      for (const p of list) {
        await adbService.unfreezeApp(p);
      }
      setSelectedPkgs(new Set());
      await loadAllApps();
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleInstallNewApk = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.apk')) {
      alert(`File "${file.name}" không phải định dạng .apk`);
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(',')[1];
        const res = await adbService.installUploadedApk(file.name, base64Data);
        if (res && res.success) {
          alert(`Đã cài đặt thành công ${file.name}!`);
          await loadAllApps();
          onRefreshScan?.();
        } else {
          alert(res?.error || 'Cài đặt thất bại');
        }
      } catch (err) {
        alert(err.message);
      } finally {
        if (apkInputRef.current) apkInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // VN FCM View Logic
  const allVnApps = useMemo(() => {
    if (scannedPackages?.vn_apps && scannedPackages.vn_apps.length > 0) {
      return scannedPackages.vn_apps;
    }
    const list = [];
    const categories = vnAppsData.categories || {};
    Object.entries(categories).forEach(([catKey, cat]) => {
      (cat.apps || []).forEach((app) => {
        list.push({
          ...app,
          category: cat.name,
          catKey,
          installed: false,
          whitelisted: false,
        });
      });
    });
    return list;
  }, [scannedPackages]);

  const vnCounts = useMemo(() => {
    let installed = 0;
    let whitelisted = 0;
    allVnApps.forEach((app) => {
      if (app.installed) {
        installed++;
        if (app.whitelisted) whitelisted++;
      }
    });
    return {
      total: allVnApps.length,
      installed,
      whitelisted,
      needWhitelist: installed - whitelisted,
    };
  }, [allVnApps]);

  const vnCategoryOptions = useMemo(() => {
    const map = new Map();
    allVnApps.forEach((app) => {
      if (!map.has(app.category)) {
        map.set(app.category, 0);
      }
      map.set(app.category, map.get(app.category) + 1);
    });
    return Array.from(map.entries());
  }, [allVnApps]);

  const filteredVnApps = useMemo(() => {
    const q = vnSearch.toLowerCase().trim();
    return allVnApps.filter((app) => {
      if (vnStatusFilter === 'installed' && !app.installed) return false;
      if (vnStatusFilter === 'need_whitelist' && (!app.installed || app.whitelisted)) return false;
      if (vnSelectedCat !== 'all' && app.category !== vnSelectedCat) return false;
      if (q) {
        const matchName = (app.name || '').toLowerCase().includes(q);
        const matchPkg = (app.package || '').toLowerCase().includes(q);
        if (!matchName && !matchPkg) return false;
      }
      return true;
    });
  }, [allVnApps, vnStatusFilter, vnSelectedCat, vnSearch]);

  const handleVnToggle = (pkg) => {
    setVnSelectedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pkg)) next.delete(pkg);
      else next.add(pkg);
      return next;
    });
  };

  const handleVnSelectAll = () => {
    const selectable = filteredVnApps.filter((a) => isOnline && a.installed);
    if (vnSelectedPackages.size === selectable.length && selectable.length > 0) {
      setVnSelectedPackages(new Set());
    } else {
      setVnSelectedPackages(new Set(selectable.map((a) => a.package)));
    }
  };

  const handleVnWhitelistSelected = () => {
    if (vnSelectedPackages.size === 0) return;
    onWhitelistAll?.(Array.from(vnSelectedPackages));
  };

  const handleVnExtractApk = async () => {
    const pkg = Array.from(vnSelectedPackages)[0];
    if (!pkg) return;
    setVnIsExtracting(true);
    try {
      const res = await adbService.extractApk(pkg);
      if (res && res.success) {
        const a = document.createElement('a');
        a.href = res.url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(res?.error || 'Lỗi trích xuất APK');
      }
    } finally {
      setVnIsExtracting(false);
    }
  };

  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top View Mode Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel-base)', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn-tool ${viewMode === 'all_apps' ? 'primary' : ''}`}
            onClick={() => setViewMode('all_apps')}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </span>
            <span>Quản Lý Toàn Bộ Ứng Dụng ({appsData.counts.total || 0})</span>
          </button>

          <button
            type="button"
            className={`btn-tool ${viewMode === 'vn_fcm' ? 'primary' : ''}`}
            onClick={() => setViewMode('vn_fcm')}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <span className="svg-icon" style={{ color: '#ef4444' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span>Tối Ưu Thông Báo & FCM VN ({vnCounts.installed})</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="file"
            accept=".apk"
            ref={apkInputRef}
            style={{ display: 'none' }}
            onChange={handleInstallNewApk}
          />
          <button
            type="button"
            className="btn-tool"
            onClick={() => apkInputRef.current?.click()}
            disabled={!isOnline}
            title="Cài đặt file APK trực tiếp từ máy tính"
          >
            <span className="svg-icon" style={{ color: '#10b981' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </span>
            <span>Cài Đặt APK Mới</span>
          </button>

          <button
            type="button"
            className="btn-tool"
            onClick={() => {
              if (viewMode === 'all_apps') loadAllApps();
              else onRefreshScan?.();
            }}
            disabled={!isOnline || isLoadingApps || isScanning}
            title="Làm mới danh sách ứng dụng từ máy"
          >
            <span className={`svg-icon ${isLoadingApps || isScanning ? 'spin-anim' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </span>
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: FULL ALL APPS MANAGER (Toolkit Standard) */}
      {viewMode === 'all_apps' && (
        <div className="specs-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
          {/* Action Toolbar & Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            {/* Category / Scope Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn-tool ${appFilter === 'user' ? 'primary' : ''}`}
                style={{ fontSize: '12px', padding: '5px 12px' }}
                onClick={() => { setAppFilter('user'); setSelectedPkgs(new Set()); }}
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <span>Người Dùng Cài ({appsData.counts.user})</span>
              </button>
              <button
                type="button"
                className={`btn-tool ${appFilter === 'all' ? 'primary' : ''}`}
                style={{ fontSize: '12px', padding: '5px 12px' }}
                onClick={() => { setAppFilter('all'); setSelectedPkgs(new Set()); }}
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  </svg>
                </span>
                <span>Tất Cả ({appsData.counts.total})</span>
              </button>
              <button
                type="button"
                className={`btn-tool ${appFilter === 'system' ? 'primary' : ''}`}
                style={{ fontSize: '12px', padding: '5px 12px' }}
                onClick={() => { setAppFilter('system'); setSelectedPkgs(new Set()); }}
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </span>
                <span>Hệ Thống ({appsData.counts.system})</span>
              </button>
              <button
                type="button"
                className={`btn-tool ${appFilter === 'disabled' ? 'primary' : ''}`}
                style={{ fontSize: '12px', padding: '5px 12px' }}
                onClick={() => { setAppFilter('disabled'); setSelectedPkgs(new Set()); }}
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                </span>
                <span>Đã Đóng Băng ({appsData.counts.disabled})</span>
              </button>
            </div>

            {/* Search Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '260px' }}>
              <input
                type="text"
                placeholder="Tìm tên ứng dụng, package..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  fontSize: '12.5px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-bright)',
                }}
              />
            </div>
          </div>

          {/* Bulk Action Controls Bar (shown when checkboxes selected) */}
          {selectedPkgs.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                Đã chọn {selectedPkgs.size} ứng dụng
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-tool"
                  onClick={handleBulkExtract}
                  title="Trích xuất APK các ứng dụng đã chọn tải về PC"
                >
                  <span className="svg-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </span>
                  <span>Xuất APK ({selectedPkgs.size})</span>
                </button>
                <button
                  type="button"
                  className="btn-tool"
                  onClick={handleBulkFreeze}
                  title="Đóng băng (vô hiệu hóa) các ứng dụng đã chọn"
                >
                  <span className="svg-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  </span>
                  <span>Đóng Băng</span>
                </button>
                <button
                  type="button"
                  className="btn-tool"
                  onClick={handleBulkUnfreeze}
                  title="Kích hoạt lại các ứng dụng đã chọn"
                >
                  <span className="svg-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </span>
                  <span>Kích Hoạt</span>
                </button>
                <button
                  type="button"
                  className="btn-tool danger"
                  onClick={handleBulkUninstall}
                  title="Gỡ cài đặt các ứng dụng đã chọn"
                >
                  <span className="svg-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </span>
                  <span>Gỡ Bỏ</span>
                </button>
              </div>
            </div>
          )}

          {/* Applications Data Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="inspection-table" style={{ width: '100%', fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedPkgs.size === filteredApps.length && filteredApps.length > 0}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th style={{ width: '42%' }}>Tên Ứng Dụng & Package</th>
                  <th style={{ width: '15%' }}>Phiên Bản</th>
                  <th style={{ width: '13%' }}>Phân Loại</th>
                  <th style={{ width: '13%' }}>Trạng Thái</th>
                  <th style={{ width: '17%', textAlign: 'right' }}>Thao Tác Nhanh</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingApps ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                      <span className="spin-anim" style={{ display: 'inline-block', marginRight: '8px' }}>⟳</span>
                      Đang đọc danh mục ứng dụng từ điện thoại qua ADB...
                    </td>
                  </tr>
                ) : filteredApps.length > 0 ? (
                  filteredApps.map((app) => (
                    <tr
                      key={app.package}
                      style={{
                        cursor: 'pointer',
                        background: selectedPkgs.has(app.package) ? 'rgba(56, 189, 248, 0.1)' : undefined,
                      }}
                      onClick={() => handleToggleSelect(app.package)}
                    >
                      <td
                        style={{ textAlign: 'center', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(app.package);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPkgs.has(app.package)}
                          readOnly
                          style={{ pointerEvents: 'none', cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: app.is_user ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                            color: app.is_user ? '#38bdf8' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px',
                            flexShrink: 0
                          }}>
                            {app.name ? app.name[0].toUpperCase() : 'A'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong style={{ color: 'var(--text-bright)', fontSize: '13px' }}>{app.name}</strong>
                            <code style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{app.package}</code>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>{app.version || '--'}</td>
                      <td>
                        <span className={`status-pill ${app.is_user ? 'pill-pass' : ''}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {app.type}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${app.disabled ? 'pill-warn' : 'pill-pass'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-tool"
                            style={{ padding: '4px 7px', fontSize: '11px' }}
                            onClick={() => handleLaunch(app.package)}
                            title="Khởi chạy ứng dụng trên màn hình điện thoại"
                          >
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="btn-tool"
                            style={{ padding: '4px 7px', fontSize: '11px' }}
                            onClick={() => handleExtractSingle(app.package)}
                            disabled={actionLoadingPkg === app.package}
                            title="Trích xuất file APK tải về máy tính"
                          >
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                          </button>
                          {app.disabled ? (
                            <button
                              type="button"
                              className="btn-tool"
                              style={{ padding: '4px 7px', fontSize: '11px' }}
                              onClick={() => handleUnfreeze(app.package)}
                              disabled={actionLoadingPkg === app.package}
                              title="Rã đông (kích hoạt lại) ứng dụng"
                            >
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                              </svg>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-tool"
                              style={{ padding: '4px 7px', fontSize: '11px' }}
                              onClick={() => handleFreeze(app.package)}
                              disabled={actionLoadingPkg === app.package}
                              title="Đóng băng (vô hiệu hóa) ứng dụng"
                            >
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-tool"
                            style={{ padding: '4px 7px', fontSize: '11px' }}
                            onClick={() => handleClearData(app.package)}
                            disabled={actionLoadingPkg === app.package}
                            title="Xóa dữ liệu & cache"
                          >
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="btn-tool danger"
                            style={{ padding: '4px 7px', fontSize: '11px' }}
                            onClick={() => handleUninstall(app.package, app.is_user)}
                            disabled={actionLoadingPkg === app.package}
                            title="Gỡ cài đặt ứng dụng"
                          >
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                      Không tìm thấy ứng dụng nào khớp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: VIETNAM APPS & FCM OPTIMIZATION PLAYBOOK */}
      {viewMode === 'vn_fcm' && (
        <div className="specs-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="svg-icon" style={{ color: '#ef4444' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </span>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-bright)' }}>
                Tối Ưu Hóa Thông Báo FCM Ứng Dụng Việt Nam (Zalo, Banking, VNeID...)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {vnCounts.installed > 0 && (
                <button
                  className="btn-tool primary"
                  onClick={() => {
                    const installedPkgs = allVnApps.filter((a) => a.installed).map((a) => a.package);
                    if (installedPkgs.length > 0) {
                      onWhitelistAll?.(installedPkgs);
                    }
                  }}
                  disabled={!isOnline}
                  title="Cấp Whitelist Doze & toàn quyền chạy nền không trễ cho ứng dụng VN"
                >
                  <span className="svg-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <span>Cấp Doze Cho {vnCounts.installed} Apps VN Trên Máy</span>
                </button>
              )}

              {vnSelectedPackages.size > 0 && (
                <button
                  className="btn-tool"
                  onClick={handleVnWhitelistSelected}
                  disabled={!isOnline}
                >
                  <span>Cấp Whitelist ({vnSelectedPackages.size}) Đã Chọn</span>
                </button>
              )}

              {vnSelectedPackages.size === 1 && (
                <button
                  className="btn-tool"
                  onClick={handleVnExtractApk}
                  disabled={!isOnline || vnIsExtracting}
                  title="Trích xuất file cài đặt APK từ điện thoại và tải về máy tính"
                >
                  <span>{vnIsExtracting ? 'Đang xuất...' : 'Trích Xuất APK Ra PC'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`btn-tool ${vnStatusFilter === 'installed' ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '3px 10px' }}
                onClick={() => { setVnStatusFilter('installed'); setVnSelectedPackages(new Set()); }}
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <span>Đang có trên máy ({vnCounts.installed})</span>
              </button>
              <button
                className={`btn-tool ${vnStatusFilter === 'need_whitelist' ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '3px 10px' }}
                onClick={() => { setVnStatusFilter('need_whitelist'); setVnSelectedPackages(new Set()); }}
              >
                <span className="svg-icon" style={{ color: '#f59e0b' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </span>
                <span>Chưa Whitelist ({vnCounts.needWhitelist})</span>
              </button>
              <button
                className={`btn-tool ${vnStatusFilter === 'all' ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '3px 10px' }}
                onClick={() => { setVnStatusFilter('all'); setVnSelectedPackages(new Set()); }}
              >
                <span>Tất cả DB ({vnCounts.total})</span>
              </button>
            </div>

            <div style={{ minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Tìm app VN..."
                value={vnSearch}
                onChange={(e) => setVnSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-bright)',
                }}
              />
            </div>
          </div>

          {/* VN Apps Table */}
          <table className="inspection-table" style={{ fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={vnSelectedPackages.size > 0 && vnSelectedPackages.size === filteredVnApps.filter((a) => a.installed).length}
                    onChange={handleVnSelectAll}
                  />
                </th>
                <th style={{ width: '38%' }}>Ứng Dụng</th>
                <th style={{ width: '22%' }}>Nhóm Phân Loại</th>
                <th style={{ width: '20%' }}>Cài Đặt</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Thông Báo FCM</th>
              </tr>
            </thead>
            <tbody>
              {filteredVnApps.length > 0 ? (
                filteredVnApps.map((app) => (
                  <tr
                    key={app.package}
                    style={{
                      cursor: app.installed ? 'pointer' : 'default',
                      background: vnSelectedPackages.has(app.package) ? 'rgba(56, 189, 248, 0.1)' : undefined,
                    }}
                    onClick={() => {
                      if (app.installed) handleVnToggle(app.package);
                    }}
                  >
                    <td
                      style={{ textAlign: 'center', cursor: app.installed ? 'pointer' : 'default' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (app.installed) handleVnToggle(app.package);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={vnSelectedPackages.has(app.package)}
                        disabled={!app.installed}
                        readOnly
                        style={{ pointerEvents: 'none', cursor: app.installed ? 'pointer' : 'not-allowed' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: 'var(--text-bright)' }}>{app.name}</strong>
                        <code style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>{app.package}</code>
                      </div>
                    </td>
                    <td>{app.category}</td>
                    <td>
                      <span className={`status-pill ${app.installed ? 'pill-pass' : ''}`}>
                        {app.installed ? 'Đã cài đặt' : 'Chưa cài'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`status-pill ${app.whitelisted ? 'pill-pass' : 'pill-warn'}`}>
                        {app.whitelisted ? 'Đã cấp Doze FCM' : 'Chưa cấp'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                    Không có ứng dụng nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
