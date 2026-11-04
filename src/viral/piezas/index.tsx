/**
 * Registro de piezas a medida (carril B): id → componente. El motor las dibuja cuando una escena es de tipo PIEZA.
 * Para añadir una pieza nueva: (1) su ficha pura en src/anim/piezas.ts (duración ideal, fondo, sonido), (2) su componente aquí.
 */
import { RxGancho, RxHuesos, RxTubo, RxX } from "./rx1";
import { RxAnna, RxCierre, RxMundo, RxNobel } from "./rx2";
import { SanAorta, SanCorazon, SanGancho, SanRamas } from "./san1";
import { SanCapilar, SanPulmon, SanVenas, SanVida } from "./san2";
import { FutCausa, FutFibrilacion, FutGancho, FutVentana } from "./fut1";
import { FutCerebro, FutCierre, FutDescarga, FutRcp } from "./fut2";
import { CurChicle, CurCosquillas, CurGancho, CurHipo } from "./cur1";
import { CurAcento, CurMarcador, CurPastilla, CurViolin } from "./cur2";
import { SueAdenosina, SueGancho, SueHoras, SueLimite } from "./sue1";
import { SueCafe, SueDormir, SueHospital, SueMicro } from "./sue2";
import { JetAire, JetAscenso, JetCabina, JetGancho } from "./jet1";
import { JetCerebro, JetDescenso, JetReloj, JetSilencio } from "./jet2";
import { PisAcrilico, PisGancho, PisUnion, PisVidrio } from "./pis1";
import { PisCarga, PisTinas, PisViento, PisZoom } from "./pis2";
import { RuiDia, RuiGancho, RuiNoche, RuiRitmos } from "./rui1";
import { RuiFriccion, RuiMicro, RuiRemate, RuiTally } from "./rui2";
import { PteDuelo, PteGancho, PteParabola } from "./pte1";
import { PteBloque, PteCubo, PteRoebling, PteZoom } from "./pte2";
import { DigAbismo, DigAutos, DigGancho, DigLectura } from "./dig1";
import { DigEscala, DigOjo, DigThomas } from "./dig2";
import React from "react";
import type { EscenaViralGuardada } from "../../anim/viral";
import { MetroFriccion, MetroPlano, MetroRieles } from "./metro1";
import { MetroCapacidad, MetroCarrera } from "./metro2";
import { MetroCurva, MetroSuelo } from "./metro3";
import { MetroBalanza, MetroSilueta } from "./metro4";
import { AnomCierre, AnomDisco } from "./anom1";
import { AnomContinente, AnomFriccion } from "./anom2";
import { AnomCarrera, AnomVertical } from "./anom3";
import { AnomEscala, AnomSuelo } from "./anom4";
import { AnomCompresion, AnomLaboratorio } from "./anom5";
import { RealHistoria, RealTrancon, RealBus } from "./real1";
import { RealRedes, RealTiempo, RealViaducto, RealUnTren } from "./real2";
import { RealResultado, RealPlusvalia, RealCaminata, RealCierre } from "./real3";
import { MedGancho, MedSonda1, MedSonda2, MedNobel1 } from "./med1";
import { MedPylori1, MedVaso, MedGastritis, MedNobel2 } from "./med2";
import { MedPolar1, MedCirugia, MedPolar2, MedCierre } from "./med3";
import { ParGancho, ParKepler, ParN3, ParRegla } from "./par1";
import { ParAplica, ParCurva, ParSimula, ParSupuestos } from "./par2";
import { AstroGancho, AstroGlia, AstroMitad } from "./astro1";
import { AstroDialogo, AstroEstrella, AstroMemoria } from "./astro2";
import { DscCatalogo, DscDocs, DscGancho, DscHack, DscSplit } from "./dscr1";
import { TejEpitelial, TejGancho, TejSangre } from "./tej1";
import { TejHueso, TejMuscular, TejNervioso } from "./tej2";
import { EinBarrera, EinEsculpe, EinGancho, EinTripartita } from "./ein1";
import { EinCautela, EinDiamond, EinGfap, EinHallazgo } from "./ein2";

