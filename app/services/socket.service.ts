import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/endpoints';

class SocketService {
  private socket: Socket | null = null;
  private taskUpdateCallback: (() => void) | null = null;

  public async connect() {
    try {
      const token = await AsyncStorage.getItem('student_token');
      if (!token) {
        console.warn('No token available for socket connection');
        return;
      }

      this.socket = io(BASE_URL, {
        auth: { token }
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
      });

      this.socket.on('task_update', () => {
        console.log('Task update received');
        if (this.taskUpdateCallback) {
          this.taskUpdateCallback();
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  }

  public joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('join_room', { roomId });
      console.log('Joining room:', roomId);
    }
  }

  public leaveRoom() {
    if (this.socket) {
      this.socket.emit('leave_room');
      console.log('Leaving room');
    }
  }

  public subscribeToTaskUpdates(callback: () => void) {
    this.taskUpdateCallback = callback;
  }

  public unsubscribeFromTaskUpdates() {
    this.taskUpdateCallback = null;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket disconnected');
    }
  }
}

export const socketService = new SocketService(); 