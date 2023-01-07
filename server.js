const path = require('path');
const fs = require('fs');
const WebSocketServer = require('ws');
const express = require('express');
const cpen322 = require('./cpen322-tester.js');
const crypto = require('crypto');
function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');


/**
 * MongoDB
 */
const Database = require('./Database');
const SessionManager = require('./SessionManager.js');
const db = new Database("mongodb://localhost:27017", "cpen322-messenger");

const messageBlockSize = 10;

/**
 * A5
 */

const sessionManager = new SessionManager();

// express app
let app = express();
app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

var bodyParser = require('body-parser')
app.use(bodyParser.json())

// serve static files (client-side)

app.use(['/app.js',], sessionManager.middleware, express.static(clientApp + '/app.js'))
app.use(['/index','/index.html',/^\/$/i], sessionManager.middleware, express.static(clientApp + '/index.html'))

app.use('/', express.static(clientApp, { extensions: ['html'] }));


app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});


var messages = {};
db.getRooms().then((rooms)=>{
	rooms.forEach((room)=>{
		messages[room._id] = []
	})
})



/* your code */
// var chatrooms = [{
// 	id: "0",
// 	name: "asfdmn",
// 	image: "assets/everyone-icon.png"
// },
// {
// 	id: "1",
// 	name: "nasd",
// 	image: "assets/everyone-icon.png"
// }];

// var messages={
// 	[chatrooms[0].id] : [],
// 	[chatrooms[1].id] : []
// };



var broker = new WebSocketServer.Server({ port: 8000 });
broker.on("connection", function(WebSocketServer_client, request){
	var cookie = request.headers.cookie;
	if (cookie != null) cookie = cookie.split('=')[1];
	if (cookie == null || sessionManager.getUsername(cookie) == null) {
		broker.clients.forEach(function (receiver) {
			if (receiver === WebSocketServer_client && receiver.readyState === WebSocketServer.OPEN) {
				receiver.close();
			}
		});
	}

	WebSocketServer_client.on('message', function message(data) {

		//var result = data
		var result = JSON.parse(data);
		result.username = sessionManager.getUsername(cookie);
		result.text = sanitize(result.text)
		broker.clients.forEach(client => {
			if(client != WebSocketServer_client && client.readyState == WebSocketServer.OPEN){
				client.send(JSON.stringify(result));
			}
		})
		
		messages[result.roomId] = [{username: result.username, text:result.text}] 
		if(messages[result.roomId].length == messageBlockSize) {
			var conversation_obj = {
				room_id : result.roomId,
				timestamp : Date.now(),
				messages:messages[result.roomId]
			}
			db.addConversation(conversation_obj).then((conversation)=>{
				messages[conversation.room_id] = []
			})
			
		}
	})

})


app.route('/chat')
  .get( sessionManager.middleware, function (req, res, next) {
	// var result = [];
	// for(var i = 0; i < chatrooms.length; i++){
	// 	var room = {};
	// 	room.id = chatrooms[i].id;
	// 	room.name = chatrooms[i].name;
	// 	room.image = chatrooms[i].image;
	// 	room.messages = messages[chatrooms[i].id];
	// 	result.push(room);
	// }
	// res.status(200).send(JSON.stringify(result));



	db.getRooms().then((rooms) => {
			rooms.forEach((room)=>{
				room["messages"] = messages[room._id]
			})
			//console.log(rooms)
			res.send(JSON.stringify(rooms));
		}
	)

	 
  })
  .post( sessionManager.middleware, function(req, res, next){
	// if(req.body.hasOwnProperty('name')){
	// 	var data = req.body;
	// 	var room = {};
	// 	var id = 0;
	// 	while(id.toString() in chatrooms){
	// 		id++;
	// 	}
	// 	room.id = id.toString();
	// 	room.name = data.name;
	// 	room.image = data.image;
	// 	messages[id] = [];
	// 	chatrooms.push(room);
	// 	res.status(200).send(JSON.stringify(room));
	// }
	// else{
	// 	res.status(400).send('error message');
	// }


	
	if (req.body.name == null) {
		res.status(400).send(new Error("Client does not send a request with a name field"))
	} 
	else {
		var room = {
			name  : req.body.name,
			image : req.body.image
		}
		db.addRoom(room).then((room) => {
			messages[room._id] = [];
			res.status(200).send(JSON.stringify(room));
		});
	}
  })


  app.route('/chat/:room_id').get( sessionManager.middleware, function(req, res){
	let chatroom = req.params;
	console.log("param is")
	console.log(chatroom)
	db.getRoom(chatroom.room_id).then(
		(room) => {
			if (room) {
				res.send(room);
			} 
			else {
				res.status(404).send( new Error ("Room" + chatroom.room_id + " does not exist"));
			}
		}
	);
})

app.route('/chat/:room_id/messages').get( sessionManager.middleware, function(req, res){
	
	db.getLastConversation(req.params.room_id , req.query.before ).then(
		(obj) => {
			if(obj == null){
				res.status(404).send("conversation not found");
			}else {
				res.send(JSON.stringify(obj));
			}
		}
	)
})



app.route('/login').post( function(req, res){
	
	db.getUser(req.body.username).then(
		(obj) => {
			if(obj == null){
				// redirect
				res.redirect('/login');
				return
			}else {
				if( isCorrectPassword(req.body.password, obj.password) == false){
					res.redirect("/login")
					return
				}
				else{
					sessionManager.createSession(res, req.body.username);
					res.redirect("/")
					return
				}
			}
		}
	)
})

function isCorrectPassword(password, saltedHash){
	var salt = saltedHash.substring(0, 20);
	var calculatedPassword = crypto.createHash("sha256").update(password + salt).digest("base64");
	var correctPassword = saltedHash.substring(20);
	return (calculatedPassword === correctPassword)
}


function middlewareErrorHandler(err, req, res, next){
	if (err instanceof SessionManager.Error) {
		let header = req.headers.accept;
		if (header === 'application/json') {
			res.status(401).json(err);
		}
		else {
			res.redirect('/login');
		}
	} 
	else {
		res.status(500).send();
	}
}

app.route('/profile').get(sessionManager.middleware, function(req, res){
	res.status(200).send({
		username: req.username
	})
})


app.route('/logout').get(async function(req, res){
	sessionManager.deleteSession(req);
	res.redirect("/login")
})

function sanitize(string) {
	const map = {
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;',
		"/": '&#x2F;',
	};
	const reg = /[<>"'/]/ig;
	return string.replace(reg, (match)=>(map[match]));
}

app.use(middlewareErrorHandler);	

// at the very end of server.js
// cpen322.connect('http://52.43.220.29/cpen322/test-a3-server.js');
// cpen322.connect("http://52.43.220.29/cpen322/test-a4-server.js")
cpen322.connect("http://52.43.220.29/cpen322/test-a5-server.js")

cpen322.export(__filename, { app, messages, broker, db, messageBlockSize, sessionManager, isCorrectPassword}); //messageBlockSize