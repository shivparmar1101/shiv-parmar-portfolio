/* ==========================================================================
   Shiv Parmar — Portfolio Scripts
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. Dark Mode Toggle
// --------------------------------------------------------------------------

const themeBtn = document.getElementById("themeBtn");

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
};

// Restore saved theme on load
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  applyTheme(savedTheme);
} else {
  applyTheme(
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  );
}

themeBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

// --------------------------------------------------------------------------
// 2. Mobile Navigation
// --------------------------------------------------------------------------

const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

// Close menu when a link is clicked
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

// --------------------------------------------------------------------------
// 3. Contact Form — Google Apps Script (SMTP)
// --------------------------------------------------------------------------

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwsHozh2qkj-dmOnxiacVOpMdTzZFAoDqd3NMhyNffUJxkpv3leba-3-e9wxgiTy9Xg4A/exec";

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = contactForm.querySelector(".btn-primary");
  submitBtn.textContent = "Sending...";
  submitBtn.disabled = true;

  const formData = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    subject: document.getElementById("subject").value,
    budget: document.getElementById("budget").value,
    message: document.getElementById("message").value.trim(),
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    formStatus.textContent =
      "✅ Message sent successfully! I will get back to you within 24 hours.";
    submitBtn.textContent = "✅ Sent!";
    contactForm.reset();
  } catch (error) {
    formStatus.textContent = "❌ Something went wrong. Please try again.";
    submitBtn.textContent = "Send Message";
    submitBtn.disabled = false;
  }
});

// --------------------------------------------------------------------------
// 4. Reveal on Scroll (Intersection Observer)
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
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => {
  revealObserver.observe(el);
});

// --------------------------------------------------------------------------
// 5. Skill Bar Animation
// --------------------------------------------------------------------------

const barObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const width = entry.target.getAttribute("data-w");
        entry.target.style.width = `${width}%`;
        barObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

document.querySelectorAll(".bar i").forEach((el) => {
  barObserver.observe(el);
});

// --------------------------------------------------------------------------
// 6. Smooth Scroll for Anchor Links
// --------------------------------------------------------------------------

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const targetId = anchor.getAttribute("href");

    if (targetId.length > 1) {
      const target = document.querySelector(targetId);

      if (target) {
        e.preventDefault();
        window.scrollTo({
          top: target.offsetTop - 70,
          behavior: "smooth",
        });
      }
    }
  });
});
