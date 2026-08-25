/* ==========================================================================
   Spatial UI — 3D Tilt + Specular Highlight + Glass Mouse Follow
   ========================================================================== */

(function () {
  'use strict';

  // Only enable on non-touch devices
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) return;

  var TILT_MAX = 8;
  var PERSPECTIVE = 1000;
  var SCALE_HOVER = 1.02;
  var GLINT_DURATION = 300;

  // Selectors for cards that should tilt
  var SELECTORS = [
    '.service-card',
    '.glass-card',
    '.testimonial-card',
    '.blog-card',
    '.project-item',
    '.education-card',
    '.skill-item',
    '.contact-card',
    '.browser'
  ].join(', ');

  // ------------------------------------------------------------------
  // 1. 3D Tilt on Hover
  // ------------------------------------------------------------------

  function initTilt() {
    var cards = document.querySelectorAll(SELECTORS);

    cards.forEach(function (card) {
      card.style.transformStyle = 'preserve-3d';
      card.style.willChange = 'transform';

      card.addEventListener('mouseenter', function () {
        card.style.transition = 'transform 0.1s ease-out, box-shadow 0.3s ease';
      });

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;

        var rotateX = ((y - centerY) / centerY) * -TILT_MAX;
        var rotateY = ((x - centerX) / centerX) * TILT_MAX;

        // Clamp values
        rotateX = Math.max(-TILT_MAX, Math.min(TILT_MAX, rotateX));
        rotateY = Math.max(-TILT_MAX, Math.min(TILT_MAX, rotateY));

        card.style.transform =
          'perspective(' + PERSPECTIVE + 'px) ' +
          'rotateX(' + rotateX + 'deg) ' +
          'rotateY(' + rotateY + 'deg) ' +
          'translateZ(10px) ' +
          'scale(' + SCALE_HOVER + ')';

        // Update CSS custom property for specular highlight
        var percentX = (x / rect.width) * 100;
        var percentY = (y / rect.height) * 100;
        card.style.setProperty('--mouse-x', percentX + '%');
        card.style.setProperty('--mouse-y', percentY + '%');
      });

      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s ease';
        card.style.transform =
          'perspective(' + PERSPECTIVE + 'px) ' +
          'rotateX(0deg) rotateY(0deg) translateZ(0) scale(1)';
      });
    });
  }

  // ------------------------------------------------------------------
  // 2. Specular Highlight — Light glint that follows cursor
  // ------------------------------------------------------------------

  function initSpecular() {
    var cards = document.querySelectorAll(SELECTORS);

    cards.forEach(function (card) {
      // Create specular layer if not present
      var specular = card.querySelector('.specular');
      if (!specular) {
        specular = document.createElement('div');
        specular.className = 'specular';
        specular.setAttribute('aria-hidden', 'true');
        card.appendChild(specular);
      }

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        specular.style.background =
          'radial-gradient(circle 200px at ' + x + 'px ' + y + 'px, ' +
          'rgba(201, 168, 76, 0.12) 0%, transparent 70%)';
        specular.style.opacity = '1';
      });

      card.addEventListener('mouseleave', function () {
        specular.style.opacity = '0';
      });
    });
  }

  // ------------------------------------------------------------------
  // 3. Glass Mouse Follow — cursor glow on glass cards
  // ------------------------------------------------------------------

  function initGlassGlow() {
    var cards = document.querySelectorAll('.glass-card, .service-card, .testimonial-card');

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', x + '%');
        card.style.setProperty('--mouse-y', y + '%');
      });
    });
  }

  // ------------------------------------------------------------------
  // 4. Floating Pill Animation Stagger
  // ------------------------------------------------------------------

  function initFloatingPills() {
    var pills = document.querySelectorAll('.floating-pill');
    pills.forEach(function (pill, i) {
      pill.style.animationDelay = (i * -2) + 's';
    });
  }

  // ------------------------------------------------------------------
  // 5. Scroll-based navbar glass effect
  // ------------------------------------------------------------------

  function initNavScroll() {
    var header = document.querySelector('header');
    if (!header) return;

    var scrollThreshold = 50;

    function onScroll() {
      if (window.scrollY > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ------------------------------------------------------------------
  // 6. Skill bar animation on scroll
  // ------------------------------------------------------------------

  function initSkillBars() {
    var skillFills = document.querySelectorAll('.skill-fill');
    if (skillFills.length === 0) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var fill = entry.target;
          var width = fill.getAttribute('data-w');
          if (width) {
            fill.style.width = width + '%';
          }
          observer.unobserve(fill);
        }
      });
    }, { threshold: 0.3 });

    skillFills.forEach(function (fill) {
      observer.observe(fill);
    });
  }

  // ------------------------------------------------------------------
  // Init all spatial effects
  // ------------------------------------------------------------------

  function init() {
    initTilt();
    initSpecular();
    initGlassGlow();
    initFloatingPills();
    initNavScroll();
    initSkillBars();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
