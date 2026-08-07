// day - a little film: Core Interaction & Animation Script

// Audio System (Procedural Web Audio API)
let audioCtx = null;
let audioEnabled = true;

function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn("Web Audio API not supported", e);
  }
}

// Resume audio context on interaction (required by browser policies)
function resumeAudio() {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Synthesize a quick bow tension pull sound
function playTensionSound() {
  if (!audioEnabled || !audioCtx) return;
  resumeAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(80, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.5);
  
  gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.5);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.6);
}

// Synthesize arrow release whoosh sound
function playWhoosh() {
  if (!audioEnabled || !audioCtx) return;
  resumeAudio();
  const osc = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.25);
  
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(100, audioCtx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(450, audioCtx.currentTime + 0.25);

  gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  
  osc.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start();
  osc2.start();
  osc.stop(audioCtx.currentTime + 0.3);
  osc2.stop(audioCtx.currentTime + 0.3);
}

// Synthesize heart hit/pop sound
function playPop() {
  if (!audioEnabled || !audioCtx) return;
  resumeAudio();
  const osc = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.15);
  
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(160, audioCtx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
  
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc2.start();
  osc.stop(audioCtx.currentTime + 0.25);
  osc2.stop(audioCtx.currentTime + 0.25);
}

// Synthesize magical tree chimes (pentatonic scale sweep)
function playChimes() {
  if (!audioEnabled || !audioCtx) return;
  resumeAudio();
  
  const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00];
  const now = audioCtx.currentTime;
  
  for (let i = 0; i < 18; i++) {
    const noteDelay = i * 0.14 + Math.random() * 0.05;
    const freq = scale[i % scale.length] * (i >= scale.length ? 1.5 : 1.0);
    
    setTimeout(() => {
      if (!audioEnabled || !audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      // Add a slight vibrato
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.value = 8; // Hz
      lfoGain.gain.value = 5; // depth
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
      lfo.stop(audioCtx.currentTime + 0.8);
    }, noteDelay * 1000);
  }
}

// Background & Interactive Particles Canvas
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let floatingHearts = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Draw a heart path on 2D canvas context
function drawHeartCanvas(c, x, y, size, color, opacity, rotation = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  c.beginPath();
  c.moveTo(0, -size / 4);
  c.bezierCurveTo(size / 2, -size, size, -size / 3, 0, size * 0.85);
  c.bezierCurveTo(-size, -size / 3, -size / 2, -size, 0, -size / 4);
  c.fillStyle = color;
  c.globalAlpha = opacity;
  c.shadowColor = color;
  c.shadowBlur = size * 0.3;
  c.fill();
  c.restore();
}

// Particle Class for Collision Burst
class BurstParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 8;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 2; // slight upward bias
    this.size = 5 + Math.random() * 15;
    this.opacity = 1;
    this.decay = 0.015 + Math.random() * 0.02;
    const colors = ['#e85d75', '#ff7096', '#ff85a2', '#ff97b7', '#ffe5ec', '#ffd166', '#ffffff'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.rotation = Math.random() * Math.PI;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // gravity
    this.opacity -= this.decay;
    this.rotation += this.rotationSpeed;
  }
  
  draw() {
    drawHeartCanvas(ctx, this.x, this.y, this.size, this.color, this.opacity, this.rotation);
  }
}

// Particle Class for Ambient Floating Hearts
class FloatingHeart {
  constructor(isInitial = false) {
    this.x = Math.random() * canvas.width;
    this.y = isInitial ? Math.random() * canvas.height : canvas.height + 50;
    this.size = 4 + Math.random() * 12;
    this.speedY = 0.5 + Math.random() * 1.2;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.opacity = 0.15 + Math.random() * 0.35;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.01 + Math.random() * 0.02;
    const colors = ['#e85d75', '#ff7096', '#ff85a2', '#ff97b7', '#ffe5ec'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
  
  update() {
    this.y -= this.speedY;
    this.wobble += this.wobbleSpeed;
    this.x += this.speedX + Math.sin(this.wobble) * 0.2;
    // reset when floating off screen
    if (this.y < -30) {
      this.y = canvas.height + 30;
      this.x = Math.random() * canvas.width;
    }
  }
  
  draw() {
    drawHeartCanvas(ctx, this.x, this.y, this.size, this.color, this.opacity, 0);
  }
}

// Populate initial ambient hearts
for (let i = 0; i < 30; i++) {
  floatingHearts.push(new FloatingHeart(true));
}

// Particle Animation Loop
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Render ambient floating hearts
  floatingHearts.forEach(heart => {
    heart.update();
    heart.draw();
  });
  
  // Render explosion particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.opacity <= 0) {
      particles.splice(i, 1);
    }
  }
  
  requestAnimationFrame(animateParticles);
}
animateParticles();

