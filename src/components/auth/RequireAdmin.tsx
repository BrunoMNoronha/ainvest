// Componente guard que protege rotas/ações de admin
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface RequireAdminProps {
  children: ReactNode;
  /** Se true, renderiza nada em vez de redirecionar (útil para esconder botões) */
  hide?: boolean;
}

/**
 * Wrapper de proteção para conteúdo exclusivo de admin.
 * - Se hide=true: esconde o conteúdo silenciosamente
 * - Se hide=false: redireciona para /login
 */
export function RequireAdmin({ children, hide = false }: RequireAdminProps) {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return hide ? null : <Skeleton className="h-10 w-full" />;
  }

  if (!user || !isAdmin) {
    return hide ? null : <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
