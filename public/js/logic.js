var receiver = 'all';
var socket;
$(document).ready(function() {
	

	socket = io();

	var l = location.search;

	var sep = 0;
	var id = l.indexOf('u', sep);
	var andperson = l.indexOf('&', id);
	var user = l.substr(id + 2, andperson - id - 2);
	sep = andperson + 1;

	id = l.indexOf('t', sep);
	var token = l.substr(id + 2, l.length - id - 2);

	var me = {};
	me.user = user;
	me.token = token;
	socket.emit('know_me', me);

	var to_enter = function (e) {
		if (e.keyCode == 13) {
			var v = {};
			v.user = user;
			v.txt = $('#txtbox-xs').val() + $('#txtbox-sm').val() ;
			v.to = receiver;
			v.token = token;

			socket.emit('say', v);
			$('#txtbox-xs').val('');
			$('#txtbox-sm').val('');
		}
	};

	$('#txtbox-xs').keypress(to_enter);
	$('#txtbox-sm').keypress(to_enter);

	socket.on('hear', function(data) {
		$('#chat-ul-sm').append('<xtb><li>' + data + '\n</li></xtb>');
		$('#chat-ul-xs').append('<xtb><li>' + data + '\n</li></xtb>');
	});

	socket.on('new_login', function(data) {
		add_member(data);
	});

	socket.on('member_is_gone', function(data) {
		 member_is_gone(data);
	});

	socket.on('set_image', function(data) {
		set_image(data);
	});
});


// to .format
String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};
var add_member = function(m) {
	$('#members').append('<div id="id_{0}" class="member"><input onclick="change_receiver(\'{0}\',\'{1}\');" type="image" src="/img/{1}" class="img-responsive"></div>'.format(m.name, m.source));
};
var change_receiver = function(_name, source) {
	receiver = _name;
};

var set_image = function(_source) {
	$('#avatar').attr("src","/img/{0}".format(_source));
}

var logout = function() {
	socket.emit('logout');
	location.replace('http://192.168.0.5:3000');
};

var member_is_gone = function(_name) {
	$('#id_'+_name).remove();
};