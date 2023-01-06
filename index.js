const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.use((socket, next) => {
  username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

io.on("connection", (socket) => {
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      username: socket.username,
    });
  }
  socket.emit("connection info", { socketID: socket.id });
  socket.emit("users", users);

  socket.broadcast.emit("user connected", {
    userID: socket.id,
    username: socket.username,
  });

  socket.on("private message", ({ message, to, time }) => {
    console.log(message, to);
    socket.to(to).emit("private message", {
      message,
      from: socket.id,
      fromUsername: socket.username,
      time,
    });
  });

  socket.on("message", (msg) => {
    io.emit("message", msg);
    console.log(`From ${socket.id} - ${msg}`);
  });

  socket.on("disconnect", (reason) => {
    console.log("Reason", reason);
    io.emit("client-disconnect", socket.id);
  });
});

server.listen(4000, () => {
  console.log("listening on *:4000");
});
