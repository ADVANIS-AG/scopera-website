// Bühne der Startseite: Hintergrundlicht, Partitur und Vorhang in einer three.js-Szene.
// Der Scroll-Fortschritt über .buehne öffnet den Vorhang und ordnet die Lichtpartikel.
// Farben kommen aus den CSS-Tokens, damit hell und dunkel exakt zur Seite passen.
import { Color, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial } from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { erstelleVorhang, type VorhangFarben } from './vorhang';
import { erstellePartitur } from './partitur';
import {
  beobachteTheme, erstelleRenderer, glatt, leseFarben, lichtFarbe, mausPosition, steuereSchleife, type Farben,
} from './basis';

gsap.registerPlugin(ScrollTrigger);

const KAMERA_Z = 8;
const FOV = 35;

const hintergrundFragment = /* glsl */ `
  uniform vec3 uGrund;
  uniform vec3 uLicht;
  uniform float uStaerke;
  uniform float uZeit;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 p = vUv - vec2(0.5, 0.58);
    p.x *= 1.5;
    float spot = 1.0 - smoothstep(0.0, 0.62, length(p));
    vec3 c = mix(uGrund, uLicht, spot * uStaerke);
    c += (hash(floor(vUv * vec2(1600.0, 900.0)) + fract(uZeit)) - 0.5) * 0.02;
    gl_FragColor = vec4(c, 1.0);
  }
`;

function vorhangFarben(f: Farben): VorhangFarben {
  return f.hell
    ? { tief: f.band.clone().lerp(f.accent, 0.22), hoch: f.ground.clone().lerp(f.card, 0.6), saum: f.accent }
    : { tief: f.ground.clone().multiplyScalar(0.7), hoch: f.band.clone().lerp(f.accent, 0.28), saum: f.accent };
}

