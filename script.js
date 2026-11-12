// Theme toggle: light by default, remembers the choice on this device.
(function () {
  var root = document.documentElement;
  var b = document.getElementById('theme');
  if (!b) return;
  function label() { b.setAttribute('aria-label', root.getAttribute('data-theme') === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); }
  label();
  b.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });
})();

// Cursor spotlight on cards.
(function () {
  document.addEventListener('pointermove', function (e) {
    var t = e.target.closest && e.target.closest('.bt');
    if (!t) return;
    var r = t.getBoundingClientRect();
    t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
})();

// Glowing cursor (mouse devices only).
(function () {
  if (!window.matchMedia || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var root = document.documentElement;
  var dot = document.createElement('div'); dot.className = 'cur-dot';
  var glow = document.createElement('div'); glow.className = 'cur-glow';
  document.body.appendChild(glow); document.body.appendChild(dot);
  var x = -100, y = -100, gx = -100, gy = -100, raf = 0, shown = false;
  function frame() {
    gx += (x - gx) * 0.2; gy += (y - gy) * 0.2;
    dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
    raf = (Math.abs(x - gx) > 0.1 || Math.abs(y - gy) > 0.1) ? requestAnimationFrame(frame) : 0;
  }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; gx = x; gy = y; root.classList.add('cursor-on'); document.body.classList.add('cur-on'); }
    var t = e.target.closest ? e.target.closest('a,button,summary,label,.ibtn,.bt,.shot img,select') : null;
    document.body.classList.toggle('cur-hover', !!t);
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  document.addEventListener('mousedown', function () { document.body.classList.add('cur-down'); });
  document.addEventListener('mouseup', function () { document.body.classList.remove('cur-down'); });
  document.documentElement.addEventListener('mouseleave', function () { document.body.classList.remove('cur-on'); });
  document.documentElement.addEventListener('mouseenter', function () { if (shown) document.body.classList.add('cur-on'); });
})();

// Contact form. Paste your Google Apps Script web app URL (it ends with /exec) between the quotes
// to make the form send messages to your Google Sheet. While it is empty, the form only writes a
// message the visitor can copy.
var CONTACT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzwN5YdqdbCmh-9oiG7C-EgYLI04cTSwo1Nys9irqzTTBq2WCsygggi_NXy6BdhTjEW/exec';
var CONTACT_EMAIL = 'sdomar102001@gmail.com';

(function () {
  var form = document.getElementById('cform');
  if (!form) return;
  var err = document.getElementById('c-err');
  var ok = document.getElementById('c-ok');
  var btn = document.getElementById('c-submit');
  var intro = document.getElementById('c-intro');
  var draft = document.getElementById('draft');
  var text = document.getElementById('draft-text');
  var note = document.getElementById('copy-note');
  var live = !!CONTACT_ENDPOINT;

  if (live) {
    intro.textContent = "I'm available for new projects and long-term partnerships. Send me a message and I will reply to the email you enter. You can also write to me directly at " + CONTACT_EMAIL + '.';
    btn.textContent = 'Send message';
  }

  function showDraft(d) {
    text.textContent = 'Topic: ' + d.topic + '\nFrom: ' + d.name + ' <' + d.email + '>\n\n' + d.message;
    note.textContent = '';
    draft.hidden = false;
  }

  function send(d) {
    btn.disabled = true;
    btn.textContent = 'Sending...';
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(d),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (j) {
        if (j && j.ok) {
          ok.textContent = 'Thanks, ' + d.name + '. Your message was sent and I will reply to ' + d.email + '.';
          ok.hidden = false;
          form.reset();
        } else if (j && j.error && j.error.indexOf('Please') === 0) {
          err.textContent = j.error;
        } else {
          throw new Error('fail');
        }
      })
      .catch(function (reason) {
        console.error('Contact form:', reason);
        err.textContent = 'I could not confirm that your message was sent. Copy it below and email it to ' + CONTACT_EMAIL + '.';
        showDraft(d);
      })
      .then(function () {
        clearTimeout(timer);
        btn.disabled = false;
        btn.textContent = 'Send message';
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.textContent = '';
    ok.hidden = true;
    draft.hidden = true;
    var d = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      topic: form.elements.topic.value,
      message: form.elements.message.value.trim(),
      website: form.elements.website.value
    };
    if (!d.name || !d.email || !d.message) { err.textContent = 'Fill in your name, email, and message.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) { err.textContent = 'Enter a valid email address.'; return; }
    if (d.message.length > 2000) { err.textContent = 'Keep your message under 2000 characters.'; return; }
    if (d.website) { ok.textContent = 'Thanks. Your message was sent.'; ok.hidden = false; return; }
    if (live) { send(d); } else { showDraft(d); }
  });

  document.getElementById('copy').addEventListener('click', function () {
    var done = function () { note.textContent = 'Copied.'; };
    var fail = function () {
      var r = document.createRange(); r.selectNodeContents(text);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      note.textContent = 'Select and copy the text above.';
    };
    try { navigator.clipboard.writeText(text.textContent).then(done, fail); } catch (x) { fail(); }
  });
})();

// Click a screenshot to view it larger; click again or press Esc to close.
(function () {
  var imgs = document.querySelectorAll('.shot img');
  if (!imgs.length) return;
  var box = document.createElement('div');
  box.className = 'lightbox';
  box.hidden = true;
  var big = document.createElement('img');
  box.appendChild(big);
  document.body.appendChild(box);
  function close() { box.hidden = true; big.removeAttribute('src'); }
  imgs.forEach(function (img) {
    img.tabIndex = 0;
    img.addEventListener('click', function () { big.src = img.src; big.alt = img.alt; box.hidden = false; });
    img.addEventListener('keydown', function (e) { if (e.key === 'Enter') img.click(); });
  });
  box.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();

// Projects page: open the dropdown named in the URL (for example projects.html#zapier).
(function () {
  var groups = document.querySelectorAll('details.plat');
  if (!groups.length) return;
  function openFromHash() {
    var id = location.hash.slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.matches('details.plat')) { el.open = true; el.scrollIntoView(); }
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();

// Motion: scroll reveal and count-up numbers. Skipped for visitors who prefer reduced motion.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  var sel = '.tile, .psec, .panel .block, .entry, .pcard, .case, .plat, .shot, .zap, .kv > div, .chain li';
  var seen = new Map();
  var targets = Array.prototype.slice.call(document.querySelectorAll(sel)).filter(function (el) {
    if (el.closest('.plat-body') || el.closest('.lightbox') || el.closest('.hero-t') || el.closest('.phero') || el.closest('.stats') || el.closest('.strip')) return false;
    if (el.parentNode.closest && el.parentNode.closest('.reveal')) return false;
    if (el.offsetParent === null) return false;
    return el.getBoundingClientRect().top > window.innerHeight * 0.92;
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      io.unobserve(el);
      el.classList.add('in');
      setTimeout(function () { el.classList.remove('reveal', 'in'); el.style.removeProperty('--d'); }, 1400);
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -4% 0px' });
  targets.forEach(function (el) {
    var n = seen.get(el.parentNode) || 0;
    seen.set(el.parentNode, n + 1);
    el.style.setProperty('--d', Math.min(n, 5) * 80 + 'ms');
    el.classList.add('reveal');
    io.observe(el);
  });

  // count-up for the stat numbers (for example 10+, 100%, 1+ Years)
  var stats = Array.prototype.slice.call(document.querySelectorAll('.stat b'));
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      run(e.target);
    });
  }, { threshold: 0.4 });
  function run(b) {
    var end = parseInt(b.dataset.n, 10), suffix = b.dataset.s, t0 = null;
    function tick(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / 1300, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      b.textContent = v + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  stats.forEach(function (b) {
    var m = /^(\d+)(.*)$/.exec(b.textContent.trim());
    if (!m) return;
    b.dataset.n = m[1]; b.dataset.s = m[2];
    b.textContent = '0' + m[2];
    cio.observe(b);
    setTimeout(function () { if (b.textContent !== m[1] + m[2] && !b.dataset.run) { b.textContent = m[1] + m[2]; } }, 6000);
    b.dataset.run = '';
  });
})();