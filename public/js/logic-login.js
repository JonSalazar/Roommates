$(document).ready(function() {	
	var socket = io();
	$('#idpass').keypress(function(e) {
		if (e.keyCode == 13) {
			var v = {};
			v.user = $('#iduser').val();
			v.pass = $('#idpass').val();
			socket.emit('login', v);
		}

	});

	socket.on('welcome', function(data) {
		location.replace('http://192.168.0.3:3000/main?u=' + data.user + '&t='+data.token);
	});
	
	socket.on('whodoyouare', function(data) {
		$('#normal').hide();
		$('#unknown').show();
		$("body").css("background-color", "#600000");
	});
});