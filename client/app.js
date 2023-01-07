const lobbyHTML = `<div class="content">
<ul class="room-list">
  <li>
    
    <a href="#/chat">
        <img class = "room-list-pic" src="./assets/everyone-icon.png" alt="">
    
        Everyone in CPEN400A
    </a>
  </li>
  <li>
   
    <a href="#/chat">
        <img class = "room-list-pic" src="./assets/bibimbap.jpg" alt="">
        Foodies only</a>
  </li>
  <li>
    
    <a href="#/chat">
        <img class = "room-list-pic" src="./assets/minecraft.jpg" alt="">
        Gamers unite</a>
  </li>
</ul>
<div class="page-control">
  <input type="text" placeholder="Room Title">
  <button>Create Room</button>
</div>
</div>`;
const profileHTML = ` <div class="content">
<div class="profile-form">
  <div class="form-field">
      <label>username</label>
      <input type="text">
  </div>
  <div class="form-field">
      <label>password</label>
      <input type="password">
  </div>
  <div class="form-field">
      <label>Avatar Image</label>
      <input type="file">
  </div>
</div>
<div class="page-control">
  <button>Save</button>
</div>
</div>`;

const chatHTML = ` <div class="content">
<h4 class="room-name">
    Everyone in CPEN400A
</h4>
<div class="message-list">
    <div class="message">
        <span class="message-user">
            Alice
        </span>
        <span class="message-text">
            Hi guys!
        </span>
    </div>
    <div class="message my-message">
        <span class="message-user">
            Simon
        </span>
        <span class="message-text">
            Hi there!
        </span>
    </div>
    <div class="message">
        <span class="message-user">
            Alice
        </span>
        <span class="message-text">
            How are you Simon!
        </span>
    </div>
</div>
<div class="page-control">
    <textarea name="textarea" cols="100" rows="1"></textarea>
    <button>
        Send
    </button>
</div>
</div>`;


var profile = {username:"Alice"} // global variable
//class LobbyView this is okay ES6
class LobbyView{
    constructor(lobby){
        this.lobby = lobby;

        var value = createDOM(lobbyHTML)
        this.elem = value;
        this.listElem = this.elem.querySelector("ul.room-list")
        this.inputElem =this.elem.querySelector("input")
        this.buttonElem = this.elem.querySelector("button")
        
        this.redrawList();
        var that = this;
        this.buttonElem.addEventListener("click", function(){
            //alert("a"); // remove later
            var textValue = that.inputElem.value;
            var data = {
                name: textValue,
                image: "assets/everyone-icon.png"
            }
            Service.addRoom(data)
                .then((res) => {
                    that.lobby.addRoom(res._id, res.name, res.image,[])})
                .catch((e)=>{
                    console.log(e)
                })
            // that.lobby.addRoom(4, textValue);
            that.inputElem.value =""; 
        })
         
        this.lobby.onNewRoom = function(room){
            var newDom = 
            `<li id="${room.id}">
                <a href="#/chat/${room.id}">
                    <img class = "room-list-pic" src="${room.image}" alt="">
                    ${room.name}
                </a>
            </li>`;
            //console.log(that.elem)
            that.listElem.appendChild(createDOM(newDom))
        }
    }

    redrawList(){
        emptyDOM(this.listElem)  
        
        for (let key in this.lobby.rooms){
            var parameter = ` 
            <li id = "${key}">
                <img class = "room-list-pic" src="${this.lobby.rooms[key].image}"  >
                <a href="#/chat/${key}">
                    ${this.lobby.rooms[key].name}
                </a>
              </li>`;
              this.listElem.appendChild(createDOM(parameter))
        }
        console.log("listElem")
        console.log(this.listElem)
        
    }

    
}

// const scroller = document.querySelector(".content");
// const output = document.querySelector(".message-list");


class ChatView{
    
    constructor(socket){
        this.socket = socket;
        var dom = createDOM(chatHTML);
        this.elem = dom;
        this.titleElem = this.elem.querySelector("h4")
        this.chatElem =  this.elem.querySelector("div.message-list")
        this.inputElem = this.elem.querySelector("textarea")
        this.buttonElem = this.elem.querySelector("button")
        var that = this;
        this.buttonElem.addEventListener("click" , ()=>{that.sendMessage()})
        this.inputElem.addEventListener("keyup", (event)=>{
            if(event.keyCode ===13 && event.shiftKey == false){
                that.sendMessage()
            }
        })
        this.chatElem.addEventListener("wheel", function(e){
            if (e.deltaY < 0 && that.room.canLoadConversation == true && that.chatElem.scrollTop <= 0 ){
                that.room.getLastConversation.next();
            }
        })
        this.room = null;
    }
    
    sendMessage(){
        // console.log(this)
        var text = this.inputElem.value
        // this.room.addMessage(profile.username, text);
        // this.inputElem.value = ''
        //var value=this.inputElem.value;
        this.room.addMessage(profile.username, text);
        var that=this;
        this.socket.send(JSON.stringify({
            roomId:that.room.id,
            username:profile.username,
            text:text
        }));
        this.inputElem.value = "";
    }
    

