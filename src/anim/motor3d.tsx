import React, { createContext, useContext, useMemo } from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { H, W } from "../lib/colores";
import { azar, easeRetro } from "../lib/anim";
import { ProveedorColor, useColor, useTema } from "./contexto";
import { hexARgb, mezclarHex, normMedidor } from "./retro";
import type { Escena3D, Medidor, Objeto3D } from "./tipos";

const FPS = 60;
/** Escenario 3D del estilo retro: franja central y 350–1450 (arriba el título, abajo el HUD). */
const RETRO_Y0 = 350, RETRO_ALTO = 1100, RETRO_ALTO_SIN_HUD = 1450;

/** Los contextos de React NO cruzan el <Canvas> de R3F (es otra raíz): se vuelven a montar dentro con estos valores. */
const MedidoresCtx = createContext<Medidor[]>([]);
const LuzCtx = createContext<[number, number, number]>([0.4, 0.8, 0.5]);
const AltoCtx = createContext<number>(RETRO_ALTO);

/* ───────────────────────── cámara orbital ───────────────────────── */

/** Órbita suave que termina justo al acabar la escena. Clásico: spring sin rebote; retro: cubic-bezier(0.22,1,0.36,1). */
const Camara: React.FC<{ cam: Escena3D["camara"]; dur: number; retro: boolean }> = ({ cam, dur, retro }) => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const total = Math.max(1, Math.round(dur * FPS));
  const p = retro ? easeRetro(Math.min(1, frame / total)) : spring({ frame, fps: FPS, durationInFrames: total, config: { damping: 200 } });
  const lerp = (a: number, b: number) => a + (b - a) * p;
  const ang = (lerp(cam.anguloInicio, cam.anguloFin) * Math.PI) / 180;
  const r = lerp(cam.radio, cam.radioFin);
  camera.position.set(cam.mirarX + Math.sin(ang) * r, lerp(cam.altura, cam.alturaFin), cam.mirarZ + Math.cos(ang) * r);
  camera.lookAt(cam.mirarX, cam.mirarY, cam.mirarZ);
  const pc = camera as THREE.PerspectiveCamera;
  if (pc.fov !== cam.fov) {
    pc.fov = cam.fov;
    pc.updateProjectionMatrix();
  }
  return null;
};

/* ───────────────────────── entrada de cada objeto ───────────────────────── */

const Entrada: React.FC<{ o: Pick<Objeto3D, "t" | "dur" | "entrada" | "giro">; x?: number; y?: number; z?: number; retraso?: number; children: React.ReactNode }> = ({ o, x = 0, y = 0, z = 0, retraso = 0, children }) => {
  const frame = useCurrentFrame();
  const { paleta } = useTema();
  const retro = paleta.estilo === "retro";
  const ini = Math.round((o.t + retraso) * FPS);
  if (frame < ini) return null;
  const f = frame - ini;
  const dur = Math.max(6, Math.round(o.dur * FPS));
  const k = o.entrada;
  const p = k === "ninguna" ? 1 : retro ? easeRetro(Math.min(1, f / dur)) : spring({ frame: f, fps: FPS, durationInFrames: dur, config: k === "caer" ? { damping: 11, stiffness: 120 } : { damping: 18, stiffness: 110 } });
  const t = frame / FPS;
  let escala: [number, number, number] = [1, 1, 1];
  let dy = 0;
  if (k === "crecer") escala = [Math.max(0.001, 0.3 + 0.7 * p), Math.max(0.001, p), Math.max(0.001, 0.3 + 0.7 * p)];
  else if (k === "caer") dy = (1 - p) * 9;
  else if (k === "aparecer") {
    const s = 0.7 + 0.3 * Math.min(1, p);
    escala = [s, s, s];
  }
  return (
    <group position={[x, y + dy, z]} scale={escala} rotation={[0, ((o.giro * (t - o.t)) * Math.PI) / 180, 0]}>
      {children}
    </group>
  );
};

/* ───────────────────────── geometrías (con caché) ───────────────────────── */

