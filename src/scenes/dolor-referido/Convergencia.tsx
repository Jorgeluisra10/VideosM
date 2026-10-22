import React from "react";
import { Easing } from "remotion";
import { C } from "../../lib/colores";
import { onda, pop, prog, useT } from "../../lib/anim";
import { tiempoDe } from "../../lib/voz";
import { Brazo } from "../../components/anatomia/Cuerpo";
import { Cerebro, CEREBRO } from "../../components/anatomia/Cerebro";
import { CorteMedula, enCorte } from "../../components/anatomia/CorteMedula";
import { Corazon } from "../../components/anatomia/Corazon";
import { Aros, Etiqueta, Halo, Impulso, Trazo } from "../../components/svg/primitivas";
import type { EscenaProps } from "../tipos";

const CORTE = { x: 540, y: 1040, e: 1 };
const SOMA = enCorte(CORTE.x, CORTE.y, CORTE.e, -60, -95);
const CEREBRO_POS = { x: 540, y: -10, e: 1.1 };
const PAN = 880;

const HEART = { x: 250, y: 520, e: 0.36 };
const ARM = { x: 690, y: 392, e: 0.6 };

const FIBRA_CORAZON = `M 250,628 C 250,742 392,772 430,846 C 446,876 452,892 ${SOMA.x - 3},${SOMA.y - 14}`;
const FIBRA_BRAZO = `M 731,548 C 731,700 548,772 488,846 C 470,872 464,890 ${SOMA.x + 3},${SOMA.y - 14}`;
const AXON =
  "M 459,912 C 470,990 524,1052 570,1068 C 632,1080 690,1052 708,996 C 728,900 730,780 712,660 C 696,540 664,420 640,300 C 616,180 584,80 556,24 C 548,8 540,0 536,-6";
const A_CORTEZA = "M 536,-6 C 560,-30 580,-60 588,-120 C 594,-160 598,-190 604,-215";

const DENDRITAS = [
  "M -18,-18 C -34,-40 -44,-52 -62,-62 M -44,-50 C -52,-60 -54,-72 -50,-84",
  "M -4,-26 C -8,-52 -2,-70 8,-88 M 4,-70 C 16,-76 26,-86 28,-98",
  "M 16,-20 C 36,-40 56,-46 72,-44 M 52,-44 C 58,-58 66,-64 76,-66",
  "M -26,2 C -50,0 -66,-8 -82,-22",
  "M 24,8 C 46,14 62,10 80,0",
  "M -14,24 C -30,40 -50,44 -64,40",
];

