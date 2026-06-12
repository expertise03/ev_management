// ===== FleetPulse Driver Dashboard =====

const DRIVER_DATA = {
  DR0001: { vehicleId:"VH00001", make:"Tata", model:"Tigor EV", reg:"MH53EV5552", type:"Sedan", battKwh:26, battPct:69.1, battHealth:98.8, battTemp:28.1, battVolt:398.5, cycles:1175, battAge:17, chargingStatus:"Fully Charged", chargeDur:41, chargeCost:59.88, energyKwh:10.61, chargerType:"AC Level 2", speed:39.6, dist:224.4, duration:290, range:116.8, startLoc:"Kolkata", dest:"Delhi", routeDist:482.9, eta:228, roadType:"Mixed", traffic:"Low", weather:"Clear", chargingStops:0, score:57.9, harshBraking:13, suddenAccel:9, overspeed:4, costPerKm:0.45, dailyCost:78.35, monthlyCost:2037.1, tripCost:100.98, tireHealth:68.4, lastService:102, maintCost:3916.98, maintAlert:"Brake Inspection", motorEff:96.8, motorTemp:77.5, managerId:"MGR001", managerCity:"Delhi", experience:3, income:74797 },
  DR0002: { vehicleId:"VH00002", make:"Tata", model:"Tiago EV", reg:"MH54EV5333", type:"Hatchback", battKwh:24, battPct:34.2, battHealth:90, battTemp:22.3, battVolt:373.8, cycles:764, battAge:24, chargingStatus:"Not Charging", chargeDur:0, chargeCost:0, energyKwh:7.89, chargerType:"AC Level 2", speed:71.9, dist:204.5, duration:89, range:53.4, startLoc:"Jaipur", dest:"Lucknow", routeDist:239.4, eta:48, roadType:"Highway", traffic:"Medium", weather:"Rainy", chargingStops:3, score:57.7, harshBraking:1, suddenAccel:17, overspeed:2, costPerKm:0.45, dailyCost:71.43, monthlyCost:1857.18, tripCost:92.03, tireHealth:75.5, lastService:211, maintCost:755.87, maintAlert:"Software Update", motorEff:89, motorTemp:64.7, managerId:"MGR001", managerCity:"Delhi", experience:13, income:35328 },
};
const DEMO_DATA = { vehicleId:"VH00099", make:"Tata", model:"Nexon EV", reg:"XX00EV0000", type:"SUV", battKwh:40.5, battPct:72.0, battHealth:95.0, battTemp:29.0, battVolt:405.0, cycles:300, battAge:12, chargingStatus:"Not Charging", chargeDur:0, chargeCost:0, energyKwh:12.0, chargerType:"AC Level 2", speed:55.0, dist:150.0, duration:120, range:180.0, startLoc:"Base", dest:"Destination", routeDist:160.0, eta:130, roadType:"Mixed", traffic:"Low", weather:"Clear", chargingStops:0, score:70.0, harshBraking:5, suddenAccel:5, overspeed:2, costPerKm:0.40, dailyCost:65.0, monthlyCost:1690.0, tripCost:96.0, tireHealth:85.0, lastService:60, maintCost:1200.0, maintAlert:"None", motorEff:93.0, motorTemp:65.0, managerId:"MGR001", managerCity:"Delhi", experience:1, income:30000 };

// ---- Helpers ----
const fmt   = (n,d=1) => Number(n).toFixed(d);
const fmtRs = n => '₹' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');

function battBar(pct, height='7px') {
  const cls = pct>50?'fill-green':pct>25?'fill-orange':'fill-red';
  return `<div>
    <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:3px"><span>${pct}%</span></div>
    <div class="progress-bar" style="height:${height}">
      <div class="progress-fill ${cls}" style="width:${Math.min(pct,100)}%;transition:width 1s ease"></div>
    </div></div>`;
}

function statCard(icon, cls, val, lbl) {
  return `<div class="stat-card driver-stat-card">
    <div class="stat-icon ${cls}">${icon}</div>
    <div class="stat-info"><div class="val">${val}</div><div class="lbl">${lbl}</div></div>
  </div>`;
}

function numCard(val, lbl, color) {
  return `<div style="
      background:var(--card,#fff);
      border:1px solid var(--card-border,rgba(99,130,167,.18));
      border-top:3px solid ${color};
      border-radius:12px;
      padding:1rem 1.2rem;
      box-shadow:0 1px 8px rgba(99,130,167,.1);
      transition:transform .25s cubic-bezier(.34,1.56,.64,1);
    " onmouseenter="this.style.transform='translateY(-4px)'" onmouseleave="this.style.transform='translateY(0)'">
    <div style="font-size:1.4rem;font-weight:900;color:${color};line-height:1;margin-bottom:.3rem">${val}</div>
    <div style="font-size:.72rem;color:var(--muted,#64748b);text-transform:uppercase;letter-spacing:.5px;font-weight:600">${lbl}</div>
  </div>`;
}

