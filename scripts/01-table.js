/* ============================================================
   THE EXAMINATION TABLE  ·  X-Ray  (v2 — etched slate)
   Rest: the business engraved into one dark slab.
   Investigation: the scan machines each system up into titanium,
   holds, then cools it back to slate keeping a residual sheen.
   Fractures reveal against raised metal, then remain in the slate.
   ============================================================ */
(function(){
  var NS='http://www.w3.org/2000/svg';
  var W=620,H=834;   // 5 row-bands (4 full rows + centred ANALYTICS)
  var table,svg,slabG,tileG,fractureG,scanG,labelG,emptyMsg;
  var tiles={},machined={},machTimers={},coolingLocked={},onSelect=null;

  // ids preserved (ops, accounts) so the diagnostic SEAMS logic is untouched;
  // only display labels change + ANALYTICS added (centred 5th row) to match the reference.
  var SYSTEMS=[
    {id:'website',label:'WEBSITE',col:0,row:0},{id:'crm',label:'CRM',col:1,row:0},{id:'social',label:'SOCIAL MEDIA',col:2,row:0},
    {id:'email',label:'EMAIL',col:0,row:1},{id:'orders',label:'ORDERS',col:1,row:1},{id:'inventory',label:'INVENTORY',col:2,row:1},
    {id:'payments',label:'PAYMENTS',col:0,row:2},{id:'ops',label:'ERP',col:1,row:2},{id:'shipping',label:'SHIPPING',col:2,row:2},
    {id:'reporting',label:'REPORTING',col:0,row:3},{id:'accounts',label:'ACCOUNTING',col:1,row:3},{id:'support',label:'SUPPORT',col:2,row:3},
    {id:'analytics',label:'ANALYTICS',col:1,row:4}
  ];

  // ---- glow palette (the ONLY thing that differs between Version A / B) ----
  var GLOW = (window.XRAY_GLOW==='gold') ? 'gold' : 'blue';
  var GC = (GLOW==='gold')
    ? { hi:'#FFB454', mid:'#F0982E', lo:'#FFC978', core:'#FFF0D2' }   // warm molten gold
    : { hi:'#5FB4FF', mid:'#3E93E6', lo:'#9AD6FF', core:'#EAF7FF' };  // electric blue/white

  function e(n,a,t){var x=document.createElementNS(NS,n);for(var k in a)x.setAttribute(k,a[k]);if(t!=null)x.textContent=t;return x;}
  var MX=44,MY=42,GX=22,GY=18,TW,TH;
  var ROWS=5;   // 4 full rows + centred ANALYTICS
  function layout(){TW=(W-MX*2-GX*2)/3;TH=(H-MY*2-GY*(ROWS-1))/ROWS;}
  function pos(s){return {x:MX+s.col*(TW+GX),y:MY+s.row*(TH+GY)};}
  function ctr(s){var p=pos(s);return {x:p.x+TW/2,y:p.y+TH/2};}
  function octa(x,y,w,h,c){c=c||13;return 'M'+(x+c)+' '+y+'H'+(x+w-c)+'L'+(x+w)+' '+(y+c)+'V'+(y+h-c)+'L'+(x+w-c)+' '+(y+h)+'H'+(x+c)+'L'+x+' '+(y+h-c)+'V'+(y+c)+'Z';}

  function mkRng(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function fracturePath(ax,ay,bx,by,seed){
    var r=mkRng(seed);
    var pts=[[ax,ay]],steps=7+Math.floor(r()*4);
    var nx=-(by-ay),ny=(bx-ax),nl=Math.hypot(nx,ny)||1; nx/=nl; ny/=nl;
    for(var i=1;i<steps;i++){
      var t=i/steps;
      var off=(r()-0.5)*30*Math.sin(t*Math.PI);        // widest in the middle, tapers at tiles
      var jag=(r()-0.5)*10;
      pts.push([ax+(bx-ax)*t+nx*off+jag, ay+(by-ay)*t+ny*off+jag]);
    }
    pts.push([bx,by]);
    return 'M'+pts.map(function(p){return p[0].toFixed(1)+' '+p[1].toFixed(1);}).join('L');
  }
  // short branching splinters off the main crack
  function fractureBranches(ax,ay,bx,by,seed){
    var r=mkRng(seed*7+3),out=[];
    var n=1+Math.floor(r()*2);
    for(var i=0;i<n;i++){
      var t=0.3+r()*0.4;
      var sx=ax+(bx-ax)*t, sy=ay+(by-ay)*t;
      var ang=Math.atan2(by-ay,bx-ax)+(r()<0.5?1:-1)*(0.6+r()*0.5);
      var len=8+r()*12;
      out.push('M'+sx.toFixed(1)+' '+sy.toFixed(1)+'L'+(sx+Math.cos(ang)*len).toFixed(1)+' '+(sy+Math.sin(ang)*len).toFixed(1));
    }
    return out;
  }

  function glyph(id){
    var G={website:'M2 8H14M8 2V14M3 5H13M3 11H13',crm:'M8 3A2.5 2.5 0 1 1 8 8A2.5 2.5 0 1 1 8 3M2.5 14A5.5 5.5 0 0 1 13.5 14',
      social:'M4 8A2 2 0 1 1 4 8.01M12 4A2 2 0 1 1 12 4.01M12 12A2 2 0 1 1 12 12.01M5.7 7L10.3 5M5.7 9L10.3 11',
      email:'M1 3H15V13H1Z M1 3L8 9L15 3',orders:'M2 3H13L12 12H3Z',inventory:'M8 1L15 5V12L8 16L1 12V5Z M1 5L8 9L15 5M8 9V16',
      payments:'M1 4H15V12H1Z M1 7H15M3 10H6',ops:'M8 5.5A2.5 2.5 0 1 1 8 10.5A2.5 2.5 0 1 1 8 5.5M8 1V3M8 13V15M1 8H3M13 8H15',
      shipping:'M1 5H10V12H1Z M10 7H13L15 9V12H10Z',reporting:'M2 14V8H5V14M7 14V3H10V14M12 14V6H15V14',
      accounts:'M3 1H13V15L11 13L9 15L7 13L5 15L3 13Z M6 5H10M6 8H10',support:'M8 2A5 5 0 0 1 13 7V10A2 2 0 0 1 11 12M3 7A5 5 0 0 1 8 2',
      analytics:'M2 2V14H14M5 11L8 7.5L10 9.5L13 5'};
    return G[id]||'M2 8H14';
  }

  function defs(){
    var d=e('defs');
    d.innerHTML=
      '<filter id="xSlab" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.016" numOctaves="5" seed="9" result="n"/><feDiffuseLighting in="n" lighting-color="#8d908d" surfaceScale="2.6" diffuseConstant="1" result="l"><feDistantLight id="xSun" azimuth="235" elevation="46"/></feDiffuseLighting><feComposite in="l" in2="SourceGraphic" operator="in"/></filter>'+
      '<filter id="xStonePlate" x="-25%" y="-25%" width="150%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="b"/><feSpecularLighting in="b" surfaceScale="4" specularConstant="0.9" specularExponent="18" lighting-color="#efe9dc" result="s"><feDistantLight azimuth="235" elevation="52"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="so"/><feComposite in="SourceGraphic" in2="so" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/><feDropShadow dx="1.5" dy="2.5" stdDeviation="2.5" flood-color="#3a352b" flood-opacity="0.55"/></filter><filter id="xEtch" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.3" result="b"/><feSpecularLighting in="b" surfaceScale="-3.6" specularConstant="0.85" specularExponent="16" lighting-color="#5C6672" result="s"><feDistantLight azimuth="235" elevation="50"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="so"/><feComposite in="SourceGraphic" in2="so" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/></filter>'+
      '<filter id="xTitanium" x="-30%" y="-30%" width="160%" height="175%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="b"/><feSpecularLighting in="b" surfaceScale="6.2" specularConstant="0.9" specularExponent="26" lighting-color="#E4ECF4" result="s"><feDistantLight azimuth="235" elevation="48"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="so"/><feComposite in="SourceGraphic" in2="so" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/><feDropShadow dx="3" dy="4.5" stdDeviation="4" flood-color="#040506" flood-opacity="0.82"/></filter>'+
      '<filter id="xBrush" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.34" numOctaves="4" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0" result="na"/><feComponentTransfer in="na" result="nt"><feFuncA type="linear" slope="0.5"/></feComponentTransfer><feDiffuseLighting in="n" lighting-color="#9AA4B0" surfaceScale="0.8" diffuseConstant="1.1" result="l"><feDistantLight azimuth="235" elevation="62"/></feDiffuseLighting><feComposite in="l" in2="SourceGraphic" operator="in"/></filter>'+
      '<filter id="xGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>'+
      '<filter id="xGlowBig" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="9"/></filter>'+
      '<linearGradient id="xScanGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD4FF" stop-opacity="0"/><stop offset="0.5" stop-color="#BFE8FF" stop-opacity="0.85"/><stop offset="1" stop-color="#8FD4FF" stop-opacity="0"/></linearGradient>'+
      '<radialGradient id="xVoid"><stop offset="0" stop-color="#101318"/><stop offset="1" stop-color="#0A0B0D"/></radialGradient>';
    return d;
  }

  function init(opts){
    table=document.getElementById('xtable');if(!table)return;
    onSelect=(opts||{}).onSelect||null;
    emptyMsg=document.getElementById('xtableEmpty');
    layout();
    svg=e('svg',{viewBox:'0 0 '+W+' '+H,preserveAspectRatio:'xMidYMid meet'});
    svg.appendChild(defs());
    svg.appendChild(e('rect',{x:0,y:0,width:W,height:H,fill:'url(#xVoid)'}));
    svg.appendChild(e('rect',{x:14,y:14,width:W-28,height:H-28,rx:8,fill:'#8f918e',filter:'url(#xSlab)'}));
    svg.appendChild(e('rect',{x:14,y:14,width:W-28,height:H-28,rx:8,fill:'none',stroke:'#5f625f','stroke-width':'1'}));
    [[26,26],[W-26,26],[26,H-26],[W-26,H-26]].forEach(function(c){svg.appendChild(e('circle',{cx:c[0],cy:c[1],r:2.5,fill:'none',stroke:'#6b6d6a','stroke-width':'1'}));});
    slabG=e('g',{});svg.appendChild(slabG);
    tileG=e('g',{});svg.appendChild(tileG);
    fractureG=e('g',{'pointer-events':'none'});svg.appendChild(fractureG);  // cracks glow OVER the raised tiles
    scanG=e('g',{'pointer-events':'none'});svg.appendChild(scanG);
    labelG=e('g',{'pointer-events':'none'});svg.appendChild(labelG);
    table.appendChild(svg);
    labelG.appendChild(e('text',{x:30,y:34,'font-family':"'Geist Mono',monospace",'font-size':'8.5','letter-spacing':'0.2em',fill:'#4E5763'},'EXAMINATION TABLE X1-A'));
    buildTiles();
  }

  function buildTiles(){
    SYSTEMS.forEach(function(sys){
      var p=pos(sys),c=ctr(sys),d=octa(p.x,p.y,TW,TH);
      var g=e('g',{class:'x-tile',role:'button',tabindex:'0','aria-label':sys.label,style:'cursor:pointer'});
      var lift=e('g',{});   // physical Z: the plate rises out of / sinks into the slab
      g.appendChild(lift);
      var slate=e('g',{opacity:'1'});
      slate.appendChild(e('path',{d:d,fill:'#abaca6',filter:'url(#xStonePlate)'}));
      slate.appendChild(e('path',{d:octa(p.x+6,p.y+6,TW-12,TH-12,10),fill:'none',stroke:'#7d7e79','stroke-width':'0.75'}));
      lift.appendChild(slate);
      var ti=e('g',{opacity:'0'});
      ti.appendChild(e('path',{d:d,fill:'#464D57',filter:'url(#xTitanium)'}));
      ti.appendChild(e('path',{d:d,fill:'#565E69',filter:'url(#xBrush)',opacity:'0.72'}));
      ti.appendChild(e('path',{d:octa(p.x+6,p.y+6,TW-12,TH-12,10),fill:'none',stroke:'rgba(255,255,255,0.16)','stroke-width':'0.75'}));
      ti.appendChild(e('path',{d:'M'+(p.x+13)+' '+p.y+'H'+(p.x+TW-13),stroke:'rgba(240,246,252,0.5)','stroke-width':'1','fill':'none'}));
      lift.appendChild(ti);
      var castShadow=e('path',{d:d,fill:'#040506',opacity:'0',filter:'url(#xGlow)'});
      lift.appendChild(castShadow);
      var sheen=e('path',{d:d,fill:'none',stroke:'#4C6076','stroke-width':'1',opacity:'0'});
      lift.appendChild(sheen);
      var ic=e('g',{transform:'translate('+(c.x-8)+','+(p.y+TH*0.24)+')','pointer-events':'none'});
      var icPath=e('path',{d:glyph(sys.id),fill:'none',stroke:'#565751','stroke-width':'1.2','stroke-linecap':'round','stroke-linejoin':'round'});
      ic.appendChild(icPath);lift.appendChild(ic);
      var lbl=e('text',{x:c.x,y:p.y+TH*0.72,'text-anchor':'middle','pointer-events':'none','font-family':"'Geist Mono',monospace",'font-size':'10','letter-spacing':'0.06em',fill:'#484943'},sys.label);
      lift.appendChild(lbl);
      var hit=e('path',{d:d,fill:'transparent','pointer-events':'all'});
      g.appendChild(hit);
      // instrument states — physical, not UI. Guarded so the scan never fights the hand.
      g.addEventListener('pointerenter',function(){ sense(sys.id,true); });
      g.addEventListener('pointerleave',function(){ sense(sys.id,false); });
      g.addEventListener('pointerdown',function(){ touch(sys.id); });
      g.addEventListener('pointerup',function(){ release(sys.id); if(onSelect)onSelect(sys.id); });
      g.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();touch(sys.id);setTimeout(function(){release(sys.id);if(onSelect)onSelect(sys.id);},90);}});
      tileG.appendChild(g);
      tiles[sys.id]={g:g,lift:lift,slate:slate,ti:ti,sheen:sheen,shadow:castShadow,icon:icPath,label:lbl,
                     examined:false,engaged:false,busy:false,cx:c.x,cy:c.y};
    });
  }

  /* ---- animate the plate's physical rise (z) out of the slab ---- */
  var zTimers={};
  function setZ(id,z){   // z: 0 = flush in slab, 1 = fully machined proud
    var t=tiles[id];if(!t)return;
    var dy=-z*5, sc=1+z*0.012;
    t.lift.setAttribute('transform','translate('+ (t.cx*(1-sc)).toFixed(2) +','+ (dy + t.cy*(1-sc)).toFixed(2) +') scale('+sc.toFixed(4)+')');
    t.shadow.setAttribute('opacity',(z*0.45).toFixed(3));
    t.shadow.setAttribute('transform','translate(0,'+(z*6).toFixed(1)+')');
  }
  function easeZ(id,to,ms,ease){
    var t=tiles[id];if(!t)return;
    if(zTimers[id])cancelAnimationFrame(zTimers[id]);
    var from=t._z||0,t0=performance.now();
    (function step(now){
      var k=Math.min(1,(now-t0)/ms);
      var e = ease==='out'?(1-Math.pow(1-k,3)) : ease==='in'?(k*k) : (k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2);
      var v=from+(to-from)*e; t._z=v; setZ(id,v);
      if(k<1)zTimers[id]=requestAnimationFrame(step);
      else t._z=to;
    })(t0);
  }

  /* ---- SENSING PRESENCE: the material becomes aware of an approaching hand ---- */
  function sense(id,on){
    var t=tiles[id];if(!t||t.busy)return;
    if(t.pressed)return;
    if(on){
      // a whisper — the etch lifts a hair, the icon warms slightly. Not a glow.
      t.ti.setAttribute('opacity', t.engaged? '0.5':'0.14');
      easeZ(id, t.engaged? 0.5 : 0.16, 260, 'out');
      t.icon.setAttribute('stroke', t.engaged? '#B6C7DC' : (t.examined?'#8593A2':'#6E7C8C'));
    } else {
      t.ti.setAttribute('opacity', t.engaged? '0.44':'0');
      easeZ(id, t.engaged? 0.42 : 0, 420, 'out');
      t.icon.setAttribute('stroke', t.engaged? '#A8BCD4' : (t.examined?'#6E7C8C':'#4E5763'));
    }
  }

  /* ---- TOUCHED: contact. the plate takes the press and depresses, like a machined key ---- */
  function touch(id){
    var t=tiles[id];if(!t||t.busy)return;
    t.pressed=true;
    easeZ(id,-0.5,90,'in');   // travel INTO the slab — real key depression
  }
  /* ---- release into ENGAGED (or back to dormant) ---- */
  function release(id){
    var t=tiles[id];if(!t||t.busy)return;
    t.pressed=false;
    // engaged toggles on the actual checkbox state, set by the page after onSelect
    setTimeout(function(){
      if(t.engaged){ engage(id,true); }
      else { easeZ(id, t.examined?0:0.08, 300,'out'); t.ti.setAttribute('opacity',t.examined?'0':'0'); }
    },0);
  }

  /* ---- ENGAGED: committed to the examination, held low-machined ---- */
  function engage(id,on){
    var t=tiles[id];if(!t)return;
    t.engaged=on;
    if(on){
      easeZ(id,0.42,340,'out');
      t.ti.setAttribute('opacity','0.44');
      t.icon.setAttribute('stroke','#A8BCD4');
      t.label.setAttribute('fill','#9DB0C4');
    } else {
      easeZ(id, t.examined?0:0, 460,'out');
      t.ti.setAttribute('opacity','0');
      t.icon.setAttribute('stroke', t.examined?'#6E7C8C':'#4E5763');
      t.label.setAttribute('fill', t.examined?'#7E8A98':'#5A6470');
    }
  }
  function setEngaged(id,on){ engage(id,on); }

  function setMachine(id,k){
    var t=tiles[id];if(!t)return;machined[id]=k;
    t.ti.setAttribute('opacity',(k).toFixed(3));
    t.slate.setAttribute('opacity',(1-k*0.55).toFixed(3));
    t.icon.setAttribute('stroke',k>0.5?'#CFE0F0':(t.examined?'#6E7C8C':'#4E5763'));
    t.label.setAttribute('fill',k>0.5?'#DCE6F2':(t.examined?'#7E8A98':'#5A6470'));
    if(k>0.05)t.sheen.setAttribute('opacity',(Math.min(0.5,k*0.5)).toFixed(3));
    // INVESTIGATING: the plate machines physically proud of the slab
    t._z = 0.42 + k*0.58; setZ(id, t._z);
  }
  function markExamined(id){var t=tiles[id];if(!t)return;t.examined=true;t.engaged=false;
    t.sheen.setAttribute('opacity','0.24');
    t.ti.setAttribute('opacity','0.08');            // a trace of titanium never fully leaves
    t.icon.setAttribute('stroke','#7E8C9C');
    t.label.setAttribute('fill','#8A97A6');}
  function byId(id){for(var i=0;i<SYSTEMS.length;i++)if(SYSTEMS[i].id===id)return SYSTEMS[i];return null;}

  function drawConnectors(lit){
    while(slabG.firstChild)slabG.removeChild(slabG.firstChild);
    SYSTEMS.forEach(function(s){
      if(lit.indexOf(s.id)<0)return;
      SYSTEMS.forEach(function(o){
        var adj=(s.row===o.row&&o.col===s.col+1)||(s.col===o.col&&o.row===s.row+1);
        if(adj&&lit.indexOf(o.id)>-1){var a=ctr(s),b=ctr(o);
          // carved stone trench (recessed channel) — the lightning runs through it
          slabG.appendChild(e('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#0b0b0d','stroke-width':'7','stroke-linecap':'round','opacity':'0.92'}));
          slabG.appendChild(e('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'rgba(255,255,255,0.05)','stroke-width':'8','stroke-linecap':'round'}));
          slabG.appendChild(e('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#040405','stroke-width':'2.6','stroke-linecap':'round'}));
          slabG.appendChild(e('circle',{cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,r:3,fill:'#060607',stroke:'#33343a','stroke-width':'0.6'}));}
      });
    });
  }

  function lightFracture(f){
    var a=byId(f.from),b=byId(f.to);if(!a||!b)return;
    var ca=ctr(a),cb=ctr(b);
    // palette-driven — the ONLY colour difference between Version A / B
    var sev=f.severity==='high'?GC.hi:(f.severity==='med'?GC.mid:GC.lo);
    var hot=GC.core;
    var seed=(f._seed||99991);
    var dd=fracturePath(ca.x,ca.y,cb.x,cb.y,seed);
    var g=e('g',{opacity:'0','class':'x-bolt'});
    // wide soft bloom — reads through the gaps and spills onto tile edges
    g.appendChild(e('path',{d:dd,fill:'none',stroke:sev,'stroke-width':'18',filter:'url(#xGlowBig)',opacity:'0.5','stroke-linecap':'round'}));
    // inner glow
    g.appendChild(e('path',{d:dd,fill:'none',stroke:sev,'stroke-width':'8',filter:'url(#xGlow)',opacity:'0.8','stroke-linecap':'round'}));
    // coloured body
    g.appendChild(e('path',{d:dd,fill:'none',stroke:sev,'stroke-width':'3.2','stroke-linecap':'round'}));
    // molten hot centre
    g.appendChild(e('path',{d:dd,fill:'none',stroke:hot,'stroke-width':'1.4','stroke-linecap':'round',opacity:'0.95'}));
    // splinters
    fractureBranches(ca.x,ca.y,cb.x,cb.y,seed).forEach(function(bd){
      g.appendChild(e('path',{d:bd,fill:'none',stroke:sev,'stroke-width':'2.2',filter:'url(#xGlow)','stroke-linecap':'round',opacity:'0.75'}));
    });
    fractureG.appendChild(g);
    var t0=performance.now();
    (function fade(t){
      var k=Math.min(1,(t-t0)/460);
      // a quick over-bright flash as it cracks, settling back
      var flash = k<0.5 ? k*2 : 1 + (0.4)*(1-(k-0.5)*2);
      g.setAttribute('opacity',Math.min(1,flash).toFixed(3));
      if(k<1)requestAnimationFrame(fade);
    })(t0);
    f._glow=g;
  }

  function render(state){
    if(!table)return;
    var lit=state.systems||[];
    var live=lit.length>0||(state.fractures&&state.fractures.length);
    if(emptyMsg)emptyMsg.classList.toggle('gone',!!live);
    drawConnectors(lit);
    // each marked system enters ENGAGED; unmarked ones settle back
    SYSTEMS.forEach(function(s){
      var t=tiles[s.id];if(!t||t.busy)return;
      var on=lit.indexOf(s.id)>-1;
      if(on!==t.engaged) engage(s.id,on);
    });
  }

  function geom(){return {top:MY,bottom:H-MY,midY:function(f){var a=byId(f.from),b=byId(f.to);return (ctr(a).y+ctr(b).y)/2;}};}

  function animateMachine(id,to,ms,leaveSheen){
    var t=tiles[id];if(!t)return;
    if(machTimers[id])cancelAnimationFrame(machTimers[id]);
    t.busy=true;
    var from=(machined[id]||0),t0=performance.now();
    (function step(now){
      var k=Math.min(1,(now-t0)/ms);
      // rise fast (energy applied), cool slow (energy dissipating)
      var ee=to>from?(1-Math.pow(1-k,3)):(k*k);
      setMachine(id,from+(to-from)*ee);
      if(k<1)machTimers[id]=requestAnimationFrame(step);
      else{
        machined[id]=to>0?to:undefined;
        if(to===0){
          t.busy=false;
          if(leaveSheen){ markExamined(id); easeZ(id, 0.06, 420, 'out'); }  // REMEMBERED sits a hair proud
          else easeZ(id,0,420,'out');
        }
      }
    })(t0);
  }

  function investigate(fractures,cb){
    fractures.forEach(function(f,i){f._seed=(i+7)*99991;});
    if(!window.AvishaScan){fractures.forEach(lightFracture);if(cb)cb();return;}
    var line=e('rect',{x:20,y:geom().top,width:W-40,height:3,fill:'url(#xScanGrad)',opacity:'0.85'});
    var haze=e('rect',{x:20,y:geom().top-30,width:W-40,height:60,fill:'#6FB8E8',opacity:'0.05',filter:'url(#xGlow)'});
    scanG.appendChild(haze);scanG.appendChild(line);
    window.AvishaScan.run({
      geom:geom(),fractures:fractures,
      onScanY:function(y,holding){line.setAttribute('y',(y-1.5).toFixed(1));haze.setAttribute('y',(y-30).toFixed(1));line.setAttribute('opacity',holding?'1':'0.8');},
      onCatch:function(f){[f.from,f.to].forEach(function(id){animateMachine(id,1,380);});},
      onReveal:function(f){lightFracture(f);},
      onPulse:function(revealed,breath){
        revealed.forEach(function(f){if(f._glow)f._glow.setAttribute('opacity',(0.82+breath*0.18).toFixed(3));});
        SYSTEMS.forEach(function(s){
          if(machined[s.id]>0&&!coolingLocked[s.id]){
            var mine=fractures.filter(function(f){return f.from===s.id||f.to===s.id;});
            if(mine.length&&mine.every(function(f){return revealed.indexOf(f)>-1;})){coolingLocked[s.id]=true;animateMachine(s.id,0,760,true);}
          }
        });
      },
      onSettle:function(worst){setTimeout(function(){Object.keys(tiles).forEach(function(id){if(machined[id]>0)animateMachine(id,0,780,true);});},260);},
      onDone:function(){line.setAttribute('opacity','0');if(cb)cb();}
    });
  }

  // ---- choreography hooks: the examination drives the modules ----
  function machineUp(id){ animateMachine(id,1,380); }        // certain → the module rises
  function coolExamined(){                                    // finale → all cool, keep residual heat
    Object.keys(tiles).forEach(function(id){ if(machined[id]>0) animateMachine(id,0,780,true); });
  }
  var _scanLineCb=null;
  function setScanY(y,holding){ if(_scanLineCb) _scanLineCb(y,holding); }
  function onScanLine(cb){ _scanLineCb=cb; }
  // node geometry in NORMALIZED units so the material layer can align fractures
  function nodeGeometry(){
    var n={};
    SYSTEMS.forEach(function(s){ var c=ctr(s); n[s.id]={ x:(c.x/W)*(W/H), y:c.y/H }; });
    return n;
  }

  window.AvishaXray={init:init,render:render,investigate:investigate,setEngaged:setEngaged,
    machineUp:machineUp,coolExamined:coolExamined,setScanY:setScanY,onScanLine:onScanLine,
    revealFracture:lightFracture,   // bold vector crack (GPU-independent), driven by the choreography
    connect:drawConnectors,         // draw gold connectors without engaging/titanium-ing tiles (showcase)
    nodeGeometry:nodeGeometry,systems:SYSTEMS};
})();
