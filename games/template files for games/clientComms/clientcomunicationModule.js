function comms(address){
	let thisSocket=io(window.location.href)
	let tcomms={
		inputAddress:address,
		io:thisSocket,
		on:function(command,funct){
			tcomms.functlist[command]=funct
		},
		emit:function(command,data){
			tcomms.io.emit('gameCommands',{command:command,data:data})
			if(arguments.length>2){
				console.log("currently you may only have up to 2 arguments, the call and the data")
			}
		},
		send:function(data){tcomms.io.emit('gameCommands',{command:'message',data:data})},
		functlist:{},
		ready:false
	};
	tcomms.io.on('connect', () => {
		console.log("Connection successful!")
		tcomms.savedcommands=[]
		tcomms.functlist.connect()
	});
	tcomms.io.on('getOldID',(callBack)=>{
		if(localStorage.commsID !== undefined){
			console.log(localStorage)
			callBack({ID:localStorage.commsID,name:localStorage.userName})
		}
		localStorage.commsID = thisSocket.id;
		tcomms.io.emit('gameID',function(data){
			console.log('recieved',data)
			tcomms.id=data.gameID
			localStorage.id=data.gameID
			while(tcomms.savedcommands.length>0){
				input=tcomms.savedcommands.shift()
				console.log('saved command',input)
				tcomms.functlist[input.command](input.data)
			}
			tcomms.ready=true
		})
		//socket.emit('gameCommands',{command:'addPlayer',data:localStorage.userName});
	});
	tcomms.io.on('forward to room',(path)=>{
		console.log('move to path:',path)
		window.location.href=path
	});
	tcomms.io.on('gameCommands',function(input){
		if(tcomms.ready){
			console.log('game command',input)
			tcomms.functlist[input.command](input.data)
		}else{
			tcomms.savedcommands.push(input)
		}
	});
	tcomms.io.on('message',(message)=>{
		console.log(message)
		try{
			tcomms.functlist.message(message)
		}catch(err){
			console.log(err)
		}
	});
	console.log('comms started')
	return tcomms
}

