var http = require('http'),
	path = require('path'),
	fs = require('fs');

var server = http.createServer(function(req, res) {
	res.writeHead(200);

	fs.readFile(path.join(__dirname, 'index.html'), 'binary', function(err, file) {
		res.write(file, 'binary');
		res.end();
	});
});

server.listen(8080);

// strip the ids from the keys and sort the array 
var users = {};
users.prepare = function() {
	var t = [];
	for(var a in this) if (typeof this[a] != 'function') t.push(this[a]);
	return t.sort();
}

users.contains = function(k) {
	for(i in this) if(this[i] === k) return true;
	return false;
}

String.prototype.escape = function() {
	return this.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

var io = require('socket.io').listen(server);
io.sockets.on('connection', function(sock) {
	users[sock.id] = '';

	// for nicknames!
	sock.on('nick', function(nickname) {
		if (!users.contains(nickname) && nickname == nickname.escape()) {
			users[sock.id] = nickname;
			sock.emit('join', users.prepare());
			sock.broadcast.emit('userjoin', nickname);
		}
		else {
			sock.emit('joinerr', 1);
		}
	});

	sock.on('msg', function(msg) {
		sock.broadcast.emit('msg', {nick: users[sock.id], text: msg.escape()});
	});

	sock.on('disconnect', function () {
		var nick = users[sock.id];
		if (nick) {
			delete users[sock.id];
			io.sockets.emit('userquit', nick);
		}
	});
});
