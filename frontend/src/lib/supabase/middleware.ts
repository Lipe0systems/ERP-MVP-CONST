/**
 * Atualiza/valida a sessão do Supabase a cada requisição (usado pelo middleware.ts).
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas acessíveis SEM sessão, que não devem ser bloqueadas nem redirecionar
// para /login. Cada uma tem um motivo real, verificado no código da própria
// página — não é suposição:
//   /aceitar-convite → usa um token da URL (?token=...), chamado direto no
//                       backend (/usuarios/convites/{token}/...). É a tela
//                       de quem AINDA NÃO TEM CONTA. Redirecionar pra login
//                       aqui QUEBRA o convite inteiro — bug real encontrado
//                       nesta auditoria, corrigido junto com a otimização.
//   /termos, /privacidade → páginas informativas públicas (o rodapé do
//                       login já linka pra elas sem exigir estar logado).
// "/aceitar-termos" NÃO entra aqui: ela usa getSession() e manda o token
// pro backend — precisa de sessão ativa, então continua protegida.
const ROTAS_PUBLICAS = ["/aceitar-convite", "/termos", "/privacidade"];

// Rotas de autenticação: usuário DESLOGADO pode acessar, e se JÁ estiver
// logado, é redirecionado para o dashboard (evita ver a tela de login de
// novo por engano).
const ROTAS_AUTH = ["/login", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // PERFORMANCE: para rotas públicas, não há nada para proteger nem
  // redirecionar — pular a chamada de rede ao Supabase (getUser()) evita
  // um round-trip completo que não influenciaria em nada o resultado.
  if (ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota))) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = ROTAS_AUTH.some((rota) => pathname.startsWith(rota));

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
