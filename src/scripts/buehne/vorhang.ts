// Samtvorhang aus zwei Hälften. uOffen (0 bis 1) rafft beide Hälften zur Seite,
// unten stärker als oben, damit die typische schräge Raffung einer Opernbühne entsteht.
import { Color, Mesh, PlaneGeometry, ShaderMaterial } from 'three';

const vertex = /* glsl */ `
  uniform float uOffen;
  uniform float uZeit;
  uniform float uSeite;
  uniform float uHalbBreite;
  uniform float uHoehe;
  varying vec2 vUv;
  varying float vU;
  varying float vRaff;

  void main() {
    vUv = uv;
    // u: 0 am äusseren Rand, 1 an der Bühnenmitte
    float u = uSeite < 0.0 ? uv.x : 1.0 - uv.x;
    float raff = uOffen * (0.76 + 0.12 * (1.0 - uv.y));
    float uNeu = u * (1.0 - raff);
    vU = u;
    vRaff = raff;

    vec3 p = vec3(0.0);
    p.x = uSeite * (uHalbBreite - uNeu * uHalbBreite * 1.02);
    p.y = (uv.y - 0.5) * uHoehe;
    // leichtes Wehen, an der Innenkante stärker
    p.x += sin(p.y * 1.7 + uZeit * 0.5 + u * 4.0) * 0.015 * (0.3 + u);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uTief;
  uniform vec3 uHoch;
  uniform vec3 uSaum;
  uniform float uZeit;
  varying vec2 vUv;
  varying float vU;
  varying float vRaff;

  void main() {
    float f = sin(vU * 26.0 * 3.14159 + sin(vUv.y * 3.0 + uZeit * 0.3) * 0.4);
    float licht = pow(0.5 + 0.5 * f, 1.0 + vRaff * 2.0);
    float oben = smoothstep(0.0, 1.0, vUv.y);
    vec3 c = mix(uTief, uHoch, licht * (0.55 + 0.45 * oben));
    c = mix(c, uSaum, smoothstep(0.985, 0.996, vU) * 0.9);
    c = mix(c, uSaum, (1.0 - smoothstep(0.0, 0.03, vUv.y)) * 0.7);
    gl_FragColor = vec4(c, 1.0);
  }
`;

export interface VorhangFarben { tief: Color; hoch: Color; saum: Color; }

export function erstelleVorhang(farben: VorhangFarben) {
  const geometrie = new PlaneGeometry(1, 1, 90, 24);
  const gemeinsam = {
    uOffen: { value: 0 },
    uZeit: { value: 0 },
    uHalbBreite: { value: 1 },
    uHoehe: { value: 1 },
    uTief: { value: farben.tief.clone() },
    uHoch: { value: farben.hoch.clone() },
    uSaum: { value: farben.saum.clone() },
  };
  const haelfte = (seite: number) => {
    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: { ...gemeinsam, uSeite: { value: seite } },
    });
    const mesh = new Mesh(geometrie, material);
    mesh.frustumCulled = false;
    mesh.position.z = 0.6;
    return mesh;
  };
  const links = haelfte(-1);
  const rechts = haelfte(1);

  return {
    meshes: [links, rechts],
    uniforms: gemeinsam,
    setzeFarben(f: VorhangFarben) {
      gemeinsam.uTief.value.copy(f.tief);
      gemeinsam.uHoch.value.copy(f.hoch);
      gemeinsam.uSaum.value.copy(f.saum);
    },
    setzeGroesse(halbBreite: number, hoehe: number) {
      gemeinsam.uHalbBreite.value = halbBreite;
      gemeinsam.uHoehe.value = hoehe;
    },
  };
}
