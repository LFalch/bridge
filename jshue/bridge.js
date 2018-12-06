var osc = require('node-osc');
var io = require('socket.io')(8081);


var oscServer, oscClient;

var isConnected = false;

/*
  A static file server in node.js.
  Put your static content in a directory next to this called public.
  context: node.js
*/
var express = require('express');           // include the express library
var server = express();					            // create a server using express
server.listen(8080);                        // listen for HTTP
server.use('/',express.static('client'));   // set a static file directory
console.log('Now listening on port 8080');

io.sockets.on('connection', function (socket) {
	console.log('connection');
	socket.on("config", function (obj) {
		isConnected = true;
    	oscServer = new osc.Server(obj.server.port, obj.server.host);
	    oscClient = new osc.Client(obj.client.host, obj.client.port);
	    oscClient.send('/status', socket.sessionId + ' connected');
		oscServer.on('message', function(msg, rinfo) {
			socket.emit("message", msg);
		});
		socket.emit("connected", 1);
	});
 	socket.on("message", function (obj) {
		oscClient.send.apply(oscClient, obj);
  	});
	socket.on('disconnect', function(){
		if (isConnected) {
			oscServer.kill();
			oscClient.kill();
		}
  	});
});