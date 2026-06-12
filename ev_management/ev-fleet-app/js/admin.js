// ===== FleetPulse Admin Dashboard =====
// Requires: Chart.js 4.x, data.js (for MANAGERS/session helpers), data.json

// ---- Chart registry ----
const _charts = {};
function makeChart(id, config) {
  if (_charts[id]) { _charts[id].destroy(); }
  const ctx = document.getElementById(id);
  if (!ctx) return;
  _charts[id] = new Chart(ctx, config);
  return _charts[id];
}

// ---- Pastel Palette ----
const PALETTE = [
  '#4ade80','#38bdf8','#a78bfa','#fb923c','#2dd4bf',
  '#fbbf24','#fb7185','#86efac','#7dd3fc','#c4b5fd',
  '#fdba74','#fda4af','#6ee7b7','#bae6fd','#ddd6fe',
  '#fde68a','#a5f3fc','#fbcfe8','#bbf7d0','#e0e7ff'
];

const MONTHS_ORDER = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];

// ---- State ----
let FLEET_DATA  = [];   // all 5000 records
let MANAGER_DATA = [];  // only this manager's 20 vehicles (set on init)
let filteredData = [];  // MANAGER_DATA filtered by UI filters
let CURRENT_MGR_ID = '';

// ---- Manager → vehicle range (20 vehicles each, sequential) ----
function getManagerVehicleIds(mgrId) {
  // MGR001 → VH00001–VH00020, MGR002 → VH00021–VH00040, etc.
  const idx  = parseInt(mgrId.replace('MGR','')) - 1;  // 0-based
  const start = idx * 20 + 1;
  const end   = start + 19;
  const ids = [];
  for (let i = start; i <= end; i++) {
    ids.push('VH' + String(i).padStart(5,'0'));
  }
  return ids;
}

// ---- Helpers ----
const fmtN  = (n,d=1) => (isNaN(n)||n==null) ? '—' : Number(n).toFixed(d);
const fmtRs = n => '₹' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const fmtH  = mins => (mins/60).toFixed(1)+'h';
const sum   = (arr,k) => arr.reduce((s,r)=>s+(+r[k]||0),0);
const avg   = (arr,k) => arr.length ? sum(arr,k)/arr.length : 0;
const badge = (text,cls) => `<span class="badge ${cls}">${text}</span>`;

function monthIdx(m) { return MONTHS_ORDER.indexOf(m); }
function monthsUpTo(m) {
  if (!m) return [...MONTHS_ORDER];
  return MONTHS_ORDER.slice(0, monthIdx(m)+1);
}
function prev3Months(m) {
  if (!m) return MONTHS_ORDER.slice(0,3);
  const i = monthIdx(m);
  return MONTHS_ORDER.slice(Math.max(0,i-2), i+1);
}

function scoreRating(s) {
  if (s >= 85) return badge('Excellent','badge-active');
  if (s >= 70) return badge('Good','badge-blue');
  if (s >= 55) return badge('Average','badge-warn');
  return badge('Risky','badge-inactive');
}
function riskLevel(n) {
  if (n >= 10) return badge('High Risk','badge-inactive');
  if (n >= 5)  return badge('Medium','badge-warn');
  return badge('Low','badge-active');
}
function effBadge(e) {
  const v = parseFloat(e);
  if (v >= 95) return badge('Optimal','badge-active');
  if (v >= 80) return badge('Good','badge-blue');
  if (v >= 60) return badge('Fair','badge-warn');
  return badge('Inefficient','badge-inactive');
}
function statusBadge(s) {
  const map = { Active:'badge-active', Charging:'badge-blue', Idle:'badge-warn', 'Under Maintenance':'badge-inactive' };
  return badge(s, map[s]||'badge-warn');
}
function uniqueVals(key) {
  return [...new Set(MANAGER_DATA.map(r=>r[key]).filter(Boolean))].sort();
}
function infoRow(lbl,val) {
  return `<div style="display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--card-border)">
    <span style="color:var(--muted);font-size:.83rem">${lbl}</span>
    <span style="font-weight:600;font-size:.85rem">${val}</span></div>`;
}
function statCard(icon,cls,val,lbl) {
  const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:currentColor;opacity:.8"></span>`;
  return `<div class="stat-card fade-in-up">
    <div class="stat-icon ${cls}">${dot}</div>
    <div class="stat-info"><div class="val">${val}</div><div class="lbl">${lbl}</div></div></div>`;
}
function groupBy(arr, key) {
  return arr.reduce((acc,r)=>{ (acc[r[key]]=acc[r[key]]||[]).push(r); return acc; },{});
}

// ---- Clock ----
function startClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => el.textContent = new Date().toLocaleString('en-IN',{
    hour:'2-digit',minute:'2-digit',second:'2-digit',day:'2-digit',month:'short'
  });
  tick(); setInterval(tick,1000);
}

// ---- Auth / logout ----
function logout() { sessionStorage.clear(); window.location.href='../index.html'; }

// ---- Tab switch ----
const TAB_TITLES = {
  overview:'Dashboard Overview', vehicles:'Fleet Vehicles', drivers:'All Drivers',
  revenue:'Revenue Analysis', charging:'Charging Analysis', maintenance:'Maintenance Analysis',
  overspeed:'Overspeed Violations', behaviour:'Driver Behaviour', route:'Route Optimization',
  weather:'Weather & Traffic', reports:'Generate Reports'
};
function switchTab(name, el) {
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pane = document.getElementById('tab-'+name);
  if (pane) pane.classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('pageTitle').textContent = TAB_TITLES[name]||name;
  renderCurrentTab(name);
}

// ---- Filters ----
const filters = { month:'', vehicle:'', driver:'', type:'', city:'', traffic:'' };

