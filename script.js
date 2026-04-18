function qs(sel, parent) {
  return (parent || document).querySelector(sel);
}

function qsa(sel, parent) {
  return Array.prototype.slice.call((parent || document).querySelectorAll(sel));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getHeaderOffset() {
  var header = qs(".header");
  if (!header) return 0;
  return header.getBoundingClientRect().height;
}

function setActiveNav(id) {
  var links = qsa(".nav__link");
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var href = a.getAttribute("href") || "";
    var isActive = href === "#" + id;
    a.classList.toggle("is-active", isActive);
    if (isActive) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

function initYear() {
  var el = qs("#year");
  if (!el) return;
  el.textContent = String(new Date().getFullYear());
}

function initMobileMenu() {
  var toggle = qs(".nav__toggle");
  var menu = qs("#navMenu");
  if (!toggle || !menu) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    menu.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("nav-open", open);
  }

  function isOpen() {
    return toggle.getAttribute("aria-expanded") === "true";
  }

  toggle.addEventListener("click", function () {
    setOpen(!isOpen());
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });

  qsa(".nav__link", menu).forEach(function (a) {
    a.addEventListener("click", function () {
      setOpen(false);
    });
  });
}

function initScrollReveal() {
  var items = qsa("[data-reveal]");
  if (!items.length) return;

  var reduce = false;
  try {
    reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  if (!reduce) {
    var perSectionIndex = typeof WeakMap !== "undefined" ? new WeakMap() : null;
    for (var d = 0; d < items.length; d++) {
      var elDelay = items[d];
      var attrDelay = elDelay.getAttribute("data-reveal-delay");
      if (attrDelay) {
        elDelay.style.setProperty("--reveal-delay", String(attrDelay).trim());
        continue;
      }
      if (elDelay.style && elDelay.style.getPropertyValue("--reveal-delay")) continue;

      var host = elDelay.closest ? elDelay.closest("section") : null;
      if (!host) host = document.body;

      var idx = 0;
      if (perSectionIndex) {
        idx = perSectionIndex.get(host) || 0;
        perSectionIndex.set(host, idx + 1);
      } else {
        idx = d;
      }

      var delay = Math.min(idx * 70, 360);
      elDelay.style.setProperty("--reveal-delay", delay + "ms");
    }
  }

  function reveal() {
    var viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      if (el.classList.contains("is-revealed")) continue;
      var rect = el.getBoundingClientRect();
      if (rect.top <= viewportH - 90) el.classList.add("is-revealed");
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      reveal();
    });
  }

  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", onScroll);
  reveal();
}

function initTiltMotion() {
  var reduce = false;
  try {
    reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}
  if (reduce) return;

  var fine = false;
  try {
    fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  } catch (e) {}
  if (!fine) return;

  var els = qsa(".card, .profileCard, .sidebarCard, .timelineItem__card");
  if (!els.length) return;

  function onMove(el, e) {
    if (!e) return;
    var r = el.getBoundingClientRect();
    var w = Math.max(1, r.width);
    var h = Math.max(1, r.height);
    var x = (e.clientX - r.left) / w - 0.5;
    var y = (e.clientY - r.top) / h - 0.5;
    var rx = (-y * 7).toFixed(2);
    var ry = (x * 10).toFixed(2);
    el.style.setProperty("--rx", rx + "deg");
    el.style.setProperty("--ry", ry + "deg");
    el.classList.add("is-tilting");
  }

  function onLeave(el) {
    el.classList.remove("is-tilting");
    el.style.removeProperty("--rx");
    el.style.removeProperty("--ry");
  }

  for (var i = 0; i < els.length; i++) {
    (function (el) {
      el.addEventListener("pointermove", function (e) {
        onMove(el, e);
      });
      el.addEventListener("pointerleave", function () {
        onLeave(el);
      });
      el.addEventListener("pointerdown", function () {
        el.classList.add("is-pressed");
      });
      el.addEventListener("pointerup", function () {
        el.classList.remove("is-pressed");
      });
      el.addEventListener("blur", function () {
        el.classList.remove("is-pressed");
      });
    })(els[i]);
  }
}

function initScrollSpy() {
  var sections = qsa("main section[id]");
  if (!sections.length) return;

  function getCurrentSectionId() {
    var offset = clamp(getHeaderOffset(), 56, 96) + 22;
    var probe = offset;
    var current = sections[0].id || "home";

    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      var rect = s.getBoundingClientRect();
      if (rect.top <= probe && rect.bottom > probe) {
        current = s.id;
        break;
      }
      if (rect.top <= probe) current = s.id;
    }
    return current;
  }

  function update() {
    setActiveNav(getCurrentSectionId());
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      update();
    });
  }

  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", onScroll);
  update();
}

function initBackToTop() {
  var btn = qs("#toTop");
  if (!btn) return;

  function update() {
    var show = window.scrollY > 700;
    btn.classList.toggle("is-visible", show);
  }

  window.addEventListener("scroll", update);
  update();
}

