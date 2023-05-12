const express = require("express");
const path = require("path");
const uuid = require("uuid");
const bodyParser = require("body-parser");
const app = express();
const http = require("http");
const server = http.createServer(app);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const { Server } = require("socket.io");
const io = new Server(server);
//db work
const mongo = require("./db/mongo.js");

//end db work
app.use(express.static(path.resolve(__dirname, "front")));
//make sign up user
app.post("/signup", (req, res) => {
  console.log(req.body);
  let user_phone_number = req.body.phone;
  let uid = uuid.v4();
  //user inserting
  let userInserting = mongo.userInsert({
    user_phone: user_phone_number,
    uid: uid,
  });
  userInserting.then(console.log).catch(console.error);
  res.json({ success: true });
});
//make login
app.post("/login", (req, res) => {
  let user_phone_number = req.body.phone;
  console.log(user_phone_number);
  //user find
  let userFinding = mongo.userFind({
    user_phone: user_phone_number,
  });
  userFinding
    .then((data) => {
      res.json({ ...data, success: true });
    })
    .catch(console.error);
});
app.use("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "front/index.html"));
});
let users = {};
io.on("connection", (socket) => {
  console.log("user connected", socket.id);
  //!get socket id for specific phone number
  socket.on("userphonegrab", (data) => {
    users[data.phoneNumber] = socket.id;
    console.log(users);
  });
  socket.on("calltoOtherUser", (data) => {
    let toCall = users[data.toCall];
    // console.log(data);
    //when the user is online
    if (toCall) {
      io.to(toCall).emit("call_incoming", {
        fromCall: data.fromCall,
        theOffer: data.theOffer,
      });
    }
  });
  socket.on("callRecieved", (data) => {
    let toAnswering = users[data.toAnswer];
    //when the user is online
    if (toAnswering) {
      io.to(toAnswering).emit("comedAnswer", { finalanswer: data.theAnswer });
    }
  });
  socket.on("ice-candidate", (data) => {
    let toIceCandidate = users[data.toice];
    //when the user is online
    if (toIceCandidate) {
      io.to(toIceCandidate).emit("candidateReady", {
        iceCandidate: data.candidate,
      });
    }
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(9000, () => {
  console.log("server is running ");
});
