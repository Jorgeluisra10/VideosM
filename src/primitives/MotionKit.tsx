/**
 * KIT DE PINCELES CINEMATOGRÁFICOS — lo que la IA usa (sin importar nada) para componer cada escena sobre TODO el lienzo 1080×1920.
 * Todo es determinista (nada aleatorio ni de reloj del sistema): cada fotograma se calcula solo desde useCurrentFrame(), que dentro de una escena es LOCAL
 * (el fotograma 0 es el inicio de la escena).
 */
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { dibujarIcono } from "../dsl/elementos/dibujo";
import { azar } from "../lib/anim";

export const W = 1080;
export const H = 1920;
export const FPS = 60;
export const FUENTE = "Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace";

/** Colores de la paleta y duración de la escena: los pone <EscenaLibre>; también se re-montan dentro del Canvas 3D. */
export const ColoresCtx = createContext<Record<string, string>>({});
export const DuracionCtx = createContext<number>(5);

/* ───────────── helpers numéricos y de tiempo ───────────── */

export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
/** cubic-bezier(0.22, 1, 0.36, 1): arranque rápido y frenado muy suave. */
export const ease = Easing.bezier(0.22, 1, 0.36, 1);
/** Pseudoaleatorio determinista 0…1 (el mismo en cada render). */
export const rand = (semilla: number): number => azar(semilla);
/** Oscilación senoidal (flotación orgánica): float(f, 12, 120) sube y baja 12 px cada 2 s. */
export const float = (f: number, amp = 10, periodo = 120, fase = 0): number => Math.sin((f / periodo + fase) * Math.PI * 2) * amp;
/** 0→1 con spring suave que arranca a los `retraso` segundos de la escena. */
export const entra = (f: number, retraso = 0, config: { damping?: number; stiffness?: number; mass?: number } = {}): number => {
  const fr = f - retraso * FPS;
  return fr <= 0 ? 0 : spring({ frame: fr, fps: FPS, config: { damping: 18, stiffness: 110, mass: 0.8, ...config } });
};
/** Segundos transcurridos desde el inicio de la escena. */
export const useT = (): number => useCurrentFrame() / FPS;

/* ───────────── SVG a pantalla completa ───────────── */

export const Svg: React.FC<{ children?: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, ...style }}>
    {children}
  </svg>
);

/* ───────────── 1. Camera2D ───────────── */

type Sacudida = { t: number; amp?: number; dur?: number };

/**
 * Cámara cinematográfica 2D: envuelve la escena y permite zoom hacia un detalle (focusX/focusY en px), paneo (x, y), giro (rotate, grados)
 * y sacudidas de impacto: shake={[{ t: 2.4, amp: 10, dur: 0.45 }]} o shake={2.4}.
 */
export const Camera2D: React.FC<{ zoom?: number; x?: number; y?: number; rotate?: number; focusX?: number; focusY?: number; shake?: Sacudida[] | number; children?: React.ReactNode }> = ({ zoom = 1, x = 0, y = 0, rotate = 0, focusX = W / 2, focusY = H / 2, shake, children }) => {
  const t = useCurrentFrame() / FPS;
  let sx = 0, sy = 0;
  for (const s of typeof shake === "number" ? [{ t: shake }] : shake ?? []) {
    const dur = (s as Sacudida).dur ?? 0.45, amp = (s as Sacudida).amp ?? 10, dt = t - s.t;
    if (dt >= 0 && dt < dur) {
      const k = Math.pow(1 - dt / dur, 2) * amp;
      sx += Math.sin(dt * 90) * k;
      sy += Math.cos(dt * 73) * k * 0.7;
    }
  }
  return <AbsoluteFill style={{ transformOrigin: `${focusX}px ${focusY}px`, transform: `translate(${x + sx}px, ${y + sy}px) rotate(${rotate}deg) scale(${zoom})` }}>{children}</AbsoluteFill>;
};

/* ───────────── 2. OrganicDrawPath ───────────── */