// Trigger explosion at (x, y) client coordinates
function spawnExplosion(clientX, clientY) {
  for (let i = 0; i < 60; i++) {
    particles.push(new BurstParticle(clientX, clientY));
  }
}


// Interactive Bow & Arrow Mechanics
const svg = document.getElementById('game-svg');
const bowArrowGroup = document.getElementById('bow-arrow-group');
const bowString = document.getElementById('bow-string');
const bowLimb = document.getElementById('bow-limb');
const arrowGroup = document.getElementById('arrow-group');
const dragHandle = document.getElementById('drag-handle');
const dragInstruction = document.getElementById('drag-instruction');
const heartTarget = document.getElementById('heart-target');
const heartPulseGlow = document.getElementById('heart-pulse-glow');
const headerText = document.getElementById('header-text');

// Bow configuration & parameters
const bowOrigin = { x: 180, y: 850 };
const heartCenter = { x: 960, y: 540 };

// Calculate angle between bow center and target heart
const dx = heartCenter.x - bowOrigin.x;
const dy = heartCenter.y - bowOrigin.y;
const bowAngleRad = Math.atan2(dy, dx);
const bowAngleDeg = bowAngleRad * 180 / Math.PI;

// Rotate the bow group to point exactly at the heart
bowArrowGroup.setAttribute('transform', `translate(${bowOrigin.x}, ${bowOrigin.y}) rotate(${bowAngleDeg})`);

// Drag variables
let isDragging = false;
let pullDistance = 0;
const maxPull = 140; // Max drag pullback in local coordinates

// Convert screen cursor to local bow-group coordinate system
function getLocalCoords(e) {
  const pt = svg.createSVGPoint();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  pt.x = clientX;
  pt.y = clientY;
  
  // Transform screen to SVG coordinates
  const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
  
  // Shift by bow center
  const rx = svgP.x - bowOrigin.x;
  const ry = svgP.y - bowOrigin.y;
  
  // Rotate backward by bowAngleRad to align with local x-axis
  const lx = rx * Math.cos(-bowAngleRad) - ry * Math.sin(-bowAngleRad);
  const ly = rx * Math.sin(-bowAngleRad) + ry * Math.cos(-bowAngleRad);
  
  return { x: lx, y: ly };
}

// Drag Handlers
function startDrag(e) {
  e.preventDefault();
  isDragging = true;
  dragHandle.style.cursor = 'grabbing';
  initAudio();
  resumeAudio();
}

function handleDrag(e) {
  if (!isDragging) return;
  
  const local = getLocalCoords(e);
  
  // The arrow rests at nock position x = -120. Dragging left/pulling back means local x goes negative.
  // The pull distance is how far left from -120 the cursor goes.
  const rawPull = -120 - local.x;
  pullDistance = Math.max(0, Math.min(maxPull, rawPull));
  
  // Update bow graphics dynamically based on pull
  updateBowVisuals(pullDistance);
  
  // Play subtle ticking sound dynamically as pull increases
  if (Math.random() < 0.08) {
    playTensionSound();
  }
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  dragHandle.style.cursor = 'grab';
  
  if (pullDistance > 35) {
    // Fire the arrow!
    fireArrow(pullDistance);
  } else {
    // Snap back gently
    animateSnapBack();
  }
}

