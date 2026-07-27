/* ============================================================
   THE EXAMINATION  ·  X-Ray choreography
   Wires three frozen engines into one moment:
     diagnostic (truth) → scan (protagonist) → material + modules.
   The scan LOOKS (beam steady), becomes UNCERTAIN at a seam
   (beam narrows, wall quiets, a measurement gap of silence),
   then becomes CERTAIN (the fracture ignites from within the
   concrete, one mechanical tick, the two modules machine up).
   Nothing performs. The instrument measures, then reports.
   No fracture glows before it is confirmed. No module lifts
   before its seam is found. Every motion has a cause.
   ============================================================ */
(function(){

  // module id -> normalized centre on the wall (x in aspect units, y in 0..1)
  // filled at wire time from the SVG table geometry so material + modules align.
  var NODE={};

  function seamMidpoint(a,b){
    var A=NODE[a],B=NODE[b];
    if(!A||!B) return null;
    return {a:[A.x,A.y], b:[B.x,B.y]};
  }

  /* measurement gap: how long the instrument holds, uncertain, before it is
     certain. Scales with severity — it takes longer to be sure of a worse
     fault. Calm, deliberate; not a loading spinner. */
  var MEASURE={ high:900, med:680, low:520 };

  function run(opts){
    var material=opts.material;      // XrayMaterial (may be null → SVG-only glow)
    var table=opts.table;            // AvishaXray (modules)
    var diagnosis=opts.diagnosis;    // { fractures:[], primary }
    var sound=opts.sound;            // AvishaSound (may be null)
    var setRail=opts.setRail||function(){};
    var setStatus=opts.setStatus||function(){};
    var onComplete=opts.onComplete||function(){};

    var fractures=diagnosis.fractures||[];
    if(!fractures.length){
      setStatus('Structure sound'); setRail('report');
      onComplete(); return;
    }

    // hand the scan engine ONLY geometry + severity — it owns the ordering,
    // the worst-last finale, and the bounded per-session variation (frozen).
    var geom={
      top:0.06, bottom:0.94,
      midY:function(f){ var m=NODE[f.from], n=NODE[f.to]; return (m.y+n.y)/2; }
    };

    setRail('scan'); setStatus('Scanning');
    if(sound) sound.hum(true);

    var measuring=false;

    window.AvishaScan.run({
      geom:geom,
      fractures:fractures,

      // LOOKING — the beam rakes down, steady. material shows it moving.
      onScanY:function(y,holding){
        if(material){ material.setScan(y); }
        if(table && table.setScanY) table.setScanY(y,holding);
        // while measuring, the beam narrows and the wall quiets (handled in onCatch)
      },

      // ARRIVE + UNCERTAIN — the instrument catches the seam and MEASURES.
      // We insert a deliberate gap here before the frozen engine's reveal fires.
      onCatch:function(f){
        measuring=true;
        setStatus('Measuring');   setRail('detect');
        // narrow the beam, pull the ambient glow down — concentration
        if(material){ material.setBeamNarrow(true); material.setFracAmt(0.0); }
        if(sound){ sound.hum(true,0.4); }   // hum thins — held breath
      },

      // CERTAIN — the frozen engine reveals AFTER its pause. Now the fracture
      // ignites from inside the concrete; one tick; the two modules rise.
      onReveal:function(f){
        measuring=false;
        // ignition from within: ramp the material glow up through the stone depth
        igniteFracture(material, f);
        // bold vector crack over the slab (matches the reference; GPU-independent)
        if(table && table.revealFracture) table.revealFracture(f);
        if(table){
          // the two modules respond to the FINDING, not the looking
          if(table.machineUp){ table.machineUp(f.from); table.machineUp(f.to); }
        }
        if(sound){ sound.tick(); sound.hum(true,1.0); }
        if(material){ material.setBeamNarrow(false); }
        setStatus('Fracture confirmed');
      },

      onPulse:function(revealed,breath){
        if(material) material.breathe(revealed, breath);
      },

      // FINALE — the Primary Failure Point holds illuminated; the rest cool.
      onSettle:function(worst){
        setRail('analyze');
        if(table && table.coolExamined) table.coolExamined();
        // keep the primary burning
        if(material) material.setPrimary(worst);
      },

      onDone:function(){
        setStatus('Primary failure point isolated');
        setRail('report');
        if(sound) sound.hum(false);
        onComplete(diagnosis.primary);
      }
    });
  }

  /* ignition from within: the glow does not snap on. It rises from deep in
     the concrete to the surface over ~520ms, then holds. */
  function igniteFracture(material, f){
    if(!material) return;
    var seg=seamMidpoint(f.from,f.to); if(!seg) return;
    material.addFracture({ a:seg.a, b:seg.b, seed:(f.from.length*7+f.to.length*13),
                           severity:f.severity, primary:!!f.primary });
    var t0=performance.now();
    (function rise(t){
      var k=Math.min(1,(t-t0)/520);
      // ease that reads as heat surfacing, not a linear fade
      var e = k*k*(3-2*k);
      material.setFractureDepth(f, e);
      if(k<1) requestAnimationFrame(rise);
    })(t0);
  }

  window.AvishaExamination={ run:run, setNodes:function(n){ NODE=n; } };
})();
