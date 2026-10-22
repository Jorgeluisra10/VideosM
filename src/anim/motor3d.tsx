import React, { useMemo } from "react";
import { spring, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { H, W } from "../lib/colores";
import { azar } from "../lib/anim";
import { useColor, useTema } from "./contexto";
import type { Escena3D, Objeto3D } from "./tipos";

const FPS = 60;

/* ───────────────────────── cámara orbital ───────────────────────── */

/** Órbita suave (spring sin rebote que termina justo al acabar la escena). Se recalcula en cada fotograma. */
const Camara: React.FC<{ cam: Escena3D["camara"]; dur: number }> = ({ cam, dur }) => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const p = spring({ frame, fps: FPS, durationInFrames: Math.max(1, Math.round(dur * FPS)), config: { damping: 200 } });
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
  const ini = Math.round((o.t + retraso) * FPS);
  if (frame < ini) return null;
  const f = frame - ini;
  const dur = Math.max(6, Math.round(o.dur * FPS));
  const k = o.entrada;
  const p = k === "ninguna" ? 1 : spring({ frame: f, fps: FPS, durationInFrames: dur, config: k === "caer" ? { damping: 11, stiffness: 120 } : { damping: 18, stiffness: 110 } });
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

const Material: React.FC<{ color: string; emisivo?: boolean; opacidad?: number }> = ({ color, emisivo, opacidad = 1 }) => (
  <meshStandardMaterial color={color} roughness={0.55} metalness={0.12} emissive={emisivo ? color : "#000000"} emissiveIntensity={emisivo ? 0.7 : 0} transparent={opacidad < 1} opacity={opacidad} />
);

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
  const base = c(o.color);
  const alto = o.pisos * 0.42;
  const tex = useMemo(() => texturaVentanas(base, new THREE.Color(base).multiplyScalar(0.45).getStyle(), c("acento"), Math.round(o.x * 10 + o.z * 3 + o.pisos)), [base, o.x, o.z, o.pisos]);
  const cols = Math.max(1, Math.round(((o.w + o.d) / 2) / 0.5 / 4));
  tex.mapa.repeat.set(cols, o.pisos);
  tex.emi.repeat.set(cols, o.pisos);
  return (
    <Entrada o={o} x={o.x} z={o.z}>
      <mesh position={[0, alto / 2, 0]}>
        <boxGeometry args={[o.w, alto, o.d]} />
        {o.ventanas ? <meshStandardMaterial map={tex.mapa} emissiveMap={tex.emi} emissive="#FFFFFF" emissiveIntensity={o.emisivo ? 1.4 : 0.8} roughness={0.5} metalness={0.15} /> : <Material color={base} emisivo={o.emisivo} />}
      </mesh>
      {o.remate === "antena" && (
        <mesh position={[0, alto + 0.6, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 1.2, 12]} />
          <Material color={c("acento")} emisivo />
        </mesh>
      )}
      {o.remate === "piramide" && (
        <mesh position={[0, alto + 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[Math.max(o.w, o.d) * 0.72, 1, 4]} />
          <Material color={c("acento")} emisivo={o.emisivo} />
        </mesh>
      )}
    </Entrada>
  );
};

const Extrusion: React.FC<{ o: any }> = ({ o }) => {
  const c = useColor();
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    o.puntos.forEach((p: { x: number; z: number }, i: number) => (i ? s.lineTo(p.x, -p.z) : s.moveTo(p.x, -p.z)));
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: o.h, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [o.puntos, o.h]);
  return (
    <Entrada o={o} x={o.x} y={o.y} z={o.z}>
      <mesh geometry={geo}>
        <Material color={c(o.color)} emisivo={o.emisivo} />
      </mesh>
    </Entrada>
  );
};

const Barras: React.FC<{ o: any }> = ({ o }) => {
  const c = useColor();
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
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[o.w, h, o.w]} />
              <Material color={c(token)} emisivo={o.emisivo || token === "acento"} />
            </mesh>
          </Entrada>
        );
      })}
    </>
  );
};

const Ciudad: React.FC<{ o: any }> = ({ o }) => {
  const c = useColor();
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
            <mesh position={[0, alto / 2, 0]}>
              <boxGeometry args={[q.w, alto, q.w]} />
              <Material color={c(token)} emisivo={dest || o.emisivo} />
            </mesh>
          </Entrada>
        );
      })}
    </>
  );
};

