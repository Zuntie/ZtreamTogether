const express = require('express');
const bodyParser = require('body-parser');
const shortid = require('shortid');


const app = express();
const http = require('http');
const server = http.createServer(app);


const io = require('socket.io')(server);


// Stored Variables
const streams = {};
let roomUsers = new Map();
const readyUsersByRoom = {};


// Configurations for express
app.use(express.static('public'));
app.use(bodyParser.json());
app.set('view engine', 'ejs');


// Default route
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});


// Make a new stream
app.post('/stream/new', (req, res) => {
  const uniqueID = shortid.generate();
  const streamData = req.body.streamURL;

  streams[uniqueID] = streamData;

  res.render('streamPage', { streamData, streamID: uniqueID }, (err, html) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal server error');
    } else {
      res.json({ uniqueID: uniqueID });
    }
  });
});


// For every stream that has an id
app.get('/stream/:id', (req, res) => {
  const streamID = req.params.id;

  if (streams.hasOwnProperty(streamID)) {
    const streamData = streams[streamID];
    res.render('streamPage', { streamData, streamID });
  } else {
    res.render('streamNotFound', { streamData: streamID });
  }
});


// For the 404 page to load the style
app.get('/stream.style', (req, res) => {
  res.sendFile(__dirname + '/public/style.css');
});


// When a user connects to the socket
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.leaveAll();


  // When a user joins a room
  socket.on('join', function (room) {
    console.log(`User ${socket.id} joined room ${room}`);

    socket.join(room);
    io.to(room).emit('notAllReady');

    socket.broadcast.to(room).emit('userjoin', socket.id);

    if (!readyUsersByRoom[room]) {
      readyUsersByRoom[room] = new Set();
    }

    if (!roomUsers.has(room)) {
      roomUsers.set(room, new Set());
    }
  });


  // When the play event gets triggered
  socket.on('play', (data) => {
    console.log(data)
    console.log('Play SERVER')
    socket.broadcast.to(data.roomId).emit('play', data);
  });


  // When the pause event gets triggered
  socket.on('pause', function (data) {
    console.log('Received pause event:', data);
    console.log(data)

    if (!data || !data.roomId) {
      console.log('Error: Invalid data received for pause event');
      return;
    }

    console.log('Pause SERVER', data);
    console.log('Room:', data.roomId);

    socket.broadcast.to(data.roomId).emit('pause', data);
  });


  // When a user is seeking or changeing the playback position
  socket.on('seek', function (data) {
    console.log(data)
    console.log('Seek SERVER');
    socket.broadcast.to(data.roomId).emit('seek', data);
  });


  // When a user is ready to play the source
  socket.on('ready', function (data) {
    console.log('User is ready to play');
    const roomId = data.room;

    if (!readyUsersByRoom[roomId]) {
      readyUsersByRoom[roomId] = new Set();
    }

    readyUsersByRoom[roomId].add(socket.id);

    const room = io.sockets.adapter.rooms.get(roomId);
    const readyUsers = readyUsersByRoom[roomId];

    if (room && readyUsers.size === room.size) {

      setTimeout(function () {
        console.log('Everyone ready, emitting allReady event');
        io.to(roomId).emit('allReady');
      }, 500);

    } else {
      io.to(roomId).emit('notAllReady');
    }
  });


  // When a user disconnects from the socket
  socket.on('disconnecting', function () {
    console.log('A user disconnected');
    let roomId;

    for (const [key, value] of io.sockets.adapter.rooms) {
      if (value.has(socket.id)) {
        console.log('Found it', key)
        roomId = key;
        break
      }
    }

    if (roomId) {
      if (readyUsersByRoom[roomId]) {
        readyUsersByRoom[roomId].delete(socket.id);
        socket.leaveAll();
        socket.broadcast.to(roomId).emit('userdisconnect', socket.id);
        console.log(`User left the room. Remaining users: ${readyUsersByRoom[roomId].size}`);
      }
    }
  });


  // When a user presses the sync button
  socket.on('sync', function(data) {
    socket.broadcast.to(data.roomId).emit('sync', data);
  })
});


// Listen on port 3000
server.listen(3000, () => {
  console.log('Server is running on port http://localhost:3000');
});
