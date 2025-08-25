import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { getToken } from './auth';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public joinMatch(matchId: string): void {
    if (this.socket) {
      this.socket.emit('join-match', matchId);
    }
  }

  public sendMessage(matchId: string, message: string, messageType: string = 'text', replyTo?: string): void {
    if (this.socket) {
      this.socket.emit('send-message', { matchId, message, messageType, replyTo });
    }
  }

  public sendTyping(matchId: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { matchId, isTyping });
    }
  }
}

export default SocketService;