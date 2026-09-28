/* Progressive enhancements. The page is fully usable without this file:
   the nav is plain anchors and the backdrop keeps its first frame. */
(function () {
  'use strict';

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Resolved once, off window rather than the bare global, and type-checked.
     `'IntersectionObserver' in window` is true even when the property has been
     set to undefined, and calling the global then throws -- which would abort
     this whole script and take the menu and the video player down with it. */
  var IO = (typeof window.IntersectionObserver === 'function')
    ? window.IntersectionObserver : null;

  /* ---- page navigation ------------------------------------------------ *
   * The arrows themselves are real links in the markup, so they work without
   * this. All this adds is the keyboard: left and right move between pages,
   * the way a gallery does. Ignored while the caret is in a field, or with a
   * modifier held, so it never steals a browser shortcut.                  */
  var prevLink = document.querySelector('.pagenav.prev');
  var nextLink = document.querySelector('.pagenav.next');

  if (prevLink || nextLink) {
    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var t = e.target || {};
      var tag = (t.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable) return;
      if (e.key === 'ArrowRight' && nextLink) window.location.href = nextLink.href;
      if (e.key === 'ArrowLeft' && prevLink) window.location.href = prevLink.href;
    });
  }

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

    /* Nor once the hero is covered. The hero is sticky, so it never leaves the
       viewport and cannot report its own visibility -- the sentinel at the top
       of the next section does it instead: once that has scrolled above the
       fold, the hero is behind it and there is nothing to animate. */
    if (IO) {
      var sentinel = document.querySelector('.hero-sentinel') || stage;
      new IO(function (entries) {
        var r = entries[0];
        var below = (r.boundingClientRect || {}).top > 0;   // not yet scrolled past
        (r.isIntersecting || below) ? play() : pause();
      }, { threshold: 0 }).observe(sentinel);
    }

    if (!reduced) {
      if (document.readyState === 'complete') loadNext(0);
      else window.addEventListener('load', function () { loadNext(0); });
      play();
    }
  }

  /* ---- arrive on scroll ----------------------------------------------- *
   * The hidden state is ADDED here rather than living in the stylesheet: if
   * .reveal-up were hidden by default, a visitor with JS off or a failed script
   * would lose the content entirely. Armed only when we know we can unarm it. */
  var risers = Array.prototype.slice.call(document.querySelectorAll('.reveal-up'));

  if (risers.length && !reduced && IO) {
    risers.forEach(function (el) { el.classList.add('armed'); });
    var riseIO = new IO(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        riseIO.unobserve(en.target);      // one way only: no fading back out
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    risers.forEach(function (el) { riseIO.observe(el); });

    // If anything stops the observer from firing, show them anyway.
    setTimeout(function () {
      risers.forEach(function (el) { el.classList.add('in'); });
    }, 3000);
  }

  /* ---- reveal the reel from black ------------------------------------- *
   * The cover is BUILT HERE rather than sitting in the markup: with no JS a
   * hard-coded black layer would never fade and the reel would be invisible.
   * Created in script, the worst case is no reveal at all.
   *
   * It also cannot trap the video. It is pointer-events:none, so the play
   * button is live underneath it from the first frame, and a fallback timer
   * clears it even if the observer never fires.                             */
  var embed = document.querySelector('.embed');

  if (embed && !reduced) {
    var cover = document.createElement('div');
    cover.className = 'reveal';
    cover.setAttribute('aria-hidden', 'true');
    embed.appendChild(cover);

    var lifted = false;
    var lift = function () {
      if (lifted) return;
      lifted = true;
      // Two frames: the opaque state has to be committed before the class
      // change animates, or the browser collapses both into no transition.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { embed.classList.add('revealed'); });
      });
      setTimeout(function () {
        if (cover.parentNode) cover.parentNode.removeChild(cover);
      }, 1600);
    };

    if (IO) {
      var revealIO = new IO(function (entries) {
        if (entries[0].isIntersecting) {
          revealIO.disconnect();
          lift();
        }
      }, { threshold: 0.25 });
      revealIO.observe(embed);
    }
    // Belt and braces: never leave the reel behind a black square.
    setTimeout(lift, 2500);
  }

  /* ---- explainer video ------------------------------------------------ *
   * The markup ships a still. If .player carries a data-video, this draws a
   * play button over it and swaps in a <video> on the first click — the file
   * is never fetched for visitors who do not ask for it, and the still doubles
   * as the poster so there is no black flash on load. With no data-video the
   * still is left exactly as it is: no play button, nothing promised.       */
  var player = document.querySelector('.player');
  var videoSrc = player && (player.dataset.video || '').trim();
  var vimeoSrc = player && (player.dataset.vimeo || '').trim();

  /* Accepts "<id>?h=<hash>", a bare id, or a whole player URL, and adds the
     parameters we always want: start playing (this only ever runs from a real
     click, so autoplay is allowed) and no Vimeo chrome over the frame. */
  var vimeoUrl = function (v) {
    var base = /^https?:/i.test(v) ? v : 'https://player.vimeo.com/video/' + v;
    return base + (base.indexOf('?') > -1 ? '&' : '?') +
      'autoplay=1&title=0&byline=0&portrait=0';
  };

  if (player && (videoSrc || vimeoSrc)) {
    var frame = player.querySelector('.frame');
    var link = frame && frame.querySelector('a');
    var poster = player.querySelector('img');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'play';
    btn.setAttribute('aria-label', 'Play the explainer video');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">' +
      '<path d="M8 5v14l11-7z"/></svg><span>Watch the explainer</span>';

    var buildVimeo = function () {
      // The .embed box carries the 16:9 shape and the absolutely-filled iframe,
      // reusing exactly what the reel on the front page uses.
      var box = document.createElement('div');
      box.className = 'embed';
      var f = document.createElement('iframe');
      f.title = 'Explainer video';
      f.src = vimeoUrl(vimeoSrc);
      f.setAttribute('frameborder', '0');
      f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      f.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; ' +
        'clipboard-write; encrypted-media; web-share');
      f.setAttribute('allowfullscreen', '');
      box.appendChild(f);
      return box;
    };

    var buildFile = function () {
      var v = document.createElement('video');
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.preload = 'auto';
      if (poster) v.poster = poster.currentSrc || poster.src;
      v.setAttribute('aria-label', 'Explainer video');
      var s = document.createElement('source');
      s.src = videoSrc;
      s.type = videoSrc.indexOf('.webm') > -1 ? 'video/webm' : 'video/mp4';
      v.appendChild(s);
      return v;
    };

    var load = function (e) {
      if (e) e.preventDefault();
      if (player.classList.contains('live')) return;
      // Match the frame to the video's real shape before swapping it in, so the
      // player never has to letterbox itself (Vimeo's bars are white).
      var ar = parseFloat(player.dataset.vimeoAr);
      if (ar > 0) player.style.setProperty('--media-ar', ar);

      var node = vimeoSrc ? buildVimeo() : buildFile();
      // Replace the still and its click-to-enlarge link: with real controls on
      // screen, an anchor underneath them would hijack every click.
      frame.innerHTML = '';
      frame.appendChild(node);
      player.classList.add('live');
      if (node.play) {
        var p = node.play();
        if (p && p.catch) p.catch(function () { /* blocked: controls are there */ });
      }
    };

    btn.addEventListener('click', load);
    if (link) link.addEventListener('click', load);   // the poster is a button too
    frame.appendChild(btn);        // inside the frame, so it centres on the image
  }

  /* ---- mark the section currently in view ----------------------------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('#nav a[href^="#"]'));
  if (!links.length || !IO) return;

  var byId = {}, targets = [];
  links.forEach(function (a) {
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) { byId[el.id] = a; targets.push(el); }
  });

  var current = null;
  var io = new IO(function (entries) {
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
