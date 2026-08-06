import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      {/* Painel do formulário — ocupa o espaço restante */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-10 md:px-10">
        {children}
      </div>

      {/* Painel de imagem — largura derivada da proporção real da imagem
          (1022x1024, quase quadrada). Essa imagem não tem painel escuro atrás
          do texto (o texto fica direto sobre o céu), então cortar com "cover"
          arriscaria cortar o texto — por isso a imagem aparece sempre inteira,
          sem cortes, e é o painel que se adapta a ela. Some em telas pequenas. */}
      <div
        className="relative hidden shrink-0 self-stretch md:block"
        style={{ aspectRatio: "1022 / 1024" }}
      >
        <Image
          src="/images/login-hero.png"
          alt="Gestão completa para construir o futuro — o ERP feito para construtoras que buscam eficiência, organização e resultados: visão completa do negócio, obras/orçamentos/finanças integrados, multiempresa e multiusuário, segurança e confiabilidade. Ao fundo, obra em andamento ao pôr do sol com guindaste e skyline da cidade."
          fill
          priority
          sizes="(min-width: 768px) 50vw, 0px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
