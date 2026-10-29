/**
 * HONOR-TOOLS v2.0 - Native Desktop Utility Controller
 * 100% Pure Hardware Management Architecture (No AI Gimmicks)
 */

// Application State
let currentDevice = null;
let currentPackages = null;
let activeDebloatTier = 'installed_only';
let currentViewMode = 'front'; // 'front' (mặt trước) or 'back' (mặt sau)
let logPoller = null;
let devicePoller = null;

// Custom Desktop Toast System
function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type || 'info'}`;
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-title">${title || 'Thông báo'}</div>
      <div class="toast-message">${message || ''}</div>
    </div>
    <button class="toast-close" type="button">&times;</button>
  `;
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4500);
}

// Core DOM Elements
const connLed = document.getElementById('connLed');
const connStatusText = document.getElementById('connStatusText');
const btnRefreshDevice = document.getElementById('btnRefreshDevice');
const terminalBody = document.getElementById('terminalBody');
const btnClearLog = document.getElementById('btnClearLog');

// Status Bar Elements
const sbSerial = document.getElementById('sbSerial');
const sbModel = document.getElementById('sbModel');
const sbMagic = document.getElementById('sbMagic');
const sbStatus = document.getElementById('sbStatus');

// Ribbon Navigation
document.querySelectorAll('.ribbon-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ribbon-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    
    tab.classList.add('active');
    const tabName = tab.getAttribute('data-tab');
    const targetPane = document.getElementById(`tab-${tabName}`);
    if (targetPane) targetPane.classList.add('active');
  });
});

// Logs Poller
function fetchLogs() {
  fetch('/api/logs')
    .then(r => r.json())
    .then(data => {
      if (!data.logs) return;
      terminalBody.innerHTML = '';
      data.logs.forEach(log => {
        const div = document.createElement('div');
        div.className = `console-line log-${log.level || 'info'}`;
        div.textContent = `[${log.time}] ${log.msg}`;
        terminalBody.appendChild(div);
      });
      terminalBody.scrollTop = terminalBody.scrollHeight;
    })
    .catch(() => {});
}

btnClearLog.addEventListener('click', () => {
  terminalBody.innerHTML = '<div class="console-line log-info">[+] Đã làm sạch console.</div>';
});

// Device Poller
function fetchDeviceInfo() {
  fetch('/api/device')
    .then(r => r.json())
    .then(dev => {
      currentDevice = dev;
      updateDeviceUI(dev);
    })
    .catch(() => {
      updateDeviceUI({ connected: false });
    });
}

