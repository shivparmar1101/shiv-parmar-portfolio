/* ==========================================================================
   Include Header & Footer Partials + Blog Image Auto-Generation
   ========================================================================== */

(function () {
  var base = "";
  var path = window.location.pathname;
  var isBlog = path.indexOf("/blog/") !== -1 || path.match(/\/blog\/[^/]*\.html/);
  if (isBlog) {
    base = "../";
  }

  function inject(id, html) {
    var el = document.getElementById(id);
    if (!el) return;
    var processed = html.replace(/__BASE__/g, base).trim();
    if (!isBlog) {
      processed = processed.replace(/index\.html#/g, "#");
    }
    el.innerHTML = processed;
  }

  // Blog Image Auto-Generation
  function generateBlogImage() {
    if (!isBlog) return;
    
    var heroImg = document.querySelector('.hero-img');
    if (!heroImg) return;
    
    var currentSrc = heroImg.getAttribute('src');
    if (currentSrc && currentSrc.endsWith('.svg')) return;
    
    var h1 = document.querySelector('h1');
    if (!h1) return;
    
    var title = h1.textContent.trim();
    var slug = window.location.pathname.split('/').pop().replace('.html', '');
    
    var svg = generateSVG(title, slug);
    var blob = new Blob([svg], {type: 'image/svg+xml'});
    var url = URL.createObjectURL(blob);
    
    heroImg.src = url;
    heroImg.onerror = function() {
      heroImg.src = '../images/blog/' + slug + '-hero.svg';
    };
  }

  function generateSVG(title, slug) {
    var words = title.split(' ');
    var line1 = words[0] || 'Blog';
    var line2 = words.slice(1).join(' ') || 'Post';
    
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">' +
      '<defs>' +
      '<linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" style="stop-color:#c9a84c;stop-opacity:1" />' +
      '<stop offset="50%" style="stop-color:#e8d48b;stop-opacity:1" />' +
      '<stop offset="100%" style="stop-color:#c9a84c;stop-opacity:1" />' +
      '</linearGradient>' +
      '<linearGradient id="darkGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" style="stop-color:#000000;stop-opacity:1" />' +
      '<stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />' +
      '</linearGradient>' +
      '<filter id="glow">' +
      '<feGaussianBlur stdDeviation="3" result="coloredBlur"/>' +
      '<feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>' +
      '</defs>' +
      '<rect width="1200" height="630" fill="url(#darkGrad)"/>' +
      '<circle cx="100" cy="500" r="200" fill="rgba(201,168,76,0.05)"/>' +
      '<circle cx="1100" cy="150" r="150" fill="rgba(201,168,76,0.03)"/>' +
      '<g stroke="rgba(201,168,76,0.08)" stroke-width="1" fill="none">' +
      '<line x1="0" y1="100" x2="1200" y2="100"/>' +
      '<line x1="0" y1="200" x2="1200" y2="200"/>' +
      '<line x1="0" y1="300" x2="1200" y2="300"/>' +
      '<line x1="0" y1="400" x2="1200" y2="400"/>' +
      '<line x1="0" y1="500" x2="1200" y2="500"/>' +
      '<line x1="200" y1="0" x2="200" y2="630"/>' +
      '<line x1="400" y1="0" x2="400" y2="630"/>' +
      '<line x1="600" y1="0" x2="600" y2="630"/>' +
      '<line x1="800" y1="0" x2="800" y2="630"/>' +
      '<line x1="1000" y1="0" x2="1000" y2="630"/>' +
      '</g>' +
      '<g transform="translate(900, 200)">' +
      '<circle cx="50" cy="50" r="60" fill="none" stroke="url(#goldGrad)" stroke-width="3"/>' +
      '<path d="M30 50 L50 30 L70 50 L50 70 Z" fill="url(#goldGrad)" filter="url(#glow)"/>' +
      '<circle cx="50" cy="50" r="8" fill="#000"/>' +
      '</g>' +
      '<text x="80" y="180" font-family="Inter, -apple-system, sans-serif" font-size="48" font-weight="800" fill="#f0f0f0">' + line1 + '</text>' +
      '<text x="80" y="240" font-family="Inter, -apple-system, sans-serif" font-size="48" font-weight="800" fill="url(#goldGrad)">' + line2 + '</text>' +
      '<text x="80" y="300" font-family="Inter, -apple-system, sans-serif" font-size="36" font-weight="600" fill="#a0a0a0">Complete Guide</text>' +
      '<rect x="80" y="330" width="120" height="4" rx="2" fill="url(#goldGrad)"/>' +
      '<text x="80" y="380" font-family="Inter, -apple-system, sans-serif" font-size="18" fill="#666666">WordPress Developer Guide</text>' +
      '<text x="80" y="440" font-family="JetBrains Mono, monospace" font-size="14" fill="url(#goldGrad)">Shiv Parmar</text>' +
      '<text x="80" y="460" font-family="Inter, -apple-system, sans-serif" font-size="12" fill="#666666">WordPress Developer · Rajkot, India</text>' +
      '<rect x="80" y="500" width="140" height="32" rx="16" fill="rgba(201,168,76,0.15)" stroke="url(#goldGrad)" stroke-width="1"/>' +
      '<text x="150" y="520" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="600" fill="url(#goldGrad)" text-anchor="middle">WordPress</text>' +
      '</svg>';
  }

  Promise.all([
    fetch(base + "header.html").then(function (r) { return r.text(); }),
    fetch(base + "footer.html").then(function (r) { return r.text(); })
  ]).then(function (results) {
    inject("site-header", results[0]);
    inject("site-footer", results[1]);
    document.dispatchEvent(new Event("partials-loaded"));
    generateBlogImage();
  });
})();
