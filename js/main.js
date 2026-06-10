/* =========================================================
   A SUBIDA — Fundação JS (Fase 1)
   Lenis smooth scroll + GSAP/ScrollTrigger + cursor + altímetro
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var isDesktop = window.matchMedia('(min-width: 761px)').matches;

  // Modo estático (sem GSAP ou com "reduzir movimento"): o CSS .no-motion
  // assume o layout — nada de sobreposição de textos.
  var noMotion = reduce || !hasGsap;
  if (noMotion) document.documentElement.classList.add('no-motion');
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---- 1. Lenis smooth scroll (sincronizado com GSAP) ---- */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined' && !reduce) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    window.__lenis = lenis; // exposto para QA
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }
    // âncoras internas via Lenis
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1 && document.querySelector(id)) {
          e.preventDefault();
          lenis.scrollTo(id, { offset: 0, duration: 1.4 });
        }
      });
    });
  }

  /* ---- 2. Cursor customizado (com lerp suave) ---- */
  var cursor = document.querySelector('.cursor');
  if (cursor && window.matchMedia('(hover: hover)').matches && !reduce) {
    var dot = cursor.querySelector('.cursor__dot');
    var ring = cursor.querySelector('.cursor__ring');
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    });
    function ring_raf() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(ring_raf);
    }
    requestAnimationFrame(ring_raf);
    document.querySelectorAll('a, button, [data-cursor="grow"]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('is-grow'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-grow'); });
    });
  }

  /* ---- 3. Reveal "rise" (entrada suave) ---- */
  if (hasGsap && !reduce) {
    gsap.utils.toArray('.rise').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
  }
  // (modo estático: o CSS .no-motion exibe .rise e oculta .hero__answer)

  /* ---- 4. HERO cinematográfico ---- */
  if (document.querySelector('.hero') && hasGsap && !reduce) {
    // 4a. Intro de entrada (na carga)
    gsap.to('.hero__lead > *', {
      opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
      stagger: 0.13, delay: 0.25, startAt: { y: 26 }
    });

    // 4b. Scroll fixado (desktop e mobile): a vista se revela + a resposta surge
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=135%', scrub: 1, pin: true, anticipatePin: 1 }
    })
      .to('.hero__bg', { scale: 1.18, ease: 'none' }, 0)
      .to('.hero__overlay', { opacity: 0.62, ease: 'none' }, 0)
      .to('.hero__cue', { autoAlpha: 0, duration: 0.15 }, 0)
      .to('.hero__lead', { yPercent: -18, autoAlpha: 0, ease: 'power1.in', duration: 0.5 }, 0)
      .fromTo('.hero__answer', { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.5 }, 0.45);
  }
  // (modo estático: o CSS .no-motion exibe o conteúdo do hero)

  /* ---- 6. A TRILHA (fundo em altitudes + marcos + linha) ---- */
  var trailEl = document.querySelector('.trail');
  if (trailEl && hasGsap && !reduce) {
    var wps = gsap.utils.toArray('.waypoint');
    var n = wps.length;
    gsap.set(wps, { autoAlpha: 0, y: 40 });
    gsap.set(wps[0], { autoAlpha: 1, y: 0 });

    var ttl = gsap.timeline({
      scrollTrigger: { trigger: '.trail', start: 'top top', end: '+=' + (n * 85) + '%', scrub: 1, pin: '.trail__stage', anticipatePin: 1 }
    });

    // linha da trilha preenchendo de baixo p/ cima ao longo de toda a seção
    ttl.fromTo('.trail__fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: n }, 0);
    // parallax sutil de ascensão
    ttl.fromTo('.trail__bg', { yPercent: 0 }, { yPercent: 4, ease: 'none', duration: n }, 0);

    // troca dos marcos (um sai, o próximo entra)
    wps.forEach(function (wp, i) {
      if (i > 0) {
        ttl.to(wps[i - 1], { autoAlpha: 0, y: -40, duration: 0.4 }, i);
        ttl.fromTo(wp, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.4 }, i + 0.05);
      }
    });

    // crossfade das altitudes (floresta → rochosa → nuvens → cume)
    var L2 = document.querySelector('.trail__layer[data-l="2"]');
    var L3 = document.querySelector('.trail__layer[data-l="3"]');
    var L4 = document.querySelector('.trail__layer[data-l="4"]');
    if (L2) ttl.to(L2, { opacity: 1, ease: 'none', duration: 1.6 }, n * 0.18);
    if (L3) ttl.to(L3, { opacity: 1, ease: 'none', duration: 1.6 }, n * 0.44);
    if (L4) ttl.to(L4, { opacity: 1, ease: 'none', duration: 1.6 }, n * 0.7);
  }
  // (modo estático: o CSS .no-motion empilha os 9 marcos em lista vertical)

  /* ---- 5. Altímetro: progresso da subida (0 → 2.700 m) ---- */
  var altFill = document.getElementById('altFill');
  var altValue = document.getElementById('altValue');
  var altimeter = document.querySelector('.altimeter');
  var SUMMIT = 2700;
  function updateAlt() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (altFill) altFill.style.height = (p * 100) + '%';
    if (altValue) altValue.textContent = Math.round(p * SUMMIT).toLocaleString('pt-BR') + ' m';
    if (altimeter) altimeter.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.5);
  }
  if (lenis) { lenis.on('scroll', updateAlt); } else { window.addEventListener('scroll', updateAlt, { passive: true }); }
  updateAlt();

  /* ---- 7. Depoimentos: marquee automático (clona para loop sem emenda) ---- */
  var tRow = document.getElementById('tRow');
  if (tRow && !reduce) {
    tRow.innerHTML += tRow.innerHTML; // duplica os cards → translateX -50% fecha o ciclo
  }

  /* ---- 9. Névoa: drift parallax nas seções escuras ---- */
  if (hasGsap && !reduce) {
    gsap.utils.toArray('.mist').forEach(function (m, i) {
      var dir = i % 2 ? 1 : -1;
      gsap.fromTo(m, { yPercent: -10, xPercent: -2 * dir }, {
        yPercent: 12, xPercent: 2 * dir, ease: 'none',
        scrollTrigger: { trigger: m.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---- 12. Vídeo do cume: lazy-load só ao se aproximar (desktop) ---- */
  var fvid = document.querySelector('.final__video');
  if (fvid && isDesktop && !reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es, obs) {
      if (es[0].isIntersecting) {
        var s = fvid.querySelector('source');
        if (s && !s.src) { s.src = s.getAttribute('data-src'); fvid.load(); var p = fvid.play(); if (p && p.catch) p.catch(function () {}); }
        obs.disconnect();
      }
    }, { rootMargin: '400px' }).observe(fvid);
  }

  /* ---- 13. Beat: parallax na imagem + revelação sequencial da frase ---- */
  var beatEl = document.querySelector('.beat');
  if (beatEl && hasGsap && !reduce) {
    gsap.fromTo('.beat__bg', { yPercent: -18 }, {
      yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: '.beat', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    // passagem completa: progresso 0.5 = seção no centro da tela; a troca acontece aí
    gsap.set(['.beat__part--1', '.beat__part--2'], { autoAlpha: 0, y: 24 });
    gsap.timeline({ scrollTrigger: { trigger: '.beat', start: 'top bottom', end: 'bottom top', scrub: 1 } })
      .to('.beat__part--1', { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.2 }, 0.12)   // parte 1 entra
      .to('.beat__part--1', { autoAlpha: 0, y: -24, ease: 'power1.in', duration: 0.14 }, 0.40) // parte 1 sai (no centro)
      .to('.beat__part--2', { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.18 }, 0.46)  // parte 2 entra (no centro)
      .to('.beat__part--2', { autoAlpha: 1, duration: 0.36 }, 0.64);                            // parte 2 permanece até sair
  }
  // (modo estático: o CSS .no-motion mostra as duas partes em linhas separadas)

  /* ---- 8. FAQ: fecha as outras ao abrir uma ---- */
  var faqs = document.querySelectorAll('.accordion details');
  faqs.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) faqs.forEach(function (o) { if (o !== item) o.open = false; });
    });
  });

  /* ---- 10. Mouse parallax no hero (desktop) ---- */
  if (isDesktop && !reduce && hasGsap) {
    var heroBg = document.querySelector('.hero__bg');
    if (heroBg) {
      var qx = gsap.quickTo(heroBg, 'x', { duration: 0.7, ease: 'power3' });
      var qy = gsap.quickTo(heroBg, 'y', { duration: 0.7, ease: 'power3' });
      window.addEventListener('mousemove', function (e) {
        qx((e.clientX / window.innerWidth - 0.5) * 26);
        qy((e.clientY / window.innerHeight - 0.5) * 26);
      });
    }
  }

  /* ---- 11. CTA fixo no mobile (some no hero e perto da oferta) ---- */
  var mcta = document.querySelector('.mobile-cta');
  if (mcta && 'IntersectionObserver' in window) {
    var heroEl = document.querySelector('.hero');
    if (heroEl) new IntersectionObserver(function (es) {
      mcta.classList.toggle('past-hero', !es[0].isIntersecting);
    }, { threshold: 0 }).observe(heroEl);
    var offerEl = document.getElementById('oferta');
    if (offerEl) new IntersectionObserver(function (es) {
      mcta.classList.toggle('near-offer', es[0].isIntersecting);
    }, { threshold: 0 }).observe(offerEl);
  }

})();
