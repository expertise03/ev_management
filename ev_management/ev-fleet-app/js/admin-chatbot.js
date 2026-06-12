/* ===== FleetPulse Admin Chatbot — self-contained ===== */
(function () {
  'use strict';

  var isOpen = false;

  function init() {
    var fab   = document.getElementById('chatFab');
    var close = document.getElementById('chatClose');
    var send  = document.getElementById('chatSend');
    var input = document.getElementById('chatInput');

    if (!fab) return;

    fab.addEventListener('click', toggle);
    if (close) close.addEventListener('click', toggle);
    if (send)  send.addEventListener('click', submit);
    if (input) input.addEventListener('keydown', function(e){ if(e.key==='Enter') submit(); });

    document.querySelectorAll('.cc').forEach(function(btn){
      btn.addEventListener('click', function(){
        var q = btn.getAttribute('data-q') || btn.textContent;
        hideChips();
        doQuery(q.replace(/^[^\w₹]+/,'').trim() || q.trim());
      });
    });
  }

  function toggle() {
    isOpen = !isOpen;
    var panel = document.getElementById('chatPanel');
    var fab   = document.getElementById('chatFab');
    if (!panel) return;
    if (isOpen) {
      panel.style.transform = 'translateY(0)';
      if (fab) fab.style.background = '#0f5c49';
      setTimeout(function(){
        var i = document.getElementById('chatInput');
        if (i) i.focus();
      }, 340);
    } else {
      panel.style.transform = 'translateY(calc(100% + 10px))';
      if (fab) fab.style.background = '#1a7f64';
    }
  }

  function hideChips() {
    var c = document.getElementById('chatChips');
    if (c) c.style.display = 'none';
  }

  function submit() {
    var input = document.getElementById('chatInput');
    if (!input) return;
    var msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    hideChips();
    doQuery(msg);
  }

  function doQuery(msg) {
    appendMsg('user', msg);
    var typing = document.getElementById('chatTyping');
    if (typing) typing.style.display = 'block';
    var delay = 320 + Math.min(msg.length * 16, 750);
    setTimeout(function(){
      if (typing) typing.style.display = 'none';
      appendMsg('bot', answer(msg.toLowerCase()));
    }, delay);
  }

  function appendMsg(role, html) {
    var msgs = document.getElementById('chatMsgs');
    if (!msgs) return;
    var div = document.createElement('div');
    div.className = 'cm ' + role;
    div.innerHTML = html;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── Answer engine ── */
  function answer(q) {
    var d = (typeof filteredData !== 'undefined' && filteredData.length) ? filteredData : [];
    var mgrId = (typeof CURRENT_MGR_ID !== 'undefined') ? CURRENT_MGR_ID : 'MGR';

    function s(k){ return d.reduce(function(t,r){ return t+(+r[k]||0); },0); }
    function av(k){ return d.length ? s(k)/d.length : 0; }
    function fR(n){ return '₹'+Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
    function fN(n){ return Number(n).toFixed(1); }

    if (!d.length) return '⚠️ Dashboard data is still loading. Please wait and try again.';

    // Fleet overview
    if (/fleet|overview|summary|status/.test(q)) {
      var vids = new Set(d.map(function(r){return r.vehicle_id;}));
      return '📊 <strong>Fleet Summary — '+mgrId+'</strong><br>' +
        '🚗 Total vehicles: <strong>'+vids.size+'</strong><br>' +
        '📦 Total trips: <strong>'+d.length+'</strong><br>' +
        '💰 Total revenue: <strong>'+fR(s('total_trip_cost'))+'</strong><br>' +
        '🧠 Avg driver score: <strong>'+fN(av('driver_score'))+'</strong><br>' +
        '⚡ Avg energy/trip: <strong>'+fN(av('energy_consumed_kwh'))+' kWh</strong>';
    }

    // Revenue
    if (/revenue|income|profit/.test(q)) {
      var bv={};
      d.forEach(function(r){ bv[r.vehicle_id]=(bv[r.vehicle_id]||0)+(+r.total_trip_cost||0); });
      var top=Object.entries(bv).sort(function(a,b){return b[1]-a[1];})[0];
      return '💰 <strong>Revenue Analysis</strong><br>' +
        '📈 Total: <strong>'+fR(s('total_trip_cost'))+'</strong><br>' +
        '📊 Avg per trip: <strong>'+fR(av('total_trip_cost'))+'</strong><br>' +
        '🏆 Top vehicle: <strong>'+(top?top[0]+' ('+fR(top[1])+')':'—')+'</strong><br>' +
        'See the <em>Revenue</em> tab for full trend charts.';
    }

    // Driver scores
    if (/driver|score|behaviour|performance/.test(q)) {
      var bd={};
      d.forEach(function(r){ if(!bd[r.driver_id]) bd[r.driver_id]=[]; bd[r.driver_id].push(r.driver_score); });
      var sc=Object.entries(bd).map(function(e){return{id:e[0],avg:e[1].reduce(function(a,b){return a+b;},0)/e[1].length};}).sort(function(a,b){return b.avg-a.avg;});
      return '🧠 <strong>Driver Performance</strong><br>' +
        '⭐ Fleet avg score: <strong>'+fN(av('driver_score'))+'/100</strong><br>' +
        '🏆 Top driver: <strong>'+(sc[0]?sc[0].id+' ('+fN(sc[0].avg)+')':'—')+'</strong><br>' +
        '⚠️ Bottom driver: <strong>'+(sc[sc.length-1]?sc[sc.length-1].id+' ('+fN(sc[sc.length-1].avg)+')':'—')+'</strong><br>' +
        '🛑 Total harsh braking: <strong>'+s('harsh_braking_count')+'</strong><br>' +
        '🚦 Total overspeed: <strong>'+s('overspeed_count')+'</strong>';
    }

    // Maintenance
    if (/maintenance|service|repair/.test(q)) {
      var alerts=d.filter(function(r){return r.maintenance_alert&&r.maintenance_alert!=='None';});
      return '⚙️ <strong>Maintenance Overview</strong><br>' +
        '💰 Total cost: <strong>'+fR(s('maintenance_cost_rs'))+'</strong><br>' +
        '🔔 Active alerts: <strong>'+alerts.length+' trips</strong><br>' +
        '📊 Avg cost/trip: <strong>'+fR(av('maintenance_cost_rs'))+'</strong><br>' +
        'See the <em>Maintenance</em> tab for vehicle breakdown.';
    }

    // Overspeed
    if (/overspeed|violation|speed/.test(q)) {
      var bdo={};
      d.forEach(function(r){ bdo[r.driver_id]=(bdo[r.driver_id]||0)+(+r.overspeed_count||0); });
      var worst=Object.entries(bdo).sort(function(a,b){return b[1]-a[1];})[0];
      return '🚦 <strong>Overspeed Analysis</strong><br>' +
        '⚡ Total violations: <strong>'+s('overspeed_count')+'</strong><br>' +
        '🔴 Most violations: <strong>'+(worst?worst[0]+' ('+worst[1]+')':'—')+'</strong><br>' +
        '📊 Avg per trip: <strong>'+fN(av('overspeed_count'))+'</strong><br>' +
        'See <em>Overspeed</em> tab for trend charts.';
    }

    // Charging
    if (/charging|charge/.test(q)) {
      var sess=d.filter(function(r){return r.charging_duration_min>0;}).length;
      return '⚡ <strong>Charging Summary</strong><br>' +
        '💰 Total cost: <strong>'+fR(s('charging_cost_rs'))+'</strong><br>' +
        '🔌 Sessions: <strong>'+sess+'</strong><br>' +
        '⏱️ Total hours: <strong>'+fN(s('charging_duration_min')/60)+' h</strong><br>' +
        '📊 Avg cost: <strong>'+(sess>0?fR(s('charging_cost_rs')/sess):'—')+'</strong>';
    }

    // Battery
    if (/battery|health/.test(q)) {
      var low=d.filter(function(r){return r.battery_health_percent<75;});
      return '🔋 <strong>Battery Health</strong><br>' +
        '📊 Fleet avg: <strong>'+fN(av('battery_health_percent'))+'%</strong><br>' +
        '⚠️ Below 75%: <strong>'+new Set(low.map(function(r){return r.vehicle_id;})).size+' vehicles</strong><br>' +
        '🏎️ Avg tire health: <strong>'+fN(av('tire_health_percent'))+'%</strong>';
    }

    // Energy
    if (/energy|kwh|consumption/.test(q)) {
      return '⚡ <strong>Energy Analysis</strong><br>' +
        '📊 Avg per trip: <strong>'+fN(av('energy_consumed_kwh'))+' kWh</strong><br>' +
        '🔢 Total (all trips): <strong>'+fN(s('energy_consumed_kwh'))+' kWh</strong><br>' +
        '💰 Avg daily cost: <strong>'+fR(av('daily_energy_cost'))+'</strong>';
    }

    // Help
    if (/help|what.*can|command/.test(q)) {
      return '🤖 <strong>I can answer about:</strong><br>' +
        '📊 Fleet overview<br>💰 Revenue<br>🧠 Driver scores<br>' +
        '⚙️ Maintenance<br>🚦 Overspeed<br>⚡ Charging<br>🔋 Battery health';
    }

    if (/^(hi|hello|hey)/.test(q)) {
      return '👋 Hello, '+mgrId+'! Ask about your fleet revenue, drivers, maintenance or overspeed violations.';
    }

    return '🤖 Try asking: fleet overview, revenue, driver scores, maintenance, overspeed or charging statistics.';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
