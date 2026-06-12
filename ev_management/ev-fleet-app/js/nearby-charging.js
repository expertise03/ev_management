// ===== Nearby Charging Stations — Google Maps Embed + Static Data =====

// City → coordinates mapping
const CITY_COORDS = {
  'Kolkata':   { lat:22.5726, lng:88.3639 },
  'Delhi':     { lat:28.6139, lng:77.2090 },
  'Mumbai':    { lat:19.0760, lng:72.8777 },
  'Bangalore': { lat:12.9716, lng:77.5946 },
  'Chennai':   { lat:13.0827, lng:80.2707 },
  'Hyderabad': { lat:17.3850, lng:78.4867 },
  'Pune':      { lat:18.5204, lng:73.8567 },
  'Jaipur':    { lat:26.9124, lng:75.7873 },
  'Ahmedabad': { lat:23.0225, lng:72.5714 },
  'Bhopal':    { lat:23.2599, lng:77.4126 },
  'Nagpur':    { lat:21.1458, lng:79.0882 },
  'Surat':     { lat:21.1702, lng:72.8311 },
  'Lucknow':   { lat:26.8467, lng:80.9462 },
  'Chandigarh':{ lat:30.7333, lng:76.7794 },
  'Kochi':     { lat: 9.9312, lng:76.2673 },
  'Base':      { lat:20.5937, lng:78.9629 },
};

// Nearby charging stations per city (curated real/simulated data)
const CHARGING_STATIONS = {
  'Kolkata':   [
    { name:'Tata Power EV — Salt Lake', dist:'1.2 km', type:'DC Fast (50kW)', slots:4, open:'24/7', status:'Available' },
    { name:'BPCL EV Point — Park Street',dist:'2.8 km', type:'AC Level 2',     slots:2, open:'6am–10pm', status:'Available' },
    { name:'Statiq Station — New Town',  dist:'5.1 km', type:'DC CCS (75kW)',  slots:6, open:'24/7', status:'Busy' },
  ],
  'Delhi':     [
    { name:'Tata Power — Connaught Place', dist:'0.8 km', type:'DC Fast (100kW)', slots:8, open:'24/7', status:'Available' },
    { name:'ChargeZone — Lajpat Nagar',   dist:'3.2 km', type:'AC Level 2',       slots:3, open:'8am–10pm', status:'Available' },
    { name:'EESL Hub — Dwarka',           dist:'7.4 km', type:'DC CCS (50kW)',    slots:5, open:'24/7', status:'Available' },
  ],
  'Mumbai':    [
    { name:'Ather Grid — BKC',           dist:'1.5 km', type:'Fast AC (22kW)',   slots:4, open:'24/7', status:'Available' },
    { name:'BPCL EV — Bandra',           dist:'2.6 km', type:'DC Fast (50kW)',   slots:3, open:'24/7', status:'Available' },
    { name:'Statiq — Andheri',           dist:'4.8 km', type:'DC CCS (75kW)',    slots:6, open:'24/7', status:'Busy' },
  ],
  'Bangalore': [
    { name:'BESCOM Hub — MG Road',       dist:'0.9 km', type:'DC Fast (60kW)',   slots:5, open:'24/7', status:'Available' },
    { name:'Fortum Charge — Koramangala',dist:'2.4 km', type:'AC Level 2',       slots:3, open:'7am–11pm', status:'Available' },
    { name:'Tata Power — Whitefield',    dist:'6.1 km', type:'DC CCS (100kW)',   slots:8, open:'24/7', status:'Available' },
  ],
  'Chennai':   [
    { name:'TANGEDCO Hub — Anna Nagar',  dist:'1.1 km', type:'DC Fast (50kW)',   slots:4, open:'24/7', status:'Available' },
    { name:'ChargeZone — T Nagar',       dist:'2.9 km', type:'AC Level 2',       slots:2, open:'8am–10pm', status:'Busy' },
    { name:'Statiq — OMR',               dist:'5.7 km', type:'DC CCS (75kW)',    slots:6, open:'24/7', status:'Available' },
  ],
  'Hyderabad': [
    { name:'Tata Power — HITEC City',   dist:'1.4 km', type:'DC Fast (60kW)',   slots:5, open:'24/7', status:'Available' },
    { name:'BPCL EV — Jubilee Hills',   dist:'3.1 km', type:'AC Level 2',       slots:3, open:'7am–10pm', status:'Available' },
    { name:'ChargeZone — Gachibowli',   dist:'4.5 km', type:'DC CCS (100kW)',   slots:8, open:'24/7', status:'Busy' },
  ],
};