export const COMPONENTES_PIEZA: Record<string, React.FC<{ e: EscenaViralGuardada }>> = {
  "metro-plano": MetroPlano,
  "metro-friccion": MetroFriccion,
  "metro-rieles": MetroRieles,
  "metro-carrera": MetroCarrera,
  "metro-capacidad": MetroCapacidad,
  "metro-suelo": MetroSuelo,
  "metro-curva": MetroCurva,
  "metro-silueta": MetroSilueta,
  "metro-balanza": MetroBalanza,
  "anom-disco": AnomDisco,
  "anom-friccion": AnomFriccion,
  "anom-continente": AnomContinente,
  "anom-vertical": AnomVertical,
  "anom-carrera": AnomCarrera,
  "anom-escala": AnomEscala,
  "anom-suelo": AnomSuelo,
  "anom-laboratorio": AnomLaboratorio,
  "anom-compresion": AnomCompresion,
  "anom-cierre": AnomCierre,
  "real-historia": RealHistoria,
  "real-trancon": RealTrancon,
  "real-bus": RealBus,
  "real-redes": RealRedes,
  "real-tiempo": RealTiempo,
  "real-viaducto": RealViaducto,
  "real-untren": RealUnTren,
  "real-resultado": RealResultado,
  "real-plusvalia": RealPlusvalia,
  "real-caminata": RealCaminata,
  "real-cierre": RealCierre,
  "med-gancho": MedGancho,
  "med-sonda1": MedSonda1,
  "med-sonda2": MedSonda2,
  "med-nobel1": MedNobel1,
  "med-pylori1": MedPylori1,
  "med-vaso": MedVaso,
  "med-gastritis": MedGastritis,
  "med-nobel2": MedNobel2,
  "med-polar1": MedPolar1,
  "med-cirugia": MedCirugia,
  "med-polar2": MedPolar2,
  "med-cierre": MedCierre,
  "par-gancho": ParGancho,
  "par-kepler": ParKepler,
  "par-n3": ParN3,
  "par-regla": ParRegla,
  "par-curva": ParCurva,
  "par-simula": ParSimula,
  "par-aplica": ParAplica,
  "par-supuestos": ParSupuestos,
  "astro-gancho": AstroGancho,
  "astro-glia": AstroGlia,
  "astro-mitad": AstroMitad,
  "astro-estrella": AstroEstrella,
  "astro-dialogo": AstroDialogo,
  "astro-memoria": AstroMemoria,
  "dscr-gancho": DscGancho,
  "dscr-hack": DscHack,
  "dscr-docs": DscDocs,
  "dscr-split": DscSplit,
  "dscr-catalogo": DscCatalogo,
  "tej-gancho": TejGancho,
  "tej-epitelial": TejEpitelial,
  "tej-sangre": TejSangre,
  "tej-hueso": TejHueso,
  "tej-muscular": TejMuscular,
  "tej-nervioso": TejNervioso,
  "rx-gancho": RxGancho, "rx-tubo": RxTubo, "rx-huesos": RxHuesos, "rx-x": RxX, "rx-anna": RxAnna, "rx-mundo": RxMundo, "rx-nobel": RxNobel, "rx-cierre": RxCierre,
  "san-gancho": SanGancho, "san-corazon": SanCorazon, "san-aorta": SanAorta, "san-ramas": SanRamas, "san-capilar": SanCapilar, "san-venas": SanVenas, "san-pulmon": SanPulmon, "san-vida": SanVida,
  "fut-gancho": FutGancho, "fut-causa": FutCausa, "fut-ventana": FutVentana, "fut-fibrilacion": FutFibrilacion, "fut-cerebro": FutCerebro, "fut-descarga": FutDescarga, "fut-rcp": FutRcp, "fut-cierre": FutCierre,
  "cur-gancho": CurGancho, "cur-hipo": CurHipo, "cur-cosquillas": CurCosquillas, "cur-chicle": CurChicle, "cur-pastilla": CurPastilla, "cur-violin": CurViolin, "cur-acento": CurAcento, "cur-marcador": CurMarcador,
  "sue-gancho": SueGancho, "sue-horas": SueHoras, "sue-limite": SueLimite, "sue-adenosina": SueAdenosina, "sue-cafe": SueCafe, "sue-micro": SueMicro, "sue-hospital": SueHospital, "sue-dormir": SueDormir,
  "jet-gancho": JetGancho, "jet-ascenso": JetAscenso, "jet-aire": JetAire, "jet-cabina": JetCabina, "jet-cerebro": JetCerebro, "jet-reloj": JetReloj, "jet-silencio": JetSilencio, "jet-descenso": JetDescenso,
  "pis-gancho": PisGancho, "pis-vidrio": PisVidrio, "pis-acrilico": PisAcrilico, "pis-union": PisUnion, "pis-tinas": PisTinas, "pis-viento": PisViento, "pis-carga": PisCarga, "pis-zoom": PisZoom,
  "rui-gancho": RuiGancho, "rui-dia": RuiDia, "rui-noche": RuiNoche, "rui-ritmos": RuiRitmos, "rui-friccion": RuiFriccion, "rui-remate": RuiRemate, "rui-tally": RuiTally, "rui-micro": RuiMicro,
  "pte-gancho": PteGancho, "pte-parabola": PteParabola, "pte-duelo": PteDuelo, "pte-roebling": PteRoebling, "pte-bloque": PteBloque, "pte-cubo": PteCubo, "pte-zoom": PteZoom,
  "dig-gancho": DigGancho, "dig-lectura": DigLectura, "dig-abismo": DigAbismo, "dig-autos": DigAutos, "dig-thomas": DigThomas, "dig-escala": DigEscala, "dig-ojo": DigOjo,
  "ein-gancho": EinGancho,
  "ein-barrera": EinBarrera,
  "ein-tripartita": EinTripartita,
  "ein-esculpe": EinEsculpe,
  "ein-diamond": EinDiamond,
  "ein-hallazgo": EinHallazgo,
  "ein-cautela": EinCautela,
  "ein-gfap": EinGfap,
};

export const Pieza: React.FC<{ e: EscenaViralGuardada; alternativa: React.ReactNode }> = ({ e, alternativa }) => {
  const C = e.pieza ? COMPONENTES_PIEZA[e.pieza.id] : undefined;
  return C ? <C e={e} /> : <>{alternativa}</>;
};