function updateDeviceUI(dev) {
  if (!dev || !dev.connected) {
    connLed.className = 'conn-led';
    connStatusText.textContent = 'Chưa phát hiện thiết bị (Cần cắm cáp USB)';
    document.getElementById('txtDeviceStatusBadge').className = 'badge-tag tag-danger';
    document.getElementById('txtDeviceStatusBadge').textContent = 'Chưa Kết Nối';
    
    document.getElementById('labelDeviceName').textContent = 'Chưa kết nối điện thoại';
    document.getElementById('labelDeviceSku').textContent = 'Vui lòng cắm cáp USB và bật Gỡ lỗi ADB';
    document.getElementById('screenModelSub').textContent = 'OFFLINE';

    // Reset specs
    document.getElementById('specCommercialName').textContent = '--';
    document.getElementById('specModelCode').textContent = '--';
    document.getElementById('specSeries').textContent = '--';
    document.getElementById('specSerial').textContent = '--';
    document.getElementById('specSoc').textContent = '--';
    document.getElementById('specMagicVer').textContent = '--';
    document.getElementById('specResolution').textContent = '--';
    document.getElementById('specAndroidVer').textContent = '--';
    document.getElementById('specDensity').textContent = '--';
    document.getElementById('specSweetDpi').textContent = '--';
    document.getElementById('specBattery').textContent = '--';
    document.getElementById('specWaterproof').textContent = '--';
    document.getElementById('specDurability').textContent = '--';
    document.getElementById('txtHealthScoreBadge').textContent = '0/100';

    sbSerial.textContent = 'SN: --';
    sbModel.textContent = 'Model: --';
    sbMagic.textContent = 'OS: --';
    sbStatus.textContent = 'Trạng thái: Đang chờ thiết bị';
    return;
  }

  // Device Connected
  connLed.className = 'conn-led online';
  connStatusText.textContent = `Thiết bị kết nối: ${dev.serial}`;
  document.getElementById('txtDeviceStatusBadge').className = 'badge-tag tag-safe';
  document.getElementById('txtDeviceStatusBadge').textContent = 'ADB Trực Tuyến';

  // Update Real Product Render Image
  updateDeviceRender(dev);

  // Left Chassis Info
  document.getElementById('labelDeviceName').textContent = dev.commercial_name;
  document.getElementById('labelDeviceSku').textContent = `${dev.model} • ${dev.magic_version} (${dev.rom_region || 'Nội Địa Trung Quốc'})`;
  const screenSub = document.getElementById('screenModelSub');
  if (screenSub) screenSub.textContent = dev.model;

  // Specifications Grid
  document.getElementById('specCommercialName').textContent = dev.commercial_name;
  document.getElementById('specModelCode').textContent = dev.model;
  document.getElementById('specSeries').textContent = dev.series;
  document.getElementById('specSerial').textContent = dev.serial;
  document.getElementById('specSoc').textContent = dev.soc;

  // Exact Authentic MagicOS ROM Version
  const specMagic = document.getElementById('specMagicVer');
  if (specMagic) {
    specMagic.textContent = dev.magic_version;
    if (dev.rom_region) {
      specMagic.title = `Khu vực: ${dev.rom_region} • Mã bản dựng: ${dev.rom_build || ''}`;
    }
  }

  document.getElementById('specResolution').textContent = `${dev.screen_width} × ${dev.screen_height} (${dev.max_hz || 120}Hz)`;
  document.getElementById('specAndroidVer').textContent = `Android ${dev.android_version}`;
  document.getElementById('specDensity').textContent = `${dev.current_dpi} DPI`;
  document.getElementById('specSweetDpi').textContent = `${dev.sweet_spot_dpi} DPI (Chuẩn 385 dp)`;
  document.getElementById('specBattery').textContent = `${dev.battery_desc} (${dev.battery_level}% • ${dev.battery_temp}°C • ${dev.battery_status})`;
  document.getElementById('specWaterproof').textContent = dev.waterproof;
  document.getElementById('specDurability').textContent = dev.durability;

  // Refresh Rate (Hz) Dynamic Population
  const selectHz = document.getElementById('selectHz');
  const txtCurrentHzBadge = document.getElementById('txtCurrentHzBadge');
  const txtHzExplanation = document.getElementById('txtHzExplanation');
  if (selectHz && dev.supported_hz && dev.supported_hz.length > 0) {
    txtCurrentHzBadge.textContent = `Tối đa: ${dev.max_hz}Hz`;
    txtHzExplanation.textContent = `Phần cứng hỗ trợ: ${dev.supported_hz.join('Hz, ')}Hz.`;
    
    // Save current user selection if any
    const prevVal = selectHz.value;
    selectHz.innerHTML = '<option value="auto">Chế độ tự động Dynamic (Hệ thống quản lý)</option>';
    
    // Sort descending
    const sortedRates = [...dev.supported_hz].sort((a, b) => b - a);
    sortedRates.forEach(rate => {
      const opt = document.createElement('option');
      opt.value = String(rate);
      opt.textContent = `Khóa cứng ${rate}Hz ${rate === dev.max_hz ? '(Tối đa của máy)' : ''}`;
      selectHz.appendChild(opt);
    });

    if (prevVal && Array.from(selectHz.options).some(o => o.value === prevVal)) {
      selectHz.value = prevVal;
    } else {
      selectHz.value = String(dev.max_hz);
    }
  }

  // Private DNS Live Status & Custom Input Sync
  const txtCurrentDnsBadge = document.getElementById('txtCurrentDnsBadge');
  const inputCustomDns = document.getElementById('inputCustomDns');
  const selectDNS = document.getElementById('selectDNS');
  if (dev.current_dns_spec) {
    txtCurrentDnsBadge.textContent = dev.current_dns_spec;
    txtCurrentDnsBadge.className = 'badge-tag tag-safe';
    if (!inputCustomDns.dataset.userEdited) {
      inputCustomDns.value = dev.current_dns_spec;
    }
  } else if (dev.current_dns_mode === 'off') {
    txtCurrentDnsBadge.textContent = 'Đang tắt';
    txtCurrentDnsBadge.className = 'badge-tag tag-neutral';
  }

  // Health Score
  const scoreBadge = document.getElementById('txtHealthScoreBadge');
  scoreBadge.textContent = `${dev.health_score}/100 Điểm`;
  scoreBadge.className = `badge-tag ${dev.health_score >= 80 ? 'tag-safe' : (dev.health_score >= 50 ? 'tag-warn' : 'tag-danger')}`;

  // Status Bar
  sbSerial.textContent = `SN: ${dev.serial}`;
  sbModel.textContent = `Model: ${dev.model}`;
  sbMagic.textContent = `OS: ${dev.magic_version}`;
  sbStatus.textContent = 'Trạng thái: Sẵn sàng thực thi';
}

