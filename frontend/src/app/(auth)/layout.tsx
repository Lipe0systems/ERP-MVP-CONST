import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      {/* Painel do formulário — ocupa o espaço restante */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-10 md:px-10">
        {children}
      </div>

      {/* Painel de imagem — largura derivada da proporção real da imagem (828x1024),
          nunca esticando/cortando o conteúdo. Some em telas pequenas. */}
      <div
        className="relative hidden shrink-0 self-stretch md:block"
        style={{ aspectRatio: "828 / 1024" }}
      >
        <Image
          src="/images/login-hero.png"
          alt="Construção em andamento ao pôr do sol, com guindaste — Construtec, gestão completa para construtoras"
          fill
          priority
          sizes="(min-width: 768px) 45vw, 0px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
