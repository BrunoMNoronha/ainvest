// Hook de autenticação com verificação de papel admin
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}

/**
 * Hook que gerencia autenticação e verificação de papel admin.
 * Retorna estado do usuário, flag isAdmin e funções signIn/signOut.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isLoading: true,
  });

  // Verificar se o usuário tem papel admin
  const checkAdmin = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  }, []);

  useEffect(() => {
    // Registrar listener ANTES de getSession (padrão Supabase)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Verificar papel admin sem bloquear o listener
          const isAdmin = await checkAdmin(session.user.id);
          setState({ user: session.user, isAdmin, isLoading: false });
        } else {
          setState({ user: null, isAdmin: false, isLoading: false });
        }
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const isAdmin = await checkAdmin(session.user.id);
        setState({ user: session.user, isAdmin, isLoading: false });
      } else {
        setState({ user: null, isAdmin: false, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAdmin]);

  // Login com email e senha
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // Logout
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user: state.user,
    isAdmin: state.isAdmin,
    isLoading: state.isLoading,
    signIn,
    signOut,
  };
}
