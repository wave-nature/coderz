require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const otpRouter = require("./routes");
const DBConnect = require("./db");
const { globalErrorHandler } = require("./controllers/error");
const AppError = require("./utils/AppError");
const ACTIONS = require("./actions");

const app = express();

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: [
      "https://coders-villa.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    method: ["GET", "POST"],
  },
});
// COOKIE PARSER
app.use(cookieParser());
// BODY PARSER
app.use(express.json({ limit: "8mb" }));

const corsOptions = {
  //To allow requests from client
  origin: [
    "https://coders-villa.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  credentials: true,
  exposedHeaders: ["set-cookie"],
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 5500;
DBConnect();

app.use("/storage", express.static("storage"));
app.get("/", (req, res) => {
  app.use(express.static(__dirname, "build"));
  res.sendFile(path.resolve(__dirname, "build", "index.html"));
});

app.use(otpRouter);

app.get("/404", (req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

// sockets

const socketUserMapping = {};

io.on("connection", (socket) => {
  console.log("new connection id", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, user }) => {
    socketUserMapping[socket.id] = user;
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

    clients.forEach((clientId) => {
      //clientId = socket id of each user

      // to tell each client to add peer
      io.to(clientId).emit(ACTIONS.ADD_PEER, {
        peerId: socket.id, // my socket id
        createOffer: false, //telling to connect me (that means I have to create offer not all user)
        user, // me
      });
      // to add me
      socket.emit(ACTIONS.ADD_PEER, {
        peerId: clientId, // to send every user
        createOffer: true, // to send offer to each client
        user: socketUserMapping[clientId],
      });
    });

    socket.join(roomId);
  });

  // handle relay ice
  socket.on(ACTIONS.RELAY_ICE, ({ peerId, icecandidate }) => {
    io.to(peerId).emit(ACTIONS.ICE_CANDIDATE, {
      peerId: socket.id,
      icecandidate,
    });
  });
  // handle relay sdp
  socket.on(ACTIONS.RELAY_SDP, ({ peerId, sessionDescription }) => {
    io.to(peerId).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerId: socket.id,
      sessionDescription,
    });
  });

  // mute/unmute
  socket.on(ACTIONS.MUTE, ({ roomId, userId }) => {
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.MUTE, {
        peerId: socket.id,
        userId,
      });
    });
  });
  socket.on(ACTIONS.UN_MUTE, ({ roomId, userId }) => {
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.UN_MUTE, {
        peerId: socket.id,
        userId,
      });
    });
  });

  // remove peer (when close button| unmount component)
  const leaveRoom = ({ roomId }) => {
    const { rooms } = socket;

    Array.from(rooms).forEach((roomId) => {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

      clients.forEach((clientId) => {
        io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
          peerId: socket.id,
          userId: socketUserMapping[socket.id]?._id,
        });
        socket.emit(ACTIONS.REMOVE_PEER, {
          peerId: clientId,
          userId: socketUserMapping[clientId]?._id,
        });
      });

      socket.leave(roomId);
    });

    delete socketUserMapping[socket.id];
  };
  socket.on(ACTIONS.LEAVE, leaveRoom);
  socket.on("disconnecting", leaveRoom);
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
