import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { createAlert } from '../types/index.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { 
  X,
  Plus,
  Bell,
  BellRing,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

export default function AlertSystem({ onClose }) {
  const { state, addAlert, removeAlert } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'score',
    symbol: '',
    condition: '>=',
    value: '6'
  });

  const handleCreateAlert = () => {
    if (!newAlert.symbol || !newAlert.value) return;

    const alert = createAlert(
      newAlert.type,
      newAlert.symbol.toUpperCase(),
      newAlert.condition,
      parseFloat(newAlert.value)
    );

    addAlert(alert);
    setNewAlert({ type: 'score', symbol: '', condition: '>=', value: '6' });
    setShowCreateForm(false);
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'score': return 'Score Mínimo';
      case 'orderblock_touch': return 'Toque em Order Block';
      case 'choch': return 'Mudança de Caráter';
      default: return type;
    }
  };

  const getAlertIcon = (alert) => {
    if (alert.triggered) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    
    switch (alert.type) {
      case 'score':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'orderblock_touch':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'choch':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  // Simula alguns alertas para demonstração
  const mockAlerts = [
    {
      id: '1',
      type: 'score',
      symbol: 'PETR4',
      condition: '>=',
      value: 6,
      active: true,
      triggered: true,
      createdAt: Date.now() - 3600000,
      triggeredAt: Date.now() - 1800000
    },
    {
      id: '2',
      type: 'orderblock_touch',
      symbol: 'VALE3',
      condition: 'touch',
      value: 65.50,
      active: true,
      triggered: false,
      createdAt: Date.now() - 7200000,
      triggeredAt: null
    },
    {
      id: '3',
      type: 'choch',
      symbol: 'ITUB4',
      condition: 'occurs',
      value: null,
      active: true,
      triggered: true,
      createdAt: Date.now() - 10800000,
      triggeredAt: Date.now() - 900000
    }
  ];

  const allAlerts = [...state.alerts, ...mockAlerts];
  const activeAlerts = allAlerts.filter(alert => alert.active);
  const triggeredAlerts = allAlerts.filter(alert => alert.triggered);

  return (
    <div className="h-full bg-white dark:bg-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Sistema de Alertas</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">Ativos</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {activeAlerts.length}
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-green-600 dark:text-green-400">Disparados</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              {triggeredAlerts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Create Alert Button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full"
            variant={showCreateForm ? "secondary" : "default"}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? 'Cancelar' : 'Novo Alerta'}
          </Button>
        </div>

        {/* Create Alert Form */}
        {showCreateForm && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <div className="space-y-4">
              <div>
                <Label htmlFor="alert-type">Tipo de Alerta</Label>
                <Select 
                  value={newAlert.type} 
                  onValueChange={(value) => setNewAlert(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Score Mínimo</SelectItem>
                    <SelectItem value="orderblock_touch">Toque em Order Block</SelectItem>
                    <SelectItem value="choch">Mudança de Caráter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="alert-symbol">Ativo</Label>
                <Input
                  id="alert-symbol"
                  placeholder="Ex: PETR4"
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, symbol: e.target.value }))}
                />
              </div>

              {newAlert.type === 'score' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Condição</Label>
                    <Select 
                      value={newAlert.condition} 
                      onValueChange={(value) => setNewAlert(prev => ({ ...prev, condition: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">=">&gt;=</SelectItem>
                        <SelectItem value="<=">&lt;=</SelectItem>
                        <SelectItem value="==">=</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      min="0"
                      max="8"
                      value={newAlert.value}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, value: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {newAlert.type === 'orderblock_touch' && (
                <div>
                  <Label>Preço do Order Block</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 35.50"
                    value={newAlert.value}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>
              )}

              <Button onClick={handleCreateAlert} className="w-full">
                Criar Alerta
              </Button>
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="p-4">
          <h4 className="font-medium mb-3">Alertas Ativos ({activeAlerts.length})</h4>
          
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum alerta configurado</p>
              <p className="text-sm mt-1">Crie alertas para ser notificado sobre oportunidades</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <Card key={alert.id} className={alert.triggered ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : ''}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{alert.symbol}</span>
                            <Badge variant="outline" className="text-xs">
                              {getAlertTypeLabel(alert.type)}
                            </Badge>
                            {alert.triggered && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                Disparado
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {alert.type === 'score' && `Score ${alert.condition} ${alert.value}`}
                            {alert.type === 'orderblock_touch' && `Preço toca R$ ${alert.value}`}
                            {alert.type === 'choch' && 'Mudança de caráter detectada'}
                          </p>
                          
                          <p className="text-xs text-slate-500 mt-1">
                            Criado: {new Date(alert.createdAt).toLocaleString('pt-BR')}
                            {alert.triggeredAt && (
                              <span className="block">
                                Disparado: {new Date(alert.triggeredAt).toLocaleString('pt-BR')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAlert(alert.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
          Os alertas são verificados a cada 30 segundos
        </p>
      </div>
    </div>
  );
}