function initScrollProgress() {
  var root = document.documentElement;
  if (!root) return;

  function getProgress() {
    var doc = document.documentElement;
    var body = document.body;
    var scrollTop = window.scrollY || (doc && doc.scrollTop) || (body && body.scrollTop) || 0;
    var scrollHeight = (doc && doc.scrollHeight) || (body && body.scrollHeight) || 0;
    var clientHeight = (doc && doc.clientHeight) || window.innerHeight || 0;
    var total = Math.max(1, scrollHeight - clientHeight);
    return clamp(scrollTop / total, 0, 1);
  }

  var ticking = false;
  function update() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      root.style.setProperty("--scroll", String(getProgress()));
    });
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

function initPointerGlow() {
  var root = document.documentElement;
  if (!root) return;

  var px = 0;
  var py = 0;
  var ticking = false;

  function update() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      root.style.setProperty("--px", px + "px");
      root.style.setProperty("--py", py + "px");
    });
  }

  function onMove(e) {
    if (!e) return;
    px = e.clientX || 0;
    py = e.clientY || 0;
    update();
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("mousemove", onMove, { passive: true });
  px = Math.round((window.innerWidth || 0) * 0.5);
  py = Math.round((window.innerHeight || 0) * 0.25);
  update();
}

function initExperienceTabs() {
  var root = qs(".experienceTabs");
  if (!root) return;

  var tabs = qsa('[role="tab"]', root);
  var panels = qsa('[role="tabpanel"]', root);
  if (!tabs.length || !panels.length) return;

  var wrap = qs(".experienceTabs__panels", root);

  var reduce = false;
  try {
    reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var DURATION = reduce ? 0 : 420;

  function clearLeaveTimer(panel) {
    if (!panel) return;
    if (panel.__leaveTimer) {
      clearTimeout(panel.__leaveTimer);
      panel.__leaveTimer = null;
    }
  }

  function setWrapHeight(panelOrPx) {
    if (!wrap) return;
    if (reduce) {
      wrap.style.height = "";
      return;
    }

    var px = 0;
    if (typeof panelOrPx === "number") px = panelOrPx;
    else if (panelOrPx && panelOrPx.getBoundingClientRect) px = panelOrPx.getBoundingClientRect().height;
    px = Math.max(0, Math.round(px));
    wrap.style.height = px ? px + "px" : "";
  }

  function syncWrapToActive() {
    if (!wrap || reduce) return;
    var active = null;
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].classList.contains("is-active") && !panels[i].hasAttribute("hidden")) {
        active = panels[i];
        break;
      }
    }
    if (active) setWrapHeight(active);
  }

  function getPanelById(id) {
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].id === id) return panels[i];
    }
    return null;
  }

  function setActive(tab, immediate) {
    var id = tab && tab.getAttribute ? String(tab.getAttribute("aria-controls") || "") : "";
    if (!id) return;

    var currentPanel = null;
    for (var x = 0; x < panels.length; x++) {
      if (panels[x].classList.contains("is-active") && !panels[x].hasAttribute("hidden")) {
        currentPanel = panels[x];
        break;
      }
    }

    var nextPanel = getPanelById(id);
    if (!nextPanel) return;
    if (currentPanel && currentPanel === nextPanel) {
      syncWrapToActive();
      return;
    }

    var duration = immediate ? 0 : DURATION;

    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
      t.setAttribute("tabindex", active ? "0" : "-1");
    }

    for (var j = 0; j < panels.length; j++) {
      var p = panels[j];
      if (p === nextPanel || p === currentPanel) continue;
      clearLeaveTimer(p);
      p.classList.remove("is-active", "is-leaving");
      p.setAttribute("hidden", "");
    }

    clearLeaveTimer(currentPanel);
    clearLeaveTimer(nextPanel);

    if (currentPanel) {
      var leaving = currentPanel;
      currentPanel.classList.remove("is-active");
      currentPanel.classList.add("is-leaving");
      currentPanel.removeAttribute("hidden");

      if (wrap && !reduce) setWrapHeight(leaving);

      leaving.__leaveTimer = setTimeout(function () {
        leaving.classList.remove("is-leaving");
        leaving.setAttribute("hidden", "");
        leaving.__leaveTimer = null;
      }, duration);
    }

    var entering = nextPanel;
    nextPanel.classList.remove("is-leaving");
    nextPanel.removeAttribute("hidden");
    nextPanel.classList.remove("is-active");

    if (wrap && !reduce) {
      requestAnimationFrame(function () {
        setWrapHeight(entering);
      });
    }

    if (!duration) {
      entering.classList.add("is-active");
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          entering.classList.add("is-active");
        });
      });
    }

    try {
      window.dispatchEvent(new Event("scroll"));
    } catch (e) {}
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      setActive(t);
    });
  });

  root.addEventListener("keydown", function (e) {
    var key = e && e.key ? e.key : "";
    if (key !== "ArrowLeft" && key !== "ArrowRight") return;
    e.preventDefault();

    var currentIndex = 0;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute("aria-selected") === "true") {
        currentIndex = i;
        break;
      }
    }

    var dir = key === "ArrowRight" ? 1 : -1;
    var nextIndex = (currentIndex + dir + tabs.length) % tabs.length;
    tabs[nextIndex].focus();
    setActive(tabs[nextIndex]);
  });

  var initial = null;
  for (var k = 0; k < tabs.length; k++) {
    if (tabs[k].classList.contains("is-active") || tabs[k].getAttribute("aria-selected") === "true") {
      initial = tabs[k];
      break;
    }
  }
  if (initial) setActive(initial, true);
  syncWrapToActive();
  window.addEventListener("resize", function () {
    syncWrapToActive();
  });
}