// Fetch Packages
function fetchPackages() {
  fetch('/api/scan')
    .then(r => r.json())
    .then(data => {
      currentPackages = data;
      renderVnAppsTable(data.vn_apps || []);
      renderDebloatTable(data.bloatware || {});
    })
    .catch(() => {});
}

// Render VN Apps Table
function renderVnAppsTable(apps) {
  const tbody = document.getElementById('tbodyVnApps');
  if (!tbody) return;

  const searchQuery = (document.getElementById('inputSearchVnApps').value || '').toLowerCase().trim();
  const catFilter = document.getElementById('selectVnCategory').value;

  const filtered = apps.filter(app => {
    const matchSearch = app.name.toLowerCase().includes(searchQuery) || app.package.toLowerCase().includes(searchQuery);
    let matchCat = true;
    if (catFilter === 'installed_only') matchCat = !!app.installed;
    else if (catFilter === 'banking') matchCat = app.category.includes('Ngân Hàng');
    else if (catFilter === 'wallets') matchCat = app.category.includes('Ví');
    else if (catFilter === 'messaging') matchCat = app.category.includes('Liên Lạc') || app.category.includes('Tin Nhắn');
    else if (catFilter === 'public_services') matchCat = app.category.includes('Định Danh');
    else if (catFilter === 'transportation') matchCat = app.category.includes('Giao Thông');
    return matchSearch && matchCat;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">Không tìm thấy ứng dụng phù hợp.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach(app => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="vn-app-chk" data-package="${app.package}" ${app.installed ? 'checked' : 'disabled'}>
      </td>
      <td style="font-weight: 600; color: #f8fafc;">${app.name}</td>
      <td style="font-family: var(--font-mono); color: var(--text-dim); font-size: 11px;">${app.package}</td>
      <td><span class="badge-tag tag-neutral">${app.category}</span></td>
      <td>
        <span class="badge-tag ${app.priority === 'critical' ? 'tag-danger' : 'tag-warn'}">
          ${app.priority === 'critical' ? 'Tối Quan Trọng' : 'Ưu Tiên Cao'}
        </span>
      </td>
      <td>
        <span class="badge-tag ${app.installed ? 'tag-safe' : 'tag-neutral'}">
          ${app.installed ? 'Đã Cài Đặt' : 'Chưa Cài'}
        </span>
      </td>
      <td>
        <span class="badge-tag ${app.whitelisted ? 'tag-safe' : 'tag-warn'}">
          ${app.whitelisted ? '✓ Đã Whitelist' : 'Chưa Cấp Quyền'}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// VN Apps Filters & Actions
document.getElementById('inputSearchVnApps').addEventListener('input', () => {
  if (currentPackages) renderVnAppsTable(currentPackages.vn_apps || []);
});

document.getElementById('selectVnCategory').addEventListener('change', () => {
  if (currentPackages) renderVnAppsTable(currentPackages.vn_apps || []);
});

document.getElementById('btnSelectAllVn').addEventListener('click', () => {
  const chks = document.querySelectorAll('.vn-app-chk:not(:disabled)');
  const allChecked = Array.from(chks).every(c => c.checked);
  chks.forEach(c => c.checked = !allChecked);
});

document.getElementById('chkHeaderVn').addEventListener('change', (e) => {
  const chks = document.querySelectorAll('.vn-app-chk:not(:disabled)');
  chks.forEach(c => c.checked = e.target.checked);
});

// Whitelist Action
document.getElementById('btnWhitelistSelected').addEventListener('click', () => {
  const selected = Array.from(document.querySelectorAll('.vn-app-chk:checked')).map(c => c.getAttribute('data-package'));
  if (selected.length === 0) {
    showToast('warning', 'Chưa chọn ứng dụng', 'Vui lòng chọn ít nhất một ứng dụng để cấp quyền.');
    return;
  }

  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'whitelist_all_vn', packages: selected })
  })
    .then(r => r.json())
    .then(res => {
      showToast('success', 'Doze Whitelist', `Đã cấp quyền Whitelist thành công cho ${res.count || 0} ứng dụng!`);
      fetchPackages();
      fetchDeviceInfo();
    });
});

