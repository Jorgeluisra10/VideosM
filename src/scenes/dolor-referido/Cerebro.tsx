import React from "react";
import { C } from "../../lib/colores";
import { onda, prog, useT } from "../../lib/anim";
import { tiempoDe } from "../../lib/voz";
import { Brazo } from "../../components/anatomia/Cuerpo";
import { Cerebro as CerebroPieza } from "../../components/anatomia/Cerebro";
import { Corazon } from "../../components/anatomia/Corazon";
import { Etiqueta, Flecha, Halo, Impulso, RayosDolor, Rotulo, Trazo } from "../../components/svg/primitivas";
import type { EscenaProps } from "../tipos";

const CEREBRO = { x: 540, y: 592, e: 0.86 };
const CORAZON = { x: 250, y: 1120, e: 0.46 };
const BRAZO = { x: 835, y: 845, e: 0.6 };

const CAMINO_PIEL = "M 860,905 C 850,850 700,850 608,796";
const CAMINO_CORAZON = "M 262,1010 C 262,900 470,880 592,796";
const PROYECCION = "M 724,668 C 880,708 930,800 892,896";

/** 25,6–31 s · el cerebro, acostumbrado al dolor de la piel, se equivoca y lo proyecta al brazo */
export const Cerebro: React.FC<EscenaProps> = ({ ini }) => {
  const t = useT();
  const T = {
    cerebro: tiempoDe("cerebro"),
    acostumbrado: tiempoDe("acostumbrado"),
    recibir: tiempoDe("recibir"),
    piel: tiempoDe("piel"),
    equivoca: tiempoDe("equivoca"),
    proyecta: tiempoDe("proyecta"),
    brazo: tiempoDe("brazo", 3),
  };
  const heartFade = 1 - 0.45 * prog(t, T.proyecta, 0.6);

  return (
    <g>
      <CerebroPieza
        x={CEREBRO.x}
        y={CEREBRO.y}
        escala={CEREBRO.e}
        t0={ini - 0.1}
        corteza={T.cerebro}
        confusion={{ t: T.equivoca, fin: T.proyecta + 0.9 }}
      />

      {/* Caminos: el de la piel es ancho y muy transitado; el del corazón, fino y raro */}
      <Trazo d={CAMINO_PIEL} color={C.amarillo} ancho={16} t0={T.acostumbrado} dur={0.9} brillo={0.9} />
      <Trazo d={CAMINO_CORAZON} color={C.amarillo} ancho={5} t0={T.acostumbrado + 0.3} dur={0.9} punteado="10 12" opacidad={0.6} marcha={30} />
      <Impulso d={CAMINO_PIEL} t0={T.recibir} dur={0.9} periodo={0.42} ancho={9} />
      <Impulso d={CAMINO_CORAZON} t0={T.piel + 0.15} dur={0.95} periodo={9} repeticiones={1} color={C.rojo} ancho={8} />

      {/* Fuentes */}
      <g opacity={heartFade}>
        <Corazon x={CORAZON.x} y={CORAZON.y} escala={CORAZON.e} t0={ini + 0.2} bpm={96} vasos={false} coronarias={ini + 0.4} dolor={{ t: ini + 0.3, intensidad: 0.7 }} tinte="rgba(239,68,68,0.28)" />
      </g>
      <Halo x={BRAZO.x + 40} y={BRAZO.y + 220} r={230} color="azul" opacidad={0.55 * prog(t, T.piel, 0.4) * (1 - prog(t, T.proyecta, 0.4))} />
      <Brazo
        x={BRAZO.x}
        y={BRAZO.y}
        escala={BRAZO.e}
        t0={ini + 0.1}
        piel={{ t: T.piel, fin: T.proyecta, color: C.azul }}
        dolor={{ t: T.brazo, dur: 0.7, rayos: true }}
      />

      {/* El cerebro "elige" mal y lo proyecta al brazo */}
      <Rotulo x={860} y={500} texto="?" t0={T.equivoca} t1={T.proyecta + 0.1} tam={200} color={C.amarillo} rot={8 + 8 * (onda(t, 0.9) - 0.5)} />
      <Flecha d={PROYECCION} color={C.rojo} ancho={10} t0={T.proyecta} dur={0.8} cabeza={30} brillo={0.9} />
      <RayosDolor x={BRAZO.x + 72} y={BRAZO.y + 150} r={96} n={9} t0={T.brazo + 0.1} largo={36} arco={[-60, 60]} />

      {/* Etiquetas */}
      <Etiqueta x={845} y={748} texto={["Piel:", "lo habitual"]} t0={T.recibir} t1={T.proyecta} color={C.azul} tam={34} guia={{ x: 800, y: 856 }} />
      <Etiqueta x={240} y={868} texto={["Corazón:", "lo raro"]} t0={T.piel + 0.25} color={C.rojo} tam={34} guia={{ x: 270, y: 944 }} />
      <Etiqueta x={800} y={1228} texto="Dolor percibido" t0={T.brazo + 0.25} color={C.rojo} tam={34} guia={{ x: BRAZO.x + 66, y: BRAZO.y + 360 }} />
      <Etiqueta x={250} y={1262} texto="Origen real" t0={T.brazo + 0.45} color={C.hueso} tam={32} guia={{ x: CORAZON.x, y: CORAZON.y + 100 }} />
    </g>
  );
};
