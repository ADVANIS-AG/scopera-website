// Partitur: fünf goldene Notenlinien (die bewährten Prozesse, eine Linie pro Stufe) und
// Lichtpartikel (AI). Die Partikel treiben zuerst als Wolke und finden mit uFortschritt
// ihren Platz: als Notenköpfe mit Hals oder als Licht, das den Linien entlang fliesst.
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  NormalBlending,
  Points,
  ShaderMaterial,
} from 'three';

export const LINIEN_ABSTAND = 0.24;
const LINIEN_Z = -1;

// Gemeinsame Wellenform, damit Linien und Noten exakt zusammen schwingen.
const welle = /* glsl */ `
  float welle(float x, float t) {
    return sin(x * 0.55 + t * 0.35) * 0.06 + sin(x * 1.3 - t * 0.22) * 0.025;
  }
`;

const linienVertex = /* glsl */ `
  uniform float uZeit;
  uniform float uDicke;
  attribute float aSeite;
  varying float vX;
  ${welle}
  void main() {
    vec3 p = position;
    p.y += welle(p.x, uZeit) + aSeite * uDicke * 0.5;
    vX = p.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const linienFragment = /* glsl */ `
  uniform vec3 uFarbe;
  uniform float uSichtbar;
  uniform float uHalbBreite;
  varying float vX;
  void main() {
    float rand = 1.0 - smoothstep(uHalbBreite * 0.8, uHalbBreite, abs(vX));
    gl_FragColor = vec4(uFarbe, uSichtbar * rand);
  }
`;

const punkteVertex = /* glsl */ `
  uniform float uZeit;
  uniform float uFortschritt;
  uniform float uPixel;
  uniform float uBreite;
  uniform float uAktiv;  // Stufe im Spotlight (0 bis 4, fliessend)
  uniform float uFokus;  // 0 freie Partitur, 1 Spotlight auf uAktiv
  attribute vec3 aStart;
  attribute vec4 aZiel;   // x, y, Gruppe (Stufe 0 bis 4), Typ (0 fliessend, 1 Note)
  attribute vec4 aZufall; // Verzögerung, Grösse, Tempo, Phase
  varying float vAlpha;
  ${welle}
  void main() {
    float e = smoothstep(aZufall.x, aZufall.x + 0.4, uFortschritt);
    e = e * e * (3.0 - 2.0 * e);
    float t = uZeit * aZufall.z;
    vec3 rausch = aStart + vec3(sin(t + aZufall.w), cos(t * 0.8 + aZufall.w * 1.7), sin(t * 0.6 + aZufall.w * 0.5)) * 0.18;

    vec3 ziel = vec3(aZiel.x, aZiel.y, ${LINIEN_Z.toFixed(1)});
    if (aZiel.w < 0.5) {
      float halb = uBreite * 0.5;
      ziel.x = mod(aZiel.x + halb + uZeit * aZufall.z * 0.25, uBreite) - halb;
    }
    ziel.y += welle(ziel.x, uZeit);

    vec3 pos = mix(rausch, ziel, e);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    // Spotlight: Noten der aktiven Stufe heller und grösser, alles andere tritt zurück
    float naehe = (1.0 - clamp(abs(aZiel.z - uAktiv), 0.0, 1.0)) * aZiel.w;
    float betonung = mix(1.0, mix(0.35, 1.5, naehe), uFokus);
    gl_PointSize = aZufall.y * uPixel * (8.0 / -mv.z) * mix(1.0, mix(0.9, 1.35, naehe), uFokus);
    vAlpha = (0.5 + 0.5 * e) * (0.75 + 0.25 * sin(t * 2.0 + aZufall.w)) * betonung;
  }
`;

const punkteFragment = /* glsl */ `
  uniform vec3 uFarbe;
  uniform float uDeckkraft;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(1.0 - smoothstep(0.0, 0.5, d), 1.8);
    gl_FragColor = vec4(uFarbe, a * vAlpha * uDeckkraft);
  }
