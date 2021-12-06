var mode
try{
	internalport=process.argv[2]
	console.log(process.argv)
	console.log(internalport)
	process.send({playerID:'first comunication'})
	mode="withParent"
}
catch(err){
	mode="standAlone"
}
if(mode=="withParent"){
	
}else{
	
}
function getproxyport(defaultport){
	console.log(internalport)
	if (internalport==undefined){
		return defaultport
	}else{
		return internalport
	}
}

var uid =require( 'uid').uid;
var IDs={
	socketsIDs:{},
	gameIDs:{},
	novelCount:0,
	addID(socketsID){
		let gameID=uid()+this.novelCount++
		IDs.socketsIDs[socketsID]=gameID
		IDs.gameIDs[gameID]=socketsID
		return gameID
	},
	updateID(oldID,newID){
		let gameID=IDs.socketsIDs[oldID]
		IDs.gameIDs[gameID]=newID
		IDs.socketsIDs[newID]=gameID
		delete IDs.socketsIDs[oldID]
	},
	removeID(gameID){
		delete IDs.socketsIDs[IDs.gameIDs[gameID]]
		delete IDs.gameIDs[gameID]
	}
}

var withoutParent={
	socketList:{},
	moduleColor:'#aaaaaa',
	savedcommands:[],
	runGameCommand:function(socket,data){
		try{
			let player=withoutParent.struct.sockets[socket.userData.myIDinGame]
			//console.log(player.id+'sends to server: ',data)
			player[data.command](data.data)
		}
		catch(err){
			//console.log(data)
			console.log("the command "+data.command+" did not work")
			console.log("it gave a "+err.name)
			console.log("with a message of "+err.message)
		}
	}
}
withoutParent.message=function(socket,data){
	socket.emit("message",{data:data,color:withoutParent.moduleColor})
}
withoutParent.struct={
	sockets:{
		emit:function(command,data){
			withoutParent.io.sockets.emit("gameCommands",{command:command,data:data})
		},
		on:function(command,funct){
			withoutParent.struct[command]=funct
		}
	}
}
withoutParent.defaultSocket=function(gameID){
	return{
		id:gameID,
		on: function(command,costomFunction){
			let player=withoutParent.struct.sockets[gameID]
			player[command]=costomFunction
			if(arguments.length!=2){
				console.log("currently you must have 2 arguments, the call and the function")
			}
		},
		emit:function(command,data){
			let socket=withoutParent.socketList[gameID]
			console.log('server sends out to player '+gameID+'at socket ',socket.id,': ',{command:command,data:data})
			socket.emit("gameCommands",{command:command,data:data})
		},
		broadcast:{
			emit:function(command,data){
				let socket=withoutParent.socketList[gameID]
				console.log('server broadcasts to player '+gameID+'at socket ',socket.id,': ',{command:command,data:data})
				socket.broadcast.emit("gameCommands",{command:command,data:data})
			}
		}
	}
}
	
withoutParent.createServer= function(serverConfgObject){
	withoutParent.express = require("express");
	withoutParent.http = require("http");
	withoutParent.io = require("socket.io")
	
	withoutParent.app = withoutParent.express();
	withoutParent.app.use(withoutParent.express.static("../template files for games/clientComms")); //working directory
	//Specifying the public folder of the server to make the html accesible using the static middleware
	
	withoutParent.port = serverConfgObject.standAlonePort;
	//var server = http.createServer(app).listen(8080); //Server listens on the port 8124
	withoutParent.server = withoutParent.http.createServer(withoutParent.app).listen(withoutParent.port,"0.0.0.0",511,function(){console.log("Server connected to socket: "+withoutParent.port);});//Server listens on the port 8124
	withoutParent.io = withoutParent.io.listen(withoutParent.server);
	/*initializing the websockets communication , server instance has to be sent as the argument */
	withoutParent.io.sockets.on("connection", function(socket) {
		console.log(__line, "Connection with client " );
		socket.emit('getOldID',function(data){
			socket.userData={}
			//console.log('this is data ',data)
			let gameID=IDs.socketsIDs[data.ID]
			//console.log('current IDs ',IDs)
			//console.log('prior gameID',gameID)
			if((!serverConfgObject.keepsockets||serverConfgObject.keepsockets==undefined)&&(gameID!=undefined)){
				IDs.removeID(gameID)
				delete withoutParent.socketList[gameID]
				//console.log('removed id:',gameID)
				gameID=undefined
			}
			
			if(gameID!=undefined){
				console.log('not undefined gameID',gameID)
				IDs.updateID(data.ID,socket.id)
				socket.userData={myIDinGame:gameID}
				withoutParent.socketList[gameID]=socket
				withoutParent.struct.connection(withoutParent.struct.sockets[gameID])
			}else{
				gameID=IDs.addID(socket.id)
				socket.userData={myIDinGame:gameID}
				//console.log(socket.userData)
				withoutParent.socketList[gameID]=socket
				withoutParent.struct.sockets[gameID]=withoutParent.defaultSocket(gameID)
				withoutParent.struct.connection(withoutParent.struct.sockets[gameID])
			}
			//console.log('post gameID',gameID)
			
		
			withoutParent.message(socket, "Connection established!")

			console.log(__line, "Socket.io Connection with client " + socket.id +" established");
			socket.on('gameID',(callback)=>{
				//console.log('sending gameID:',gameID)
				callback({gameID:gameID})
			})
			for(input of withoutParent.savedcommands){
				withoutParent.runGameCommand(input.socket,input.comm)
			}
		})
		socket.on("disconnect",function() {
			//withoutParent.message( withoutParent.io.sockets, "" + socket.userData.userName + " has left.");
			//withoutParent.message( withoutParent.io.sockets, "Type 'kick' to kick disconnected players");
			//console.log("disconnected: " + socket.userData.myIDinGame + ": " + socket.id);
			//players are only removed if kicked
			console.log(socket)
			console.log('active game sockets',withoutParent.struct.sockets)
			console.log('socketList',withoutParent.socketList)
			console.log('socketList',Object.keys(socket))
			if(socket.userData==undefined){socket.userData={}}
			let player=withoutParent.struct.sockets[socket.userData.myIDinGame]
			if(player!=undefined&&player['disconnect']!=undefined){player['disconnect']()}
			delete withoutParent.socketList[socket.id]
		});
		socket.on('message',(message)=>{
			console.log(message)
			let player=withoutParent.struct.sockets[socket.userData.myIDinGame]
			if(player!=undefined&&player.message!=undefined){player.message(message)}
		});
		withoutParent.savedcommands=[]
		socket.on("gameCommands",function(data){
			if(socket.userData==undefined){
				withoutParent.savedcommands.push({socket:socket,comm:data})
			}else{
				withoutParent.runGameCommand(socket,data)
			}
		})
		
	})
	return withoutParent.struct
}
	
withoutParent.clientfiles=function(){
	let tapp={use:function(expressPath){
			if(typeof expressPath =='string'){
				withoutParent.app.use(withoutParent.express.static(expressPath))
			}else{
				console.log("can not process this type of input using this module")
			}
		}
	}
	return tapp
}
withoutParent.proxyport=getproxyport

if(mode=="withParent"){
	module.exports={proxyport:getproxyport}
}else{
	module.exports=withoutParent
}