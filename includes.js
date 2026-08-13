/* ==========================================================================
   Include Header & Footer Partials
   ========================================================================== */

(function () {
  var base = "";
  var path = window.location.pathname;
  if (path.indexOf("/blog/") !== -1 || path.match(/\/blog\/[^/]*\.html/)) {
    base = "../";
  }

  function inject(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html.replace(/__BASE__/g, base);
  }

  fetch(base + "header.html")
    .then(function (r) { return r.text(); })
    .then(function (html) { inject("site-header", html); });

  fetch(base + "footer.html")
    .then(function (r) { return r.text(); })
    .then(function (html) { inject("site-footer", html); });
})();
