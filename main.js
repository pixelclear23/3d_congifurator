/* Small progressive enhancements. The page is fully usable without this file. */
(function () {
  'use strict';

  /* ---- mobile menu ---------------------------------------------------- */
  var toggle = document.querySelector('.navtoggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Tapping a link closes the menu again, so the target is not hidden behind it.
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- mark the section currently in view ----------------------------- */
  var links = Array.prototype.slice.call(
    document.querySelectorAll('#nav a[href^="#"]')
  );
  if (!links.length || !('IntersectionObserver' in window)) return;

  var byId = {};
  var targets = [];
  links.forEach(function (a) {
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) {
      byId[el.id] = a;
      targets.push(el);
    }
  });

  var current = null;
  function setCurrent(a) {
    if (current === a) return;
    if (current) current.removeAttribute('aria-current');
    if (a) a.setAttribute('aria-current', 'true');
    current = a;
  }

  // -45% at the bottom biases towards the section occupying the upper half of
  // the viewport, which is the one being read.
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) setCurrent(byId[en.target.id]);
    });
  }, { rootMargin: '-72px 0px -45% 0px', threshold: 0 });

  targets.forEach(function (t) { io.observe(t); });
})();
