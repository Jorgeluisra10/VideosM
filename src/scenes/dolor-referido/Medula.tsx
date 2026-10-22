import React from "react";
import { C } from "../../lib/colores";
import { pop, prog, useT } from "../../lib/anim";
import { tiempoDe } from "../../lib/voz";
import { Brazo } from "../../components/anatomia/Cuerpo";
import { CADENA_X, COL, Columna, raizHaciaCordon, yNivel, yRaiz } from "../../components/anatomia/Columna";
import { Corazon } from "../../components/anatomia/Corazon";
import { Aros, Etiqueta, Halo, Impulso, Trazo } from "../../components/svg/primitivas";
import type { EscenaProps } from "../tipos";

const CX = COL.cx;
const HEART = { x: 800, y: 1195, e: 0.5 };
const ARM = { x: 850, y: 405, e: 0.55 };

const NERVIO_CORAZON = `M 745,1130 C 690,1112 640,1088 ${CADENA_X},1022 L ${CADENA_X},${yRaiz(1)}`;
const BRAZO_HACIA_MEDULA = `M 886,540 C 842,566 790,${yRaiz(1)} 700,${yRaiz(1)} L ${CX + 34},${yRaiz(1)}`;
const BRAZO_DESDE_MEDULA = `M ${CX + 34},${yRaiz(1)} L 700,${yRaiz(1)} C 790,${yRaiz(1)} 842,566 886,540`;
const LLAVE = `M 700,${yNivel(1) - 26} L 724,${yNivel(1) - 26} L 724,${yNivel(4) + 26} L 700,${yNivel(4) + 26}`;

/** 12–20,5 s · las fibras suben por la cadena simpática hasta T1–T4, donde también entra el brazo */
export const Medula: React.FC<EscenaProps> = ({ ini }) => {
  const t = useT();
  const T = {
    fibras: tiempoDe("fibras"),
    viajan: tiempoDe("viajan"),
    medula: tiempoDe("médula"),
    segmentos: tiempoDe("segmentos"),
    t1: tiempoDe("T1"),
    t4: tiempoDe("T4"),
    ahi: tiempoDe("ahí"),
    entran: tiempoDe("entran"),
    nervios2: tiempoDe("nervios", 2),
    brazo: tiempoDe("brazo", 2),
    izquierdo: tiempoDe("izquierdo", 2),
  };
  const dt = (T.t4 - T.t1) / 3;
  const resaltado = { 1: T.t1, 2: T.t1 + dt, 3: T.t1 + 2 * dt, 4: T.t4 };
  const periodo = 1.9;
  const rootT0 = T.viajan + 1.3;
  const llegaBrazo = T.brazo + 0.3;

  return (
    <g>
      <Halo x={HEART.x} y={HEART.y} r={250} color="rojo" opacidad={0.6 * prog(t, ini, 0.6)} />
      <Columna t0={ini - 0.1} resaltado={resaltado} brilloMedula={T.medula} />

      {/* Cadena simpática: fila de ganglios paralela a la columna */}
      <Trazo d={`M ${CADENA_X},${yRaiz(0) - 24} L ${CADENA_X},${yRaiz(6) + 24}`} color={C.hueso} ancho={4} t0={ini + 0.3} dur={0.9} opacidad={0.28} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle key={i} cx={CADENA_X} cy={yRaiz(i)} r={10 * Math.min(1, pop(t, ini + 0.5 + i * 0.07))} fill={C.panel} stroke={C.hueso} strokeOpacity={0.55} strokeWidth={3} />
      ))}

      {/* Corazón dolorido */}
      <Corazon x={HEART.x} y={HEART.y} escala={HEART.e} t0={ini - 0.05} bpm={96} vasos={false} coronarias={ini + 0.2} dolor={{ t: ini, intensidad: 0.8 }} tinte="rgba(239,68,68,0.28)" />

      {/* Fibra aferente del corazón → cadena → raíces T1–T4 */}
      <Trazo d={NERVIO_CORAZON} color={C.amarillo} ancho={8} t0={T.fibras} dur={1.3} brillo={0.7} />
      <Impulso d={NERVIO_CORAZON} t0={T.viajan} dur={1.6} periodo={periodo} />
      {[1, 2, 3, 4].map((i) => (
        <g key={i}>
          <Impulso d={raizHaciaCordon(i)} t0={rootT0 + (i - 1) * 0.05} dur={0.55} periodo={periodo} ancho={7} />
        </g>
      ))}
      <Aros x={CX} y={yRaiz(2)} color={C.amarillo} r0={20} r1={120} n={1} periodo={periodo} t0={rootT0 + 0.45} ancho={4} />

      {/* Llave T1–T4 */}
      <Trazo d={LLAVE} color={C.amarillo} ancho={8} t0={T.segmentos} dur={0.8} brillo={0.8} />
      <Etiqueta x={862} y={915} texto={["Segmentos", "T1–T4"]} t0={T.t1} color={C.amarillo} tam={36} guia={{ x: 724, y: yNivel(4) + 26 }} />

      {/* Aquí también entra el nervio del brazo */}
      <Aros x={CX + 34} y={yRaiz(1)} color={C.amarillo} r0={16} r1={110} n={2} periodo={0.9} t0={T.ahi} t1={T.ahi + 1.6} ancho={5} />
      <Trazo d={BRAZO_DESDE_MEDULA} color={C.amarillo} ancho={8} t0={T.entran} dur={1.2} brillo={0.7} />
      <Brazo x={ARM.x} y={ARM.y} escala={ARM.e} t0={T.brazo - 0.3} piel={{ t: T.brazo + 0.3 }} />
      <Impulso d={BRAZO_HACIA_MEDULA} t0={llegaBrazo} dur={1.2} periodo={periodo} />
      <Aros x={CX + 34} y={yRaiz(1)} color={C.amarillo} r0={16} r1={90} n={1} periodo={periodo} t0={llegaBrazo + 1.0} ancho={5} />

      {/* Etiquetas */}
      <Etiqueta x={280} y={1230} texto="Médula espinal" t0={T.medula} tam={34} color={C.amarillo} guia={{ x: CX, y: 1104 }} />
      <Etiqueta x={868} y={742} texto={["Brazo", "izquierdo"]} t0={T.izquierdo - 0.05} color={C.hueso} tam={36} guia={{ x: 892, y: 600 }} />
      <Etiqueta x={868} y={1080} texto={["Fibras del", "corazón"]} t0={T.fibras + 0.3} t1={T.medula + 0.6} color={C.rojo} tam={34} guia={{ x: 700, y: 1100 }} />
    </g>
  );
};
