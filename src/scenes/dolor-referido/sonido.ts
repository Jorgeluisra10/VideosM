import { tiempoDe } from "../../lib/voz";
import type { SfxDef } from "../tipos";

/** Latidos sincronizados con el corazón animado (mismo bpm y mismo arranque). */
const latidos = (desde: number, hasta: number, bpm: number, vol: number): SfxDef[] => {
  const salida: SfxDef[] = [];
  for (let t = desde; t < hasta; t += 60 / bpm) salida.push({ t, tipo: "latido", vol });
  return salida;
};

const pops = (...tiempos: number[]): SfxDef[] => tiempos.map((t) => ({ t, tipo: "pop", vol: 0.3 }));

/** Segundo en que empieza cada escena (ancladas a palabras del guion). */
export const D = {
  oclusion: tiempoDe("Cuando"),
  isquemia: tiempoDe("el músculo"),
  medula: tiempoDe("Esas"),
  convergencia: tiempoDe("Las dos"),
  cerebro: tiempoDe("Como el"),
  cierre: tiempoDe("Eso es"),
};

const dt14 = (tiempoDe("T4") - tiempoDe("T1")) / 3;

export const sfx: SfxDef[] = [
  // transiciones
  ...[D.oclusion, D.isquemia, D.medula, D.convergencia, D.cerebro, D.cierre].map((t): SfxDef => ({ t: t - 0.12, tipo: "whoosh", vol: 0.28 })),
  // latidos del corazón
  ...latidos(0.75, 4.1, 74, 0.2),
  ...latidos(4.52, 6.4, 72, 0.18),
  ...latidos(D.cierre + 0.4 + 0.3, tiempoDe("avisa") + 0.2, 92, 0.16),
  // gancho
  { t: tiempoDe("infarto"), tipo: "thud", vol: 0.5 },
  ...pops(tiempoDe("infarto") + 0.05, tiempoDe("brazo") + 0.05, tiempoDe("no solo")),
  { t: tiempoDe("brazo") + 0.1, tipo: "zap", vol: 0.25 },
  // oclusión
  ...pops(tiempoDe("coronaria")),
  { t: tiempoDe("bloquea"), tipo: "thud", vol: 0.6 },
  ...pops(tiempoDe("bloquea") + 0.12, tiempoDe("bloquea") + 0.5),
  // isquemia
  ...pops(tiempoDe("cardíaco"), tiempoDe("oxígeno"), tiempoDe("sustancias"), tiempoDe("nervios")),
  { t: tiempoDe("libera"), tipo: "zap", vol: 0.22 },
  { t: tiempoDe("activan"), tipo: "zap", vol: 0.25 },
  { t: tiempoDe("sensitivos"), tipo: "zap", vol: 0.3 },
  // médula
  ...pops(tiempoDe("médula"), tiempoDe("brazo", 2), tiempoDe("izquierdo", 2)),
  { t: tiempoDe("T1"), tipo: "tick", vol: 0.35 },
  { t: tiempoDe("T1") + dt14, tipo: "tick", vol: 0.35 },
  { t: tiempoDe("T1") + 2 * dt14, tipo: "tick", vol: 0.35 },
  { t: tiempoDe("T4"), tipo: "tick", vol: 0.4 },
  { t: tiempoDe("ahí"), tipo: "zap", vol: 0.25 },
  // convergencia
  ...pops(tiempoDe("señales") + 0.1, tiempoDe("señales") + 0.25, tiempoDe("misma"), tiempoDe("tálamo"), tiempoDe("corteza")),
  { t: tiempoDe("convergen"), tipo: "zap", vol: 0.4 },
  { t: tiempoDe("sube") - 0.2, tipo: "whoosh", vol: 0.3 },
  { t: tiempoDe("corteza") - 0.1, tipo: "zap", vol: 0.3 },
  // cerebro
  ...pops(tiempoDe("recibir"), tiempoDe("piel") + 0.25, tiempoDe("brazo", 3) + 0.25, tiempoDe("brazo", 3) + 0.45),
  { t: tiempoDe("equivoca"), tipo: "zap", vol: 0.4 },
  { t: tiempoDe("proyecta"), tipo: "thud", vol: 0.45 },
  // cierre
  ...pops(tiempoDe("dolor referido"), tiempoDe("referido"), tiempoDe("sufre")),
  { t: tiempoDe("avisa"), tipo: "ding", vol: 0.4 },
  { t: tiempoDe("avisa"), tipo: "pop", vol: 0.35 },
];
