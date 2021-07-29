import { Server, Socket } from 'socket.io';

export abstract class Room {
  constructor(private _io: Server, public id: string) {
    _io.of('/').adapter.on('join-room', (room: string, socketId: string) => {
      const socket = _io.of('/').sockets.get(socketId);
      if (socket) {
        if (room === id) this.onJoin(socket);
      }
    });

    _io.of('/').adapter.on('leave-room', (room: string, socketId: string) => {
      const socket = _io.of('/').sockets.get(socketId);
      if (socket) {
        if (room === id) this.onLeave(socket);
      }
    });
  }

  protected get io() {
    return this._io.in(this.id);
  }

  static readonly protocol: string;

  public get protocol(): string {
    return (this.constructor as typeof Room).protocol;
  }

  public get joinable(): boolean {
    return true;
  }

  protected players = new Set<Socket>();

  protected onJoin(socket: Socket) {
    this.players.add(socket);
  }

  protected onLeave(socket: Socket) {
    this.players.delete(socket);
  }
}
