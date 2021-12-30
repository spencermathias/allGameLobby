
function fetchlobbies(){
	fetch('/lobbies')
		.then((response)=>{
			return response.json()
		}).then((data)=>{
			loadgames(data)
		})
	fetch('/avalibleGames')
		.then((response)=>{
			return response.json()
		}).then((data)=>{
			getgames(data)
		})
	}
var dummyID=0
function loadgames(currentGames){
	while($("ul")[0].firstChild) $("ul")[0].firstChild.remove();
	if(currentGames.length==0){
		$("ul").append("<li> No games are currently avalible.<br> Please create new game using drop down menu above </li>")
	}else{
		for(let i = currentGames.length-1;i>=0; i--){
			let game = currentGames[i];
			let appendString='<li>'+
								`<div id="title" onclick="send2game('${game.URL}')"> ${game.name}</div>`+
								'<div id="subtitle">Click to Start</div>'+
							'</li>'
			$("ul").append(appendString)
		}
	}
}

function getgames(data){
	$("#new_game").empty();
	$("#new_game").append('<option value="Cancel">Cancel</option>')
	for(let i = 0;i<data.length; i++){
		let game = data[i];
		let appendString="<option value="+game+">"+game+"</option>"
		$("#new_game").append(appendString)
	}
}	

function createNewGame(type){
	if(type!='Cancel'){
		socket.emit('newgame',type)
	}
}
function send2game(game){
	//TODO check if game is still ready not started-----------------/
	//console.log('send player to a '+type+' game')
	if(game=='cribbage1'){
		location.href = "/cribbage1"
	}else{
		console.log('send player to: '+game)
		location.href = game
	}
}
function createServer(type){
	dummyID++
	console.log('created server with ID: '+type)

	return type+':'+dummyID
}
fetchlobbies()
setInterval(fetchlobbies,9000)


//create socket
var socket = io(window.location.href)//Addresses.publicAddress); //try public address //"24.42.206.240" for alabama

var trylocal = 0;
socket.on('connect_error',function(error){
	console.log("I got an error!", error);
	console.log("socket to:", socket.disconnect().io.uri, "has been closed.");
	if(!trylocal){ //prevent loops
		if(window.location.href != internalAddress){
			window.location.replace(internalAddress);
		}
		socket.io.uri = internalAddress;
		console.log("Switching to local url:", socket.io.uri);
		console.log("Connecting to:",socket.connect().io.uri);
		trylocal = 1;
	}
});

socket.on('reconnect', function(attempt){
	console.log("reconnect attempt number:", attempt);
});

socket.on('connect', function(){
	//get userName
	socket.emit('sendUsername', {
			ID:localStorage.commsID,
			name:localStorage.userName
		}, function (responseData) {
		console.log('Callback called with data:', responseData);
		if(responseData=='return'){
			window.location.href='/'
		}else{
			localStorage.commsID=responseData
		}
	});
	console.log("Connection successful!");

});



socket.on('getOldID',(callBack)=>{
	let userName=''
	if(localStorage.userName == undefined){
		userName=changeName();
		
	} else {
		userName=localStorage.userName;
	}
	callBack({ID:localStorage.id,name:userName})
	localStorage.id = socket.id;
})
function changeName(){
	var newUserName = null;
	do{
		newUserName = prompt('Enter username: ');
		console.log(newUserName);
		if ((newUserName == null || newUserName == "") && localStorage.userName !== undefined){
			newUserName = localStorage.userName;
		}
	} while (newUserName === null);
	localStorage.userName = newUserName;
	return localStorage.userName;
}
socket.on('forward to room',(path)=>{
	console.log('move to path:',path)
	window.location.href=path
})
