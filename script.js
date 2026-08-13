/* ==========================================================================
   Shiv Parmar — Portfolio Scripts (Black & Glass)
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. Mobile Navigation
// --------------------------------------------------------------------------

function initMobileNav() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      navLinks.classList.toggle("open");
      document.body.style.overflow = navLinks.classList.contains("open") ? "hidden" : "";
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("open");
        navLinks.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("partials-loaded", initMobileNav);
} else {
  initMobileNav();
}

// --------------------------------------------------------------------------
// 3. Contact Form — Google Apps Script (SMTP)
// --------------------------------------------------------------------------

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz1y8bYxZMjHM03gnyuV9GPKxNTcG4AfgVT6A6wHX9LDYbT4XkKYbeupBBBSR-bHJ-HjQ/exec";

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    const formData = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      subject: document.getElementById("subject").value,
      budget: document.getElementById("budget").value,
      message: document.getElementById("message").value.trim(),
      pageUrl: window.location.href,
    };

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      formStatus.textContent =
        "Message sent successfully! I will get back to you within 24 hours.";
      submitBtn.innerHTML = "Sent &#10003;";
      contactForm.reset();
      setTimeout(() => {
        submitBtn.innerHTML = "Send Message <span class='arrow'>&rarr;</span>";
        submitBtn.disabled = false;
      }, 3000);
    } catch (error) {
      formStatus.textContent = "Something went wrong. Please try again.";
      submitBtn.innerHTML = "Send Message <span class='arrow'>&rarr;</span>";
      submitBtn.disabled = false;
    }
  });
}

// --------------------------------------------------------------------------
// 4. Active Navigation Highlight
// --------------------------------------------------------------------------

const sections = document.querySelectorAll("section[id]");
const allNavLinks = document.querySelectorAll(".nav-links a");

const updateActiveNav = () => {
  const scrollPos = window.scrollY + 120;

  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute("id");

    if (scrollPos >= top && scrollPos < top + height) {
      allNavLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${id}`) {
          link.classList.add("active");
        }
      });
    }
  });
};

window.addEventListener("scroll", updateActiveNav, { passive: true });
updateActiveNav();

// --------------------------------------------------------------------------
// 5. Reveal on Scroll (Intersection Observer)
// --------------------------------------------------------------------------

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

document.querySelectorAll(".reveal").forEach((el) => {
  revealObserver.observe(el);
});

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

const header = document.querySelector("header");

const updateHeader = () => {
  if (window.scrollY > 50) {
    header.style.background = "rgba(0, 0, 0, 0.85)";
    header.style.borderBottomColor = "rgba(255, 255, 255, 0.1)";
  } else {
    header.style.background = "rgba(0, 0, 0, 0.6)";
    header.style.borderBottomColor = "rgba(255, 255, 255, 0.08)";
  }
};

if (header) {
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}

// --------------------------------------------------------------------------
// 10. Animated Counter
// --------------------------------------------------------------------------

const counterBlocks = document.querySelectorAll("[data-counter]");

if (counterBlocks.length) {
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute("data-target"), 10);
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
