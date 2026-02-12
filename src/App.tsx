import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Signals from "./pages/Signals";
import Analysis from "./pages/Analysis";
import Alerts from "./pages/Alerts";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
// Páginas de documentação - Hub e módulos
import Documentation from "./pages/docs/Documentation";
import Roadmap from "./pages/docs/RoadmapPage";
import StrategiesPage from "./pages/docs/StrategiesPage";
import RulesPage from "./pages/docs/RulesPage";
import HistoryPage from "./pages/docs/HistoryPage";

// Páginas de documentação legada
import Visao from "./pages/docs/Visao";
import Estrategias from "./pages/docs/Estrategias";
import ApiReference from "./pages/docs/ApiReference";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rotas principais */}
          <Route path="/" element={<Index />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/login" element={<Login />} />
          
          {/* Hub de Documentação */}
          <Route path="/docs" element={<Documentation />} />
          <Route path="/docs/roadmap" element={<Roadmap />} />
          <Route path="/docs/strategies" element={<StrategiesPage />} />
          <Route path="/docs/rules" element={<RulesPage />} />
          <Route path="/docs/history" element={<HistoryPage />} />
          
          {/* Documentação legada */}
          <Route path="/docs/visao" element={<Visao />} />
          <Route path="/docs/estrategias" element={<Estrategias />} />
          <Route path="/docs/api" element={<ApiReference />} />
          
          {/* Rota catch-all para 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