/** Traza (arteria, nervio, ruta, silueta de edificio…) que se dibuja de 0 a 1 siguiendo curvas Bézier; glow añade brillo. Va dentro de <Svg>. */
export const OrganicDrawPath: React.FC<{ d: string; progress?: number; stroke?: string; strokeWidth?: number; glow?: boolean; fill?: string; fillOpacity?: number; dashed?: boolean; opacity?: number; linecap?: "round" | "butt" | "square" }> = ({ d, progress = 1, stroke = "#fff", strokeWidth = 6, glow = false, fill = "none", fillOpacity = 0.22, dashed = false, opacity = 1, linecap = "round" }) => {
  const p = clamp(progress);
  if (p <= 0.001) return null;
  const evo = dashed ? { strokeDasharray: "10 14" } : evolvePath(p, d);
  const op = dashed ? opacity * p : opacity;
  const base = { d, fill: "none", strokeLinecap: linecap, strokeLinejoin: "round" as const, ...evo };
  return (
    <g opacity={op}>
      {fill !== "none" && <path d={d} fill={fill} fillOpacity={fillOpacity * clamp((p - 0.7) / 0.3)} stroke="none" />}
      {glow && (
        <>
          <path {...base} stroke={stroke} strokeWidth={strokeWidth * 3.4} opacity={0.1} />
          <path {...base} stroke={stroke} strokeWidth={strokeWidth * 1.9} opacity={0.2} />
        </>
      )}
      <path {...base} stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
};

/* ───────────── 3. FloatingAnnotation ───────────── */

/** Punto pulsante en (targetX, targetY), línea curva elegante y tarjeta flotante con un dato. Va dentro de <Svg>. dx/dy mueven la tarjeta respecto al punto. */
export const FloatingAnnotation: React.FC<{ targetX: number; targetY: number; label: string; value?: string; color?: string; lineColor?: string; delay?: number; dx?: number; dy?: number; width?: number }> = ({ targetX, targetY, label, value, color = "#FFC500", lineColor, delay = 0, dx, dy, width = 310 }) => {
  const f = useCurrentFrame();
  const C = useContext(ColoresCtx);
  const p = entra(f, delay);
  if (p <= 0.002) return null;
  const alto = value ? 118 : 78;
  const cx = clamp(targetX + (dx ?? (targetX < W / 2 ? 210 : -210)), 70 + width / 2, W - 70 - width / 2);
  const cy = clamp(targetY + (dy ?? (targetY < H / 2 ? 170 : -170)), 110 + alto / 2, H - 110 - alto / 2);
  const ex = targetX < cx ? cx - width / 2 : cx + width / 2;
  const curva = `M ${targetX} ${targetY} Q ${targetX + (ex - targetX) * 0.1} ${cy} ${ex} ${cy}`;
  const evo = evolvePath(clamp(p), curva);
  const lc = lineColor ?? color;
  const pulso = 9 + 3 * Math.sin(f / 7);
  const anillo = ((f - delay * FPS) / 60) % 1;
  return (
    <g>
      <circle cx={targetX} cy={targetY} r={14 + 40 * anillo} fill="none" stroke={lc} strokeWidth={3} opacity={(1 - anillo) * 0.7 * clamp(p)} />
      <circle cx={targetX} cy={targetY} r={pulso} fill={lc} opacity={clamp(p)} />
      <path d={curva} fill="none" stroke={lc} strokeWidth={3.5} strokeLinecap="round" {...evo} />
      <g transform={`translate(${cx} ${cy}) scale(${0.86 + 0.14 * clamp(p)})`} opacity={clamp(p * 1.4)}>
        <rect x={-width / 2} y={-alto / 2} width={width} height={alto} rx={26} fill={C.fondo ?? "#02224E"} fillOpacity={0.72} stroke={color} strokeOpacity={0.6} strokeWidth={2.5} />
        <rect x={-width / 2 + 16} y={-alto / 2 + 22} width={6} height={alto - 44} rx={3} fill={color} />
        <text data-texto={label} x={-width / 2 + 38} y={value ? -20 : 0} dominantBaseline="central" fontFamily={FUENTE} fontWeight={600} fontSize={25} fill={C.suave ?? "#8EA6CC"}>
          {label}
        </text>
        {value ? (
          <text data-texto={value} x={-width / 2 + 38} y={24} dominantBaseline="central" fontFamily={FUENTE} fontWeight={900} fontSize={Math.min(52, (width - 70) / Math.max(3, value.length * 0.6))} fill={color} style={{ letterSpacing: -1 }}>
            {value}
          </text>
        ) : null}
      </g>
    </g>
  );
};

/* ───────────── KineticText (tipografía cinética, HTML) ───────────── */

/**
 * Texto que entra con física spring: "letras" (cada letra sube y se endereza), "palabras", "deslizar" o "escala" (cae desde grande al centro).
 * Está centrado en (x, y) y se ajusta solo dentro de maxAncho. Va FUERA de <Svg>; su orden en el JSX decide si queda detrás o delante de lo 3D.
 */
export const KineticText: React.FC<{ texto: string; x?: number; y?: number; tam?: number; color?: string; delay?: number; modo?: "letras" | "palabras" | "deslizar" | "escala"; peso?: number; alinear?: "centro" | "izquierda"; maxAncho?: number; mono?: boolean }> = ({ texto, x = W / 2, y = H / 2, tam = 96, color = "#fff", delay = 0, modo = "letras", peso = 900, alinear = "centro", maxAncho = 900, mono = false }) => {
  const f = useCurrentFrame();
  const palabras = String(texto).split(/\s+/).filter(Boolean);
  const centro = alinear === "centro";
  const left = centro ? clamp(x, 80 + maxAncho / 2, W - 80 - maxAncho / 2) : clamp(x, 80, W - 80 - maxAncho);
  let letra = 0;
  const estado = (i: number, paso: number) => {
    const p = entra(f, delay + i * (paso / FPS), { damping: 14, stiffness: 140 });
    return p;
  };
  const bloque = modo === "deslizar" || modo === "escala" ? estado(0, 0) : 1;
  return (
    <div
      data-texto={String(texto).slice(0, 40)}
      style={{
        position: "absolute", left, top: y, width: maxAncho, transform: centro ? "translate(-50%, -50%)" : "translate(0, -50%)",
        display: "flex", flexWrap: "wrap", justifyContent: centro ? "center" : "flex-start", gap: `0 ${tam * 0.26}px`, textAlign: centro ? "center" : "left",
        fontFamily: mono ? MONO : FUENTE, fontWeight: peso, fontSize: tam, lineHeight: 1.04, letterSpacing: "-0.02em", color,
        textShadow: "0 6px 34px rgba(0,0,0,0.35)",
        ...(modo === "deslizar" ? { opacity: clamp(bloque * 1.6), transform: `${centro ? "translate(-50%, -50%)" : "translate(0, -50%)"} translateX(${(1 - bloque) * -160}px)` } : {}),
        ...(modo === "escala" ? { opacity: clamp(bloque * 1.8), transform: `${centro ? "translate(-50%, -50%)" : "translate(0, -50%)"} scale(${2.4 - 1.4 * bloque})` } : {}),
      }}
    >
      {palabras.map((pal, wi) => (
        <span key={wi} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
          {pal.split("").map((ch, ci) => {
            const i = letra++;
            const p = modo === "letras" ? estado(i, 2) : modo === "palabras" ? estado(wi, 7) : 1;
            return (
              <span key={ci} style={{ display: "inline-block", opacity: clamp(p * 1.6), transform: modo === "letras" ? `translateY(${(1 - p) * tam * 0.55}px) scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * -9}deg)` : modo === "palabras" ? `translateY(${(1 - p) * tam * 0.4}px) scale(${0.8 + 0.2 * p})` : undefined }}>
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
};

/* ───────────── Icono ───────────── */

/** Icono vectorial por nombre (lucide / healthicons / básicos). Va dentro de <Svg>; (x, y) es el centro. */
export const Icono: React.FC<{ nombre: string; x?: number; y?: number; tam?: number; color?: string }> = ({ nombre, x = W / 2, y = H / 2, tam = 100, color = "#fff" }) => (
  <g transform={`translate(${x} ${y}) scale(${tam / 100})`}>{dibujarIcono(nombre, color)}</g>
);

/* ───────────── 5. AmbientParticles ───────────── */

/** Partículas de fondo o flujo celular/urbano para que el lienzo nunca parezca una diapositiva. Se pinta solo (con su propio <svg>). */
export const AmbientParticles: React.FC<{ count?: number; color?: string; speed?: number; size?: number; shape?: "dot" | "cell" | "line"; flow?: "up" | "drift" | "swirl"; opacity?: number; seed?: number }> = ({ count = 40, color = "#fff", speed = 1, size = 3, shape = "dot", flow = "up", opacity = 0.5, seed = 1 }) => {
  const t = useCurrentFrame() / FPS;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
      {Array.from({ length: Math.min(count, 200) }, (_, i) => {
        const a = rand(seed * 131 + i), b = rand(seed * 71 + i + 17), c = rand(seed * 29 + i + 53);
        const vel = (12 + 30 * c) * speed;
        let px: number, py: number;
        if (flow === "swirl") {
          const ang = t * 0.16 * speed * (c > 0.5 ? 1 : -1) + a * Math.PI * 2, rad = 140 + b * 720;
          px = W / 2 + Math.cos(ang) * rad * 0.82;
          py = H / 2 + Math.sin(ang) * rad * 1.1;
        } else if (flow === "drift") {
          px = (((a * W + t * vel * 0.7) % W) + W) % W;
          py = b * H + Math.sin(t * 0.5 + i) * 34;
        } else {
          px = a * W + Math.sin(t * 0.7 + i) * 18;
          py = (((b * H - t * vel) % H) + H) % H;
        }
        const r = size * (0.5 + c * 1.5);
        const o = opacity * (0.35 + 0.65 * c) * (0.75 + 0.25 * Math.sin(t * 1.6 + i));
        if (shape === "cell")
          return (
            <g key={i} opacity={o}>
              <circle cx={px} cy={py} r={r * 2.6} fill={color} fillOpacity={0.12} stroke={color} strokeOpacity={0.55} strokeWidth={1.6} />
              <circle cx={px + r * 0.5} cy={py - r * 0.3} r={r * 0.9} fill={color} fillOpacity={0.5} />
            </g>
          );
        if (shape === "line") return <line key={i} x1={px} y1={py} x2={px} y2={py + r * 7} stroke={color} strokeWidth={Math.max(1.5, r * 0.4)} strokeLinecap="round" opacity={o} />;
        return <circle key={i} cx={px} cy={py} r={r} fill={color} opacity={o} />;
      })}
    </svg>
  );
};

/* ───────────── 4. Isometric3DStage y ayudantes 3D ───────────── */

const ANGULOS: Record<string, { az: number; el: number }> = { iso: { az: 42, el: 30 }, frontal: { az: 0, el: 9 }, top: { az: 0, el: 78 }, low: { az: 24, el: 3 } };

const Rig: React.FC<{ az: number; el: number; orbit: number; d0: number; d1: number; mira: [number, number, number]; fov: number; dur: number }> = ({ az, el, orbit, d0, d1, mira, fov, dur }) => {
  const f = useCurrentFrame();
  const { camera } = useThree();
  const p = ease(clamp(f / Math.max(1, dur * FPS)));
  const a = ((az + orbit * p) * Math.PI) / 180, e = (el * Math.PI) / 180, d = lerp(d0, d1, p);
  camera.position.set(mira[0] + Math.sin(a) * Math.cos(e) * d, mira[1] + Math.sin(e) * d, mira[2] + Math.cos(a) * Math.cos(e) * d);
  camera.lookAt(mira[0], mira[1], mira[2]);
  const pc = camera as THREE.PerspectiveCamera;
  if (pc.fov !== fov) {
    pc.fov = fov;
    pc.updateProjectionMatrix();
  }
  return null;
};

/**
 * Escenario 3D a pantalla completa (transparente: lo que pongas antes en el JSX queda detrás de los objetos 3D). Luces volumétricas, sombras suaves y
 * flotación orgánica del conjunto (Math.sin(frame / 20)). Los hijos son elementos de three en JSX o los ayudantes Cuerpo3D, Barras3D y Ciudad3D.
 */
export const Isometric3DStage: React.FC<{ cameraAngle?: "iso" | "frontal" | "top" | "low"; lighting?: "clean" | "dramatic"; orbit?: number; distance?: number; dollyTo?: number; lookAt?: [number, number, number]; fov?: number; float?: number; shadows?: boolean; children?: React.ReactNode }> = ({ cameraAngle = "iso", lighting = "clean", orbit = 40, distance = 16, dollyTo, lookAt = [0, 1.5, 0], fov = 38, float: flota = 0.12, shadows = true, children }) => {
  const f = useCurrentFrame();
  const dur = useContext(DuracionCtx);
  const C = useContext(ColoresCtx);
  const ang = ANGULOS[cameraAngle] ?? ANGULOS.iso;
  const dramatico = lighting === "dramatic";
  return (
    <ThreeCanvas width={W} height={H} dpr={1} flat={!dramatico} shadows={shadows ? "soft" : false} gl={{ antialias: true, alpha: true }} camera={{ fov, position: [0, 5, distance], near: 0.1, far: 300 }} style={{ position: "absolute", left: 0, top: 0 }}>
      <ColoresCtx.Provider value={C}>
        <DuracionCtx.Provider value={dur}>
          <Rig az={ang.az} el={ang.el} orbit={orbit} d0={distance} d1={dollyTo ?? distance} mira={lookAt} fov={fov} dur={dur} />
          {dramatico && <fog attach="fog" args={[C.fondo ?? "#02224E", distance * 1.3, distance * 4.5]} />}
          {dramatico ? (
            <>
              <ambientLight intensity={0.55} />
              <directionalLight color={C.acento ?? "#FFC500"} position={[-8, 7, 5]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-radius={7} shadow-bias={-0.0004} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={60} />
              <directionalLight color={C.blanco ?? "#F8FAFC"} position={[7, 5, -6]} intensity={1.5} />
              <pointLight color={C.blanco ?? "#fff"} position={[0, 7, 4]} intensity={90} distance={45} decay={2} />
            </>
          ) : (
            <>
              <ambientLight intensity={0.95} />
              <directionalLight position={[6, 12, 8]} intensity={1.7} castShadow shadow-mapSize={[1024, 1024]} shadow-radius={6} shadow-bias={-0.0004} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={60} />
              <hemisphereLight args={[C.blanco ?? "#fff", C.fondo ?? "#02224E", 0.35]} />
            </>
          )}
          <mesh rotation-x={-Math.PI / 2} position-y={-0.01} receiveShadow>
            <planeGeometry args={[90, 90]} />
            <shadowMaterial opacity={dramatico ? 0.55 : 0.3} />
          </mesh>
          <group position-y={Math.sin(f / 20) * flota} rotation-y={Math.sin(f / 90) * 0.05 * (flota > 0 ? 1 : 0)}>
            {children}
          </group>
        </DuracionCtx.Provider>
      </ColoresCtx.Provider>
    </ThreeCanvas>
  );
};

type V3 = [number, number, number];
const mat = (color: string, emissive?: string, intensidad = 0.6, metal = 0.1, rough = 0.5) => <meshStandardMaterial color={color} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? intensidad : 0} roughness={rough} metalness={metal} />;

/** Figura 3D lista: caja [ancho,alto,fondo], cilindro/cono [radio,alto], esfera [radio], toro [radio,tubo]. pos = base (centro en esfera y toro); crece al entrar. */
export const Cuerpo3D: React.FC<{ forma?: "caja" | "cilindro" | "esfera" | "cono" | "toro"; tam?: number[]; pos?: V3; rot?: V3; color?: string; emissive?: string; metal?: number; rough?: number; delay?: number }> = ({ forma = "caja", tam, pos = [0, 0, 0], rot = [0, 0, 0], color = "#fff", emissive, metal = 0.1, rough = 0.5, delay = 0 }) => {
  const f = useCurrentFrame();
  const p = entra(f, delay);
  if (p <= 0.002) return null;
  const t = tam ?? (forma === "caja" ? [1, 1, 1] : forma === "esfera" ? [0.8] : [0.6, 1.2]);
  let geometria: React.ReactNode, h = 0, uniforme = false;
  if (forma === "caja") { geometria = <boxGeometry args={[t[0] ?? 1, t[1] ?? 1, t[2] ?? 1]} />; h = t[1] ?? 1; }
  else if (forma === "cilindro") { geometria = <cylinderGeometry args={[t[0] ?? 0.6, t[0] ?? 0.6, t[1] ?? 1.2, 40]} />; h = t[1] ?? 1.2; }
  else if (forma === "cono") { geometria = <coneGeometry args={[t[0] ?? 0.6, t[1] ?? 1.2, 40]} />; h = t[1] ?? 1.2; }
  else if (forma === "esfera") { geometria = <sphereGeometry args={[t[0] ?? 0.8, 40, 28]} />; uniforme = true; }
  else { geometria = <torusGeometry args={[t[0] ?? 1, t[1] ?? 0.25, 20, 72]} />; uniforme = true; }
  const s = Math.max(0.001, clamp(p));
  return (
    <group position={pos} rotation={rot} scale={uniforme ? [s, s, s] : [1, s, 1]}>
      <mesh position-y={h / 2} castShadow receiveShadow>
        {geometria}
        {mat(color, emissive, 0.6, metal, rough)}
      </mesh>
    </group>
  );
};

/** Barras 3D financieras que crecen en cascada; la mayor se resalta con el acento. */
export const Barras3D: React.FC<{ datos?: number[]; pos?: V3; ancho?: number; sep?: number; hmax?: number; color?: string; delay?: number }> = ({ datos = [1, 2, 3], pos = [0, 0, 0], ancho = 1, sep = 0.45, hmax = 6, color = "#2F66B8", delay = 0 }) => {
  const f = useCurrentFrame();
  const C = useContext(ColoresCtx);
  const max = Math.max(...datos, 1e-9);
  const total = datos.length * ancho + (datos.length - 1) * sep;
  return (
    <group position={pos}>
      {datos.map((v, i) => {
        const p = entra(f, delay + i * 0.16);
        if (p <= 0.002) return null;
        const h = Math.max(0.05, (v / max) * hmax);
        const mayor = v === max;
        return (
          <group key={i} position={[-total / 2 + ancho / 2 + i * (ancho + sep), 0, 0]} scale={[1, Math.max(0.001, clamp(p)), 1]}>
            <mesh position-y={h / 2} castShadow receiveShadow>
              <boxGeometry args={[ancho, h, ancho]} />
              {mat(mayor ? C.acento ?? "#FFC500" : color, mayor ? C.acento : undefined, 0.5)}
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** Manzanas de ciudad que crecen en cascada; `resaltar` = índice de la que se ilumina con el acento. */
export const Ciudad3D: React.FC<{ filas?: number; columnas?: number; semilla?: number; resaltar?: number; color?: string; delay?: number }> = ({ filas = 5, columnas = 4, semilla = 7, resaltar, color = "#2F66B8", delay = 0 }) => {
  const f = useCurrentFrame();
  const C = useContext(ColoresCtx);
  const celdas: { i: number; x: number; z: number; h: number; w: number }[] = [];
  for (let a = 0; a < filas; a++)
    for (let k = 0; k < columnas; k++) {
      const i = a * columnas + k, r = rand(semilla * 31 + i);
      celdas.push({ i, x: (k - (columnas - 1) / 2) * 1.7, z: (a - (filas - 1) / 2) * 1.7, h: 0.5 + r * r * 4.2, w: 1 + rand(i + semilla) * 0.35 });
    }
  return (
    <group>
      {celdas.map((q) => {
        const p = entra(f, delay + (q.i / celdas.length) * 0.9);
        if (p <= 0.002) return null;
        const dest = resaltar === q.i;
        const h = dest ? Math.max(q.h, 3.6) : q.h;
        return (
          <group key={q.i} position={[q.x, 0, q.z]} scale={[1, Math.max(0.001, clamp(p)), 1]}>
            <mesh position-y={h / 2} castShadow receiveShadow>
              <boxGeometry args={[q.w, h, q.w]} />
              {mat(dest ? C.acento ?? "#FFC500" : q.i % 3 === 0 ? C.suave ?? "#8EA6CC" : color, dest ? C.acento : undefined, 0.6)}
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** Todo lo que ve el código de la IA (el resto del ámbito —C, DUR— lo añade <EscenaLibre>). */
export const AMBITO_KIT: Record<string, unknown> = {
  React, useMemo: React.useMemo, AbsoluteFill, useCurrentFrame, spring, interpolate, Easing, THREE,
  W, H, FPS, FUENTE, MONO,
  useT, entra, float, rand, lerp, clamp, ease,
  Svg, Camera2D, OrganicDrawPath, FloatingAnnotation, KineticText, Icono, AmbientParticles, Isometric3DStage, Cuerpo3D, Barras3D, Ciudad3D,
};
