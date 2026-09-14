/* ============================================================
   Ji-Yun Kim — site behaviour
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Hero — procedural radial phylogram
     A decorative motif, not data: a seeded random binary tree
     rendered as a circular cladogram.
     --------------------------------------------------------- */
  function seeded(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function drawPhylogram(svg) {
    var rnd = seeded(20260912);
    var LEAVES = 400, MAX_DEPTH = 14;
    var R0 = 8, TARGET_R = 52, GAP = 0.06;

    /* 1. topology: split a leaf budget recursively */
    function build(n, depth) {
      if (n <= 1 || depth >= MAX_DEPTH) return { leaf: true, depth: depth };
      var k = (n >= 9 && rnd() < 0.12) ? 3 : 2;
      var parts = [], rem = n, i, take;
      for (i = 0; i < k - 1; i++) {
        take = 1 + Math.floor(rnd() * (rem - (k - 1 - i)));
        parts.push(take); rem -= take;
      }
      parts.push(rem);
      var kids = [];
      for (i = 0; i < k; i++) kids.push(build(parts[i], depth + 1));
      return { leaf: false, kids: kids, depth: depth };
    }
    var root = build(LEAVES, 0);

    /* 2. branch lengths, normalised to a fixed outer radius */
    var maxR = 0;
    (function setR(node, r) {
      node.r = r;
      if (r > maxR) maxR = r;
      if (node.leaf) return;
      var taper = 1 - node.depth / (MAX_DEPTH + 6);
      for (var i = 0; i < node.kids.length; i++) {
        setR(node.kids[i], r + (0.3 + rnd() * 1.3) * taper);
      }
    })(root, 0);
    var k = (TARGET_R - R0) / maxR;

    /* 3. angles: one slot per tip, so the outer ring stays even */
    var total = 0;
    (function count(n) { if (n.leaf) { total++; return; } n.kids.forEach(count); })(root);
    var span = Math.PI * 2 - GAP, a0 = -Math.PI / 2 + GAP / 2, idx = 0;
    (function setA(node) {
      if (node.leaf) { node.a = a0 + (idx + 0.5) * (span / total); idx++; return; }
      node.kids.forEach(setA);
      node.a = (node.kids[0].a + node.kids[node.kids.length - 1].a) / 2;
    })(root);

    /* 4. collect geometry */
    var arcs = [], spokes = [], tips = [];
    function rad(node) { return R0 + node.r * k; }
    spokes.push({ a: root.a, r0: 1.6, r1: rad(root), depth: 0 });
    (function walk(node) {
      if (node.leaf) { tips.push(node); return; }
      var R = rad(node), kids = node.kids;
      arcs.push({ r: R, a0: kids[0].a, a1: kids[kids.length - 1].a, depth: node.depth });
      for (var i = 0; i < kids.length; i++) {
        spokes.push({ a: kids[i].a, r0: R, r1: rad(kids[i]), depth: node.depth });
        walk(kids[i]);
      }
    })(root);

    /* 5. render */
    var NS = 'http://www.w3.org/2000/svg';
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'rot');
    g.setAttribute('transform', 'translate(14 2)');

    function px(r, a) { return (r * Math.cos(a)).toFixed(2) + ' ' + (r * Math.sin(a)).toFixed(2); }
    function delay(depth) { return (0.22 + depth * 0.085 + rnd() * 0.1).toFixed(2) + 's'; }

    var frag = document.createDocumentFragment();

    spokes.forEach(function (s) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('class', 'br');
      p.setAttribute('pathLength', '1');
      p.setAttribute('d', 'M' + px(s.r0, s.a) + 'L' + px(s.r1, s.a));
      p.style.setProperty('--dl', delay(s.depth));
      frag.appendChild(p);
    });

    arcs.forEach(function (c) {
      var large = (c.a1 - c.a0) > Math.PI ? 1 : 0;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('class', 'br');
      p.setAttribute('pathLength', '1');
      p.setAttribute('d', 'M' + px(c.r, c.a0) + 'A' + c.r.toFixed(2) + ' ' + c.r.toFixed(2) + ' 0 ' + large + ' 1 ' + px(c.r, c.a1));
      p.style.setProperty('--dl', delay(c.depth));
      frag.appendChild(p);
    });

    var hues = ['#c78b79', '#8fae9c', '#d5b169', '#7f9cb6', '#b08fae'];
    tips.forEach(function (t) {
      var dot = document.createElementNS(NS, 'circle');
      var accent = rnd() < 0.13;
      var r = rad(t);
      dot.setAttribute('class', 'tip');
      dot.setAttribute('cx', (r * Math.cos(t.a)).toFixed(2));
      dot.setAttribute('cy', (r * Math.sin(t.a)).toFixed(2));
      dot.setAttribute('r', accent ? 0.42 : 0.26);
      if (accent) dot.setAttribute('fill', hues[(rnd() * hues.length) | 0]);
      dot.style.setProperty('--dl', delay(t.depth));
      frag.appendChild(dot);
    });

    g.appendChild(frag);
    svg.appendChild(g);
  }

  var svg = document.getElementById('phylo');
  if (svg) drawPhylogram(svg);

  /* ---------------------------------------------------------
     2. Hero title — word-by-word reveal
     --------------------------------------------------------- */
  var hero = document.querySelector('.hero');
  if (hero) {
    var words = hero.querySelectorAll('.hero__text .w');
    for (var i = 0; i < words.length; i++) {
      words[i].style.transitionDelay = (0.28 + i * 0.045).toFixed(3) + 's';
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add('is-in'); });
    });
  }

  /* ---------------------------------------------------------
     3. Scroll reveal
     --------------------------------------------------------- */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });

    Array.prototype.forEach.call(revealables, function (el) {
      el.style.setProperty('--d', el.dataset.delay || 0);
      io.observe(el);
    });
  } else {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------------
     4. Nav state + hero parallax
     --------------------------------------------------------- */
  var nav = document.getElementById('nav');
  var canvas = document.querySelector('.hero__canvas');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 0;
    var onDark = y < heroBottom - 72;

    nav.classList.toggle('on-dark', onDark);
    nav.classList.toggle('is-stuck', !onDark && y > 40);

    if (canvas && !reduced && y < heroBottom) {
      canvas.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0) scale(1.04)';
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     5. Mobile menu
     --------------------------------------------------------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  var label = toggle && toggle.querySelector('.nav__toggle-label');

  function setMenu(open) {
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
      document.body.style.overflow = 'hidden';
      label.textContent = 'Close';
    } else {
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
      label.textContent = 'Menu';
      setTimeout(function () { menu.hidden = true; }, 400);
    }
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setMenu(false);
    });
  }

  /* ---------------------------------------------------------
     6. Poster lightbox
     --------------------------------------------------------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbPdf = document.getElementById('lbPdf');
  var lbClose = document.getElementById('lbClose');
  var lastFocus = null;

  function openLb(btn) {
    lastFocus = btn;
    lbImg.src = btn.dataset.img;
    lbImg.alt = btn.dataset.caption;
    lbCap.textContent = btn.dataset.caption;
    lbPdf.href = btn.getAttribute('href');
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLb() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; lbImg.src = ''; }, 350);
    if (lastFocus) lastFocus.focus();
  }

  /* the rows are plain links to the PDF; with scripting we upgrade them */
  Array.prototype.forEach.call(document.querySelectorAll('.pubs__link'), function (btn) {
    btn.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      openLb(btn);
    });
  });

  if (lb) {
    lbClose.addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb__fig')) closeLb();
    });
  }

  /* Escape closes whichever overlay this page has */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (lb && !lb.hidden) closeLb();
    else if (menu && !menu.hidden) setMenu(false);
  });

  /* ---------------------------------------------------------
     7. Portrait: collapse the row back to two columns if absent
     --------------------------------------------------------- */
  var portrait = document.getElementById('portraitImg');
  if (portrait) {
    portrait.addEventListener('error', function () {
      document.body.classList.add('no-portrait');
    });
    if (portrait.complete && portrait.naturalWidth === 0) {
      document.body.classList.add('no-portrait');
    }
  }

  /* ---------------------------------------------------------
     8. Footer year
     --------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
