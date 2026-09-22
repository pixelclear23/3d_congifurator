/* Progressive enhancements. The page is fully usable without this file:
   the nav is plain anchors and the backdrop keeps its first frame. */
(function () {
  'use strict';

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- mobile menu ---------------------------------------------------- */
  var toggle = document.querySelector('.navtoggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- hero backdrop -------------------------------------------------- *
   * Frame 1 is in the HTML so the hero is never empty. The rest are built
   * here, after load, because a backdrop must not compete with the content
   * for bandwidth. They are fetched one at a time and only added to the
   * rotation once decoded, so a slow connection degrades to fewer frames
   * rather than to a blank flash mid-fade.                                */
  var stage = document.querySelector('.stage');
  var dots = document.querySelector('.dots');

  if (stage) {
    var names = (stage.dataset.slides || '').split(/\s+/).filter(Boolean);
    var slides = [stage.querySelector('.slide')].filter(Boolean);
    var HOLD = 6500;      // ms a frame stays before the next fade
    var index = 0;
    var timer = null;
    var visible = true;

    function buildSlide(name) {
      var pic = document.createElement('picture');
      pic.className = 'slide';
      var src = document.createElement('source');
      src.type = 'image/webp';
      src.srcset = 'assets/' + name + '.webp';
      var img = document.createElement('img');
      img.width = 2000;
      img.height = 1125;
      img.alt = '';
      img.decoding = 'async';
      pic.appendChild(src);
      pic.appendChild(img);
      return { pic: pic, img: img };
    }

    // Sequential fetch: each frame waits for the previous one to finish.
    function loadNext(i) {
      if (i >= names.length) return;
      var made = buildSlide(names[i]);
      made.img.addEventListener('load', function () {
        stage.appendChild(made.pic);
        slides.push(made.pic);
        addDot(slides.length - 1);
        // Arm the rotation here, not once at startup: at startup there is a
        // single frame and play() correctly declines to cross-fade one image
        // with itself. Without this the backdrop stayed static.
        play();
        loadNext(i + 1);
      });
      made.img.addEventListener('error', function () { loadNext(i + 1); });
      made.img.src = 'assets/' + names[i] + '.jpg';   // <source> wins where webp is supported
    }

    function show(i) {
      if (i === index || !slides[i]) return;
      slides[index].classList.remove('on');
      index = i;
      slides[index].classList.add('on');
      syncDots();
    }

    function step() { show((index + 1) % slides.length); }

    function play() {
      if (timer || reduced || !visible || slides.length < 2) return;
      timer = setInterval(step, HOLD);
    }
    function pause() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    /* --- dots: also the only hint that the backdrop is a set --- */
    function addDot(i) {
      if (!dots || reduced) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show backdrop frame ' + (i + 1));
      b.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      b.addEventListener('click', function () {
        show(i);
        pause();
        play();          // restart the clock so a manual pick gets a full hold
      });
      dots.appendChild(b);
    }
    function syncDots() {
      if (!dots) return;
      Array.prototype.forEach.call(dots.children, function (b, i) {
        b.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });
    }

    addDot(0);

    // Don't animate or fetch while the tab is in the background.
    document.addEventListener('visibilitychange', function () {
      visible = !document.hidden;
      visible ? play() : pause();
    });

    // Nor while the hero is scrolled away.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? play() : pause();
      }, { threshold: 0.05 }).observe(stage);
    }

    if (!reduced) {
      if (document.readyState === 'complete') loadNext(0);
      else window.addEventListener('load', function () { loadNext(0); });
      play();
    }
  }

  /* ---- mark the section currently in view ----------------------------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('#nav a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;

  var byId = {}, targets = [];
  links.forEach(function (a) {
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) { byId[el.id] = a; targets.push(el); }
  });

  var current = null;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var a = byId[en.target.id];
      if (current === a) return;
      if (current) current.removeAttribute('aria-current');
      if (a) a.setAttribute('aria-current', 'true');
      current = a;
    });
  }, { rootMargin: '-72px 0px -45% 0px', threshold: 0 });

  targets.forEach(function (t) { io.observe(t); });
})();
