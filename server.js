// Connection URL
const URL = "mongodb://localhost:27017";
//Port
const PORT = 4000;

const app = require("express")();
const SocketIO = require("socket.io");
const http = require("http");

const server = http.Server(app);
const io = SocketIO(server);

const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

server.listen(PORT, () => {
  console.log("server running on " + PORT);
});

MongoClient.connect(URL, function(err, client) {
  assert.equal(null, err);
  console.log("MongoDB connected with IraGram DB...");

  const db = client.db("iragram");
  const userinfo = db.collection("userinfo");
  const chats = db.collection("chats");

  io.on("connection", function(socket) {
    console.log("Someone connected...");

    socket.on("singIn", function(data) {
      const { login, file } = data;

      if (login !== undefined && file !== "") {
        console.log("singIn with login: " + login);
        userinfo.insertOne({ login: login, file: file });
      }

      chats
        .find()
        .limit(100)
        .toArray(function(err, data) {
          if (err) {
            throw err;
          }
          socket.emit("output", data);
        });

      socket.on("getUserAvatar", function(userLogin) {
        userinfo.find().toArray(function(err, users) {
          if (err) {
            throw err;
          }
          let user = users.find(user => user.login == userLogin);

          // console.log(user.file);
          socket.emit("setUserAvatar", user.file);
        });
      });
    });

    socket.on("sendMessage", function(data) {
      const { login, message } = data;
      chats.insertOne({ login: login, message: message });
      socket.emit("singleOutput", data);
      socket.broadcast.emit("singleOutput", data);
    });
  });
});
