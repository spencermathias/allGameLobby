

var withParent={
	socketList:{},
	moduleColor:'#aaaaaa',
	savedcommands:[],
	runGameCommand:function(gameID,data){
		try{
			let player=withParent.struct.sockets[gameID]
			//console.log('player',player)
			console.log('sockets',withParent.struct)
			player[data.command](data.data)
		}
		catch(err){
			//console.log(data)
			console.log("the command "+data.command+" did not work")
			console.log("it gave a "+err.name)
			console.log("with a message of "+err.message)
		}
	},
	message:function(socket,data){
		process.send({playerID:socket.id,command:'message',data:data})
	},
	struct:{
		sockets:{
			id:"all",
			emit:function(command,data){
				process.send({playerID:"all",command:command,data:data})
			},
			on:function(command,funct){
				withParent.struct.sockets[command]=funct
			}
		}
	}
}

withParent.defaultSocket=function(gameID){
	return{
		id:gameID,
		on: function(command,costomFunction){
			let player=withParent.struct.sockets[gameID]
			player[command]=costomFunction
			if(arguments.length!=2){
				console.log("currently you must have 2 arguments, the call and the function")
			}
		},
		emit:function(command,data){
			console.log('server sends out to player '+gameID+': ',{command:command,data:data})
			process.send({playerID:gameID,command:command,data:data})
		},
		broadcast:{
			id:{from:gameID},
			emit:function(command,data){
				console.log('server broadcasts to player '+gameID+': ',{command:command,data:data})
				process.send({playerID:{from:gameID},command:command,data:data})
			}
		}
	}
}

withParent.createServer= function(serverConfgObject){
	process.send({playerID:'use',path:"../template files for games/clientComms"})
	process.on('message', function(dataIn){
		if(dataIn.debug==undefined){
			console.log('current struct',withParent.struct.sockets)
			if(withParent.struct.sockets[dataIn.gameID]==undefined){
				let temp=withParent.defaultSocket(dataIn.gameID)
				console.log('default Socket',temp)
				withParent.struct.sockets[dataIn.gameID]=temp
				withParent.struct.sockets.connection(withParent.struct.sockets[dataIn.gameID])
				console.log('after connection',withParent.struct.sockets[dataIn.gameID])
			}
			withParent.runGameCommand(dataIn.gameID,dataIn.data)
		}else{
			try{
				std1.emit('data',dataIn.input)
			}catch(err){
				"invalid command in sub process"
			}
		}
	});
	return withParent.struct
}

withParent.clientfiles=function(){
	let tapp={use:function(expressPath){
			if(typeof expressPath =='string'){
				process.send({playerID:'use',path:expressPath})
			}else{
				console.log("can not process this type of input using this module")
			}
		}
	}
	return tapp
}
let std1=process.openStdin()


module.exports=withParent