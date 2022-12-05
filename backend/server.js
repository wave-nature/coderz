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
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    method: ["GET", "POST"],
  },
});
// COOKIE PARSER
app.use(cookieParser());
// BODY PARSER
app.use(express.json({ limit: "8mb" }));

const corsOptions = {
  //To allow requests from client
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  exposedHeaders: ["set-cookie"],
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 5500;
DBConnect();

app.use("/storage", express.static("storage"));

app.use(otpRouter);

app.get("/", async (req, res) => {
  res.send("Running");
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
      io.to(clientId).emit(ACTIONS.ADD_PEER, {});
      socket.join(roomId);
    });

    // to add me
    socket.emit(ACTIONS.ADD_PEER, {});
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
