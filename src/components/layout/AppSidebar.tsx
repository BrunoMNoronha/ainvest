import { 
  LayoutDashboard, 
  TrendingUp, 
  Bell, 
  Wallet, 
  Settings, 
  HelpCircle,
  LineChart,
  Target,
  BookOpen,
  LogIn,
  LogOut
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

// Itens do menu principal
const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Sinais", url: "/signals", icon: Target },
  { title: "Análise Técnica", url: "/analysis", icon: LineChart },
  { title: "Alertas", url: "/alerts", icon: Bell },
];

// Itens de portfólio
const portfolioItems = [
  { title: "Carteira", url: "/portfolio", icon: Wallet },
  { title: "Performance", url: "/performance", icon: TrendingUp },
];

// Itens de configuração
const settingsItems = [
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Ajuda", url: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, isAdmin, signOut } = useAuth();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-foreground">AI Invest</h1>
              <p className="text-xs text-muted-foreground">Smart Trading</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Portfólio */}
        <SidebarGroup>
          <SidebarGroupLabel>Portfólio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {portfolioItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Documentação - Link único para o hub */}
        <SidebarGroup>
          <SidebarGroupLabel>Documentação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Documentação">
                  <NavLink 
                    to="/docs"
                    className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent"
                    activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <BookOpen className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>Documentação</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sistema */}
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        {/* Botão de login/logout */}
        {user ? (
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors w-full"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Sair{isAdmin ? " (Admin)" : ""}</span>}
          </button>
        ) : (
          <NavLink
            to="/login"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors"
            activeClassName="bg-primary text-primary-foreground"
          >
            <LogIn className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Login Admin</span>}
          </NavLink>
        )}
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            v1.0.0 • Swing Trade SMC
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
