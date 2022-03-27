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

var withParent=require('./comunicationModuleWithParent')

function getproxyport(defaultport){
	console.log(internalport)
	if (internalport==undefined){
		return defaultport
	}else{
		return internalport
	}
}

var uid =require( 'uid').uid;
const EventEmitter = require('events');
var IDs={}
var allClients=[]
novelCount=0

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

withoutParent.createServer= function(serverConfgObject,closeCondition){
	withoutParent.express = require("express");
	withoutParent.http = require("http");
	withoutParent.io = require("socket.io")
	
	withoutParent.app = withoutParent.express();
	withoutParent.app.use(withoutParent.express.static("../template files for games/clientComms")); //working directory
	//Specifying the public folder of the server to make the html accesible using the static middleware
	
	withoutParent.port = serverConfgObject.standAlonePort;
	withoutParent.server = withoutParent.http.createServer(withoutParent.app).listen(withoutParent.port,"0.0.0.0",511,function(){console.log("Server connected to socket: "+withoutParent.port);});//Server listens on the port 8124
	withoutParent.io = withoutParent.io.listen(withoutParent.server);
	//withoutParent.myEmiter = new EventEmiter()
	//withoutParent.myEmiter.on('close',(gameID)=>{
	//	if(closeCondition(gameID)){console.log('would have closed')}else{'would not have closed'}
	//})
	/*initializing the websockets communication , server instance has to be sent as the argument */
	withoutParent.io.sockets.on("connection", function(socket) {
		console.log("Connection with client " );
		let gameID=uid()+novelCount++
		IDs[gameID]=gameID
		
		socket.on('sendUsername', function (data, callback) {
			console.log('Socket (server-side): received message:', data);
			if(serverConfgObject.keepsockets ){
				if(IDs[data.ID]){
					IDs[gameID]=IDs[data.ID]
					delete IDs[data.ID]
				}
			}
			gameID=IDs[gameID]
			var responseData = gameID
			socket.userData={myIDinGame:gameID}
			if(withoutParent.socketList[gameID]==undefined){
				console.log(socket.userData)
				withoutParent.struct.sockets[gameID]=withoutParent.defaultSocket(gameID)
				withoutParent.socketList[gameID]=socket
				withoutParent.struct.connection(withoutParent.struct.sockets[gameID])
			}else{
				let player=withoutParent.struct.sockets[gameID]
				withoutParent.socketList[gameID]=socket
				withoutParent.runGameCommand(socket,data)
			}
			
			console.log(withoutParent.struct.sockets[gameID])
			callback(responseData);
		});
		
		socket.on("disconnect",function() {
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
			withoutParent.runGameCommand(socket,data)
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
	module.exports=withParent
}else{
	module.exports=withoutParent
}