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
		functlist:{}//,
		
	};
	tcomms.io.on('connect', () => {
		console.log("Connection successful!")
		tcomms.savedcommands=[]
		tcomms.io.emit('sendUsername', {
				ID:localStorage.commsID,
				name:localStorage.userName
			}, function (responseData) {
			//tcomms.ready=true
			console.log('Callback called with data:', responseData);
			if(responseData=='return'){
				window.location.href='/'
			}else{
				localStorage.commsID=responseData
				tcomms.id=responseData
			}
		});
		tcomms.functlist.connect()
	});
	
	tcomms.io.on('forward to room',(path)=>{
		console.log('move to path:',path)
		window.location.href=path
	});
	tcomms.io.on('gameCommands',function(input){
		console.log('game command',input)
		tcomms.functlist[input.command](input.data)
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

