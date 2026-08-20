"use client";

import { useRouter } from "next/navigation";
import { FileQuestion } from "lucide-react";
import { ErrorPage } from "@/components/erros/error-page";

export default function NotFound() {
  const router = useRouter();
  return (
    <ErrorPage
      status="404"
      icon={FileQuestion}
      title="Página não encontrada"
      description="A página que você está procurando não existe ou foi movida."
      cor="brand"
      primaryAction={{ label: "Ir para o Dashboard", href: "/dashboard" }}
      secondaryAction={{ label: "Voltar", onClick: () => router.back() }}
    />
  );
}
