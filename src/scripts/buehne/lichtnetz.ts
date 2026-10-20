// Lichtnetz: die Plattform-Grafiken auf /product und /partner als three.js-Szene.
// Knoten sind Logen (bewährte Struktur), Licht fliesst als Partikel (AI) über die
// Verbindungen. Der Scroll-Fortschritt zeichnet die Verbindungen nacheinander und schaltet
// die Logen ein. Die HTML-Beschriftungen folgen den Knoten über eine Projektion.
//
// Varianten:
//   fundament  Plattform-Kern mit einem Ring aus Funktionen (/product)
//   kaskade    Opernhaus im Querschnitt: Bühne (ADVANIS), Rang 1 (Provider), Rang 2 (Mandanten) (/partner)
//   mandanten  ein Rang mit vier Logen (/product, Mandantenfähigkeit)
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  LineSegments,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
} from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  beobachteTheme, erstelleRenderer, glatt, leseFarben, lichtFarbe, mausPosition, steuereSchleife,
} from './basis';

gsap.registerPlugin(ScrollTrigger);

export type Variante = 'fundament' | 'kaskade' | 'mandanten';

interface Knoten {
  pos: Vector3;
  form: 0 | 1;      // 0 Kreis (Kern), 1 Loge (abgerundetes Quadrat)
  groesse: number;  // Pixel bei 450px Flächenhöhe
  an: number;       // Fortschritt, bei dem die Loge angeht
  label?: number;   // Index der HTML-Beschriftung
}
interface Kante {
  von: Vector3;
  nach: Vector3;
  start: number;
  dauer: number;
  bogen: number;    // Anhebung der Kontrollpunkte (gebogene Verbindung)
  staerke: number;  // Deckkraft der Linie
  fluss: number;    // Anzahl Lichtpartikel auf der Kante
}
interface Graph {
  knoten: Knoten[];
  kanten: Kante[];
  // Kamera bei Fortschritt 0 und 1
  kameraVon: Vector3; kameraNach: Vector3; blick: Vector3;
  drehen: boolean;  // Ring dreht langsam (fundament)
  neigung: number;
}

const grad = (g: number) => (g * Math.PI) / 180;

// Bogenstück (Brüstung eines Rangs) als Kette kurzer Kanten
function rangBogen(radius: number, y: number, zMitte: number, von: number, bis: number, start: number): Kante[] {
  const teile = 18;
  const kanten: Kante[] = [];
  for (let i = 0; i < teile; i++) {
    const a = grad(von + ((bis - von) * i) / teile);
    const b = grad(von + ((bis - von) * (i + 1)) / teile);
    kanten.push({
      von: new Vector3(Math.sin(a) * radius, y, zMitte - Math.cos(a) * radius),
      nach: new Vector3(Math.sin(b) * radius, y, zMitte - Math.cos(b) * radius),
      start: start + (i / teile) * 0.15, dauer: 0.03, bogen: 0, staerke: 0.35, fluss: 0,
    });
  }
  return kanten;
}

