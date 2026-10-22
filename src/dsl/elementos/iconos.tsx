import React from "react";
import { C, FUENTE } from "../../lib/colores";
import { ICONOS_HI, ICONOS_LU } from "./iconosPro.generated";

/**
 * Iconos de línea para videos de inmobiliaria, negocios y marketing. Caja de 100×100 centrada en (0,0),
 * trazo redondeado de 6–7 px. Los usan `icono`, `ficha` y `cta`.
 */
export const ICONOS_EXTRA = [
  "casa",
  "cama",
  "bano",
  "auto",
  "medida",
  "pin",
  "llave",
  "telefono",
  "whatsapp",
  "estrella",
  "calendario",
  "dinero",
  "arbol",
  "piscina",
  "escudo",
  "sol",
  "mail",
  "web",
] as const;

export type IconoExtra = (typeof ICONOS_EXTRA)[number];

/**
 * Iconos profesionales: «hi-*» (healthicons-react: órganos, células, aparatos médicos) y «lu-*» (lucide-react:
 * propiedades, autos, ubicación, finanzas). Caja 100×100 centrada en (0,0), igual que los dibujados a mano.
 * La lista vive en src/dsl/iconos-pro.json (npm run iconos la sincroniza con el catálogo).
 */
export function iconoPro(tipo: string, color: string): React.ReactNode | null {
  if (tipo.startsWith("hi-")) {
    const Comp = ICONOS_HI[tipo.slice(3)];
    return Comp ? <Comp x={-50} y={-50} width={100} height={100} color={color} fill={color} /> : null;
  }
  if (tipo.startsWith("lu-")) {
    const Comp = ICONOS_LU[tipo.slice(3)];
    return Comp ? <Comp x={-50} y={-50} width={100} height={100} color={color} stroke={color} strokeWidth={1.7} /> : null;
  }
  return null;
}

