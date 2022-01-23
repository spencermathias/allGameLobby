const { fork } = require('child_process');
const http = require('http');
var io = require('socket.io');
var express = require('express'); // for serving webpages
const fs = require('fs');// for geting file system
//var conDB=require('./mysqlConfig/databaseLogin.js')
var app = express();
var uid =require( 'uid').uid;
var port=8081

var server = http.createServer(app).listen(port,"0.0.0.0",511,function(){console.log(__line,"Server connected to socket: "+port);});//Server listens on the port 8124
console.log('server started')
io = io.listen(server);

app.use(express.static('./IPconfiguration'))
app.use(express.static('./gameHelperFunctions'))
var novelCount=0
var IDs={}
var socketIDs

var allClients={}
var gameStatus=1
var serverColor='#000000'
var chatColor = "#ffffff";
var allforked={}
var room=-1


function defaultUserData(gameID){
	if(gameID==undefined){
		return {}
	}
	return {
		userName: "player"+gameID.slice(11),
		childProcessName:'',
		myIDinGame:gameID
	}
}

//to make lobbies work
var activeGames = [];
var avalibleGames = {}
/*
conDB.connect(function(err) {
  if (err) throw err;
});
function getGameIDCallBack(err, result, fields) {
  //console.log(__line,"aaaaaaaaaaaaaaaaa", err, result);
  if (err) throw err;
   activeGames = result;
}
let queryReadyGames = " SELECT ID, type FROM allGames WHERE Status = 'ready' ORDER BY id DESC";
conDB.query(queryReadyGames, getGameIDCallBack)
setInterval(()=>conDB.query(queryReadyGames, getGameIDCallBack),10000)
*/
app.use('/lobbies',  function (req, res){
	res.send(activeGames);
	//res.send(q);
});
app.use('/avalibleGames',  function (req, res){
	getGames()
	res.send(Object.keys(avalibleGames));
	//res.send(q);
});

