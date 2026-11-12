/* ============================================================
   LEBAREF – main.js  (Blueprint redesign)
============================================================ */
'use strict';

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const navbar        = qs('#navbar');
const hamburger     = qs('#hamburger');
const navMenu       = qs('#nav-menu');
const mobileOverlay = qs('#mobile-overlay');
const navLinks      = qsa('.navbar__link');
const backToTopBtn  = qs('#back-to-top');


/* ─── 0. VIDEO LOCAL PLAYBACK & SERVICE PLAYERS ─────────── */
(function initVideos() {
  // Hero local video on home page (reproducción fluida con poster fallback)
  const heroVid = document.getElementById('hero-local-video');
  if (heroVid) {
    const startPlay = () => {
      heroVid.muted = true;
      const p = heroVid.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    };
    startPlay();
    ['touchstart', 'pointerdown', 'scroll', 'click'].forEach(evt => {
      window.addEventListener(evt, startPlay, { once: true, passive: true });
    });
  }

  // Service video players on service pages
  function setupServicePlayers() {
    const videoCards = document.querySelectorAll('.service-video-card');
    videoCards.forEach(card => {
      const video = card.querySelector('.service-video-element');
      const playBtn = card.querySelector('.js-toggle-play');
      const muteBtn = card.querySelector('.js-toggle-mute');
      const fsBtn = card.querySelector('.js-toggle-fs');
      const progressBar = card.querySelector('.svc-video-progress-bar');

      if (!video) return;

      // Ensure autoplay starts smoothly
      video.play().catch(() => {});

      // Toggle Play / Pause
      const togglePlay = () => {
        if (video.paused) {
          video.play();
          if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
          video.pause();
          if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
      };

      playBtn?.addEventListener('click', e => {
        e.stopPropagation();
        togglePlay();
      });

      video.addEventListener('click', togglePlay);

      // Toggle Mute
      muteBtn?.addEventListener('click', e => {
        e.stopPropagation();
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted 
          ? '<i class="fas fa-volume-mute"></i>' 
          : '<i class="fas fa-volume-up"></i>';
      });

      // Toggle Fullscreen
      fsBtn?.addEventListener('click', e => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
          if (video.requestFullscreen) video.requestFullscreen();
          else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      });

      // Update progress bar
      video.addEventListener('timeupdate', () => {
        if (progressBar && video.duration) {
          const pct = (video.currentTime / video.duration) * 100;
          progressBar.style.width = pct + '%';
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupServicePlayers);
  } else {
    setupServicePlayers();
  }
})();


/* ─── 1. NAVBAR scroll ─────────────────────────────────── */
function handleNavbarScroll() {
  if (window.scrollY > 50) {
    navbar.classList.add('navbar--scrolled');
  } else {
    navbar.classList.remove('navbar--scrolled');
  }
}
window.addEventListener('scroll', handleNavbarScroll, { passive: true });
handleNavbarScroll();


/* ─── 2. HAMBURGER MENU ─────────────────────────────────── */
function openMenu() {
  hamburger.classList.add('is-open');
  hamburger.setAttribute('aria-expanded', 'true');
  navMenu.classList.add('is-open');
  navbar?.classList.add('menu-is-open');
  mobileOverlay?.classList.add('is-open');
  mobileOverlay?.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  hamburger.classList.remove('is-open');
  hamburger.setAttribute('aria-expanded', 'false');
  navMenu.classList.remove('is-open');
  navbar?.classList.remove('menu-is-open');
  mobileOverlay?.classList.remove('is-open');
  mobileOverlay?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

hamburger?.addEventListener('click', () => {
  hamburger.classList.contains('is-open') ? closeMenu() : openMenu();
});
mobileOverlay?.addEventListener('click', closeMenu);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
navLinks.forEach(link => link.addEventListener('click', closeMenu));


/* ─── 3. SCROLL SPY (active link) ──────────────────────── */
const sections = qsa('section[id]');

function updateActiveLink() {
  const mid = window.scrollY + window.innerHeight / 3;
  sections.forEach(sec => {
    const link = qs(`.navbar__link[data-section="${sec.id}"]`);
    if (!link) return;
    if (mid >= sec.offsetTop && mid < sec.offsetTop + sec.offsetHeight) {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}
window.addEventListener('scroll', updateActiveLink, { passive: true });
updateActiveLink();


/* ─── 4. COUNTER ANIMATION ─────────────────────────────── */
function animateCounter(el) {
  const target   = +el.dataset.target;
  const prefix   = el.dataset.prefix || '';
  const suffix   = el.dataset.suffix || '';
  const duration = 2000;
  const start    = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = prefix + Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = prefix + target + suffix;
  }
  requestAnimationFrame(step);
}


/* ─── 5. INTERSECTION OBSERVER (reveal + counters) ─────── */
function initReveal() {
  // Mark cards/elements
  const revealEls = qsa(
    '.svc-card, .carousel__slide, .about__left, .about__right, .contact__info, .contact__form, .stat'
  );
  revealEls.forEach((el, i) => {
    el.classList.add('reveal');
    const delay = i % 4;
    if (delay > 0) el.classList.add(`reveal-delay-${delay}`);
  });

  const animatedCounters = new Set();

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');

      // Counters in stat elements
      if (entry.target.classList.contains('stat')) {
        const numEl = entry.target.querySelector('.stat__number');
        if (numEl && !animatedCounters.has(numEl)) {
          animatedCounters.add(numEl);
          animateCounter(numEl);
        }
      }

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  qsa('.reveal').forEach(el => observer.observe(el));
}
initReveal();


/* ─── 6. CLIENTS CAROUSEL (Movimiento Continuo Autónomo, Elegante & Vivo) ─── */
(function initClientsCarousel() {
  const track    = qs('#clients-track');
  const carousel = qs('#clients-carousel');

  if (!track || !carousel) return;

  let pos = 0;
  const speed = 0.90; // Velocidad de deslizamiento suave, continuo y señorial
  let isPaused = false;
  let rafId = null;

  function getHalfWidth() {
    return track.scrollWidth / 2;
  }

  function step() {
    if (!isPaused) {
      const half = getHalfWidth();
      if (half > 10) {
        pos += speed;
        if (pos >= half) {
          pos -= half;
        }
        track.style.transform = `translate3d(-${pos}px, 0, 0)`;
      }
    }
    rafId = requestAnimationFrame(step);
  }

  rafId = requestAnimationFrame(step);

  // Pausa suave al pasar el cursor o en pantalla táctil para admirar o hacer clic
  carousel.addEventListener('mouseenter', () => { isPaused = true; });
  carousel.addEventListener('mouseleave', () => { isPaused = false; });
  carousel.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
  carousel.addEventListener('touchend', () => { isPaused = false; }, { passive: true });

  // Navegación accesible por teclado
  carousel.addEventListener('keydown', e => {
    const half = getHalfWidth();
    if (e.key === 'ArrowRight') {
      pos += 260 * 2;
      if (pos >= half) pos -= half;
      track.style.transform = `translate3d(-${pos}px, 0, 0)`;
    } else if (e.key === 'ArrowLeft') {
      pos -= 260 * 2;
      if (pos < 0) pos += half;
      track.style.transform = `translate3d(-${pos}px, 0, 0)`;
    }
  });
})();


/* ─── 7. CONTACT FORM ───────────────────────────────────── */
(function initForm() {
  const form      = qs('#contact-form');
  const submitBtn = qs('#submit-btn');
  const successEl = qs('#form-success');
  if (!form) return;

  const validators = {
    nombre:  v => v.trim().length >= 2   ? '' : 'Ingresa tu nombre completo.',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Correo inválido.',
    servicio:v => v !== '' ? '' : 'Selecciona un servicio.',
    mensaje: v => v.trim().length >= 10  ? '' : 'Mínimo 10 caracteres.',
  };

  function validateField(input) {
    const fn  = validators[input.name];
    const err = input.closest('.form-group')?.querySelector('.form-error');
    if (!fn) return true;
    const msg = fn(input.value);
    if (err) err.textContent = msg;
    input.classList.toggle('has-error', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  qsa('[name]', form).forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('has-error')) validateField(input);
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const valid = qsa('[required]', form).every(inp => validateField(inp));
    if (!valid) return;

    const btnText = submitBtn.querySelector('.btn-text');
    submitBtn.disabled = true;
    btnText.textContent = 'Enviando...';

    await new Promise(r => setTimeout(r, 2000));

    form.reset();
    submitBtn.disabled = false;
    btnText.textContent = 'Enviar Solicitud';
    successEl?.removeAttribute('hidden');
    successEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => successEl?.setAttribute('hidden', ''), 6000);
  });
})();


/* ─── 8. BACK TO TOP ────────────────────────────────────── */
window.addEventListener('scroll', () => {
  if (window.scrollY > 400) {
    backToTopBtn?.removeAttribute('hidden');
  } else {
    backToTopBtn?.setAttribute('hidden', '');
  }
}, { passive: true });

backToTopBtn?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* ─── 9. FOOTER YEAR ────────────────────────────────────── */
const yearEl = qs('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* ─── 10. FULL-PAGE SECTION SNAP & CAROUSEL CONTROLS ─── */
(function initSectionSnapAndCarousels() {
  const snapSections = qsa('section[id], footer');
  
  // 1. Wheel Snap Assist exclusivo para Desktop con pantalla amplia
  if (snapSections.length) {
    let isLocked = false;
    let lastSlideTime = 0;

    window.addEventListener('wheel', e => {
      // Solo en computadoras de escritorio (más de 1024px y altura adecuada)
      if (window.innerWidth <= 1024 || window.innerHeight < 700) return;

      const now = Date.now();
      if (isLocked || (now - lastSlideTime < 800)) {
        e.preventDefault();
        return;
      }

      const delta = e.deltaY;
      if (Math.abs(delta) < 18) return;

      const currentY = window.scrollY;
      let currentIndex = 0;
      let minDistance = Infinity;

      snapSections.forEach((sec, i) => {
        const dist = Math.abs(currentY - sec.offsetTop);
        if (dist < minDistance) {
          minDistance = dist;
          currentIndex = i;
        }
      });

      const nextIndex = delta > 0 ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < snapSections.length) {
        e.preventDefault();
        isLocked = true;
        lastSlideTime = now;

        window.scrollTo({
          top: snapSections[nextIndex].offsetTop,
          behavior: 'smooth'
        });

        setTimeout(() => {
          isLocked = false;
        }, 750);
      }
    }, { passive: false });
  }

  // 2. Controladores Interactivos para Carruseles de Servicios y Fortalezas
  function setupInteractiveCarousel(gridSelector, prevBtnSelector, nextBtnSelector, dotSelector) {
    const grid = qs(gridSelector);
    if (!grid) return;

    const prevBtn = qs(prevBtnSelector);
    const nextBtn = qs(nextBtnSelector);
    const dots = qsa(dotSelector);
    const items = [...grid.children].filter(el => 
      !el.classList.contains('carousel-controls-bar') && 
      !el.classList.contains('services-header-top')
    );

    if (!items.length) return;

    // Calcular con precisión absoluta cuál elemento está centrado en la vista
    function getActiveIndex() {
      const gridRect = grid.getBoundingClientRect();
      const gridCenter = gridRect.left + (gridRect.width / 2);
      let closestIdx = 0;
      let minDiff = Infinity;

      items.forEach((item, idx) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left + (itemRect.width / 2);
        const diff = Math.abs(gridCenter - itemCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      return closestIdx;
    }

    function updateDots(idx) {
      dots.forEach((dot, dIdx) => {
        dot.classList.toggle('is-active', dIdx === idx);
      });
    }

    // Desplazamiento horizontal fluido que jamás altera el scroll vertical de la página
    function scrollToItem(idx) {
      if (idx < 0 || idx >= items.length) return;
      const targetItem = items[idx];
      const targetScrollLeft = targetItem.offsetLeft - ((grid.clientWidth - targetItem.clientWidth) / 2);

      // Desactivar temporalmente snap para evitar que el motor nativo cancele la animación fluida
      grid.style.scrollSnapType = 'none';
      grid.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth'
      });
      updateDots(idx);

      setTimeout(() => {
        grid.style.scrollSnapType = 'x mandatory';
      }, 350);
    }

    // Sincronización instantánea de los puntos al desplazarse táctilmente
    let ticking = false;
    grid.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const current = getActiveIndex();
          updateDots(current);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Botones Flecha Anterior y Siguiente
    prevBtn?.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      const current = getActiveIndex();
      scrollToItem(Math.max(0, current - 1));
    });

    nextBtn?.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      const current = getActiveIndex();
      scrollToItem(Math.min(items.length - 1, current + 1));
    });

    // Puntos interactivos (Dots)
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        scrollToItem(idx);
      });
    });

    // Soporte para Arrastre con Mouse (para pruebas en Desktop / Modo Responsivo de Devtools)
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let hasDragged = false;

    grid.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      startX = e.pageX;
      scrollStart = grid.scrollLeft;
      grid.style.scrollSnapType = 'none';
      grid.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', e => {
      if (!isDown) return;
      const deltaX = e.pageX - startX;
      if (Math.abs(deltaX) > 6) {
        hasDragged = true;
      }
      grid.scrollLeft = scrollStart - deltaX;
    });

    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      grid.style.cursor = '';
      grid.style.scrollSnapType = 'x mandatory';
      if (hasDragged) {
        const current = getActiveIndex();
        scrollToItem(current);
      }
    });

    // Evitar que el clic abra el enlace si se estuvo arrastrando con el ratón
    grid.addEventListener('click', e => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);
  }

  setupInteractiveCarousel('.services-grid--projectgroup', '.js-svc-prev', '.js-svc-next', '.svc-nav-dot');
  setupInteractiveCarousel('.strengths-grid', '.js-str-prev', '.js-str-next', '.str-nav-dot');
})();


console.log('%c🏗 LEBAREF – Blueprint UI loaded', 'color:#1B9CFC;font-weight:800;font-size:13px;');