function infoRow(label, val) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:.6rem 0;border-bottom:1px solid var(--card-border)">
    <span style="color:var(--muted);font-size:.85rem">${label}</span>
    <span style="font-weight:600;font-size:.88rem">${val}</span></div>`;
}

function startClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => el.textContent = new Date().toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',day:'2-digit',month:'short'});
  tick(); setInterval(tick, 1000);
}

function logout() { sessionStorage.clear(); window.location.href='../index.html'; }

const TAB_TITLES = {
  overview:'Driver Overview', mytrip:'My Trip', battery:'Battery Status',
  behaviour:'My Behaviour', energy:'Energy & Cost', maintenance:'Maintenance',
  rangeml:'Range Predictor', nearby:'Nearby Charging'
};

function switchTab(name, el) {
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pane = document.getElementById('tab-'+name);
  if (pane) pane.classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('pageTitle').textContent = TAB_TITLES[name]||name;
  // Trigger haptic if supported
  if (navigator.vibrate) navigator.vibrate(20);
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  const s = getSession();
  if (!s.role || s.role !== 'driver') { window.location.href='../index.html'; return; }
  const d = DRIVER_DATA[s.id] || DEMO_DATA;
  document.getElementById('driverName').textContent   = s.name || s.id;
  document.getElementById('driverAvatar').textContent = (s.name||s.id||'D')[0].toUpperCase();
  startClock();
  loadDriverOverview(s.id, s.name, d);
  loadMyTrip(d);
  loadBattery(d);
  loadBehaviour(d);
  loadEnergy(d);
  loadMaintenance(d);
  animateCards();
});

function animateCards() {
  document.querySelectorAll('.stat-card,.card,.num-card').forEach((el,i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(20px)';
    setTimeout(() => {
      el.style.transition = 'opacity .4s ease, transform .4s ease';
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }, i * 60);
  });
}

// ===== OVERVIEW =====
function loadDriverOverview(id, name, d) {
  document.getElementById('driverStats').innerHTML =
    statCard('','green',  d.battPct+'%',           'Battery Level')+
    statCard('','blue',   fmt(d.dist)+' km',        "Today's Distance")+
    statCard('','purple', fmt(d.score),             'Safety Score')+
    statCard('','teal',   fmt(d.energyKwh)+' kWh', 'Energy Used')+
    statCard('','orange', fmtRs(d.tripCost),        'Trip Cost')+
    statCard('','green',  fmt(d.range)+' km',       'Remaining Range');

  // Revenue & overspeed number cards
  const nc = document.getElementById('driverNumCards');
  if (nc) nc.innerHTML =
    numCard(fmtRs(d.income),      'Monthly Revenue',    '#22c55e')+
    numCard(d.overspeed,           'Overspeed Events',   '#f43f5e')+
    numCard(fmtRs(d.maintCost),   'Maintenance Cost',   '#fb923c')+
    numCard(fmtRs(d.dailyCost),   'Daily Energy Cost',  '#38bdf8');

  const chargeCls = d.chargingStatus==='Fully Charged'?'badge-active':d.chargingStatus==='Charging'?'badge-blue':d.battPct<25?'badge-inactive':'badge-warn';
  document.getElementById('chargingTag').innerHTML = `<span class="badge ${chargeCls}">${d.chargingStatus}</span>`;
  document.getElementById('batteryDisplay').innerHTML =
    battBar(d.battPct,'10px') +
    `<div style="margin-top:1rem">
      ${infoRow('Battery Health', d.battHealth+'%')}
      ${infoRow('Temperature',    d.battTemp+'°C')}
      ${infoRow('Voltage',        d.battVolt+' V')}
      ${infoRow('Charge Cycles',  d.cycles)}
      ${infoRow('Charger Type',   d.chargerType)}
    </div>`;

  document.getElementById('tripDisplay').innerHTML =
    infoRow('From',      d.startLoc) +
    infoRow('To',        d.dest) +
    infoRow('Speed',     d.speed+' km/h') +
    infoRow('Duration',  d.duration+' min') +
    infoRow('Weather',   d.weather) +
    infoRow('Traffic',   d.traffic) +
    infoRow('Road Type', d.roadType) +
    infoRow('ETA',       d.eta+' min');

  // Alerts
  const alerts = [];
  if (d.battPct < 20)      alerts.push({cls:'red',    title:'Critical Battery',   sub:`Only ${d.battPct}% — charge immediately`});
  if (d.battPct < 30 && d.battPct >= 20) alerts.push({cls:'orange', title:'Low Battery', sub:`Battery at ${d.battPct}% — find a charging station`});
  if (d.battHealth < 85)   alerts.push({cls:'orange', title:'Battery Health Low',  sub:`Health at ${d.battHealth}% — schedule a check`});
  if (d.tireHealth < 60)   alerts.push({cls:'yellow', title:'Tire Wear Warning',   sub:`Tire health ${d.tireHealth}% — inspection needed`});
  if (d.lastService > 180) alerts.push({cls:'yellow', title:'Service Overdue',     sub:`${d.lastService} days since last service`});
  if (d.score < 50)        alerts.push({cls:'yellow', title:'Low Driving Score',   sub:`Score ${fmt(d.score)} — review behaviour tips`});

  document.getElementById('driverAlerts').innerHTML = alerts.length
    ? alerts.map(a=>`<div class="alert-item ${a.cls}">
        <div class="alert-text"><div class="title">${a.title}</div><div class="sub">${a.sub}</div></div></div>`).join('')
    : '<p style="color:var(--success,#22c55e);font-size:.88rem;padding:.4rem 0">No alerts — great job!</p>';
  if (alerts.length) document.getElementById('alertDot').style.display='block';
}

// ===== MY TRIP =====
function loadMyTrip(d) {
  document.getElementById('tripStats').innerHTML =
    statCard('','blue',   fmt(d.dist)+' km',       'Distance Travelled')+
    statCard('','purple', d.duration+' min',        'Trip Duration')+
    statCard('','teal',   d.speed+' km/h',          'Current Speed')+
    statCard('','green',  fmt(d.range)+' km',       'Remaining Range')+
    statCard('','orange', d.chargingStops+' stops', 'Charging Stops')+
    statCard('','green',  fmtRs(d.tripCost),        'Trip Cost');

  document.getElementById('tripDetails').innerHTML =
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div>
        <h4 style="color:var(--mint-dark,#22c55e);margin-bottom:.8rem;font-size:.88rem;font-weight:700;letter-spacing:.3px">ROUTE INFORMATION</h4>
        ${infoRow('Start Location', d.startLoc)}
        ${infoRow('Destination',    d.dest)}
        ${infoRow('Route Distance', d.routeDist+' km')}
        ${infoRow('ETA',            d.eta+' min')}
        ${infoRow('Road Type',      d.roadType)}
        ${infoRow('Traffic',        d.traffic)}
        ${infoRow('Weather',        d.weather)}
        ${infoRow('Charging Stops', d.chargingStops)}
      </div>
      <div>
        <h4 style="color:var(--mint-dark,#22c55e);margin-bottom:.8rem;font-size:.88rem;font-weight:700;letter-spacing:.3px">LIVE TELEMETRY</h4>
        ${infoRow('Current Speed',    d.speed+' km/h')}
        ${infoRow('Acceleration',     d.speed>60?'High':'Normal')}
        ${infoRow('Motor Efficiency', d.motorEff+'%')}
        ${infoRow('Motor Temperature',d.motorTemp+'°C')}
        ${infoRow('Load Weight',      'Standard')}
        ${infoRow('Energy Rate',      fmt(d.energyKwh/Math.max(d.dist,1)*100,2)+' kWh/100km')}
        ${infoRow('Cost Per KM',      fmtRs(d.costPerKm))}
      </div>
    </div>`;
}

