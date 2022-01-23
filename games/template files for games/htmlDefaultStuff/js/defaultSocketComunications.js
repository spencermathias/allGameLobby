
var publicAddress = 'http://alanisboard.ddns.net/';
var socket = comms(publicAddress);

socket.on("message",function(message){  

	//console.log("Message from the server arrived")
	
	$('#chatlog').append('<div style="color:'+message.color+'">'+message.data+'</div>'); /*appending the data on the page using Jquery */
	$('#response').text(message.data);
	$('#chatlog').animate({scrollTop: 1000000});
});

socket.on('userList',function(data){
	var userListString = '';
	userList = data;
	for( var i = 0; i < data.length; i++ ){
		var header = 'div id="userListDiv'+ i + '"';
		var click = 'onclick="changeName(' + "'" + data[i].id + "'" + ')"';
		var color = ' style="color: ' + data[i].color + ';"'
		var string = '' + data[i].userName;
		var ender = '</div>';
		
		if(data[i].color != spectatorColor){
			string = string + " " + data[i].score;
			
			if(data[i].id == socket.id){
				if(soundsAllowed && !myTurn && data[i].color == yourTurnColor){
					ding.play(); //play ding when it becomes your turn
				} 
				myTurn = data[i].color == yourTurnColor; //update old status
				
				myUserlistIndex = i;
				myUserlistString = string;
			}
		}
		
		userListString = userListString + '<' + header + click + color + '>' + string + ender;
		//console.log( "player", data[i].userName, "myTurn", myTurn, "id", data[i].id, socket.id, "color", data[i].color, yourTurnColor);
	}
	document.getElementById('userlist').innerHTML = userListString;
	console.table(data);
});

socket.on('showBoard',function(data){
	$('#title').css('color', data.titleColor);
	$('#content').css('display', data.displayTitle);
	$('#gameBoard').css('display', data.displayGame);
	resizeCanvas();
});

