import React from "react";
import { C } from "../../lib/colores";
import { Cerebro as CerebroPieza } from "../../components/anatomia/Cerebro";
import { Celula } from "../../components/anatomia/Celula";
import { COL, Columna } from "../../components/anatomia/Columna";
import { Corazon } from "../../components/anatomia/Corazon";
import { CorteMedula } from "../../components/anatomia/CorteMedula";
import { Brazo, Busto } from "../../components/anatomia/Cuerpo";
import { Membrana } from "../../components/anatomia/Membrana";
import { Neurona } from "../../components/anatomia/Neurona";
import { ANCHO_ORGANO, Organo, TIPOS_ORGANO, TipoOrgano } from "../../components/anatomia/Organos";
import { Tubo } from "../../components/svg/primitivas";
import { Punto, pu, puntosValidos, px, py, rutaDe } from "../medidas";
import { Aparece, ElProps, bool, col, num, texto } from "./comun";

export const CorazonEl: React.FC<ElProps> = ({ el, t0, t1 }) => (
  <Aparece t0={t0} t1={t1} fade={0.2}>
    <Corazon
      x={px(el.x)}
      y={py(el.y)}
      escala={pu(el.tam, 38) / 360}
      t0={t0}
      bpm={bool(el.latir, true) ? num(el.bpm, 74, 30, 160) : 0}
      vasos={bool(el.vasos, true)}
      coronarias={t0 + 0.4}
      isquemia={bool(el.isquemia) ? { t: t0 + 1.2, dur: 1.4 } : undefined}
      trombo={bool(el.trombo) ? { t: t0 + 1.0 } : undefined}
      dolor={bool(el.dolor) ? { t: t0 + 0.5 } : undefined}
      flujo={bool(el.flujo) ? { t0: t0 + 0.3 } : undefined}
    />
  </Aparece>
);

export const CerebroEl: React.FC<ElProps> = ({ el, t0, t1 }) => (
  <Aparece t0={t0} t1={t1} fade={0.2}>
    <CerebroPieza
      x={px(el.x)}
      y={py(el.y)}
      escala={pu(el.tam, 50) / 500}
      t0={t0}
      talamo={bool(el.talamo) ? t0 + 0.9 : undefined}
      corteza={bool(el.corteza) ? t0 + 1.3 : undefined}
      confusion={bool(el.confusion) ? { t: t0 + 1.6 } : undefined}
    />
  </Aparece>
);

export const CuerpoEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const e = pu(el.tam, 60) / 620;
  return (
    <Aparece t0={t0} t1={t1} fade={0.2}>
      <Busto x={px(el.x)} y={py(el.y) - 36 * e} escala={e} t0={t0} dolorBrazo={bool(el.dolorBrazo) ? { t: t0 + 0.9 } : undefined} />
    </Aparece>
  );
};

export const BrazoEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const alto = pu(el.tam, 40);
  const e = alto / 514;
  const espejo = bool(el.espejo);
  return (
    <Aparece t0={t0} t1={t1} fade={0.2}>
      <Brazo
        x={px(el.x) - (espejo ? -1 : 1) * 25 * e}
        y={py(el.y) - alto / 2 + 44 * e}
        escala={e}
        espejo={espejo}
        t0={t0}
        dolor={bool(el.dolor) ? { t: t0 + 0.8, dur: 0.8, rayos: true } : undefined}
        piel={bool(el.piel) ? { t: t0 + 0.8, color: col(el.color, "rojo") } : undefined}
      />
    </Aparece>
  );
};

/** "T1-T4" → índices de COL.etiquetas */
function nivelesDe(rango: string): number[] {
  const m = rango.match(/([CT]\d+)\s*(?:-|–|a|hasta)?\s*([CT]?\d+)?/i);
  if (!m) return [];
  const a = m[1].toUpperCase();
  const letra = a[0];
  const ini = Number(a.slice(1));
  const fin = m[2] ? Number(m[2].replace(/\D/g, "")) : ini;
  const res: number[] = [];
  for (let n = Math.min(ini, fin); n <= Math.max(ini, fin); n++) {
    const i = (COL.etiquetas as readonly string[]).indexOf(`${letra}${n}`);
    if (i >= 0) res.push(i);
  }
  return res;
}

