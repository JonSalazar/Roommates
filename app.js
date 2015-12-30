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
	var bduser = bd[user];
	if (typeof(bduser) === "undefined") {
		console.log("user unknown " + user);
		return false;
	}

	var name = bduser.name;
	var id_member = memory.member.indexOf(name);
	if (id_member === -1) {
		console.log("member not logged " + user);
		return false;
	}

	var user_token = memory.token[id_member];
	if (typeof(user_token) === "undefined" || token !== user_token) {
		console.log("token invalid " + user);
		return false;
	}

	return true;
};


io.on("connection", function(socket) {

	socket.on("say", function(data) {
		var youare = data.user;
		var to = data.to;
		var token = data.token;

		if(!validate_user(youare, token)) {
			return;
		}

		if (to === "all") {
			io.sockets.emit("hear", youare + ": " + data.txt);
			return;
		}

		var id_member = memory.member.indexOf(to);
		var destination_socket = memory.socket[id_member];

		if (typeof(destination_socket) === "undefined") {
			console.log(youare + " is trying to talk with " + to + " and doesn't exist");
			return;
		}
		
		destination_socket.emit("hear", youare + ": " + data.txt);
		socket.emit("hear", youare + ": " + data.txt);
	});

	socket.on("know_me", function(data) {
		// save the current member's socket
		if (!validate_user(data.user, data.token)) {
			console.log("invalid user " + data.user);
			return;
		}

		var name = bd[data.user].name;
		var id_member = memory.member.indexOf(name);
		var already_socket = typeof(memory.socket[id_member]);
		memory.socket[id_member] = socket;


		// add the default 'all'
		var m = {};
		m.name = "all";
		m.source = "all.png";
		socket.emit("new_login", m);

		// receive all the already logged members
		for(var i = 0; i < memory.members_online.length; i++) {
			var m = {};
			var user_online = memory.members_online[i];
			if (user_online === data.user) {
				// skip your self
				continue;
			}
			m.name = bd[user_online].name;
			m.source = bd[user_online].src;
			socket.emit("new_login", m);
		}

		// set the avatar image src
		socket.emit("set_image", bd[data.user].src);

		console.log("member " + name + " connected");
		// if we already have this member connected
		if (already_socket !== "undefined") {
			return;
		}
		
		// add member to members' list
		memory.members_online[id_member] = data.user;

		
		// say to the all members that i arrive
		var m = {};
		m.name = name;
		m.source = bd[name].src;
		socket.broadcast.emit("new_login", m);
	});


	socket.on("login", function(data) {
		var trying = bd[data.user];
		if (typeof(trying) === "undefined" || trying.pass !== data.pass) {
			socket.emit("whodoyouare");
			return;
		}

		var name = bd[data.user].name;
		var token = new_token();
		
		// accout currently inactive
		var id_member = memory.member.indexOf(name);
		if (id_member === -1) {
			id_member = memory.member.length;
			memory.member[id_member] = name;
			memory.token[id_member] = token;

		} else {
			// account currently active
			memory.token[id_member] = token;
			// use memory.socket[id_member] to warn to the other account that someone is logging in
		}
		
		var v = {};
		v.user = data.user;
		v.token = token;

		socket.emit("welcome", v);
	});


	socket.on("disconnect", function() {
		var id_member = memory.socket.indexOf(socket);
		if (id_member === -1) {
			return;
		}
		var name = memory.member[id_member];
		console.log("member " + name + " disconnected");
	});

	socket.on("logout", function() {
		var id_member = memory.socket.indexOf(socket);
		if (id_member === -1) {
			return;
		}
		var out_member = memory.member.splice(id_member, 1);
		memory.token.splice(id_member, 1);
		memory.socket.splice(id_member, 1);
		memory.members_online.splice(id_member, 1);

		// warn all users online that out_member is gone
		socket.broadcast.emit('member_is_gone', out_member);
		console.log("member " + out_member + " is logging out");
	});
});



console.log("listening port 3000");
