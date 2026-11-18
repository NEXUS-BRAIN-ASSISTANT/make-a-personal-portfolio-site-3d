/**
 * CyberDimension 3D Engine - Three.js WebGL Interactive Universe
 * Handles multi-zone 3D architectures, camera spline flight, dynamic scroll-impulse physics,
 * particle warp streams, shockwave rings, and interactive theme shifts.
 */

class CyberScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error('Canvas element not found:', canvasId);
      return;
    }

    // Themes definition
    this.themes = {
      cyber: {
        primary: 0x00f0ff,   // Cyan
        secondary: 0xff007f, // Neon Pink
        accent: 0x7000ff,    // Royal Violet
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
        primary: 0xf59e0b,   // Amber Gold
        secondary: 0xff4500, // Orange Red
        accent: 0x10b981,    // Emerald
        ambient: 0x150904,
        bgTint: '#0c0604'
      },
      emerald: {
        primary: 0x10b981,   // Emerald Green
        secondary: 0x06b6d4, // Cyan
        accent: 0xa3e635,    // Lime
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
    this.prevTargetProgress = 0;
    this.scrollImpulse = 0; // Decaying burst of energy on every scroll
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isWireframeMode = false;

    // Time & Raycasting
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouseCoords = new THREE.Vector2(-999, -999);
    this.hoveredObject = null;

    // Zone Spline Waypoints [t, camPos, lookAt]
    // Normalized scroll t from 0.0 (Hero) to 1.0 (Contact)
    this.waypoints = [
      { t: 0.00, pos: new THREE.Vector3(0, 0, 32), look: new THREE.Vector3(0, 0, 0), sector: 'SECTOR // 01 : SINGULARITY CORE' },
      { t: 0.20, pos: new THREE.Vector3(12, -32, 22), look: new THREE.Vector3(2, -32, 0), sector: 'SECTOR // 02 : BIO-DIGITAL HELIX' },
      { t: 0.42, pos: new THREE.Vector3(-12, -68, 25), look: new THREE.Vector3(0, -68, 0), sector: 'SECTOR // 03 : TECH CONSTELLATION' },
      { t: 0.65, pos: new THREE.Vector3(14, -108, 24), look: new THREE.Vector3(3, -108, 0), sector: 'SECTOR // 04 : DIMENSIONAL VAULT' },
      { t: 0.85, pos: new THREE.Vector3(0, -152, 26), look: new THREE.Vector3(0, -156, -15), sector: 'SECTOR // 05 : CYBER TERRAIN PATH' },
      { t: 1.00, pos: new THREE.Vector3(0, -196, 20), look: new THREE.Vector3(0, -196, 0), sector: 'SECTOR // 06 : QUANTUM HORIZON' }
    ];

    this.initThree();
    this.createLights();
    this.createStarfield();
    this.createZoneHero();
    this.createZoneAbout();
    this.createZoneSkills();
    this.createZoneProjects();
    this.createZoneExperience();
    this.createZoneContact();
    this.createShockwaveSystem();
    this.bindEvents();
    this.animate();
  }

  initThree() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x04060d, 0.009);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 0, 32);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

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
    this.renderer.toneMappingExposure = 1.25;
  }

  createLights() {
    this.ambientLight = new THREE.AmbientLight(this.activeTheme.ambient, 2.5);
    this.scene.add(this.ambientLight);

    // Dynamic Primary Light (Follows camera vertical position)
    this.primaryPointLight = new THREE.PointLight(this.activeTheme.primary, 3.5, 90);
    this.primaryPointLight.position.set(15, 10, 20);
    this.scene.add(this.primaryPointLight);

    // Secondary Accent Light
    this.secondaryPointLight = new THREE.PointLight(this.activeTheme.secondary, 3.0, 80);
    this.secondaryPointLight.position.set(-15, -10, 15);
    this.scene.add(this.secondaryPointLight);

    // Subtle Top Directional Light for rim highlights
    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.dirLight.position.set(0, 50, 40);
    this.scene.add(this.dirLight);
  }

  // --- ZONE 0: HERO SINGULARITY CORE ---
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
    const wireGeo = new THREE.IcosahedronGeometry(4.25, 1);
    this.coreWireMat = new THREE.MeshBasicMaterial({
      color: this.activeTheme.primary,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    this.coreWireMesh = new THREE.Mesh(wireGeo, this.coreWireMat);
    this.heroGroup.add(this.coreWireMesh);

    // 2. Nested Gimbal Torus Rings (Outer Gyroscope)
    this.gimbalRings = [];
    const ringConfigs = [
      { radius: 6.8, tube: 0.08, color: this.activeTheme.primary, rx: 0.5, ry: 0.2 },
      { radius: 8.4, tube: 0.07, color: this.activeTheme.secondary, rx: 1.2, ry: 0.8 },
      { radius: 10.0, tube: 0.06, color: this.activeTheme.accent, rx: 0.2, ry: 1.5 }
    ];

    ringConfigs.forEach((cfg) => {
      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 100);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.8
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.set(cfg.rx, cfg.ry, 0);
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
        speed: 0.8 + i * 0.25,
        angle: (i / 6) * Math.PI * 2,
        inclination: (i - 3) * 0.35
      };
      this.heroGroup.add(sat);
      this.satellites.push(sat);
    }

    this.scene.add(this.heroGroup);
  }

  // --- ZONE 1: BIO-DIGITAL DNA HELIX (ABOUT) ---
  createZoneAbout() {
    this.aboutGroup = new THREE.Group();
    this.aboutGroup.position.set(0, -32, 0);

    const steps = 36;
    const radius = 3.6;
    const height = 24;
    this.helixNodes = [];

    const sphereGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const cylinderGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);

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
      opacity: 0.55
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

      // Node B (opposite)
      const xB = Math.cos(angle + Math.PI) * radius;
      const zB = Math.sin(angle + Math.PI) * radius;
      const nodeB = new THREE.Mesh(sphereGeo, this.helixMatB);
      nodeB.position.set(xB, y, zB);
      this.aboutGroup.add(nodeB);

      // Connecting rung
      const rung = new THREE.Mesh(cylinderGeo, this.rungMat);
      rung.position.set((xA + xB) / 2, y, (zA + zB) / 2);
      rung.scale.set(1, radius * 2, 1);
      rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(xA - xB, 0, zA - zB).normalize());
      this.aboutGroup.add(rung);

      this.helixNodes.push({ nodeA, nodeB, rung, baseAngle: angle, y });
    }

    // Holographic architectural floating panels
    this.aboutPanels = [];
    for (let p = 0; p < 3; p++) {
      const panelGeo = new THREE.PlaneGeometry(3.5, 2.2);
      const panelMat = new THREE.MeshBasicMaterial({
        color: this.activeTheme.primary,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(-6 + p * 6, (p - 1) * 6, -3 + p * 2);
      panel.rotation.y = (p - 1) * 0.4;
      this.aboutGroup.add(panel);
      this.aboutPanels.push(panel);
    }

    this.scene.add(this.aboutGroup);
  }

  // --- ZONE 2: TECH CONSTELLATION GALAXY (SKILLS) ---
  createZoneSkills() {
    this.skillsGroup = new THREE.Group();
    this.skillsGroup.position.set(0, -68, 0);

    // Central dodecahedron matrix
    const centralGeo = new THREE.DodecahedronGeometry(3.5, 0);
    this.skillsCenterMat = new THREE.MeshStandardMaterial({
      color: 0x070c1d,
      emissive: this.activeTheme.primary,
      emissiveIntensity: 0.4,
      wireframe: true
    });
    this.skillsCenterMesh = new THREE.Mesh(centralGeo, this.skillsCenterMat);
    this.skillsGroup.add(this.skillsCenterMesh);

    // Skill nodes orbiting in clusters
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
        emissiveIntensity: 0.6,
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

      // Line to center
      linesPositions.push(0, 0, 0, x, y, z);
    });

    // Synaptic constellation lines
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linesPositions, 3));
    this.skillLinesMat = new THREE.LineBasicMaterial({
      color: this.activeTheme.primary,
      transparent: true,
      opacity: 0.35
    });
    this.skillLines = new THREE.LineSegments(lineGeo, this.skillLinesMat);
    this.skillsGroup.add(this.skillLines);

    this.scene.add(this.skillsGroup);
  }

  // --- ZONE 3: DIMENSIONAL VAULT (PROJECTS) ---
  createZoneProjects() {
    this.projectsGroup = new THREE.Group();
    this.projectsGroup.position.set(0, -108, 0);

    this.projectPortals = [];
    const portalData = [
      { title: 'NEURA-GL', color: this.activeTheme.primary, x: -7, y: 5, z: 2 },
      { title: 'AETHERIA SPATIAL', color: this.activeTheme.secondary, x: 7, y: 1.5, z: -2 },
      { title: 'CHRONOS ARCHIVE', color: this.activeTheme.accent, x: -7, y: -4, z: -1 },
      { title: 'KINETIC VOID', color: 0x10b981, x: 7, y: -8, z: 3 }
    ];

    portalData.forEach((pd, idx) => {
      const portalItem = new THREE.Group();
      portalItem.position.set(pd.x, pd.y, pd.z);

      // 1. Holographic Wireframe Frame
      const boxGeo = new THREE.BoxGeometry(5.2, 3.4, 1.2);
      const edges = new THREE.EdgesGeometry(boxGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: pd.color,
        transparent: true,
        opacity: 0.85
      });
      const wireBox = new THREE.LineSegments(edges, edgeMat);
      portalItem.add(wireBox);

      // 2. Central 3D Core Artifact
      let coreGeo;
      if (idx === 0) coreGeo = new THREE.TorusKnotGeometry(0.8, 0.22, 48, 12);
      else if (idx === 1) coreGeo = new THREE.IcosahedronGeometry(1.1, 1);
      else if (idx === 2) coreGeo = new THREE.OctahedronGeometry(1.2, 0);
      else coreGeo = new THREE.TorusGeometry(1.0, 0.25, 16, 40);

      const coreMat = new THREE.MeshStandardMaterial({
        color: pd.color,
        emissive: pd.color,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.9,
        wireframe: false
      });
      const artifact = new THREE.Mesh(coreGeo, coreMat);
      portalItem.add(artifact);

      // 3. Floating particle halo
      const haloGeo = new THREE.TorusGeometry(2.2, 0.03, 8, 36);
      const haloMat = new THREE.MeshBasicMaterial({
        color: pd.color,
        transparent: true,
        opacity: 0.4
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

  // --- ZONE 4: CYBER TERRAIN PATH (EXPERIENCE) ---
  createZoneExperience() {
    this.expGroup = new THREE.Group();
    this.expGroup.position.set(0, -152, 0);

    // Undulating Neon Cyber Ribbon Plane
    this.terrainWidth = 32;
    this.terrainDepth = 48;
    this.terrainGeo = new THREE.PlaneGeometry(this.terrainWidth, this.terrainDepth, 28, 36);
    this.terrainGeo.rotateX(-Math.PI / 2.3);

    this.terrainMat = new THREE.MeshBasicMaterial({
      color: this.activeTheme.primary,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    this.terrainMesh = new THREE.Mesh(this.terrainGeo, this.terrainMat);
    this.expGroup.add(this.terrainMesh);

    // Milestone Beacons along the highway
    this.milestoneBeacons = [];
    const beaconCoords = [
      { x: -5, z: 12, year: '2024 - PRES' },
      { x: 5, z: 4, year: '2022 - 2024' },
      { x: -4, z: -4, year: '2020 - 2022' },
      { x: 4, z: -14, year: '2018 - 2020' }
    ];

    const beaconGeo = new THREE.CylinderGeometry(0.12, 0.35, 4.5, 8);
    beaconCoords.forEach((b, i) => {
      const bMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? this.activeTheme.primary : this.activeTheme.secondary,
        emissive: i % 2 === 0 ? this.activeTheme.primary : this.activeTheme.secondary,
        emissiveIntensity: 0.9,
        metalness: 0.8
      });
      const beacon = new THREE.Mesh(beaconGeo, bMat);
      beacon.position.set(b.x, 2, b.z);

      // Top glowing orb
      const orbGeo = new THREE.SphereGeometry(0.45, 12, 12);
      const orb = new THREE.Mesh(orbGeo, bMat);
      orb.position.set(0, 2.4, 0);
      beacon.add(orb);

      this.expGroup.add(beacon);
      this.milestoneBeacons.push(beacon);
    });

    this.scene.add(this.expGroup);
  }

  // --- ZONE 5: QUANTUM HORIZON (CONTACT) ---
  createZoneContact() {
    this.contactGroup = new THREE.Group();
    this.contactGroup.position.set(0, -196, 0);

    // 1. Accretion Disk Swirling Particles
    const particleCount = 1400;
    const posArray = new Float32Array(particleCount * 3);
    const colArray = new Float32Array(particleCount * 3);
    const pData = [];

    const colorA = new THREE.Color(this.activeTheme.primary);
    const colorB = new THREE.Color(this.activeTheme.secondary);

    for (let i = 0; i < particleCount; i++) {
      const dist = 3.5 + Math.pow(Math.random(), 1.5) * 14;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = (Math.random() - 0.5) * 1.8 * (dist / 14);

      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;

      const mixed = colorA.clone().lerp(colorB, Math.random());
      colArray[i * 3] = mixed.r;
      colArray[i * 3 + 1] = mixed.g;
      colArray[i * 3 + 2] = mixed.b;

      pData.push({ dist, angle, speed: 0.015 + (18 - dist) * 0.003 });
    }

    this.vortexGeo = new THREE.BufferGeometry();
    this.vortexGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    this.vortexGeo.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
    this.vortexParticleData = pData;

    this.vortexMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.vortexPoints = new THREE.Points(this.vortexGeo, this.vortexMat);
    this.vortexPoints.rotation.x = Math.PI / 3;
    this.contactGroup.add(this.vortexPoints);

    // 2. Central Black Hole Sphere with Event Horizon Rim
    const singGeo = new THREE.SphereGeometry(2.4, 32, 32);
    const singMat = new THREE.MeshBasicMaterial({ color: 0x010204 });
    const singMesh = new THREE.Mesh(singGeo, singMat);
    this.contactGroup.add(singMesh);

    // Radiant Rim Ring
    const rimGeo = new THREE.RingGeometry(2.45, 3.2, 48);
    this.rimMat = new THREE.MeshBasicMaterial({
      color: this.activeTheme.primary,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.rimMesh = new THREE.Mesh(rimGeo, this.rimMat);
    this.contactGroup.add(this.rimMesh);

    this.scene.add(this.contactGroup);
  }

  // --- GLOBAL STARFIELD & WARP PARTICLES ---
  createStarfield() {
    const count = 2200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const cPrimary = new THREE.Color(this.activeTheme.primary);
    const cSec = new THREE.Color(this.activeTheme.secondary);
    const cWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      // Stretched all the way down from Y=20 to Y=-220
      positions[i * 3 + 1] = 20 - Math.random() * 240;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      const pick = Math.random();
      let c = cWhite;
      if (pick > 0.6) c = cPrimary;
      else if (pick > 0.3) c = cSec;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      scales[i] = Math.random() * 1.5 + 0.5;
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

  // --- SHOCKWAVE SYSTEM: RADIAL EXPANSION ON EVERY SCROLL ---
  createShockwaveSystem() {
    this.shockwaves = [];
    const ringGeo = new THREE.RingGeometry(0.5, 0.7, 48);

    for (let i = 0; i < 4; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: this.activeTheme.primary,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.shockwaves.push({ mesh, mat, life: 0, maxLife: 1 });
    }
  }

  triggerShockwave(originVec, intensity = 1.0) {
    // Find available shockwave ring
    const sw = this.shockwaves.find(s => s.life <= 0) || this.shockwaves[0];
    sw.mesh.position.copy(originVec || this.cameraTarget);
    sw.mesh.lookAt(this.camera.position);
    sw.mesh.scale.set(0.1, 0.1, 0.1);
    sw.mesh.visible = true;
    sw.life = 1.0;
    sw.intensity = intensity;
    sw.mat.opacity = 0.85 * intensity;

    if (window.cyberAudio) {
      window.cyberAudio.playShockwave();
    }
  }

  // --- SCROLL INPUT TRIGGER: EVERY SCROLL SENDS AN ANIMATION IMPULSE ---
  onScrollTick(progress, delta) {
    this.targetScrollProgress = Math.max(0, Math.min(1, progress));

    // Calculate velocity
    const diff = Math.abs(this.targetScrollProgress - this.prevTargetProgress);
    this.prevTargetProgress = this.targetScrollProgress;
    this.scrollVelocity = diff * 120;

    // Inject physical impulse
    const impulseStrength = Math.min(Math.abs(delta) * 0.003 + diff * 8, 2.5);
    this.scrollImpulse = Math.min(this.scrollImpulse + impulseStrength, 3.0);

    // Audio tick on every scroll
    if (window.cyberAudio) {
      window.cyberAudio.playScrollTick(this.scrollImpulse);
    }

    // Trigger visual shockwave if vigorous scroll
    if (this.scrollImpulse > 1.2) {
      this.triggerShockwave(null, Math.min(this.scrollImpulse * 0.6, 1.2));
    }
  }

  // --- THEME SWITCHER ---
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
    if (this.terrainMat) this.terrainMat.color.set(this.activeTheme.primary);
    if (this.skillsCenterMat) this.skillsCenterMat.emissive.set(this.activeTheme.primary);
    if (this.rimMesh) this.rimMesh.material.color.set(this.activeTheme.primary);

    // Update CSS root variables
    const root = document.documentElement;
    root.style.setProperty('--neon-primary', '#' + cPri.getHexString());
    root.style.setProperty('--neon-secondary', '#' + cSec.getHexString());
    root.style.setProperty('--neon-accent', '#' + cAcc.getHexString());
    root.style.setProperty('--bg-dark', this.activeTheme.bgTint);

    // Trigger shockwave celebration
    this.triggerShockwave(this.cameraTarget, 1.2);
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

  // Focus on project portal when card hovered or clicked in UI
  focusProject(index) {
    if (this.projectPortals[index]) {
      const p = this.projectPortals[index];
      gsap.to(p.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.5, ease: 'back.out(2)' });
      if (p.userData.artifact) {
        gsap.to(p.userData.artifact.rotation, { y: p.userData.artifact.rotation.y + Math.PI, duration: 0.8 });
      }
    }
  }

  unfocusProject(index) {
    if (this.projectPortals[index]) {
      const p = this.projectPortals[index];
      gsap.to(p.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.4, ease: 'power2.out' });
    }
  }

  // --- CAMERA INTERPOLATION ALONG 3D SPLINE ---
  updateCameraSpline(progress) {
    const waypoints = this.waypoints;
    let segIdx = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      if (progress >= waypoints[i].t && progress <= waypoints[i + 1].t) {
        segIdx = i;
        break;
      }
    }

    const p0 = waypoints[segIdx];
    const p1 = waypoints[segIdx + 1];
    const segT = (progress - p0.t) / (p1.t - p0.t);
    // Smooth cosine interpolation
    const smoothT = (1 - Math.cos(segT * Math.PI)) / 2;

    // Interpolate Camera Position
    const targetCamX = p0.pos.x + (p1.pos.x - p0.pos.x) * smoothT + this.mouse.x * 2.5;
    const targetCamY = p0.pos.y + (p1.pos.y - p0.pos.y) * smoothT + this.mouse.y * 2.0;
    const targetCamZ = p0.pos.z + (p1.pos.z - p0.pos.z) * smoothT;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.08;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;

    // Interpolate Camera Target (lookAt)
    const targetLookX = p0.look.x + (p1.look.x - p0.look.x) * smoothT;
    const targetLookY = p0.look.y + (p1.look.y - p0.look.y) * smoothT;
    const targetLookZ = p0.look.z + (p1.look.z - p0.look.z) * smoothT;

    this.cameraTarget.x += (targetLookX - this.cameraTarget.x) * 0.08;
    this.cameraTarget.y += (targetLookY - this.cameraTarget.y) * 0.08;
    this.cameraTarget.z += (targetLookZ - this.cameraTarget.z) * 0.08;

    this.camera.lookAt(this.cameraTarget);

    // Dynamic FOV Warp during scroll impulse
    const baseFov = 50;
    const warpFov = baseFov + this.scrollImpulse * 6.5;
    this.camera.fov += (warpFov - this.camera.fov) * 0.12;
    this.camera.updateProjectionMatrix();

    // Move primary dynamic light with camera
    this.primaryPointLight.position.set(
      this.camera.position.x + 8,
      this.camera.position.y + 6,
      this.camera.position.z - 5
    );

    // Update active sector string
    this.currentSectorName = p0.sector;
  }

  // --- ANIMATION FRAME TICK ---
  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Smooth progress interpolation (inertial Lerp)
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08;

    // 2. Decay scroll impulse smoothly
    this.scrollImpulse *= 0.92;
    if (this.scrollImpulse < 0.001) this.scrollImpulse = 0;

    // 3. Mouse smoothing
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // 4. Update Camera Spline & FOV
    this.updateCameraSpline(this.scrollProgress);

    // 5. Dynamic Rotation Boost multiplier on every scroll!
    const torqueBoost = 1.0 + this.scrollImpulse * 3.5;

    // --- ZONE ANIMATIONS ---
    // Zone 0: Hero Core & Rings
    if (this.heroGroup) {
      this.coreMesh.rotation.y += 0.008 * torqueBoost;
      this.coreMesh.rotation.x += 0.005 * torqueBoost;
      this.coreWireMesh.rotation.y -= 0.012 * torqueBoost;

      // Expand rings radially based on scroll impulse
      const ringScale = 1.0 + this.scrollImpulse * 0.15;
      this.gimbalRings.forEach((ring, i) => {
        ring.rotation.x += (0.01 + i * 0.008) * torqueBoost;
        ring.rotation.y += (0.008 + i * 0.006) * torqueBoost;
        ring.scale.set(ringScale, ringScale, ringScale);
      });

      // Orbiting satellites
      this.satellites.forEach((sat) => {
        sat.userData.angle += sat.userData.speed * delta * torqueBoost;
        const r = sat.userData.orbitRadius;
        sat.position.x = Math.cos(sat.userData.angle) * r;
        sat.position.z = Math.sin(sat.userData.angle) * r;
        sat.position.y = Math.sin(sat.userData.angle * 2) * sat.userData.inclination * 4;
        sat.rotation.x += 0.03;
        sat.rotation.y += 0.04;
      });
    }

    // Zone 1: About Helix
    if (this.aboutGroup) {
      this.aboutGroup.rotation.y += 0.012 * torqueBoost;
      this.aboutPanels.forEach((p, idx) => {
        p.position.y += Math.sin(elapsedTime * 2 + idx) * 0.008;
      });
    }

    // Zone 2: Skills Galaxy
    if (this.skillsGroup) {
      this.skillsCenterMesh.rotation.x += 0.01 * torqueBoost;
      this.skillsCenterMesh.rotation.y += 0.015 * torqueBoost;

      // Constellation expansion during scroll
      const clusterSpread = 1.0 + Math.sin(this.scrollProgress * Math.PI * 3) * 0.25 + this.scrollImpulse * 0.2;
      this.skillNodes.forEach((node) => {
        node.userData.angle += node.userData.rotSpeed * torqueBoost;
        const r = node.userData.radius * clusterSpread;
        node.position.x = Math.cos(node.userData.angle) * r;
        node.position.z = Math.sin(node.userData.angle) * r;
        node.position.y = node.userData.baseY + Math.sin(elapsedTime * 2 + node.userData.angle) * 0.6;
        node.rotation.x += 0.02;
        node.rotation.y += 0.02;
      });
    }

    // Zone 3: Project Portals
    if (this.projectsGroup) {
      this.projectPortals.forEach((p, idx) => {
        if (p.userData.artifact) {
          p.userData.artifact.rotation.x += 0.015 * torqueBoost;
          p.userData.artifact.rotation.y += 0.02 * torqueBoost;
        }
        if (p.userData.halo) {
          p.userData.halo.rotation.z += 0.02 * torqueBoost;
        }
        p.position.y = p.userData.baseY + Math.sin(elapsedTime * 1.5 + idx * 1.2) * 0.35;
      });
    }

    // Zone 4: Experience Cyber Highway Wave
    if (this.terrainGeo) {
      const pos = this.terrainGeo.attributes.position;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        // Wave speed driven by time + scroll progress
        const waveZ = Math.sin(u * 0.25 + elapsedTime * 2.5 + this.scrollProgress * 20) * 1.4 +
                      Math.cos(v * 0.3 + elapsedTime * 1.8) * 1.0;
        pos.setZ(i, waveZ);
      }
      this.terrainGeo.attributes.position.needsUpdate = true;

      // Milestone beacon pulse
      this.milestoneBeacons.forEach((beacon, i) => {
        beacon.position.y = 2 + Math.sin(elapsedTime * 3 + i * 1.5) * 0.2;
      });
    }

    // Zone 5: Contact Vortex & Accretion Disk
    if (this.vortexGeo && this.vortexParticleData) {
      const pos = this.vortexGeo.attributes.position;
      const count = this.vortexParticleData.length;
      const vortexSpeed = 1.0 + this.scrollImpulse * 5.0;

      for (let i = 0; i < count; i++) {
        const p = this.vortexParticleData[i];
        p.angle += p.speed * vortexSpeed * 0.05;
        // Spiral gently inwards
        const x = Math.cos(p.angle) * p.dist;
        const z = Math.sin(p.angle) * p.dist;
        pos.setXYZ(i, x, pos.getY(i), z);
      }
      this.vortexGeo.attributes.position.needsUpdate = true;
      this.rimMesh.rotation.z += 0.02 * vortexSpeed;
    }

    // Shockwave expansion & decay
    this.shockwaves.forEach((sw) => {
      if (sw.life > 0) {
        sw.life -= delta * 1.8;
        const scale = 0.5 + (1 - sw.life) * 18 * sw.intensity;
        sw.mesh.scale.set(scale, scale, scale);
        sw.mat.opacity = sw.life * 0.8 * sw.intensity;
        if (sw.life <= 0) {
          sw.mesh.visible = false;
        }
      }
    });

    // Starfield Particle Warp
    if (this.starGeo) {
      // Elongate stars during scroll impulse
      const warpStretch = 1.0 + this.scrollImpulse * 1.8;
      this.starfield.scale.set(1.0, warpStretch, 1.0);
    }

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
        velocity: (this.scrollImpulse * 42).toFixed(1),
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
          this.hoveredObject.material.emissiveIntensity = 0.6;
        }
        this.hoveredObject = obj;
        if (obj.material && obj.material.emissive) {
          obj.material.emissiveIntensity = 1.5;
        }
        if (window.cyberAudio) {
          window.cyberAudio.playChime(750, 0.15, 'sine');
        }
      }
    } else {
      if (this.hoveredObject && this.hoveredObject.material.emissive) {
        this.hoveredObject.material.emissiveIntensity = 0.6;
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
      if (e.target.closest('button, a, input, textarea, .interactive-card')) return;
      this.triggerShockwave(null, 1.0);
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
