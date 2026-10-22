import React from "react";
import { BrazoEl, CelulaEl, CerebroEl, ColumnaEl, CorazonEl, CorteMedulaEl, CuerpoEl, MembranaEl, NeuronaEl, OrganoEl, VasoEl } from "./elementos/anatomia";
import type { ElProps } from "./elementos/comun";
import { ComparacionEl, DatoEl, GraficaEl, PasosEl } from "./elementos/datos";
import { CasaEl, CintaEl, CtaEl, FichaEl, FotoEl, ListaEl, LogoEl, MapaEl, PrecioEl } from "./elementos/negocio";
import { AroEl, EtiquetaEl, FormaEl, HaloEl, IconoEl, ImpulsoEl, LineaEl, MoleculaEl, ParticulasEl, RayosEl, RotuloEl, SvgLibreEl } from "./elementos/dibujo";

/** tipo (tal como lo escribe la IA en el plan) → componente que lo dibuja. Debe coincidir con catalogo.json. */
export const REGISTRO: Record<string, React.FC<ElProps>> = {
  corazon: CorazonEl,
  cerebro: CerebroEl,
  cuerpo: CuerpoEl,
  brazo: BrazoEl,
  columna: ColumnaEl,
  "corte-medula": CorteMedulaEl,
  organo: OrganoEl,
  vaso: VasoEl,
  celula: CelulaEl,
  membrana: MembranaEl,
  neurona: NeuronaEl,
  forma: FormaEl,
  linea: LineaEl,
  etiqueta: EtiquetaEl,
  rotulo: RotuloEl,
  molecula: MoleculaEl,
  particulas: ParticulasEl,
  impulso: ImpulsoEl,
  aros: AroEl,
  rayos: RayosEl,
  halo: HaloEl,
  icono: IconoEl,
  "svg-libre": SvgLibreEl,
  grafica: GraficaEl,
  pasos: PasosEl,
  comparacion: ComparacionEl,
  dato: DatoEl,
  foto: FotoEl,
  logo: LogoEl,
  lista: ListaEl,
  cta: CtaEl,
  cinta: CintaEl,
  ficha: FichaEl,
  precio: PrecioEl,
  mapa: MapaEl,
  casa: CasaEl,
};
