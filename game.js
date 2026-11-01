/* Dave Flaps — version 1.0 | No build tools, frameworks, adverts, or tracking. */
(() => {
  'use strict';

  const W = 420;
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = (selector) => document.querySelector(selector);
  const screens = {
    ready: $('#readyScreen'), paused: $('#pauseScreen'), over: $('#overScreen')
  };
  const hud = $('#hud');
  const hint = $('#footerPrompt');
  const soundButton = $('#soundButton');
  const playerImage = new Image();
  const pastryImage = new Image();
  playerImage.src = './assets/dave-wings.webp';
  pastryImage.src = './assets/sausage-roll.webp';

  let H = 760;
  let floorY = 678;
  let lastFrame = 0;
  let time = 0;
  let motion = 0;
  let mode = 'ready';
  let score = 0;
  let best = readNumber('daveFlapsBest');
  let soundOn = readText('daveFlapsSound') !== 'off';
  let audio = null;
  let spawnTimer = 0;
  let lastGapCenter = 380;
  let lastInput = 0;
  const pipes = [];
  const crumbs = [];
  const clouds = [
    {x:32,y:90,s:1.0,p:.08}, {x:225,y:172,s:.67,p:.14},
    {x:456,y:86,s:.86,p:.1}, {x:644,y:219,s:.73,p:.18},
    {x:820,y:122,s:1.18,p:.09}
  ];
  const dave = {x:125,y:330,vy:0,angle:0,r:25};

  function readText(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function readNumber(key) {
    const v = Number(readText(key));
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
  }
  function save(key,value) {
    try { localStorage.setItem(key,String(value)); } catch { /* private mode */ }
  }
  function clamp(value,min,max) { return Math.min(max,Math.max(min,value)); }
  function rand(a,b) { return Math.random()*(b-a)+a; }
  function ground() { return H-82; }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const prev = floorY;
    H = W*rect.height/rect.width;
    floorY = ground();
    const dpr = Math.min(2,window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width*dpr);
    canvas.height = Math.round(rect.height*dpr);
    if (mode === 'running' && Math.abs(floorY - prev) > 25) pause();
    if (mode === 'ready') dave.y = Math.min(floorY*.49,450);
    else dave.y = clamp(dave.y+floorY-prev,32,floorY-30);
    if (mode !== 'running') draw();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  window.addEventListener('resize',resize,{passive:true});

  function show(modeName) {
    mode = modeName;
    Object.entries(screens).forEach(([key,el]) => { el.hidden = key!==modeName; });
    hud.hidden = modeName!=='running';
    hint.hidden = modeName!=='running' || score>0;
    $('#introBest').textContent = best;
    $('#hudBest').textContent = best;
    $('#hudScore').textContent = score;
  }

  function startGame() {
    score = 0;
    pipes.length = 0;
    crumbs.length = 0;
    spawnTimer = .8;
    lastGapCenter = floorY*.52;
    dave.y = Math.min(floorY*.50,450);
    dave.vy = 0;
    dave.angle = 0;
    time = 0;
    lastFrame = 0;
    show('running');
    flap();
  }
  function menu() {
    pipes.length = 0;
    crumbs.length = 0;
    dave.vy = 0;
    show('ready');
    resize();
  }
  function pause() {
    if (mode !== 'running') return;
    show('paused');
  }
  function resume() {
    if (mode !== 'paused') return;
    lastFrame = 0;
    show('running');
  }

  // Sounds are synthesized locally, so the game needs no third-party assets.
  function activateAudio() {
    if (!soundOn) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audio) audio = new AudioCtx();
      if (audio.state === 'suspended') audio.resume();
    } catch { /* devices with disabled audio can still play */ }
  }
  function beep(f1,f2,duration,type='sine',volume=.08) {
    if (!soundOn) return;
    activateAudio();
    if (!audio) return;
    try {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const now = audio.currentTime;
      osc.type = type;
      osc.frequency.setValueAtTime(f1,now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(35,f2),now+duration);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(volume,now+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      osc.connect(gain).connect(audio.destination);
      osc.start(now);
      osc.stop(now+duration+.015);
    } catch { /* ignore audio issues */ }
  }
  function sound(name) {
    if(name==='flap') beep(450,650,.12,'sine',.065);
    if(name==='point') {beep(720,940,.13,'sine',.075);setTimeout(()=>beep(900,1190,.14,'sine',.065),85);}
    if(name==='hit') beep(260,60,.34,'sawtooth',.095);
  }
  function vibrate(ms) { try { navigator.vibrate?.(ms); } catch { /* unsupported */ } }
  function flap() {
    if (mode!=='running') return;
    dave.vy = -390;
    dave.angle = -.27;
    for (let i=0;i<4;i++) {
      crumbs.push({x:dave.x-28,y:dave.y+13,vx:rand(-85,-20),vy:rand(-20,95),life:.3+rand(0,.25),radius:rand(1,3),color:'#fff7e7'});
    }
    sound('flap');
  }

  function gameOver() {
    if (mode!=='running') return;
    sound('hit');
    vibrate(80);
    const isRecord = score>best;
    if(isRecord){best=score;save('daveFlapsBest',best);}
    $('#finalScore').textContent = score;
    $('#finalBest').textContent = best;
    $('#resultPill').textContent = isRecord?'🏆 NEW PERSONAL BEST':'A CRUMBY LANDING';
    const lines = score===0
      ? ["Dave didn't even get to the buffet.","The pastry strikes first.","That's one way to get a sausage roll."]
      : score<5
        ? ["A short but buttery adventure.","Dave's been sausage-rolled.","Not quite a Michelin-starred landing."]
        : ["Not bad for a man with no body.","The bakery has finally won.","A heroic amount of pastry dodged."];
    $('#gameOverMessage').textContent = lines[Math.floor(Math.random()*lines.length)];
    for(let i=0;i<22;i++) {
      crumbs.push({x:dave.x+rand(-15,15),y:dave.y+rand(-15,15),vx:rand(-170,170),vy:rand(-180,90),life:rand(.5,1.2),radius:rand(2,5),color:i%2?'#efa44a':'#fff0b9'});
    }
    show('over');
  }

  function makePipe() {
    const gap = Math.max(195,242 - score*2.2);
    const minC = gap/2+107;
    const maxC = floorY-gap/2-95;
    const center = maxC < minC ? (maxC+minC)/2
      : clamp(lastGapCenter+rand(-126,126),minC,maxC);
    lastGapCenter=center;
    pipes.push({x:W+25,width:100,top:center-gap/2,bottom:center+gap/2,passed:false,tilt:rand(-.03,.03)});
  }

  function circleHitsRect(cx,cy,r,rx,ry,rw,rh) {
    const closestX=clamp(cx,rx,rx+rw),closestY=clamp(cy,ry,ry+rh);
    return (cx-closestX)**2+(cy-closestY)**2 < r*r;
  }

  function update(dt) {
    motion+=dt;
    // Decorative animation on menu and score screen.
    if(mode!=='running'){
      for(let i=crumbs.length-1;i>=0;i--){
        const c=crumbs[i];c.x+=c.vx*dt;c.y+=c.vy*dt;c.vy+=550*dt;c.life-=dt;
        if(c.life<=0) crumbs.splice(i,1);
      }
      return;
    }
    time+=dt;
    dave.vy=Math.min(640,dave.vy+1110*dt);
    dave.y+=dave.vy*dt;
    const targetAngle=clamp(dave.vy/850,-.48,.95);
    dave.angle+=(targetAngle-dave.angle)*Math.min(1,dt*11);
    const speed=Math.min(255,174+score*3.3);
    spawnTimer-=dt;
    if(spawnTimer<=0){makePipe();spawnTimer+=Math.max(1.38,1.68-score*.018);}
    for(let i=pipes.length-1;i>=0;i--){
      const p=pipes[i];p.x-=speed*dt;
      if(!p.passed && p.x+p.width < dave.x-dave.r){
        p.passed=true;
        score++;
        $('#hudScore').textContent=score;
        hint.hidden=true;
        sound('point');
        for(let j=0;j<7;j++) crumbs.push({x:dave.x+rand(10,48),y:dave.y+rand(-25,25),vx:rand(-55,45),vy:rand(-160,-45),life:rand(.3,.7),radius:rand(2,4),color:'#ffe573'});
      }
      if(p.x+p.width< -30)pipes.splice(i,1);
      if(circleHitsRect(dave.x,dave.y,dave.r-4,p.x,0,p.width,p.top-4)
        || circleHitsRect(dave.x,dave.y,dave.r-4,p.x,p.bottom+4,p.width,floorY-p.bottom)){
        gameOver();return;
      }
    }
    for(let i=crumbs.length-1;i>=0;i--){
      const c=crumbs[i];c.x+=c.vx*dt;c.y+=c.vy*dt;c.vy+=300*dt;c.life-=dt;
      if(c.life<=0) crumbs.splice(i,1);
    }
    if(dave.y+dave.r-5>=floorY || dave.y-dave.r<=5)gameOver();
  }

  function roundedRect(x,y,w,h,r,color) {
    ctx.fillStyle=color;
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
  }
  function ellipse(x,y,rx,ry,color) {
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
  }
  function hill(points,fill) {
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    ctx.lineTo(W,floorY);ctx.lineTo(0,floorY);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  }
  function paintCloud(x,y,s) {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ellipse(0,12,64,19,'#ffffff38');
    ellipse(-31,1,28,19,'#fffffff2');
    ellipse(0,-14,36,26,'#fffffff0');
    ellipse(35,3,27,19,'#fffffff2');
    ellipse(5,13,63,16,'#ffffffef');
    ctx.restore();
  }
  function drawBackground() {
    const sky=ctx.createLinearGradient(0,0,0,floorY);
    sky.addColorStop(0,'#2a88d0');sky.addColorStop(.40,'#72c5fb');sky.addColorStop(1,'#e0f2cb');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // Soft sun, light rings, and fluffy moving clouds.
    const glow=ctx.createRadialGradient(325,115,5,325,115,175);
    glow.addColorStop(0,'#fffbe599');glow.addColorStop(.45,'#fff2b544');glow.addColorStop(1,'#fff5b300');
    ctx.fillStyle=glow;ctx.fillRect(130,-55,360,360);
    ellipse(327,112,35,35,'#ffeaa4cc');
    const loop=890;
    for(const c of clouds){
      const px=((c.x - motion*28*c.p*8+110)%loop+loop)%loop-110;
      paintCloud(px,c.y+Math.min(90,H*.1),c.s);
    }
    // Northern hills and lake: simple vector shapes that animate smoothly.
    const far=floorY-222;
    hill([[0,far+67],[48,far+12],[95,far+40],[160,far-25],[219,far+39],[278,far-7],[355,far+49],[420,far+8]],'#7da5a4');
    hill([[0,far+95],[40,far+37],[82,far+56],[134,far+9],[193,far+62],[253,far+28],[326,far+88],[378,far+39],[420,far+56]],'#4d8990');
    ctx.fillStyle='#a8d9cc';ctx.fillRect(0,floorY-140,W,63);
    for(let i=0;i<11;i++){
      const x=((i*57 - motion*4)%560+560)%560-45;
      ctx.fillStyle=i%2?'#e2f0da70':'#ffffff4d';
      ctx.fillRect(x,floorY-120+(i%3)*13,20+(i%4)*6,2);
    }
    hill([[0,floorY-122],[56,floorY-138],[132,floorY-111],[206,floorY-150],[288,floorY-115],[374,floorY-147],[420,floorY-131]],'#5f9d6e');
    hill([[0,floorY-85],[90,floorY-121],[156,floorY-104],[218,floorY-127],[330,floorY-96],[420,floorY-121]],'#40905e');
    // Windblown hedges, bushes, and a couple of farm roofs.
    for(let i=0;i<12;i++){
      const x=((i*47 - motion*10)%570+570)%570-50;
      const y=floorY-89-(i%4)*7;
      ellipse(x,y,18+(i%3)*5,9,'#35784c');
      ellipse(x-6,y-4,12,9,'#529963');
    }
    drawLittleHouse(45,floorY-120,.65);
    drawLittleHouse(330,floorY-144,.8);
  }
  function drawLittleHouse(x,y,s){
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle='#f5e5cc';ctx.fillRect(-15,0,34,32);
    ctx.fillStyle='#435b65';ctx.beginPath();ctx.moveTo(-21,0);ctx.lineTo(2,-20);ctx.lineTo(24,0);ctx.fill();
    roundedRect(-5,13,10,19,1,'#6d8a81');
    ctx.restore();
  }

  function drawRoll(x,y,w,h,rotation=0) {
    ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(rotation);
    if(pastryImage.complete && pastryImage.naturalWidth){
      ctx.shadowColor='#4b290d85';ctx.shadowBlur=4;ctx.shadowOffsetY=4;
      ctx.drawImage(pastryImage,-w/2,-h/2,w,h);
    }else{
      roundedRect(-w/2+2,-h/2+4,w-4,h-8,12,'#cb7b22');
      roundedRect(-w/2+4,-h/2+2,w-8,h-15,11,'#efa640');
      for(let i=0;i<4;i++)roundedRect(-w/2+23+i*21,-h/2+8,6,h/2,2,'#aa5c20');
    }
    ctx.restore();
  }
  function drawTower(pipe,upper) {
    const x=pipe.x, rowW=116, rowH=58, step=45;
    const left=x-8;
    ctx.save();
    // Slightly shaded dark core helps a tall stack read as one obstacle.
    if(upper){
      ctx.fillStyle='#764624bb';ctx.fillRect(x+10,0,pipe.width-20,Math.max(0,pipe.top-10));
      for(let y=pipe.top-49,i=0;y>-rowH;y-=step,i++){
        drawRoll(left+((i%3)-1)*2.7,y,rowW,rowH,(i%2?-.022:.025)+pipe.tilt);
      }
    }else{
      ctx.fillStyle='#764624bb';ctx.fillRect(x+10,pipe.bottom+10,pipe.width-20,Math.max(0,floorY-pipe.bottom-10));
      for(let y=pipe.bottom-7,i=0;y<floorY+10;y+=step,i++){
        drawRoll(left+((i%3)-1)*2.7,y,rowW,rowH,(i%2?.028:-.018)+pipe.tilt);
      }
    }
    ctx.restore();
  }
  function drawDemoTowers(){
    // Title screen: actual obstacles peek in from the edges.
    drawTower({x:-77,width:100,top:floorY*.41,bottom:floorY*.41+240,tilt:.01},false);
    drawTower({x:W-38,width:100,top:floorY*.36,bottom:floorY*.36+240,tilt:-.02},true);
  }
  function drawDave() {
    const bob = mode==='ready' ? Math.sin(motion*3)*7 : 0;
    const y = dave.y+bob;
    const angle = mode==='ready'?Math.sin(motion*2)*.075:dave.angle;
    ctx.save();ctx.translate(dave.x,y);ctx.rotate(angle);
    const wingFlap = mode==='running'?Math.sin(time*25)*.025:Math.sin(motion*7)*.025;
    ctx.scale(1,1+wingFlap);
    if(playerImage.complete && playerImage.naturalWidth){
      ctx.shadowColor='#062e4f88';ctx.shadowBlur=11;ctx.shadowOffsetY=9;
      ctx.drawImage(playerImage,-90,-47,180,90);
    }else{
      ellipse(-32,0,38,17,'#f4f7fe');ellipse(32,0,38,17,'#f4f7fe');
      ellipse(0,0,27,33,'#f9bc83');
      ellipse(-9,-4,3,3,'#123');ellipse(9,-4,3,3,'#123');
      ctx.beginPath();ctx.arc(0,8,11,0,Math.PI);ctx.strokeStyle='#874a30';ctx.lineWidth=4;ctx.stroke();
    }
    ctx.restore();
  }
  function drawCrumbs(){
    for(const c of crumbs){ctx.globalAlpha=Math.min(1,Math.max(0,c.life*1.3));ellipse(c.x,c.y,c.radius,c.radius*.8,c.color);}
    ctx.globalAlpha=1;
  }
  function drawGround(){
    // Grassy top of a drystone wall.
    ctx.fillStyle='#164e47';ctx.fillRect(0,floorY-2,W,84);
    ctx.fillStyle='#7bc561';ctx.fillRect(0,floorY-6,W,9);
    ctx.fillStyle='#c5e27d';ctx.fillRect(0,floorY-7,W,3);
    // Offset stone courses move in parallax when the game scrolls.
    const stoneShift=(motion*(mode==='running'?80:15))%58;
    for(let row=0;row<3;row++){
      for(let col=-1;col<10;col++){
        const x=col*58-stoneShift+(row%2?27:0);
        const y=floorY+row*26+4;
        roundedRect(x+2,y+1,53,22,5,(row+col)%3===0?'#78928a':(row+col)%2?'#98a99c':'#b6b5a4');
        ctx.fillStyle='#e4dbbf66';ctx.fillRect(x+9,y+3,23,2);
      }
    }
    // Turf tufts.
    ctx.strokeStyle='#d0ec73';ctx.lineWidth=1.5;
    for(let i=0;i<26;i++){
      const x=((i*21-motion*20)%480+480)%480-25;
      ctx.beginPath();ctx.moveTo(x,floorY-6);ctx.lineTo(x-3,floorY-12-(i%3));ctx.moveTo(x,floorY-6);ctx.lineTo(x+3,floorY-11);ctx.stroke();
    }
  }
  function draw(){
    if(!canvas.width || !canvas.height)return;
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    ctx.clearRect(0,0,W,H);
    drawBackground();
    if(mode==='ready')drawDemoTowers();
    else for(const p of pipes){drawTower(p,true);drawTower(p,false);}
    drawCrumbs();if(mode!=='ready')drawDave();drawGround();
  }
  function frame(timestamp){
    const dt=lastFrame?Math.min(.034,(timestamp-lastFrame)/1000):0;
    lastFrame=timestamp;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function action(e) {
    if(e){e.preventDefault();}
    // Prevent duplicate touch+mouse events (pointerdown handles both).
    const now=performance.now();if(now-lastInput<65)return;lastInput=now;
    activateAudio();
    if(mode==='running')flap();
    else if(mode==='ready'||mode==='over')startGame();
  }
  canvas.addEventListener('pointerdown',action,{passive:false});
  document.addEventListener('keydown',(e)=>{
    if(['Space','ArrowUp','KeyW'].includes(e.code)) {
      if(e.repeat)return;
      if(e.target instanceof HTMLElement && e.target.closest('button')) return;
      action(e);
    }
    if(e.code==='Escape'||e.code==='KeyP'){
      e.preventDefault();mode==='running'?pause():mode==='paused'?resume():null;
    }
  });
  $('#playButton').addEventListener('click',()=>{activateAudio();startGame();});
  $('#replayButton').addEventListener('click',()=>{activateAudio();startGame();});
  $('#resumeButton').addEventListener('click',resume);
  $('#pauseButton').addEventListener('click',pause);
  $('#homeButton').addEventListener('click',menu);
  $('#pauseHomeButton').addEventListener('click',menu);
  soundButton.addEventListener('click',()=>{
    soundOn=!soundOn;save('daveFlapsSound',soundOn?'on':'off');refreshSound();
    if(soundOn)beep(520,770,.16,'sine',.05);
  });
  function refreshSound(){
    soundButton.classList.toggle('muted',!soundOn);
    soundButton.setAttribute('aria-label',soundOn?'Mute sound':'Turn sound on');
    soundButton.setAttribute('aria-pressed',String(soundOn));
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden && mode==='running') pause();
    lastFrame=0;
  });
  window.addEventListener('blur',()=>{if(mode==='running')pause();});
  refreshSound();
  resize();
  show('ready');
  requestAnimationFrame(frame);
  if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')) {
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
})();