// Wire drag event listeners
dragHandle.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', handleDrag);
window.addEventListener('mouseup', endDrag);

dragHandle.addEventListener('touchstart', startDrag, { passive: false });
window.addEventListener('touchmove', handleDrag, { passive: false });
window.addEventListener('touchend', endDrag);

// Update bow and string curvature based on pull distance
function updateBowVisuals(pull) {
  // Translate the arrow backward
  arrowGroup.setAttribute('transform', `translate(${-pull}, 0)`);
  
  // Bend the bow string: pulls back from origin (0,0) to (-pull, 0)
  bowString.setAttribute('d', `M -20 -90 L ${-pull} 0 L -20 90`);
  
  // Bend the bow limb: flatter/deeper curve based on tension
  const bendingFactor = 60 - pull * 0.25;
  bowLimb.setAttribute('d', `M -20 -90 Q ${bendingFactor} 0 -20 90`);
}

// Smoothly slide bow & string back to resting position
function animateSnapBack() {
  let currentPull = pullDistance;
  function step() {
    if (isDragging) return;
    currentPull *= 0.7; // spring damping
    if (currentPull < 1) {
      currentPull = 0;
      updateBowVisuals(0);
    } else {
      updateBowVisuals(currentPull);
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}


// Arrow Shooting & Flight Mechanics
let isArrowFlying = false;

function fireArrow(firedPull) {
  if (isArrowFlying) return;
  isArrowFlying = true;
  
  // Fade out instruction text and header title
  dragInstruction.classList.add('fade-out');
  headerText.classList.add('fade-out');
  
  // Play shooting whoosh sound
  playWhoosh();
  
  // Snap the bow string and limb back instantly
  bowString.setAttribute('d', `M -20 -90 L 0 0 L -20 90`);
  bowLimb.setAttribute('d', `M -20 -90 Q 60 0 -20 90`);
  
  // Animate the arrow flying forward along local positive x-axis
  let localX = -firedPull;
  
  // Calculate exact target local coordinate (distance from bowOrigin to heartCenter)
  const targetDistance = Math.sqrt(dx * dx + dy * dy);
  
  // Velocity is proportional to pull distance (18px to 38px per frame)
  const velocity = 15 + (firedPull / maxPull) * 20;
  
  function flightStep() {
    localX += velocity;
    
    // Check if arrow head (localX + 60) reaches target zone
    if (localX + 60 >= targetDistance - 40) {
      // Hit target!
      triggerCollision();
    } else {
      arrowGroup.setAttribute('transform', `translate(${localX}, 0)`);
      requestAnimationFrame(flightStep);
    }
  }
  requestAnimationFrame(flightStep);
}

// Hit Sequence
function triggerCollision() {
  isArrowFlying = false;
  
  // Hide arrow and target heart
  arrowGroup.classList.add('hidden');
  bowArrowGroup.classList.add('fade-out');
  heartTarget.classList.add('hit');
  heartPulseGlow.classList.add('fade-out');
  
  // Synthesize hitting pop sound
  playPop();
  
  // Spawn particle explosion at visual heart center
  // Convert 1920x1080 SVG coordinates (960, 540) to screen coordinates
  const svgRect = svg.getBoundingClientRect();
  const scaleX = svgRect.width / 1920;
  const scaleY = svgRect.height / 1080;
  const screenX = svgRect.left + 960 * scaleX;
  const screenY = svgRect.top + 540 * scaleY;
  
  spawnExplosion(screenX, screenY);
  
  // Start growing the tree
  setTimeout(() => {
    growTree();
  }, 300);
}


// Procedural Tree & Blooming Canopy
const treeGroup = document.getElementById('tree-group');

// Define path coordinates for organic tree trunk and branches
// Layout is designed to fill a central heart shape
const branchesData = [
  // Trunk (grows bottom up)
  { d: "M 960 900 Q 960 740 960 620", width: 14 },
  
  // Major branches
  { d: "M 960 720 Q 910 650 830 630", width: 9 },
  { d: "M 960 720 Q 1010 650 1090 630", width: 9 },
  { d: "M 960 650 Q 920 540 880 500", width: 8 },
  { d: "M 960 650 Q 1000 540 1040 500", width: 8 },
  
  // Sub-branches
  { d: "M 830 630 Q 770 610 710 560", width: 5 },
  { d: "M 830 630 Q 820 560 780 490", width: 5 },
  { d: "M 1090 630 Q 1150 610 1210 560", width: 5 },
  { d: "M 1090 630 Q 1100 560 1140 490", width: 5 },
  
  // Top canopy sub-branches
  { d: "M 880 500 Q 820 450 840 370", width: 4 },
  { d: "M 880 500 Q 920 440 890 350", width: 4 },
  { d: "M 1040 500 Q 1100 450 1080 370", width: 4 },
  { d: "M 1040 500 Q 1000 440 1030 350", width: 4 },
  
  // Twig extensions
  { d: "M 710 560 Q 660 550 630 520", width: 2.5 },
  { d: "M 710 560 Q 730 510 700 460", width: 2.5 },
  { d: "M 1210 560 Q 1260 550 1290 520", width: 2.5 },
  { d: "M 1210 560 Q 1190 510 1220 460", width: 2.5 }
];

function growTree() {
  // Create and append SVG path elements for branches
  const paths = branchesData.map((data, index) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", data.d);
    path.setAttribute("class", "branch-path");
    path.setAttribute("stroke-width", data.width);
    treeGroup.appendChild(path);
    
    // Set up path stroke animation
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    
    return { element: path, length: length };
  });
  
  // Animate sequential branch growth
  // 1. Trunk grows first
  animateBranch(paths[0], 1000, 0, () => {
    // 2. Main branches grow
    const mainBranches = paths.slice(1, 5);
    mainBranches.forEach(p => animateBranch(p, 800, 0));
    
    // 3. Sub branches grow with offset delay
    setTimeout(() => {
      const subBranches = paths.slice(5, 9);
      subBranches.forEach(p => animateBranch(p, 800, 0));
    }, 400);
    
    // 4. Canopy extensions grow
    setTimeout(() => {
      const canopy = paths.slice(9, 13);
      canopy.forEach(p => animateBranch(p, 800, 0));
    }, 700);

    // 5. Twigs grow
    setTimeout(() => {
      const twigs = paths.slice(13);
      twigs.forEach(p => animateBranch(p, 800, 0));
    }, 1000);
    
    // 6. Trigger bloom animation during the growth
    setTimeout(() => {
      bloomCanopy();
    }, 800);
  });
}

function animateBranch(pathObj, duration, delay, callback) {
  setTimeout(() => {
    let start = null;
    const len = pathObj.length;
    
    function step(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      
      // Interpolate dash offset from length to 0
      pathObj.element.style.strokeDashoffset = len * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        if (callback) callback();
      }
    }
    requestAnimationFrame(step);
  }, delay);
}

