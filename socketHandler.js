module.exports = function(socket, io) {
	var tools = require("./tools");
	var memory = require("./memory");
	var bd = require("./bd");

	var login = function(data) {
		var trying = bd[data.user];
		if (typeof(trying) === "undefined" || trying.pass !== data.pass) {
			socket.emit("whodoyouare");
			return;
		}

		var name = bd[data.user].name;
		var token = tools.new_token();
		
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
	};

	var know_me = function(data) {
		// save the current member's socket
		if (!tools.validate_user(data.user, data.token)) {
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
		};

	var say = function(data) {
		var youare = data.user;
		var to = data.to;
		var token = data.token;

		if(!tools.validate_user(youare, token)) {
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
	};


	var logout = function(data) {
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
	};

	var disconnect = function(data) {
		var id_member = memory.socket.indexOf(socket);
		if (id_member === -1) {
			return;
		}
		var name = memory.member[id_member];
		console.log("member " + name + " disconnected");
	};


	socket.on("login", 		login);
	socket.on("know_me", 	know_me);
	socket.on("say", 		say);
	socket.on("logout", 	logout);
	socket.on("disconnect", disconnect);
};