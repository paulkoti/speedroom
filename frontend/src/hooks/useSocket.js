import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('Tentando conectar ao servidor...');
    // Para produção: use a URL do seu domínio
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Conectado ao servidor com ID:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Desconectado do servidor');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erro de conexão:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, isConnected };
};