// Render Debloat Table
function renderDebloatTable(bloatDict) {
  const tbody = document.getElementById('tbodyDebloat');
  if (!tbody) return;

  let packagesList = [];
  if (activeDebloatTier === 'installed_only') {
    Object.values(bloatDict).forEach(tier => {
      (tier.packages || []).forEach(p => {
        if (p.status === 'active' || p.status === 'disabled') {
          packagesList.push({ ...p, tierName: tier.name, tierLevel: tier.level });
        }
      });
    });
  } else if (activeDebloatTier === 'all') {
    Object.values(bloatDict).forEach(tier => {
      (tier.packages || []).forEach(p => {
        packagesList.push({ ...p, tierName: tier.name, tierLevel: tier.level });
      });
    });
  } else {
    const currentTier = bloatDict[activeDebloatTier];
    if (currentTier && currentTier.packages) {
      packagesList = currentTier.packages.map(p => ({ ...p, tierName: currentTier.name, tierLevel: currentTier.level }));
    }
  }

  if (packagesList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Không có package nào trong danh mục này (Đã dọn sạch hoặc chưa phát hiện).</td></tr>';
    return;
  }

  const searchQuery = (document.getElementById('inputSearchDebloat').value || '').toLowerCase().trim();
  const filtered = packagesList.filter(item => {
    return item.name.toLowerCase().includes(searchQuery) || item.package.toLowerCase().includes(searchQuery);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Không tìm thấy package phù hợp với tìm kiếm.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach(item => {
    const isInstalled = item.status === 'active' || item.status === 'disabled';
    const isUninstalled = item.status === 'uninstalled';
    const isProtected = item.tierLevel === 5 || activeDebloatTier === 'level_5_critical_system';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="debloat-app-chk" data-package="${item.package}" ${item.recommended && isInstalled && !isProtected ? 'checked' : ''} ${isUninstalled || isProtected ? 'disabled' : ''}>
      </td>
      <td style="font-weight: 600; color: ${isUninstalled ? 'var(--text-muted)' : '#f8fafc'};">
        ${item.name}
      </td>
      <td style="font-family: var(--font-mono); color: var(--text-dim); font-size: 11px;">${item.package}</td>
      <td style="font-size: 12px; color: var(--text-dim);">${item.desc}</td>
      <td>
        <span class="badge-tag ${isProtected ? 'tag-danger' : (item.recommended ? 'tag-safe' : 'tag-warn')}">
          ${isProtected ? 'Cấm Gỡ' : (item.recommended ? 'Khuyên Gỡ' : 'Tùy Chọn')}
        </span>
      </td>
      <td>
        <span class="badge-tag ${item.status === 'active' ? 'tag-warn' : (item.status === 'disabled' ? 'tag-neutral' : 'tag-safe')}">
          ${item.status === 'active' ? 'Đang Chạy' : (item.status === 'disabled' ? 'Đã Vô Hiệu' : '✓ Đã Gỡ Bỏ')}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Debloat Tier Selector & Search
document.getElementById('selectDebloatTier').addEventListener('change', (e) => {
  activeDebloatTier = e.target.value;
  if (currentPackages) renderDebloatTable(currentPackages.bloatware || {});
});

document.getElementById('inputSearchDebloat').addEventListener('input', () => {
  if (currentPackages) renderDebloatTable(currentPackages.bloatware || {});
});

document.getElementById('btnSelectAllDebloat').addEventListener('click', () => {
  const chks = document.querySelectorAll('.debloat-app-chk:not(:disabled)');
  const allChecked = Array.from(chks).every(c => c.checked);
  chks.forEach(c => c.checked = !allChecked);
});

document.getElementById('chkHeaderDebloat').addEventListener('change', (e) => {
  const chks = document.querySelectorAll('.debloat-app-chk:not(:disabled)');
  chks.forEach(c => c.checked = e.target.checked);
});

// Execute Debloat
document.getElementById('btnExecuteDebloat').addEventListener('click', () => {
  const selected = Array.from(document.querySelectorAll('.debloat-app-chk:checked')).map(c => c.getAttribute('data-package'));
  if (selected.length === 0) {
    showToast('warning', 'Chưa chọn ứng dụng', 'Vui lòng chọn ít nhất một ứng dụng để gỡ bỏ.');
    return;
  }

  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'debloat_packages', packages: selected })
  })
    .then(r => r.json())
    .then(res => {
      showToast('success', 'Gỡ Bloatware', `Đã gỡ bỏ an toàn thành công ${res.count || 0} package!`);
      fetchPackages();
      fetchDeviceInfo();
    });
});

// Restore Debloat
document.getElementById('btnRestoreDebloat').addEventListener('click', () => {
  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'restore_packages' })
  })
    .then(r => r.json())
    .then(res => {
      showToast('success', 'Khôi phục gốc', `Đã khôi phục thành công ${res.count || 0} ứng dụng từ file sao lưu!`);
      fetchPackages();
      fetchDeviceInfo();
    });
});

