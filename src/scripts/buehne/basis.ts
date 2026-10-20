// Gemeinsame Bausteine der WebGL-Szenen (Bühne auf der Startseite, Lichtnetz auf /product
// und /partner): Farben aus den CSS-Tokens, Renderer und eine Render-Schleife, die nur läuft,
// solange die Fläche sichtbar und der Tab aktiv ist.
import { Color, ColorManagement, LinearSRGBColorSpace, WebGLRenderer } from 'three';

// Ohne Farbmanagement landen die Token-Werte unverändert im Bild, wie im CSS.
ColorManagement.enabled = false;

export interface Farben {
  ground: Color; band: Color; card: Color; ink: Color; inkSoft: Color; line: Color; accent: Color; hell: boolean;
}

export function leseFarben(): Farben {
  const cs = getComputedStyle(document.documentElement);
  const c = (name: string) => new Color(cs.getPropertyValue(name).trim());
  return {
    ground: c('--ground'), band: c('--band'), card: c('--card'), ink: c('--ink'), inkSoft: c('--ink-soft'),
    line: c('--line'), accent: c('--accent'),
    hell: document.documentElement.dataset.theme === 'light',
  };
}

// Farbe des Lichts (AI): dunkel ein warmes, helles Gold; hell ein dunkleres Gold, weil
// helles Licht auf hellem Grund verschwinden würde.
export const lichtFarbe = (f: Farben) =>
  f.hell ? f.accent.clone().multiplyScalar(0.78) : f.accent.clone().lerp(f.ink, 0.45);

export const glatt = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function erstelleRenderer(canvas: HTMLCanvasElement, schmal: boolean) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, schmal ? 1.5 : 1.75));
  return renderer;
}

export function steuereSchleife(renderer: WebGLRenderer, flaeche: Element, frame: () => void) {
  let sichtbar = false;
  const steuere = () => renderer.setAnimationLoop(sichtbar && !document.hidden ? frame : null);
  new IntersectionObserver(([eintrag]) => { sichtbar = eintrag.isIntersecting; steuere(); }).observe(flaeche);
  document.addEventListener('visibilitychange', steuere);
}

export function beobachteTheme(callback: () => void) {
  new MutationObserver(callback).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

// Maus-Parallaxe nur mit echtem Zeiger; Werte von -0.5 bis 0.5
export function mausPosition() {
  const maus = { x: 0, y: 0 };
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      maus.x = e.clientX / window.innerWidth - 0.5;
      maus.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }
  return maus;
}
