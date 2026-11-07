/* ==========================================================
   PAULSON MARLV BOOK MARKETING — MAIN SCRIPT (vanilla JS)
   ========================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Loader */
  window.addEventListener("load", function () {
    var l = document.getElementById("loader");
    if (l) setTimeout(function () { l.classList.add("done"); }, reduce ? 0 : 1100);
  });

  /* Header state + scroll progress */
  var header = document.querySelector(".header");
  var bar = document.getElementById("progress");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 30);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var burger = document.querySelector(".burger");
  var mobile = document.querySelector(".mobile");
  if (burger && mobile) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      mobile.classList.toggle("open", !open);
      document.body.style.overflow = open ? "" : "hidden";
    });
  }

  /* Scroll reveal */
  var items = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  /* Page transitions (internal links) */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a || reduce) return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || a.target === "_blank" || /^(mailto:|tel:|https?:)/.test(href)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(function () { window.location.href = href; }, 320);
  });
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) document.body.classList.remove("leaving");
  });

  /* Year */
  document.querySelectorAll(".yr").forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* Tabs (contact page) */
  var tabs = document.querySelectorAll(".tab");
  function showTab(id) {
    tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.dataset.tab === id)); });
    document.querySelectorAll(".panel").forEach(function (p) { p.hidden = p.id !== id; });
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { showTab(t.dataset.tab); history.replaceState(null, "", "#" + t.dataset.tab); });
  });
  if (tabs.length) {
    var h = location.hash.replace("#", "");
    if (h && document.getElementById(h)) showTab(h);
  }

  /* Prefill service from ?service=Name */
  var params = new URLSearchParams(location.search);
  var wanted = params.get("service");
  if (wanted) {
    document.querySelectorAll('input[name="services"]').forEach(function (c) {
      if (c.value === wanted) c.checked = true;
    });
  }

  /* Forms -> Formspree (AJAX, then redirect to thank-you.html) */
  document.querySelectorAll("form.js-form").forEach(function (form) {
    var msg = form.querySelector(".form-msg");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (f) {
        var err = f.closest(".field") && f.closest(".field").querySelector(".err");
        var bad = f.type === "checkbox" ? !f.checked : !f.checkValidity();
        f.classList.toggle("invalid", bad);
        if (err) err.textContent = bad ? (f.validationMessage || "This field is required.") : "";
        if (bad) ok = false;
      });
      if (!ok) {
        msg.className = "form-msg bad";
        msg.textContent = "Please complete the highlighted fields and try again.";
        var first = form.querySelector(".invalid");
        if (first) first.focus();
        return;
      }
      if (form.querySelector('[name="_gotcha"]').value) return; /* spam bot */
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending...";
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) {
          if (r.ok) { window.location.href = "thank-you.html"; }
          else { return r.json().then(function (d) { throw new Error((d.errors && d.errors.map(function (x) { return x.message; }).join(", ")) || "Submission failed."); }); }
        })
        .catch(function (err) {
          msg.className = "form-msg bad";
          msg.textContent = "Your message was not sent: " + err.message + " Please try again or email paulsonmarlvbookmarketer@gmail.com directly.";
          btn.disabled = false; btn.textContent = label;
        });
    });
    form.addEventListener("input", function (e) {
      if (e.target.classList.contains("invalid") && e.target.checkValidity()) {
        e.target.classList.remove("invalid");
        var er = e.target.closest(".field").querySelector(".err"); if (er) er.textContent = "";
      }
    });
  });
})();
