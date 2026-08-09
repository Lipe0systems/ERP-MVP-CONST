/**
 * PageTransition — usa CSS animation definida em globals.css (page-enter).
 * CSS animations rodam fora da main thread — mais suaves que JS sob carga.
 * Responde automaticamente a prefers-reduced-motion via globals.css.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