// DNS Preset Sync & Custom Input Handling
const selectDNS = document.getElementById('selectDNS');
const inputCustomDns = document.getElementById('inputCustomDns');

if (selectDNS && inputCustomDns) {
  selectDNS.addEventListener('change', () => {
    const val = selectDNS.value;
    if (val === 'cloudflare') inputCustomDns.value = 'one.one.one.one';
    else if (val === 'google') inputCustomDns.value = 'dns.google';
    else if (val === 'adguard') inputCustomDns.value = 'dns.adguard-dns.com';
    else if (val === 'nextdns') inputCustomDns.value = 'dns.nextdns.io';
    else if (val === 'quad9') inputCustomDns.value = 'dns.quad9.net';
    else if (val === 'off') inputCustomDns.value = '';
    else if (val === 'custom') {
      inputCustomDns.focus();
    }
    inputCustomDns.dataset.userEdited = 'true';
  });

  inputCustomDns.addEventListener('input', () => {
    inputCustomDns.dataset.userEdited = 'true';
    if (selectDNS.value !== 'custom') {
      selectDNS.value = 'custom';
    }
  });
}

// Network Settings Apply
document.getElementById('btnApplyNetwork').addEventListener('click', () => {
  const captive = document.getElementById('selectCaptive').value;
  const dns = document.getElementById('selectDNS').value;
  const customDns = document.getElementById('inputCustomDns').value.trim();
  const disableWifipro = document.getElementById('chkDisableWifiPro').checked;

  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'apply_wifi_dns',
      captive: captive,
      dns: dns,
      custom_dns: customDns,
      disable_wifipro: disableWifipro
    })
  })
    .then(r => r.json())
    .then(() => {
      showToast('success', 'Mạng & Private DNS', `Đã lưu và áp dụng cấu hình Mạng!\nPrivate DNS: ${customDns || 'Tắt'}`);
      fetchDeviceInfo();
    });
});

