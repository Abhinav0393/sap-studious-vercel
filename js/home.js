/* =========================================================
   SAP STUDIOS: HOME (js/home.js)
   Moved verbatim from the approved single-file Home page: Three.js scene (Architecture,
   Interiors, Team, About hover states), responsive viewport handling, hover/touch logic and
   the opening logo reveal. Needs js/vendor/three.min.js (three r128) loaded first.
   Real page links are handled separately in js/navigation.js.
   ========================================================= */
  const canvas=document.getElementById('bg3d'),main=document.getElementById('main'),body=document.body;
  const navZones=document.querySelectorAll('.zone'),navLinks=document.querySelectorAll('.nav-link');
  const phTeam=document.getElementById('ph-team'),phAbout=document.getElementById('ph-about');

  let renderer=null;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  }catch(err){
    // WebGL unavailable: hide the 3D layer and carry on with a stand-in so the labels,
    // hover states and page links keep working and nothing throws in the console.
    if(canvas)canvas.style.display='none';
    renderer={domElement:canvas,autoClear:true,setPixelRatio:function(){},setSize:function(){},clear:function(){},
      render:function(){},compile:function(){},dispose:function(){},
      getSize:function(target){target.set(window.innerWidth,window.innerHeight);return target;}};
  }
  const coarseDeviceQuery=window.matchMedia('(pointer:coarse)');
  function getDevicePixelRatio(){
    // Limit fill-rate on high-density phones while keeping crisp linework on desktop.
    return Math.min(window.devicePixelRatio || 1, coarseDeviceQuery.matches ? 1.5 : 2);
  }
  function getViewportSize(){
    const vv=window.visualViewport;
    return {
      width:Math.max(1,Math.round(vv ? vv.width : document.documentElement.clientWidth || window.innerWidth)),
      height:Math.max(1,Math.round(vv ? vv.height : document.documentElement.clientHeight || window.innerHeight))
    };
  }
  renderer.setPixelRatio(getDevicePixelRatio());
  { const v=getViewportSize(); renderer.setSize(v.width,v.height,false); }
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,0.1,100);
  camera.position.set(5.0,3.25,6.25);
  camera.lookAt(0,0.8,0);

  scene.add(new THREE.AmbientLight(0xffffff,0.48));
  const sun=new THREE.DirectionalLight(0xfff2df,0);
  sun.position.set(-3,4,2);
  scene.add(sun);

  const stageP=(p,start,width)=>THREE.MathUtils.clamp((p-start)/width,0,1);

  function makePerson(color){
    const mat=new THREE.MeshStandardMaterial({color,transparent:true,opacity:0});
    const bodyM=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,.18,8),mat);
    bodyM.position.y=.09;
    const head=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),mat);
    head.position.y=.21;
    const group=new THREE.Group();group.add(bodyM,head);
    return {group,mat};
  }

  /* ================= ARCHITECTURE: PARTI → PLAN → SECTION → 3D MASS → ARCHITECTURAL SPACE =================
     js/architecture.js: one BuildingSpec drives the plan, the section A–A and the 3D mass (orthographic
     camera throughout). Forward only: hover plays it once; leaving fades it out quickly (see LEAVE_FADE
     below) and the next hover starts again from the parti. It renders into this same canvas.
  */
  const smooth=t=>t*t*(3-2*t);   // shared with the Interiors sequence
  renderer.autoClear=false;      // Interiors and Architecture are composited by hand
  const Architecture=window.SAPArchitecture.create({renderer});
  // Build the drawing quietly once the page is idle so the first hover is instant.
  (window.requestIdleCallback||function(f){setTimeout(f,1800);})(()=>Architecture.preload());


  /* ================= INTERIORS — MONOCHROME SPATIAL COMPOSITION =================
     Design language: an interior is communicated through proportion, threshold,
     circulation, hierarchy, joinery, furniture scale and light. No decorative
     colour is introduced: only black, white and neutral greys. Warmth belongs
     exclusively to the architectural light source.
  */
  const room = new THREE.Group();
  scene.add(room);

  const mono=(hex,rough=.8,opacity=0)=>new THREE.MeshStandardMaterial({
    color:hex, roughness:rough, metalness:0, transparent:true, opacity,
    side:THREE.DoubleSide, depthWrite:false
  });
  const lineMat=(opacity=0)=>new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity});
  const roomPart=(geo,pos,hex=0xf2f2ef,rough=.82,fill=.72,edge=.22)=>{
    const g=new THREE.Group();
    const m=new THREE.Mesh(geo,mono(hex,rough,0));
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo,1),lineMat(0));
    g.add(m,e); g.position.copy(pos);
    g.userData={m,e,fill,edge}; room.add(g); return g;
  };
  const rReveal=(g,k)=>{
    g.userData.m.material.opacity=g.userData.fill*k;
    g.userData.e.material.opacity=g.userData.edge*k;
  };
  const rLine=(points,op=.45)=>{
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    const l=new THREE.LineSegments(geo,lineMat(0)); l.userData={op}; room.add(l); return l;
  };
  const rRevealLine=(l,k)=>l.material.opacity=l.userData.op*k;

  // 01 — Architectural shell: floor, rear plane and one side plane.
  const floor=roomPart(new THREE.BoxGeometry(3.55,.055,3.05),new THREE.Vector3(0,.03,0),0xe9e9e5,.94,.55,.18);
  const backWall=roomPart(new THREE.BoxGeometry(3.55,1.95,.055),new THREE.Vector3(0,1.00,-1.52),0xf4f4f1,.96,.68,.16);
  const leftWall=roomPart(new THREE.BoxGeometry(.055,1.95,3.05),new THREE.Vector3(-1.77,1.00,0),0xefefec,.96,.60,.14);
  const shellMeshes=[floor,backWall,leftWall];

  // A thin ceiling datum gives the room architectural proportion rather than a boxy feel.
  const ceilingFrame=roomPart(new THREE.BoxGeometry(3.18,.045,2.66),new THREE.Vector3(.06,1.93,.02),0xffffff,.82,.22,.52);

  // 02 — Threshold + circulation: a dark portal establishes arrival and depth.
  const portal=roomPart(new THREE.BoxGeometry(1.02,1.55,.10),new THREE.Vector3(.18,.79,-1.44),0x101010,.58,.88,.28);
  const portalInner=roomPart(new THREE.BoxGeometry(.78,1.30,.045),new THREE.Vector3(.18,.70,-1.385),0x262626,.64,.66,.22);

  // 03 — Spatial divider: vertical fins create a layered plan and controlled permeability.
  const interiorFins=[];
  for(let i=0;i<7;i++){
    const fin=roomPart(new THREE.BoxGeometry(.045,1.38,.11),new THREE.Vector3(-.92+i*.19,.72,.10),0xd9d9d6,.72,.76,.34);
    fin.scale.y=.001; interiorFins.push(fin);
  }
  const dividerBase=roomPart(new THREE.BoxGeometry(1.32,.08,.16),new THREE.Vector3(-.34,.08,.10),0x191919,.72,.62,.22);

  // 04 — Joinery wall: a quiet horizontal/vertical grid, kept intentionally sparse.
  const joinery=[];
  for(let i=0;i<4;i++){
    const shelf=roomPart(new THREE.BoxGeometry(1.18,.035,.30),new THREE.Vector3(1.05,.46+i*.28,-1.42),0xf7f7f4,.82,.52,.30);
    joinery.push(shelf);
  }
  const joinerySide=roomPart(new THREE.BoxGeometry(.035,1.22,.30),new THREE.Vector3(.48,1.02,-1.42),0xf7f7f4,.82,.52,.30);
  joinery.push(joinerySide);

  // 05 — Furniture: fewer pieces, better proportion, clear circulation around them.
  const furniture=[];
  const sofa=roomPart(new THREE.BoxGeometry(1.34,.40,.62),new THREE.Vector3(-.78,.24,-.78),0xd8d8d4,.88,.92,.22); furniture.push(sofa);
  const sofaBack=roomPart(new THREE.BoxGeometry(1.34,.58,.12),new THREE.Vector3(-.78,.66,-1.03),0xe5e5e1,.88,.86,.20); furniture.push(sofaBack);
  const tableTop=roomPart(new THREE.BoxGeometry(.82,.055,.48),new THREE.Vector3(.28,.48,-.55),0xf1f1ee,.76,.86,.28); furniture.push(tableTop);
  const tableLegs=[];
  [[-.06,-.72],[.62,-.72],[-.06,-.38],[.62,-.38]].forEach(([x,z])=>{
    const leg=roomPart(new THREE.BoxGeometry(.035,.44,.035),new THREE.Vector3(x,.24,z),0x161616,.62,.80,.24); tableLegs.push(leg); furniture.push(leg);
  });
  const chairSeat=roomPart(new THREE.BoxGeometry(.52,.16,.52),new THREE.Vector3(1.02,.24,-.28),0xbcbcb8,.84,.88,.20); furniture.push(chairSeat);
  const chairBack=roomPart(new THREE.BoxGeometry(.52,.62,.07),new THREE.Vector3(1.02,.58,-.52),0xc9c9c5,.84,.78,.20); furniture.push(chairBack);

  // A monolithic side console introduces material weight without introducing colour.
  const console=roomPart(new THREE.BoxGeometry(1.10,.52,.28),new THREE.Vector3(1.02,.30,.82),0x242424,.62,.84,.26); furniture.push(console);
  const consoleTop=roomPart(new THREE.BoxGeometry(1.18,.045,.34),new THREE.Vector3(1.02,.58,.82),0xe7e7e3,.72,.82,.24); furniture.push(consoleTop);

  // 06 — Ceiling aperture: a single controlled opening brings the eye upward.
  const aperture=rLine([-.62,1.955,-.58,.62,1.955,-.58,-.62,1.955,.58,.62,1.955,.58],.42);
  const aperture2=rLine([-.62,1.955,-.58,-.62,1.955,.58,.62,1.955,-.58,.62,1.955,.58],.42);

  // 07 — One architectural pendant. The only non-monochrome colour is its warm light.
  const pendantCable=rLine([.32,1.92,.22,.32,1.24,.22],.48);
  const pendantShade=new THREE.Mesh(new THREE.ConeGeometry(.14,.10,24,1,true),new THREE.MeshStandardMaterial({color:0x111111,roughness:.6,transparent:true,opacity:0}));
  pendantShade.position.set(.32,1.19,.22); room.add(pendantShade);
  const pendantGlow=new THREE.Mesh(new THREE.SphereGeometry(.035,12,8),new THREE.MeshBasicMaterial({color:0xffd2a0,transparent:true,opacity:0,depthWrite:false}));
  pendantGlow.position.set(.32,1.13,.22); room.add(pendantGlow);
  const lampLight=new THREE.PointLight(0xffcf9e,0,2.7); lampLight.position.set(.32,1.10,.22); room.add(lampLight);

  // 08 — A very restrained daylight plane moves across the floor and wall.
  const daylight=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.65),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  daylight.rotation.x=-Math.PI/2; daylight.rotation.z=-.18; daylight.position.set(-.62,.065,-.12); room.add(daylight);

  // Human scale: tiny, monochrome, used only to make proportion legible.
  const resident=makePerson(0x181818);
  resident.group.position.set(1.28,.04,.92); resident.group.scale.setScalar(1.55); room.add(resident.group);

  // Subtle floor circulation lines — diagrammatic, not decorative.
  const circulation=rLine([
    -1.38,.065,.92,-.62,.065,.92,
    -.62,.065,.92,.08,.065,.52,
    .08,.065,.52,.92,.065,.52
  ],.20);




  let mode=null,pA=0,pI=0,lastCap='';

  const archCaps=[
    [0.00,'01 — PLAN'],
    [0.23,'02 — SECTION'],
    [0.48,'03 — MASS'],
    [0.85,'04 — ARCHITECTURE']
  ];
  const intCaps=[
    [0.00,'01 — SHELL'],
    [0.14,'02 — THRESHOLD'],
    [0.28,'03 — SPATIAL DIVIDER'],
    [0.43,'04 — JOINERY + FURNITURE'],
    [0.62,'05 — LIGHT + PROPORTION'],
    [0.80,'06 — LIVING']
  ];
  const pickCap=(caps,p)=>{
    let t=caps[0][1];
    caps.forEach(c=>{if(p>=c[0]+.02)t=c[1];});
    return t;
  };

  /* One scene at a time. Both sequences only ever BUILD — nothing plays backwards.
       • Architecture ⇄ Interiors: the old scene is removed at once, the new one builds from nothing.
       • Leaving to the hero (or Team / About): the current frame is held and faded out quickly, then cleared. */
  const LEAVE_FADE=.28;
  let leaveK=1;
  let lastP=performance.now(),gpuDrawn=false;

  function animate(){
    requestAnimationFrame(animate);
    const now=Date.now();
    const nowP=performance.now(),dtA=Math.min(.05,Math.max(0,(nowP-lastP)/1000));lastP=nowP;

    const keepA=mode==='architecture',keepI=mode==='interiors';
    if(keepA) pI=0;                                              // never show both scenes at once
    else if(keepI&&pA>0){Architecture.reset();pA=0;}
    pA=Architecture.advance(dtA,keepA);                          // Plan → Section → 3D timeline (time based, forwards only)
    // Time-based rather than frame-based: the Interiors sequence now runs at the
    // same real-world speed on 30/60/90/120/144 Hz screens.
    pI=THREE.MathUtils.clamp(pI+(keepI ? dtA/3.0 : 0),0,1);
    if(!keepA&&!keepI&&(pA>0||pI>0)){
      leaveK=matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.max(0,leaveK-dtA/LEAVE_FADE);
      if(leaveK<=0){Architecture.reset();pA=0;pI=0;}
    }else leaveK=1;
    canvas.style.opacity=leaveK<1?leaveK.toFixed(3):'';
    Architecture.fade(leaveK);

    const interiorActive=pI>.002;
    room.visible=interiorActive;

    // Calm camera drift: the architecture is framed large enough to read as a hero object; it breathes instead of spinning.
    const activeP=pI;
    camera.position.set(
      5.0+Math.sin(now*.00016)*.10*activeP,
      3.25+Math.sin(now*.00013)*.045*activeP,
      6.25+Math.cos(now*.00015)*.10*activeP
    );
    camera.lookAt(0,.82,0);


    /* ================= INTERIORS — MONOCHROME CINEMATIC SEQUENCE =================
       Shell → threshold → divider → joinery → furniture → light → life.
       The camera makes a very slow orbit so the viewer reads depth, not a spinning model.
    */
    const progress=pI;
    const i1=smooth(stageP(progress,0.00,.16));
    const i2=smooth(stageP(progress,.13,.18));
    const i3=smooth(stageP(progress,.28,.18));
    const i4=smooth(stageP(progress,.43,.23));
    const i5=smooth(stageP(progress,.62,.20));
    const i6=smooth(stageP(progress,.78,.20));

    shellMeshes.forEach((m,i)=>rReveal(m,i1*(i===0?.92:1)));
    rReveal(ceilingFrame,smooth(stageP(progress,.08,.18)));
    rReveal(portal,i2); rReveal(portalInner,smooth(stageP(progress,.19,.15)));

    interiorFins.forEach((f,i)=>{
      const k=smooth(stageP(progress,.24+i*.018,.20));
      rReveal(f,k); f.scale.y=Math.max(.001,k);
    });
    rReveal(dividerBase,i3);

    joinery.forEach((j,i)=>rReveal(j,smooth(stageP(progress,.34+i*.035,.17))));

    furniture.forEach((f,i)=>{
      const k=smooth(stageP(progress,.46+i*.018,.22));
      rReveal(f,k);
    });

    rRevealLine(aperture,i5); rRevealLine(aperture2,i5);
    rRevealLine(pendantCable,i5);
    pendantShade.material.opacity=.92*i5;

    // Warmth comes only from the lamp; geometry and materials remain monochrome.
    lampLight.intensity=.78*i6;
    pendantGlow.material.opacity=.82*i6;

    // Daylight is white and extremely soft — it reveals planes rather than colouring them.
    const dayWave=Math.sin(now*.000095)*.5+.5;
    daylight.material.opacity=.055*i6;
    daylight.position.x=THREE.MathUtils.lerp(-.95,.72,dayWave);
    daylight.position.z=THREE.MathUtils.lerp(.60,-.40,dayWave);

    // Resident enters only after the space has established its architectural hierarchy.
    resident.mat.opacity=i6;
    if(interiorActive){
      resident.group.position.x=THREE.MathUtils.lerp(1.52,1.12,i6);
      resident.group.position.z=THREE.MathUtils.lerp(1.08,.84,i6);
    }
    rRevealLine(circulation,smooth(stageP(progress,.20,.24)));

    // Slow interior camera study: gentle orbit + tiny dolly + elevation drift.
    // It never becomes a product-spin; the viewer gets changing spatial relationships.
    const io=Math.sin(now*.000085)*.115;
    room.rotation.y=io;
    room.rotation.x=Math.sin(now*.00011)*.008;
    room.position.y=Math.sin(now*.00010)*.012;
      const interiorBreath=1+0.019*(0.5+0.5*Math.sin(now*.00031+1.2));
      room.scale.setScalar(interiorBreath);

    if(interiorActive){
      // Fit the whole room on narrow/portrait screens instead of cropping the
      // pendant, joinery or furniture. The original composition is retained on desktop.
      const aspect=Math.max(.35,innerWidth/Math.max(1,innerHeight));
      const portraitFit=THREE.MathUtils.clamp(1.0 + (0.95-aspect)*0.72,1.0,1.52);
      const landscapeFit=innerHeight < 500 ? 1.10 : 1.0;
      const fit=portraitFit*landscapeFit;
      camera.position.x=(4.55+Math.sin(now*.000085)*.30)*fit;
      camera.position.z=(5.85+Math.cos(now*.000085)*.22)*fit;
      camera.position.y=(2.95+Math.sin(now*.00011)*.045)*Math.min(1.16,1+(0.8-aspect)*.16);
      camera.fov=aspect<.72 ? 49 : (aspect<.95 ? 47 : 45);
      camera.updateProjectionMatrix();
      camera.lookAt(.05,.82,-.05);
    }



    // Composite: Interiors render exactly as before; Architecture uses its own orthographic camera.
    // When nothing is visible the canvas is cleared once and left idle.
    const showRoom=room.visible,showArch=Architecture.visible();
    if(showRoom||showArch){
      renderer.clear();
      if(showRoom) renderer.render(scene,camera);
      if(showArch) Architecture.render(renderer);
      gpuDrawn=true;
    }else if(gpuDrawn){
      renderer.clear();gpuDrawn=false;
    }
  }
  animate();
  addEventListener('pagehide',()=>Architecture.dispose());

  let resizeRaf=0;
  function syncResponsiveViewport(){
    cancelAnimationFrame(resizeRaf);
    resizeRaf=requestAnimationFrame(()=>{
      const v=getViewportSize();
      renderer.setPixelRatio(getDevicePixelRatio());
      renderer.setSize(v.width,v.height,false);
      camera.aspect=v.width/v.height;
      camera.updateProjectionMatrix();
      Architecture.resize();
      // Force a fresh layout pass after browser chrome/orientation changes.
      canvas.style.width='100%';
      canvas.style.height='100%';
    });
  }
  addEventListener('resize',syncResponsiveViewport,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(syncResponsiveViewport,120),{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',syncResponsiveViewport,{passive:true});
  }
  if(coarseDeviceQuery.addEventListener){
    coarseDeviceQuery.addEventListener('change',syncResponsiveViewport);
  } else if(coarseDeviceQuery.addListener){
    coarseDeviceQuery.addListener(syncResponsiveViewport);
  }

  let touchMode=false;

  function activateMode(nextMode){
    mode=nextMode;
    navLinks.forEach(l=>l.classList.toggle('active',l.dataset.mode===mode));
    body.classList.add('dark');
    main.classList.add('hovering');
    phTeam.classList.toggle('active',mode==='team');
    phAbout.classList.toggle('active',mode==='about');
  }

  function clearMode(){
    mode=null;
    navLinks.forEach(l=>l.classList.remove('active'));
    body.classList.remove('dark');
    main.classList.remove('hovering');
    phTeam.classList.remove('active');
    phAbout.classList.remove('active');
  }

  /* ---- Desktop hover: the TEXT of a label is the only trigger. ----------------------
     • Nothing happens for the first 2.5 s after the page is revealed (HOLD_MS), even if the
       cursor is already resting on a word. After that, the cursor has to MOVE onto the word.
     • Leaving the word clears the state after a short grace (LEAVE_MS) so a tiny slip off the
       edge of a letter does not flicker the scene. */
  const HOLD_MS=2500,LEAVE_MS=120;
  let holdUntil=Infinity,leaveTimer=0;
  window.sapStartHoverHold=()=>{holdUntil=performance.now()+HOLD_MS;};
  const isTouchEvt=e=>e.pointerType==='touch';
  const holdOver=()=>performance.now()>=holdUntil;

  navLinks.forEach(link=>{
    const enter=e=>{
      if(isTouchEvt(e)||!holdOver()) return;
      clearTimeout(leaveTimer);
      touchMode=false;
      if(mode!==link.dataset.mode) activateMode(link.dataset.mode);
    };
    link.addEventListener('pointerenter',enter);
    link.addEventListener('pointermove',enter);        // reveals once the hold is over and the cursor moves
    link.addEventListener('pointerleave',e=>{
      if(isTouchEvt(e)) return;
      clearTimeout(leaveTimer);
      leaveTimer=setTimeout(()=>{ if(!touchMode) clearMode(); },LEAVE_MS);
    });
    link.addEventListener('pointerdown',e=>{
      if(isTouchEvt(e)){
        e.preventDefault();
        touchMode=true;
        if(mode===link.dataset.mode) clearMode();
        else activateMode(link.dataset.mode);
      }
    });
  });

  /* Touch only: the quadrants stay tappable on phones/tablets (CSS disables them for mouse). */
  navZones.forEach(zone=>{
    zone.addEventListener('pointerdown',e=>{
      if(isTouchEvt(e)){
        e.preventDefault();
        touchMode=true;
        if(mode===zone.dataset.mode) clearMode();
        else activateMode(zone.dataset.mode);
      }
    });
  });

  document.addEventListener('pointerdown',e=>{
    if(!touchMode || !mode) return;
    if(!e.target.closest('.zone') && !e.target.closest('.nav-link')) clearMode();
  });


  /* Cinematic logo opening: arcs -> exact letter sequence -> move to navbar. */
  (function runSAPIntro(){
    const body=document.body;
    const overlay=document.getElementById('sapIntro');
    const lockup=document.getElementById('revealLockup');
    if(!overlay || !lockup){window.sapStartHoverHold();return;}

    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      body.classList.remove('intro-active');
      overlay.remove();
      window.sapStartHoverHold();
      return;
    }

    const letters=[...lockup.querySelectorAll('.letter')];
    const leftArc=lockup.querySelector('.arc-left');
    const rightArc=lockup.querySelector('.arc-right');

    // Ensure the page cannot flash through before the reveal begins.
    requestAnimationFrame(()=>{
      lockup.classList.add('arcs-1');
      setTimeout(()=>lockup.classList.add('arcs-2'),950);

      // SAP STUDIOS — exact order: S A P S T U D I O S.
      const wordmarkStart=1980;
      letters.forEach((letter,index)=>{
        setTimeout(()=>letter.classList.add('visible'),wordmarkStart + index*105);
      });

      // Let the completed lockup breathe briefly, then glide it onto the live header logo.
      // Landing is computed from the INK bounds of both artworks (measured from the PNG slices
      // and sap-logo.png), so the lockup stops exactly on the Home logo: same size, same place.
      const moveAt=3150;
      const LOCK_INK={x0:.018972,y0:.035514,x1:.984190,y1:.940187};   // inside the 1265:535 lockup box
      const LOGO_INK={x0:.004808,y0:.003945,x1:.997596,y1:.984221};   // inside sap-logo.png
      setTimeout(()=>{
        const logo=document.querySelector('.brand-image')||document.querySelector('.brand');
        if(!logo){finish(0);return;}
        const br=logo.getBoundingClientRect();
        const lr=lockup.getBoundingClientRect();           // measured at scale 1, centred
        const lw=lr.width,lh=lr.height;
        const inkLW=lw*(LOCK_INK.x1-LOCK_INK.x0);
        const tx0=br.left+br.width*LOGO_INK.x0,tx1=br.left+br.width*LOGO_INK.x1;
        const ty0=br.top+br.height*LOGO_INK.y0,ty1=br.top+br.height*LOGO_INK.y1;
        const scale=(tx1-tx0)/inkLW;
        const tcx=(tx0+tx1)/2,tcy=(ty0+ty1)/2;
        // centre of the lockup box = ink centre minus the ink's offset from the box centre
        const offX=((LOCK_INK.x0+LOCK_INK.x1)/2-.5)*lw*scale;
        const offY=((LOCK_INK.y0+LOCK_INK.y1)/2-.5)*lh*scale;
        lockup.style.left=(tcx-offX)+'px';
        lockup.style.top=(tcy-offY)+'px';
        lockup.style.transform=`translate(-50%,-50%) scale(${scale})`;
        finish(1180);
      },moveAt);

      function finish(delay){
        setTimeout(()=>{
          body.classList.remove('intro-active');
          body.classList.add('intro-complete');
          window.sapStartHoverHold();                    // 2.5 s of calm before any hover reaction
          setTimeout(()=>overlay.remove(),650);
        },delay);
      }
    });
  })();
