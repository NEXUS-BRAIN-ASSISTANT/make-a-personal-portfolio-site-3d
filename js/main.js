/**
 * Main Application Orchestrator
 * Connects DOM interactions, GSAP ScrollTrigger, Audio synthesis,
 * Project Modals, Telemetry HUD, and Three.js 3D Engine.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D WebGL Canvas
  let cyberScene = null;
  try {
    cyberScene = new CyberScene('webgl-canvas');
    window.cyberScene = cyberScene;
  } catch (err) {
    console.error('Failed to initialize 3D scene:', err);
  }

  // 2. Telemetry HUD Handler
  const hudSector = document.getElementById('telemetry-sector');
  const hudProgress = document.getElementById('telemetry-progress');
  const hudVelocity = document.getElementById('telemetry-velocity-val');
  const hudCoords = document.getElementById('telemetry-coords-val');
  const velocityBarFill = document.getElementById('velocity-bar-fill');

  window.onCyberTelemetryUpdate = (data) => {
    if (hudSector) hudSector.textContent = data.sector;
    if (hudProgress) hudProgress.textContent = `${data.progress}%`;
    if (hudVelocity) hudVelocity.textContent = `${data.velocity} PX/S`;
    if (hudCoords) hudCoords.textContent = `[X: ${data.camX}, Y: ${data.camY}, Z: ${data.camZ}]`;
    if (velocityBarFill) {
      const pct = Math.min(parseFloat(data.velocity) * 2.2, 100);
      velocityBarFill.style.width = `${pct}%`;
    }
  };

  // 3. Scroll Event Handler - Feeds into 3D Scene on every scroll!
  let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    const delta = scrollTop - lastScrollTop;
    lastScrollTop = scrollTop;

    if (cyberScene) {
      cyberScene.onScrollTick(progress, delta);
    }

    updateActiveNavSection();
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  // Direct wheel & touch gesture listener: every scroll gesture injects instant torque & shockwave impulse
  window.addEventListener('wheel', (e) => {
    if (cyberScene) {
      const impulse = Math.min(Math.abs(e.deltaY) * 0.005, 1.2);
      cyberScene.scrollImpulse = Math.min(cyberScene.scrollImpulse + impulse, 3.0);
      if (window.cyberAudio) {
        window.cyberAudio.playScrollTick(cyberScene.scrollImpulse);
      }
    }
  }, { passive: true });

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0 && cyberScene) {
      const touchY = e.touches[0].clientY;
      const diff = Math.abs(touchY - touchStartY);
      touchStartY = touchY;
      const impulse = Math.min(diff * 0.02, 1.0);
      cyberScene.scrollImpulse = Math.min(cyberScene.scrollImpulse + impulse, 3.0);
      if (window.cyberAudio) {
        window.cyberAudio.playScrollTick(cyberScene.scrollImpulse);
      }
    }
  }, { passive: true });

  // 4. Navigation Links & Side Dots active state updates
  const sections = Array.from(document.querySelectorAll('.section-zone'));
  const navLinks = Array.from(document.querySelectorAll('.hud-nav-link'));
  const sideDots = Array.from(document.querySelectorAll('.side-nav-dot'));

  function updateActiveNavSection() {
    const scrollY = window.pageYOffset + 250;
    let currentId = 'hero';

    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    sideDots.forEach((dot) => {
      if (dot.getAttribute('data-target') === currentId) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // Smooth scroll click for side dots & nav links
  document.querySelectorAll('a[href^="#"], .side-nav-dot').forEach((elem) => {
    elem.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = elem.getAttribute('href')?.replace('#', '') || elem.getAttribute('data-target');
      const targetSec = document.getElementById(targetId);
      if (targetSec) {
        if (window.cyberAudio) window.cyberAudio.playChime(600, 0.15);
        targetSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 5. Audio Toggle Button
  const btnAudio = document.getElementById('btn-audio-toggle');
  if (btnAudio) {
    btnAudio.addEventListener('click', () => {
      if (window.cyberAudio) {
        const isEnabled = window.cyberAudio.toggle();
        btnAudio.classList.toggle('active', isEnabled);
        btnAudio.innerHTML = isEnabled 
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> AUDIO: ON`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg> AUDIO: MUTED`;
      }
    });
  }

  // 6. Wireframe Mode Toggle
  const btnWireframe = document.getElementById('btn-wireframe-toggle');
  if (btnWireframe && cyberScene) {
    btnWireframe.addEventListener('click', () => {
      const isWire = cyberScene.toggleWireframe();
      btnWireframe.classList.toggle('active', isWire);
      if (window.cyberAudio) window.cyberAudio.playChime(500, 0.12, 'square');
    });
  }

  // 7. Theme Picker Dots
  const themeDots = document.querySelectorAll('.theme-dot');
  themeDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      themeDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      const theme = dot.getAttribute('data-theme');
      if (cyberScene) cyberScene.setTheme(theme);
      if (window.cyberAudio) window.cyberAudio.playChime(800, 0.2);
    });
  });

  // 8. Shockwave Action Button
  const btnShockwave = document.getElementById('btn-spawn-shockwave');
  if (btnShockwave && cyberScene) {
    btnShockwave.addEventListener('click', () => {
      cyberScene.triggerShockwave(null, 1.8);
      btnShockwave.style.transform = 'scale(0.95)';
      setTimeout(() => btnShockwave.style.transform = 'scale(1)', 150);
    });
  }

  // 9. Warp to Top Button
  const btnWarpTop = document.getElementById('btn-warp-top');
  if (btnWarpTop) {
    btnWarpTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (cyberScene) cyberScene.triggerShockwave(null, 1.5);
    });
  }

  // 10. Project Cards Interactivity & Modal Data
  const projectDatabase = [
    {
      title: 'NEURA-GL // Synaptic Neural Visualizer',
      category: '3D WebGL / GLSL Shaders',
      desc: 'Real-time 3D synaptic neural network simulator powered by WebGL compute shaders and dynamic audio-reactive graph nodes. Simulates millions of neuro-electrical signals flowing through custom 3D neural topologies.',
      tech: ['Three.js', 'Custom GLSL Shaders', 'Web Audio API', 'TypeScript', 'Web Workers'],
      features: [
        'Real-time GPU compute simulation running at stable 60 FPS',
        'Custom fragment shaders generating volumetric electrical synaptic discharges',
        'Interactive audio-frequency spectrum analyzer directly modulating node pulses',
        'Exportable high-resolution spatial graph topologies in GLTF/USDZ'
      ]
    },
    {
      title: 'AETHERIA SPATIAL // Virtual Luxury Configurator',
      category: 'Spatial Web / PBR Rendering',
      desc: 'Next-generation photorealistic 3D configurator designed for spatial computing and high-end automotive visualization. Implements dynamic environment irradiance maps, screen-space reflections, and real-time paint customization.',
      tech: ['WebGL 2.0', 'Three.js PBR', 'React Three Fiber', 'Post-processing Bloom', 'GLTF Draco'],
      features: [
        'Physically Based Rendering (PBR) with custom anisotropic clear-coat materials',
        'HDR lighting pipeline with dynamic day/dusk/night environment maps',
        'Draco compressed 3D assets with sub-second loading time on mobile',
        'Spatial AR camera passthrough preview for mobile devices'
      ]
    },
    {
      title: 'CHRONOS ARCHIVE // Spatial Memory Navigation',
      category: 'Creative Tech / Spatial UI',
      desc: 'An immersive voxelized 3D timeline spanning centuries of scientific breakthroughs. Users fly through celestial spatial clusters, inspecting digital artifacts rendered with custom wireframe and point-cloud shaders.',
      tech: ['Three.js', 'GSAP ScrollTrigger', 'IndexedDB', 'WebGL Points Cloud', 'Spatial Audio'],
      features: [
        'Over 50,000 interactive historical artifacts rendered with instanced meshes',
        'Dynamic camera flight path controlled by gesture velocity & mouse parallax',
        'Binaural 3D positional audio tailored for each historical cluster',
        'Fluid timeline filtering by era, discipline, and technological impact'
      ]
    },
    {
      title: 'KINETIC VOID // Procedural Synth & Particle Lab',
      category: 'Generative Audio / Canvas Shaders',
      desc: 'An experimental sandbox merging procedural particle physics with algorithmic sound synthesis. Modulating wave frequencies deforms 3D spatial geometry in real time.',
      tech: ['GLSL Shaders', 'Web Audio API', 'Canvas API', 'WebAssembly', 'MIDI Integration'],
      features: [
        'Procedural sound synthesis with FM oscillators and multi-mode filters',
        'Particle wave distortion driven by mathematical Fourier transforms',
        'MIDI hardware controller input support with zero perceptible latency',
        'Preset sharing with cryptographically compressed URL hashes'
      ]
    }
  ];

  const projectCards = document.querySelectorAll('.project-card');
  const modalBackdrop = document.getElementById('project-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalCategory = document.getElementById('modal-category');
  const modalDesc = document.getElementById('modal-desc');
  const modalFeatures = document.getElementById('modal-features');
  const modalTags = document.getElementById('modal-tags');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  projectCards.forEach((card, index) => {
    // 3D Portal Focus on hover
    card.addEventListener('mouseenter', () => {
      if (cyberScene) cyberScene.focusProject(index);
    });

    card.addEventListener('mouseleave', () => {
      if (cyberScene) cyberScene.unfocusProject(index);
    });

    // Open Case Study Modal
    card.addEventListener('click', () => {
      const data = projectDatabase[index];
      if (!data) return;

      if (modalTitle) modalTitle.textContent = data.title;
      if (modalCategory) modalCategory.textContent = data.category;
      if (modalDesc) modalDesc.textContent = data.desc;

      if (modalFeatures) {
        modalFeatures.innerHTML = data.features.map(f => `
          <div class="modal-feature-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>${f}</span>
          </div>
        `).join('');
      }

      if (modalTags) {
        modalTags.innerHTML = data.tech.map(t => `<span class="tech-tag">${t}</span>`).join('');
      }

      if (modalBackdrop) modalBackdrop.classList.add('open');
      if (window.cyberAudio) window.cyberAudio.playChime(850, 0.25, 'sine');
    });
  });

  const closeModal = () => {
    if (modalBackdrop) modalBackdrop.classList.remove('open');
    if (window.cyberAudio) window.cyberAudio.playChime(420, 0.15, 'sine');
  };

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  // 11. Copy Email Action
  const btnCopyEmail = document.getElementById('btn-copy-email');
  if (btnCopyEmail) {
    btnCopyEmail.addEventListener('click', () => {
      const email = 'alex.vance.dev@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        const origText = btnCopyEmail.innerHTML;
        btnCopyEmail.innerHTML = '✓ COPIED';
        btnCopyEmail.style.color = '#10b981';
        if (window.cyberAudio) window.cyberAudio.playChime(950, 0.2, 'sine');
        setTimeout(() => {
          btnCopyEmail.innerHTML = origText;
          btnCopyEmail.style.color = '';
        }, 2200);
      });
    });
  }

  // 12. Interactive Contact Form Submission Simulation
  const contactForm = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const origContent = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `TRANSMITTING...`;

      if (window.cyberAudio) {
        window.cyberAudio.playChime(600, 0.1);
        setTimeout(() => window.cyberAudio.playChime(800, 0.1), 150);
        setTimeout(() => window.cyberAudio.playChime(1000, 0.15), 300);
      }

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `✓ DISPATCHED`;
        submitBtn.style.background = '#10b981';

        if (formFeedback) {
          formFeedback.className = 'form-feedback success';
          formFeedback.textContent = 'QUANTUM PACKET DELIVERED // I WILL RESPOND WITHIN 24 HOURS.';
        }

        contactForm.reset();
        if (cyberScene) cyberScene.triggerShockwave(null, 1.6);

        setTimeout(() => {
          submitBtn.innerHTML = origContent;
          submitBtn.style.background = '';
        }, 3500);
      }, 1200);
    });
  }

  // 13. GSAP ScrollTrigger Animations for DOM elements
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // Fade and slide up sections
    gsap.utils.toArray('.glass-card').forEach((card) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      });
    });

    gsap.utils.toArray('.section-title').forEach((title) => {
      gsap.from(title, {
        scrollTrigger: {
          trigger: title,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out'
      });
    });
  }
});