    setRoom(room){
        //Assign the given room argument to the room property.
        this.room = room
        emptyDOM(this.titleElem);
    
        let room_name = document.createTextNode(room.name);
        this.titleElem.appendChild(room_name)  
        emptyDOM(this.chatElem)

        for(let i = 0 ; i < this.room.messages.length; i++){
            //dynamically create the array
            if(this.room.messages[i].username === profile.username){
                var mess_name  = "message my-message"
            }
            else{
                var mess_name = "message"
            }
            var ary = 
            `<div class="${mess_name}">
                <span class="message-user">
                    ${this.room.messages[i].username}
                </span>
                <span class="message-text">
                    ${this.room.messages[i].text}
                </span>
            </div>
            `
            this.chatElem.appendChild(createDOM(ary))
        }


        
        this.room.onNewMessage =(message)=>{
            var message_class;
            if(message.username === profile.username){
                message_class="message my-message";
            } else {
                message_class = "message";
            }
            this.chatElem.appendChild(createDOM(
                `<div class="${message_class}">
                    <span class="message-user">${message.username}</span>
                    <span class="message-text">${sanitize(message.text)}</span>
                </div>` 
                ));
        }


        var that = this;

        this.room.onFetchConversation = function (conversation) {
            let hb = that.chatElem.scrollHeight;
            let children=[];
    
            for (let i = 0; i < conversation.messages.length; i++) {
                let message = conversation.messages[i];
                let myMessageClass = "";
                if(message['username'] === profile.username){
                    myMessageClass = "my-message";
                } else {
                    myMessageClass = "message";
                }
    
                children.push(createDOM(
                    `<div class="message ${myMessageClass}">
                    <span class="message-user"><b>${message['username']}</b></span><br/>
                    <span class="message-text">${message['text']}</span>
                </div>`)) ;
    
            }
            that.chatElem.prepend(...children);
            let ha = that.chatElem.scrollHeight;
            that.chatElem.scrollTop = ha - hb;
        }
    }
}


class ProfileView {
    constructor(){
        var dom = createDOM(profileHTML);
        this.elem = dom;
    }
}

class Room {
    constructor(id, name, image = "assets/everyone-icon.png", messages = []){
        this.id = id;
        this.name = name;
        this.image = image;
        this.messages = messages;
        this.getLastConversation = makeConversationLoader(this);
        this.canLoadConversation = true;
        this.time = Date.now();
    }
    addMessage(username, text){

        if(text.trim().length === 0 ){
            return;
        }
        else{
            var obj = {
                username: username,
                text: text
            }; 
            this.messages.push(obj);
            if(typeof this.onNewMessage === "function"){
                this.onNewMessage(obj)
                console.log("onnewmessage in addmessage is a function")
            }
            else{
                console.log("onNewMessage is not a functionnnnnnnn")
            }
        }
    }
    addConversation (conversation){
        this.messages.unshift(...conversation.messages)
        if( this.onFetchConversation){
            this.onFetchConversation(conversation)
        }
    }

}
 


function* makeConversationLoader(room) {
    var lastTimeStamp = room.time;
    while (room.canLoadConversation){
        room.canLoadConversation=false;
        yield Service.getLastConversation(room.id , lastTimeStamp).then((obj)=>{
            if (obj!=null){
                lastTimeStamp = obj.timestamp;
                room.addConversation(obj);
                room.canLoadConversation=true;
                return obj;
            }
            else {
                room.canLoadConversation=false;
                return null;
            }
        })
    }
}



class Lobby{
    constructor(){
        // var rooms1 =  new Room(0,"KTV","assets/everyone-icon.png",[]);
        // var rooms2 =  new Room(1,"JJLIN","assets/everyone-icon.png",[]);
        // var rooms3 =  new Room(2,"SIMON WORKOUT ROOM","assets/everyone-icon.png",[]);
        // var rooms4 =  new Room(3,"STORYROOM","assets/everyone-icon.png",[]);
        this.rooms = {};
        // this.rooms[rooms1.id] = rooms1
        // this.rooms[rooms2.id] = rooms2
        // this.rooms[rooms3.id] = rooms3
        // this.rooms[rooms4.id] = rooms4
        
    }
    getRoom (roomId){
        for (let key in this.rooms){
            if (key === roomId){
                return this.rooms[key];
            }
        }
        return null;
    }
    addRoom (id, name, image, messages){
        var newRoom = new Room(id, name, image, messages);
        this.rooms[id]= newRoom;
        if(typeof this.onNewRoom === 'function'){
            this.onNewRoom(newRoom);
        }
    }
}



