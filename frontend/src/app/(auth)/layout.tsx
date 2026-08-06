import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      {/* Painel do formulário — sempre visível, rolável em telas pequenas */}
      <div className="flex w-full items-center justify-center overflow-y-auto px-4 py-10 md:w-1/2 md:px-10 lg:w-2/5">
        {children}
      </div>

      {/* Painel de imagem — some em telas pequenas. Imagem paisagem (1536x1024),
          próxima da proporção do painel — o corte de "cover" é lateral e leve. */}
      <div className="relative hidden md:block md:w-1/2 lg:w-3/5">
        <Image
          src="/images/login-hero.png"
          alt="Dois engenheiros observando uma obra em andamento ao pôr do sol, com guindaste e skyline da cidade — Construtec, gestão completa para construtoras"
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