function baueGraph(variante: Variante, labels: number, schmal: boolean): Graph {
  if (variante === 'fundament') {
    const n = Math.max(labels, 6);
    const knoten: Knoten[] = [{ pos: new Vector3(0, 0, 0), form: 0, groesse: 92, an: 0 }];
    const kanten: Kante[] = [];
    const rx = schmal ? 2.3 : 3.6;
    const rz = schmal ? 1.6 : 1.5;
    const ring: Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      const p = new Vector3(Math.cos(a) * rx, 0, Math.sin(a) * rz);
      ring.push(p);
      const start = 0.05 + (i / n) * 0.55;
      knoten.push({ pos: p, form: 1, groesse: 40, an: start + 0.2, label: i < labels ? i : undefined });
      kanten.push({ von: knoten[0].pos, nach: p, start, dauer: 0.2, bogen: 0.5, staerke: 0.7, fluss: schmal ? 6 : 10 });
    }
    // Zum Schluss schliesst sich der Ring: die Funktionen greifen ineinander
    ring.forEach((p, i) => kanten.push({
      von: p, nach: ring[(i + 1) % n], start: 0.72 + (i / n) * 0.18, dauer: 0.06, bogen: 0, staerke: 0.3, fluss: 0,
    }));
    return {
      knoten, kanten, drehen: true, neigung: 0.38,
      kameraVon: new Vector3(0, 3.4, 9.5), kameraNach: new Vector3(0, schmal ? 1.6 : 2.0, schmal ? 7.2 : 7.6), blick: new Vector3(0, schmal ? -0.25 : -0.45, 0),
    };
  }

  // Ränge eines Opernhauses: die Bühne vorne, die Ränge im Halbrund dahinter, übereinander.
  const buehne = new Vector3(0, -0.7, 0.7);
  const knoten: Knoten[] = [{ pos: buehne, form: 0, groesse: 64, an: 0 }];
  const kanten: Kante[] = [];
  const zMitte = 1.2;

  if (variante === 'mandanten') {
    const winkel = [-48, -16, 16, 48];
    const r = 3.4;
    winkel.forEach((w, i) => {
      const p = new Vector3(Math.sin(grad(w)) * r, 0.4, zMitte - Math.cos(grad(w)) * r);
      const start = 0.12 + i * 0.12;
      knoten.push({ pos: p, form: 1, groesse: 44, an: start + 0.22 });
      kanten.push({ von: buehne, nach: p, start, dauer: 0.22, bogen: 0.9, staerke: 0.7, fluss: 10 });
    });
    kanten.push(...rangBogen(r, 0.4 - 0.32, zMitte, -70, 70, 0));
    return {
      knoten, kanten, drehen: false, neigung: 0,
      kameraVon: new Vector3(0, 0.6, 8.6), kameraNach: new Vector3(0, 1.6, schmal ? 7.6 : 6.6), blick: new Vector3(0, -0.1, -0.8),
    };
  }

  // kaskade
  const provider = [-46, 0, 46];
  const r1 = 2.7;
  const r2 = 4.6;
  provider.forEach((w, i) => {
    const p = new Vector3(Math.sin(grad(w)) * r1, 0.1, zMitte - Math.cos(grad(w)) * r1);
    const start = 0.06 + i * 0.1;
    knoten.push({ pos: p, form: 1, groesse: 46, an: start + 0.2, label: i === 1 ? 1 : undefined });
    kanten.push({ von: buehne, nach: p, start, dauer: 0.2, bogen: 0.8, staerke: 0.75, fluss: 10 });
    [-15, 0, 15].forEach((d, j) => {
      const q = new Vector3(Math.sin(grad(w + d)) * r2, 1.3, zMitte - Math.cos(grad(w + d)) * r2);
      const s2 = 0.42 + i * 0.1 + j * 0.04;
      knoten.push({ pos: q, form: 1, groesse: 34, an: s2 + 0.18, label: i === 1 && j === 1 ? 2 : undefined });
      kanten.push({ von: p, nach: q, start: s2, dauer: 0.18, bogen: 0.5, staerke: 0.6, fluss: 6 });
    });
  });
  knoten[0].label = 0;
  kanten.push(...rangBogen(r1, 0.1 - 0.3, zMitte, -72, 72, 0), ...rangBogen(r2, 1.3 - 0.26, zMitte, -72, 72, 0.08));
  return {
    knoten, kanten, drehen: false, neigung: 0,
    kameraVon: new Vector3(0, 0.4, 10.5), kameraNach: new Vector3(0, 2.4, schmal ? 9.6 : 8.2), blick: new Vector3(0, 0.25, -1.2),
  };
}

// ---------- Shader ----------

const bezier = /* glsl */ `
  vec3 bezier(vec3 a, vec3 b, vec3 c, float t) {
    float u = 1.0 - t;
    return u * u * a + 2.0 * u * t * b + t * t * c;
  }
`;