function main(){
    var socket = new WebSocket("ws://localhost:8000");
    var lobby = new Lobby();
    var lobbyView = new LobbyView(lobby);
    var chatView = new ChatView(socket);
    var profileView = new ProfileView();


    Service.getProfile().then((res) => {
        profile.username = res.username;
    })

    var renderRoute = function(){
        var url = window.location.hash.split("/");
        if(url[1] === "" ){ //|| window.location.hash === "#/" 
            console.log(window.location.hash);
            emptyDOM(document.getElementById("page-view"));
            var page_view = document.getElementById("page-view");
            page_view.appendChild(lobbyView.elem)
        }
        else if(url[1] === "profile"){
            emptyDOM(document.getElementById("page-view"));
            console.log(window.location.hash);
            var page_view = document.getElementById("page-view")
            page_view.appendChild(profileView.elem)
        }
        else if(url[1] === "chat"){
            console.log(window.location.hash);
            emptyDOM(document.getElementById("page-view"));
            var page_view = document.getElementById("page-view")
            let cur_room = lobby.getRoom(url[2]);
            if(cur_room){
                chatView.setRoom(cur_room);
            }
            page_view.appendChild(chatView.elem)

        }
        else{
            console.log("tell me errrr")
        }
    }
    renderRoute();
    window.addEventListener('popstate', renderRoute);

    var refreshLobby = function(){
        Service.getAllRooms().then((resolve)=>{
            console.log("resolve is")
            //console.log(resolve)

            for(var i =0; i<resolve.length; i++){
                if(lobby.rooms[resolve[i]._id] !=null && resolve[i]._id in lobby.rooms){
                    lobby.rooms[resolve[i]._id].name = resolve[i].name
                    lobby.rooms[resolve[i]._id].image = resolve[i].image
                }
                else{
                    lobby.addRoom(resolve[i]._id, resolve[i].name, resolve[i].image, resolve[i].messages)
                }
            }
        },
        (reject)=>{console.log(reject)}
        )
    }
    setInterval(refreshLobby, 5000) // refresh the page every 10 seconds
    refreshLobby() // called the function once in the main function
    
    socket.addEventListener("message", function(event){
        
        console.log(event)
        var result = JSON.parse(event.data);
        var room = lobby.getRoom(result.roomId);
        room.addMessage( result.username, result.text);
    })
    //------------- test 2
    cpen322.export(arguments.callee, { renderRoute, lobbyView, chatView, profileView,lobby, refreshLobby, socket   
    });
}

window.addEventListener('load', main);

function emptyDOM (elem){
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

function createDOM (htmlString){
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    //console.log(template.content);
    return template.content.firstChild;
}

// ==============================================

var Service = {
    origin:window.location.origin.toString(),
    getAllRooms(){
        return (new Promise((resolve, reject)=> {
            var x = new XMLHttpRequest();
            x.open("GET", Service.origin+"/chat");
            x.onload = function(){
                if(x.status == 200){
                        var result = JSON.parse(x.responseText);
                        resolve(result)
                }
                else{
                    reject(new Error(x.response))
                }
            }
            x.onerror = function(e){
                reject(new Error(e))
            }
            x.onabort = function(){
                reject( new Error("aborted"))
            }
            x.ontimeout = function(){
                reject(new Error("timeout"))
            }
            x.send()
        }))
    },
    addRoom(data){
        return new Promise((resolve, reject) => {
            let x = new XMLHttpRequest();
            x.open("POST", Service.origin + "/chat");
            x.setRequestHeader("Content-Type", "application/json");

            x.onload = function () {
                if (x.status === 200) {
                    resolve(JSON.parse(x.response));
                } else {
                    reject(new Error(x.response));
                }
            };
            x.onabort = function(){
                reject(new Error("aborted"))
            }
            x.ontimeout = function(){
                reject(new Error("timeout"))
            }
            x.onerror = function (){
                reject(new Error("error message"));
            };
            x.send(JSON.stringify(data));
        })
        
    },



    getLastConversation(roomId, before){
        return new Promise((resolve, reject) => {
            let x = new XMLHttpRequest();
            var url;
            if (before){
                url = Service.origin + `/chat/${roomId}/messages?before=${before}`;
            }
            else {
                url = Service.origin + `/chat/${roomId}/messages`;

            }
            x.open("GET",  url);
            //x.setRequestHeader("Content-Type", "application/json");

            x.onload = function () {
                if (x.status === 200) {
                    resolve(JSON.parse(x.response));
                } else {
                    reject(new Error(x.response));
                }
            };
            x.onabort = function(){
                reject(new Error("aborted"))
            }
            x.ontimeout = function(){
                reject(new Error("timeout"))
            }
            x.onerror = function (){
                reject(new Error("error message"));
            };
            x.send();
        })
    },


    getProfile(){
        let x = new XMLHttpRequest();
            var url = Service.origin + "/profile"
        return new Promise((resolve, reject) => {
            
            x.open("GET",  url);
            //x.setRequestHeader("Content-Type", "application/json");
            x.onload = function () {
                if (x.status === 200) {
                    resolve(JSON.parse(x.response));
                } else {
                    reject(new Error(x.response));
                }
            };
            x.onabort = function(){
                reject(new Error("aborted"))
            }
            x.ontimeout = function(){
                reject(new Error("timeout"))
            }
            x.onerror = function (){
                reject(new Error("error message"));
            };
            x.send(null);
        })
    }
}

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