//connections to lobby
io.sockets.on("connection", function(socket) {
	socket.userData={}
	console.log(__line, "lobby Connection with client " + socket.id +" established in room: lobby");
	
	socket.on('sendUsername', function (data, callback) {
		console.log('Socket (server-side): received message:', data);
		let gameID=uid()+novelCount++
		IDs[gameID]=gameID
		if(IDs[data.ID]){
			IDs[gameID]=IDs[data.ID]
			delete IDs[data.ID]
		}
		var responseData = IDs[gameID]
		socket.userData={myIDinGame:IDs[gameID]}
		
		console.log('connection data:', );
		
		callback(responseData);
	});
	message(socket, "Connection established!", serverColor)

    console.log(__line, "Socket.io Connection with client " + socket.id +" established");

    socket.on("disconnect",function() {
		message( io.sockets, "" + socket.userData.userName + " has left.", serverColor);
		message( io.sockets, "Type 'kick' to kick disconnected players", serverColor);
        console.log(__line,"disconnected: " + socket.userData.userName + ": " + socket.id);
    });
	

    socket.on("message",function(data) {
        /*This event is triggered at the server side when client sends the data using socket.send() method */
        data = JSON.parse(data);

        console.log(__line, "data: ", data);
        /*Printing the data */
		message( socket, "You: " + data.message, chatColor);
		message( socket.broadcast, "" + socket.userData.userName + ": " + data.message, chatColor);
        /*Sending the Acknowledgement back to the client , this will trigger "message" event on the clients side*/
    });


    socket.on('newgame',(type)=>{
		console.log(type)
		let newgame=''
		getGames()
		//TODO
		
		if(type in avalibleGames){
			console.log('valid game')
			room+=1
			//socket.userData.myIDinGame=socket.id
			//new forked
			let forked = fork(avalibleGames[type].dirName+avalibleGames[type].serverPath,[],{execArgv:['--inspect=7000']});
			//forked.send({ID:socket.userData.myIDinGame,command:'addPlayer'})
			forked.room=type+room
			
			forked.connectorSocket=avalibleGames[type].connect
			
			forked.disconnectedPlayers=[]
			let namespace='/'+type+'Connect'
			forked.on('message', (msg)=>{
				let playerID=msg.playerID
				let command=msg.command
				let data=msg.data
				if(playerID!=undefined){
					if(playerID=="first comunication"){
						console.log("connected to "+forked.room)
						socket.emit('forward to room',forkedURL)
					}else if(playerID=='all'){
						console.log(__line,'child to all:');
						console.log('msg',msg)
						console.log('room',forked.room)
						forked.connectorSocket.in(forked.room).emit('gameCommands',{command:command,data:data})
					}else if(playerID=='use'){
						let path=msg.path
						if(path.charAt(0)=='.'&&path.charAt(1)=='.'){
							fullpath="./games"+path.substr(2)
							console.log(fullpath)
							app.use(namespace,express.static(fullpath))
						}else if(path.charAt(0)=='.'){
							fullpath=avalibleGames[type].dirName.substr(0,avalibleGames[type].dirName.length-1)+path.substr(1)
							console.log(fullpath)
							app.use(namespace,express.static(fullpath))
						}else{
							console.log(avalibleGames[type].dirName+msg.path)
							app.use(namespace,express.static(avalibleGames[type].dirName+msg.path))
						}
					}else if(playerID.from!=undefined){
						allClients[playerID.from].broadcast.emit('gameCommands',{command:command,data:data})
					}else if(allClients[playerID]!=undefined){
						//debugger
						console.log(__line,'child to '+playerID)
						console.log(msg)
						allClients[playerID].emit('gameCommands',{command:command,data:data})
					}else{
						console.log('could not process message')
					}
				}
			});
			forked.on('exit', function(code) {
				console.log(`About to exit ${forked.room} with code ${code}`);
				forked.connectorSocket.in(forked.room).emit('forward to room','/')
				delete allforked[forked.room]
				activeGames=[]
				for(game in allforked){activeGames.push({name:game,URL:allforked[game].URL})}
			});
				
			let forkedURL='/'+type+'Connect/'+'?ID='+forked.room
			forked.URL=forkedURL
			forked.type=type
			
			
			//load game files

			allforked[forked.room]=forked
			activeGames=[]
			for(game in allforked){activeGames.push({name:game,URL:allforked[game].URL})}
		}
    });
    socket.on('test',()=>{console.log('tested parent')});
    //socket.on('pass2game',(name,gamecomand)=>{})
});



function getGames(){
	const testFolder = './games/';
	fs.readdirSync(testFolder).forEach(file => {
		try{
			let temp=require('./games/'+file+'/serverconfig.js')
			let name=''
			temp.dirName='./games/'+file+'/'
			if(temp.name==undefined){
				name=file
			}else{
				name=temp.name
			}
			if(temp.useWithParent==undefined||temp.useWithParent===true){
				if(avalibleGames[name]==undefined || !avalibleGames[name].folderExposed){
					avalibleGames[name]=temp
					//app.use(namespace,express.static(avalibleGames[name].dirName+'/'+avalibleGames[name].clientFolder))
					folderExposed=true
					if(avalibleGames[name].connect==undefined){
						let namespace='/'+name+'Connect'
						avalibleGames[name].connect=io.of(namespace+'/').on('connection',connectionFunction)
					}
				}else{
					let currentGame=avalibleGames[name]
					if(currentGame.clientFolder!=temp.clientFolder){
						app.use(namespace,express.static(avalibleGames[name].dirName+'/'+avalibleGames[name].clientFolder))
					}
					for(key of Object.keys(temp)){
						if(key!="connect"){
							currentGame[key]=temp[key]
						}
					}
				}
			}
		}catch(err){
			console.log('did not succesfuly import ',file)
			//console.log(file,' err ',err)
		}
	});
	console.log(avalibleGames)
}

