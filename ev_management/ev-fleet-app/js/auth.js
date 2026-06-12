// ===== AUTH MODAL LOGIC =====

// --- helpers ---
function showAlert(el, msg, type) {
  el.className = `alert ${type} show`;
  el.textContent = msg;
}
function hideAlert(el) { el.classList.remove('show'); }

function togglePassword(btn) {
  const input = btn.previousElementSibling;
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁️'; }
}

// ===== PASSWORD STRENGTH =====
function checkPasswordStrength(pwd) {
  let score = 0;
  const checks = {
    length:   pwd.length >= 8,
    upper:    /[A-Z]/.test(pwd),
    lower:    /[a-z]/.test(pwd),
    digit:    /\d/.test(pwd),
    special:  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    long:     pwd.length >= 12,
  };
  score = Object.values(checks).filter(Boolean).length;

  let level, color, label, tips = [];
  if (score <= 2)      { level = 1; color = '#ff5252'; label = 'Weak'; }
  else if (score <= 3) { level = 2; color = '#ff6d00'; label = 'Fair'; }
  else if (score <= 4) { level = 3; color = '#ffd740'; label = 'Good'; }
  else                 { level = 4; color = '#00e676'; label = 'Strong'; }

  if (!checks.length)   tips.push('At least 8 characters');
  if (!checks.upper)    tips.push('Add an uppercase letter');
  if (!checks.lower)    tips.push('Add a lowercase letter');
  if (!checks.digit)    tips.push('Add a number');
  if (!checks.special)  tips.push('Add a special character (!@#$%...)');

  return { score, level, color, label, tips, isStrong: score >= 4 };
}

function attachStrengthMeter(inputId, meterId) {
  const input = document.getElementById(inputId);
  const meter = document.getElementById(meterId);
  if (!input || !meter) return;

  input.addEventListener('input', () => {
    const val = input.value;
    if (!val) { meter.innerHTML = ''; return; }
    const r = checkPasswordStrength(val);
    const bars = [1,2,3,4].map(i =>
      `<div style="height:4px;flex:1;border-radius:3px;background:${i<=r.level ? r.color : 'rgba(255,255,255,.1)'};
        transition:background .3s"></div>`
    ).join('');
    const tipHtml = r.tips.length
      ? `<div style="font-size:.71rem;color:var(--muted);margin-top:.3rem">${r.tips[0]}</div>`
      : '';
    meter.innerHTML = `
      <div style="display:flex;gap:4px;margin-top:.4rem">${bars}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.2rem">
        <span style="font-size:.72rem;color:${r.color};font-weight:600">${r.label} password</span>
        ${tipHtml ? '' : '<span style="font-size:.7rem;color:var(--green)">✓ All criteria met</span>'}
      </div>
      ${tipHtml}`;
  });
}

function isPasswordStrong(inputId) {
  const val = document.getElementById(inputId)?.value || '';
  return checkPasswordStrength(val).isStrong;
}

// --- open/close ---
function openModal(id) {
  document.querySelectorAll('.modal-overlay').forEach(o => o.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// close on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ===== LOGIN MODAL =====
function switchLoginRole(role) {
  document.querySelectorAll('#loginModal .role-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`#loginModal .role-tab[data-role="${role}"]`).classList.add('active');
  document.getElementById('adminLoginForm').style.display = role === 'admin' ? 'block' : 'none';
  document.getElementById('driverLoginForm').style.display = role === 'driver' ? 'block' : 'none';
  hideAlert(document.getElementById('loginAlert'));
}

// Admin login submit
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const id  = this.adminId.value.trim().toUpperCase();
  const pwd = this.adminPassword.value;
  const alert = document.getElementById('loginAlert');
  const mgr = findAdmin(id, pwd);
  if (!mgr) { showAlert(alert, 'Invalid Admin ID or Password.', 'error'); return; }
  setSession('admin', mgr.id, mgr.name);
  closeModal('loginModal');
  window.location.href = 'pages/admin-dashboard.html';
});

// Driver login submit
document.getElementById('driverLoginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const id  = this.driverId.value.trim().toUpperCase();
  const pwd = this.driverPassword.value;
  const alert = document.getElementById('loginAlert');
  const driver = findDriver(id, pwd);
  if (!driver) { showAlert(alert, 'Invalid Driver ID or Password.', 'error'); return; }
  setSession('driver', driver.driverId, driver.name);
  closeModal('loginModal');
  window.location.href = 'pages/driver-dashboard.html';
});

