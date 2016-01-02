module.exports = function(app) {
	var tools = require("./tools.js");

	app.get("/", function(req, res) {
		res.sendFile(__dirname + "/login.html");
	});

	app.get("/main", function(req, res) {
		var user = req.query.u;
		var token = req.query.t;
		if (tools.validate_user(user, token)) {
			res.sendFile(__dirname + "/main.html");
		} else {
			res.sendFile(__dirname + "/login.html");
		}
	});
};