/* ==========================================================================
   Shiv Parmar — Portfolio Scripts (Black & Glass)
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. Mobile Navigation
// --------------------------------------------------------------------------

function initMobileNav() {
  const hamburger = document.getElementById("hamburger");
  const mobileNav = document.getElementById("mobileNav");

  if (hamburger && mobileNav) {
    const closeMenu = () => {
      hamburger.classList.remove("open");
      mobileNav.classList.remove("open");
      document.body.style.overflow = "";
    };

    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      mobileNav.classList.toggle("open");
      document.body.style.overflow = mobileNav.classList.contains("open") ? "hidden" : "";
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close when clicking outside the overlay content
    mobileNav.addEventListener("click", (e) => {
      if (e.target === mobileNav) closeMenu();
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileNav.classList.contains("open")) closeMenu();
    });

    // Close when the viewport grows past the mobile breakpoint (e.g. rotate/resize)
    const desktopQuery = window.matchMedia("(min-width: 769px)");
    const onViewportChange = () => {
      if (desktopQuery.matches && mobileNav.classList.contains("open")) closeMenu();
    };
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", onViewportChange);
    } else if (desktopQuery.addListener) {
      desktopQuery.addListener(onViewportChange);
    }
  }
}

// Always listen for async partials load
document.addEventListener("partials-loaded", initMobileNav);
document.addEventListener("partials-loaded", initBackToTop);
// Also try immediately in case header is already in DOM
initMobileNav();
// Back to Top button
initBackToTop();

// --------------------------------------------------------------------------
// 3. Contact Form — Google Apps Script (SMTP)
// --------------------------------------------------------------------------

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyiVfJb1fVyOR4jrjHlA2mJkwmq8_6mhxe8OMMgp7GDNhNUrMr7GFTXl7lOjh8XigQF/exec";

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const honeypot = document.getElementById("website");
    if (honeypot && honeypot.value.trim() !== "") return;

    // Validate required fields
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !subject || !message) {
      formStatus.textContent = "Please fill in all required fields.";
      formStatus.style.color = "#ef4444";
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      formStatus.textContent = "Please enter a valid email address.";
      formStatus.style.color = "#ef4444";
      return;
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    const formData = {
      name: name,
      email: email,
      subject: subject,
      phone: document.getElementById("phone").value.trim(),
      budget: document.getElementById("budget").value,
      message: message,
      pageUrl: window.location.href,
    };
    const jsonBody = JSON.stringify(formData);

    const restoreButton = () => {
      submitBtn.innerHTML = "Send Message <span class='arrow'>&rarr;</span>";
      submitBtn.disabled = false;
    };

    // 1) Readable CORS attempt (text/plain avoids the preflight Apps Script
    //    rejects) — an OK response here means the server really received it.
    // 2) On failure, fall back to the fire-and-forget no-cors send; its
    //    response is opaque, so delivery is reported as "sent, unconfirmed".
    const sendNoCorsFallback = () =>
      fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: jsonBody,
      })
        .then(() => {
          formStatus.textContent =
            "Message sent (delivery unconfirmed). If you don't hear back within 24h, please WhatsApp or email directly.";
          formStatus.style.color = "";
          restoreButton();
        })
        .catch(() => {
          formStatus.textContent =
            "Could not send — network error. Please email directly at hello@shivparmar.dev.";
          formStatus.style.color = "#ef4444";
          restoreButton();
        });

    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: jsonBody,
    })
      .then((response) => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        formStatus.textContent =
          "Message sent successfully! I will get back to you within 24 hours.";
        formStatus.style.color = "";
        submitBtn.innerHTML = "Sent &#10003;";
        contactForm.reset();
        setTimeout(() => {
          submitBtn.innerHTML = "Send Message <span class='arrow'>&rarr;</span>";
          submitBtn.disabled = false;
        }, 3000);
      })
      .catch(() => sendNoCorsFallback());
  });
}

// --------------------------------------------------------------------------
// 4. Active Navigation Highlight
// --------------------------------------------------------------------------
// 4. Active Nav Link on Scroll (index.html only)
// --------------------------------------------------------------------------
const updateActiveNav = () => {
  // Only run on index page (standalone pages use includes.js setActiveLink)
  var path = window.location.pathname;
  var isIndex = path === '/' || path === '' || path.endsWith('/index.html') || path.endsWith('/index');
  if (!isIndex) return;

  const sections = document.querySelectorAll("section[id]");
  if (sections.length === 0) return;

  const scrollPos = window.scrollY + 100;
  const allNavLinks = document.querySelectorAll(".nav-links a");

  let activeId = null;
  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    if (scrollPos >= top && scrollPos < top + height) {
      activeId = section.getAttribute("id");
    }
  });

  allNavLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    // Header links are path-based ("about"), hash links are "#about"
    const isActive =
      activeId !== null && (href === `#${activeId}` || href === activeId || href.endsWith("/" + activeId));
    link.classList.toggle("active", isActive);
  });
};

window.addEventListener("scroll", updateActiveNav, { passive: true });
updateActiveNav();

// --------------------------------------------------------------------------
// 5. Reveal on Scroll (Intersection Observer)
// --------------------------------------------------------------------------

const revealElements = document.querySelectorAll(".reveal");

if (typeof IntersectionObserver !== "undefined") {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  revealElements.forEach((el) => {
    revealObserver.observe(el);
  });
} else {
  // No IntersectionObserver support — show everything rather than hide content
  revealElements.forEach((el) => el.classList.add("in"));
}

// --------------------------------------------------------------------------
// 6. Skill Bar Animation
// --------------------------------------------------------------------------

const skillObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const width = entry.target.getAttribute("data-w");
        entry.target.style.width = `${width}%`;
        skillObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

document.querySelectorAll(".skill-fill").forEach((el) => {
  skillObserver.observe(el);
});

// --------------------------------------------------------------------------
// 7. Timeline Scroll Progress Line
// --------------------------------------------------------------------------

const timeline = document.querySelector(".timeline");
const timelineProgress = document.querySelector(".timeline-progress");
const timelineItems = document.querySelectorAll(".timeline-item");

if (timeline && timelineProgress) {
  const timelineViewport = document.querySelector("#experience") || timeline;

  const updateTimeline = () => {
    const rect = timelineViewport.getBoundingClientRect();
    const vh = window.innerHeight;

    if (rect.bottom < 0 || rect.top > vh) {
      timelineProgress.style.height = "0%";
      timelineItems.forEach((item) => item.classList.remove("active"));
      return;
    }

    const total = rect.height;
    const scrolled = vh * 0.5 - rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / total));
    timelineProgress.style.height = `${progress * 100}%`;

    timelineItems.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      item.classList.toggle("active", itemRect.top < vh * 0.5);
    });
  };

  let tlTicking = false;
  const onTimelineScroll = () => {
    if (!tlTicking) {
      requestAnimationFrame(() => {
        updateTimeline();
        tlTicking = false;
      });
      tlTicking = true;
    }
  };

  window.addEventListener("scroll", onTimelineScroll, { passive: true });
  window.addEventListener("resize", onTimelineScroll);
  updateTimeline();
}

// --------------------------------------------------------------------------
// 8. Smooth Scroll for Anchor Links
// --------------------------------------------------------------------------

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const targetId = anchor.getAttribute("href");

    if (targetId.length > 1) {
      const target = document.querySelector(targetId);

      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  });
});

// --------------------------------------------------------------------------
// 9. Header Background on Scroll
// --------------------------------------------------------------------------

const updateHeader = () => {
  const header = document.querySelector("header");
  if (!header) return;
  // Use the theme's .scrolled class (liquid-glass.css) so the header matches
  // the navy palette instead of a hardcoded black inline style.
  header.classList.toggle("scrolled", window.scrollY > 50);
};

window.addEventListener("scroll", updateHeader, { passive: true });
// Header is injected async by includes.js — hook after partials load too
document.addEventListener("partials-loaded", updateHeader);
updateHeader();

// --------------------------------------------------------------------------
// 10. Animated Counter
// --------------------------------------------------------------------------

const counterBlocks = document.querySelectorAll("[data-counter]");

if (counterBlocks.length) {
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute("data-target"), 10);
    const fallback = el.querySelector(".counter-fallback");
    if (fallback) fallback.style.display = "none";
    const duration = 1800;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + "+";
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll("strong[data-target]").forEach(animateCounter);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counterBlocks.forEach((block) => counterObserver.observe(block));
}

// --------------------------------------------------------------------------
// Back to Top Button
// --------------------------------------------------------------------------

function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn || btn.dataset.bttReady) return;
  btn.dataset.bttReady = '1';
  const update = () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', update, { passive: true });
  update(); // initial state (handles scroll restoration on refresh)
  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
