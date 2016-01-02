var express = require("express"),
	path = require("path");

var start = function() {
	var app = express();
	var server = require("http").createServer(app);
	var io = require("socket.io").listen(server);

	app.use(express.static(path.join(__dirname, "public")));
	server.listen(3000);

	require("./requestHandler")(app);

	io.on("connection", function(socket) {
		require("./socketHandler")(socket, io);
	});

	console.log("listening port 3000");
};

exports.start = start;
