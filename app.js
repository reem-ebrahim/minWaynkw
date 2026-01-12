const express = require("express");
const { connectdb } = require("./DB/connectdb");
const Routercollection = require("./modules/router")
const cors = require("cors");
const app = express();
const path = require("path")
const responseMiddleware = require("./Middleware/response");
const { Server } = require("socket.io");

require("dotenv").config();
app.use(responseMiddleware);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/var/task/uploads/picture",  express.static('./uploads/picture'))

app.use("/api/user", Routercollection.userRouter)
app.use("/api/post", Routercollection.postRouter)
app.use("/api/comment", Routercollection.commentRouter)
app.use(cors("*"));
connectdb();
app.get("/", (req, res) => res.json("welcome"));
const server=app.listen(process.env.PORT, () => {
  console.log("server is running on port");
});

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    socket.join(userId);
  });
});
exports.io = io