/* ==========================================================================
   Blog Hero Image Auto-Generator
   Automatically generates relevant images from Unsplash based on blog title
   ========================================================================== */

(function () {
  'use strict';

  const UNSPLASH_KEYWORDS = {
    'woocommerce': 'woocommerce,ecommerce,online-store',
    'wordpress': 'wordpress,web-development,cms',
    'plugin': 'wordpress-plugin,code,development',
    'theme': 'wordpress-theme,web-design,layout',
    'seo': 'seo,search-engine,analytics',
    'performance': 'speed,optimization,performance',
    'security': 'security,shield,protection',
    'migration': 'server,cloud,migration',
    'api': 'api,programming,code',
    'gutenberg': 'gutenberg,blocks,wordpress-editor',
    'elementor': 'elementor,page-builder,web-design',
    'payment': 'payment,gateway,checkout',
    'shipping': 'shipping,delivery,logistics',
    'tax': 'tax,calculator,finance',
    'product': 'product,inventory,store',
    'checkout': 'checkout,shopping-cart,ecommerce',
    'database': 'database,server,data',
    'rest-api': 'api,rest,programming',
    'custom-post-type': 'wordpress,database,cms',
    'acf': 'acf,wordpress,custom-fields',
    'staging': 'staging,server,development',
    'membership': 'membership,subscription,community',
    'booking': 'booking,calendar,schedule',
    'multisite': 'network,server,multiple-sites',
    'user-role': 'user,management,permissions',
    'css': 'css,code,styling',
    'javascript': 'javascript,code,programming',
    'php': 'php,code,programming',
    'speed': 'speed,fast,performance',
    'optimization': 'optimization,improve,enhance',
    'best-practices': 'checklist,best,quality',
    'guide': 'guide,tutorial,learning',
    'tutorial': 'tutorial,learning,education',
    'setup': 'setup,configuration,install',
    'comparison': 'compare,versus,options'
  };

  function extractKeywords(title) {
    const lower = title.toLowerCase();
    const keywords = [];

    for (const [key, values] of Object.entries(UNSPLASH_KEYWORDS)) {
      if (lower.includes(key)) {
        keywords.push(values);
      }
    }

    if (keywords.length === 0) {
      keywords.push('wordpress,web-development,technology');
    }

    return keywords.slice(0, 3).join(',');
  }

  function generateImageUrl(title, width = 1200, height = 630) {
    const keywords = extractKeywords(title);
    return `https://source.unsplash.com/${width}x${height}/?${keywords}&sig=${Date.now()}`;
  }

  function updateHeroImage() {
    const heroImg = document.querySelector('.hero-img');
    if (!heroImg) return;

    const h1 = document.querySelector('h1');
    if (!h1) return;

    const title = h1.textContent.trim();
    const newSrc = generateImageUrl(title);

    heroImg.style.opacity = '0.3';
    heroImg.style.transition = 'opacity 0.5s ease';

    const img = new Image();
    img.onload = function () {
      heroImg.src = newSrc;
      heroImg.style.opacity = '1';
    };
    img.onerror = function () {
      heroImg.style.opacity = '1';
    };
    img.src = newSrc;

    heroImg.alt = `${title} - WordPress development guide by Shiv Parmar`;
    heroImg.title = `${title} - Complete guide by Shiv Parmar`;
  }

  function updateOGImage() {
    const h1 = document.querySelector('h1');
    if (!h1) return;

    const title = h1.textContent.trim();
    const ogImage = document.querySelector('meta[property="og:image"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');

    if (ogImage) {
      ogImage.content = generateImageUrl(title);
    }
    if (twitterImage) {
      twitterImage.content = generateImageUrl(title);
    }
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        updateHeroImage();
        updateOGImage();
      });
    } else {
      updateHeroImage();
      updateOGImage();
    }
  }

  init();
})();