function initContactForm() {
  var form = qs("#contactForm");
  var hint = qs("#formHint");
  if (!form) return;

  function setHint(text) {
    if (!hint) return;
    hint.textContent = text || "";
  }

  function isFormspreeConfigured(action) {
    var a = String(action || "").trim();
    if (!a) return false;
    if (a.indexOf("formspree.io") === -1) return false;
    if (a.indexOf("PASTE_ID_DISINI") !== -1) return false;
    return a.indexOf("http://") === 0 || a.indexOf("https://") === 0;
  }

  function setSubmitting(submitting) {
    var btn = qs('button[type="submit"]', form);
    if (btn) btn.disabled = !!submitting;
  }

  function upsertFormData(fd, key, value) {
    if (!fd) return;
    if (typeof fd.set === "function") fd.set(key, value);
    else fd.append(key, value);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = String(form.elements.name && form.elements.name.value ? form.elements.name.value : "").trim();
    var email = String(form.elements.email && form.elements.email.value ? form.elements.email.value : "").trim();
    var subject = String(form.elements.subject && form.elements.subject.value ? form.elements.subject.value : "").trim();
    var message = String(form.elements.message && form.elements.message.value ? form.elements.message.value : "").trim();

    if (!name || !email || !subject || !message) {
      setHint("Lengkapi semua field agar pesan bisa dikirim.");
      return;
    }

    var fullSubject = subject + " — dari " + name;
    var action = String(form.getAttribute("action") || "").trim();

    if (isFormspreeConfigured(action) && window.fetch && window.FormData) {
      var fd = new FormData(form);
      upsertFormData(fd, "subject", fullSubject);
      if (form.elements._subject) upsertFormData(fd, "_subject", fullSubject);

      setHint("Mengirim...");
      setSubmitting(true);

      window
        .fetch(action, {
          method: "POST",
          body: fd,
          headers: { Accept: "application/json" },
        })
        .then(function (res) {
          if (res && res.ok) return { ok: true };
          return res && res.json
            ? res.json().then(function (data) {
                return { ok: false, data: data };
              })
            : { ok: false };
        })
        .then(function (result) {
          if (result && result.ok) {
            setHint("Terkirim. Terima kasih!");
            form.reset();
            return;
          }

          var msg = "Gagal mengirim. Coba lagi atau hubungi lewat email/telepon.";
          if (result && result.data && result.data.errors && result.data.errors.length) {
            msg = String(result.data.errors[0].message || msg);
          }
          setHint(msg);
        })
        .catch(function () {
          setHint("Gagal mengirim. Periksa koneksi internet lalu coba lagi.");
        })
        .then(function () {
          setSubmitting(false);
        });
      return;
    }

    var to = "bismahendra863@gmail.com";
    var body =
      "Nama: " +
      name +
      "\nEmail: " +
      email +
      "\n\n" +
      message +
      "\n\n" +
      "Dikirim dari website CV/portofolio.";

    var url =
      "mailto:" +
      encodeURIComponent(to) +
      "?subject=" +
      encodeURIComponent(fullSubject) +
      "&body=" +
      encodeURIComponent(body);

    if (!isFormspreeConfigured(action)) setHint("Form belum terhubung ke layanan email. Membuka draft email...");
    else setHint("Membuka draft email...");
    window.location.href = url;
  });
}

function initProfileFallback() {
  var img = qs(".profileCard__img");
  var fallback = qs(".profileCard__fallback");
  if (!img || !fallback) return;

  function showFallback() {
    fallback.style.display = "grid";
  }

  function hideFallback() {
    fallback.style.display = "none";
  }

  if (img.complete && img.naturalWidth > 0) {
    hideFallback();
  } else {
    showFallback();
  }

  img.addEventListener("load", hideFallback);
  img.addEventListener("error", showFallback);
}

document.addEventListener("DOMContentLoaded", function () {
  document.body.classList.add("is-loaded");
  initYear();
  initMobileMenu();
  initScrollReveal();
  initTiltMotion();
  initScrollSpy();
  initBackToTop();
  initScrollProgress();
  initPointerGlow();
  initExperienceTabs();
  initContactForm();
  initProfileFallback();
});