`;

// Kleiner deterministischer Zufall, damit die Partitur bei jedem Besuch gleich aussieht.
function zufallsquelle(saat: number) {
  let s = saat >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PartiturOptionen {
  breite: number;       // Weltbreite der Partitur
  wolkeBreite: number;  // Ausdehnung der Startwolke
  noten: number;        // Anzahl Noten
  proKopf: number;      // Partikel pro Notenkopf
  proHals: number;      // Partikel pro Notenhals
  fliessend: number;    // Partikel, die den Linien entlang fliessen
  mitteY: number;
}

export function erstellePartitur(o: PartiturOptionen) {
  const zufall = zufallsquelle(1997);
  const halb = o.breite / 2;
  const linienY = [-2, -1, 0, 1, 2].map((i) => o.mitteY + i * LINIEN_ABSTAND);

  // Linien als dünne Streifen mit vielen Stützpunkten, damit die Welle weich bleibt.
  const SEGMENTE = 160;
  const pos: number[] = [];
  const seite: number[] = [];
  const index: number[] = [];
  linienY.forEach((y, li) => {
    const basis = li * (SEGMENTE + 1) * 2;
    for (let k = 0; k <= SEGMENTE; k++) {
      const x = -halb + (o.breite * k) / SEGMENTE;
      pos.push(x, y, LINIEN_Z, x, y, LINIEN_Z);
      seite.push(-1, 1);
      if (k < SEGMENTE) {
        const a = basis + k * 2;
        index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
  });
  const linienGeo = new BufferGeometry();
  linienGeo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  linienGeo.setAttribute('aSeite', new BufferAttribute(new Float32Array(seite), 1));
  linienGeo.setIndex(index);
  const linienUniforms = {
    uZeit: { value: 0 },
    uDicke: { value: 0.014 },
    uFarbe: { value: new Color() },
    uSichtbar: { value: 0 },
    uHalbBreite: { value: halb },
  };
  const linien = new Mesh(
    linienGeo,
    new ShaderMaterial({
      vertexShader: linienVertex,
      fragmentShader: linienFragment,
      uniforms: linienUniforms,
      transparent: true,
      depthWrite: false,
    }),
  );
  linien.frustumCulled = false;

  // Partikel
  const anzahl = o.noten * (o.proKopf + o.proHals) + o.fliessend;
  const aStart = new Float32Array(anzahl * 3);
  const aZiel = new Float32Array(anzahl * 4);
  const aZufall = new Float32Array(anzahl * 4);
  let n = 0;
  const setze = (x: number, y: number, gruppe: number, typ: number, groesse: number, verzoegerung: number) => {
    aStart.set([
      (zufall() - 0.5) * o.wolkeBreite,
      (zufall() - 0.5) * 4.4,
      -2.5 + zufall() * 2.8,
    ], n * 3);
    aZiel.set([x, y, gruppe, typ], n * 4);
    aZufall.set([verzoegerung, groesse, 0.4 + zufall() * 0.8, zufall() * Math.PI * 2], n * 4);
    n++;
  };

  // Noten: über die Breite verteilt, in fünf Gruppen (eine pro Stufe).
  const rx = LINIEN_ABSTAND * 0.68;
  const ry = LINIEN_ABSTAND * 0.5;
  const neigung = -0.35;
  const hals = LINIEN_ABSTAND * 3.4;
  for (let i = 0; i < o.noten; i++) {
    const gruppe = Math.min(4, Math.floor((i / o.noten) * 5));
    const x = -halb * 0.82 + (o.breite * 0.82 * (i + 0.5)) / o.noten + (zufall() - 0.5) * 0.08;
    const schritt = Math.round(zufall() * 8) - 4; // Halbschritte: auf oder zwischen den Linien
    const y = o.mitteY + schritt * (LINIEN_ABSTAND / 2);
    const halsNachOben = schritt < 0;
    // Gruppen setzen sich von links nach rechts nacheinander, wie eine gespielte Melodie
    const basisVerzoegerung = 0.05 + (i / o.noten) * 0.45;
    for (let k = 0; k < o.proKopf; k++) {
      const w = zufall() * Math.PI * 2;
      const r = Math.sqrt(zufall());
      const lx = Math.cos(w) * rx * r;
      const ly = Math.sin(w) * ry * r;
      setze(
        x + lx * Math.cos(neigung) - ly * Math.sin(neigung),
        y + lx * Math.sin(neigung) + ly * Math.cos(neigung),
        gruppe, 1, 3.2 + zufall() * 3.2, basisVerzoegerung + zufall() * 0.06,
      );
    }
    const halsX = x + (halsNachOben ? rx * 0.92 : -rx * 0.92);
    for (let k = 0; k < o.proHals; k++) {
      const t = k / (o.proHals - 1);
      setze(halsX, y + (halsNachOben ? 1 : -1) * t * hals, gruppe, 1, 2.6 + zufall() * 1.2, basisVerzoegerung + 0.04 + t * 0.06);
    }
  }
  // Fliessendes Licht auf den Linien
  for (let i = 0; i < o.fliessend; i++) {
    const li = Math.floor(zufall() * 5);
    setze((zufall() - 0.5) * o.breite, linienY[li], li, 0, 2.2 + zufall() * 2.6, zufall() * 0.5);
  }

  const punkteGeo = new BufferGeometry();
  // position wird nur für die Bounding-Box gebraucht, die eigentliche Lage rechnet der Shader
  punkteGeo.setAttribute('position', new BufferAttribute(new Float32Array(anzahl * 3), 3));
  punkteGeo.setAttribute('aStart', new BufferAttribute(aStart, 3));
  punkteGeo.setAttribute('aZiel', new BufferAttribute(aZiel, 4));
  punkteGeo.setAttribute('aZufall', new BufferAttribute(aZufall, 4));
  const punkteUniforms = {
    uZeit: { value: 0 },
    uFortschritt: { value: 0 },
    uPixel: { value: 1 },
    uBreite: { value: o.breite },
    uAktiv: { value: 0 },
    uFokus: { value: 0 },
    uFarbe: { value: new Color() },
    uDeckkraft: { value: 1 },
  };
  const punkteMaterial = new ShaderMaterial({
    vertexShader: punkteVertex,
    fragmentShader: punkteFragment,
    uniforms: punkteUniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const punkte = new Points(punkteGeo, punkteMaterial);
  punkte.frustumCulled = false;

  return {
    linien,
    punkte,
    // Mitte der Notengruppe einer Stufe (lokale Koordinaten), Ziel der Kamerafahrt
    gruppenMitte: (gruppe: number) => -halb * 0.82 + (o.breite * 0.82 * (gruppe + 0.5)) / 5,
    linienUniforms,
    punkteUniforms,
    // Dunkel leuchtet das Licht additiv, hell würde additives Licht auf hellem Grund verschwinden.
    setzeFarben(linie: Color, licht: Color, hell: boolean) {
      linienUniforms.uFarbe.value.copy(linie);
      punkteUniforms.uFarbe.value.copy(licht);
      punkteMaterial.blending = hell ? NormalBlending : AdditiveBlending;
      punkteMaterial.needsUpdate = true;
    },
  };
}