const linienVertex = /* glsl */ `
  uniform float uFortschritt;
  attribute float aT;
  attribute vec3 aKante; // start, dauer, staerke
  varying float vT;
  varying float vSichtbar;
  varying float vStaerke;
  void main() {
    vT = aT;
    vSichtbar = clamp((uFortschritt - aKante.x) / aKante.y, 0.0, 1.0);
    vStaerke = aKante.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const linienFragment = /* glsl */ `
  uniform vec3 uFarbe;
  varying float vT;
  varying float vSichtbar;
  varying float vStaerke;
  void main() {
    if (vT > vSichtbar) discard;
    gl_FragColor = vec4(uFarbe, vStaerke);
  }
`;

const flussVertex = /* glsl */ `
  uniform float uFortschritt;
  uniform float uZeit;
  uniform float uPixel;
  attribute vec3 aP0;
  attribute vec3 aP2;
  attribute vec4 aDaten; // start, dauer, tempo, phase
  varying float vAlpha;
  ${bezier}
  void main() {
    // position enthält den Kontrollpunkt der Kurve
    float fertig = smoothstep(0.85, 1.0, clamp((uFortschritt - aDaten.x) / aDaten.y, 0.0, 1.0));
    float u = fract(uZeit * aDaten.z + aDaten.w);
    vec3 p = bezier(aP0, position, aP2, u);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPixel * 3.2 * (7.0 / -mv.z);
    vAlpha = fertig * sin(u * 3.14159);
  }
`;
const flussFragment = /* glsl */ `
  uniform vec3 uFarbe;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(1.0 - smoothstep(0.0, 0.5, d), 1.6);
    gl_FragColor = vec4(uFarbe, a * vAlpha);
  }
`;

const knotenVertex = /* glsl */ `
  uniform float uFortschritt;
  uniform float uZeit;
  uniform float uPixel;
  attribute vec3 aDaten; // form, groesse, an
  varying float vForm;
  varying float vAn;
  void main() {
    vForm = aDaten.x;
    vAn = smoothstep(aDaten.z, aDaten.z + 0.06, uFortschritt);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float puls = vForm < 0.5 ? 1.0 + 0.05 * sin(uZeit * 2.0) : 1.0;
    gl_PointSize = aDaten.y * uPixel * puls * (7.0 / -mv.z);
  }
`;
const knotenFragment = /* glsl */ `
  uniform vec3 uRand;
  uniform vec3 uFuellung;
  uniform vec3 uGrund;
  uniform vec3 uGold;
  varying float vForm;
  varying float vAn;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    // Kreis oder abgerundetes Quadrat, Kantenlänge 0.6 der Punktgrösse; aussen bleibt Platz für den Schein
    float d = vForm < 0.5 ? length(q) * 2.0 : length(max(abs(q) - 0.2, 0.0)) * 2.0 + 0.4;
    float kante = 0.6;
    float innen = 1.0 - smoothstep(kante - 0.03, kante, d);
    float rand = innen * smoothstep(kante - 0.12, kante - 0.09, d);
    float schein = (1.0 - smoothstep(kante, 1.0, d)) * 0.35 * vAn;
    vec3 aus = mix(uGrund, uRand, rand);
    vec3 farbe = mix(aus, mix(uFuellung, uGold, rand * 0.6), vAn);
    float a = max(innen, schein);
    if (a < 0.01) discard;
    gl_FragColor = vec4(innen > 0.5 ? farbe : uGold, a);
  }