export function starteBuehne(wurzel: HTMLElement, flaeche: HTMLElement, canvas: HTMLCanvasElement) {
  const schmal = window.matchMedia('(max-width: 760px)').matches;

  const renderer = erstelleRenderer(canvas, schmal);

  const szene = new Scene();
  const kamera = new PerspectiveCamera(FOV, 1, 0.1, 50);
  kamera.position.set(0, 0, KAMERA_Z);

  const halbHoehe = (abstand: number) => abstand * Math.tan((FOV * Math.PI) / 360);

  // Hintergrund mit Bühnenlicht
  const hintergrundUniforms = {
    uGrund: { value: new Color() }, uLicht: { value: new Color() },
    uStaerke: { value: 0 }, uZeit: { value: 0 },
  };
  const hintergrund = new Mesh(
    new PlaneGeometry(1, 1),
    new ShaderMaterial({
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: hintergrundFragment,
      uniforms: hintergrundUniforms,
      depthWrite: false,
    }),
  );
  hintergrund.position.z = -3;
  szene.add(hintergrund);

  const vorhang = erstelleVorhang(vorhangFarben(leseFarben()));
  vorhang.meshes.forEach((m) => szene.add(m));

  let partitur: ReturnType<typeof erstellePartitur> | null = null;
  let partiturBreite = 0;
  // Auf schmalen Bildschirmen wird die ganze Partitur kleiner, sonst passen nur wenige Noten hinein.
  const massstab = schmal ? 0.6 : 1;
  const mitteY = schmal ? 0.5 : 0.1;

  function bauePartitur(breite: number) {
    if (partitur) {
      szene.remove(partitur.linien, partitur.punkte);
      partitur.linien.geometry.dispose();
      partitur.punkte.geometry.dispose();
    }
    partiturBreite = breite;
    partitur = erstellePartitur({
      breite: breite / massstab,
      wolkeBreite: (breite / massstab) * 0.9,
      noten: schmal ? 9 : 18,
      proKopf: schmal ? 50 : 80,
      proHals: schmal ? 14 : 22,
      fliessend: schmal ? 420 : 1100,
      mitteY,
    });
    partitur.linien.scale.setScalar(massstab);
    partitur.punkte.scale.setScalar(massstab);
    partitur.linienUniforms.uDicke.value /= massstab;
    szene.add(partitur.linien, partitur.punkte);
    wendeFarbenAn();
  }

  function wendeFarbenAn() {
    const f = leseFarben();
    renderer.setClearColor(f.ground);
    hintergrundUniforms.uGrund.value.copy(f.ground);
    hintergrundUniforms.uLicht.value.copy(f.hell ? f.card : f.band.clone().lerp(f.accent, 0.22));
    vorhang.setzeFarben(vorhangFarben(f));
    // Hell: dunkleres Gold für Kontrast auf hellem Grund; dunkel: warmes, helles Licht.
    partitur?.setzeFarben(f.accent, lichtFarbe(f), f.hell);
    if (partitur) partitur.punkteUniforms.uDeckkraft.value = f.hell ? 0.85 : 1;
  }

  function groesse() {
    const b = flaeche.clientWidth;
    const h = flaeche.clientHeight;
    if (!b || !h) return;
    renderer.setSize(b, h, false);
    kamera.aspect = b / h;
    kamera.updateProjectionMatrix();
    const aspekt = b / h;

    const hgAbstand = KAMERA_Z + 3;
    hintergrund.scale.set(2 * halbHoehe(hgAbstand) * aspekt * 1.25, 2 * halbHoehe(hgAbstand) * 1.25, 1);

    const vAbstand = KAMERA_Z - 0.6;
    vorhang.setzeGroesse(halbHoehe(vAbstand) * aspekt * 1.08, 2 * halbHoehe(vAbstand) * 1.1);

    const breite = 2 * halbHoehe(KAMERA_Z + 1) * aspekt * 1.15;
    if (!partitur || Math.abs(breite - partiturBreite) / partiturBreite > 0.1) bauePartitur(breite);
    if (partitur) partitur.punkteUniforms.uPixel.value = renderer.getPixelRatio() * (h / 900);
  }

  // Scroll-Fortschritt, im Render-Loop weich nachgeführt
  let ziel = 0;
  let aktuell = 0;
  const zitat = wurzel.querySelector<HTMLElement>('.buehne-zitat');
  ScrollTrigger.create({
    trigger: wurzel,
    start: 'top top',
    endTrigger: wurzel.querySelector('.buehne-akt') ?? wurzel,
    end: 'bottom bottom',
    onUpdate: (st) => { ziel = st.progress; },
  });

  // Fünf Akte: die Kamera fährt zur Notengruppe der Stufe, deren Karte gerade in der Mitte steht.
  let aktivZiel = 0;
  let aktivAktuell = 0;
  let fokusZiel = 0;
  let fokus = 0;
  const akteListe = wurzel.querySelector<HTMLElement>('.akte-liste');
  if (akteListe) {
    ScrollTrigger.create({
      trigger: akteListe,
      start: 'top 75%',
      end: 'bottom 25%',
      onToggle: (st) => { fokusZiel = st.isActive ? 1 : 0; },
    });
    ScrollTrigger.create({
      trigger: akteListe,
      start: 'top center',
      end: 'bottom center',
      onUpdate: (st) => { aktivZiel = Math.min(4, Math.max(0, st.progress * 5 - 0.5)); },
    });
    akteListe.querySelectorAll<HTMLElement>('.akt').forEach((akt) => {
      ScrollTrigger.create({ trigger: akt, start: 'top 60%', end: 'bottom 40%', toggleClass: 'aktiv' });
    });
  }

  const maus = mausPosition();

  const start = performance.now();
  let ersterFrame = true;
  function frame() {
    const zeit = (performance.now() - start) / 1000;
    aktuell += (ziel - aktuell) * 0.08;
    const p = aktuell;
    fokus += (fokusZiel - fokus) * 0.05;
    aktivAktuell += (aktivZiel - aktivAktuell) * 0.06;

    const offen = 0.07 + 0.93 * glatt(0.04, 0.5, p);
    vorhang.uniforms.uOffen.value = offen;
    vorhang.uniforms.uZeit.value = zeit;
    hintergrundUniforms.uZeit.value = zeit;
    hintergrundUniforms.uStaerke.value = 0.35 + 0.65 * glatt(0.05, 0.55, p);
    if (partitur) {
      partitur.linienUniforms.uZeit.value = zeit;
      partitur.linienUniforms.uSichtbar.value = 0.25 + 0.75 * glatt(0.1, 0.45, p);
      partitur.punkteUniforms.uZeit.value = zeit;
      partitur.punkteUniforms.uFortschritt.value = glatt(0.2, 0.9, p) * 1.05;
      partitur.punkteUniforms.uAktiv.value = aktivAktuell;
      partitur.punkteUniforms.uFokus.value = fokus;
    }

    const aktX = partitur ? partitur.gruppenMitte(aktivAktuell) * massstab * fokus : 0;
    // In den Akten liegt die Karte unten, darum blickt die Kamera etwas unter die Partitur.
    const blickY = (mitteY * massstab - (schmal ? 0.75 : 0.35)) * fokus;
    kamera.position.x += (maus.x * 0.3 * (1 - fokus) + aktX - kamera.position.x) * 0.05;
    kamera.position.y += (-maus.y * 0.18 + blickY - kamera.position.y) * 0.04;
    kamera.position.z = KAMERA_Z - 0.7 * glatt(0.1, 1, p) - 1.8 * fokus;
    kamera.lookAt(aktX, blickY, -1);
    // Das Bühnenlicht wandert mit, sonst sieht die Kamera am Rand das Ende der Fläche.
    hintergrund.position.x = kamera.position.x;
    // Der Vorhang ist der Bühnenrahmen und bleibt beim Schwenk am Bildrand.
    vorhang.meshes.forEach((m) => { m.position.x = kamera.position.x; });

    // Das Zitat erscheint, sobald die Noten ihren Platz gefunden haben.
    if (zitat) {
      const z = glatt(0.55, 0.75, p) * (1 - fokus);
      zitat.style.opacity = z.toFixed(3);
      zitat.style.transform = `translateY(${((1 - z) * 24).toFixed(1)}px)`;
    }

    renderer.render(szene, kamera);
    if (ersterFrame) {
      ersterFrame = false;
      canvas.classList.add('bereit');
    }
  }

  steuereSchleife(renderer, flaeche, frame);
  new ResizeObserver(groesse).observe(flaeche);
  beobachteTheme(wendeFarbenAn);

  groesse();
  wendeFarbenAn();
}
