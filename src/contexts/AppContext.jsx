import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { createAppState, ACTIONS } from '../types/index.js';
import dataConnector from '../services/DataConnector.js';

// Contexto da aplicação
const AppContext = createContext();

// Reducer para gerenciar o estado global
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.UPDATE_ASSET_DATA:
      const { symbol, data, timeframe } = action.payload;
      const updatedAssets = new Map(state.assets);
      
      if (!updatedAssets.has(symbol)) {
        updatedAssets.set(symbol, {
          symbol,
          timeframes: { weekly: { data: [] }, daily: { data: [] }, fourHour: { data: [] } },
          lastUpdate: Date.now()
        });
      }
      
      const asset = updatedAssets.get(symbol);
      asset.timeframes[timeframe] = { ...asset.timeframes[timeframe], data };
      asset.lastUpdate = Date.now();
      updatedAssets.set(symbol, asset);
      
      return {
        ...state,
        assets: updatedAssets,
        connection: {
          ...state.connection,
          lastUpdate: Date.now()
        }
      };

    case ACTIONS.ADD_TO_WATCHLIST:
      if (!state.watchlist.includes(action.payload)) {
        return {
          ...state,
          watchlist: [...state.watchlist, action.payload]
        };
      }
      return state;

    case ACTIONS.REMOVE_FROM_WATCHLIST:
      return {
        ...state,
        watchlist: state.watchlist.filter(symbol => symbol !== action.payload)
      };

    case ACTIONS.UPDATE_ANALYSIS:
      const analysisAssets = new Map(state.assets);
      const analysisAsset = analysisAssets.get(action.payload.symbol);
      
      if (analysisAsset) {
        analysisAssets.set(action.payload.symbol, {
          ...analysisAsset,
          ...action.payload.analysis
        });
      }
      
      return {
        ...state,
        assets: analysisAssets
      };

    case ACTIONS.ADD_ALERT:
      return {
        ...state,
        alerts: [...state.alerts, action.payload]
      };

    case ACTIONS.REMOVE_ALERT:
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.payload)
      };

    case ACTIONS.TRIGGER_ALERT:
      return {
        ...state,
        alerts: state.alerts.map(alert => 
          alert.id === action.payload ? 
          { ...alert, triggered: true, triggeredAt: Date.now() } : 
          alert
        )
      };

    case ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };

    case ACTIONS.SET_CONNECTION_STATUS:
      return {
        ...state,
        connection: { ...state.connection, ...action.payload }
      };

    case ACTIONS.ADD_ERROR:
      return {
        ...state,
        connection: {
          ...state.connection,
          errors: [...state.connection.errors, action.payload]
        }
      };

    case ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        connection: { ...state.connection, errors: [] }
      };

    default:
      return state;
  }
}

// Provider do contexto
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, createAppState());

  // Efeito para inicializar conexão com dados
  useEffect(() => {
    const initializeConnection = async () => {
      dispatch({
        type: ACTIONS.SET_CONNECTION_STATUS,
        payload: { status: 'connecting' }
      });

      try {
        await dataConnector.connect();
        
        dispatch({
          type: ACTIONS.SET_CONNECTION_STATUS,
          payload: { 
            status: 'connected',
            lastUpdate: Date.now()
          }
        });

        // Adiciona alguns ativos à watchlist inicial
        const initialAssets = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3'];
        initialAssets.forEach(symbol => {
          dispatch({
            type: ACTIONS.ADD_TO_WATCHLIST,
            payload: symbol
          });
        });

      } catch (error) {
        dispatch({
          type: ACTIONS.SET_CONNECTION_STATUS,
          payload: { status: 'error' }
        });
        
        dispatch({
          type: ACTIONS.ADD_ERROR,
          payload: {
            message: 'Erro ao conectar com feed de dados',
            timestamp: Date.now(),
            error
          }
        });
      }
    };

    initializeConnection();

    // Cleanup na desmontagem
    return () => {
      dataConnector.disconnect();
    };
  }, []);

  // Efeito para subscrever aos dados da watchlist
  useEffect(() => {
    const subscriptions = new Map();

    state.watchlist.forEach(symbol => {
      if (!subscriptions.has(symbol)) {
        const callback = (data) => {
          dispatch({
            type: ACTIONS.UPDATE_ASSET_DATA,
            payload: {
              symbol: data.symbol,
              data: data.data,
              timeframe: data.timeframe || 'daily'
            }
          });
        };

        dataConnector.subscribe(symbol, callback);
        subscriptions.set(symbol, callback);
      }
    });

    // Cleanup de subscrições removidas
    return () => {
      subscriptions.forEach((callback, symbol) => {
        dataConnector.unsubscribe(symbol, callback);
      });
    };
  }, [state.watchlist]);

  // Funções auxiliares para o contexto
  const contextValue = {
    state,
    dispatch,
    
    // Ações convenientes
    addToWatchlist: (symbol) => {
      dispatch({
        type: ACTIONS.ADD_TO_WATCHLIST,
        payload: symbol
      });
    },
    
    removeFromWatchlist: (symbol) => {
      dispatch({
        type: ACTIONS.REMOVE_FROM_WATCHLIST,
        payload: symbol
      });
    },
    
    updateAnalysis: (symbol, analysis) => {
      dispatch({
        type: ACTIONS.UPDATE_ANALYSIS,
        payload: { symbol, analysis }
      });
    },
    
    addAlert: (alert) => {
      dispatch({
        type: ACTIONS.ADD_ALERT,
        payload: alert
      });
    },
    
    removeAlert: (alertId) => {
      dispatch({
        type: ACTIONS.REMOVE_ALERT,
        payload: alertId
      });
    },
    
    updateSettings: (settings) => {
      dispatch({
        type: ACTIONS.UPDATE_SETTINGS,
        payload: settings
      });
    },
    
    // Getters convenientes
    getAsset: (symbol) => state.assets.get(symbol),
    
    getAssetData: (symbol, timeframe = 'daily') => {
      const asset = state.assets.get(symbol);
      return asset?.timeframes[timeframe]?.data || [];
    },
    
    isInWatchlist: (symbol) => state.watchlist.includes(symbol),
    
    getConnectionStatus: () => state.connection.status,
    
    getAvailableAssets: () => dataConnector.getAvailableAssets()
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook para usar o contexto
export function useApp() {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  
  return context;
}

export default AppContext;

