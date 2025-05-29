let socketUsers = {};

module.exports = function socket(io) {
  io.on("connection", (socket) => {
    var handshakeData = socket.request._query;
    if (handshakeData && handshakeData.id) {
      let metadata = handshakeData.id;
      socketUsers[socket.id] = metadata;
      // console.log(JSON.parse(handshakeData));
    }
    console.debug("CLIENT CONNECTED with ID -  " + socket.id);

    socket.on("disconnect", (data) => {
      delete socketUsers[socket.id];
      console.warn("CLIENT DISCONNECTED with ID -  " + socket.id);
    });
  });
};