const cache = new Map<string, THREE.BufferGeometry>();
const geo = (clave: string, crear: () => THREE.BufferGeometry): THREE.BufferGeometry => {
  let g = cache.get(clave);
  if (!g) cache.set(clave, (g = crear()));
  return g;
};
const gCaja = (w: number, h: number, d: number) => geo(`caja${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0));
const gCil = (r: number, h: number) => geo(`cil${r},${h}`, () => new THREE.CylinderGeometry(r, r, h, 48).translate(0, h / 2, 0));
const gEsf = (r: number) => geo(`esf${r}`, () => new THREE.SphereGeometry(r, 48, 32));
const gCono = (r: number, h: number, seg: number) => geo(`cono${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg).translate(0, h / 2, 0));
const gToro = (r: number, g: number) => geo(`toro${r},${g}`, () => new THREE.TorusGeometry(r, g, 20, 96).rotateX(Math.PI / 2));

/* ───────────────────────── cel-shading (NPR) ───────────────────────── */

/**
 * Sombreado no fotorrealista de 3 niveles DUROS: zona iluminada (luz) · tono base · zona en sombra = semitono de puntos a 45°.
 * Los colores se escriben tal cual (sin conversión de espacio de color) para que el hexadecimal que sale en pantalla sea el del brief.
 */
