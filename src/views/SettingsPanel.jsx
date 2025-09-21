import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { 
  X,
  Settings,
  Save,
  RotateCcw,
  Moon,
  Sun,
  Bell,
  Clock,
  Database
} from 'lucide-react';

export default function SettingsPanel({ onClose }) {
  const { state, updateSettings } = useApp();
  const [localSettings, setLocalSettings] = useState(state.settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(state.settings);
    setHasChanges(false);
  };

  return (
    <div className="h-full bg-white dark:bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Configurações</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Tema</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Escolha entre tema claro ou escuro
                </p>
              </div>
              <Select 
                value={localSettings.theme} 
                onValueChange={(value) => handleSettingChange('theme', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dados e Atualizações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-4 w-4" />
              Dados e Atualizações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Intervalo de Atualização</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Frequência de atualização dos dados em segundos
                </p>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min="1"
                  max="300"
                  value={localSettings.updateInterval / 1000}
                  onChange={(e) => handleSettingChange('updateInterval', parseInt(e.target.value) * 1000)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Máximo de Ativos</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Número máximo de ativos na watchlist
                </p>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min="5"
                  max="100"
                  value={localSettings.maxAssets}
                  onChange={(e) => handleSettingChange('maxAssets', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações do Navegador</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Receber notificações quando alertas forem disparados
                </p>
              </div>
              <Switch
                checked={localSettings.notifications}
                onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Som de Alerta</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Reproduzir som quando alertas forem disparados
                </p>
              </div>
              <Switch
                checked={localSettings.soundAlerts || false}
                onCheckedChange={(checked) => handleSettingChange('soundAlerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Critérios de Análise */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Critérios de Análise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Score Mínimo para Setup</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Pontuação mínima para considerar setup válido
                </p>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  min="1"
                  max="8"
                  value={localSettings.minScore || 6}
                  onChange={(e) => handleSettingChange('minScore', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Risco:Retorno Mínimo</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Relação risco-retorno mínima para operações
                </p>
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={localSettings.minRiskReward || 2.0}
                  onChange={(e) => handleSettingChange('minRiskReward', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Análise Automática</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Executar análise automaticamente ao adicionar ativos
                </p>
              </div>
              <Switch
                checked={localSettings.autoAnalysis || true}
                onCheckedChange={(checked) => handleSettingChange('autoAnalysis', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeframes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeframes Ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Semanal</Label>
              <Switch
                checked={localSettings.timeframes?.weekly !== false}
                onCheckedChange={(checked) => handleSettingChange('timeframes', { 
                  ...localSettings.timeframes, 
                  weekly: checked 
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Diário</Label>
              <Switch
                checked={localSettings.timeframes?.daily !== false}
                onCheckedChange={(checked) => handleSettingChange('timeframes', { 
                  ...localSettings.timeframes, 
                  daily: checked 
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>4 Horas</Label>
              <Switch
                checked={localSettings.timeframes?.fourHour !== false}
                onCheckedChange={(checked) => handleSettingChange('timeframes', { 
                  ...localSettings.timeframes, 
                  fourHour: checked 
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Versão:</span>
              <span className="font-medium">1.34</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Última Atualização:</span>
              <span className="font-medium">
                {new Date(state.connection.lastUpdate || Date.now()).toLocaleString('pt-BR')}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Status da Conexão:</span>
              <span className={`font-medium ${
                state.connection.status === 'connected' ? 'text-green-600' : 'text-red-600'
              }`}>
                {state.connection.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Ativos Monitorados:</span>
              <span className="font-medium">{state.watchlist.length}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Alertas Ativos:</span>
              <span className="font-medium">{state.alerts.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      {hasChanges && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