export function iconoExtra(tipo: string, color: string): React.ReactNode | null {
  const pro = iconoPro(tipo, color);
  if (pro) return pro;
  const l = { fill: "none", stroke: color, strokeWidth: 6.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const suave = { fill: color, fillOpacity: 0.22 };
  switch (tipo) {
    case "casa":
      return (
        <g>
          <path d="M -34,-4 L -34,38 L 34,38 L 34,-4" {...l} {...suave} />
          <path d="M -46,-2 L 0,-42 L 46,-2" {...l} />
          <rect x={-10} y={12} width={20} height={26} rx={3} {...l} fill={C.fondo} fillOpacity={0.6} />
        </g>
      );
    case "cama":
      return (
        <g>
          <path d="M -44,-30 L -44,38 M 44,10 L 44,38 M -44,24 L 44,24" {...l} />
          <rect x={-44} y={2} width={88} height={22} rx={6} {...l} {...suave} />
          <rect x={-34} y={-16} width={26} height={16} rx={6} {...l} />
        </g>
      );
    case "bano":
      return (
        <g>
          <path d="M -44,2 L 44,2 L 40,26 Q 38,36 28,36 L -28,36 Q -38,36 -40,26 Z" {...l} {...suave} />
          <path d="M -30,2 L -30,-24 Q -30,-34 -20,-34 Q -12,-34 -12,-26" {...l} />
          <path d="M -20,-12 L -20,-4 M -12,-8 L -12,-2" {...l} strokeWidth={5} />
          <path d="M -26,36 L -30,44 M 26,36 L 30,44" {...l} />
        </g>
      );
    case "auto":
      return (
        <g>
          <path d="M -44,12 L -40,-4 Q -36,-16 -24,-16 L 20,-16 Q 30,-16 36,-6 L 44,10 L 44,24 L -44,24 Z" {...l} {...suave} />
          <path d="M -26,-14 L -34,0 L 34,0 L 24,-14" {...l} strokeWidth={5} />
          <circle cx={-26} cy={26} r={9} fill={C.fondo} stroke={color} strokeWidth={6} />
          <circle cx={26} cy={26} r={9} fill={C.fondo} stroke={color} strokeWidth={6} />
        </g>
      );
    case "medida":
      return (
        <g>
          <rect x={-32} y={-32} width={64} height={64} rx={6} {...l} {...suave} />
          <path d="M -16,16 L 16,-16 M 4,-16 L 16,-16 L 16,-4 M -4,16 L -16,16 L -16,4" {...l} strokeWidth={6} />
        </g>
      );
    case "pin":
      return (
        <g>
          <path d="M 0,46 C -24,18 -30,4 -30,-12 A 30 30 0 0 1 30,-12 C 30,4 24,18 0,46 Z" {...l} {...suave} />
          <circle cx={0} cy={-12} r={10} {...l} />
        </g>
      );
    case "llave":
      return (
        <g>
          <circle cx={-22} cy={-6} r={18} {...l} {...suave} />
          <path d="M -4,-6 L 46,-6 M 30,-6 L 30,10 M 42,-6 L 42,6" {...l} />
        </g>
      );
    case "telefono":
      return (
        <g>
          <rect x={-22} y={-42} width={44} height={84} rx={10} {...l} {...suave} />
          <path d="M -8,-32 L 8,-32" {...l} strokeWidth={5} />
          <circle cx={0} cy={30} r={4} fill={color} />
        </g>
      );
    case "whatsapp":
      return (
        <g>
          <path d="M 0,-40 A 38 38 0 1 1 -20,32 L -38,42 L -30,22 A 38 38 0 0 1 0,-40 Z" {...l} {...suave} />
          <path d="M -14,-14 Q -14,8 10,18 L 17,9 L 8,3 L 4,7 Q -6,3 -8,-8 L -4,-12 L -11,-22 Z" fill={color} />
        </g>
      );
    case "estrella":
      return <path d="M 0,-42 L 12,-14 L 42,-11 L 19,8 L 26,38 L 0,22 L -26,38 L -19,8 L -42,-11 L -12,-14 Z" {...l} {...suave} />;
    case "calendario":
      return (
        <g>
          <rect x={-38} y={-30} width={76} height={68} rx={8} {...l} {...suave} />
          <path d="M -38,-10 L 38,-10 M -18,-40 L -18,-22 M 18,-40 L 18,-22" {...l} />
          <path d="M -20,8 L -16,8 M -2,8 L 2,8 M 16,8 L 20,8 M -20,24 L -16,24 M -2,24 L 2,24" {...l} strokeWidth={6} />
        </g>
      );
    case "dinero":
      return (
        <g>
          <circle r={38} {...l} {...suave} />
          <text textAnchor="middle" y={19} fontFamily={FUENTE} fontWeight={900} fontSize={54} fill={color}>
            $
          </text>
        </g>
      );
    case "arbol":
      return (
        <g>
          <circle cx={0} cy={-16} r={26} {...l} {...suave} />
          <circle cx={-20} cy={6} r={18} {...l} {...suave} />
          <circle cx={20} cy={6} r={18} {...l} {...suave} />
          <path d="M 0,10 L 0,44" {...l} strokeWidth={8} />
        </g>
      );
    case "piscina":
      return (
        <g>
          <path d="M -16,-34 L -16,10 M 10,-34 L 10,10 M -16,-30 Q -3,-44 10,-30 M -16,-12 L 10,-12" {...l} strokeWidth={5.5} />
          <path d="M -44,16 Q -33,6 -22,16 T 0,16 T 22,16 T 44,16" {...l} />
          <path d="M -44,34 Q -33,24 -22,34 T 0,34 T 22,34 T 44,34" {...l} />
        </g>
      );
    case "escudo":
      return (
        <g>
          <path d="M 0,-44 L 34,-31 L 34,2 C 34,22 18,36 0,46 C -18,36 -34,22 -34,2 L -34,-31 Z" {...l} {...suave} />
          <path d="M -14,2 L -4,13 L 16,-10" {...l} strokeWidth={7} />
        </g>
      );
    case "sol":
      return (
        <g>
          <circle r={17} {...l} {...suave} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <line key={i} x1={Math.cos(a) * 28} y1={Math.sin(a) * 28} x2={Math.cos(a) * 42} y2={Math.sin(a) * 42} stroke={color} strokeWidth={6.5} strokeLinecap="round" />;
          })}
        </g>
      );
    case "mail":
      return (
        <g>
          <rect x={-42} y={-28} width={84} height={56} rx={8} {...l} {...suave} />
          <path d="M -40,-24 L 0,6 L 40,-24" {...l} />
        </g>
      );
    case "web":
      return (
        <g>
          <circle r={38} {...l} {...suave} />
          <ellipse rx={16} ry={38} {...l} strokeWidth={5} />
          <path d="M -38,0 L 38,0 M -32,-20 L 32,-20 M -32,20 L 32,20" {...l} strokeWidth={5} />
        </g>
      );
    default:
      return null;
  }
}
