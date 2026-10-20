// Sitewide Bewegung: weiches Scrollen (Lenis), dezente Reveals beim Einblenden und die
// KlangLinie, die sich beim Scrollen zeichnet. Bei prefers-reduced-motion passiert nichts,
// die Seite bleibt dann exakt so wie ohne JavaScript.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// Was ohne eigenes Attribut eingeblendet wird. Elemente in einem Bereich mit
// data-reveal-aus (z.B. die Bühne) steuern ihre Bewegung selbst.
const REVEAL_ZIELE = 'main section .wrap > h2, main .karte, main .split-reihe, main [data-reveal]';

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  const lenis = new Lenis({ autoRaf: false, anchors: { offset: -80 } });
  document.documentElement.classList.add('lenis-aktiv');
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (zeit: number) => lenis.raf(zeit * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // Nur was beim Laden unterhalb des Viewports liegt, wird versteckt und eingeblendet.
  // Alles, was schon sichtbar ist, bleibt stehen, sonst flackert der erste Bildschirm.
  const ziele = gsap.utils
    .toArray<HTMLElement>(REVEAL_ZIELE)
    .filter((el) => !el.closest('[data-reveal-aus]'))
    .filter((el) => el.getBoundingClientRect().top > window.innerHeight);
  gsap.set(ziele, { autoAlpha: 0, y: 18 });
  ScrollTrigger.batch(ziele, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08, overwrite: true }),
  });

  // KlangLinie: die Linien zeichnen sich mit dem Scrollen von links nach rechts.
  gsap.utils.toArray<SVGSVGElement>('.klang-linie').forEach((svg) => {
    const linien = svg.querySelectorAll('polyline');
    const punkt = svg.querySelector('circle');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: svg, start: 'top 85%', end: 'bottom 45%', scrub: 0.6 },
    });
    tl.fromTo(linien, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', stagger: 0.15 });
    if (punkt) tl.from(punkt, { scale: 0, transformOrigin: '50% 50%', ease: 'back.out(3)', duration: 0.2 }, '>-0.25');
  });

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    document.documentElement.classList.remove('lenis-aktiv');
  };
});
