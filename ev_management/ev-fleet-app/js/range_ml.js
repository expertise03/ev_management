// ===== FleetPulse Range Predictor — Python API Client =====
// Calls the Flask ML API at localhost:5050

const ML_API = 'http://localhost:5050';

// ── On page load: check API status and seed the info panel ──────────
document.addEventListener('DOMContentLoaded', async () => {
  await checkAPIStatus();
  renderBatteryTests();   // render with defaults while API loads
});

async function checkAPIStatus() {
  try {
    const res  = await fetch(`${ML_API}/status`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();

    if (data.trained) {
      const r2 = data.r2 ?? '—';
      renderModelInfo({
        r2,
        mae:     data.mae,
        rmse:    data.rmse,
        samples: data.samples,
        importances: data.importances || {},
      });
      renderBatteryTests();
      setAPIBadge(true, `Model loaded · R² ${r2}%`);
    }
  } catch (e) {
    setAPIBadge(false, 'API offline — start ml_api/app.py');
    renderModelInfo(null);
  }
}

function setAPIBadge(online, msg) {
  const badge = document.getElementById('ml-api-badge');
  if (!badge) return;
  badge.textContent   = msg;
  badge.style.color   = online ? '#22c55e' : '#f43f5e';
  badge.style.background = online ? 'rgba(34,197,94,.1)' : 'rgba(244,63,94,.1)';
  badge.style.border  = `1px solid ${online ? 'rgba(34,197,94,.3)' : 'rgba(244,63,94,.3)'}`;
}

// ── Main prediction call ─────────────────────────────────────────────
async function predictRange() {
  const battery    = parseFloat(document.getElementById('ml-battery').value)    ?? 80;
  const odometer   = parseFloat(document.getElementById('ml-odometer').value)   ?? 15000;
  const road       = document.getElementById('ml-road').value;
  const carType    = document.getElementById('ml-cartype').value;
  const speed      = parseFloat(document.getElementById('ml-speed').value)      ?? 60;
  const passengers = parseInt(document.getElementById('ml-passengers').value)   ?? 4;
  const battCap    = parseFloat(document.getElementById('ml-battcap')?.value)   || getDefaultBattCap(carType);

  if (battery < 0 || battery > 100) { showMLError('Battery level must be 0–100%.'); return; }

  showSpinner(true);
  hideResult();
  clearError();

  const payload = {
    battery_percentage:   battery,
    speed_kmph:           speed,
    road_type:            road,
    car_type:             carType,
    passengers:           passengers,
    battery_capacity_kwh: battCap,
    motor_efficiency:     92,
    tire_health_percent:  80,
    battery_health_percent: 95,
    distance_travelled_km:  50,
    energy_consumed_kwh:    8,
  };

  try {
    const res  = await fetch(`${ML_API}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();

    showSpinner(false);
    displayResult(data, battery, road, carType, speed, passengers);

  } catch (e) {
    showSpinner(false);
    if (e.name === 'TimeoutError' || e.message.includes('fetch')) {
      showMLError('Cannot reach the ML API. Make sure ml_api/app.py is running on port 5050.');
    } else {
      showMLError(`Prediction failed: ${e.message}`);
    }
  }
}

function displayResult(data, battery, road, carType, speed, passengers) {
  const km  = data.predicted_range_km;
  const lo  = data.confidence_interval?.low  ?? km;
  const hi  = data.confidence_interval?.high ?? km;
  const r2  = data.model_r2  ?? '—';
  const mae = data.model_mae ?? '—';

  document.getElementById('ml-result-km').textContent = km;
  document.getElementById('ml-accuracy').textContent  = `R² ${r2}%`;

  // Confidence band
  const confEl = document.getElementById('ml-confidence');
  if (confEl) confEl.textContent = `Range: ${lo}–${hi} km (±${data.std_km ?? '—'} km)`;

  // Battery status pill
  const pillEl = document.getElementById('ml-batt-status');
  if (pillEl) {
    const color = battery <= 3 ? '#f43f5e' : battery <= 20 ? '#fb923c' : battery <= 50 ? '#fbbf24' : '#22c55e';
    pillEl.textContent   = data.battery_status ?? '';
    pillEl.style.color   = color;
    pillEl.style.background = color + '18';
    pillEl.style.border  = `1px solid ${color}44`;
  }

  // Feature importance bars
  const imp = data.importances ?? {};
  const bars = [
    { label: `Battery (${battery}%)`,   pct: imp['battery_percentage']   ?? 56, color: battery>50?'#4ade80':battery>20?'#fbbf24':'#f43f5e' },
    { label: `Capacity (kWh)`,           pct: imp['battery_capacity_kwh'] ?? 30, color: '#38bdf8' },
    { label: `Energy consumed (kWh)`,    pct: imp['energy_consumed_kwh']  ??  6, color: '#a78bfa' },
    { label: `Car type`,                 pct: imp['car_type_enc']         ??  2, color: '#fb923c' },
    { label: `Passenger load`,           pct: imp['load_weight_kg']       ??  1, color: '#fbbf24' },
  ];

  document.getElementById('ml-result-bars').innerHTML = bars.map(b => `
    <div class="ml-bar-row">
      <div style="min-width:160px;color:var(--text2)">${b.label}</div>
      <div class="ml-bar-track">
        <div class="ml-bar-fill" style="width:${Math.min(b.pct, 100)}%;background:${b.color}"></div>
      </div>
      <div style="min-width:42px;text-align:right;color:var(--muted)">${Number(b.pct).toFixed(1)}%</div>
    </div>`).join('');

  document.getElementById('ml-result').classList.add('show');
  renderModelInfo({ r2, mae, rmse: data.model_rmse, samples: null, importances: imp });
  renderBatteryTests(road, carType, speed, passengers);
}

// ── Battery quick-test table (batch call) ────────────────────────────
async function renderBatteryTests(road, carType, speed, passengers) {
  road       = road       || document.getElementById('ml-road')?.value       || 'highway';
  carType    = carType    || document.getElementById('ml-cartype')?.value     || 'Sedan';
  speed      = speed      || parseFloat(document.getElementById('ml-speed')?.value)     || 60;
  passengers = passengers || parseInt(document.getElementById('ml-passengers')?.value)  || 4;
  const battCap = getDefaultBattCap(carType);

  const payload = {
    road_type: road, car_type: carType, speed_kmph: speed,
    passengers, battery_capacity_kwh: battCap,
    motor_efficiency: 92, tire_health_percent: 80,
    battery_health_percent: 95, distance_travelled_km: 50, energy_consumed_kwh: 8,
  };

  const el = document.getElementById('mlBatteryTests');
  if (!el) return;

  try {
    const res  = await fetch(`${ML_API}/batch_battery_test`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error('batch call failed');
    const data = await res.json();
    const rows = data.results ?? [];

    el.innerHTML = buildBatteryTable(rows);
  } catch {
    // Fall back to JS estimates if API not ready
    const levels = [100, 90, 50, 10, 3, 0];
    const rows = levels.map(lvl => {
      const BASE = { Hatchback:213, Sedan:220, SUV:312, Crossover:528 };
      const base = BASE[carType] || 250;
      const factor = lvl <= 0 ? 0 : lvl <= 5 ? lvl*0.007 : lvl*0.0098;
      const roadM  = road==='city'?0.78:road==='mixed'?0.89:1.0;
      const km = Math.max(0, Math.round(base * factor * roadM));
      const status = lvl===0?'Depleted':lvl<=3?'Critical':lvl<=10?'Very Low':lvl<=20?'Low':lvl<=50?'Moderate':lvl<=90?'Good':'Optimal';
      return { battery_pct: lvl, predicted_km: km, status };
    });
    el.innerHTML = buildBatteryTable(rows);
  }
}

function buildBatteryTable(rows) {
  const colorOf = lvl => lvl <= 3 ? '#f43f5e' : lvl <= 10 ? '#fb923c' : lvl <= 20 ? '#fbbf24' : lvl <= 50 ? '#a3e635' : '#22c55e';
  return `
    <table style="width:100%;border-collapse:collapse;font-size:.8rem">
      <thead><tr style="background:var(--bg3)">
        <th style="padding:.5rem .75rem;text-align:left;color:var(--muted);font-size:.68rem;text-transform:uppercase;font-weight:700">Battery %</th>
        <th style="padding:.5rem .75rem;text-align:left;color:var(--muted);font-size:.68rem;text-transform:uppercase;font-weight:700">Predicted Range</th>
        <th style="padding:.5rem .75rem;text-align:left;color:var(--muted);font-size:.68rem;text-transform:uppercase;font-weight:700">Status</th>
      </tr></thead>
      <tbody>
      ${rows.map(r => {
        const c = colorOf(r.battery_pct);
        return `<tr style="border-bottom:1px solid var(--card-border)">
          <td style="padding:.5rem .75rem;font-weight:800;color:${c}">${r.battery_pct}%</td>
          <td style="padding:.5rem .75rem;font-weight:700;color:var(--text)">${r.predicted_km} km</td>
          <td style="padding:.5rem .75rem"><span style="font-size:.68rem;padding:.15rem .55rem;border-radius:20px;background:${c}18;color:${c};border:1px solid ${c}44;font-weight:700">${r.status}</span></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>`;
}

// ── Model info panel ─────────────────────────────────────────────────
function renderModelInfo(stats) {
  const el = document.getElementById('mlInfoRows');
  if (!el) return;

  if (!stats) {
    el.innerHTML = `<p style="color:var(--muted);font-size:.82rem;padding:.5rem 0">
      API is offline. Start <code>ml_api/app.py</code> to enable live predictions.</p>`;
    return;
  }

  const rows = [
    ['Algorithm',         'Random Forest Regressor (200 trees)'],
    ['Model R²',          `${stats.r2 ?? '—'}%`],
    ['Mean Abs. Error',   `${stats.mae ?? '—'} km`],
    ['RMSE',              `${stats.rmse ?? '—'} km`],
    ['Training Samples',  stats.samples ? `${stats.samples.toLocaleString()} trips` : '5,000 trips'],
    ['Primary Feature',   'Battery Percentage (~56% importance)'],
    ['Secondary Feature', 'Battery Capacity kWh (~30% importance)'],
    ['Road Adjustment',   'City: −22% · Mixed: −11% · Highway: baseline'],
  ];

  el.innerHTML = rows.map(([k, v]) => `
    <div style="display:flex;justify-content:space-between;align-items:center;
      padding:.42rem 0;border-bottom:1px solid var(--card-border);font-size:.78rem">
      <span style="color:var(--muted);font-weight:600">${k}</span>
      <span style="color:var(--text2);text-align:right;max-width:200px">${v}</span>
    </div>`).join('');
}

// ── Helpers ──────────────────────────────────────────────────────────
function getDefaultBattCap(carType) {
  return { Hatchback: 24, Sedan: 26, SUV: 40.5, Crossover: 77.4 }[carType] ?? 40;
}
function showSpinner(on) {
  const s = document.getElementById('ml-spinner');
  if (s) s.classList.toggle('show', on);
}
function hideResult() {
  const r = document.getElementById('ml-result');
  if (r) r.classList.remove('show');
}
function showMLError(msg) {
  const e = document.getElementById('ml-error');
  if (e) { e.textContent = msg; e.style.display = 'block'; }
}
function clearError() {
  const e = document.getElementById('ml-error');
  if (e) e.style.display = 'none';
}