const VERT_NPR = `varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG_NPR = `
uniform vec3 uBase; uniform vec3 uLuz; uniform vec3 uSombra; uniform vec3 uDir; uniform float uCelda;
varying vec3 vN;
void main(){
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) { n = -n; }
  float d = dot(n, normalize(uDir));
  vec3 col = uBase;
  if (d > 0.55) { col = uLuz; }
  else if (d <= 0.12) {
    // semitono: retícula de puntos girada 45°; los puntos crecen cuanto más oscura es la zona
    vec2 q = mat2(0.70710678, -0.70710678, 0.70710678, 0.70710678) * gl_FragCoord.xy / uCelda;
    float r = length(fract(q) - 0.5);
    float radio = mix(0.28, 0.52, clamp((0.12 - d) * 1.5, 0.0, 1.0));
    if (r < radio) { col = uSombra; }
  }
  gl_FragColor = vec4(col, 1.0);
}`;
const VERT_CONTORNO = `uniform vec2 uRes; uniform float uPx;
void main(){
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vec3 nv = normalize(normalMatrix * normal);
  vec2 nc = projectionMatrix[0].xy * nv.x + projectionMatrix[1].xy * nv.y + projectionMatrix[2].xy * nv.z;
  nc = normalize(nc + vec2(1e-6));
  clip.xy += nc * (uPx * 2.0 / uRes) * clip.w;
  gl_Position = clip;
}`;
const FRAG_CONTORNO = `uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor, 1.0); }`;

const matCache = new Map<string, THREE.ShaderMaterial>();
const matNPR = (base: string, luz: string, sombra: string, dir: [number, number, number], abierto = false): THREE.ShaderMaterial => {
  const clave = `${base}${luz}${sombra}${dir.map((x) => x.toFixed(2))}${abierto}`;
  let m = matCache.get(clave);
  if (!m) {
    m = new THREE.ShaderMaterial({
      vertexShader: VERT_NPR,
      fragmentShader: FRAG_NPR,
      uniforms: { uBase: { value: new THREE.Vector3(...hexARgb(base)) }, uLuz: { value: new THREE.Vector3(...hexARgb(luz)) }, uSombra: { value: new THREE.Vector3(...hexARgb(sombra)) }, uDir: { value: new THREE.Vector3(...dir) }, uCelda: { value: 9 } },
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      side: abierto ? THREE.DoubleSide : THREE.FrontSide,
    });
    matCache.set(clave, m);
  }
  return m;
};
const matContorno = (color: string, alto: number): THREE.ShaderMaterial => {
  const clave = `c${color}${alto}`;
  let m = matCache.get(clave);
  if (!m) {
    m = new THREE.ShaderMaterial({ vertexShader: VERT_CONTORNO, fragmentShader: FRAG_CONTORNO, side: THREE.BackSide, uniforms: { uColor: { value: new THREE.Vector3(...hexARgb(color)) }, uRes: { value: new THREE.Vector2(W, alto) }, uPx: { value: 2 } } });
    matCache.set(clave, m);
  }
  return m;
};

/** Casco invertido: copia con normales suavizadas (sin grietas en las aristas) que se infla 2 px en pantalla → contorno negro continuo. */
const cascos = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
const cascoDe = (g: THREE.BufferGeometry): THREE.BufferGeometry => {
  let h = cascos.get(g);
  if (!h) {
    const c = g.clone();
    c.deleteAttribute("normal");
    c.deleteAttribute("uv");
    h = mergeVertices(c, 1e-3);
    h.computeVertexNormals();
    cascos.set(g, h);
  }
  return h;
};
const aristas = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
const aristasDe = (g: THREE.BufferGeometry): THREE.BufferGeometry => {
  let a = aristas.get(g);
  if (!a) aristas.set(g, (a = new THREE.EdgesGeometry(g, 25)));
  return a;
};

/**
 * CelHalftoneMaterial: material NPR reutilizable (cel-shading de 3 niveles + semitono a 45° en la sombra). Los colores son hex EXACTOS.
 * Uso: <mesh geometry={g}><CelHalftoneMaterial color={THEME.red} luz={THEME.salmon} sombra={THEME.dark} /></mesh>
 * (el contorno negro de 2 px y las aristas los añade <Malla>, que es lo que usan todos los objetos del motor).
 */
export const CelHalftoneMaterial: React.FC<{ color: string; luz?: string; sombra?: string; direccion?: [number, number, number] }> = ({ color, luz, sombra = "#0B0C10", direccion }) => {
  const dir = useContext(LuzCtx);
  return <primitive object={matNPR(color, luz ?? mezclarHex(color, "#FFFFFF", 0.5), sombra, direccion ?? dir)} attach="material" />;
};

const Material: React.FC<{ color: string; emisivo?: boolean; opacidad?: number }> = ({ color, emisivo, opacidad = 1 }) => (
  <meshStandardMaterial color={color} roughness={0.55} metalness={0.12} emissive={emisivo ? color : "#000000"} emissiveIntensity={emisivo ? 0.7 : 0} transparent={opacidad < 1} opacity={opacidad} />
);

/**
 * Una malla en el estilo de la escena: clásico = material estándar con luces; retro = cel-shading + contorno + aristas.
 * `token` es el nombre de color de la paleta (primario, acento…).
 */
const Malla: React.FC<{ g: THREE.BufferGeometry; token: string; emisivo?: boolean; pos?: [number, number, number]; rot?: [number, number, number]; mat?: React.ReactNode; alambre?: boolean; abierto?: boolean }> = ({ g, token, emisivo, pos, rot, mat, alambre, abierto }) => {
  const c = useColor();
  const { paleta, tema } = useTema();
  const dir = useContext(LuzCtx);
  const alto = useContext(AltoCtx);
  const base = c(token);
  if (paleta.estilo !== "retro") {
    return (
      <mesh geometry={g} position={pos} rotation={rot}>
        {mat ?? <Material color={base} emisivo={emisivo} />}
      </mesh>
    );
  }
  const k = tema === "claro" ? paleta.claro : paleta.oscuro;
  const sombra = k.sombra ?? "#0B0C10";
  // la cara iluminada del objeto de estudio (primario) es la «luz» del brief; el resto aclara su propio tono
  const luz = token === "primario" && k.luz ? k.luz : mezclarHex(base, "#FFFFFF", 0.5);
  const m = matNPR(emisivo ? luz : base, luz, sombra, dir, abierto);
  // «wireframe parcial»: solo las divisiones de los segmentos (aristas entre caras con > 3°), sin las diagonales de los triángulos
  const divisiones = useMemo(() => (alambre ? new THREE.EdgesGeometry(g, 3) : null), [alambre, g]);
  return (
    <group position={pos} rotation={rot}>
      <mesh geometry={g} material={m} />
      {/* las superficies abiertas no tienen «dentro»: no llevan casco invertido; su borde sale de las aristas */}
      {!abierto && <mesh geometry={cascoDe(g)} material={matContorno(sombra, alto)} />}
      <lineSegments geometry={aristasDe(g)}>
        <lineBasicMaterial color={sombra} />
      </lineSegments>
      {divisiones && (
        <lineSegments geometry={divisiones}>
          <lineBasicMaterial color={sombra} transparent opacity={0.5} />
        </lineSegments>
      )}
    </group>
  );
};

/* ───────────────────────── objetos ───────────────────────── */

/** Textura de ventanas: 4 ventanas por baldosa, algunas apagadas (determinista por semilla). */
function texturaVentanas(base: string, vidrio: string, luz: string, semilla: number): { mapa: THREE.CanvasTexture; emi: THREE.CanvasTexture } {
  const mk = (rellenar: (g: CanvasRenderingContext2D, i: number, on: boolean) => void, fondo: string) => {
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 64;
    const g = cv.getContext("2d")!;
    g.fillStyle = fondo;
    g.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 4; i++) rellenar(g, i, azar(semilla * 7 + i * 13) > 0.38);
    const tx = new THREE.CanvasTexture(cv);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  };
  const rect = (g: CanvasRenderingContext2D, i: number, color: string) => {
    g.fillStyle = color;
    g.fillRect(i * 64 + 14, 14, 36, 36);
  };
  return {
    mapa: mk((g, i) => rect(g, i, vidrio), base),
    emi: mk((g, i, on) => on && rect(g, i, luz), "#000000"),
  };
}

const Edificio: React.FC<{ o: any }> = ({ o }) => {
  const c = useColor();
  const { paleta } = useTema();
  const retro = paleta.estilo === "retro";
  const base = c(o.color);
  const alto = o.pisos * 0.42;
  const tex = useMemo(() => (retro ? null : texturaVentanas(base, new THREE.Color(base).multiplyScalar(0.45).getStyle(), c("acento"), Math.round(o.x * 10 + o.z * 3 + o.pisos))), [base, o.x, o.z, o.pisos, retro]);
  const cols = Math.max(1, Math.round(((o.w + o.d) / 2) / 0.5 / 4));
  if (tex) {
    tex.mapa.repeat.set(cols, o.pisos);
    tex.emi.repeat.set(cols, o.pisos);
  }
  const g = gCaja(o.w, alto, o.d);
  // retro: líneas horizontales en cada piso (el «wireframe parcial» de las divisiones del edificio)
  const pisos = useMemo(() => {
    if (!retro) return null;
    const pts: number[] = [];
    for (let i = 1; i < o.pisos; i++) {
      const y = i * 0.42, x = o.w / 2 + 0.002, z = o.d / 2 + 0.002;
      pts.push(-x, y, z, x, y, z, x, y, z, x, y, -z, x, y, -z, -x, y, -z, -x, y, -z, -x, y, z);
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  }, [retro, o.pisos, o.w, o.d]);
  const mat = tex ? <meshStandardMaterial map={tex.mapa} emissiveMap={tex.emi} emissive="#FFFFFF" emissiveIntensity={o.emisivo ? 1.4 : 0.8} roughness={0.5} metalness={0.15} /> : undefined;
  return (
    <Entrada o={o} x={o.x} z={o.z}>
      <Malla g={g} token={o.color} emisivo={o.emisivo} mat={o.ventanas ? mat : undefined} />
      {pisos && (
        <lineSegments geometry={pisos}>
          <lineBasicMaterial color={(paleta.oscuro.sombra ?? "#0B0C10")} transparent opacity={0.55} />
        </lineSegments>
      )}
      {o.remate === "antena" && <Malla g={gCil(0.05, 1.2)} token="acento" emisivo pos={[0, alto, 0]} />}
      {o.remate === "piramide" && <Malla g={gCono(Math.max(o.w, o.d) * 0.72, 1, 4)} token="acento" emisivo={o.emisivo} pos={[0, alto, 0]} rot={[0, Math.PI / 4, 0]} />}
    </Entrada>
  );
};

const Extrusion: React.FC<{ o: any }> = ({ o }) => {
  const g = useMemo(() => {
    const s = new THREE.Shape();
    o.puntos.forEach((p: { x: number; z: number }, i: number) => (i ? s.lineTo(p.x, -p.z) : s.moveTo(p.x, -p.z)));
    s.closePath();
    const e = new THREE.ExtrudeGeometry(s, { depth: o.h, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
    e.rotateX(-Math.PI / 2);
    return e;
  }, [o.puntos, o.h]);
  return (
    <Entrada o={o} x={o.x} y={o.y} z={o.z}>
      <Malla g={g} token={o.color} emisivo={o.emisivo} />
    </Entrada>
  );
};

const Barras: React.FC<{ o: any }> = ({ o }) => {
  const datos = o.datos as number[];
  const max = Math.max(...datos, 1e-9);
  const total = datos.length * o.w + (datos.length - 1) * o.sep;
  return (
    <>
      {datos.map((v, i) => {
        const h = Math.max(0.05, (v / max) * o.hmax);
        const x = o.x - total / 2 + o.w / 2 + i * (o.w + o.sep);
        const token = v === max && o.color !== "acento" ? "acento" : o.color;
        return (
          <Entrada key={i} o={o} x={x} z={o.z} retraso={i * 0.16}>
            <Malla g={gCaja(o.w, h, o.w)} token={token} emisivo={o.emisivo || token === "acento"} />
          </Entrada>
        );
      })}
    </>
  );
};

const Ciudad: React.FC<{ o: any }> = ({ o }) => {
  const celdas = [];
  for (let f = 0; f < o.filas; f++)
    for (let k = 0; k < o.columnas; k++) {
      const i = f * o.columnas + k;
      const a = azar(o.semilla * 31 + i);
      const alto = 0.5 + a * a * 4.2;
      celdas.push({ i, x: (k - (o.columnas - 1) / 2) * 1.7, z: (f - (o.filas - 1) / 2) * 1.7, alto, w: 1.0 + azar(i + o.semilla) * 0.35 });
    }
  return (
    <>
      {celdas.map((q) => {
        const dest = o.resaltar === q.i;
        const alto = dest ? Math.max(q.alto, 3.6) : q.alto;
        const token = dest ? "acento" : q.i % 3 === 0 ? "suave" : o.color;
        return (
          <Entrada key={q.i} o={o} x={q.x} z={q.z} retraso={(q.i / celdas.length) * 0.9}>
            <Malla g={gCaja(+q.w.toFixed(2), +alto.toFixed(2), +q.w.toFixed(2))} token={token} emisivo={dest || o.emisivo} />
          </Entrada>
        );
      })}
    </>
  );
};

const Casa: React.FC<{ o: any }> = ({ o }) => {
  const techo = o.color === "acento" ? "primario" : "acento";
  const geoTecho = useMemo(() => {
    const s = new THREE.Shape();
    const hw = o.w / 2 + 0.25;
    s.moveTo(-hw, 0);
    s.lineTo(hw, 0);
    s.lineTo(0, o.h * 0.55);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: o.d + 0.5, bevelEnabled: false });
    g.translate(0, 0, -(o.d + 0.5) / 2);
    return g;
  }, [o.w, o.d, o.h]);
  return (
    <Entrada o={o} x={o.x} z={o.z}>
      <Malla g={gCaja(o.w, o.h, o.d)} token={o.color} emisivo={o.emisivo} />
      <Malla g={geoTecho} token={techo} pos={[0, o.h, 0]} />
      <Malla g={gCaja(Math.min(0.9, +(o.w * 0.28).toFixed(2)), +(o.h * 0.64).toFixed(2), 0.05)} token="acento" emisivo pos={[0, 0, o.d / 2 + 0.01]} />
    </Entrada>
  );
};

/* ───────────────────────── modelo paramétrico (estilo retro) ───────────────────────── */

/**
 * Geometría que se DEFORMA según tres parámetros 0…1 (cada uno puede estar atado a un medidor del HUD).
 *   toroide: p1 radio mayor · p2 grosor del tubo · p3 ondulación   |  esfera: p1 radio · p2 estiramiento vertical · p3 picos
 *   columna: p1 altura · p2 radio · p3 conicidad                    |  superficie: p1 amplitud · p2 frecuencia · p3 ondulación
 */
function geometriaModelo(forma: string, p1: number, p2: number, p3: number, t: number): THREE.BufferGeometry {
  if (forma === "columna") {
    const h = 1.5 + p1 * 5, r = 0.55 + p2 * 1.1;
    return new THREE.CylinderGeometry(r * (1 - 0.75 * p3), r, h, 28, 5).translate(0, h / 2, 0);
  }
  if (forma === "esfera") {
    const g = new THREE.SphereGeometry(1, 30, 22);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const radio = 0.8 + p1 * 1.0, estira = 0.65 + p2 * 0.9;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const picos = 1 + p3 * 0.35 * Math.sin(7 * Math.atan2(z, x)) * Math.sin(5 * Math.acos(Math.max(-1, Math.min(1, y))));
      pos.setXYZ(i, x * radio * picos, y * radio * picos * estira, z * radio * picos);
    }
    g.computeVertexNormals();
    return g.translate(0, 2.2, 0);
  }
  if (forma === "superficie") {
    const g = new THREE.PlaneGeometry(5, 5, 24, 24).rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const amp = 0.15 + p1 * 1.2, f = 0.8 + p2 * 2.0, fase = p3 * 6.28 + t * 0.8;
    for (let i = 0; i < pos.count; i++) pos.setY(i, amp * Math.sin(f * pos.getX(i) + fase) * Math.cos(f * pos.getZ(i) * 0.8 - fase * 0.7));
    g.computeVertexNormals();
    return g.translate(0, 1.2, 0);
  }
  // toroide
  const R = 0.9 + p1 * 1.5, r = 0.28 + p2 * 0.5;
  const g = new THREE.TorusGeometry(R, r, 14, 44);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const u = Math.atan2(y, x), cx = R * Math.cos(u), cy = R * Math.sin(u);
    const k = 1 + p3 * 0.45 * Math.sin(5 * u);
    pos.setXYZ(i, cx + (x - cx) * k, cy + (y - cy) * k, z * k);
  }
  g.computeVertexNormals();
  return g.rotateX(-Math.PI / 2.35).translate(0, 2.2, 0);
}

const Modelo: React.FC<{ o: any }> = ({ o }) => {
  const frame = useCurrentFrame();
  const medidores = useContext(MedidoresCtx);
  const t = frame / FPS;
  const valor = (v: number | null, base: number) => (v != null && medidores[v] ? normMedidor(medidores[v], t) : base);
  // los parámetros se redondean para no reconstruir la malla cuando no cambian
  const p1 = +valor(o.v1, o.b1).toFixed(3), p2 = +valor(o.v2, o.b2).toFixed(3), p3 = +valor(o.v3, o.b3).toFixed(3);
  const tq = o.forma === "superficie" ? +t.toFixed(3) : 0;
  const g = useMemo(() => geometriaModelo(o.forma, p1, p2, p3, tq), [o.forma, p1, p2, p3, tq]);
  return (
    <Entrada o={o} x={o.x} z={o.z}>
      <group scale={o.escala}>
        <Malla g={g} token={o.color} emisivo={o.emisivo} alambre abierto={o.forma === "superficie"} />
      </group>
    </Entrada>
  );
};

const Objeto: React.FC<{ o: any }> = ({ o }) => {
  switch (o.tipo) {
    case "edificio":
      return <Edificio o={o} />;
    case "caja":
      return (
        <Entrada o={o} x={o.x} y={o.y} z={o.z}>
          <Malla g={gCaja(o.w, o.h, o.d)} token={o.color} emisivo={o.emisivo} />
        </Entrada>
      );
    case "cilindro":
      return (
        <Entrada o={o} x={o.x} y={o.y} z={o.z}>
          <Malla g={gCil(o.radio, o.h)} token={o.color} emisivo={o.emisivo} />
        </Entrada>
      );
    case "esfera":
      return (
        <Entrada o={o} x={o.x} y={o.y} z={o.z}>
          <Malla g={gEsf(o.radio)} token={o.color} emisivo={o.emisivo} />
        </Entrada>
      );
    case "piramide":
      return (
        <Entrada o={o} x={o.x} y={o.y} z={o.z}>
          <Malla g={gCono(o.radio, o.h, 4)} token={o.color} emisivo={o.emisivo} rot={[0, Math.PI / 4, 0]} />
        </Entrada>
      );
    case "extrusion":
      return <Extrusion o={o} />;
    case "barras3d":
      return <Barras o={o} />;
    case "ciudad":
      return <Ciudad o={o} />;
    case "casa":
      return <Casa o={o} />;
    case "modelo":
      return <Modelo o={o} />;
    case "anillo":
      return (
        <Entrada o={o} x={o.x} y={o.y} z={o.z}>
          <Malla g={gToro(o.radio, o.grosor)} token={o.color} emisivo={o.emisivo} />
        </Entrada>
      );
  }
  return null;
};

/* ───────────────────────── escena ───────────────────────── */

const Suelo: React.FC<{ tipo: Escena3D["suelo"] }> = ({ tipo }) => {
  const c = useColor();
  const { paleta, tema } = useTema();
  const col = tema === "claro" ? paleta.claro : paleta.oscuro;
  if (tipo === "ninguno") return null;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[400, 64]} />
        <meshBasicMaterial color={col.fondoBorde} />
      </mesh>
      {/* plataforma: da apoyo visual a los objetos sin romper el fondo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[11, 72]} />
        <meshBasicMaterial color={paleta.estilo === "retro" ? c("suave") : c("primario")} transparent opacity={paleta.estilo === "retro" ? 0.1 : tema === "claro" ? 0.1 : 0.22} />
      </mesh>
      {tipo === "cuadricula" && <gridHelper args={[160, 80, c("suave"), c("suave")]} position={[0, 0.01, 0]} material-transparent material-opacity={0.3} />}
    </>
  );
};

/**
 * GeometryStage: el escenario 3D. Con HUD ocupa y 350–1450 (1080×1100); con «HUD: OFF» crece hasta y 1800 (1080×1450).
 * En el estilo clásico ocupa todo el lienzo.
 */
export const Escena3DView: React.FC<{ escena: Escena3D & { dur: number }; hud?: boolean }> = ({ escena, hud = true }) => {
  const { paleta, tema } = useTema();
  const c = useColor();
  const col = tema === "claro" ? paleta.claro : paleta.oscuro;
  const retro = paleta.estilo === "retro";
  const l = escena.luces;
  const dirLuz = useMemo<[number, number, number]>(() => {
    const v = new THREE.Vector3(l.dirX, l.dirY, l.dirZ).normalize();
    return [v.x, v.y, v.z];
  }, [l.dirX, l.dirY, l.dirZ]);
  const alto = retro ? (hud ? RETRO_ALTO : RETRO_ALTO_SIN_HUD) : H;
  return (
    <ThreeCanvas width={W} height={alto} flat dpr={1} gl={{ antialias: true, alpha: true }} camera={{ fov: escena.camara.fov, position: [0, escena.camara.altura, escena.camara.radio], near: 0.1, far: 300 }} style={{ position: "absolute", left: 0, top: retro ? RETRO_Y0 : 0 }}>
      {/* el contexto de color no atraviesa el Canvas: se vuelve a montar aquí dentro */}
      <ProveedorColor paleta={paleta.id} tema={tema}>
        <MedidoresCtx.Provider value={escena.medidores ?? []}>
          <AltoCtx.Provider value={alto}>
          <LuzCtx.Provider value={dirLuz}>
            <Camara cam={escena.camara} dur={escena.dur} retro={retro} />
            {escena.suelo !== "ninguno" && <fog attach="fog" args={[col.fondoBorde, escena.camara.radio * (escena.niebla ? 0.9 : 1.8), escena.camara.radio * (escena.niebla ? 2.6 : 5)]} />}
            <ambientLight intensity={l.ambiente * 1.6} />
            <directionalLight position={[l.dirX, l.dirY, l.dirZ]} intensity={l.direccional * 1.5} />
            <hemisphereLight args={[c("blanco"), col.fondoBorde, 0.35]} />
            <pointLight position={[-6, 9, 7]} color={c("acento")} intensity={l.puntoAcento * 120} distance={60} decay={2} />
            <Suelo tipo={escena.suelo} />
            {escena.objetos.map((o, i) => (
              <Objeto key={i} o={o} />
            ))}
          </LuzCtx.Provider>
          </AltoCtx.Provider>
        </MedidoresCtx.Provider>
      </ProveedorColor>
    </ThreeCanvas>
  );
};