// Generate leaf locations conforming to the mathematical heart-envelope
function bloomCanopy() {
  const leafCount = 180;
  const leaves = [];
  
  // Heart parameters
  const cx = 960;
  const cy = 480;
  const scale = 17.5; // Controls visual size of heart canopy
  
  // Colors for premium bouquet look
  const leafColors = [
    '#e85d75', // primary rose
    '#ff7096', // warm pink
    '#ff85a2', // soft pink
    '#ff97b7', // blush
    '#ffe5ec', // pastel pink
    '#fff0f3', // cream pink
    '#ffd166', // pastel gold accent
    '#ffffff'  // white accents
  ];
  
  // Play beautiful chime sounds procedurally
  playChimes();

  for (let i = 0; i < leafCount; i++) {
    // Angle parameter t goes around 0 to 2*PI
    const t = Math.random() * Math.PI * 2;
    
    // Parametric heart formula coordinates
    const bx = 16 * Math.pow(Math.sin(t), 3);
    const by = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    
    // Distribution factor inside the heart envelope
    // Radial bias creates beautiful leaf clustering towards edges and trunk
    const r = Math.pow(Math.random(), 0.65);
    
    // Final coordinates (y-axis inverted in SVG coordinate space)
    const lx = cx + bx * scale * r + (Math.random() - 0.5) * 15;
    const ly = cy - by * scale * r + (Math.random() - 0.5) * 15;
    
    // Leaf styling parameters
    const size = 12 + Math.random() * 22;
    const color = leafColors[Math.floor(Math.random() * leafColors.length)];
    const rotation = (Math.random() - 0.5) * 60; // tilt angle
    const targetScale = 0.5 + Math.random() * 0.7; // springy final size
    const delay = Math.random() * 1.8; // blooming delays over 1.8s
    
    // Create Leaf SVG Node
    const leaf = document.createElementNS("http://www.w3.org/2000/svg", "path");
    // Heart path scaled to (size)
    leaf.setAttribute("d", "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z");
    leaf.setAttribute("class", "leaf-heart");
    leaf.setAttribute("fill", color);
    
    // Translate origin offset relative to heart bounding box center (12,12)
    leaf.style.transformOrigin = `${lx}px ${ly}px`;
    leaf.style.transform = `translate(${lx - 12}px, ${ly - 12}px) scale(0) rotate(${rotation}deg)`;
    leaf.style.transition = `transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
    
    treeGroup.appendChild(leaf);
    
    leaves.push({
      element: leaf,
      lx: lx,
      ly: ly,
      rot: rotation,
      scale: targetScale,
      delay: delay
    });
  }
  
  // Trigger CSS transition scaling for each leaf
  leaves.forEach(l => {
    setTimeout(() => {
      l.element.style.transform = `translate(${l.lx - 12}px, ${l.ly - 12}px) scale(${l.scale}) rotate(${l.rot}deg)`;
      l.element.style.opacity = 1;
    }, l.delay * 1000);
  });
  
  // Slide in the glassmorphic card after tree has blossomed
  setTimeout(() => {
    showCard();
  }, 2200);
}


// Card and Modal Envelope Transitions
const birthdayCard = document.getElementById('birthday-card');
const openEnvelopeBtn = document.getElementById('open-envelope-btn');
const envelopeModal = document.getElementById('envelope-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const envelope = document.querySelector('.envelope');

function showCard() {
  birthdayCard.classList.remove('card-hidden');
  birthdayCard.classList.add('card-show');
}

openEnvelopeBtn.addEventListener('click', () => {
  envelopeModal.classList.remove('modal-hidden');
  envelopeModal.classList.add('modal-show');
});

// Click envelope to fold open and slide out letter
envelope.addEventListener('click', (e) => {
  // Prevent double triggers if clicking internal card content
  if (envelope.classList.contains('open') && e.target.closest('.envelope-paper')) {
    return;
  }
  
  if (!envelope.classList.contains('open')) {
    envelope.classList.add('open');
    if (audioEnabled && audioCtx) {
      // Soft chime or rustle trigger
      resumeAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }
  } else {
    // Toggle closure on envelope body click
    envelope.classList.remove('open');
  }
});

// Close envelope modal
closeModalBtn.addEventListener('click', () => {
  envelopeModal.classList.add('modal-hidden');
  envelopeModal.classList.remove('modal-show');
  envelope.classList.remove('open'); // reset envelope fold state
});


// Audio Control Button Interaction
const audioToggle = document.getElementById('audio-toggle');
const soundOnIcon = audioToggle.querySelector('.sound-on-icon');
const soundOffIcon = audioToggle.querySelector('.sound-off-icon');

audioToggle.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  if (audioEnabled) {
    audioToggle.classList.add('unmuted');
    soundOnIcon.classList.remove('hidden');
    soundOffIcon.classList.add('hidden');
    resumeAudio();
  } else {
    audioToggle.classList.remove('unmuted');
    soundOnIcon.classList.add('hidden');
    soundOffIcon.classList.remove('hidden');
  }
});

// Pre-initialize audio contexts on first screen click
window.addEventListener('click', () => {
  initAudio();
  resumeAudio();
}, { once: true });

window.addEventListener('touchstart', () => {
  initAudio();
  resumeAudio();
}, { once: true });