function message(socket, message, color){
	var messageObj = {
		data: "" + message,
		color: color
	};
	socket.emit('message',JSON.stringify(messageObj));
}
function connectionFunction(socket){
	//join room
	//socket.userData={}
	let gameID=uid()+novelCount++
	IDs[gameID]=gameID
	let roomname=socket.conn.request._query.ID
	console.log(__line, "Connection with client " + socket.id +" established in room: "+roomname);
	socket.join(roomname)
	
	socket.on('sendUsername', function (data, callback) {
		if(allforked[roomname]){
			console.log('Socket (server-side): received message:', data);
			let type=allforked[roomname].type
			if(avalibleGames[type].keepSockets ){
				if(IDs[data.ID]){
					IDs[gameID]=IDs[data.ID]
					delete IDs[data.ID]
				}
			}
			//socketIDs[gameID]=socket.id
			
			var responseData = IDs[gameID]
			socket.userData={myIDinGame:IDs[gameID]}
			let message2server={gameID:IDs[gameID],data:data}
			console.log('connection data:', message2server);
			if(allforked[roomname]!=undefined){
				allforked[roomname].send(message2server)
			}else{
				message( socket, 'room dosenot exist forwarding to lobby', serverColor);
				socket.emit('forward to room','/')
			}
			allClients[IDs[gameID]]=socket
		}else{
			responseData='return'
		}
		callback(responseData);
	});
	
	socket.on('gameCommands',(mes)=>{
		if(allforked[roomname]!=undefined){
			let message2server={gameID:IDs[gameID],data:mes}
			if(mes.command=='message'){
				if(JSON.parse(mes.data).message==='end'){
					console.log(__line,''+socket.userData.username+" forced close");
					message2server={closeout:true,ID:socket.userData.myIDinGame}
					allforked[roomname].send(message2server)
				}
			}
			console.log('sending comand to ',roomname,'and ID:',IDs[gameID])
			//message2server.gameID=IDs[gameID] socket.userData.myIDinGame
			console.log(message2server)
			allforked[roomname].send(message2server)
		}else{
			message( socket, 'room dosenot exist forwarding to lobby', serverColor);
			//socket.emit('forward to room','/')
			console.log( socket.ID, 'room dosenot exist forwarding to lobby',gameID);
		} 
	});
	
	socket.on("disconnect",function() {
		console.log(__line,"disconnected: " + gameID + ": " + socket.id);
		let message2server={gameID:IDs[gameID],data:{command:'disconnect'}}
		console.log('sending comand to ',roomname,'and ID:',IDs[gameID])
		console.log(message2server)
		if(allforked[roomname]){
			allforked[roomname].send(message2server)
		}
		delete allClients[IDs[gameID]]
	});
	

}
app.use('/',express.static('./Lobby'))
//app.use('/test',express.static('./testConnection'))




//const second = fork('child.js');
/*for(i=0;i<2;i++){
	let forked = fork('child.js');
	forked.on('message', (msg) => {
		console.log('Message from child:', msg);
	});
	allforked.push(forked)
}
console.log(allforked)
*/
//allforked[0].send({ port: 'world1' });
//allforked[1].send({ port: 'world2' });
//second.send({ port: 'rage' });



//captures stack? to find and return line number
Object.defineProperty(global, '__stack', {
  get: function(){
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});
//allows to print line numbers to console
Object.defineProperty(global, '__line', {
  get: function(){
    return __stack[1].getLineNumber();
  }
});
var stdin = process.openStdin();
stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 
	var input = d.toString().trim();
    console.log('you entered: [' + input + ']');
	if(input.charAt(0)=='#'){
		let game=avalibleGames[input.substr(1)]
		if(game){
			game.folderExposed=false
			console.log(game+" reloaded")
		}
	}else if(input.includes('$') && !input.includes('$$')){
		sinput=input.split('$')
		console.log(sinput)
		if(sinput.length==2){
			if(sinput[1] in allforked){
				console.log('feching '+sinput[0]+' from '+sinput[1])
				allforked[sinput[1]].send({debug:true,input:sinput[0]})
			}else{console.log(''+sinput[1]+ ' is not in allforked')}
		}else{console.log('input has been broken into to many pieces',sinput)}
	}else{
		try{
			eval("console.log("+input+")");
		} catch (err) {
			console.log("invalid command");
		}
	}
  });