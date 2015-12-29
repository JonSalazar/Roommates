var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var path = require("path");


app.use(express.static(path.join(__dirname, "public")));

server.listen(3000);
var memory = require("./memory.js");
var bd = require("./bd.js");


app.get("/", function(req, res) {
	res.sendFile(__dirname + "/login.html");
});
app.get("/main", function(req, res) {
	var user = req.query.u;
	var token = req.query.t;
	if (validate_user(user, token)) {
		res.sendFile(__dirname + "/main.html");
	} else {
		res.sendFile(__dirname + "/login.html");
	}
});



// tools
var rand = function() {
    return Math.random().toString(36).substr(2); // remove `0.`
};

var new_token = function() {
    return rand() + rand(); // to make it longer
};


var validate_user = function(user, token) {
	var user_t = memory.member[token];
	if (typeof(user_t) === "undefined" || user !== user_t) {
		console.log("user unknown " + user);
		return false;
	} else {
		return true;
	}
};


io.on("connection", function(socket) {

	socket.on("say", function(data) {
		var youare = data.persona;
		var to = data.to;
		var token = data.token;
		if (youare !== memory.member[token]) {
			// someone is a cheater
			console.log("someone is a cheater");
			return;
		}

		if (to === "all") {
			io.sockets.emit("hear", youare + ": " + data.txt);
			return;
		}

		var destination_socket = memory.socket[to];

		if (typeof(destination_socket) === "undefined") {
			console.log(youare + " is trying to talk with " + to + " and doesn't exist");
			return;
		}
		
		destination_socket.emit("hear", youare + ": " + data.txt);
		socket.emit("hear", youare + ": " + data.txt);
	});

	socket.on("know_me", function(data) {
		// save the current member's socket
		if (validate_user(data.user, data.token)) {
			memory.socket[data.user] = socket;
		}

		// add member to members' list
		memory.members_online.push(data.user);

		// receive all the already logged members
		for(var i = 0; i < memory.members_online.length; i++) {
			var m = {};
			m.name = memory.members_online[i];
			m.source = bd[m.name].src;
			socket.emit("new_login", m);
		}
		// add the default 'all'
		var m = {};
		m.name = "all";
		m.source = "nobody.png";
		socket.emit("new_login", m);

		// say to the all members that i arrive
		var m = {};
		m.name = data.user;
		m.source = bd[data.user].src;
		socket.broadcast.emit("new_login", m);
	});


	socket.on("login", function(data) {
		var trying = bd[data.user];
		if (typeof(trying) === "undefined" || trying.pass !== data.pass) {
			socket.emit("whodoyouare");
			return;
		}

		var token = new_token();
		var user = bd[data.user].user;
		memory.member[token] = user;

		var v = {};
		v.user = user;
		v.token = token;

		socket.emit("welcome", v);
	});

	console.log("new IO connection");
});



console.log("listening port 3000");
