import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      {/* Painel do formulário — sempre visível, rolável em telas pequenas */}
      <div className="flex w-full items-center justify-center overflow-y-auto px-4 py-10 md:w-1/2 md:px-10 lg:w-2/5">
        {children}
      </div>

      {/* Painel de imagem — some em telas pequenas. Imagem larga (1672x941) com
          logo + texto embutidos, todos do lado esquerdo sobre um painel escuro
          — por isso o corte de "cover" fica ancorado à esquerda (object-left):
          o texto/logo nunca é cortado, o que se perde é sempre à direita
          (céu/guindaste), seguro de recortar. */}
      <div className="relative hidden md:block md:w-1/2 lg:w-3/5">
        <Image
          src="/images/login-hero.png"
          alt="Construtec — Gestão completa para construir o futuro. O ERP feito para construtoras que buscam eficiência, organização e resultados: visão completa do negócio, obras/orçamentos/finanças integrados, multiempresa e multiusuário, segurança e confiabilidade. Ao fundo, obra em andamento ao pôr do sol com guindaste e skyline da cidade."
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 50vw"
          className="object-cover object-left"
        />
      </div>
    </div>
  );
}
