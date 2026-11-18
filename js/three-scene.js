/**
 * CyberDimension 3D Engine - Three.js WebGL Interactive Universe
 * Handles 7-sector 3D architecture, spline camera flight with dynamic banking & FOV warp,
 * 3D hyperdrive speed streaks on EVERY scroll, multi-ring radial shockwaves,
 * real-time vertex terrain waves, and interactive quantum geometry morphing.
 */

class CyberScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error('Canvas element not found:', canvasId);
      return;
    }

    // Color Dimension Themes
    this.themes = {
      cyber: {
        primary: 0x00f0ff,   // Cyber Cyan
        secondary: 0xff007f, // Neon Magenta
        accent: 0x7000ff,    // Royal Purple
        ambient: 0x070b19,
        bgTint: '#04060d'
      },
      cosmos: {
        primary: 0xa855f7,   // Electric Purple
        secondary: 0x38bdf8, // Sky Blue
        accent: 0xf43f5e,    // Rose
        ambient: 0x08061a,
        bgTint: '#060714'
      },
      solar: {
        primary: 0xf59e0b,   // Solar Gold
        secondary: 0xff4500, // Flare Orange
        accent: 0x10b981,    // Emerald Mint
        ambient: 0x150904,
        bgTint: '#0c0604'
      },
      emerald: {
        primary: 0x10b981,   // Emerald Matrix
        secondary: 0x06b6d4, // Neon Cyan
        accent: 0xa3e635,    // Lime Electric
        ambient: 0x03140f,
        bgTint: '#030a08'
      }
    };

    this.currentThemeKey = 'cyber';
    this.activeTheme = this.themes.cyber;

    // Scroll & Physics variables
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.scrollVelocity = 0;
    this.smoothedVelocity = 0;
    this.prevTargetProgress = 0;
    this.scrollImpulse = 0; // Decaying burst of energy on every scroll
    this.scrollDirection = 1; // 1 = down, -1 = up
    this.lastScrollTime = 0;
    this.lastShockwaveTime = 0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isWireframeMode = false;
    this.currentLabGeometry = 'knot';

    // Time & Raycasting
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouseCoords = new THREE.Vector2(-999, -999);
    this.hoveredObject = null;

    // 7 Zone Spline Waypoints [t, camPos, lookAt, sectorName]
    // Normalized scroll t from 0.00 (Hero Genesis) to 1.00 (Contact Quantum Horizon)
    this.waypoints = [
      { t: 0.00, pos: new THREE.Vector3(0, 0, 32), look: new THREE.Vector3(0, 0, 0), sector: 'SECTOR // 01 : SINGULARITY CORE' },
      { t: 0.17, pos: new THREE.Vector3(12, -36, 24), look: new THREE.Vector3(2, -36, 0), sector: 'SECTOR // 02 : BIO-DIGITAL HELIX' },
      { t: 0.34, pos: new THREE.Vector3(-14, -74, 26), look: new THREE.Vector3(0, -74, 0), sector: 'SECTOR // 03 : TECH CONSTELLATION' },
      { t: 0.51, pos: new THREE.Vector3(14, -114, 25), look: new THREE.Vector3(3, -114, 0), sector: 'SECTOR // 04 : DIMENSIONAL VAULT' },
      { t: 0.68, pos: new THREE.Vector3(0, -154, 28), look: new THREE.Vector3(0, -158, -15), sector: 'SECTOR // 05 : CYBER HIGHWAY PATH' },
      { t: 0.84, pos: new THREE.Vector3(-12, -194, 24), look: new THREE.Vector3(0, -194, 0), sector: 'SECTOR // 06 : 3D QUANTUM LAB' },
      { t: 1.00, pos: new THREE.Vector3(0, -236, 22), look: new THREE.Vector3(0, -236, 0), sector: 'SECTOR // 07 : QUANTUM HORIZON' }
    ];

    this.initThree();
    this.createLights();
    this.createStarfield();
    this.createWarpStream();
    this.createZoneHero();
    this.createZoneAbout();
    this.createZoneSkills();
    this.createZoneProjects();
    this.createZoneExperience();
    this.createZoneLab();
    this.createZoneContact();
    this.createShockwaveSystem();
    this.createScrollSparksSystem();
    this.bindEvents();
    this.animate();
  }

  initThree() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Scene with fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04060d, 0.008);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 1200);
    this.camera.position.set(0, 0, 32);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.cameraBanking = 0;
    this.cameraPitch = 0;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
  }

  createLights() {
    this.ambientLight = new THREE.AmbientLight(this.activeTheme.ambient, 2.5);
    this.scene.add(this.ambientLight);

    // Primary Dynamic Point Light (follows camera along descent)
    this.primaryPointLight = new THREE.PointLight(this.activeTheme.primary, 3.8, 95);
    this.primaryPointLight.position.set(15, 10, 20);
    this.scene.add(this.primaryPointLight);

    // Secondary Accent Light
    this.secondaryPointLight = new THREE.PointLight(this.activeTheme.secondary, 3.2, 85);
    this.secondaryPointLight.position.set(-15, -10, 15);
    this.scene.add(this.secondaryPointLight);

    // Rim Directional Light
    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    this.dirLight.position.set(0, 50, 40);
    this.scene.add(this.dirLight);
  }

  // =========================================================================
  // 3D HYPERDRIVE WARP STREAM LINES (STRETCH AND ZOOM ON EVERY SCROLL!)
  // =========================================================================
  createWarpStream() {
    this.warpCount = 520;
    const positions = new Float32Array(this.warpCount * 6);
    const colors = new Float32Array(this.warpCount * 6);
    this.warpData = [];

    const cPri = new THREE.Color(this.activeTheme.primary);
    const cSec = new THREE.Color(this.activeTheme.secondary);
    const cAcc = new THREE.Color(this.activeTheme.accent);

    for (let i = 0; i < this.warpCount; i++) {
      const t = Math.random();
      const pt = this.getSplinePoint(t);
      const ptNext = this.getSplinePoint(Math.min(0.9999, t + 0.025));
      const tangent = new THREE.Vector3().subVectors(ptNext.pos, pt.pos).normalize();
      if (tangent.lengthSq() < 0.001) tangent.set(0, -1, 0);

      const ref = Math.abs(tangent.y) > 0.85 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, ref).normalize();
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      const radius = 3.5 + Math.random() * 22.0;
      const angle = Math.random() * Math.PI * 2;
      const radialOffset = normal.clone().multiplyScalar(Math.cos(angle) * radius)
                            .add(binormal.clone().multiplyScalar(Math.sin(angle) * radius));

      const headPos = pt.pos.clone().add(radialOffset);

      positions[i * 6] = headPos.x;
      positions[i * 6 + 1] = headPos.y;
      positions[i * 6 + 2] = headPos.z;

      positions[i * 6 + 3] = headPos.x;
      positions[i * 6 + 4] = headPos.y;
      positions[i * 6 + 5] = headPos.z;

      const pick = Math.random();
      const col = pick > 0.6 ? cPri : (pick > 0.3 ? cSec : cAcc);
      colors[i * 6] = col.r;
      colors[i * 6 + 1] = col.g;
      colors[i * 6 + 2] = col.b;
      colors[i * 6 + 3] = col.r * 0.25;
      colors[i * 6 + 4] = col.g * 0.25;
      colors[i * 6 + 5] = col.b * 0.25;

      this.warpData.push({
        basePos: headPos.clone(),
        tangent: tangent.clone(),
        speed: 0.9 + Math.random() * 1.8,
        lengthMultiplier: 1.0 + Math.random() * 1.6
      });
    }

    this.warpGeo = new THREE.BufferGeometry();
    this.warpGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.warpGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.warpMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      linewidth: 1.5
    });

    this.warpLines = new THREE.LineSegments(this.warpGeo, this.warpMat);
    this.scene.add(this.warpLines);
  }

  // --- GLOBAL STARFIELD ---
  createStarfield() {
    const count = 2400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cPrimary = new THREE.Color(this.activeTheme.primary);
    const cSec = new THREE.Color(this.activeTheme.secondary);
    const cWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = 40 - Math.random() * 300;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 70;

      const pick = Math.random();
      let c = cWhite;
      if (pick > 0.6) c = cPrimary;
      else if (pick > 0.3) c = cSec;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.starGeo = new THREE.BufferGeometry();
    this.starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.starMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.starfield = new THREE.Points(this.starGeo, this.starMat);
    this.scene.add(this.starfield);
  }

  // =========================================================================
  // MULTI-RING EXPANDING CHROMATIC SHOCKWAVE SYSTEM (TRIGGERS ON EVERY SCROLL!)
  // =========================================================================
  createShockwaveSystem() {
    this.shockwaves = [];
    const ringGeo = new THREE.RingGeometry(0.6, 0.88, 54);

    for (let i = 0; i < 32; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: this.activeTheme.primary,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.shockwaves.push({ mesh, mat, life: 0, maxLife: 1, intensity: 1, rotSpeed: 0.02, isNear: true });
    }
  }

  createScrollSparksSystem() {
    this.sparkCount = 260;
    const positions = new Float32Array(this.sparkCount * 3);
    const colors = new Float32Array(this.sparkCount * 3);
    this.sparkData = [];

    const cPri = new THREE.Color(this.activeTheme.primary);
    const cSec = new THREE.Color(this.activeTheme.secondary);
    const cWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < this.sparkCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = -9999;

      colors[i * 3] = cPri.r;
      colors[i * 3 + 1] = cPri.g;
      colors[i * 3 + 2] = cPri.b;

      this.sparkData.push({
        life: 0,
        maxLife: 0.55,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        color: Math.random() > 0.5 ? (Math.random() > 0.5 ? cPri : cSec) : cWhite
      });
    }

    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.sparkGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(0,240,255,0.9)');
    grad.addColorStop(0.75, 'rgba(0,240,255,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const sparkTex = new THREE.CanvasTexture(canvas);

    this.sparkMat = new THREE.PointsMaterial({
      size: 4.8,
      map: sparkTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparkPoints = new THREE.Points(this.sparkGeo, this.sparkMat);
    this.scene.add(this.sparkPoints);
  }

  emitScrollSparks(direction = 1, count = 12, intensity = 1.0) {
    if (!this.sparkData || !this.camera) return;

    const forward = new THREE.Vector3().subVectors(this.cameraTarget, this.camera.position).normalize();
    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();

    let spawned = 0;
    for (let i = 0; i < this.sparkCount && spawned < count; i++) {
      const sp = this.sparkData[i];
      if (sp.life <= 0) {
        const diskAngle = Math.random() * Math.PI * 2;
        const diskRadius = 1.2 + Math.random() * 5.2;
        const forwardDist = 5.5 + Math.random() * 4.5;

        const origin = this.camera.position.clone()
          .addScaledVector(forward, forwardDist)
          .addScaledVector(right, Math.cos(diskAngle) * diskRadius)
          .addScaledVector(up, Math.sin(diskAngle) * diskRadius);

        sp.x = origin.x;
        sp.y = origin.y;
        sp.z = origin.z;

        const burstSpeed = (4.0 + Math.random() * 7.5) * intensity;
        const streamSpeed = (-direction * (14.0 + Math.random() * 16.0)) * intensity;

        sp.vx = (Math.cos(diskAngle) * burstSpeed) + (forward.x * streamSpeed);
        sp.vy = (Math.sin(diskAngle) * burstSpeed) + (forward.y * streamSpeed);
        sp.vz = ((Math.random() - 0.5) * burstSpeed) + (forward.z * streamSpeed);

        sp.life = 1.0;
        sp.maxLife = 0.38 + Math.random() * 0.45;
        spawned++;
      }
    }
  }

  triggerShockwave(originVec, intensity = 1.0, colorOverride = null, isNearFrustum = true) {
    const sw = this.shockwaves.find(s => s.life <= 0) || this.shockwaves[0];
    let spawnPos;
    if (originVec) {
      spawnPos = originVec.clone();
    } else if (isNearFrustum) {
      const forward = new THREE.Vector3().subVectors(this.cameraTarget, this.camera.position).normalize();
      spawnPos = this.camera.position.clone().addScaledVector(forward, 9.2);
    } else {
      spawnPos = this.cameraTarget.clone().add(new THREE.Vector3(0, 0, -2));
    }

    sw.mesh.position.copy(spawnPos);
    sw.mesh.lookAt(this.camera.position);
    sw.mesh.scale.set(0.1, 0.1, 0.1);
    sw.mesh.visible = true;
    sw.life = 1.0;
    sw.intensity = intensity;
    sw.isNear = isNearFrustum;
    sw.mat.color.set(colorOverride || this.activeTheme.primary);
    sw.mat.opacity = 0.95 * intensity;
    sw.rotSpeed = (Math.random() - 0.5) * 0.05;

    if (window.cyberAudio) {
      window.cyberAudio.playShockwave();
    }
  }

  // Multi-ring chromatic burst when scrolling vigorously
  triggerChromaticShockwave(originVec, intensity = 1.5) {
    this.triggerShockwave(originVec, intensity, this.activeTheme.primary, true);
    setTimeout(() => {
      this.triggerShockwave(originVec, intensity * 0.85, this.activeTheme.secondary, true);
    }, 45);
    setTimeout(() => {
      this.triggerShockwave(originVec, intensity * 0.65, this.activeTheme.accent, true);
    }, 90);
    this.triggerShockwave(null, intensity * 0.75, this.activeTheme.primary, false);
  }

  // =========================================================================
  // ZONE 0: HERO (GENESIS SINGULARITY CORE) [Y = 0]
  // =========================================================================
  createZoneHero() {
    this.heroGroup = new THREE.Group();
    this.heroGroup.position.set(0, 0, 0);

    // 1. Central Morphing Icosahedron Core
    const coreGeo = new THREE.IcosahedronGeometry(4.2, 2);
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0x060b18,
      emissive: this.activeTheme.primary,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: false
    });
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
    this.heroGroup.add(this.coreMesh);

    // Inner wireframe lattice
    const wireGeo = new THREE.IcosahedronGeometry(4.28, 1);
    this.coreWireMat = new THREE.MeshBasicMaterial({
      color: this.activeTheme.primary,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    this.coreWireMesh = new THREE.Mesh(wireGeo, this.coreWireMat);
    this.heroGroup.add(this.coreWireMesh);

    // 2. Nested Gimbal Gyroscope Rings (Flare outward on scroll impulse)
    this.gimbalRings = [];
    const ringConfigs = [
      { radius: 6.8, tube: 0.09, color: this.activeTheme.primary, rx: 0.5, ry: 0.2, baseRadius: 6.8 },
      { radius: 8.6, tube: 0.08, color: this.activeTheme.secondary, rx: 1.2, ry: 0.8, baseRadius: 8.6 },
      { radius: 10.4, tube: 0.07, color: this.activeTheme.accent, rx: 0.2, ry: 1.5, baseRadius: 10.4 }
    ];

    ringConfigs.forEach((cfg) => {
      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 100);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.65,
        roughness: 0.3,
        metalness: 0.85
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.set(cfg.rx, cfg.ry, 0);
      ring.userData = cfg;
      this.heroGroup.add(ring);
      this.gimbalRings.push(ring);
    });

    // 3. Orbiting Data Diamonds / Satellites
    this.satellites = [];
    const satGeo = new THREE.OctahedronGeometry(0.55, 0);
    for (let i = 0; i < 6; i++) {
      const satMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? this.activeTheme.primary : this.activeTheme.secondary,
        emissive: i % 2 === 0 ? this.activeTheme.primary : this.activeTheme.secondary,
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.2
      });
      const sat = new THREE.Mesh(satGeo, satMat);
      sat.userData = {
        orbitRadius: 7.2 + (i % 3) * 1.8,
        speed: 0.9 + i * 0.25,
        angle: (i / 6) * Math.PI * 2,
        inclination: (i - 3) * 0.35
      };
      this.heroGroup.add(sat);
      this.satellites.push(sat);
    }

    this.scene.add(this.heroGroup);
  }

  // =========================================================================
  // ZONE 1: ABOUT (BIO-DIGITAL DNA HELIX) [Y = -36]
  // =========================================================================
  createZoneAbout() {
    this.aboutGroup = new THREE.Group();
    this.aboutGroup.position.set(0, -36, 0);

    const steps = 36;
    const radius = 3.8;
    const height = 26;
    this.helixNodes = [];

    const sphereGeo = new THREE.SphereGeometry(0.36, 12, 12);
    const cylinderGeo = new THREE.CylinderGeometry(0.045, 0.045, 1, 8);

    this.helixMatA = new THREE.MeshStandardMaterial({
      color: this.activeTheme.primary,
      emissive: this.activeTheme.primary,
      emissiveIntensity: 0.8,
      metalness: 0.7
    });

    this.helixMatB = new THREE.MeshStandardMaterial({
      color: this.activeTheme.secondary,
      emissive: this.activeTheme.secondary,
      emissiveIntensity: 0.8,
      metalness: 0.7
    });

    this.rungMat = new THREE.MeshBasicMaterial({
      color: 0x4a5568,
      transparent: true,
      opacity: 0.6
    });

    for (let i = 0; i < steps; i++) {
      const prog = i / steps;
      const y = (prog - 0.5) * height;
      const angle = prog * Math.PI * 4;

      // Node A
      const xA = Math.cos(angle) * radius;
      const zA = Math.sin(angle) * radius;
      const nodeA = new THREE.Mesh(sphereGeo, this.helixMatA);
      nodeA.position.set(xA, y, zA);
      this.aboutGroup.add(nodeA);

      // Node B (opposite strand)
      const xB = Math.cos(angle + Math.PI) * radius;
      const zB = Math.sin(angle + Math.PI) * radius;
      const nodeB = new THREE.Mesh(sphereGeo, this.helixMatB);
      nodeB.position.set(xB, y, zB);
      this.aboutGroup.add(nodeB);

      // Connecting rung
      const rung = new THREE.Mesh(cylinderGeo, this.rungMat.clone());
      rung.position.set((xA + xB) / 2, y, (zA + zB) / 2);
      rung.scale.set(1, radius * 2, 1);
      rung.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(xA - xB, 0, zA - zB).normalize()
      );
      this.aboutGroup.add(rung);

      this.helixNodes.push({ nodeA, nodeB, rung, baseAngle: angle, y, index: i });
    }

    // Holographic architectural floating panels
    this.aboutPanels = [];
    for (let p = 0; p < 3; p++) {
      const panelGeo = new THREE.PlaneGeometry(3.6, 2.4);
      const panelMat = new THREE.MeshBasicMaterial({
        color: this.activeTheme.primary,
        wireframe: true,
        transparent: true,
        opacity: 0.35
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(-6 + p * 6, (p - 1) * 6, -3 + p * 2);
      panel.rotation.y = (p - 1) * 0.4;
      this.aboutGroup.add(panel);
      this.aboutPanels.push(panel);
    }

    this.scene.add(this.aboutGroup);
  }

  // =========================================================================
  // ZONE 2: SKILLS (TECH CONSTELLATION GALAXY) [Y = -74]
  // =========================================================================
  createZoneSkills() {
    this.skillsGroup = new THREE.Group();
    this.skillsGroup.position.set(0, -74, 0);

    // Central dodecahedron core
    const centralGeo = new THREE.DodecahedronGeometry(3.6, 0);
    this.skillsCenterMat = new THREE.MeshStandardMaterial({
      color: 0x070c1d,
      emissive: this.activeTheme.primary,
      emissiveIntensity: 0.5,
      wireframe: true
    });
    this.skillsCenterMesh = new THREE.Mesh(centralGeo, this.skillsCenterMat);
    this.skillsGroup.add(this.skillsCenterMesh);

    // 6 Orbital Skill Nodes
    this.skillNodes = [];
    const skillCategories = [
      { name: 'WebGL & 3D', color: this.activeTheme.primary, geo: new THREE.OctahedronGeometry(1.2, 0) },
      { name: 'Creative Shaders', color: this.activeTheme.secondary, geo: new THREE.IcosahedronGeometry(1.1, 0) },
      { name: 'Frontend Architecture', color: this.activeTheme.accent, geo: new THREE.TetrahedronGeometry(1.3, 0) },
      { name: 'Real-time Audio', color: 0x10b981, geo: new THREE.TorusKnotGeometry(0.7, 0.2, 32, 8) },
      { name: 'Generative Tech', color: 0xf59e0b, geo: new THREE.DodecahedronGeometry(1.0, 0) },
      { name: 'Cloud & Systems', color: 0x06b6d4, geo: new THREE.BoxGeometry(1.2, 1.2, 1.2) }
    ];

    const linesPositions = [];

    skillCategories.forEach((cat, idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: cat.color,
        emissive: cat.color,
        emissiveIntensity: 0.65,
        roughness: 0.3,
        metalness: 0.8
      });
      const node = new THREE.Mesh(cat.geo, mat);
      const angle = (idx / skillCategories.length) * Math.PI * 2;
      const radius = 8.5 + (idx % 2) * 2.5;
      const x = Math.cos(angle) * radius;
      const y = (idx % 3 - 1) * 3.5;
      const z = Math.sin(angle) * radius;

      node.position.set(x, y, z);
      node.userData = {
        name: cat.name,
        angle,
        radius,
        baseY: y,
        rotSpeed: 0.015 + idx * 0.005,
        origColor: cat.color
      };

      this.skillsGroup.add(node);
      this.skillNodes.push(node);

      linesPositions.push(0, 0, 0, x, y, z);
    });

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linesPositions, 3));
    this.skillLinesMat = new THREE.LineBasicMaterial({
      color: this.activeTheme.primary,
      transparent: true,
      opacity: 0.4
    });
    this.skillLines = new THREE.LineSegments(lineGeo, this.skillLinesMat);
    this.skillsGroup.add(this.skillLines);

    this.scene.add(this.skillsGroup);
  }

  // =========================================================================
  // ZONE 3: PROJECTS (DIMENSIONAL VAULT) [Y = -114]
  // =========================================================================
  createZoneProjects() {
    this.projectsGroup = new THREE.Group();
    this.projectsGroup.position.set(0, -114, 0);

    this.projectPortals = [];
    const portalData = [
      { title: 'NEURA-GL', color: this.activeTheme.primary, x: -7.5, y: 5.5, z: 2.5 },
      { title: 'AETHERIA SPATIAL', color: this.activeTheme.secondary, x: 7.5, y: 2, z: -2 },
      { title: 'CHRONOS ARCHIVE', color: this.activeTheme.accent, x: -7.5, y: -4, z: -1.5 },
      { title: 'KINETIC VOID', color: 0x10b981, x: 7.5, y: -8.5, z: 3 }
    ];

    portalData.forEach((pd, idx) => {
      const portalItem = new THREE.Group();
      portalItem.position.set(pd.x, pd.y, pd.z);

      // Holographic Wireframe Frame
      const boxGeo = new THREE.BoxGeometry(5.4, 3.6, 1.4);
      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: pd.color,
        transparent: true,
        opacity: 0.85
      });
      const wireBox = new THREE.LineSegments(edges, edgeMat);
      portalItem.add(wireBox);

      // Central 3D Core Artifact
      let coreGeo;
      if (idx === 0) coreGeo = new THREE.TorusKnotGeometry(0.85, 0.22, 48, 12);
      else if (idx === 1) coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
      else if (idx === 2) coreGeo = new THREE.OctahedronGeometry(1.25, 0);
      else coreGeo = new THREE.TorusGeometry(1.05, 0.25, 16, 40);

      const coreMat = new THREE.MeshStandardMaterial({
        color: pd.color,
        emissive: pd.color,
        emissiveIntensity: 0.75,
        roughness: 0.2,
        metalness: 0.9,
        wireframe: false
      });
      const artifact = new THREE.Mesh(coreGeo, coreMat);
      portalItem.add(artifact);

      // Floating halo ring
      const haloGeo = new THREE.TorusGeometry(2.3, 0.035, 8, 36);
      const haloMat = new THREE.MeshBasicMaterial({
        color: pd.color,
        transparent: true,
        opacity: 0.45
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      portalItem.add(halo);

      portalItem.userData = {
        index: idx,
        title: pd.title,
        baseX: pd.x,
        baseY: pd.y,
        baseZ: pd.z,
        color: pd.color,
        artifact,
        halo
      };

      this.projectsGroup.add(portalItem);
      this.projectPortals.push(portalItem);
    });

    this.scene.add(this.projectsGroup);
  }

  // =========================================================================
  // ZONE 4: EXPERIENCE (CYBER HIGHWAY TERRAIN) [Y = -154]
  // =========================================================================
  createZoneExperience() {
    this.expGroup = new THREE.Group();
    this.expGroup.position.set(0, -154, 0);

    this.terrainWidth = 34;
    this.terrainDepth = 52;
    this.terrainGeo = new THREE.PlaneGeometry(this.terrainWidth, this.terrainDepth, 32, 40);
    this.terrainGeo.rotateX(-Math.PI / 2.3);

    this.terrainMat = new THREE.MeshBasicMaterial({
      color: this.activeTheme.primary,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    this.terrainMesh = new THREE.Mesh(this.terrainGeo, this.terrainMat);
    this.expGroup.add(this.terrainMesh);

    // Milestone Beacons along the highway
    this.milestoneBeacons = [];
    const beaconCoords = [
      { x: -5, z: 12 },
      { x: 5, z: 4 },
      { x: -4, z: -4 },
      { x: 4, z: -14 }
    ];

    const beaconGeo = new THREE.CylinderGeometry(0.12, 0.35, 5.0, 8);
    beaconCoords.forEach((b, i) => {
      const bMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? this.activeTheme.primary : this.activeTheme.secondary,
        emissive: i % 2 === 0 ? this.activeTheme.primary : this.activeTheme.secondary,
        emissiveIntensity: 0.95,
        metalness: 0.8
      });
      const beacon = new THREE.Mesh(beaconGeo, bMat);
      beacon.position.set(b.x, 2.5, b.z);

      const orbGeo = new THREE.SphereGeometry(0.48, 12, 12);
      const orb = new THREE.Mesh(orbGeo, bMat);
      orb.position.set(0, 2.7, 0);
      beacon.add(orb);

      this.expGroup.add(beacon);
      this.milestoneBeacons.push(beacon);
    });

    this.scene.add(this.expGroup);
  }

  // =========================================================================
  // ZONE 5: 3D INTERACTIVE LAB (MORPHING QUANTUM TESSERACT) [Y = -194]
  // =========================================================================
  createZoneLab() {
    this.labGroup = new THREE.Group();
    this.labGroup.position.set(0, -194, 0);

    // Outer Holographic Scanner Cage (Nested concentric rotating rings)
    this.labScannerRings = [];
    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.TorusGeometry(5.2 + r * 1.8, 0.05, 8, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: r === 0 ? this.activeTheme.primary : (r === 1 ? this.activeTheme.secondary : this.activeTheme.accent),
        transparent: true,
        opacity: 0.55
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.set(r * 0.7, r * 1.2, 0);
      this.labGroup.add(ring);
      this.labScannerRings.push(ring);
    }

    // Interactive Morphing Core Group
    this.labCoreContainer = new THREE.Group();
    this.labGroup.add(this.labCoreContainer);

    this.labCoreMat = new THREE.MeshStandardMaterial({
      color: 0x070c1d,
      emissive: this.activeTheme.primary,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.85,
      wireframe: false
    });

    this.labWireMat = new THREE.MeshBasicMaterial({
      color: this.activeTheme.secondary,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });

    this.buildLabGeometry('knot');

    this.scene.add(this.labGroup);
  }

  buildLabGeometry(type) {
    // Clear existing meshes inside labCoreContainer
    while (this.labCoreContainer.children.length > 0) {
      this.labCoreContainer.remove(this.labCoreContainer.children[0]);
    }

    this.currentLabGeometry = type;
    let solidGeo, wireGeo;

    if (type === 'knot') {
      solidGeo = new THREE.TorusKnotGeometry(2.4, 0.55, 64, 16, 3, 5);
      wireGeo = new THREE.TorusKnotGeometry(2.45, 0.56, 32, 8, 3, 5);
    } else if (type === 'tesseract') {
      solidGeo = new THREE.BoxGeometry(3.5, 3.5, 3.5);
      wireGeo = new THREE.BoxGeometry(4.8, 4.8, 4.8);
    } else if (type === 'geodesic') {
      solidGeo = new THREE.IcosahedronGeometry(3.0, 2);
      wireGeo = new THREE.IcosahedronGeometry(3.4, 1);
    } else if (type === 'mobius') {
      solidGeo = new THREE.TorusGeometry(3.2, 0.8, 24, 48);
      wireGeo = new THREE.TorusGeometry(3.3, 0.82, 12, 24);
    } else {
      solidGeo = new THREE.DodecahedronGeometry(3.2, 0);
      wireGeo = new THREE.DodecahedronGeometry(3.6, 0);
    }

    this.labSolidMesh = new THREE.Mesh(solidGeo, this.labCoreMat);
    this.labWireMesh = new THREE.Mesh(wireGeo, this.labWireMat);
    this.labCoreContainer.add(this.labSolidMesh);
    this.labCoreContainer.add(this.labWireMesh);
  }

  setLabGeometry(type) {
    this.buildLabGeometry(type);
    this.triggerShockwave(new THREE.Vector3(0, -194, 0), 1.8);
    if (window.cyberAudio) {
      window.cyberAudio.playChime(780, 0.25, 'triangle');
    }
  }

  // =========================================================================
  // ZONE 6: CONTACT (QUANTUM HORIZON & ACCRETION DISK) [Y = -236]
  // =========================================================================
  createZoneContact() {
    this.contactGroup = new THREE.Group();
    this.contactGroup.position.set(0, -236, 0);

    // Accretion Disk Swirling Particles
    const particleCount = 1600;
    const posArray = new Float32Array(particleCount * 3);
    const colArray = new Float32Array(particleCount * 3);
    const pData = [];

    const colorA = new THREE.Color(this.activeTheme.primary);
    const colorB = new THREE.Color(this.activeTheme.secondary);

    for (let i = 0; i < particleCount; i++) {
      const dist = 3.6 + Math.pow(Math.random(), 1.4) * 15;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = (Math.random() - 0.5) * 2.0 * (dist / 15);

      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;

      const mixed = colorA.clone().lerp(colorB, Math.random());
      colArray[i * 3] = mixed.r;
      colArray[i * 3 + 1] = mixed.g;
      colArray[i * 3 + 2] = mixed.b;

      pData.push({ dist, angle, speed: 0.015 + (18 - dist) * 0.0035 });
    }

    this.vortexGeo = new THREE.BufferGeometry();
    this.vortexGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    this.vortexGeo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
    this.vortexParticleData = pData;

    this.vortexMat = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.vortexPoints = new THREE.Points(this.vortexGeo, this.vortexMat);
    this.vortexPoints.rotation.x = Math.PI / 3;
    this.contactGroup.add(this.vortexPoints);

    // Central Event Horizon Sphere
    const singGeo = new THREE.SphereGeometry(2.5, 32, 32);
    const singMat = new THREE.MeshBasicMaterial({ color: 0x010204 });
    const singMesh = new THREE.Mesh(singGeo, singMat);
    this.contactGroup.add(singMesh);

    // Radiant Rim Ring
    const rimGeo = new THREE.RingGeometry(2.55, 3.4, 48);
    this.rimMat = new THREE.MeshBasicMaterial({
      color: this.activeTheme.primary,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.rimMesh = new THREE.Mesh(rimGeo, this.rimMat);
    this.contactGroup.add(this.rimMesh);

    this.scene.add(this.contactGroup);
  }

  // =========================================================================
  // SCROLL EVENT HANDLER: FIRES ON EVERY SCROLL TICK!
  // =========================================================================
  // Direct gesture scroll listener (wheel, touch, keyboard) - triggers instant 3D reaction
  onGestureScroll(direction = 1, impulse = 0.8) {
    const now = performance.now();
    this.scrollDirection = direction;
    this.scrollImpulse = Math.min(this.scrollImpulse + impulse, 4.0);

    // Guaranteed photon sparks on EVERY gesture
    this.emitScrollSparks(direction, Math.floor(10 + this.scrollImpulse * 5), this.scrollImpulse);

    // Shockwave pulse
    if (now - this.lastShockwaveTime > 60) {
      this.lastShockwaveTime = now;
      if (this.scrollImpulse > 0.85) {
        this.triggerChromaticShockwave(null, Math.min(this.scrollImpulse * 0.7, 1.4));
      } else {
        this.triggerShockwave(null, Math.min(0.48 + this.scrollImpulse * 0.4, 1.05), null, true);
      }
    }
  }

  // Scroll Event Handler - Fires on EVERY scroll tick!
  onScrollTick(progress, delta) {
    const now = performance.now();
    this.targetScrollProgress = Math.max(0, Math.min(1, progress));

    if (delta > 0) this.scrollDirection = 1;
    else if (delta < 0) this.scrollDirection = -1;

    const diff = Math.abs(this.targetScrollProgress - this.prevTargetProgress);
    this.prevTargetProgress = this.targetScrollProgress;
    this.scrollVelocity = Math.max(Math.abs(delta) * 0.8, diff * 160);

    // Physical impulse with guaranteed minimum kick on every scroll tick
    const impulseStrength = Math.max(0.24, Math.min(Math.abs(delta) * 0.005 + diff * 14, 2.8));
    this.scrollImpulse = Math.min(this.scrollImpulse + impulseStrength, 4.0);

    // Emit sparks on EVERY single scroll tick
    this.emitScrollSparks(this.scrollDirection, Math.floor(8 + this.scrollImpulse * 4), this.scrollImpulse);

    // Audio tick on every scroll
    if (window.cyberAudio) {
      window.cyberAudio.playScrollTick(this.scrollImpulse);
    }

    // Trigger visual shockwave on scroll tick
    if (now - this.lastShockwaveTime > 60) {
      this.lastShockwaveTime = now;
      if (this.scrollImpulse > 0.8) {
        this.triggerChromaticShockwave(null, Math.min(this.scrollImpulse * 0.7, 1.4));
      } else {
        this.triggerShockwave(null, Math.min(0.42 + this.scrollImpulse * 0.4, 0.95), null, true);
      }
    }
  }

  // Injects simulated scroll energy (e.g. from UI buttons or cruise mode)
  injectScrollImpulse(amount = 1.5, direction = 1) {
    this.scrollDirection = direction;
    this.scrollImpulse = Math.min(this.scrollImpulse + amount, 4.0);
    this.emitScrollSparks(direction, 20, 1.5);
    this.triggerChromaticShockwave(null, 1.4);
    if (window.cyberAudio) {
      window.cyberAudio.playWarpBurst(amount);
      window.cyberAudio.playScrollTick(this.scrollImpulse);
    }
  }

  // =========================================================================
  // THEME SWITCHER
  // =========================================================================
  setTheme(themeKey) {
    if (!this.themes[themeKey]) return;
    this.currentThemeKey = themeKey;
    this.activeTheme = this.themes[themeKey];

    const cPri = new THREE.Color(this.activeTheme.primary);
    const cSec = new THREE.Color(this.activeTheme.secondary);
    const cAcc = new THREE.Color(this.activeTheme.accent);

    // Update Lights
    this.ambientLight.color.set(this.activeTheme.ambient);
    this.primaryPointLight.color.set(this.activeTheme.primary);
    this.secondaryPointLight.color.set(this.activeTheme.secondary);

    // Update Materials
    if (this.coreMat) this.coreMat.emissive.set(this.activeTheme.primary);
    if (this.coreWireMat) this.coreWireMat.color.set(this.activeTheme.primary);
    if (this.helixMatA) {
      this.helixMatA.color.set(this.activeTheme.primary);
      this.helixMatA.emissive.set(this.activeTheme.primary);
    }
    if (this.helixMatB) {
      this.helixMatB.color.set(this.activeTheme.secondary);
      this.helixMatB.emissive.set(this.activeTheme.secondary);
    }
    if (this.skillsCenterMat) this.skillsCenterMat.emissive.set(this.activeTheme.primary);
    if (this.terrainMat) this.terrainMat.color.set(this.activeTheme.primary);
    if (this.labCoreMat) this.labCoreMat.emissive.set(this.activeTheme.primary);
    if (this.labWireMat) this.labWireMat.color.set(this.activeTheme.secondary);
    if (this.rimMesh) this.rimMesh.material.color.set(this.activeTheme.primary);

    // Update Warp Stream Colors
    if (this.warpGeo) {
      const colors = this.warpGeo.attributes.color.array;
      for (let i = 0; i < this.warpCount; i++) {
        const col = i % 2 === 0 ? cPri : cSec;
        colors[i * 6] = col.r;
        colors[i * 6 + 1] = col.g;
        colors[i * 6 + 2] = col.b;
        colors[i * 6 + 3] = col.r * 0.3;
        colors[i * 6 + 4] = col.g * 0.3;
        colors[i * 6 + 5] = col.b * 0.3;
      }
      this.warpGeo.attributes.color.needsUpdate = true;
    }

    // Update CSS variables
    const root = document.documentElement;
    root.style.setProperty('--neon-primary', '#' + cPri.getHexString());
    root.style.setProperty('--neon-secondary', '#' + cSec.getHexString());
    root.style.setProperty('--neon-accent', '#' + cAcc.getHexString());
    root.style.setProperty('--bg-dark', this.activeTheme.bgTint);

    this.triggerChromaticShockwave(this.cameraTarget, 1.4);
  }

  toggleWireframe() {
    this.isWireframeMode = !this.isWireframeMode;
    this.scene.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.material.wireframe !== undefined) {
        obj.material.wireframe = this.isWireframeMode;
      }
    });
    return this.isWireframeMode;
  }

  focusProject(index) {
    if (this.projectPortals[index]) {
      const p = this.projectPortals[index];
      if (window.gsap) {
        gsap.to(p.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.5, ease: 'back.out(2)' });
        if (p.userData.artifact) {
          gsap.to(p.userData.artifact.rotation, { y: p.userData.artifact.rotation.y + Math.PI, duration: 0.8 });
        }
      } else {
        p.scale.set(1.25, 1.25, 1.25);
      }
    }
  }

  unfocusProject(index) {
    if (this.projectPortals[index]) {
      const p = this.projectPortals[index];
      if (window.gsap) {
        gsap.to(p.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.4, ease: 'power2.out' });
      } else {
        p.scale.set(1.0, 1.0, 1.0);
      }
    }
  }

  // =========================================================================
  // CAMERA SPLINE INTERPOLATION WITH BANKING, PITCH & FOV WARP
  // =========================================================================
  // Helper: Returns camera position, lookAt target, and tangent along spline at progress t
  getSplinePoint(t) {
    const waypoints = this.waypoints;
    const clamped = Math.max(0, Math.min(0.9999, t));
    let segIdx = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      if (clamped >= waypoints[i].t && clamped <= waypoints[i + 1].t) {
        segIdx = i;
        break;
      }
    }
    const p0 = waypoints[segIdx];
    const p1 = waypoints[segIdx + 1];
    const segT = (clamped - p0.t) / (p1.t - p0.t);
    const smoothT = (1 - Math.cos(segT * Math.PI)) / 2;

    const pos = new THREE.Vector3(
      p0.pos.x + (p1.pos.x - p0.pos.x) * smoothT,
      p0.pos.y + (p1.pos.y - p0.pos.y) * smoothT,
      p0.pos.z + (p1.pos.z - p0.pos.z) * smoothT
    );
    const look = new THREE.Vector3(
      p0.look.x + (p1.look.x - p0.look.x) * smoothT,
      p0.look.y + (p1.look.y - p0.look.y) * smoothT,
      p0.look.z + (p1.look.z - p0.look.z) * smoothT
    );
    return { pos, look, sector: segT >= 0.5 ? p1.sector : p0.sector };
  }

  updateCameraSpline(progress) {
    const waypoints = this.waypoints;
    const clampedProgress = Math.max(0, Math.min(0.9999, progress));
    let segIdx = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      if (clampedProgress >= waypoints[i].t && clampedProgress <= waypoints[i + 1].t) {
        segIdx = i;
        break;
      }
    }

    const p0 = waypoints[segIdx];
    const p1 = waypoints[segIdx + 1];
    const segT = (clampedProgress - p0.t) / (p1.t - p0.t);
    const smoothT = (1 - Math.cos(segT * Math.PI)) / 2;

    // Base Spline Position
    const targetCamX = p0.pos.x + (p1.pos.x - p0.pos.x) * smoothT + this.mouse.x * 2.5;
    const targetCamY = p0.pos.y + (p1.pos.y - p0.pos.y) * smoothT + this.mouse.y * 2.0;
    const targetCamZ = p0.pos.z + (p1.pos.z - p0.pos.z) * smoothT;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.08;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;

    // Base Spline LookAt Target
    const targetLookX = p0.look.x + (p1.look.x - p0.look.x) * smoothT;
    const targetLookY = p0.look.y + (p1.look.y - p0.look.y) * smoothT;
    const targetLookZ = p0.look.z + (p1.look.z - p0.look.z) * smoothT;

    this.cameraTarget.x += (targetLookX - this.cameraTarget.x) * 0.08;
    this.cameraTarget.y += (targetLookY - this.cameraTarget.y) * 0.08;
    this.cameraTarget.z += (targetLookZ - this.cameraTarget.z) * 0.08;

    // Pitch dynamic tilt on scroll
    const targetPitch = -this.scrollImpulse * 0.02 * this.scrollDirection;
    this.cameraPitch += (targetPitch - this.cameraPitch) * 0.1;

    // Roll banking into spline curves
    const targetBanking = Math.sin(smoothT * Math.PI * 2) * 0.06 * (1 + this.scrollImpulse * 0.4) + this.mouse.x * 0.04;
    this.cameraBanking += (targetBanking - this.cameraBanking) * 0.08;

    // Apply lookAt then subtle banking rotation
    this.camera.lookAt(
      this.cameraTarget.x,
      this.cameraTarget.y + this.cameraPitch * 15,
      this.cameraTarget.z
    );
    this.camera.rotation.z += this.cameraBanking;

    // Dynamic FOV Warp during scroll impulse
    const baseFov = 50;
    const warpFov = baseFov + this.scrollImpulse * 7.5;
    this.camera.fov += (warpFov - this.camera.fov) * 0.14;
    this.camera.updateProjectionMatrix();

    // Primary dynamic light moves with camera
    this.primaryPointLight.position.set(
      this.camera.position.x + 8,
      this.camera.position.y + 6,
      this.camera.position.z - 5
    );

    this.currentSectorName = segT >= 0.5 ? p1.sector : p0.sector;
  }

  // =========================================================================
  // ANIMATION LOOP (RUNS AT 60 FPS)
  // =========================================================================
  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Inertial progress interpolation
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08;

    // 2. Smoothly decay scroll impulse
    this.scrollImpulse *= 0.92;
    if (this.scrollImpulse < 0.001) this.scrollImpulse = 0;

    // Smoothed velocity for HUD
    this.smoothedVelocity += (this.scrollImpulse * 45 - this.smoothedVelocity) * 0.15;

    // 3. Mouse smoothing
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // 4. Update Camera Spline & Dynamic FOV
    this.updateCameraSpline(this.scrollProgress);

    // 5. Angular torque multiplier boosted on every scroll
    const torqueBoost = 1.0 + this.scrollImpulse * 3.8;

    // =======================================================================
    // 3D HYPERDRIVE WARP STREAKS ANIMATION (STRETCHES ON EVERY SCROLL!)
    // =======================================================================
    if (this.warpGeo && this.warpData) {
      const pos = this.warpGeo.attributes.position.array;
      const warpFactor = 0.25 + this.scrollImpulse * 14.0;
      const flightDir = this.scrollDirection;
      const camY = this.camera.position.y;

      for (let i = 0; i < this.warpCount; i++) {
        const d = this.warpData[i];

        let hx = d.basePos.x;
        let hy = d.basePos.y;
        let hz = d.basePos.z;

        if (hy > camY + 45) {
          d.basePos.y -= 90;
          hy = d.basePos.y;
        } else if (hy < camY - 45) {
          d.basePos.y += 90;
          hy = d.basePos.y;
        }

        const stretchLen = warpFactor * d.speed * d.lengthMultiplier;
        const tx = hx - d.tangent.x * flightDir * stretchLen;
        const ty = hy - d.tangent.y * flightDir * stretchLen;
        const tz = hz - d.tangent.z * flightDir * stretchLen;

        pos[i * 6] = hx;
        pos[i * 6 + 1] = hy;
        pos[i * 6 + 2] = hz;
        pos[i * 6 + 3] = tx;
        pos[i * 6 + 4] = ty;
        pos[i * 6 + 5] = tz;
      }
      this.warpGeo.attributes.position.needsUpdate = true;
      this.warpMat.opacity = 0.38 + Math.min(this.scrollImpulse * 0.58, 0.62);
    }

    // =======================================================================
    // SCROLL QUANTUM SPARKS ANIMATION (EMITTED ON EVERY SCROLL!)
    // =======================================================================
    if (this.sparkGeo && this.sparkData) {
      const pos = this.sparkGeo.attributes.position.array;
      const cols = this.sparkGeo.attributes.color.array;

      for (let i = 0; i < this.sparkCount; i++) {
        const sp = this.sparkData[i];
        if (sp.life > 0) {
          sp.life -= delta / sp.maxLife;

          sp.x += sp.vx * delta;
          sp.y += sp.vy * delta;
          sp.z += sp.vz * delta;

          sp.vx *= 0.94;
          sp.vy *= 0.94;
          sp.vz *= 0.94;

          pos[i * 3] = sp.x;
          pos[i * 3 + 1] = sp.y;
          pos[i * 3 + 2] = sp.z;

          const alpha = Math.max(0, sp.life);
          cols[i * 3] = sp.color.r * alpha;
          cols[i * 3 + 1] = sp.color.g * alpha;
          cols[i * 3 + 2] = sp.color.b * alpha;

          if (sp.life <= 0) {
            pos[i * 3 + 2] = -9999;
          }
        }
      }
      this.sparkGeo.attributes.position.needsUpdate = true;
      this.sparkGeo.attributes.color.needsUpdate = true;
    }

    // =======================================================================
    // ZONE ANIMATIONS
    // =======================================================================
    // Zone 0: Hero Core & Rings
    if (this.heroGroup) {
      this.coreMesh.rotation.y += 0.008 * torqueBoost;
      this.coreMesh.rotation.x += 0.005 * torqueBoost;
      this.coreWireMesh.rotation.y -= 0.012 * torqueBoost;

      const coreScale = 1.0 + Math.sin(elapsedTime * 3) * 0.04 + this.scrollImpulse * 0.28;
      this.coreMesh.scale.set(coreScale, coreScale, coreScale);
      this.coreWireMesh.scale.set(coreScale * 1.02, coreScale * 1.02, coreScale * 1.02);

      const ringScale = 1.0 + this.scrollImpulse * 0.28;
      this.gimbalRings.forEach((ring, i) => {
        ring.rotation.x += (0.012 + i * 0.009) * torqueBoost;
        ring.rotation.y += (0.010 + i * 0.007) * torqueBoost;
        ring.scale.set(ringScale, ringScale, ringScale);
      });

      this.satellites.forEach((sat) => {
        sat.userData.angle += sat.userData.speed * delta * torqueBoost;
        const r = sat.userData.orbitRadius * (1.0 + this.scrollImpulse * 0.18);
        sat.position.x = Math.cos(sat.userData.angle) * r;
        sat.position.z = Math.sin(sat.userData.angle) * r;
        sat.position.y = Math.sin(sat.userData.angle * 2) * sat.userData.inclination * 4;
        sat.rotation.x += 0.04 * torqueBoost;
        sat.rotation.y += 0.05 * torqueBoost;
      });
    }

    // Zone 1: About Helix (Scroll winds/unwinds helix + cascade lighting on rungs)
    if (this.aboutGroup) {
      this.aboutGroup.rotation.y = this.scrollProgress * Math.PI * 14 + elapsedTime * 0.3 * torqueBoost;

      if (this.helixNodes) {
        const scrollPhase = (this.scrollProgress - 0.10) * 6.0;
        this.helixNodes.forEach((hn) => {
          const rungNorm = hn.index / this.helixNodes.length;
          const dist = Math.abs(scrollPhase - rungNorm);
          const activeGlow = Math.max(0, 1.0 - dist * 4.0) * (0.8 + this.scrollImpulse * 1.8);

          if (hn.rung.material) {
            hn.rung.material.opacity = Math.min(1.0, 0.4 + activeGlow * 0.6);
          }
          const scale = 1.0 + activeGlow * 0.45;
          hn.nodeA.scale.set(scale, scale, scale);
          hn.nodeB.scale.set(scale, scale, scale);
        });
      }

      this.aboutPanels.forEach((p, idx) => {
        p.position.y += Math.sin(elapsedTime * 2 + idx) * 0.008;
      });
    }

    // Zone 2: Skills Galaxy (Cluster expands outward on scroll impulse)
    if (this.skillsGroup) {
      this.skillsCenterMesh.rotation.x += 0.012 * torqueBoost;
      this.skillsCenterMesh.rotation.y += 0.018 * torqueBoost;

      const clusterSpread = 1.0 + Math.sin(this.scrollProgress * Math.PI * 4) * 0.25 + this.scrollImpulse * 0.45;
      this.skillNodes.forEach((node) => {
        node.userData.angle += node.userData.rotSpeed * torqueBoost;
        const r = node.userData.radius * clusterSpread;
        node.position.x = Math.cos(node.userData.angle) * r;
        node.position.z = Math.sin(node.userData.angle) * r;
        node.position.y = node.userData.baseY + Math.sin(elapsedTime * 2 + node.userData.angle) * 0.6;
        node.rotation.x += 0.025 * torqueBoost;
        node.rotation.y += 0.025 * torqueBoost;
      });
    }

    // Zone 3: Project Portals (Hover tilts & scroll rotation)
    if (this.projectsGroup) {
      this.projectPortals.forEach((p, idx) => {
        if (p.userData.artifact) {
          p.userData.artifact.rotation.x += 0.018 * torqueBoost;
          p.userData.artifact.rotation.y += 0.024 * torqueBoost;
          const artScale = 1.0 + this.scrollImpulse * 0.18;
          p.userData.artifact.scale.set(artScale, artScale, artScale);
        }
        if (p.userData.halo) {
          p.userData.halo.rotation.z += 0.025 * torqueBoost;
        }
        p.position.y = p.userData.baseY + Math.sin(elapsedTime * 1.5 + idx * 1.2) * 0.35;
      });
    }

    // Zone 4: Experience Cyber Highway (Terrain waves surge with scroll)
    if (this.terrainGeo) {
      const pos = this.terrainGeo.attributes.position;
      const count = pos.count;
      const surge = 1.2 + this.scrollImpulse * 2.6;

      for (let i = 0; i < count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const waveZ = Math.sin(u * 0.28 + elapsedTime * 3.0 + this.scrollProgress * 26) * surge +
                      Math.cos(v * 0.32 + elapsedTime * 2.2) * (surge * 0.85);
        pos.setZ(i, waveZ);
      }
      this.terrainGeo.attributes.position.needsUpdate = true;

      this.milestoneBeacons.forEach((beacon, i) => {
        beacon.position.y = 2.5 + Math.sin(elapsedTime * 3 + i * 1.5) * 0.35;
      });
    }

    // Zone 5: 3D Lab Morphing Core
    if (this.labGroup) {
      if (this.labCoreContainer) {
        this.labCoreContainer.rotation.x += 0.014 * torqueBoost;
        this.labCoreContainer.rotation.y += 0.022 * torqueBoost;
        const labScale = 1.0 + Math.sin(elapsedTime * 2.5) * 0.05 + this.scrollImpulse * 0.28;
        this.labCoreContainer.scale.set(labScale, labScale, labScale);
      }
      this.labScannerRings.forEach((ring, idx) => {
        ring.rotation.x += (0.010 + idx * 0.008) * torqueBoost;
        ring.rotation.y += (0.015 - idx * 0.006) * torqueBoost;
      });
    }

    // Zone 6: Contact Vortex & Accretion Disk (Accelerates into cyclone on scroll)
    if (this.vortexGeo && this.vortexParticleData) {
      const pos = this.vortexGeo.attributes.position;
      const count = this.vortexParticleData.length;
      const vortexSpeed = 1.0 + this.scrollImpulse * 9.0;

      for (let i = 0; i < count; i++) {
        const p = this.vortexParticleData[i];
        p.angle += p.speed * vortexSpeed * 0.07;
        const x = Math.cos(p.angle) * p.dist;
        const z = Math.sin(p.angle) * p.dist;
        pos.setXYZ(i, x, pos.getY(i), z);
      }
      this.vortexGeo.attributes.position.needsUpdate = true;
      this.rimMesh.rotation.z += 0.025 * vortexSpeed;
    }

    // Shockwave expansion & decay
    this.shockwaves.forEach((sw) => {
      if (sw.life > 0) {
        sw.life -= delta * 1.8;
        const maxScale = sw.isNear ? (14 * sw.intensity) : (28 * sw.intensity);
        const scale = 0.3 + (1 - sw.life) * maxScale;
        sw.mesh.scale.set(scale, scale, scale);
        sw.mesh.rotation.z += sw.rotSpeed;
        sw.mat.opacity = Math.max(0, sw.life * 0.92 * sw.intensity);
        if (sw.life <= 0) {
          sw.mesh.visible = false;
        }
      }
    });

    // Raycast on mouse coords
    this.handleRaycast();

    // Render Scene
    this.renderer.render(this.scene, this.camera);

    // Expose Telemetry for HUD
    if (window.onCyberTelemetryUpdate) {
      window.onCyberTelemetryUpdate({
        camX: this.camera.position.x.toFixed(1),
        camY: this.camera.position.y.toFixed(1),
        camZ: this.camera.position.z.toFixed(1),
        velocity: this.smoothedVelocity.toFixed(1),
        impulse: this.scrollImpulse,
        direction: this.scrollDirection,
        progress: (this.scrollProgress * 100).toFixed(0),
        sector: this.currentSectorName || 'SECTOR // 01 : SINGULARITY CORE'
      });
    }
  }

  handleRaycast() {
    this.raycaster.setFromCamera(this.mouseCoords, this.camera);
    const interactables = [...this.satellites, ...this.skillNodes];
    const intersects = this.raycaster.intersectObjects(interactables);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (this.hoveredObject !== obj) {
        if (this.hoveredObject && this.hoveredObject.material.emissive) {
          this.hoveredObject.material.emissiveIntensity = 0.65;
        }
        this.hoveredObject = obj;
        if (obj.material && obj.material.emissive) {
          obj.material.emissiveIntensity = 1.6;
        }
        if (window.cyberAudio) {
          window.cyberAudio.playChime(750, 0.15, 'sine');
        }
      }
    } else {
      if (this.hoveredObject && this.hoveredObject.material.emissive) {
        this.hoveredObject.material.emissiveIntensity = 0.65;
        this.hoveredObject = null;
      }
    }
  }

  bindEvents() {
    window.addEventListener('resize', this.onResize.bind(this));

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;

      this.mouseCoords.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseCoords.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('click', (e) => {
      if (e.target.closest('button, a, input, textarea, .interactive-card, .theme-dot')) return;
      this.triggerShockwave(null, 1.2);
    });
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
}

window.CyberScene = CyberScene;
