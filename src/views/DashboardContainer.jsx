import React, { useState, useEffect } from 'react';
import { AppProvider } from '../contexts/AppContext.jsx';
import WatchlistPanel from './WatchlistPanel.jsx';
import ChartViewer from './ChartViewer.jsx';
import AnalysisChecklist from './AnalysisChecklist.jsx';
import AlertSystem from './AlertSystem.jsx';
import SettingsPanel from './SettingsPanel.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  TrendingUp, 
  Settings, 
  Bell, 
  Activity,
  BarChart3,
  Wifi,
  WifiOff
} from 'lucide-react';

function DashboardLayout() {
  const [activeView, setActiveView] = useState('watchlist');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  AInvest Dashboard
                </h1>
              </div>
              <Badge variant="secondary" className="text-xs">
                v1.34
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3">
              <ConnectionStatus />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAlerts(!showAlerts)}
                className="relative"
              >
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                >
                  3
                </Badge>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-sm">
          <nav className="p-4 space-y-2">
            <NavButton
              icon={BarChart3}
              label="Watchlist"
              active={activeView === 'watchlist'}
              onClick={() => setActiveView('watchlist')}
            />
            <NavButton
              icon={Activity}
              label="Análise Técnica"
              active={activeView === 'analysis'}
              onClick={() => setActiveView('analysis')}
              disabled={!selectedAsset}
            />
          </nav>
          
          {/* Quick Stats */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <QuickStats />
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 flex">
          <div className="flex-1 p-6">
            {activeView === 'watchlist' && (
              <WatchlistPanel 
                onAssetSelect={setSelectedAsset}
                selectedAsset={selectedAsset}
              />
            )}
            
            {activeView === 'analysis' && selectedAsset && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
                <div className="xl:col-span-2">
                  <ChartViewer asset={selectedAsset} />
                </div>
                <div>
                  <AnalysisChecklist asset={selectedAsset} />
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Side Panels */}
        {showAlerts && (
          <div className="w-80 border-l border-slate-200 dark:border-slate-700">
            <AlertSystem onClose={() => setShowAlerts(false)} />
          </div>
        )}
        
        {showSettings && (
          <div className="w-80 border-l border-slate-200 dark:border-slate-700">
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick, disabled = false }) {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      className={`w-full justify-start ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}

function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    // Simula status de conexão
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.1); // 90% chance de estar conectado
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-2">
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">
            Conectado
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">
            Desconectado
          </span>
        </>
      )}
    </div>
  );
}

function QuickStats() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Estatísticas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Ativos Monitorados
          </span>
          <Badge variant="secondary">15</Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Setups Válidos
          </span>
          <Badge variant="default">3</Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Score Médio
          </span>
          <Badge variant="outline">4.2</Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Alertas Ativos
          </span>
          <Badge variant="destructive">3</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardContainer() {
  return (
    <AppProvider>
      <DashboardLayout />
    </AppProvider>
  );
}

