/**
 * Socket Handler - Registers all socket event listeners
 */

const {
  createRoom,
  joinRoom,
  getRoom,
  getPlayerRole,
  applyMoveToRoom,
  registerReplayVote,
  resetRoom,
  removePlayer,
  findPlayerRooms,
  getOpponentSocketId
} = require('./room-manager');

/**
 * Initialize socket event handlers
 * @param {Object} io - Socket.io server instance
 */
function initSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle create_room event
    socket.on('create_room', async (data) => {
      try {
        const { passKey } = data;

        // Validate passKey
        if (!passKey || typeof passKey !== 'string' || passKey.length < 4 || passKey.length > 20) {
          socket.emit('error', {
            code: 'INVALID_PASSKEY',
            message: 'Pass key must be 4-20 characters'
          });
          return;
        }

        const roomId = await createRoom(passKey, socket.id);
        
        // Creator also needs to join the socket room to receive game_start
        socket.join(roomId);
        
        socket.emit('room_created', { roomId });
        console.log(`Room created: ${roomId}`);
      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('error', {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create room'
        });
      }
    });

    // Handle join_room event
    socket.on('join_room', async (data) => {
      try {
        const { roomId, passKey } = data;

        // Validate inputs
        if (!roomId || typeof roomId !== 'string' || roomId.length !== 6) {
          socket.emit('error', {
            code: 'INVALID_ROOM_ID',
            message: 'Room ID must be 6 characters'
          });
          return;
        }

        if (!passKey || typeof passKey !== 'string') {
          socket.emit('error', {
            code: 'INVALID_PASSKEY',
            message: 'Pass key is required'
          });
          return;
        }

        const result = await joinRoom(roomId, passKey, socket.id);

        if (!result.success) {
          socket.emit('error', result.error);
          return;
        }

        // Join the socket room
        socket.join(roomId);

        const room = getRoom(roomId);

        if (result.alreadyJoined) {
          // Player reconnected - send current game state
          socket.emit('game_start', {
            board: room.board,
            turn: room.turn,
            role: result.role
          });
          return;
        }

        // If game is ready to start (2 players), notify both
        if (room.status === 'playing') {
          // Notify both players
          room.players.forEach(player => {
            io.to(player.socketId).emit('game_start', {
              board: room.board,
              turn: room.turn,
              role: player.role
            });
          });
          console.log(`Game started in room: ${roomId}`);
        } else {
          // Waiting for second player
          socket.emit('game_start', {
            board: room.board,
            turn: room.turn,
            role: result.role
          });
        }
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', {
          code: 'INTERNAL_ERROR',
          message: 'Failed to join room'
        });
      }
    });

    // Handle make_move event
    socket.on('make_move', (data) => {
      try {
        const { roomId, index } = data;

        // Validate inputs
        if (!roomId || typeof roomId !== 'string') {
          socket.emit('error', {
            code: 'INVALID_ROOM_ID',
            message: 'Room ID is required'
          });
          return;
        }

        if (typeof index !== 'number' || index < 0 || index > 8) {
          socket.emit('error', {
            code: 'INVALID_CELL',
            message: 'Cell index must be 0-8'
          });
          return;
        }

        const result = applyMoveToRoom(roomId, socket.id, index);

        if (!result.success) {
          socket.emit('error', result.error);
          return;
        }

        // Broadcast board update to both players
        io.to(roomId).emit('board_update', {
          board: result.room.board,
          turn: result.room.turn,
          winner: result.winner
        });

        if (result.winner) {
          console.log(`Game ended in room ${roomId}. Winner: ${result.winner}`);
        }
      } catch (error) {
        console.error('Error making move:', error);
        socket.emit('error', {
          code: 'INTERNAL_ERROR',
          message: 'Failed to make move'
        });
      }
    });

    // Handle replay_request event
    socket.on('replay_request', (data) => {
      try {
        const { roomId } = data;

        if (!roomId || typeof roomId !== 'string') {
          socket.emit('error', {
            code: 'INVALID_ROOM_ID',
            message: 'Room ID is required'
          });
          return;
        }

        const result = registerReplayVote(roomId, socket.id);

        if (!result.success) {
          socket.emit('error', result.error);
          return;
        }

        // Broadcast vote count to both players
        io.to(roomId).emit('replay_vote', { votes: result.votes });

        // If both players voted, reset and start new game
        if (result.votes === 2) {
          const room = resetRoom(roomId);
          if (room) {
            room.players.forEach(player => {
              io.to(player.socketId).emit('game_start', {
                board: room.board,
                turn: room.turn,
                role: player.role
              });
            });
            console.log(`Game restarted in room: ${roomId}`);
          }
        }
      } catch (error) {
        console.error('Error handling replay request:', error);
        socket.emit('error', {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process replay request'
        });
      }
    });

    // Handle leave_room event
    socket.on('leave_room', (data) => {
      try {
        const { roomId } = data;

        if (!roomId || typeof roomId !== 'string') {
          return;
        }

        const room = getRoom(roomId);
        const opponentSocketId = getOpponentSocketId(roomId, socket.id);

        socket.leave(roomId);
        const result = removePlayer(roomId, socket.id);

        // Notify opponent if they exist
        if (opponentSocketId && result.hadPlayers) {
          io.to(opponentSocketId).emit('player_left', {});
        }

        console.log(`Player ${socket.id} left room ${roomId}`);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // Handle disconnect event
    socket.on('disconnect', () => {
      try {
        console.log(`Client disconnected: ${socket.id}`);

        // Find all rooms this player is in
        const playerRooms = findPlayerRooms(socket.id);

        for (const roomId of playerRooms) {
          const opponentSocketId = getOpponentSocketId(roomId, socket.id);
          const result = removePlayer(roomId, socket.id);

          // Notify opponent if they exist
          if (opponentSocketId && result.hadPlayers) {
            io.to(opponentSocketId).emit('player_left', {});
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });
}

module.exports = initSocketHandlers;