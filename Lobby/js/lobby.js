
function fetchlobbies(){
	fetch('/lobbies')
		.then((response)=>{
			return response.json()
		}).then((data)=>{
			loadgames(data)
		})
	}
var dummyID=0
function loadgames(currentGames){
	//let ul = document.getElementById("ulMessages");
	while($("ul")[0].firstChild) $("ul")[0].firstChild.remove();
	if(currentGames.length==0){
		$("ul").append("<li> No games are currently avalible.<br> Please create new game using drop down menu above </li>")
	}else{
		for(let i = currentGames.length-1;i>=0; i--){
			let game = currentGames[i];
			//let gameInfo = game.split(':')
			let appendString='<li>'+
								`<div id="title" onclick="send2game('${game.URL}')"> ${game.name}</div>`+
								'<div id="subtitle">Click to Start</div>'+
							'</li>'
			$("ul").append(appendString)
		}
	}
}
function createNewGame(type){
	if(type!='Cancel'){
		//socket.emit('newgame',type)
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

var url = "/newgame";

var xhr = new XMLHttpRequest();
xhr.open("POST", url);

xhr.setRequestHeader("Content-Type", "application/json");

xhr.onreadystatechange = function () {
   if (xhr.readyState === 4) {
      console.log(xhr);
      console.log(xhr.responseText);
   }};

var data = `{
  "Id": 12345,
  "Customer": "John Smith",
  "Quantity": 1,
  "Price": 10.00,
  "type": "Quinto"
}`;

xhr.send(data);


