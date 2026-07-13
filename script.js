(function () {
  "use strict";

  /* ---------- Year stamps ---------- */
  var yearEls = document.querySelectorAll('.year');
  yearEls.forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Active nav link ---------- */
  var currentPage = document.body.getAttribute('data-page');
  if (currentPage) {
    document.querySelectorAll('.nav-item').forEach(function (link) {
      if (link.getAttribute('data-page') === currentPage) {
        link.classList.add('active');
      }
    });
  }

  /* ---------- Desktop collapse toggle ---------- */
  var collapseBtn = document.getElementById('collapseBtn');
  var body = document.body;

  function getStoredCollapsed() {
    try {
      return localStorage.getItem('aethel-sidebar-collapsed') === 'true';
    } catch (e) {
      return false;
    }
  }
  function setStoredCollapsed(val) {
    try {
      localStorage.setItem('aethel-sidebar-collapsed', val ? 'true' : 'false');
    } catch (e) { /* ignore if storage unavailable */ }
  }

  if (getStoredCollapsed()) {
    body.classList.add('sidebar-collapsed');
  }

  if (collapseBtn) {
    collapseBtn.addEventListener('click', function () {
      var collapsed = body.classList.toggle('sidebar-collapsed');
      setStoredCollapsed(collapsed);
    });
  }

  /* ---------- Mobile drawer toggle ---------- */
  var mobileToggle = document.getElementById('mobileToggle');
  var backdrop = document.getElementById('backdrop');

  function openMobileNav() {
    body.classList.add('sidebar-open');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
  }
  function closeMobileNav() {
    body.classList.remove('sidebar-open');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', function () {
      if (body.classList.contains('sidebar-open')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }
  if (backdrop) {
    backdrop.addEventListener('click', closeMobileNav);
  }
  document.querySelectorAll('.nav-item').forEach(function (link) {
    link.addEventListener('click', closeMobileNav);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 880) closeMobileNav();
  });

  /* ---------- Scroll reveal ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero puzzle canvas (home page only) ---------- */
  var canvas = document.getElementById('puzzle-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var hero = canvas.parentElement;
  var points = [];
  var mouse = { x: null, y: null };
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    var rect = hero.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initPoints(rect.width, rect.height);
  }

  function initPoints(w, h) {
    var count = Math.max(16, Math.floor((w * h) / 46000));
    points = [];
    for (var i = 0; i < count; i++) {
      points.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 1.3 + 0.6
      });
    }
  }

  function draw() {
    var w = canvas.width / dpr, h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }

    var maxDist = 140;
    for (var a = 0; a < points.length; a++) {
      for (var b = a + 1; b < points.length; b++) {
        var dx = points[a].x - points[b].x;
        var dy = points[a].y - points[b].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          var alpha = (1 - dist / maxDist) * 0.3;
          ctx.strokeStyle = 'rgba(238,240,230,' + alpha + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(points[a].x, points[a].y);
          ctx.lineTo(points[b].x, points[b].y);
          ctx.stroke();
        }
      }
      if (mouse.x !== null) {
        var mdx = points[a].x - mouse.x;
        var mdy = points[a].y - mouse.y;
        var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 170) {
          var malpha = (1 - mdist / 170) * 0.55;
          ctx.strokeStyle = 'rgba(77,166,255,' + malpha + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(points[a].x, points[a].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    for (var c = 0; c < points.length; c++) {
      var pt = points[c];
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(238,240,230,0.5)';
      ctx.fill();
    }

    if (!reduceMotion) {
      requestAnimationFrame(draw);
    }
  }

  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener('mouseleave', function () {
    mouse.x = null; mouse.y = null;
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  resize();
  draw();
})();
