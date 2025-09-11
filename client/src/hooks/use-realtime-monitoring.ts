import { useEffect, useRef, useState } from 'react';
import { queryClient } from '@/lib/queryClient';

interface RealtimeMessage {
  type: 'initial_status' | 'device_status_change' | 'new_alert';
  timestamp: string;
  message?: string;
  deviceId?: string;
  customerId?: string;
  deviceCode?: string;
  oldStatus?: string;
  newStatus?: string;
  alert?: any;
}

interface ConnectionStatus {
  isConnected: boolean;
  lastMessage: RealtimeMessage | null;
  connectionTime: Date | null;
  deviceUpdates: number;
  alertCount: number;
}

export function useRealtimeMonitoring() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastMessage: null,
    connectionTime: null,
    deviceUpdates: 0,
    alertCount: 0
  });

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Use current window location for WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/monitoring`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Real-time monitoring connected');
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: true,
          connectionTime: new Date()
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          console.log('Real-time update:', message);

          setConnectionStatus(prev => ({
            ...prev,
            lastMessage: message,
            deviceUpdates: message.type === 'device_status_change' ? prev.deviceUpdates + 1 : prev.deviceUpdates,
            alertCount: message.type === 'new_alert' ? prev.alertCount + 1 : prev.alertCount
          }));

          // Handle different message types
          switch (message.type) {
            case 'device_status_change':
              // Invalidate POS devices cache to refresh data
              queryClient.invalidateQueries({ queryKey: ['/api/pos-devices'] });
              queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
              break;

            case 'new_alert':
              // Invalidate alerts cache to show new alerts
              queryClient.invalidateQueries({ queryKey: ['/api/alerts/unread'] });
              queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
              
              // Show toast notification for high priority alerts
              if (message.alert?.priority === 'high') {
                // Note: This would require implementing toast notifications
                console.log('High priority alert:', message.alert.title);
              }
              break;

            case 'initial_status':
              console.log('Connected to monitoring system:', message.message);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Real-time monitoring disconnected');
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          connectionTime: null
        }));

        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false
        }));
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    connectionStatus,
    connect,
    disconnect,
    isConnected: connectionStatus.isConnected
  };
}