const Casa: React.FC<{ o: any }> = ({ o }) => {
  const c = useColor();
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
      <mesh position={[0, o.h / 2, 0]}>
        <boxGeometry args={[o.w, o.h, o.d]} />
        <Material color={c(o.color)} emisivo={o.emisivo} />
      </mesh>
      <mesh geometry={geoTecho} position={[0, o.h, 0]}>
        <Material color={c(techo)} />
      </mesh>
      <mesh position={[0, o.h * 0.32, o.d / 2 + 0.01]}>
        <boxGeometry args={[Math.min(0.9, o.w * 0.28), o.h * 0.64, 0.05]} />
        <Material color={c("acento")} emisivo />
      </mesh>
    </Entrada>
  );
};

const Objeto: React.FC<{ o: any }> = ({ o }) => {
  const c = useColor();
  const col = c(o.color);
  switch (o.tipo) {
    case "edificio":
      return <Edificio o={o} />;
    case "caja":
      return (
        <Entrada o={o} x={o.x} y={o.y} z={o.z}>
          <mesh position={[0, o.h / 2, 0]}>
            <boxGeometry args={[o.w, o.h, o.d]} />
            <Material color={col} emisivo={o.emisivo} />
          </mesh>
        </Entrada>
      );
    case "cilindro":
      return (
        <Entrada o={o} x={o.x} y={o.y} z={o.z}>
          <mesh position={[0, o.h / 2, 0]}>
            <cylinderGeometry args={[o.radio, o.radio, o.h, 48]} />
            <Material color={col} emisivo={o.emisivo} />
          </mesh>
        </Entrada>
      );
    case "esfera":
      return (
        <Entrada o={o} x={o.x} y={o.y} z={o.z}>
          <mesh>
            <sphereGeometry args={[o.radio, 48, 32]} />
            <Material color={col} emisivo={o.emisivo} />
          </mesh>
        </Entrada>
      );
    case "piramide":
      return (
        <Entrada o={o} x={o.x} y={o.y} z={o.z}>
          <mesh position={[0, o.h / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[o.radio, o.h, 4]} />
            <Material color={col} emisivo={o.emisivo} />
          </mesh>
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
    case "anillo":
      return (
        <Entrada o={o} x={o.x} y={o.y} z={o.z}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[o.radio, o.grosor, 20, 96]} />
            <Material color={col} emisivo={o.emisivo} />
          </mesh>
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
        <meshBasicMaterial color={c("primario")} transparent opacity={tema === "claro" ? 0.1 : 0.22} />
      </mesh>
      {tipo === "cuadricula" && <gridHelper args={[160, 80, c("suave"), c("suave")]} position={[0, 0.01, 0]} material-transparent material-opacity={0.3} />}
    </>
  );
};

export const Escena3DView: React.FC<{ escena: Escena3D & { dur: number } }> = ({ escena }) => {
  const { paleta, tema } = useTema();
  const c = useColor();
  const col = tema === "claro" ? paleta.claro : paleta.oscuro;
  const l = escena.luces;
  return (
    <ThreeCanvas width={W} height={H} flat dpr={1} gl={{ antialias: true, alpha: true }} camera={{ fov: escena.camara.fov, position: [0, escena.camara.altura, escena.camara.radio], near: 0.1, far: 300 }} style={{ position: "absolute", left: 0, top: 0 }}>
      <Camara cam={escena.camara} dur={escena.dur} />
      {escena.suelo !== "ninguno" && <fog attach="fog" args={[col.fondoBorde, escena.camara.radio * (escena.niebla ? 0.9 : 1.8), escena.camara.radio * (escena.niebla ? 2.6 : 5)]} />}
      <ambientLight intensity={l.ambiente * 1.6} />
      <directionalLight position={[l.dirX, l.dirY, l.dirZ]} intensity={l.direccional * 1.5} />
      <hemisphereLight args={[c("blanco"), col.fondoBorde, 0.35]} />
      <pointLight position={[-6, 9, 7]} color={c("acento")} intensity={l.puntoAcento * 120} distance={60} decay={2} />
      <Suelo tipo={escena.suelo} />
      {escena.objetos.map((o, i) => (
        <Objeto key={i} o={o} />
      ))}
    </ThreeCanvas>
  );
};