// ===== BATTERY =====
function loadBattery(d) {
  document.getElementById('battStatsGrid').innerHTML =
    statCard('','green',  d.battPct+'%',       'Current Level')+
    statCard('','teal',   d.battHealth+'%',     'Battery Health')+
    statCard('','orange', d.battTemp+'°C',      'Temperature')+
    statCard('','blue',   d.chargingStatus,     'Charging Status');

  document.getElementById('battDetail').innerHTML =
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem">
      <div>
        <div style="margin-bottom:1.5rem">
          <div style="display:flex;justify-content:space-between;margin-bottom:.4rem">
            <span style="font-weight:600">Charge Level</span>
            <span style="color:var(--success,#22c55e);font-weight:700">${d.battPct}%</span>
          </div>
          <div class="progress-bar" style="height:14px">
            <div class="progress-fill ${d.battPct>50?'fill-green':d.battPct>25?'fill-orange':'fill-red'}" style="width:${d.battPct}%;transition:width 1s ease"></div>
          </div>
        </div>
        <div style="margin-bottom:1.5rem">
          <div style="display:flex;justify-content:space-between;margin-bottom:.4rem">
            <span style="font-weight:600">Health</span>
            <span style="color:var(--sky,#38bdf8);font-weight:700">${d.battHealth}%</span>
          </div>
          <div class="progress-bar" style="height:14px">
            <div class="progress-fill ${d.battHealth>90?'fill-green':d.battHealth>75?'fill-orange':'fill-red'}" style="width:${d.battHealth}%;transition:width 1.2s ease"></div>
          </div>
        </div>
        ${infoRow('Battery Capacity', d.battKwh+' kWh')}
        ${infoRow('Remaining Range',  fmt(d.range)+' km')}
      </div>
      <div>
        ${infoRow('Voltage',             d.battVolt+' V')}
        ${infoRow('Temperature',         d.battTemp+'°C')}
        ${infoRow('Charge Cycles',       d.cycles)}
        ${infoRow('Battery Age',         d.battAge+' months')}
        ${infoRow('Charging Status',     d.chargingStatus)}
        ${infoRow('Last Charge Duration',d.chargeDur+' min')}
        ${infoRow('Last Charge Cost',    fmtRs(d.chargeCost))}
        ${infoRow('Charger Type',        d.chargerType)}
      </div>
    </div>`;
}

// ===== BEHAVIOUR =====
function loadBehaviour(d) {
  document.getElementById('behavStats').innerHTML =
    statCard('','purple', fmt(d.score),   'Driving Score')+
    statCard('','red',    d.harshBraking, 'Harsh Braking')+
    statCard('','orange', d.suddenAccel,  'Sudden Acceleration')+
    statCard('','blue',   d.overspeed,    'Overspeed Events');

  // Score ring
  const r = 52, circ = 2*Math.PI*r;
  const strokeColor = d.score>=75?'#22c55e':d.score>=50?'#fbbf24':'#f43f5e';
  const stroke = circ*(1 - d.score/100);
  document.getElementById('scoreBreakdown').innerHTML =
    `<div style="text-align:center;margin-bottom:1.2rem">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(100,116,139,.15)" stroke-width="10"/>
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="${strokeColor}" stroke-width="10"
          stroke-dasharray="${circ}" stroke-dashoffset="${circ}" stroke-linecap="round"
          style="transform:rotate(-90deg);transform-origin:70px 70px;transition:stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)"
          id="scoreRing"/>
        <text x="70" y="75" text-anchor="middle" fill="${strokeColor}" font-size="22" font-weight="800">${fmt(d.score)}</text>
        <text x="70" y="92" text-anchor="middle" fill="#94a3b8" font-size="9">/ 100</text>
      </svg>
    </div>` +
    infoRow('Harsh Braking',     `<span style="color:${d.harshBraking>10?'#f43f5e':'#22c55e'}">${d.harshBraking} events</span>`) +
    infoRow('Sudden Acceleration',`<span style="color:${d.suddenAccel>10?'#f43f5e':'#22c55e'}">${d.suddenAccel} events</span>`) +
    infoRow('Overspeed Events',   `<span style="color:${d.overspeed>5?'#f43f5e':'#22c55e'}">${d.overspeed} events</span>`) +
    infoRow('Avg Speed',          d.speed+' km/h') +
    infoRow('Cost Per KM',        fmtRs(d.costPerKm));

  // Animate ring after render
  setTimeout(() => {
    const ring = document.getElementById('scoreRing');
    if (ring) ring.style.strokeDashoffset = stroke;
  }, 200);

  // Comprehensive improvement tips
  const tips = buildBehaviourTips(d);
  document.getElementById('improveTips').innerHTML = tips.map(t=>
    `<div class="tip-card" style="display:flex;gap:.9rem;padding:.85rem;background:var(--bg3,#f0f4f8);border-radius:10px;margin-bottom:.65rem;border-left:3px solid ${t.color};transition:transform .2s ease" onmouseenter="this.style.transform='translateX(4px)'" onmouseleave="this.style.transform='translateX(0)'">
      <div style="width:28px;height:28px;border-radius:50%;background:${t.color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.75rem;font-weight:800;color:${t.color}">${t.icon}</div>
      <div>
        <div style="font-size:.82rem;font-weight:700;color:var(--text,#1e293b);margin-bottom:.2rem">${t.label}</div>
        <p style="font-size:.78rem;color:var(--muted,#64748b);line-height:1.5;margin:0">${t.tip}</p>
      </div>
    </div>`
  ).join('');

  // Render behaviour charts
  setTimeout(() => renderBehaviourCharts(d), 50);
}

function buildBehaviourTips(d) {
  const tips = [];

  // Harsh braking tips
  if (d.harshBraking > 15) {
    tips.push({ icon:'!', color:'#f43f5e', label:'Critical: Excessive Braking',
      tip:`You had ${d.harshBraking} harsh braking events — this is a safety risk. Maintain at least 3-second following distance, watch road conditions 500m ahead, and gradually release the accelerator before braking.` });
  } else if (d.harshBraking > 8) {
    tips.push({ icon:'↓', color:'#fb923c', label:'Reduce Harsh Braking',
      tip:`${d.harshBraking} events detected. Anticipate traffic lights and slow down progressively. Regenerative braking at lower intensity saves battery and reduces wear.` });
  } else if (d.harshBraking > 3) {
    tips.push({ icon:'✓', color:'#fbbf24', label:'Minor Braking Improvement',
      tip:`${d.harshBraking} events — good progress. Practice coasting to a stop in city traffic. This alone can extend battery range by 8–12%.` });
  }

  // Sudden acceleration tips
  if (d.suddenAccel > 15) {
    tips.push({ icon:'!', color:'#f43f5e', label:'Critical: High Acceleration Events',
      tip:`${d.suddenAccel} sudden acceleration events drain your battery 23% faster. Use Eco mode if available, and accelerate to target speed in 8–10 seconds rather than 2–3.` });
  } else if (d.suddenAccel > 8) {
    tips.push({ icon:'↑', color:'#fb923c', label:'Smooth Acceleration Needed',
      tip:`${d.suddenAccel} events recorded. Gradual acceleration from 0–50 km/h reduces energy consumption by up to 15% per trip. Your monthly cost could drop by ₹200–400.` });
  } else if (d.suddenAccel > 3) {
    tips.push({ icon:'~', color:'#fbbf24', label:'Acceleration is Acceptable',
      tip:`${d.suddenAccel} events — within average range. Focus on smoother starts at traffic lights for a further score improvement.` });
  }

  // Overspeed tips
  if (d.overspeed > 10) {
    tips.push({ icon:'!', color:'#f43f5e', label:'Frequent Overspeeding',
      tip:`${d.overspeed} overspeed events significantly impact your safety score and fleet insurance ratings. Every 10 km/h over the limit increases energy use by ~14% and accident risk by 30%.` });
  } else if (d.overspeed > 4) {
    tips.push({ icon:'→', color:'#fb923c', label:'Speed Management',
      tip:`${d.overspeed} overspeed events. Use cruise control on highways. Staying at 80–90 km/h vs 110 km/h extends your EV range by up to 25%.` });
  }

  // Battery management
  if (d.battPct < 20) {
    tips.push({ icon:'⚡', color:'#f43f5e', label:'Urgent: Charge Now',
      tip:`Battery at ${d.battPct}%. Open the Nearby Charging tab to find the closest station. Route to a charging point immediately — do not wait for below 10%.` });
  } else if (d.battPct < 35) {
    tips.push({ icon:'⚡', color:'#fb923c', label:'Plan Charging Soon',
      tip:`Battery at ${d.battPct}%. Plan a charging stop in the next 30–40 km. Pre-condition the battery by charging to 80% rather than 100% for better longevity.` });
  }

  // Speed-related energy tip
  if (d.speed > 100) {
    tips.push({ icon:'→', color:'#fb923c', label:'High Speed Energy Loss',
      tip:`Current speed ${d.speed} km/h causes aerodynamic drag that cuts range by up to 30%. Reducing to 90 km/h would give you approximately ${Math.round(d.range * 1.15)} km remaining range.` });
  }

  // Tire health
  if (d.tireHealth < 50) {
    tips.push({ icon:'!', color:'#f43f5e', label:'Critical Tire Condition',
      tip:`Tire health at ${d.tireHealth}% — immediate inspection needed. Under-inflated or worn tires increase rolling resistance by 3–5%, reducing EV range and increasing braking distance by 20%.` });
  } else if (d.tireHealth < 70) {
    tips.push({ icon:'○', color:'#fbbf24', label:'Tire Inspection Recommended',
      tip:`Tire health at ${d.tireHealth}%. Check tyre pressure weekly — maintaining correct pressure (typically 32–36 PSI) improves range by 3–7% and reduces wear.` });
  }

  // Score-based general tips
  if (d.score >= 85) {
    tips.push({ icon:'★', color:'#22c55e', label:'Excellent Driver — Top Rating',
      tip:`Score ${fmt(d.score)}/100 — you are in the top 15% of fleet drivers. Maintain consistent behaviour. Consider applying for the Fleet Safety Champion programme.` });
  } else if (d.score >= 70) {
    tips.push({ icon:'↑', color:'#22c55e', label:'Good Driver — Keep Improving',
      tip:`Score ${fmt(d.score)}/100. You need to reduce ${d.harshBraking>d.suddenAccel?'harsh braking':'sudden acceleration'} events to push into the Excellent tier. A score above 85 qualifies for performance bonuses.` });
  } else if (d.score >= 55) {
    tips.push({ icon:'○', color:'#fbbf24', label:'Average Score — Improvement Needed',
      tip:`Score ${fmt(d.score)}/100. Focus on the highest-count event type first. Even a 10-point improvement in 30 days could qualify you for a ₹${(500 + d.experience*100).toLocaleString()} monthly performance incentive.` });
  } else {
    tips.push({ icon:'!', color:'#f43f5e', label:'Risky Score — Action Required',
      tip:`Score ${fmt(d.score)}/100 places you in the bottom quartile. Your manager has been notified. A mandatory safety refresher is recommended. Focus on: ${d.harshBraking>d.overspeed && d.harshBraking>d.suddenAccel ? 'braking smoothness' : d.suddenAccel>d.overspeed ? 'acceleration control' : 'speed limit compliance'}.` });
  }

  // Experience-based tips
  if (d.experience < 2) {
    tips.push({ icon:'i', color:'#38bdf8', label:'New Driver Guidance',
      tip:`With ${d.experience} year(s) of experience, focus on building smooth EV driving habits early. EVs behave differently from ICE vehicles — regenerative braking is your key tool for efficiency.` });
  }

  // Motor efficiency tip
  if (d.motorEff < 88) {
    tips.push({ icon:'↓', color:'#a78bfa', label:'Motor Efficiency Below Target',
      tip:`Motor efficiency at ${d.motorEff}% (target: 90%+). Avoid high loads at low speeds. If the issue persists, schedule a motor inspection — it may indicate a software calibration need.` });
  }

  return tips.slice(0, 8); // max 8 tips
}

// ===== ENERGY =====
function loadEnergy(d) {
  document.getElementById('energyStats').innerHTML =
    statCard('','teal',   fmt(d.energyKwh)+' kWh', 'Energy This Trip')+
    statCard('','blue',   fmtRs(d.dailyCost),       'Daily Cost')+
    statCard('','purple', fmtRs(d.monthlyCost),     'Monthly Cost')+
    statCard('','green',  fmtRs(d.costPerKm)+'/km', 'Cost Per KM');

  document.getElementById('energyBreakdown').innerHTML =
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem">
      <div>
        <h4 style="color:var(--mint-dark,#22c55e);margin-bottom:.8rem;font-size:.85rem;font-weight:700;letter-spacing:.3px">CONSUMPTION</h4>
        ${infoRow('Energy Used',     fmt(d.energyKwh)+' kWh')}
        ${infoRow('Energy Rate',     fmt(d.energyKwh/Math.max(d.dist,1)*100,2)+' kWh/100km')}
        ${infoRow('Motor Efficiency',d.motorEff+'%')}
        ${infoRow('Distance Covered',fmt(d.dist)+' km')}
        ${infoRow('Charger Type',    d.chargerType)}
      </div>
      <div>
        <h4 style="color:var(--mint-dark,#22c55e);margin-bottom:.8rem;font-size:.85rem;font-weight:700;letter-spacing:.3px">COST BREAKDOWN</h4>
        ${infoRow('Trip Cost',    fmtRs(d.tripCost))}
        ${infoRow('Daily Cost',   fmtRs(d.dailyCost))}
        ${infoRow('Monthly Cost', fmtRs(d.monthlyCost))}
        ${infoRow('Cost Per KM',  fmtRs(d.costPerKm))}
        ${infoRow('Charging Cost',fmtRs(d.chargeCost))}
      </div>
    </div>`;

  // Render charts after a tick so canvases are in DOM
  setTimeout(() => renderEnergyCharts(d), 50);
}

