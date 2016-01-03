var receiver = 'all';
var name;
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
			v.txt = $('#txtbox').val();
			if (v.txt === '') {
				return;
			}
			v.user = user;
			v.to = receiver;
			v.token = token;

			socket.emit('say', v);
			$('#txtbox').val('');
		}
	};

	$('#txtbox').keypress(to_enter);

	socket.on('hear', hear);
	socket.on('new_login', add_member);
	socket.on('member_is_gone', member_is_gone);
	socket.on('set_image', set_image);
	socket.on('load_talk', load_talk);
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
var hear = function(data) {
	var is_current = (data.global && receiver === 'all')
	 || (!data.global && (data.from === name || data.from === receiver));
	if (is_current) {
		add_to_chat(data);
		return;
	}

	// is not visible, so we warn the member
	var to = data.global ? 'all' : data.from;
	$('#id_img_' + to).attr("class", "img-responsive img-warn");
};
var add_member = function(m) {
	$('#members').append('<div id="id_{0}" class="member"><input id="id_img_{0}" onclick="change_receiver(\'{0}\',\'{1}\');" type="image" src="/img/{1}" class="img-responsive"></div>'.format(m.name, m.source));
	if (m.name === "all") {
		$('#id_img_all').attr("class", "img-responsive img-selected");
	}
};
var change_receiver = function(_name, source) {
	receiver = _name;
	socket.emit('load_private_talk', receiver);
	$("input[id ^='id_img_']").attr("class", "img-responsive");
	$('#id_img_'+ receiver).attr("class", "img-responsive img-selected");
};

var set_image = function(data) {
	name = data.name;
	$('#avatar').attr("src","/img/{0}".format(data.src));
}

var logout = function() {
	socket.emit('logout');
	location.replace('http://roommates.ignorelist.com:3000');
};

var member_is_gone = function(_name) {
	$('#id_'+_name).remove();
};

var load_talk = function(talk) {
	erase_chat();
	for (var i = talk.length - 1; i >= 0; i--) {
		add_to_chat(talk[i]);
	}
	var ch = $('#chat-ul');
	ch.scrollTop(ch.prop('scrollHeight'));
};

var erase_chat = function() {
	$('#chat-ul').text('');
};


var add_to_chat = function(data) {
	if (data.color === "undefined") {
		$('#chat-ul').append('<li><xtUser>{0}:</xtUser> <xtb>{1}</xtb></li>'.format(data.from, data.text));
	} else {
		$('#chat-ul').append('<li><xtUser style="color : {2}">{0}:</xtUser> <xtb>{1}</xtb></li>'.format(data.from, data.text, data.color));
	}
	
	var ch = $('#chat-ul');
	ch.scrollTop(ch.prop('scrollHeight'));
}