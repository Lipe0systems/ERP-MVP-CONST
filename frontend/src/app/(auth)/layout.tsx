import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      {/* Painel do formulário com mesh gradient animado + blobs flutuantes */}
      <div className="relative flex w-full items-center justify-center overflow-hidden px-4 py-10 md:w-1/2 md:px-10 lg:w-2/5">
        {/* Blobs de cor flutuantes ao fundo */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-orange-600/15 blur-3xl animate-float" style={{ animationDelay: "-7s" }} />
        <div className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl animate-float" style={{ animationDelay: "-14s" }} />
        <div className="relative z-10 w-full max-w-sm">{children}</div>
      </div>

      {/* Painel de imagem hero */}
      <div className="relative hidden md:block md:w-1/2 lg:w-3/5">
        <Image
          src="/images/login-hero.png"
          alt="Inovak — Gestão completa para construir o futuro. O ERP feito para construtoras que buscam eficiência, organização e resultados."
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 50vw"
          className="object-cover object-left"
        />
        {/* Overlay gradiente para integrar com o painel escuro */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0b0f19] via-transparent to-transparent" />
      </div>
    </div>
  );
}
