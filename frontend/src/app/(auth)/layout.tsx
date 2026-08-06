import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      {/* Painel do formulário — sempre visível, rolável em telas pequenas */}
      <div className="flex w-full items-center justify-center overflow-y-auto px-4 py-10 md:w-1/2 md:px-10 lg:w-2/5">
        {children}
      </div>

      {/* Painel de imagem — some em telas pequenas, a mensagem já vem embutida na imagem */}
      <div className="relative hidden md:block md:w-1/2 lg:w-3/5">
        <Image
          src="/images/login-hero.png"
          alt="Construção em andamento ao pôr do sol, com guindaste — Construtec, gestão completa para construtoras"
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
