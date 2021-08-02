import { Server } from 'socket.io';
import { createServer } from 'http';
import { customAlphabet } from 'nanoid';

import { Room } from './Generic/Room';
import { has } from './Util/validator';

import { Ask } from './Games';
import { parseArgs } from './Util/event';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

type NewRoomParams = { protocol: string };
type JoinRoomParams = { room: string; force?: boolean } & NewRoomParams;

const port = process.env.PORT ?? 8085;

const server = createServer();
const io = new Server(server);

const rooms = new Map<string, Room>();
const protocols = new Map<string, typeof Room>();

const loadProtocol = (room: typeof Room) => {
  protocols.set(room.protocol, room);
};

io.on('connection', (socket) => {
  /** User's current room */
  let room: string | null = null;

  const join = (id: string) => {
    if (room && room !== id) {
      throw new Error(`Error while trying to join room: Socket is already in room ${room}`);
    }

    if (room !== id) {
      socket.join(id);
      room = id;
    }
  };

  const leave = () => {
    if (room) {
      socket.leave(room);
      room = null;
    }
  };

  // Handles creation of a new room
  socket.on('new', (...args) => {
    const [rawData, callback] = parseArgs(args);

    const data = has<NewRoomParams>(['protocol'])(rawData);
    if (!data.valid) {
      return callback({ status: 'error', code: 'MISSING_FIELDS', fields: data.missing });
    }

    if (!protocols.has(data.protocol)) {
      return callback({ status: 'error', code: 'INVALID_PROTOCOL' });
    }
    const protocol = protocols.get(data.protocol) as typeof Room;

    let id: string;
    do {
      id = nanoid();
    } while (rooms.has(id));

    // @ts-expect-error: Cannot create an instance of an abstract class.
    rooms.set(id, new protocol(io, id));

    return callback({ status: 'ok', id });
  });

  // Handles a user request to join a room
  socket.on('join', (...args) => {
    const [rawData, callback] = parseArgs(args);

    const data = has<JoinRoomParams>(['room', 'protocol'])(rawData);

    if (!data.valid) {
      return callback({ status: 'error', code: 'MISSING_FIELDS', fields: data.missing });
    }

    const roomId = data.room.toUpperCase();

    const room = rooms.get(roomId);
    if (!room) {
      return callback({ status: 'error', code: 'INVALID_ROOM' });
    }

    if (room.protocol !== data.protocol) {
      return callback({ status: 'error', code: 'INVALID_PROTOCOL' });
    }

    if (!room.joinable) {
      return callback({ status: 'error', code: 'NOT_JOINABLE' });
    }

    try {
      join(roomId);
    } catch (error) {
      return callback({ status: 'error', code: error.message });
    }

    return callback({ status: 'ok', id: roomId });
  });

  // Handles a user request to leave a room
  socket.on('leave', (...args) => {
    const [, callback] = parseArgs(args);

    leave();
    return callback({ status: 'ok' });
  });

  // Handles a query for the user's current room
  socket.on('room', (...args) => {
    const [, callback] = parseArgs(args);

    if (room) {
      return callback({ status: 'ok', id: room });
    } else {
      return callback({ status: 'error', code: 'NOT_IN_ROOM' });
    }
  });
});

console.log(`Listening on port ${port}`);

// Load room protocols
loadProtocol(Ask);

// Create debug room
if (process.env.NODE_ENV === 'development') {
  ['', ':QUESTION', ':ANSWER', ':RESULT'].forEach((suffix) => {
    rooms.set(`DEBUG${suffix}`, new Ask(io, `DEBUG${suffix}`));
  });

  console.log('Created debug `ASK` room with id `DEBUG`');
}

server.listen(+port, '0.0.0.0');
