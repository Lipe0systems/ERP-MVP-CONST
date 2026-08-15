"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PapelUsuario } from "@/types";

interface MeInfo {
  id: string;
  email: string | null;
  empresa_id: string;
  papel: PapelUsuario;
}

export function useCurrentUser() {
  const [me, setMe] = useState<MeInfo | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) { setCarregando(false); return; }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        if (res.ok && ativo) setMe(await res.json());
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  return { me, carregando, isInstalador: me?.papel === "instalador" };
}