function renderEnergyCharts(d) {
  const isDark   = document.documentElement.getAttribute('data-theme') === 'dark';
  const tick     = isDark ? '#8899bb' : '#64748b';
  const grid     = isDark ? 'rgba(255,255,255,.07)' : 'rgba(99,130,167,.13)';
  const legend   = isDark ? '#8899bb' : '#64748b';
  const scaleOpt = {
    x: { ticks:{ color:tick, font:{size:10} }, grid:{ color:grid } },
    y: { ticks:{ color:tick }, grid:{ color:grid } }
  };

  // 1. Cost distribution pie
  const pie = document.getElementById('energyCostPie');
  if (pie && typeof Chart !== 'undefined') {
    if (pie._chart) pie._chart.destroy();
    pie._chart = new Chart(pie, {
      type: 'doughnut',
      data: {
        labels: ['Trip Cost', 'Charging Cost', 'Daily Energy', 'Maintenance'],
        datasets: [{
          data: [d.tripCost, d.chargeCost, d.dailyCost, d.maintCost * 0.05],
          backgroundColor: ['#4ade80','#38bdf8','#fbbf24','#fb923c'],
          borderWidth: 3,
          borderColor: isDark ? '#0d1530' : '#fff',
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true, cutout: '60%',
        plugins: {
          legend: { position:'bottom', labels:{ color:legend, font:{size:10}, boxWidth:10, padding:8 } },
          tooltip: { callbacks: { label: ctx => ` ₹${Number(ctx.raw).toFixed(2)}` } }
        }
      }
    });
  }

  // 2. Weekly energy estimate bar (Mon–Sun simulated from daily cost)
  const weekBar = document.getElementById('energyWeekBar');
  if (weekBar && typeof Chart !== 'undefined') {
    if (weekBar._chart) weekBar._chart.destroy();
    const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const base  = d.dailyCost;
    const noise = [0.95,1.08,1.0,0.92,1.12,0.88,0.75];
    weekBar._chart = new Chart(weekBar, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Est. Energy Cost ₹',
          data: days.map((_,i) => +(base * noise[i]).toFixed(2)),
          backgroundColor: days.map((_,i) => i === new Date().getDay()-1 ? '#22c55e' : '#38bdf8aa'),
          borderRadius: 5, borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => ` ₹${ctx.raw}` } } },
        scales: { ...scaleOpt, y: { ...scaleOpt.y, ticks:{ ...scaleOpt.y.ticks, callback: v => '₹'+v } } }
      }
    });
  }

  // 3. Battery % vs Range bar
  const batt = document.getElementById('battRangeBar');
  if (batt && typeof Chart !== 'undefined') {
    if (batt._chart) batt._chart.destroy();
    const levels  = [100,75,50,25,15,0];
    const maxRange = d.range / (d.battPct/100 || 0.01);
    batt._chart = new Chart(batt, {
      type: 'bar',
      data: {
        labels: levels.map(l => l+'%'),
        datasets: [{
          label: 'Estimated Range (km)',
          data: levels.map(l => l === 0 ? 0 : +(maxRange * l/100).toFixed(1)),
          backgroundColor: levels.map(l => l>=50?'#4ade80':l>=25?'#fbbf24':l>=10?'#fb923c':'#f43f5e'),
          borderRadius: 5, borderWidth: 0,
        }]
      },
      options: {
        responsive: true, indexAxis: 'y',
        plugins: { legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => ` ${ctx.raw} km` } } },
        scales: {
          x: { ...scaleOpt.x, ticks:{ ...scaleOpt.x.ticks, callback: v => v+' km' } },
          y: { ...scaleOpt.y }
        }
      }
    });
  }
}

