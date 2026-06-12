/* ===== FleetPulse Driver Chatbot — self-contained ===== */
(function () {
  'use strict';

  var isOpen = false;

  function init() {
    var fab   = document.getElementById('chatFab');
    var close = document.getElementById('chatClose');
    var send  = document.getElementById('chatSend');
    var input = document.getElementById('chatInput');

    if (!fab) return;   // not on this page

    fab.addEventListener('click', toggle);
    if (close) close.addEventListener('click', toggle);
    if (send)  send.addEventListener('click', submit);
    if (input) input.addEventListener('keydown', function(e){ if(e.key==='Enter') submit(); });

    // Wire chip buttons
    var chips = document.querySelectorAll('.cc');
    chips.forEach(function(btn){
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
      var reply = answer(msg.toLowerCase());
      appendMsg('bot', reply);
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
    var s = (typeof getSession === 'function') ? getSession() : {};
    var id = s.id || 'DR0001';
    var DR = (typeof DRIVER_DATA !== 'undefined') ? DRIVER_DATA : {};
    var DEMO = (typeof DEMO_DATA !== 'undefined') ? DEMO_DATA : {};
    var d = DR[id] || DEMO;
    if (!d) return '⚠️ Driver data not loaded yet. Please wait and try again.';

    function fR(n){ return '₹' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
    function fN(n,dc){ return Number(n).toFixed(dc||1); }

    // Battery
    if (/battery|charge|power|level/.test(q)) {
      var ok = d.battPct>50?'✅':d.battPct>20?'⚠️':'🔴';
      return '🔋 <strong>Battery Status</strong><br>' +
        ok+' Level: <strong>'+d.battPct+'%</strong><br>' +
        '❤️ Health: <strong>'+d.battHealth+'%</strong><br>' +
        '🌡️ Temp: <strong>'+d.battTemp+'°C</strong> | Voltage: <strong>'+d.battVolt+'V</strong><br>' +
        '🔌 Status: <strong>'+d.chargingStatus+'</strong><br>' +
        '🛣️ Est. Range: <strong>'+fN(d.range)+' km</strong><br>' +
        (d.battPct<25 ? '⚠️ <em>Charge soon! Visit Nearby Charging tab.</em>' : '✅ Sufficient charge for your trip.');
    }

    // Score / behaviour
    if (/score|safety|behaviour|driving|harsh|brake|accel|rating/.test(q)) {
      var rating = d.score>=85?'🏆 Excellent':d.score>=70?'👍 Good':d.score>=55?'⚠️ Average':'🔴 Risky';
      return '🧠 <strong>Driving Score: '+fN(d.score)+'/100</strong> — '+rating+'<br><br>' +
        '🛑 Harsh Braking: <strong>'+d.harshBraking+' events</strong> '+(d.harshBraking>10?'🔴':d.harshBraking>5?'🟡':'✅')+'<br>' +
        '🚀 Sudden Accel: <strong>'+d.suddenAccel+' events</strong> '+(d.suddenAccel>10?'🔴':d.suddenAccel>5?'🟡':'✅')+'<br>' +
        '⚡ Overspeed: <strong>'+d.overspeed+' events</strong> '+(d.overspeed>5?'🔴':d.overspeed>2?'🟡':'✅')+'<br><br>' +
        '💡 <em>Tip: '+(d.harshBraking>d.overspeed?'Brake gradually — anticipate stops 3s ahead.':'Stay within speed limits to protect your score.')+'</em>';
    }

    // Range
    if (/range|how far|distance|km/.test(q)) {
      var ok2 = d.range >= d.routeDist;
      return '🛣️ <strong>Range Analysis</strong><br>' +
        '🔋 Remaining range: <strong>'+fN(d.range)+' km</strong><br>' +
        '📍 Route distance: <strong>'+d.routeDist+' km</strong><br>' +
        (ok2 ? '✅ <strong>Enough charge</strong> to complete your trip.' : '⚠️ <strong>Charge needed!</strong> You may not reach your destination.')+'<br><br>' +
        '💡 Use <em>Range Predictor</em> tab for ML-based estimate.';
    }

    // Maintenance
    if (/maintenance|service|repair|tire|tyre|alert/.test(q)) {
      var servOk = d.lastService < 180;
      return '⚙️ <strong>Maintenance Status</strong><br>' +
        '🔧 Alert: <strong>'+(d.maintAlert!=='None'?'⚠️ '+d.maintAlert:'✅ None')+'</strong><br>' +
        '📅 Last service: <strong>'+d.lastService+' days ago</strong> '+(servOk?'✅':'🔴 OVERDUE')+'<br>' +
        '🏎️ Tire health: <strong>'+d.tireHealth+'%</strong> '+(d.tireHealth<60?'🔴':d.tireHealth<75?'🟡':'✅')+'<br>' +
        '💰 Last cost: <strong>'+fR(d.maintCost)+'</strong><br>' +
        (!servOk ? '🚨 <em>Book a service — overdue maintenance voids warranty.</em>' : '✅ Next service in '+Math.max(0,180-d.lastService)+' days.');
    }

    // Trip / route
    if (/trip|route|destination|eta|from|to/.test(q)) {
      return '📍 <strong>Current Trip</strong><br>' +
        '🗺️ Route: <strong>'+d.startLoc+' → '+d.dest+'</strong><br>' +
        '📏 Covered: <strong>'+fN(d.dist)+' km</strong> of <strong>'+d.routeDist+' km</strong><br>' +
        '⏱️ Duration: <strong>'+d.duration+' min</strong> | ETA: <strong>'+d.eta+' min</strong><br>' +
        '🚦 Traffic: <strong>'+d.traffic+'</strong> | 🌤️ Weather: <strong>'+d.weather+'</strong><br>' +
        '🛣️ Road: <strong>'+d.roadType+'</strong> | ⛽ Charging stops: <strong>'+d.chargingStops+'</strong>';
    }

    // Cost / money
    if (/cost|money|revenue|income|expense/.test(q)) {
      return '💰 <strong>Financial Summary</strong><br>' +
        '🚗 Trip cost: <strong>'+fR(d.tripCost)+'</strong><br>' +
        '📅 Daily cost: <strong>'+fR(d.dailyCost)+'</strong><br>' +
        '📆 Monthly cost: <strong>'+fR(d.monthlyCost)+'</strong><br>' +
        '📍 Cost per km: <strong>'+fR(d.costPerKm)+'</strong><br>' +
        '🔌 Charging cost: <strong>'+fR(d.chargeCost)+'</strong><br>' +
        '💵 Monthly income: <strong>'+fR(d.income)+'</strong>';
    }

    // Charging station
    if (/station|charging station|nearest|nearby|where.*charge/.test(q)) {
      return '⚡ <strong>Nearest Charging Stations</strong><br>' +
        '📍 Near: <strong>'+d.startLoc+'</strong><br>' +
        '🔋 Battery: <strong>'+d.battPct+'%</strong> (~'+fN(d.range)+' km range)<br><br>' +
        '🗺️ Open the <strong>Nearby Charging</strong> tab to see live station availability on a map.';
    }

    // Speed
    if (/speed|fast|slow/.test(q)) {
      return '🚀 <strong>Speed: '+d.speed+' km/h</strong><br>' +
        (d.speed>100 ? '⚠️ High speed — reducing to 80–90 km/h saves up to 30% more range.' :
         d.speed<15 ? '🐢 Very low speed — possible traffic or stopped.' :
         '✅ Speed is in an efficient EV driving range.');
    }

    // Energy
    if (/energy|efficiency|kwh|consumption/.test(q)) {
      return '⚡ <strong>Energy: '+fN(d.energyKwh)+' kWh</strong> this trip<br>' +
        '📊 Rate: <strong>'+fN(d.energyKwh/Math.max(d.dist,1)*100,2)+' kWh/100km</strong><br>' +
        '⚙️ Motor efficiency: <strong>'+d.motorEff+'%</strong><br>' +
        '🌡️ Motor temp: <strong>'+d.motorTemp+'°C</strong>';
    }

    // ML / predictor
    if (/ml|model|predict|machine|ai|accuracy/.test(q)) {
      return '🤖 <strong>Range Predictor Model</strong><br>' +
        '📊 Algorithm: Random Forest Regression<br>' +
        '🎯 Accuracy: <strong>85.4% R²</strong><br>' +
        '📦 Trained on: <strong>5,000 trip records</strong><br>' +
        '🔑 Key feature: Battery % (~56% importance)<br><br>' +
        'Go to <strong>Range Predictor</strong> tab to run a prediction.';
    }

    // Help
    if (/help|what.*can|command/.test(q)) {
      return '🤖 <strong>I can help with:</strong><br>' +
        '🔋 Battery status &amp; health<br>' +
        '🧠 Driving score &amp; tips<br>' +
        '🛣️ Range &amp; trip details<br>' +
        '⚙️ Maintenance alerts<br>' +
        '💰 Costs &amp; revenue<br>' +
        '⚡ Charging stations<br>' +
        '📊 Energy consumption';
    }

    // Greeting
    if (/^(hi|hello|hey|good)/.test(q)) {
      var h = new Date().getHours();
      var g = h<12?'Good morning':h<17?'Good afternoon':'Good evening';
      return g+'! 👋 Ask about your battery, score, trip, maintenance or costs.';
    }

    return '🤖 I can help with battery, driving score, trips, maintenance, costs and charging stations. What would you like to know?';
  }

  // Init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
