var osc = require('node-osc');
var io = require('socket.io')(8081);

var oscServer;
let oscClients = [];

var isConnected = false;

/*
  A static file server in node.js.
  Put your static content in a directory next to this called public.
  context: node.js
*/

var express = require('express'); // include the express library
var server = express(); // create a server using express
server.listen(8080); // listen for HTTP
server.use('/', express.static('client')); // set a static file directory
console.log('Now listening on port 8080');

io.sockets.on('connection', function (socket) {
	console.log('connection');
	socket.on("config", function (obj) {
		isConnected = true;
		oscServer = new osc.Server(obj.local.port, obj.local.host);
		Object.values(obj.remotes).map(c => {
			let newClient = new osc.Client(c.host, c.port);
			newClient.send('/status', socket.sessionId + ' connected');
			oscClients.push(newClient);
		});
		oscServer.on('message', function (msg, rinfo) {
			socket.emit("message", msg);
		});
		socket.emit("connected", 1);
	});
	socket.on("message", function (obj) {
		console.log("server got message", obj);
		oscClients.map(c => {
			c.send.apply(c, obj);
		});
	});
	socket.on('disconnect', function () {
		if (isConnected) {
			oscServer.kill();
			oscClients.map(c => {
				//c.kill();
			});
		}
	});
});
