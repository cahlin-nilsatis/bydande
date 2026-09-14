/* BY Design and Engineering — site behavior
   Lenis (smooth scroll) -> GSAP ticker -> ScrollTrigger reveals
   anime.js for small counters/micro-interactions
   Motion (vanilla) as a progressive-enhancement touch on buttons
   Canvas 2D: bespoke "drafting" blueprint hero animation
*/

(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* No-JS-animation fallback: make sure the wipe-reveal work photos and the
     scroll-scrub hero are never left permanently hidden/unscaled if GSAP or
     ScrollTrigger fail to load. */
  function resetScrubAndRevealFallbacks() {
    document.querySelectorAll(".work-media.img-reveal").forEach(function (el) {
      el.style.clipPath = "inset(0% 0% 0% 0%)";
    });
    var scrubImg = document.querySelector(".scrub-media img");
    var scrubTag = document.querySelector(".scrub-tag");
    if (scrubImg) scrubImg.style.transform = "scale(1)";
    if (scrubTag) scrubTag.style.opacity = 1;
    document.querySelectorAll(".scrub-word").forEach(function (el, i) {
      el.style.opacity = i === 0 ? 1 : 0;
    });
  }

  /* ---------------- header state ---------------- */

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".menu-toggle");
  var body = document.body;

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".main-nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Lenis + GSAP ticker ---------------- */

  var lenis = null;
  if (!prefersReduced && window.Lenis) {
    lenis = new window.Lenis({
      duration: 1.1,
      smoothWheel: true,
    });
  }

  if (window.gsap) {
    if (lenis) {
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      lenis.on("scroll", function () {
        if (window.ScrollTrigger) ScrollTrigger.update();
      });
      gsap.ticker.lagSmoothing(0);
    }

    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      var reveals = gsap.utils.toArray(".reveal");
      reveals.forEach(function (el, i) {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          delay: (i % 4) * 0.06,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        });
      });

      gsap.utils.toArray(".work-row").forEach(function (row) {
        var media = row.querySelector(".work-media img");
        if (!media) return;
        gsap.fromTo(
          media,
          { yPercent: prefersReduced ? 0 : -6 },
          {
            yPercent: prefersReduced ? 0 : 6,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      /* photo wipe-reveal: each work image uncovers itself top-down as it
         scrolls into view, independent of the row's fade/translate reveal */
      gsap.utils.toArray(".work-media.img-reveal").forEach(function (media, i) {
        gsap.to(media, {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: prefersReduced ? 0.01 : 1.1,
          ease: "power3.inOut",
          delay: (i % 2) * 0.08,
          scrollTrigger: {
            trigger: media,
            start: "top 90%",
            once: true,
          },
        });
      });

      /* scroll-scrubbed featured home: the photo stays full-bleed the whole
         time (never framed down), so the "movement" comes from a Ken-Burns
         pan/zoom, a hand-drawn dimension line tracing across the screen,
         and a sequence of short captions that swap in and out like
         film subtitles rather than one static label. */
      var scrubPin = document.querySelector(".scrub-pin");
      if (scrubPin) {
        var scrubImg = scrubPin.querySelector(".scrub-media img");
        var scrubLinePath = scrubPin.querySelector(".scrub-line-svg path");
        var scrubWords = gsap.utils.toArray(".scrub-word");
        var scrubTag = scrubPin.querySelector(".scrub-tag");

        var scrubTl = gsap.timeline({
          scrollTrigger: {
            trigger: scrubPin,
            start: "top top",
            end: prefersReduced ? "+=10" : "+=220%",
            scrub: prefersReduced ? true : 0.5,
            pin: !prefersReduced,
            anticipatePin: 1,
          },
        });

        if (scrubImg) {
          scrubTl.fromTo(
            scrubImg,
            { scale: 1.32, xPercent: -4, yPercent: -3 },
            { scale: 1.06, xPercent: 3, yPercent: 2, ease: "none", duration: 1 },
            0
          );
        }

        if (scrubLinePath && scrubLinePath.getTotalLength) {
          var lineLength = scrubLinePath.getTotalLength();
          gsap.set(scrubLinePath, { strokeDasharray: lineLength, strokeDashoffset: lineLength });
          scrubTl.to(scrubLinePath, { strokeDashoffset: 0, ease: "none", duration: 0.65 }, 0);
        }

        function scrubBeat(el, inAt, outAt) {
          if (!el) return;
          scrubTl
            .fromTo(el, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.09, ease: "power2.out" }, inAt)
            .to(el, { opacity: 0, y: -18, duration: 0.09, ease: "power2.in" }, outAt);
        }

        scrubBeat(scrubWords[0], 0.04, 0.21);
        scrubBeat(scrubWords[1], 0.32, 0.49);
        scrubBeat(scrubWords[2], 0.58, 0.75);

        if (scrubTag) {
          scrubTl.fromTo(scrubTag, { opacity: 0, y: 12 }, { opacity: 1, y: 0, ease: "none", duration: 0.14 }, 0.82);
        }
      }
    } else {
      resetScrubAndRevealFallbacks();
    }

    /* hero entrance timeline */
    var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    var heroWords = document.querySelectorAll(".hero h1 .word");
    if (heroWords.length) {
      heroTl.fromTo(
        heroWords,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.06 }
      );
    }
    var heroMeta = document.querySelector(".hero-meta");
    var heroKicker = document.querySelector(".hero-kicker");
    if (heroKicker) heroTl.fromTo(heroKicker, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0);
    if (heroMeta) heroTl.fromTo(heroMeta, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.5");
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
    resetScrubAndRevealFallbacks();
  }

  /* ---------------- anime.js: stat counters ---------------- */

  if (window.anime) {
    var counters = document.querySelectorAll(".stat .num[data-count-to]");
    if (counters.length) {
      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            var to = parseFloat(el.getAttribute("data-count-to"));
            var suffix = el.getAttribute("data-suffix") || "";
            var obj = { val: 0 };
            anime({
              targets: obj,
              val: to,
              round: 1,
              duration: 1400,
              easing: "easeOutCubic",
              update: function () {
                el.textContent = obj.val + suffix;
              },
            });
            counterObserver.unobserve(el);
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (el) {
        counterObserver.observe(el);
      });
    }
  }

  /* ---------------- Motion (vanilla): button micro-interaction ---------------- */

  var MotionLib = window.Motion || window.motion;
  if (MotionLib && MotionLib.animate && !prefersReduced) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("mouseenter", function () {
        MotionLib.animate(btn, { scale: 1.035 }, { duration: 0.25, easing: "ease-out" });
      });
      btn.addEventListener("mouseleave", function () {
        MotionLib.animate(btn, { scale: 1 }, { duration: 0.3, easing: "ease-out" });
      });
    });
  }

  /* ---------------- canvas: bespoke drafting animation ---------------- */

  var canvas = document.querySelector(".hero-canvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h;
    var pointer = { x: null, y: null };
    var start = null;
    var DRAW_MS = prefersReduced ? 1 : 1900;
    /* Hardcoded light gold, not the brand --accent token: this draws over
       the hero photo now, so it needs to read against varied photo tones
       rather than the flat white page background --accent was tuned for. */
    var lineColor = "#e3bd82";
    var fine = window.matchMedia("(pointer: fine)").matches;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function trussPoints() {
      var apexX = w * 0.62;
      var apexY = h * 0.22;
      var leftX = w * 0.28;
      var rightX = w * 0.94;
      var eaveY = h * 0.56;
      return {
        apex: [apexX, apexY],
        left: [leftX, eaveY],
        right: [rightX, eaveY],
      };
    }

    function segLength(a, b) {
      return Math.hypot(b[0] - a[0], b[1] - a[1]);
    }

    function drawPartialSegment(a, b, t) {
      if (t <= 0) return;
      var x = a[0] + (b[0] - a[0]) * t;
      var y = a[1] + (b[1] - a[1]) * t;
      ctx.lineTo(x, y);
    }

    function drawTick(p, dx, dy) {
      ctx.moveTo(p[0] - dx, p[1] - dy);
      ctx.lineTo(p[0] + dx, p[1] + dy);
    }

    function frame(ts) {
      if (!start) start = ts;
      var progress = Math.min(1, (ts - start) / DRAW_MS);
      var eased = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, w, h);

      var pts = trussPoints();
      var segs = [
        [pts.apex, pts.left],
        [pts.apex, pts.right],
        [pts.left, pts.right],
      ];
      var lengths = segs.map(function (s) {
        return segLength(s[0], s[1]);
      });
      var total = lengths.reduce(function (a, b) {
        return a + b;
      }, 0);
      var travelled = eased * total;

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      var remaining = travelled;
      for (var i = 0; i < segs.length; i++) {
        var segLen = lengths[i];
        var a = segs[i][0],
          b = segs[i][1];
        if (remaining <= 0) break;
        ctx.moveTo(a[0], a[1]);
        if (remaining >= segLen) {
          ctx.lineTo(b[0], b[1]);
          remaining -= segLen;
        } else {
          drawPartialSegment(a, b, remaining / segLen);
          remaining = 0;
        }
      }
      ctx.stroke();

      if (eased > 0.92) {
        ctx.globalAlpha = (eased - 0.92) / 0.08;
        ctx.beginPath();
        drawTick(pts.apex, 7, 7);
        drawTick(pts.left, 7, -7);
        drawTick(pts.right, 7, -7);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (fine && !prefersReduced && pointer.x !== null) {
        var step = 56;
        ctx.fillStyle = lineColor;
        for (var gx = 0; gx <= w; gx += step) {
          for (var gy = 0; gy <= h; gy += step) {
            var d = Math.hypot(gx - pointer.x, gy - pointer.y);
            if (d < 130) {
              var r = (1 - d / 130) * 2.6;
              ctx.globalAlpha = (1 - d / 130) * 0.6;
              ctx.beginPath();
              ctx.arc(gx, gy, r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.globalAlpha = 1;
      }

      if (progress < 1 || (fine && !prefersReduced)) {
        requestAnimationFrame(frame);
      }
    }

    if (fine) {
      canvas.parentElement.addEventListener("mousemove", function (e) {
        var rect = canvas.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
      });
      canvas.parentElement.addEventListener("mouseleave", function () {
        pointer.x = null;
        pointer.y = null;
      });
    }

    requestAnimationFrame(frame);
  }
})();
