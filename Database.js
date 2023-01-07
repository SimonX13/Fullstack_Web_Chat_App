
const e = require('express');
const { MongoClient, ObjectID, ObjectId } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v3.6+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.6/api/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = function(){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatrooms from `db`
			 * and resolve an array of chatrooms */
            resolve(db.collection("chatrooms").find().toArray());
		})
	)
}

Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatroom from `db`
			 * and resolve the result */
			if(room_id instanceof ObjectId){
				let room = db.collection("chatrooms").findOne({_id:  room_id});
				resolve(room);
			}else {
				try {
					var id = new ObjectId(room_id);
					let room = db.collection("chatrooms").findOne({_id: id});
					if (room==null) {
						room = db.collection("chatrooms").findOne({_id: room_id});
					}
					resolve(room);
				}catch (e) {
					resolve(db.collection("chatrooms").findOne({_id: room_id}));
				}
			}
		})
	)
}


Database.prototype.addRoom = function(room){
    	return this.connected.then(db => 
    		new Promise((resolve, reject) => {
    			/* TODO: insert a room in the "chatrooms" collection in `db`
    			 * and resolve the newly added room */
                if (room.name !== undefined){
    				db.collection("chatrooms").insertOne(room, (err, res)=> {
    					if (err) throw err;
    					if (room._id == null) {
                            room._id = res.insertedId;
                            resolve(room);
                        }
    					else {	
    						resolve(room);
    					}
    				});
    			} 
                else {
    				reject(new Error("Name field in the room is not provided"));
    			}
    		})
    	)
    }

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
            
            let time = before;
			if (!before) {
				time = Date.now();
			}

			const collection = db.collection('conversations');
			collection.find({room_id: room_id}).toArray(function(err, items) {
				if (err) {
					reject(err);
				}
				if (items.length <= 0) {
					resolve(null);
				}

				let ret;

				items.forEach(item => {
					if (item.timestamp < time) {
						if ( !ret || ( ret && ret.timestamp < item.timestamp ) ) {
							ret = item;
						}
					}
				});
				resolve(ret)
            });
		}))
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
			
            if(conversation.room_id == null || conversation.timestamp == null || conversation.messages == null) {
                reject(new Error("missing fields"))
            }
            else{
                db.collection("conversations").insertOne(conversation)
                resolve(conversation)
            }

		})
	)
}



Database.prototype.getUser = function(username){
    return this.connected.then(db =>
		new Promise((resolve, reject) => {
                const result = db.collection("users").findOne({username:username});
                if(result == null){
                    resolve(null)
                }
                else{
                    resolve(result)
                }
		})
	)
}



module.exports = Database;