export const ColumnaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const e = pu(el.tam, 70) / 700;
  const resaltado: Record<number, number> = {};
  nivelesDe(texto(el.resaltar)).forEach((i, k) => (resaltado[i] = t0 + 0.8 + 0.2 * k));
  return (
    <Aparece t0={t0} t1={t1} fade={0.2}>
      <g transform={`translate(${px(el.x)} ${py(el.y)}) scale(${e}) translate(-430 -788)`}>
        <Columna t0={t0} resaltado={resaltado} brilloMedula={bool(el.brillo, true) ? t0 + 0.4 : undefined} />
      </g>
    </Aparece>
  );
};

export const CorteMedulaEl: React.FC<ElProps> = ({ el, t0, t1 }) => (
  <Aparece t0={t0} t1={t1} fade={0.2}>
    <CorteMedula x={px(el.x)} y={py(el.y)} escala={pu(el.tam, 60) / 600} t0={t0} />
  </Aparece>
);

export const OrganoEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const tipo = (TIPOS_ORGANO as readonly string[]).includes(texto(el.organo)) ? (texto(el.organo) as TipoOrgano) : "hueso";
  return (
    <Aparece t0={t0} t1={t1} fade={0.2}>
      <Organo x={px(el.x)} y={py(el.y)} tipo={tipo} escala={pu(el.tam, 40) / ANCHO_ORGANO[tipo]} t0={t0} color={col(el.color, "rojo")} resaltar={bool(el.resaltar) ? t0 + 0.7 : undefined} />
    </Aparece>
  );
};

export const VasoEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  if (!puntosValidos(el.ruta)) return null;
  const vena = el.vaso === "vena";
  return (
    <Tubo
      d={rutaDe(el.ruta as Punto[], bool(el.curva, true))}
      ancho={pu(el.grosor, 3)}
      borde={vena ? C.azul : C.rojo}
      relleno={vena ? "#13264a" : "#3a1620"}
      t0={t0}
      dur={1.0}
      brillo={0.4}
      fin={t1 < 9000 ? t1 : undefined}
    />
  );
};

export const CelulaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const forma = (["redonda", "alargada", "eritrocito"].includes(texto(el.forma)) ? texto(el.forma) : "redonda") as "redonda" | "alargada" | "eritrocito";
  return (
    <Aparece t0={t0} t1={t1} fade={0.2}>
      <Celula
        x={px(el.x)}
        y={py(el.y)}
        escala={pu(el.tam, 30) / (forma === "alargada" ? 460 : 320)}
        t0={t0}
        forma={forma}
        nucleo={bool(el.nucleo, true)}
        organelos={bool(el.organelos)}
        receptores={Math.round(num(el.receptores, 0, 0, 8))}
        canales={Math.round(num(el.canales, 0, 0, 6))}
        color={col(el.color, "azul")}
        activa={bool(el.activa) ? t0 + 1.0 : undefined}
      />
    </Aparece>
  );
};

export const MembranaEl: React.FC<ElProps> = ({ el, t0, t1 }) => (
  <Aparece t0={t0} t1={t1} fade={0.2}>
    <Membrana
      x={px(el.x)}
      y={py(el.y)}
      ancho={pu(el.ancho, 70)}
      t0={t0}
      receptores={Math.round(num(el.receptores, 0, 0, 6))}
      canales={Math.round(num(el.canales, 0, 0, 5))}
      bomba={bool(el.bomba)}
      ladoSuperior={typeof el.ladoSuperior === "string" ? el.ladoSuperior : null}
      ladoInferior={typeof el.ladoInferior === "string" ? el.ladoInferior : null}
      color={col(el.color, "azul")}
    />
  </Aparece>
);

export const NeuronaEl: React.FC<ElProps> = ({ el, t0, t1 }) => {
  const e = pu(el.tam, 80) / 730;
  return (
    <Aparece t0={t0} t1={t1} fade={0.2}>
      <Neurona x={px(el.x) - 270 * e} y={py(el.y)} escala={e} t0={t0} mielina={bool(el.mielina, true)} impulso={bool(el.impulso) ? t0 + 1.6 : undefined} />
    </Aparece>
  );
};