// Display Settings Apply
document.getElementById('btnApplyDisplay').addEventListener('click', () => {
  const hz = document.getElementById('selectHz').value;
  const anim = document.getElementById('selectAnim').value;
  const dpi = document.getElementById('selectDpiPreset').value;

  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'apply_display',
      hz: hz,
      anim: anim,
      dpi: dpi
    })
  })
    .then(r => r.json())
    .then(() => {
      showToast('success', 'Màn Hình & DPI', 'Đã áp dụng độ phân giải và tần số quét màn hình thành công!');
      fetchDeviceInfo();
    });
});

// Scrcpy Launcher
function launchScrcpyWindow() {
  const chkTurnOff = document.getElementById('chkScrcpyTurnOffScreen');
  const chkStay = document.getElementById('chkScrcpyStayAwake');
  const turnOffScreen = chkTurnOff ? chkTurnOff.checked : true;
  const stayAwake = chkStay ? chkStay.checked : true;

  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'launch_scrcpy',
      turn_off_screen: turnOffScreen,
      stay_awake: stayAwake
    })
  })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        showToast('success', 'Scrcpy 120Hz', 'Đã mở cửa sổ điều khiển màn hình Scrcpy 120Hz!');
      } else {
        const msg = res.message || '';
        if (msg.includes('Chưa tìm thấy Scrcpy') || msg.includes('winget') || msg.includes('apt install')) {
          fetch('/api/env')
            .then(r => r.json())
            .then(env => {
              const isWin = env.os === 'windows';
              const promptMsg = isWin
                ? `[Hệ điều hành: Windows]\nChưa phát hiện công cụ Scrcpy & ADB để chiếu màn hình 120Hz.\n\nBạn có muốn hệ thống TỰ ĐỘNG TẢI VÀ GIẢI NÉN Scrcpy chính hãng từ GitHub (Genymobile) ngay bây giờ không?`
                : `[Hệ điều hành: ${env.os_name}]\nChưa có Scrcpy trên máy.\nLệnh cài đặt: ${env.install_cmd}\n\nBạn có muốn hệ thống thử tự động cài đặt không?`;
              if (window.confirm(promptMsg)) {
                showToast('info', 'Đang cài đặt', 'Đang tự động tải và cài đặt Scrcpy... Vui lòng chờ trong giây lát.');
                fetch('/api/action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'install_scrcpy' })
                })
                  .then(r => r.json())
                  .then(installRes => {
                    if (installRes.success) {
                      showToast('success', 'Cài đặt thành công', 'Đã cài đặt Scrcpy! Đang kích hoạt chiếu màn hình 120Hz...');
                      launchScrcpyWindow();
                    } else {
                      showToast('error', 'Lỗi cài đặt', installRes.message);
                    }
                  });
              }
            });
        } else {
          showToast('error', 'Lỗi Scrcpy', `Lỗi khởi chạy Scrcpy: ${res.message}`);
        }
      }
    });
}

document.getElementById('btnLaunchScrcpy').addEventListener('click', launchScrcpyWindow);
document.getElementById('btnQuickScrcpy').addEventListener('click', launchScrcpyWindow);

// Google Assistant Switch
document.getElementById('btnSetGoogleAssistant').addEventListener('click', () => {
  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set_assistant_google' })
  })
    .then(r => r.json())
    .then(() => {
      showToast('success', 'Trợ Lý Ảo', 'Đã thiết lập Google Assistant làm trợ lý mặc định toàn máy!');
    });
});