function applyFilters() {
  filters.month   = document.getElementById('gf-month').value;
  filters.vehicle = document.getElementById('gf-vehicle').value;
  filters.driver  = document.getElementById('gf-driver').value;
  filters.type    = document.getElementById('gf-type').value;
  filters.city    = document.getElementById('gf-city').value;
  filters.traffic = document.getElementById('gf-traffic').value;
  computeFiltered();
  const active = document.querySelector('.tab-pane.active');
  if (active) renderCurrentTab(active.id.replace('tab-',''));
}
function resetFilters() {
  ['gf-month','gf-vehicle','gf-driver','gf-type','gf-city','gf-traffic']
    .forEach(id => document.getElementById(id).value='');
  Object.keys(filters).forEach(k=>filters[k]='');
  computeFiltered();
  const active = document.querySelector('.tab-pane.active');
  if (active) renderCurrentTab(active.id.replace('tab-',''));
}
function computeFiltered() {
  const allowed = filters.month ? monthsUpTo(filters.month) : MONTHS_ORDER;
  filteredData = MANAGER_DATA.filter(r => {
    if (!allowed.includes(r.month)) return false;
    if (filters.vehicle && r.vehicle_id    !== filters.vehicle) return false;
    if (filters.driver  && r.driver_id     !== filters.driver)  return false;
    if (filters.type    && r.car_type      !== filters.type)    return false;
    if (filters.city    && r.start_location !== filters.city && r.destination !== filters.city) return false;
    if (filters.traffic && r.traffic_level !== filters.traffic) return false;
    return true;
  });
}
function renderCurrentTab(name) {
  if      (name==='overview')    renderOverview();
  else if (name==='vehicles')    renderVehicles();
  else if (name==='drivers')     renderDrivers();
  else if (name==='revenue')     renderRevenue();
  else if (name==='charging')    renderCharging();
  else if (name==='maintenance') renderMaintenance();
  else if (name==='overspeed')   renderOverspeed();
  else if (name==='behaviour')   renderBehaviour();
  else if (name==='route')       renderRoute();
  else if (name==='weather')     renderWeather();
}

// ===========================================================
//  INIT
// ===========================================================
window.addEventListener('DOMContentLoaded', async () => {
  const s = getSession();
  if (!s.role || s.role !== 'admin') { window.location.href='../index.html'; return; }

  CURRENT_MGR_ID = s.id;   // e.g. "MGR001"
  document.getElementById('adminName').textContent   = s.name || s.id;
  document.getElementById('adminAvatar').textContent = (s.name||s.id||'A')[0].toUpperCase();
  // Show manager context in sidebar footer
  const roleEl = document.querySelector('.sidebar-footer .role');
  if (roleEl) roleEl.textContent = `${s.id} · 20 Vehicles`;
  startClock();

  try {
    const res  = await fetch('../data.json');
    FLEET_DATA = await res.json();
  } catch(e) {
    console.error('Failed to load data.json', e);
    FLEET_DATA = [];
  }

  // ── Scope to this manager's 20 vehicles ONLY ──
  const mgrVehicleIds = new Set(getManagerVehicleIds(CURRENT_MGR_ID));
  MANAGER_DATA = FLEET_DATA.filter(r => mgrVehicleIds.has(r.vehicle_id));
  console.log(`[FleetPulse] Manager ${CURRENT_MGR_ID}: ${mgrVehicleIds.size} vehicles, ${MANAGER_DATA.length} trip records`);

  populateFilters();
  computeFiltered();
  renderOverview();
});

function populateFilters() {
  const fills = {
    'gf-vehicle': uniqueVals('vehicle_id'),
    'gf-driver':  uniqueVals('driver_id'),
    'gf-type':    uniqueVals('car_type'),
    'gf-city':    [...new Set([...MANAGER_DATA.map(r=>r.start_location),...MANAGER_DATA.map(r=>r.destination)].filter(Boolean))].sort(),
    'gf-traffic': uniqueVals('traffic_level'),
  };
  Object.entries(fills).forEach(([id,vals])=>{
    const sel = document.getElementById(id);
    // Clear existing options beyond the default
    while (sel.options.length > 1) sel.remove(1);
    vals.forEach(v => { const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); });
  });
}

