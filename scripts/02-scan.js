/* ============================================================
   THE SCAN  ·  an instrument investigating a specimen
   Not a progress bar. It descends, catches on each fracture,
   pauses to register it, reveals it after the pause, and
   lingers longest at the worst. Meaning is fixed; the texture
   of the motion breathes, seeded fresh each session.
   ============================================================ */
(function(){
  // per-session seed — a reload genuinely differs, bounded so it never looks random
  var SEED = (Date.now() ^ (Math.random()*0x100000000)) >>> 0;
  function rng(s){ return function(){ s|=0; s=s+0x6D2B79F5|0; var t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; }; }
  var rand = rng(SEED);
  function jitter(base, spread){ return base + (rand()-0.5)*2*spread; }

  var SEV_ORDER = { high:3, med:2, low:1 };
  // base dwell at a fracture, by severity (ms) — the instrument stops longer at worse damage
  var SEV_DWELL = { high:640, med:420, low:280 };
  var SEV_COLOR = { high:'#FF7A59', med:'#E8B24A', low:'#7FB0E0' };

  /* The line physically sweeps top-to-bottom (an instrument can't teleport),
     so encounter order follows y. Two things carry meaning and stay fixed:
     the DWELL at each fracture scales with severity (it lingers at worse damage),
     and the WORST fracture gets a bonus lingering pass at the end. The only
     thing that wanders is the reveal order among fractures at nearly the same
     height and the same severity — genuine ties, where nature would vary. */
  function sweepStops(fractures, geom){
    var items = fractures.map(function(f){
      return { f:f, y:geom.midY(f), sev:SEV_ORDER[f.severity]||1,
               dwell: jitter(SEV_DWELL[f.severity]||280, 55) };
    });
    // physical order: down the specimen; ties (same band, same severity) wander
    items.sort(function(a,b){
      var dy=a.y-b.y;
      if(Math.abs(dy) > 30) return dy;
      if(a.sev!==b.sev) return b.sev-a.sev;
      return rand()-0.5;
    });
    // the worst fracture (highest severity, break ties by lowest) is the finale
    var worst = items.slice().sort(function(a,b){
      if(b.sev!==a.sev) return b.sev-a.sev;
      return b.y-a.y;
    })[0];
    return { stops:items, worst:worst.f };
  }

  /* run the scan. callbacks let the table light fractures at the right beat. */
  function run(opts){
    var geom = opts.geom;                 // { midY(fracture), top, bottom }
    var fractures = opts.fractures||[];
    var onScanY = opts.onScanY||function(){};      // move the scan line
    var onCatch = opts.onCatch||function(){};      // instrument hesitates at a fracture
    var onReveal = opts.onReveal||function(){};    // fracture lights AFTER the pause
    var onPulse = opts.onPulse||function(){};      // breathing glow, per-frame
    var onSettle = opts.onSettle||function(){};    // done: retract and rest
    var onDone = opts.onDone||function(){};

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){
      // no theatre: reveal everything, no motion
      fractures.forEach(function(f){ onReveal(f); });
      onDone(); return { cancel:function(){} };
    }

    var sweep = sweepStops(fractures, geom);
    var stops = sweep.stops, worstF = sweep.worst;
    var top = geom.top, bottom = geom.bottom;
    var descendMs = jitter(2600, 180);
    var start = performance.now();
    var cancelled = false;

    var stopIdx = 0, holding = false, holdUntil = 0, revealed = [];

    // breathing pulse — its own slow cycle, seeded so no two sessions lock together
    var pulsePhase = rand()*Math.PI*2;

    function frame(now){
      if(cancelled) return;
      // pulse breathes continuously over whatever is already revealed
      var breath = 0.72 + Math.sin((now/1000)*1.6 + pulsePhase)*0.16 + Math.sin((now/1000)*0.7)*0.06;
      onPulse(revealed, breath);

      if(holding){
        if(now >= holdUntil){
          // the pause ends → NOW the fracture is revealed (discovery, not playback)
          var s = stops[stopIdx];
          if(revealed.indexOf(s.f)<0){ revealed.push(s.f); onReveal(s.f); }
          holding = false; stopIdx++;
        }
        // while holding, the line sits at the fracture's y
        onScanY(stops[Math.min(stopIdx,stops.length-1)] ? stops[Math.min(stopIdx,stops.length-1)].y : bottom, true);
        requestAnimationFrame(frame);
        return;
      }

      // descending
      var elapsed = now - start;
      var y = top + (bottom-top) * Math.min(1, elapsed/descendMs);

      // did we reach the next fracture? → catch and hesitate
      if(stopIdx < stops.length && y >= stops[stopIdx].y){
        holding = true; holdUntil = now + stops[stopIdx].dwell;
        onCatch(stops[stopIdx].f);           // the visible hesitation cue
        onScanY(stops[stopIdx].y, true);
        requestAnimationFrame(frame);
        return;
      }

      onScanY(y, false);

      if(elapsed < descendMs || stopIdx < stops.length){
        requestAnimationFrame(frame);
      } else {
        // reached the bottom and everything found → settle
        settle(now);
      }
    }

    function settle(now){
      // lingers a last beat on the WORST fracture, then retracts and rests
      var finale = { f: worstF };
      var settleStart = now, dwell = jitter(520, 60);
      (function s(t){
        if(cancelled) return;
        var k = Math.min(1,(t-settleStart)/dwell);
        var breath = 0.9 + Math.sin((t/1000)*2.2)*0.1*(1-k);
        onPulse(revealed, breath);
        // retract: the line eases back up a touch, like an instrument releasing
        onScanY(bottom - k* ( (bottom-top)*0.06 ), true);
        if(k<1) requestAnimationFrame(s);
        else { onSettle(finale.f); onDone(); }
      })(now);
    }

    requestAnimationFrame(frame);
    return { cancel:function(){ cancelled=true; } };
  }

  window.AvishaScan = { run:run, seed:function(){ return SEED; } };
})();