// ===== ADMIN REGISTER MODAL =====
document.getElementById('adminRegisterForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const alert  = document.getElementById('adminRegAlert');
  const id     = this.regAdminId.value.trim().toUpperCase();
  const key    = this.regAdminKey.value.trim();
  const pwd    = this.regAdminPwd.value;
  const cpwd   = this.regAdminCPwd.value;

  // Password strength check
  if (!isPasswordStrong('regAdminPwdInput')) {
    showAlert(alert, '⚠️ Password is too weak. Use 8+ characters with uppercase, lowercase, numbers & special characters.', 'error');
    return;
  }
  if (pwd !== cpwd) { showAlert(alert, 'Passwords do not match.', 'error'); return; }

  const mgr = MANAGERS.find(m => m.id === id && m.key === key);
  if (!mgr) { showAlert(alert, 'Admin ID / Manager Key mismatch. Check your credentials.', 'error'); return; }

  const passwords = getAdminPasswords();
  if (passwords[id] && passwords[id] !== 'Admin@123') {
    showAlert(alert, 'This Admin account is already registered.', 'error'); return;
  }
  passwords[id] = pwd;
  localStorage.setItem('ev_admin_passwords', JSON.stringify(passwords));
  showAlert(alert, '✓ Registration successful! Redirecting to login...', 'success');
  setTimeout(() => { closeModal('adminRegModal'); openModal('loginModal'); hideAlert(alert); this.reset(); document.getElementById('adminPwdMeter').innerHTML=''; }, 2000);
});

// ===== DRIVER REGISTER MODAL =====
// Populate manager dropdown
window.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('driverManagerSel');
  MANAGERS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.id} — ${m.name} (${m.city})`;
    sel.appendChild(opt);
  });

  // Attach strength meters after DOM ready
  attachStrengthMeter('regAdminPwdInput',   'adminPwdMeter');
  attachStrengthMeter('regDriverPwdInput',  'driverPwdMeter');
});

document.getElementById('driverRegisterForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const alert   = document.getElementById('driverRegAlert');
  const name    = this.regDriverName.value.trim();
  const email   = this.regDriverEmail.value.trim();
  const phone   = this.regDriverPhone.value.trim();
  const mgrId   = this.driverManager.value;
  const mgrKey  = this.driverMgrKey.value.trim();
  const pwd     = this.regDriverPwd.value;
  const cpwd    = this.regDriverCPwd.value;

  // Password strength check
  if (!isPasswordStrong('regDriverPwdInput')) {
    showAlert(alert, '⚠️ Password is too weak. Use 8+ characters with uppercase, lowercase, numbers & special characters.', 'error');
    return;
  }
  if (pwd !== cpwd) { showAlert(alert, 'Passwords do not match.', 'error'); return; }

  const mgr = MANAGERS.find(m => m.id === mgrId && m.key === mgrKey);
  if (!mgr) { showAlert(alert, 'Manager ID / Key mismatch. Get the key from your fleet manager.', 'error'); return; }

  const drivers = getDrivers();
  if (drivers.find(d => d.email === email)) {
    showAlert(alert, 'Email already registered.', 'error'); return;
  }

  // generate new driver id
  const maxNum = drivers.reduce((acc, d) => {
    const n = parseInt(d.driverId.replace('DR', ''));
    return n > acc ? n : acc;
  }, 0);
  const newId = 'DR' + String(maxNum + 1).padStart(4, '0');
  const newUserId = 'USR' + String(maxNum + 1).padStart(4, '0');

  const newDriver = {
    driverId: newId, userId: newUserId,
    name, email, phone,
    managerId: mgrId, vehicleId: null, status: 'Active'
  };
  drivers.push(newDriver);
  saveDrivers(drivers);
  saveDriverPassword(newId, pwd);

  showAlert(alert, `✓ Registered! Your Driver ID is ${newId}. Redirecting to login...`, 'success');
  setTimeout(() => { closeModal('driverRegModal'); openModal('loginModal'); switchLoginRole('driver'); hideAlert(alert); this.reset(); document.getElementById('driverPwdMeter').innerHTML=''; }, 2500);
});