// ===========================================================
//  OVERVIEW
// ===========================================================
function renderOverview() {
  const d = filteredData;

  // ── KPI Cards ──
  const totalRevenue   = sum(d,'total_trip_cost');
  const totalCharging  = sum(d,'charging_cost_rs');
  const totalMaint     = sum(d,'maintenance_cost_rs');
  const totalOverspeed = sum(d,'overspeed_count');
  const myVehicles     = [...new Set(d.map(r=>r.vehicle_id))].length;
  const avgScore       = avg(d,'driver_score');
  const avgEnergy      = avg(d,'energy_consumed_kwh');
  const totalTrips     = d.length;

  document.getElementById('kpiCards').innerHTML =
    statCard('','green',  fmtRs(totalRevenue),   'Total Revenue')+
    statCard('','teal',   fmtRs(totalCharging),  'Charging Cost')+
    statCard('','orange', fmtRs(totalMaint),     'Maintenance Cost')+
    statCard('','blue',   fmtH(sum(d,'charging_duration_min')), 'Charging Hours')+
    statCard('','red',    totalOverspeed,         'Overspeed Violations')+
    statCard('','purple', myVehicles,             'Active Vehicles')+
    statCard('','green',  fmtN(avgScore),         'Avg Driver Score')+
    statCard('','teal',   fmtN(avgEnergy)+' kWh','Avg Energy/Trip');

  // ── Fleet Status Counters (scoped to manager's vehicles) ──
  const latestStatus = {};
  d.forEach(r => { latestStatus[r.vehicle_id] = r.vehicle_status; });
  const statusCount = { Working:0, Garage:0, Charging:0, Idle:0 };
  Object.values(latestStatus).forEach(s => {
    if (s === 'Active') statusCount.Working++;
    else if (s === 'Under Maintenance' || s === 'Out of Service') statusCount.Garage++;
    else if (s === 'Charging') statusCount.Charging++;
    else if (s === 'Idle') statusCount.Idle++;
  });
  const fcDefs = [
    { cls:'fc-working',  label:'Working',  sub:'Vehicles on road',       num: statusCount.Working  },
    { cls:'fc-garage',   label:'Garage',   sub:'Under maintenance / off', num: statusCount.Garage   },
    { cls:'fc-charging', label:'Charging', sub:'At charging station',     num: statusCount.Charging },
    { cls:'fc-idle',     label:'Idle',     sub:'Parked / standing by',    num: statusCount.Idle     },
  ];
  document.getElementById('fleetCounters').innerHTML = fcDefs.map(f => `
    <div class="fleet-counter-card ${f.cls}">
      <div class="fleet-counter-inner">
        <div class="fleet-counter-front">
          <div class="fleet-counter-label"><span class="fleet-status-dot"></span>${f.label}</div>
          <div class="fleet-counter-num">${f.num}</div>
          <div class="fleet-counter-sub">${f.sub}</div>
        </div>
      </div>
    </div>`).join('');

  // ── Active Alerts ──
  const alerts = [];
  const lowBatt   = d.filter(r=>r.battery_health_percent<75);
  const highMaint = d.filter(r=>r.maintenance_cost_rs>7000);
  const highOver  = d.filter(r=>r.overspeed_count>12);
  const lowScore  = d.filter(r=>r.driver_score<45);
  if (lowBatt.length)   alerts.push({cls:'red',    title:`Low Battery Health (${lowBatt.length} trips)`,    sub:'Battery health below 75%'});
  if (highMaint.length) alerts.push({cls:'orange',  title:`High Maintenance Cost (${highMaint.length} trips)`, sub:'Maintenance cost above ₹7,000'});
  if (highOver.length)  alerts.push({cls:'orange',  title:`High Overspeed (${highOver.length} trips)`,      sub:'Overspeed count > 12 per trip'});
  if (lowScore.length)  alerts.push({cls:'yellow',  title:`Low Driver Score (${lowScore.length} trips)`,    sub:'Driver score below 45'});
  document.getElementById('alertPanel').innerHTML = alerts.length
    ? alerts.map(a=>`<div class="alert-item ${a.cls}">
        <div class="alert-text"><div class="title">${a.title}</div><div class="sub">${a.sub}</div></div></div>`).join('')
    : '<p style="color:var(--success);font-size:.85rem;padding:.4rem 0">No critical alerts for your fleet.</p>';

  // ── Vehicle Status Area Chart (manager's vehicles only) ──
  const isDark    = document.documentElement.getAttribute('data-theme') === 'dark';
  const lblColor  = isDark ? '#8899bb' : '#64748b';
  const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(99,130,167,.13)';
  const allMonths = filters.month ? monthsUpTo(filters.month) : MONTHS_ORDER;
  const statusColors = {
    'Active':            { line:'#4ade80', fill:'rgba(74,222,128,.2)' },
    'Charging':          { line:'#38bdf8', fill:'rgba(56,189,248,.2)' },
    'Idle':              { line:'#fbbf24', fill:'rgba(251,191,36,.2)' },
    'Under Maintenance': { line:'#fb923c', fill:'rgba(251,146,60,.2)' },
  };

  // Build datasets using manager-scoped data
  const areaDatasets = Object.entries(statusColors).map(([status, colors]) => {
    const counts = allMonths.map(m =>
      // count distinct vehicles with this status in this month
      [...new Set(d.filter(r => r.month===m && r.vehicle_status===status).map(r=>r.vehicle_id))].length
    );
    return {
      label: status,
      data: counts,
      borderColor: colors.line, backgroundColor: colors.fill,
      fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2,
    };
  });

  // Only render if there's actual data in at least one dataset
  const hasData = areaDatasets.some(ds => ds.data.some(v => v > 0));
  if (hasData) {
    makeChart('vehicleStatusChart', {
      type: 'line',
      data: { labels: allMonths, datasets: areaDatasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position:'bottom', labels:{ color:lblColor, font:{size:11}, boxWidth:12, padding:10 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw} vehicles` } }
        },
        scales: {
          x: { ticks:{ color:lblColor, font:{size:10} }, grid:{ color:gridColor } },
          y: { min:0, ticks:{ color:lblColor, stepSize:1, precision:0 }, grid:{ color:gridColor } }
        }
      }
    });
  } else {
    // No data — show a clear message inside the canvas container
    const ctx = document.getElementById('vehicleStatusChart');
    if (ctx) {
      const parent = ctx.parentElement;
      parent.innerHTML = `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--muted);font-size:.85rem;gap:.5rem">
        <div style="font-size:2rem;opacity:.3">—</div>
        <div>No trip data available for the selected filters.</div>
        <div style="font-size:.75rem">Try selecting All Months or a different filter.</div>
      </div>`;
    }
  }

  // ── Ranking Tables (manager's 20 vehicles) ──
  const rankBadge = i => i===0?'gold':i===1?'silver':i===2?'bronze':'';

  // Revenue ranking
  const byVehRev = groupBy(d,'vehicle_id');
  const vehRevList = Object.entries(byVehRev)
    .map(([vid,trips])=>({ vid, type:trips[0].car_type, rev:sum(trips,'total_trip_cost'), trips:trips.length }))
    .sort((a,b)=>b.rev-a.rev);
  document.getElementById('rankRevenueTbody').innerHTML = vehRevList.map((r,i)=>
    `<tr class="fade-in-up"><td><span class="rank-badge ${rankBadge(i)}">${i+1}</span></td>
     <td><strong>${r.vid}</strong></td><td>${r.type}</td>
     <td style="color:var(--mint-dark);font-weight:700">${fmtRs(r.rev)}</td>
     <td style="color:var(--muted)">${r.trips}</td></tr>`).join('');

  // Overspeed ranking
  const byVehOS = groupBy(d,'vehicle_id');
  const vehOSList = Object.entries(byVehOS)
    .map(([vid,trips])=>({ vid, driver:trips[0].driver_id, os:sum(trips,'overspeed_count'), avgSpd:avg(trips,'speed_kmph') }))
    .sort((a,b)=>b.os-a.os);
  document.getElementById('rankOverspeedTbody').innerHTML = vehOSList.map((r,i)=>
    `<tr class="fade-in-up"><td><span class="rank-badge ${rankBadge(i)}">${i+1}</span></td>
     <td>${r.vid}</td><td>${r.driver}</td>
     <td><span style="color:${r.os>=20?'var(--danger)':r.os>=10?'var(--warn)':'var(--success)'};font-weight:700">${r.os}</span></td>
     <td style="color:var(--muted)">${fmtN(r.avgSpd)} km/h</td></tr>`).join('');

  // Driver financial ranking
  const byDrvFin = groupBy(d,'driver_id');
  const drvFinList = Object.entries(byDrvFin)
    .map(([did,trips])=>({
      did, rev:sum(trips,'total_trip_cost'),
      maint:sum(trips,'maintenance_cost_rs'),
      charging:sum(trips,'charging_cost_rs'),
      count:trips.length
    }))
    .sort((a,b)=>b.rev-a.rev);
  document.getElementById('rankDriverTbody').innerHTML = drvFinList.map((r,i)=>
    `<tr class="fade-in-up"><td><span class="rank-badge ${rankBadge(i)}">${i+1}</span></td>
     <td><strong>${r.did}</strong></td>
     <td style="color:var(--mint-dark);font-weight:700">${fmtRs(r.rev)}</td>
     <td style="color:var(--peach)">${fmtRs(r.maint+r.charging)}</td>
     <td style="color:var(--sky)">${fmtRs(r.rev-(r.maint+r.charging))}</td>
     <td style="color:var(--muted)">${r.count}</td></tr>`).join('');

  // ── Recent Trips ──
  const recent = [...d].reverse().slice(0,30);
  document.getElementById('tripCount').textContent = d.length + ' trips';
  document.getElementById('tripsTbody').innerHTML = recent.map(r =>
    `<tr><td>${r.driver_id}</td><td>${r.vehicle_id}</td>
     <td>${r.start_location} → ${r.destination}</td>
     <td>${fmtN(r.distance_travelled_km)}</td><td>${r.trip_duration_min}</td>
     <td>${fmtN(r.battery_health_percent)}</td><td>${fmtN(r.energy_consumed_kwh)}</td>
     <td>${fmtRs(r.total_trip_cost)}</td><td>${r.weather_condition}</td><td>${r.month}</td></tr>`
  ).join('');
}

function renderVehicles() {
  const byVeh = groupBy(filteredData,'vehicle_id');
  const rows = Object.entries(byVeh).map(([vid,trips])=>{
    const last = trips[trips.length-1];
    return { vid, last, avgScr:avg(trips,'driver_score'),
      alerts:[...new Set(trips.map(t=>t.maintenance_alert).filter(a=>a&&a!=='None'))] };
  }).sort((a,b)=>a.vid.localeCompare(b.vid));
  // Summary cards
  const totalVeh = rows.length;
  const avgBatt  = avg(filteredData,'battery_health_percent');
  const avgTire  = avg(filteredData,'tire_health_percent');
  document.getElementById('vehiclesKPIs').innerHTML =
    statCard('','purple', totalVeh,           'Total Vehicles')+
    statCard('','green',  fmtN(avgBatt)+'%',  'Avg Battery Health')+
    statCard('','blue',   fmtN(avgTire)+'%',  'Avg Tire Health')+
    statCard('','orange', [...new Set(filteredData.map(r=>r.car_type))].length, 'Vehicle Types');
  document.getElementById('vehiclesTbody').innerHTML = rows.map(r=>`
    <tr>
      <td><strong>${r.vid}</strong></td>
      <td>${r.last.vehicle_make} ${r.last.vehicle_model}</td>
      <td>${r.last.car_type}</td>
      <td>${healthBar(r.last.battery_health_percent)}</td>
      <td>${healthBar(r.last.tire_health_percent)}</td>
      <td>${statusBadge(r.last.vehicle_status)}</td>
      <td>${r.last.driver_id}</td>
      <td>${scoreRating(r.avgScr)} ${fmtN(r.avgScr)}</td>
      <td>${r.alerts.length?`<span style="color:var(--warn)">⚠ ${r.alerts[0]}</span>`:'<span style="color:var(--success)">OK</span>'}</td>
    </tr>`).join('');
}
function healthBar(pct) {
  const cls = pct>70?'fill-green':pct>40?'fill-orange':'fill-red';
  return `<div style="display:flex;align-items:center;gap:.5rem">
    <div class="progress-bar" style="width:60px;height:5px"><div class="progress-fill ${cls}" style="width:${Math.min(pct,100)}%"></div></div>
    <span style="font-size:.78rem">${fmtN(pct,1)}%</span></div>`;
}

// ===========================================================
//  DRIVERS
// ===========================================================
function renderDrivers() {
  const byDrv = groupBy(filteredData,'driver_id');
  const rows = Object.entries(byDrv).map(([did,trips])=>{
    const last = trips[trips.length-1];
    return { did, vid:last.vehicle_id, avgScore:avg(trips,'driver_score'),
      totalHB:sum(trips,'harsh_braking_count'), totalSA:sum(trips,'sudden_acceleration_count'),
      totalOS:sum(trips,'overspeed_count'), tripCount:trips.length,
      totalDist:sum(trips,'distance_travelled_km'), status:last.vehicle_status };
  }).sort((a,b)=>b.avgScore-a.avgScore);
  const avgScoreAll = avg(filteredData,'driver_score');
  document.getElementById('driversKPIs').innerHTML =
    statCard('','purple', rows.length,         'Total Drivers')+
    statCard('','green',  fmtN(avgScoreAll),    'Avg Safety Score')+
    statCard('','red',    sum(filteredData,'overspeed_count'), 'Total Violations')+
    statCard('','blue',   sum(filteredData,'harsh_braking_count'), 'Total Harsh Braking');
  document.getElementById('driversTbody').innerHTML = rows.map(r=>`
    <tr>
      <td><strong>${r.did}</strong></td><td>${r.vid}</td>
      <td>${scoreRating(r.avgScore)} ${fmtN(r.avgScore)}</td>
      <td>${r.totalHB}</td><td>${r.totalSA}</td><td>${r.totalOS}</td>
      <td>${r.tripCount}</td><td>${fmtN(r.totalDist,0)} km</td>
      <td>${statusBadge(r.status)}</td>
    </tr>`).join('');
}

// ===========================================================
//  REVENUE
// ===========================================================
function renderRevenue() {
  const selMonth = filters.month || 'December';
  const months   = monthsUpTo(selMonth);
  const d        = filteredData;
  const byVeh    = groupBy(d,'vehicle_id');
  const vehRevs  = Object.entries(byVeh).map(([vid,trips])=>({ vid, rev:sum(trips,'total_trip_cost') }));
  const hiVeh    = vehRevs.reduce((a,b)=>b.rev>a.rev?b:a,{rev:-Infinity,vid:'—'});
  const loVeh    = vehRevs.reduce((a,b)=>b.rev<a.rev?b:a,{rev:Infinity, vid:'—'});
  document.getElementById('revenueKPIs').innerHTML =
    statCard('','green',  fmtRs(sum(d,'total_trip_cost')), 'Total Revenue')+
    statCard('','blue',   fmtRs(avg(d,'total_trip_cost')), 'Avg Trip Revenue')+
    statCard('','teal',   hiVeh.vid,                        'Highest Revenue Vehicle')+
    statCard('','orange', loVeh.vid,                        'Lowest Revenue Vehicle');
  const top10 = [...vehRevs].sort((a,b)=>b.rev-a.rev).slice(0,10).map(v=>v.vid);
  const datasets = top10.map((vid,i)=>{
    const trips = byVeh[vid];
    return { label:vid, data:months.map(m=>sum(trips.filter(t=>t.month===m),'total_trip_cost')),
      borderColor:PALETTE[i%PALETTE.length], backgroundColor:'transparent', tension:0.35, pointRadius:3, borderWidth:2 };
  });
  makeChart('revenueLineChart',{ type:'line', data:{ labels:months, datasets }, options:chartOpts('₹') });
  const sorted = [...vehRevs].sort((a,b)=>b.rev-a.rev);
  document.getElementById('revenueTbody').innerHTML = sorted.map((vr,i)=>{
    const trips = byVeh[vr.vid]; const last = trips[trips.length-1];
    return `<tr><td>#${i+1}</td><td><strong>${vr.vid}</strong></td>
      <td>${last.vehicle_make} ${last.vehicle_model}</td><td>${last.car_type}</td>
      <td>${fmtRs(vr.rev)}</td><td>${fmtRs(avg(trips,'total_trip_cost'))}</td>
      <td>${trips.length}</td></tr>`;
  }).join('');
}

// ===========================================================
//  CHARGING
// ===========================================================
function renderCharging() {
  const selMonth = filters.month || MONTHS_ORDER[2];
  const p3 = prev3Months(selMonth);
  const d  = filteredData.filter(r=>p3.includes(r.month));
  const sessions = d.filter(r=>r.charging_duration_min>0).length;
  const totalHrs = sum(d,'charging_duration_min')/60;
  document.getElementById('chargingKPIs').innerHTML =
    statCard('','green',  fmtRs(sum(d,'charging_cost_rs')), 'Total Charging Cost')+
    statCard('','blue',   fmtRs(avg(d,'charging_cost_rs')), 'Avg Charging Cost')+
    statCard('','teal',   sessions,                          'Charging Sessions')+
    statCard('','orange', fmtN(totalHrs,1)+' h',            'Charging Hours');
  makeChart('chargingLineChart',{ type:'line', data:{ labels:p3, datasets:[{
    label:'Charging Cost ₹', data:p3.map(m=>sum(d.filter(r=>r.month===m),'charging_cost_rs')),
    borderColor:'#4ade80', backgroundColor:'rgba(74,222,128,.12)', fill:true, tension:0.4, pointRadius:5, borderWidth:2
  }]}, options:chartOpts('₹') });
  const byVeh = groupBy(d,'vehicle_id');
  const vids  = Object.keys(byVeh).sort().slice(0,20);
  makeChart('chargingBarChart',{ type:'bar', data:{ labels:vids, datasets:[{
    label:'Charging Cost ₹', data:vids.map(v=>sum(byVeh[v],'charging_cost_rs')),
    backgroundColor:'rgba(56,189,248,.7)', borderColor:'#38bdf8', borderWidth:1, borderRadius:4
  }]}, options:{ ...chartOpts('₹'), plugins:{ legend:{ display:false } } } });
  const topVids = [...Object.keys(byVeh)].sort((a,b)=>sum(byVeh[b],'charging_duration_min')-sum(byVeh[a],'charging_duration_min')).slice(0,20);
  makeChart('chargingHoursChart',{ type:'bar', data:{ labels:topVids, datasets:p3.map((m,i)=>({
    label:m, data:topVids.map(v=>{const tr=(byVeh[v]||[]).filter(r=>r.month===m); return +(sum(tr,'charging_duration_min')/60).toFixed(2);} ),
    backgroundColor:PALETTE[i*3%PALETTE.length]+'bb', borderWidth:1
  }))}, options:chartOpts('h') });
  const avgH = totalHrs/Math.max(sessions,1);
  document.getElementById('chargingTbody').innerHTML = d.slice(0,80).map(r=>{
    const h=r.charging_duration_min/60; const hi=h>avgH*2;
    return `<tr ${hi?'style="background:rgba(251,146,60,.06)"':''}>
      <td>${r.vehicle_id}${hi?' ⚠':''}  </td><td>${r.driver_id}</td><td>${r.month}</td>
      <td>${fmtRs(r.charging_cost_rs)}</td><td>${r.charging_duration_min}</td>
      <td>${fmtN(r.charging_duration_min/60,2)}</td><td>${r.charging_duration_min>0?1:0}</td></tr>`;
  }).join('');
}

// ===========================================================
//  MAINTENANCE
// ===========================================================
function renderMaintenance() {
  const selMonth = filters.month || MONTHS_ORDER[2];
  const p3 = prev3Months(selMonth);
  const d  = filteredData.filter(r=>p3.includes(r.month));
  const withAlert = d.filter(r=>r.maintenance_alert&&r.maintenance_alert!=='None').length;
  document.getElementById('maintKPIs').innerHTML =
    statCard('','orange', fmtRs(sum(d,'maintenance_cost_rs')), 'Total Maint. Cost')+
    statCard('','blue',   fmtRs(avg(d,'maintenance_cost_rs')), 'Avg Maint. Cost')+
    statCard('','red',    withAlert,                            'Active Alerts')+
    statCard('','purple', [...new Set(d.map(r=>r.maintenance_alert).filter(a=>a&&a!=='None'))].length, 'Alert Types');
  const byVeh = groupBy(d,'vehicle_id');
  const vids  = Object.keys(byVeh).sort((a,b)=>sum(byVeh[b],'maintenance_cost_rs')-sum(byVeh[a],'maintenance_cost_rs')).slice(0,20);
  makeChart('maintBarChart',{ type:'bar', data:{ labels:vids, datasets:[{
    label:'Maintenance Cost ₹', data:vids.map(v=>sum(byVeh[v],'maintenance_cost_rs')),
    backgroundColor:'rgba(251,146,60,.7)', borderColor:'#fb923c', borderWidth:1, borderRadius:4
  }]}, options:{ ...chartOpts('₹'), plugins:{ legend:{ display:false } } } });
  const catCounts = {};
  d.forEach(r=>{ if(r.maintenance_alert&&r.maintenance_alert!=='None') catCounts[r.maintenance_alert]=(catCounts[r.maintenance_alert]||0)+1; });
  const o = chartOpts('');
  makeChart('maintPieChart',{ type:'pie', data:{ labels:Object.keys(catCounts),
    datasets:[{ data:Object.values(catCounts), backgroundColor:Object.keys(catCounts).map((_,i)=>PALETTE[i%PALETTE.length]), borderWidth:0 }]},
    options:{ responsive:true, plugins:{ legend:{ position:'right', labels:{ color:o.plugins.legend.labels.color, font:{size:11} } } } } });
  document.getElementById('maintTbody').innerHTML = d.slice(0,80).map(r=>`
    <tr><td>${r.vehicle_id}</td><td>${r.driver_id}</td><td>${r.month}</td>
    <td>${fmtRs(r.maintenance_cost_rs)}</td>
    <td>${r.maintenance_alert!=='None'?`<span style="color:var(--warn)">⚠ ${r.maintenance_alert}</span>`:'<span style="color:var(--success)">OK</span>'}</td>
    <td>${fmtN(r.battery_health_percent,1)}</td><td>${fmtN(r.tire_health_percent,1)}</td>
    <td>${statusBadge(r.vehicle_status)}</td></tr>`).join('');
}

// ===========================================================
//  OVERSPEED
// ===========================================================
function renderOverspeed() {
  const selMonth = filters.month || MONTHS_ORDER[2];
  const p3 = prev3Months(selMonth);
  const d  = filteredData.filter(r=>p3.includes(r.month));
  const byVeh   = groupBy(d,'vehicle_id');
  const vehViol = Object.entries(byVeh).map(([vid,trips])=>({ vid, total:sum(trips,'overspeed_count') }));
  const mostViol  = vehViol.reduce((a,b)=>b.total>a.total?b:a,{total:-Infinity,vid:'—'});
  const leastViol = vehViol.reduce((a,b)=>b.total<a.total?b:a,{total:Infinity, vid:'—'});
  document.getElementById('overspeedKPIs').innerHTML =
    statCard('','red',    sum(d,'overspeed_count'),           'Total Violations')+
    statCard('','orange', p3.length+' months',                'Period')+
    statCard('','purple', mostViol.vid+' ('+mostViol.total+')', 'Most Violating')+
    statCard('','green',  leastViol.vid+' ('+leastViol.total+')', 'Least Violating');
  makeChart('overspeedLineChart',{ type:'line', data:{ labels:p3, datasets:[{
    label:'Overspeed Violations', data:p3.map(m=>sum(d.filter(r=>r.month===m),'overspeed_count')),
    borderColor:'#f43f5e', backgroundColor:'rgba(244,63,94,.1)', fill:true, tension:0.4, pointRadius:5, borderWidth:2
  }]}, options:chartOpts('') });
  const vids = Object.keys(byVeh).sort();
  makeChart('overspeedBarChart',{ type:'bar', data:{ labels:vids, datasets:[{
    label:'Overspeed Count', data:vids.map(v=>sum(byVeh[v],'overspeed_count')),
    backgroundColor:vids.map(v=>{ const c=sum(byVeh[v],'overspeed_count'); return c>=10?'rgba(244,63,94,.8)':c>=5?'rgba(251,191,36,.8)':'rgba(74,222,128,.8)'; }),
    borderRadius:4, borderWidth:0
  }]}, options:{ ...chartOpts(''), plugins:{ legend:{ display:false } } } });
  document.getElementById('overspeedTbody').innerHTML = d.slice(0,80).map(r=>`
    <tr><td>${r.vehicle_id}</td><td>${r.driver_id}</td><td>${r.month}</td>
    <td>${r.overspeed_count}</td><td>${fmtN(r.speed_kmph)}</td>
    <td>${riskLevel(r.overspeed_count)}</td></tr>`).join('');
}

// ===========================================================
//  BEHAVIOUR
// ===========================================================
function renderBehaviour() {
  const d = filteredData;
  const byDrv = groupBy(d,'driver_id');
  const drvStats = Object.entries(byDrv).map(([did,trips])=>({
    did, vid:trips[trips.length-1].vehicle_id, avgScore:avg(trips,'driver_score'),
    hb:sum(trips,'harsh_braking_count'), sa:sum(trips,'sudden_acceleration_count'),
    os:sum(trips,'overspeed_count'), count:trips.length
  })).sort((a,b)=>b.avgScore-a.avgScore);
  document.getElementById('behaviourKPIs').innerHTML =
    statCard('','green',  fmtN(avg(d,'driver_score')),            'Avg Driver Score')+
    statCard('','red',    sum(d,'harsh_braking_count'),           'Total Harsh Braking')+
    statCard('','orange', sum(d,'sudden_acceleration_count'),     'Total Sudden Accel.')+
    statCard('','teal',   drvStats.slice(0,3).map(d=>d.did).join(', ')||'—', 'Top Drivers');
  const buckets=['0-20','20-40','40-60','60-80','80-100']; const counts=[0,0,0,0,0];
  d.forEach(r=>{ const s=r.driver_score; if(s<20)counts[0]++;else if(s<40)counts[1]++;else if(s<60)counts[2]++;else if(s<80)counts[3]++;else counts[4]++; });
  makeChart('scoreDistChart',{ type:'bar', data:{ labels:buckets, datasets:[{ label:'Trips',
    data:counts, backgroundColor:['#f43f5eaa','#fb923caa','#fbbf24aa','#38bdf8aa','#4ade80aa'], borderWidth:0 }]}, options:chartOpts('') });
  const top20=drvStats.slice(0,20);
  makeChart('behaviourBarChart',{ type:'bar', data:{ labels:top20.map(d=>d.did), datasets:[
    { label:'Harsh Braking',   data:top20.map(d=>d.hb), backgroundColor:'rgba(244,63,94,.75)',  borderWidth:0 },
    { label:'Sudden Accel.',   data:top20.map(d=>d.sa), backgroundColor:'rgba(251,146,60,.75)', borderWidth:0 },
    { label:'Overspeed',       data:top20.map(d=>d.os), backgroundColor:'rgba(251,191,36,.75)', borderWidth:0 },
  ]}, options:{ responsive:true, plugins:{ legend:{ labels:{ color:chartOpts('').plugins.legend.labels.color, font:{size:10}, boxWidth:10 } } },
    scales:{ x:{ ticks:{ color:chartOpts('').scales.x.ticks.color, font:{size:9} }, grid:{ color:chartOpts('').scales.x.grid.color }, stacked:false },
             y:{ ticks:{ color:chartOpts('').scales.y.ticks.color }, grid:{ color:chartOpts('').scales.x.grid.color } } } } });
  document.getElementById('behaviourTbody').innerHTML = drvStats.map((dr,i)=>`
    <tr><td>${i+1}</td><td><strong>${dr.did}</strong></td><td>${dr.vid}</td>
    <td>${scoreRating(dr.avgScore)} ${fmtN(dr.avgScore)}</td>
    <td>${dr.hb}</td><td>${dr.sa}</td><td>${dr.os}</td>
    <td>${dr.count}</td><td>${scoreRating(dr.avgScore)}</td></tr>`).join('');
}

// ===========================================================
//  ROUTE
// ===========================================================
function renderRoute() {
  const d = filteredData;
  const totalDist    = sum(d,'distance_travelled_km');
  const totalPlanned = sum(d,'route_distance_km');
  const avgEff = d.length ? d.reduce((s,r)=>s+(r.route_distance_km>0?(r.distance_travelled_km/r.route_distance_km)*100:0),0)/d.length : 0;
  const inefficient = d.filter(r=>r.route_distance_km>0&&(r.distance_travelled_km/r.route_distance_km)*100>120).length;
  document.getElementById('routeKPIs').innerHTML =
    statCard('','blue',   fmtN(totalDist,0)+' km',    'Total Actual Distance')+
    statCard('','teal',   fmtN(totalPlanned,0)+' km', 'Total Planned Distance')+
    statCard('','green',  fmtN(avgEff)+'%',           'Avg Route Efficiency')+
    statCard('','orange', inefficient,                 'Inefficient Routes');
  const sample=d.slice(0,30);
  makeChart('routeBarChart',{ type:'bar', data:{ labels:sample.map(r=>r.vehicle_id), datasets:[
    { label:'Planned km', data:sample.map(r=>r.route_distance_km),     backgroundColor:'rgba(56,189,248,.6)',  borderWidth:0 },
    { label:'Actual km',  data:sample.map(r=>r.distance_travelled_km), backgroundColor:'rgba(74,222,128,.6)',  borderWidth:0 },
    { label:'Energy kWh', data:sample.map(r=>r.energy_consumed_kwh),   backgroundColor:'rgba(251,191,36,.6)',  borderWidth:0 },
  ]}, options:chartOpts('') });
  document.getElementById('routeTbody').innerHTML = d.slice(0,80).map(r=>{
    const eff=r.route_distance_km>0?(r.distance_travelled_km/r.route_distance_km*100).toFixed(1):'—';
    const kwhpkm=r.distance_travelled_km>0?(r.energy_consumed_kwh/r.distance_travelled_km).toFixed(3):'—';
    const ineff=parseFloat(eff)>120;
    return `<tr ${ineff?'style="background:rgba(251,146,60,.06)"':''}>
      <td>${r.vehicle_id}${ineff?' ⚠':''}</td><td>${r.driver_id}</td>
      <td>${r.start_location}→${r.destination}</td><td>${r.month}</td>
      <td>${fmtN(r.route_distance_km)}</td><td>${fmtN(r.distance_travelled_km)}</td>
      <td>${effBadge(eff)} ${eff}%</td><td>${fmtN(r.energy_consumed_kwh)}</td>
      <td>${kwhpkm}</td><td>${statusBadge(r.vehicle_status)}</td></tr>`;
  }).join('');
}

// ===========================================================
//  WEATHER
// ===========================================================
function renderWeather() {
  const d = filteredData;
  const byWeather = groupBy(d,'weather_condition');
  const byTraffic = groupBy(d,'traffic_level');
  const weathers  = Object.keys(byWeather).sort();
  const traffics  = Object.keys(byTraffic).sort();
  const wColors = {'Clear':'#4ade80','Rainy':'#38bdf8','Cloudy':'#a78bfa','Foggy':'#94a3b8','Hot':'#fb923c','Stormy':'#f43f5e'};
  const tColors = {'Low':'#4ade80','Medium':'#fbbf24','High':'#f43f5e'};
  document.getElementById('weatherKPIs').innerHTML =
    statCard('','green',  weathers.length,                         'Weather Conditions')+
    statCard('','blue',   traffics.length,                         'Traffic Levels')+
    statCard('','teal',   fmtN(avg(d,'energy_consumed_kwh'))+' kWh','Avg Energy/Trip')+
    statCard('','orange', fmtN(avg(d,'speed_kmph'))+' km/h',      'Avg Speed');
  makeChart('weatherSpeedChart',{ type:'bar', data:{ labels:weathers, datasets:[{
    label:'Avg Speed km/h', data:weathers.map(w=>avg(byWeather[w],'speed_kmph')),
    backgroundColor:weathers.map(w=>wColors[w]||'#a78bfa'), borderWidth:0, borderRadius:4
  }]}, options:chartOpts('km/h') });
  makeChart('trafficEnergyChart',{ type:'bar', data:{ labels:traffics, datasets:[{
    label:'Avg Energy kWh', data:traffics.map(t=>avg(byTraffic[t],'energy_consumed_kwh')),
    backgroundColor:traffics.map(t=>tColors[t]||'#a78bfa'), borderWidth:0, borderRadius:4
  }]}, options:chartOpts('kWh') });
  makeChart('weatherDurationChart',{ type:'bar', data:{ labels:weathers, datasets:[{
    label:'Avg Duration min', data:weathers.map(w=>avg(byWeather[w],'trip_duration_min')),
    backgroundColor:weathers.map(w=>(wColors[w]||'#a78bfa')+'bb'), borderWidth:0, borderRadius:4
  }]}, options:chartOpts('min') });
  makeChart('weatherEnergyChart',{ type:'line', data:{ labels:weathers, datasets:[{
    label:'Avg Energy kWh', data:weathers.map(w=>avg(byWeather[w],'energy_consumed_kwh')),
    borderColor:'#2dd4bf', backgroundColor:'rgba(45,212,191,.12)', fill:true, tension:0.4, pointRadius:5, borderWidth:2
  }]}, options:chartOpts('kWh') });
  const combos={};
  d.forEach(r=>{ const k=`${r.weather_condition}__${r.traffic_level}`;
    if(!combos[k]) combos[k]={weather:r.weather_condition,traffic:r.traffic_level,trips:0,speed:0,energy:0,dur:0,cost:0};
    combos[k].trips++; combos[k].speed+=+r.speed_kmph||0; combos[k].energy+=+r.energy_consumed_kwh||0;
    combos[k].dur+=+r.trip_duration_min||0; combos[k].cost+=+r.total_trip_cost||0; });
  document.getElementById('weatherTbody').innerHTML = Object.values(combos).sort((a,b)=>b.trips-a.trips).map(c=>`
    <tr><td>${c.weather}</td><td>${c.traffic}</td><td>${c.trips}</td>
    <td>${fmtN(c.speed/c.trips)}</td><td>${fmtN(c.energy/c.trips)}</td>
    <td>${fmtN(c.dur/c.trips,0)}</td><td>${fmtRs(c.cost/c.trips)}</td></tr>`).join('');
}

// ===========================================================
//  REPORTS
// ===========================================================
function generateReport() {
  const type   = document.getElementById('reportType').value;
  const format = document.getElementById('reportFormat').value;
  const d      = filteredData;
  let headers=[], rows=[];
  if(type==='summary'){headers=['Vehicle','Driver','Month','Route','Distance km','Energy kWh','Trip Cost','Battery Health %','Score','Status'];rows=d.map(r=>[r.vehicle_id,r.driver_id,r.month,`${r.start_location}→${r.destination}`,fmtN(r.distance_travelled_km),fmtN(r.energy_consumed_kwh),fmtN(r.total_trip_cost),fmtN(r.battery_health_percent),fmtN(r.driver_score),r.vehicle_status]);}
  else if(type==='energy'){headers=['Vehicle','Driver','Month','Energy kWh','Daily Cost','Trip Cost','Charging Cost','Duration min'];rows=d.map(r=>[r.vehicle_id,r.driver_id,r.month,fmtN(r.energy_consumed_kwh),fmtN(r.daily_energy_cost),fmtN(r.total_trip_cost),fmtN(r.charging_cost_rs),r.charging_duration_min]);}
  else if(type==='behaviour'){headers=['Driver','Vehicle','Month','Score','Harsh Braking','Sudden Accel.','Overspeed','Speed km/h'];rows=d.map(r=>[r.driver_id,r.vehicle_id,r.month,fmtN(r.driver_score),r.harsh_braking_count,r.sudden_acceleration_count,r.overspeed_count,fmtN(r.speed_kmph)]);}
  else if(type==='maintenance'){headers=['Vehicle','Driver','Month','Maint. Cost','Alert','Tire Health %','Battery Health %','Status'];rows=d.map(r=>[r.vehicle_id,r.driver_id,r.month,fmtN(r.maintenance_cost_rs),r.maintenance_alert,fmtN(r.tire_health_percent),fmtN(r.battery_health_percent),r.vehicle_status]);}
  else if(type==='battery'){headers=['Vehicle','Driver','Month','Battery Health %','Tire Health %','Charging Status','Charging Cost'];rows=d.map(r=>[r.vehicle_id,r.driver_id,r.month,fmtN(r.battery_health_percent),fmtN(r.tire_health_percent),r.charging_duration_min>0?'Charged':'Not Charged',fmtN(r.charging_cost_rs)]);}
  else if(type==='revenue'){headers=['Vehicle','Driver','Month','Trip Cost','Route','Distance km','Energy kWh'];rows=d.map(r=>[r.vehicle_id,r.driver_id,r.month,fmtN(r.total_trip_cost),`${r.start_location}→${r.destination}`,fmtN(r.distance_travelled_km),fmtN(r.energy_consumed_kwh)]);}
  else if(type==='overspeed'){headers=['Vehicle','Driver','Month','Overspeed Count','Avg Speed km/h','Traffic','Weather'];rows=d.map(r=>[r.vehicle_id,r.driver_id,r.month,r.overspeed_count,fmtN(r.speed_kmph),r.traffic_level,r.weather_condition]);}
  if(format==='csv'){const csv=[headers.join(','),...rows.map(r=>r.join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`fleetpulse_${type}_report.csv`;a.click();return;}
  document.getElementById('reportOutput').innerHTML=`<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,200).map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p style="color:var(--muted);font-size:.78rem;margin-top:.5rem">Showing ${Math.min(rows.length,200)} of ${rows.length} records</p>`;
}

// ===========================================================
//  CHART OPTS (theme-aware)
// ===========================================================
function chartOpts(unit) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const tick   = isDark ? '#8899bb' : '#64748b';
  const grid   = isDark ? 'rgba(255,255,255,.07)' : 'rgba(99,130,167,.13)';
  const legend = isDark ? '#8899bb' : '#64748b';
  return {
    responsive: true,
    plugins:{ legend:{ labels:{ color:legend, font:{size:11}, boxWidth:12 } } },
    scales:{
      x:{ ticks:{ color:tick, font:{size:10} }, grid:{ color:grid } },
      y:{ ticks:{ color:tick, callback: v => unit ? v+unit : v }, grid:{ color:grid } }
    }
  };
}