`;

// ---------- Szene ----------

export function starteLichtnetz(
  flaeche: HTMLElement,
  canvas: HTMLCanvasElement,
  variante: Variante,
  labelElemente: HTMLElement[],
) {
  const schmal = window.matchMedia('(max-width: 760px)').matches;
  const renderer = erstelleRenderer(canvas, schmal);
  const szene = new Scene();
  const kamera = new PerspectiveCamera(32, 1, 0.1, 60);
  const graph = baueGraph(variante, labelElemente.length, schmal);

  const welt = new Group();
  welt.rotation.x = graph.neigung;
  const dreh = new Group();
  welt.add(dreh);
  szene.add(welt);

  // Linien: jede Kante als Kette kurzer Segmente entlang einer quadratischen Kurve
  const SEG = 20;
  const lPos: number[] = [];
  const lT: number[] = [];
  const lKante: number[] = [];
  const kontroll = (k: Kante) => k.von.clone().lerp(k.nach, 0.5).add(new Vector3(0, k.bogen, 0));
  const punktAuf = (k: Kante, t: number) => {
    const c = kontroll(k);
    const u = 1 - t;
    return k.von.clone().multiplyScalar(u * u).add(c.multiplyScalar(2 * u * t)).add(k.nach.clone().multiplyScalar(t * t));
  };
  graph.kanten.forEach((k) => {
    const teile = k.bogen ? SEG : 1;
    for (let i = 0; i < teile; i++) {
      const t0 = i / teile;
      const t1 = (i + 1) / teile;
      const a = punktAuf(k, t0);
      const b = punktAuf(k, t1);
      lPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      lT.push(t0, t1);
      lKante.push(k.start, k.dauer, k.staerke, k.start, k.dauer, k.staerke);
    }
  });
  const linienGeo = new BufferGeometry();
  linienGeo.setAttribute('position', new BufferAttribute(new Float32Array(lPos), 3));
  linienGeo.setAttribute('aT', new BufferAttribute(new Float32Array(lT), 1));
  linienGeo.setAttribute('aKante', new BufferAttribute(new Float32Array(lKante), 3));
  const gemeinsam = { uFortschritt: { value: 0 }, uZeit: { value: 0 }, uPixel: { value: 1 } };
  const linienMat = new ShaderMaterial({
    vertexShader: linienVertex, fragmentShader: linienFragment,
    uniforms: { uFortschritt: gemeinsam.uFortschritt, uFarbe: { value: leseFarben().accent } },
    transparent: true, depthWrite: false,
  });
  dreh.add(new LineSegments(linienGeo, linienMat));

  // Fliessendes Licht
  const fP0: number[] = [];
  const fP1: number[] = [];
  const fP2: number[] = [];
  const fDaten: number[] = [];
  graph.kanten.forEach((k) => {
    const c = kontroll(k);
    for (let i = 0; i < k.fluss; i++) {
      fP0.push(k.von.x, k.von.y, k.von.z);
      fP1.push(c.x, c.y, c.z);
      fP2.push(k.nach.x, k.nach.y, k.nach.z);
      fDaten.push(k.start, k.dauer, 0.18 + Math.random() * 0.22, i / k.fluss + Math.random() * 0.05);
    }
  });
  const flussGeo = new BufferGeometry();
  flussGeo.setAttribute('position', new BufferAttribute(new Float32Array(fP1), 3));
  flussGeo.setAttribute('aP0', new BufferAttribute(new Float32Array(fP0), 3));
  flussGeo.setAttribute('aP2', new BufferAttribute(new Float32Array(fP2), 3));
  flussGeo.setAttribute('aDaten', new BufferAttribute(new Float32Array(fDaten), 4));
  const flussMat = new ShaderMaterial({
    vertexShader: flussVertex, fragmentShader: flussFragment,
    uniforms: { ...gemeinsam, uFarbe: { value: lichtFarbe(leseFarben()) } },
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const fluss = new Points(flussGeo, flussMat);
  fluss.frustumCulled = false;
  dreh.add(fluss);

  // Logen
  const kPos: number[] = [];
  const kDaten: number[] = [];
  graph.knoten.forEach((k) => {
    kPos.push(k.pos.x, k.pos.y, k.pos.z);
    kDaten.push(k.form, k.groesse, k.an);
  });
  const knotenGeo = new BufferGeometry();
  knotenGeo.setAttribute('position', new BufferAttribute(new Float32Array(kPos), 3));
  knotenGeo.setAttribute('aDaten', new BufferAttribute(new Float32Array(kDaten), 3));
  const knotenUniforms = {
    ...gemeinsam,
    uRand: { value: leseFarben().inkSoft }, uFuellung: { value: leseFarben().card },
    uGrund: { value: leseFarben().card }, uGold: { value: leseFarben().accent },
  };
  const knotenMat = new ShaderMaterial({
    vertexShader: knotenVertex, fragmentShader: knotenFragment, uniforms: knotenUniforms,
    transparent: true, depthWrite: false, blending: NormalBlending,
  });
  const knotenPunkte = new Points(knotenGeo, knotenMat);
  knotenPunkte.frustumCulled = false;
  knotenPunkte.renderOrder = 2;
  dreh.add(knotenPunkte);

  function wendeFarbenAn() {
    const f = leseFarben();
    renderer.setClearColor(f.ground);
    linienMat.uniforms.uFarbe.value.copy(f.accent);
    flussMat.uniforms.uFarbe.value.copy(lichtFarbe(f));
    flussMat.blending = f.hell ? NormalBlending : AdditiveBlending;
    flussMat.needsUpdate = true;
    knotenUniforms.uRand.value.copy(f.inkSoft);
    knotenUniforms.uGrund.value.copy(f.card);
    // Eingeschaltete Loge: dunkel ein warmes Gold, hell eine helle Fläche mit goldenem Rand
    knotenUniforms.uFuellung.value.copy(f.hell ? f.card : f.accent.clone().lerp(f.ink, 0.25));
    knotenUniforms.uGold.value.copy(f.accent);
  }

  function groesse() {
    const b = flaeche.clientWidth;
    const h = flaeche.clientHeight;
    if (!b || !h) return;
    renderer.setSize(b, h, false);
    kamera.aspect = b / h;
    kamera.updateProjectionMatrix();
    gemeinsam.uPixel.value = renderer.getPixelRatio() * (h / 450);
  }

  // Fortschritt über den Durchlauf der Fläche durch den Viewport
  let ziel = 0;
  let aktuell = 0;
  ScrollTrigger.create({
    trigger: flaeche,
    start: 'top 90%',
    end: 'center 45%',
    onUpdate: (st) => { ziel = st.progress; },
  });

  const maus = mausPosition();
  const welt3 = new Vector3();
  const start = performance.now();
  let ersterFrame = true;

  function frame() {
    const zeit = (performance.now() - start) / 1000;
    aktuell += (ziel - aktuell) * 0.07;
    gemeinsam.uFortschritt.value = aktuell * 1.04;
    gemeinsam.uZeit.value = zeit;
    if (graph.drehen) dreh.rotation.y = zeit * 0.05 + aktuell * 0.6;

    const k = glatt(0, 1, aktuell);
    kamera.position.lerpVectors(graph.kameraVon, graph.kameraNach, k);
    kamera.position.x += maus.x * 0.6;
    kamera.position.y += -maus.y * 0.3;
    kamera.lookAt(graph.blick);
    szene.updateMatrixWorld();

    // Beschriftungen an die projizierte Lage ihres Knotens setzen
    if (labelElemente.length) {
      const b = flaeche.clientWidth;
      const h = flaeche.clientHeight;
      graph.knoten.forEach((kn) => {
        if (kn.label === undefined) return;
        const el = labelElemente[kn.label];
        if (!el) return;
        welt3.copy(kn.pos).applyMatrix4(dreh.matrixWorld).project(kamera);
        const an = glatt(kn.an, kn.an + 0.08, gemeinsam.uFortschritt.value);
        el.style.transform = `translate(${((welt3.x + 1) / 2) * b}px, ${((1 - welt3.y) / 2) * h}px) translate(-50%, 0)`;
        el.style.opacity = (an * (welt3.z < 1 ? 1 : 0)).toFixed(3);
      });
    }

    renderer.render(szene, kamera);
    if (ersterFrame) {
      ersterFrame = false;
      flaeche.classList.add('bereit');
    }
  }

  steuereSchleife(renderer, flaeche, frame);
  new ResizeObserver(groesse).observe(flaeche);
  beobachteTheme(wendeFarbenAn);
  groesse();
  wendeFarbenAn();
}