// Native AOT Compile
document.getElementById('btnCompileApps').addEventListener('click', () => {
  showToast('info', 'Biên Dịch AOT', 'Đang tiến hành biên dịch Native ARM64 AOT cho các app chính... Quá trình chạy ngầm qua ADB.');
  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'compile_apps' })
  })
    .then(r => r.json())
    .then(() => {
      showToast('success', 'Biên Dịch Hoàn Tất', 'Đã hoàn tất tăng tốc biên dịch Native AOT!');
    });
});

// Reboot Actions
document.querySelectorAll('.btn-reboot-action').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-mode');
    if (!confirm(`Xác nhận khởi động lại thiết bị (Chế độ: ${mode})?`)) return;
    fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reboot_device', mode: mode })
    });
  });
});

document.getElementById('btnQuickReboot').addEventListener('click', () => {
  if (!confirm('Khởi động lại điện thoại ngay bây giờ?')) return;
  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reboot_device', mode: 'system' })
  });
});

// Master 1-Click Optimize
function triggerMasterOptimize() {
  if (!confirm('Bắt đầu quy trình Tối Ưu Hóa Toàn Diện cho Honor MagicOS?')) return;

  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'whitelist_all_vn' })
  })
    .then(() => fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'apply_wifi_dns', captive: 'google', dns: 'cloudflare', disable_wifipro: true })
    }))
    .then(() => fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'apply_display', hz: '120', anim: '1.0', dpi: 'auto_sweet' })
    }))
    .then(() => fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_assistant_google' })
    }))
    .then(() => {
      showToast('success', 'Tối Ưu Toàn Diện', 'Đã hoàn thành toàn bộ các bước tối ưu hóa hệ thống!');
      fetchDeviceInfo();
      fetchPackages();
    });
}

document.getElementById('btn1ClickMaster').addEventListener('click', triggerMasterOptimize);

// Rollback All
document.getElementById('btnRestoreAll').addEventListener('click', () => {
  if (!confirm('CẢNH BÁO: Thao tác này sẽ cài đặt lại toàn bộ ứng dụng rác TQ và khôi phục cài đặt xuất xưởng. Tiếp tục?')) return;
  fetch('/api/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'restore_packages' })
  })
    .then(r => r.json())
    .then(res => {
      showToast('success', 'Khôi Phục Gốc', `Đã hoàn tất khôi phục ${res.count || 0} package về xuất xưởng!`);
      fetchPackages();
      fetchDeviceInfo();
    });
});

// Refresh button
btnRefreshDevice.addEventListener('click', () => {
  fetchDeviceInfo();
  fetchPackages();
  fetchLogs();
});

// Device Render View Switcher Function
function updateDeviceRender(dev) {
  const imgEl = document.getElementById('imgDeviceRender');
  if (!imgEl) return;
  if (!dev || !dev.connected) {
    imgEl.src = 'images/devices/BSN-AN00-front.png';
    return;
  }
  const targetSrc = currentViewMode === 'front'
    ? (dev.render_front || 'images/devices/BSN-AN00-front.png')
    : (dev.render_back || 'images/devices/BSN-AN00-back.png');
  imgEl.src = targetSrc;
}

// Bind Front / Back View Buttons
const btnViewFront = document.getElementById('btnViewFront');
const btnViewBack = document.getElementById('btnViewBack');
if (btnViewFront) {
  btnViewFront.addEventListener('click', () => {
    currentViewMode = 'front';
    btnViewFront.classList.add('active');
    if (btnViewBack) btnViewBack.classList.remove('active');
    updateDeviceRender(currentDevice);
  });
}
if (btnViewBack) {
  btnViewBack.addEventListener('click', () => {
    currentViewMode = 'back';
    btnViewBack.classList.add('active');
    if (btnViewFront) btnViewFront.classList.remove('active');
    updateDeviceRender(currentDevice);
  });
}

// Initial Load & Intervals
fetchDeviceInfo();
fetchPackages();
fetchLogs();

devicePoller = setInterval(fetchDeviceInfo, 4000);
logPoller = setInterval(fetchLogs, 2500);