// Default fallback stations
const DEFAULT_STATIONS = [
  { name:'Nearest Tata Power EV Hub',  dist:'~2 km',  type:'DC Fast (50kW)',  slots:4, open:'24/7', status:'Available' },
  { name:'ChargeZone Station',          dist:'~4 km',  type:'AC Level 2',      slots:2, open:'8am–10pm', status:'Available' },
  { name:'Statiq Fast Charger',         dist:'~6 km',  type:'DC CCS (75kW)',   slots:6, open:'24/7', status:'Available' },
];

// Initialise when nearby tab is activated
document.addEventListener('DOMContentLoaded', () => {
  // Hook into switchTab to init map when nearby tab is opened
  const origSwitch = window.switchTab;
  window.switchTab = function(name, el) {
    origSwitch(name, el);
    if (name === 'nearby') initNearbyCharging();
  };
});

function initNearbyCharging() {
  const s = getSession();
  const driverId = s?.id || 'DR0001';
  const DRIVER_DATA_REF = typeof DRIVER_DATA !== 'undefined' ? DRIVER_DATA : {};
  const DEMO = typeof DEMO_DATA !== 'undefined' ? DEMO_DATA : {};
  const d = DRIVER_DATA_REF[driverId] || DEMO;
  const city = d.startLoc || 'Delhi';
  const coords = CITY_COORDS[city] || CITY_COORDS['Delhi'];

  // Update header
  const locEl = document.getElementById('nearbyCurrentLoc');
  if (locEl) locEl.textContent = city;

  // KPI cards
  const stations = CHARGING_STATIONS[city] || DEFAULT_STATIONS;
  const available = stations.filter(s => s.status === 'Available').length;
  const nearest   = stations[0]?.dist || '—';
  const nc = document.getElementById('nearbyStats');
  if (nc) nc.innerHTML = [
    { val: stations.length,     lbl: 'Stations Nearby',  color:'#38bdf8' },
    { val: available,            lbl: 'Available Now',    color:'#22c55e' },
    { val: nearest,              lbl: 'Nearest Distance', color:'#a78bfa' },
    { val: d.battPct+'%',        lbl: 'Current Battery',  color: d.battPct>50?'#22c55e':d.battPct>20?'#fbbf24':'#f43f5e' },
  ].map(c=>`<div class="stat-card">
    <div class="stat-info">
      <div class="val" style="color:${c.color}">${c.val}</div>
      <div class="lbl">${c.lbl}</div>
    </div></div>`).join('');

  // Load Google Maps embed (search for EV charging near city)
  const mapIframe = document.getElementById('charging-map-iframe');
  if (mapIframe) {
    const query = encodeURIComponent(`EV charging station near ${city} India`);
    mapIframe.src = `https://maps.google.com/maps?q=${query}&output=embed&z=13`;
  }

  // Station list
  const listEl = document.getElementById('nearbyStationsList');
  if (listEl) {
    listEl.innerHTML = stations.map((st, i) => `
      <div class="station-card" onclick="openMapsForStation('${city}','${st.name}')">
        <div class="station-dot">${i+1}</div>
        <div style="flex:1">
          <div class="station-name">${st.name}</div>
          <div class="station-meta">${st.type} &bull; ${st.slots} slots &bull; ${st.open}</div>
          <div class="station-meta" style="margin-top:.15rem">
            <span style="color:${st.status==='Available'?'#22c55e':'#fb923c'};font-weight:700">${st.status}</span>
          </div>
        </div>
        <div class="station-dist">${st.dist}</div>
      </div>`).join('');
  }
}

function openMapsForStation(city, stationName) {
  const query = encodeURIComponent(`${stationName} ${city}`);
  window.open(`https://www.google.com/maps/search/${query}`, '_blank');
}
