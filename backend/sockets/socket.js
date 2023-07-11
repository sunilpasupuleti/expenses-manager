const logger = require("../middleware/logger/logger");

let socketUsers = {};

module.exports = function socket(io) {
  io.on("connection", (socket) => {
    var handshakeData = socket.request._query;
    if (handshakeData && handshakeData.id) {
      let metadata = handshakeData.id;
      socketUsers[socket.id] = metadata;
      // console.log(JSON.parse(handshakeData));
    }
    logger.debug("CLIENT CONNECTED with ID -  " + socket.id);

    socket.on("refreshUserData", (data) => {
      io.to(socket.id).emit("refreshUserData", data);
    });

    socket.on("refreshUsers", (data) => {
      io.to(socket.id).emit("refreshUsers", data);
    });

    socket.on("refreshSendNotifications", (data) => {
      io.to(socket.id).emit("refreshSendNotifications", data);
    });

    socket.on("disconnect", (data) => {
      delete socketUsers[socket.id];
      logger.warn("CLIENT DISCONNECTED with ID -  " + socket.id);
    });
  });
};
