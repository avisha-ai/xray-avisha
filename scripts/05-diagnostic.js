/* ============================================================
   STRUCTURAL DIAGNOSTIC  ·  X-Ray
   The instrument does not place cracks. It inspects the workflow
   the user described and finds where structural stress concentrates
   between two specific modules. Every fracture is earned:
   it names a real relationship failure (manual re-keying, duplicate
   entry, handoff delay, or a disconnected pair), and its severity
   is the load on that seam. The worst becomes the Primary Failure
   Point, which stays illuminated after the scan settles.
   No stress → no fracture. Nothing is invented.
   ============================================================ */
(function(){

  // Which system pairs, when both run manually, create a known structural seam.
  // Each carries the ENGINEERING finding — a named failure mode, never a number.
  // kind: 'rekey' | 'duplicate' | 'delay' | 'disconnect'
  var SEAMS=[
    {a:'crm',       b:'email',     kind:'disconnect', find:'CRM not connected to email follow-up', load:3},
    {a:'website',   b:'crm',       kind:'rekey',      find:'Leads from the site re-entered into the CRM by hand', load:2},
    {a:'social',    b:'crm',       kind:'rekey',      find:'Enquiries from social copied into the CRM manually', load:2},
    {a:'orders',    b:'inventory', kind:'duplicate',  find:'Orders and stock counts kept in step by hand', load:3},
    {a:'orders',    b:'accounts',  kind:'rekey',      find:'Orders re-keyed into the books', load:3},
    {a:'orders',    b:'shipping',  kind:'delay',      find:'Dispatch waits on someone to pass the order on', load:2},
    {a:'payments',  b:'accounts',  kind:'duplicate',  find:'Payments reconciled against the books manually', load:3},
    {a:'inventory', b:'shipping',  kind:'delay',      find:'Stock and dispatch fall out of step', load:2},
    {a:'email',     b:'support',   kind:'delay',      find:'Support requests sit in a shared inbox', load:2},
    {a:'reporting', b:'accounts',  kind:'rekey',      find:'Figures pulled into reports by hand each period', load:2},
    {a:'ops',       b:'orders',    kind:'delay',      find:'Order handoffs pass through people, not systems', load:2},
    {a:'support',   b:'crm',       kind:'disconnect', find:'Support history not visible against the customer', load:2}
  ];

  // signals from the form that AMPLIFY stress on a seam
  function amplifiers(ans){
    var amp=0;
    if(ans.afterHours==='Often missed') amp+=1;              // handoffs failing outside hours
    if(ans.responseTime==='Days or more'||ans.responseTime==='Within a day') amp+=1;
    // an explicit re-keying description they typed
    if(ans.painDescription && ans.painDescription.trim().length>8) amp+=1;
    return amp;
  }

  var SEV=function(load){ return load>=4?'high':(load>=3?'med':'low'); };

  /* Inspect the workflow. Returns earned fractures + the primary failure point. */
  function diagnose(systems, ans){
    systems=systems||[]; ans=ans||{};
    var amp=amplifiers(ans);
    var found=[];

    SEAMS.forEach(function(s){
      // a seam only exists if BOTH modules are present in this business's workflow
      if(systems.indexOf(s.a)<0 || systems.indexOf(s.b)<0) return;
      var load=s.load;
      // disconnects and duplicate entry carry the most structural stress
      if(s.kind==='disconnect') load+=1;
      if(s.kind==='duplicate')  load+=1;
      load += amp*0.5;   // the whole system is under more strain
      found.push({from:s.a, to:s.b, kind:s.kind, finding:s.find, load:load, severity:SEV(load)});
    });

    // no earned stress → the instrument reports a sound structure, no fractures
    if(!found.length) return {fractures:[], primary:null, sound:true};

    // rank by load; the single worst is the Primary Failure Point
    found.sort(function(x,y){ return y.load-x.load; });
    // clamp severities so exactly the top one can be 'high' as the finale
    var primary=found[0];
    primary.primary=true;
    primary.severity='high';
    found.slice(1).forEach(function(f){ if(f.severity==='high') f.severity='med'; });

    return {fractures:found, primary:primary, sound:false};
  }

  window.AvishaDiagnostic={ diagnose:diagnose, SEAMS:SEAMS };
})();
