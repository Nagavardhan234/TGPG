import io, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  private socket: Socket | null = null;
  private roomId: string | null = null;

  async connect() {
    try {
      const token = await AsyncStorage.getItem('student_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      this.socket = io(API_BASE_URL, {
        auth: {
          token
        },
        transports: ['websocket']
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  joinRoom(roomId: string) {
    if (!this.socket) return;
    this.roomId = roomId;
    this.socket.emit('join_room', { roomId });
  }

  leaveRoom() {
    if (!this.socket || !this.roomId) return;
    this.socket.emit('leave_room', { roomId: this.roomId });
    this.roomId = null;
  }

  subscribeToTaskUpdates(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('task_update', callback);
  }

  unsubscribeFromTaskUpdates() {
    if (!this.socket) return;
    this.socket.off('task_update');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService(); 