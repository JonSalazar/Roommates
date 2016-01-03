module.exports = function(socket, io, mdb) {
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
			var user_online = memory.members_online[i];
			if (user_online === data.user) {
				// skip your self
				continue;
			}
			m = {};
			m.name = bd[user_online].name;
			m.source = bd[user_online].src;
			socket.emit("new_login", m);
		}

		// set the avatar image src
		var v = {};
		v.src = bd[data.user].src;
		v.name = bd[data.user].name;
		socket.emit("set_image", v);

		// load the chat
		var callback = function(data) {
			socket.emit("load_talk", data);
		}
		mdb.get_global_talk(callback);

		console.log("member " + data.user + " connected");
		// if we already have this member connected
		if (already_socket !== "undefined") {
			return;
		}
		
		// add member to members' list
		memory.members_online[id_member] = data.user;

		
		// say to the all members that i arrive
		m = {};
		m.name = name;
		m.source = bd[data.user].src;
		socket.broadcast.emit("new_login", m);
		};

	var say = function(data) {
		var id_from = memory.members_online.indexOf(data.user);
		var youare = memory.member[id_from];
		var to = data.to;
		var token = data.token;

		if(!tools.validate_user(data.user, token)) {
			return;
		}

		var v = {};
		v.from = youare;
		v.text = data.txt;
		v.color = bd[data.user].color;

		if (to === "all") {
			v.global = true;
			io.sockets.emit("hear", v);
			mdb.all_add(bd[data.user].name, data.txt);
			return;
		}

		var id_member = memory.member.indexOf(to);
		var destination_socket = memory.socket[id_member];

		if (typeof(destination_socket) === "undefined") {
			console.log(youare + " is trying to talk with " + to + " and doesn't exist");
			return;
		}

		destination_socket.emit("hear", v);
		socket.emit("hear", v);
		mdb.add(bd[data.user].name, bd[data.user].id, bd[memory.members_online[id_member]].id, data.txt);
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

	var load_private_talk = function(name_to) {
		var id_member_from = memory.socket.indexOf(socket);
		if (id_member_from === -1) {
			return;
		}

		if (name_to === "all") {
			var callback = function(talk) {
				socket.emit("load_talk", talk);
			};
			mdb.get_global_talk(callback);
			return;
		}

		var id_member_to = memory.member.indexOf(name_to);
		if (id_member_to === -1) {
			return;
		}

		var user_from = memory.members_online[id_member_from];
		var user_to = memory.members_online[id_member_to]
		var callback = function(talk) {
			socket.emit("load_talk", talk);
		};
		mdb.get_talk(bd[user_from].id, bd[user_to].id, callback);
	};

	socket.on("login", 				login);
	socket.on("know_me", 			know_me);
	socket.on("say", 				say);
	socket.on("logout",				logout);
	socket.on("disconnect",			disconnect);
	socket.on("load_private_talk",	load_private_talk)
};