// ===== MAINTENANCE (enhanced with comparison table + number cards + recommendations) =====
function loadMaintenance(d) {
  const tireOk = d.tireHealth > 70;
  const servOk = d.lastService < 180;

  // Number cards
  const nc = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.9rem;margin-bottom:1.5rem">
    ${numCard(d.tireHealth+'%',        'Tire Health',       d.tireHealth>70?'#22c55e':d.tireHealth>40?'#fb923c':'#f43f5e')}
    ${numCard(d.lastService+' days',   'Since Last Service',servOk?'#22c55e':'#f43f5e')}
    ${numCard(fmtRs(d.maintCost),      'Current Maint. Cost','#fb923c')}
    ${numCard(d.maintAlert==='None'?'OK':d.maintAlert, 'Alert Status', d.maintAlert==='None'?'#22c55e':'#fbbf24')}
  </div>`;

  // Previous vs upcoming comparison table
  const prevMaint = {
    date:'90 days ago', type:'Oil & Filter Check', cost: Math.round(d.maintCost*0.6), tireHealth:(d.tireHealth+8).toFixed(1), battHealth:(d.battHealth+2).toFixed(1), status:'Completed'
  };
  const upcoming = getUpcomingMaintenance(d);

  const compTable = `
    <div style="margin-bottom:1.5rem">
      <h4 style="font-size:.88rem;font-weight:700;margin-bottom:.8rem;color:var(--text,#1e293b)">Maintenance History vs Upcoming</h4>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem">
          <thead>
            <tr style="background:var(--bg3,#f0f4f8)">
              <th style="padding:.6rem .9rem;text-align:left;color:var(--muted,#64748b);font-size:.7rem;text-transform:uppercase;font-weight:700;border-bottom:1px solid var(--card-border)">Item</th>
              <th style="padding:.6rem .9rem;text-align:left;color:var(--muted,#64748b);font-size:.7rem;text-transform:uppercase;font-weight:700;border-bottom:1px solid var(--card-border)">Previous</th>
              <th style="padding:.6rem .9rem;text-align:left;color:var(--muted,#64748b);font-size:.7rem;text-transform:uppercase;font-weight:700;border-bottom:1px solid var(--card-border)">Current</th>
              <th style="padding:.6rem .9rem;text-align:left;color:var(--muted,#64748b);font-size:.7rem;text-transform:uppercase;font-weight:700;border-bottom:1px solid var(--card-border)">Upcoming (Due)</th>
              <th style="padding:.6rem .9rem;text-align:left;color:var(--muted,#64748b);font-size:.7rem;text-transform:uppercase;font-weight:700;border-bottom:1px solid var(--card-border)">Status</th>
            </tr>
          </thead>
          <tbody>
            ${[
              ['Tire Health', prevMaint.tireHealth+'%', d.tireHealth+'%', upcoming.tireAction, d.tireHealth<50?'Critical':d.tireHealth<70?'Due':'OK'],
              ['Battery Health', prevMaint.battHealth+'%', d.battHealth+'%', upcoming.battAction, d.battHealth<80?'Due':'OK'],
              ['Last Service', prevMaint.date, d.lastService+' days ago', upcoming.serviceAction, servOk?'OK':'Overdue'],
              ['Maintenance Type', prevMaint.type, d.maintAlert, upcoming.nextType, d.maintAlert!=='None'?'Pending':'None'],
              ['Maintenance Cost', '₹'+Math.round(d.maintCost*0.6).toLocaleString(), fmtRs(d.maintCost), upcoming.estCost, '—'],
            ].map(([item, prev, curr, next, status]) => {
              const sc = status==='Critical'||status==='Overdue'?'#f43f5e':status==='Due'||status==='Pending'?'#fb923c':'#22c55e';
              return `<tr style="border-bottom:1px solid var(--card-border)">
                <td style="padding:.6rem .9rem;font-weight:600;color:var(--text2,#334155)">${item}</td>
                <td style="padding:.6rem .9rem;color:var(--muted,#64748b)">${prev}</td>
                <td style="padding:.6rem .9rem;font-weight:600;color:var(--text,#1e293b)">${curr}</td>
                <td style="padding:.6rem .9rem;color:#38bdf8;font-weight:600">${next}</td>
                <td style="padding:.6rem .9rem"><span style="font-size:.68rem;padding:.15rem .55rem;border-radius:20px;background:${sc}18;color:${sc};border:1px solid ${sc}44;font-weight:700">${status}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // Recommendations
  const recs = getMaintRecommendations(d);

  document.getElementById('maintDetail').innerHTML = nc + compTable +
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
      <div>
        <h4 style="font-size:.85rem;font-weight:700;margin-bottom:.8rem;color:var(--text,#1e293b)">Vehicle Condition</h4>
        <div style="margin-bottom:1.2rem">
          <div style="display:flex;justify-content:space-between;margin-bottom:.35rem">
            <span style="font-size:.82rem;font-weight:600">Tire Health</span>
            <span style="font-weight:700;color:${tireOk?'#22c55e':'#f43f5e'}">${d.tireHealth}%</span>
          </div>
          <div class="progress-bar" style="height:10px">
            <div class="progress-fill ${tireOk?'fill-green':'fill-red'}" style="width:${d.tireHealth}%;transition:width 1s ease"></div>
          </div>
        </div>
        ${infoRow('Last Service',    d.lastService+' days ago')}
        ${infoRow('Service Status',  servOk?'<span style="color:#22c55e">Up to date</span>':'<span style="color:#f43f5e">Overdue</span>')}
        ${infoRow('Maintenance Cost',fmtRs(d.maintCost))}
        ${infoRow('Current Alert',   d.maintAlert!=='None'?`<span style="color:#fbbf24">${d.maintAlert}</span>`:'<span style="color:#22c55e">None</span>')}
      </div>
      <div>
        <h4 style="font-size:.85rem;font-weight:700;margin-bottom:.8rem;color:var(--text,#1e293b)">Recommendations</h4>
        ${recs.map(r=>`<div style="display:flex;gap:.65rem;padding:.6rem .8rem;background:${r.bg};border-radius:8px;margin-bottom:.5rem;border-left:3px solid ${r.color}">
          <div style="font-size:.78rem;font-weight:700;color:${r.color};min-width:50px">${r.priority}</div>
          <div style="font-size:.78rem;color:var(--text2,#334155);line-height:1.4">${r.text}</div>
        </div>`).join('')}
      </div>
    </div>`;
}

function getUpcomingMaintenance(d) {
  const daysLeft = Math.max(0, 180 - d.lastService);
  return {
    tireAction: d.tireHealth < 60 ? 'Replace now' : d.tireHealth < 70 ? 'In ~30 days' : 'In ~90 days',
    battAction: d.battHealth < 85 ? 'Service needed' : 'In ~6 months',
    serviceAction: daysLeft < 30 ? 'Within '+daysLeft+' days' : 'In '+daysLeft+' days',
    nextType: d.maintAlert !== 'None' ? d.maintAlert : 'Routine Service',
    estCost: '₹'+Math.round(d.maintCost * 0.8).toLocaleString()
  };
}

function getMaintRecommendations(d) {
  const recs = [];
  if (d.tireHealth < 50)   recs.push({ priority:'URGENT',  color:'#f43f5e', bg:'rgba(244,63,94,.06)',  text:`Replace tires immediately. Health at ${d.tireHealth}% is a safety hazard and increases stopping distance by 20%.` });
  if (d.tireHealth < 70)   recs.push({ priority:'HIGH',    color:'#fb923c', bg:'rgba(251,146,60,.06)', text:`Schedule tire inspection within 2 weeks. Check pressure (target 34 PSI) and tread depth.` });
  if (d.lastService > 180) recs.push({ priority:'URGENT',  color:'#f43f5e', bg:'rgba(244,63,94,.06)',  text:`Service overdue by ${d.lastService-180} days. Overdue maintenance voids warranty and increases breakdown risk.` });
  if (d.lastService > 150) recs.push({ priority:'HIGH',    color:'#fb923c', bg:'rgba(251,146,60,.06)', text:`Book a service appointment within 30 days. Ask for battery health diagnostics and motor check.` });
  if (d.battHealth < 80)   recs.push({ priority:'HIGH',    color:'#fb923c', bg:'rgba(251,146,60,.06)', text:`Battery health ${d.battHealth}% — request a battery module inspection. Avoid charging above 90% to preserve remaining capacity.` });
  if (d.maintAlert !== 'None') recs.push({ priority:'PENDING', color:'#fbbf24', bg:'rgba(251,191,36,.06)', text:`Active alert: ${d.maintAlert}. Schedule with your fleet manager at earliest convenience.` });
  if (recs.length === 0)   recs.push({ priority:'OK',      color:'#22c55e', bg:'rgba(34,197,94,.06)',  text:`Vehicle is in good condition. Next routine service due in ${Math.max(0,180-d.lastService)} days. Keep monitoring tire pressure weekly.` });
  return recs.slice(0, 4);
}

// ===== BEHAVIOUR CHARTS =====
function renderBehaviourCharts(d) {
  if (typeof Chart === 'undefined') return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const tick   = isDark ? '#8899bb' : '#64748b';
  const grid   = isDark ? 'rgba(255,255,255,.07)' : 'rgba(99,130,167,.13)';

  // 1. Radar — driving events
  const radar = document.getElementById('behaviourRadar');
  if (radar) {
    if (radar._chart) radar._chart.destroy();
    // Normalise to 0-100 scale (max possible: 20 each)
    const toScore = (v, max) => Math.round((1 - Math.min(v,max)/max) * 100);
    radar._chart = new Chart(radar, {
      type: 'radar',
      data: {
        labels: ['Braking\nSmoothness','Acceleration\nControl','Speed\nCompliance','Motor\nEfficiency','Battery\nManagement'],
        datasets: [{
          label: 'Your Score',
          data: [
            toScore(d.harshBraking, 20),
            toScore(d.suddenAccel,  20),
            toScore(d.overspeed,    15),
            Math.round(d.motorEff),
            Math.round(d.battHealth),
          ],
          borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,.15)',
          pointBackgroundColor: '#22c55e', pointRadius: 4, borderWidth: 2,
        }, {
          label: 'Fleet Average',
          data: [65, 62, 70, 88, 82],
          borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,.1)',
          pointBackgroundColor: '#38bdf8', pointRadius: 4, borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend:{ labels:{ color:tick, font:{size:10}, boxWidth:10 } } },
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { color: tick, stepSize: 20, font:{ size:9 } },
            grid:  { color: grid },
            pointLabels: { color: tick, font:{ size:9 } }
          }
        }
      }
    });
  }

  // 2. Bar — my score vs fleet avg vs top driver
  const bar = document.getElementById('scoreCompareBar');
  if (bar) {
    if (bar._chart) bar._chart.destroy();
    bar._chart = new Chart(bar, {
      type: 'bar',
      data: {
        labels: ['Your Score', 'Fleet Average', 'Top Driver', 'Minimum Target'],
        datasets: [{
          data: [d.score, 69.9, 92.4, 70],
          backgroundColor: [
            d.score >= 70 ? '#4ade80' : d.score >= 50 ? '#fbbf24' : '#f43f5e',
            '#38bdf8', '#a78bfa', '#94a3b844'
          ],
          borderRadius: 6, borderWidth: 0,
        }]
      },
      options: {
        responsive: true, indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` Score: ${ctx.raw.toFixed(1)}/100` } }
        },
        scales: {
          x: { min:0, max:100, ticks:{ color:tick }, grid:{ color:grid } },
          y: { ticks:{ color:tick, font:{size:10} }, grid:{ color:'transparent' } }
        }
      }
    });
  }
}
