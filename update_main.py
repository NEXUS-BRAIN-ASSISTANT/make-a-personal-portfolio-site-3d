with open('js/main.js') as f:
    code = f.read()

# Replace wheel and touchmove listeners
wheel_touch_old = """  // Direct wheel & touch gesture listener: every scroll gesture injects instant torque & shockwave impulse
  window.addEventListener('wheel', (e) => {
    if (isAutoCruising) stopAutoCruise();
    if (cyberScene) {
      const impulse = Math.min(Math.abs(e.deltaY) * 0.006, 1.4);
      cyberScene.scrollImpulse = Math.min(cyberScene.scrollImpulse + impulse, 3.5);
      if (e.deltaY > 0) cyberScene.scrollDirection = 1;
      else if (e.deltaY < 0) cyberScene.scrollDirection = -1;
      if (window.cyberAudio) {
        window.cyberAudio.playScrollTick(cyberScene.scrollImpulse);
      }
    }
  }, { passive: true });

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (isAutoCruising) stopAutoCruise();
    if (e.touches.length > 0) touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0 && cyberScene) {
      const touchY = e.touches[0].clientY;
      const diff = touchStartY - touchY;
      touchStartY = touchY;
      const impulse = Math.min(Math.abs(diff) * 0.025, 1.2);
      cyberScene.scrollImpulse = Math.min(cyberScene.scrollImpulse + impulse, 3.5);
      if (diff > 0) cyberScene.scrollDirection = 1;
      else if (diff < 0) cyberScene.scrollDirection = -1;
      if (window.cyberAudio) {
        window.cyberAudio.playScrollTick(cyberScene.scrollImpulse);
      }
    }
  }, { passive: true });

  // 4. Kinetic 3D Aerodynamic Pitch on Cards in RAF Loop
  let smoothedCardTilt = 0;

  function updateCardPhysics() {
    requestAnimationFrame(updateCardPhysics);
    if (!cyberScene) return;

    const targetTilt = Math.max(-3.5, Math.min(3.5, -cyberScene.scrollImpulse * 1.5 * cyberScene.scrollDirection));
    smoothedCardTilt += (targetTilt - smoothedCardTilt) * 0.12;

    document.documentElement.style.setProperty('--card-tilt', `${smoothedCardTilt.toFixed(2)}deg`);
    document.documentElement.style.setProperty('--scroll-impulse', cyberScene.scrollImpulse.toFixed(3));
  }
  updateCardPhysics();"""

wheel_touch_new = """  // Direct wheel & touch gesture listener: every scroll gesture injects instant torque, sparks & shockwave impulse
  window.addEventListener('wheel', (e) => {
    if (isAutoCruising) stopAutoCruise();
    if (cyberScene) {
      const dir = e.deltaY > 0 ? 1 : -1;
      const impulse = Math.min(Math.max(Math.abs(e.deltaY) * 0.007, 0.35), 2.2);
      cyberScene.onGestureScroll(dir, impulse);
      if (window.cyberAudio) {
        window.cyberAudio.playScrollTick(cyberScene.scrollImpulse);
      }
    }
  }, { passive: true });

  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (isAutoCruising) stopAutoCruise();
    if (e.touches.length > 0) touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0 && cyberScene) {
      const touchY = e.touches[0].clientY;
      const diff = touchStartY - touchY;
      touchStartY = touchY;
      if (Math.abs(diff) > 2) {
        const dir = diff > 0 ? 1 : -1;
        const impulse = Math.min(Math.max(Math.abs(diff) * 0.02, 0.4), 2.2);
        cyberScene.onGestureScroll(dir, impulse);
        if (window.cyberAudio) {
          window.cyberAudio.playScrollTick(cyberScene.scrollImpulse);
        }
      }
    }
  }, { passive: true });

  // 4. Kinetic 3D Aerodynamic Pitch on Cards & Live HUD Pulse Meter in RAF Loop
  let smoothedCardTilt = 0;
  const pulseMeter = document.getElementById('telemetry-pulse-meter');
  const pulseMeterVal = document.getElementById('pulse-meter-val');
  const pulseMeterLabel = document.getElementById('pulse-meter-label');

  function updateCardPhysics() {
    requestAnimationFrame(updateCardPhysics);
    if (!cyberScene) return;

    // Pitch aerodynamic tilt up to +/- 6.5deg
    const targetTilt = Math.max(-6.5, Math.min(6.5, -cyberScene.scrollImpulse * 2.8 * cyberScene.scrollDirection));
    smoothedCardTilt += (targetTilt - smoothedCardTilt) * 0.14;

    document.documentElement.style.setProperty('--card-tilt', `${smoothedCardTilt.toFixed(2)}deg`);
    document.documentElement.style.setProperty('--scroll-impulse', cyberScene.scrollImpulse.toFixed(3));

    // Dynamic HUD pulse meter reaction
    if (pulseMeter && pulseMeterVal) {
      if (cyberScene.scrollImpulse > 0.15) {
        pulseMeter.classList.add('active');
        pulseMeterVal.textContent = `+${(cyberScene.scrollImpulse * 1.6).toFixed(1)}G // WARP`;
        if (pulseMeterLabel) pulseMeterLabel.textContent = cyberScene.scrollDirection > 0 ? 'DESCENDING:' : 'ASCENDING:';
      } else {
        pulseMeter.classList.remove('active');
        pulseMeterVal.textContent = 'IDLE 0.0G';
        if (pulseMeterLabel) pulseMeterLabel.textContent = 'SCROLL IMPULSE:';
      }
    }
  }
  updateCardPhysics();"""

assert wheel_touch_old in code, "wheel_touch_old snippet not found in main.js"
code = code.replace(wheel_touch_old, wheel_touch_new)

# Update keydown to support ArrowDown, ArrowUp, PageDown, PageUp, Space
keydown_old = """  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });"""

keydown_new = """  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('open')) {
      closeModal();
      return;
    }
    // Keyboard navigation injects instant 3D scroll physics and audio tick
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      if (cyberScene) cyberScene.onGestureScroll(1, 1.3);
      if (window.cyberAudio) window.cyberAudio.playScrollTick(1.3);
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      if (cyberScene) cyberScene.onGestureScroll(-1, 1.3);
      if (window.cyberAudio) window.cyberAudio.playScrollTick(1.3);
    }
  });"""

assert keydown_old in code, "keydown_old snippet not found in main.js"
code = code.replace(keydown_old, keydown_new)

with open('js/main.js', 'w') as f:
    f.write(code)

print('Updated js/main.js successfully!')
