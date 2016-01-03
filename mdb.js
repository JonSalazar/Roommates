var mongoose = require("mongoose");

var db = mongoose.connect("mongodb://localhost/Roommates");

var Schema = mongoose.Schema;
var messageSchema = new Schema({
	from	: { type: String },
	text	: { type: String },
	date	: { type: Date }
});


// ADD MESSAGE
var add = function(from_name, from, to, data) {
	from = "p" + from;
	to = "p" + to;
	var room = from < to ? from + to : to + from;

	add_generic(from_name, room, data);
	
};

var all_add = function(from_name, data) {
	add_generic(from_name, "all", data);
};

var add_generic = function(from_name, room, data) {
	mongoose.model(room, messageSchema);
	var Message = mongoose.model(room);

	var msg = new Message();
	msg.from	= from_name;
	msg.text	= data;
	msg.date 	= new Date().toLocaleString();

	msg.save(function(err, msg_saved) {
		if (err) {
			console.log(err);
			throw err;
		}
	});
};


// GET TALK
var get_talk = function(from, to, callback) {
	from = "p" + from;
	to = "p" + to;
	var room = from < to ? from + to : to + from;

	get_generic_talk(room, callback);
}

var get_global_talk = function(callback) {
	get_generic_talk("all", callback);
}

var get_generic_talk = function(room, callback) {
	var talk = [];
	mongoose.model(room, messageSchema);
	mongoose.model(room).find(function(err, res) {
		if(err) {
			console.log(err);
			throw err;
		}
		for (var i = 0; i < res.length; i++) {
			talk.push(res[i]);
		}
		callback(talk);
	}).sort({"date": -1}).limit(20);
}

exports.add = add;
exports.all_add = all_add;
exports.get_talk = get_talk;
exports.get_global_talk = get_global_talk;