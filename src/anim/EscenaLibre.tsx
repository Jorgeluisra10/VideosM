import React from "react";
import { AbsoluteFill } from "remotion";
import { AMBITO_KIT, AmbientParticles, Camera2D, ColoresCtx, DuracionCtx, KineticText } from "../primitives/MotionKit";
import { coloresIA } from "./libre";
import type { EscenaLibreGuardada } from "./tipos";

/**
 * Ejecuta el código de una escena del LIENZO LIBRE. El código llega ya transpilado (JSX → React.createElement) y revisado por la política de seguridad
 * (sin red, sin window/document, sin Math.random…); aquí solo se instancia con el ámbito del kit. Si algo falla (error de compilación o de render)
 * la escena no tumba el video: se dibuja una escena de rescate y se escribe «[ESCENA-ERROR] …» en la consola (lo detecta el verificador).
 */
const compiladas = new Map<string, React.FC>();

function compilar(js: string, ambito: Record<string, unknown>): React.FC {
  const nombres = Object.keys(ambito);
  const clave = nombres.length + ":" + js;
  let Comp = compiladas.get(clave);
  if (!Comp) {
    // eslint-disable-next-line no-new-func
    const fabrica = new Function(...nombres, `"use strict";\n${js}\n;return Escena;`);
    Comp = fabrica(...nombres.map((n) => ambito[n])) as React.FC;
    compiladas.set(clave, Comp);
  }
  return Comp;
}

const Rescate: React.FC<{ texto: string; mensaje: string; n: number }> = ({ texto, mensaje, n }) => {
  console.error(`[ESCENA-ERROR] escena ${n}: ${mensaje}`);
  const C = React.useContext(ColoresCtx);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${C.fondo2 ?? "#08336F"}, ${C.fondo ?? "#02224E"})` }}>
      <AmbientParticles count={30} color={C.acento ?? "#FFC500"} speed={0.5} />
      <Camera2D>
        <KineticText texto={texto.replace(/\s+/g, " ").slice(0, 50) || "IMNOBA"} y={920} tam={86} color={C.blanco ?? "#fff"} delay={0.2} />
      </Camera2D>
    </AbsoluteFill>
  );
};

class Limite extends React.Component<{ n: number; texto: string; children?: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: unknown) {
    return { error: String((e as Error)?.message ?? e) };
  }
  render() {
    return this.state.error ? <Rescate texto={this.props.texto} mensaje={this.state.error} n={this.props.n} /> : this.props.children;
  }
}

export const EscenaLibre: React.FC<{ escena: EscenaLibreGuardada; paleta: string }> = ({ escena, paleta }) => {
  const C = coloresIA(paleta);
  let Comp: React.FC | null = null;
  let fallo = "";
  try {
    Comp = compilar(escena.js, { ...AMBITO_KIT, C, DUR: escena.dur });
  } catch (e) {
    fallo = String((e as Error)?.message ?? e);
  }
  return (
    <ColoresCtx.Provider value={C}>
      <DuracionCtx.Provider value={escena.dur}>
        <AbsoluteFill style={{ background: C.fondo }}>
          {Comp ? (
            <Limite n={escena.n} texto={escena.texto}>
              <Comp />
            </Limite>
          ) : (
            <Rescate texto={escena.texto} mensaje={`no compila: ${fallo}`} n={escena.n} />
          )}
        </AbsoluteFill>
      </DuracionCtx.Provider>
    </ColoresCtx.Provider>
  );
};