/** 20,5–25,5 s · dos señales, una neurona, y la vía sube al tálamo y a la corteza */
export const Convergencia: React.FC<EscenaProps> = ({ ini }) => {
  const t = useT();
  const T = {
    senales: tiempoDe("señales"),
    convergen: tiempoDe("convergen"),
    misma: tiempoDe("misma"),
    neurona: tiempoDe("neurona,"),
    sube: tiempoDe("sube"),
    talamo: tiempoDe("tálamo"),
    corteza: tiempoDe("corteza"),
  };
  const panIni = T.sube - 0.2;
  const pan = PAN * prog(t, panIni, 1.25, Easing.inOut(Easing.cubic));
  const somaK = pop(t, T.convergen);
  const brilloSoma = prog(t, T.convergen, 0.4);

  const bajo = 1 - prog(t, panIni + 0.45, 0.9);

  return (
    <g transform={`translate(0 ${pan})`}>
      <g opacity={bajo}>
      <CorteMedula x={CORTE.x} y={CORTE.y} escala={CORTE.e} t0={ini - 0.05} />

      {/* Fuentes: corazón y brazo */}
      <Corazon x={HEART.x} y={HEART.y} escala={HEART.e} t0={T.senales - 0.35} bpm={90} vasos={false} coronarias={T.senales} dolor={{ t: T.senales, intensidad: 0.7 }} tinte="rgba(239,68,68,0.28)" />
      <Brazo x={ARM.x} y={ARM.y} escala={ARM.e} t0={T.senales - 0.2} />

      {/* Fibras aferentes hacia el asta dorsal */}
      <Trazo d={FIBRA_CORAZON} color={C.amarillo} ancho={7} t0={T.senales} dur={1.0} brillo={0.6} />
      <Trazo d={FIBRA_BRAZO} color={C.amarillo} ancho={7} t0={T.senales + 0.15} dur={1.0} brillo={0.6} />
      <Impulso d={FIBRA_CORAZON} t0={T.senales + 1.0} dur={0.9} periodo={1.3} t1={panIni + 0.4} color={C.rojo} />
      <Impulso d={FIBRA_BRAZO} t0={T.senales + 1.15} dur={0.9} periodo={1.3} t1={panIni + 0.4} />

      {/* La neurona de segundo orden: aquí convergen las dos señales */}
      <g transform={`translate(${SOMA.x} ${SOMA.y})`}>
        {DENDRITAS.map((d, i) => (
          <Trazo key={i} d={d} color={C.amarillo} ancho={5} t0={T.convergen + 0.05 * i} dur={0.5} brillo={0.4} />
        ))}
      </g>
      <Halo x={SOMA.x} y={SOMA.y} r={110} color="amarillo" opacidad={0.8 * brilloSoma * (0.7 + 0.3 * onda(t, 0.6))} />
      <g transform={`translate(${SOMA.x} ${SOMA.y}) scale(${Math.min(1.2, somaK)})`} opacity={Math.min(1, somaK)}>
        <circle r={29} fill={C.panel} stroke={C.amarillo} strokeWidth={6} />
        <circle r={29} fill="rgba(250,204,21,0.25)" />
        <circle r={10} fill={C.hueso} opacity={0.65} />
      </g>
      <Aros x={SOMA.x} y={SOMA.y} color={C.amarillo} r0={30} r1={130} n={2} periodo={0.9} t0={T.convergen} t1={T.convergen + 1.5} ancho={5} />

      </g>

      {/* Cerebro */}
      <Cerebro x={CEREBRO_POS.x} y={CEREBRO_POS.y} escala={CEREBRO_POS.e} t0={panIni + 0.1} talamo={T.talamo} corteza={T.corteza} />

      {/* Axón: cruza, entra al tracto espinotalámico y asciende (por encima del tronco cerebral) */}
      <Trazo d={AXON} color={C.amarillo} ancho={9} t0={T.misma + 0.3} dur={1.5} brillo={0.8} curva={Easing.inOut(Easing.quad)} />
      <Impulso d={AXON} t0={T.neurona + 0.5} dur={1.6} periodo={1.2} ancho={10} />
      <Trazo d={A_CORTEZA} color={C.amarillo} ancho={7} t0={T.corteza - 0.45} dur={0.6} brillo={0.7} />
      <Impulso d={A_CORTEZA} t0={T.corteza - 0.1} dur={0.6} periodo={1.2} />
      <Aros x={CEREBRO_POS.x + CEREBRO.talamo.cx * CEREBRO_POS.e} y={CEREBRO_POS.y + CEREBRO.talamo.cy * CEREBRO_POS.e} color={C.amarillo} r0={20} r1={110} n={2} periodo={1.0} t0={T.talamo} t1={T.talamo + 2.5} ancho={4} />

      {/* Etiquetas (viajan con el escenario) */}
      <g opacity={bajo}>
      <Etiqueta x={250} y={672} texto="Corazón" t0={T.senales + 0.1} t1={panIni + 0.3} color={C.rojo} tam={34} />
      <Etiqueta x={880} y={520} texto="Brazo" t0={T.senales + 0.25} t1={panIni + 0.3} color={C.hueso} tam={34} guia={{ x: 752, y: 520 }} />
      <Etiqueta x={225} y={912} texto={["Misma", "neurona"]} t0={T.misma} t1={panIni + 0.5} color={C.amarillo} tam={36} guia={{ x: SOMA.x - 30, y: SOMA.y }} />
      <Etiqueta x={832} y={1138} texto={["Tracto", "espinotalámico"]} t0={T.sube} t1={panIni + 1.3} color={C.amarillo} tam={30} guia={{ x: 708, y: 1000 }} />
      </g>
      <Etiqueta x={826} y={86} texto="Tálamo" t0={T.talamo} color={C.amarillo} tam={40} guia={{ x: CEREBRO_POS.x - 8, y: -2 }} />
      <Etiqueta x={262} y={-168} texto={["Corteza", "somatosensorial"]} t0={T.corteza} color={C.amarillo} tam={32} guia={{ x: 574, y: -150 }} />
    </g>
  );
};
