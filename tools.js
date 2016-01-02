var memory = require("./memory.js");
var bd = require("./bd.js");

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

exports.new_token = new_token;
exports.validate_user = validate_user;