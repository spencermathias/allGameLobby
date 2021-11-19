const { fork } = require('child_process');
//const express = require('express');
const http = require('http');
//var io = require('socket.io');
//var express = require('express'); // for serving webpages
const fs = require('fs');// for geting file system
//var conDB=require('./mysqlConfig/databaseLogin.js')
var httpProxy = require('http-proxy');
var HttpProxyRules = require('http-proxy-rules');
//const morgan = require('morgan');
//var app = express();
var uid =require( 'uid').uid;
var externalPort=8081
var startPort=8010;
var lobbyPort=8080
var url = require('url')
var options={}//'/lobby':'http://localhost:8080'
var sockets={}



  // Set up proxy rules instance
  var proxyRules = new HttpProxyRules({
    rules: options,
    default: undefined//'http://localhost:'+lobbyPort // default target
  });

  var websiteRules = new HttpProxyRules({
    rules: {
		'/lobbies':'lobbyList',
		'/avalibleGames':'avalibleGames',
		'/newgame':'newGame',
		'/js/jquery-3.1.1.js':'jquery',
		'/js/lobby.js':'lobbyjs',
		'/css/styles.css':'css'
	},
    default:'landing' // default target
  });
  
  respondF={
		'lobbyList':function (req, res){
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.write(JSON.stringify(activeGames));
			res.end()
			console.log('in lobbies')
		},
		'avalibleGames':function (req, res){
			getGames(); 
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.write(JSON.stringify(Object.keys(avalibleGames)));
			res.end()
			console.log('in avalibleGames')
			return res
		},
		newGame:async (req, res) => {
			const buffers = [];

			for await (const chunk of req) {
				buffers.push(chunk);
			}

			const data = Buffer.concat(buffers).toString();
			let type=JSON.parse(data).type
			console.log(type); 
			
			let game={	sendTo:type,
						url:createGame(type)
					}
			res.write(JSON.stringify(game))
			res.end();
		},
		'landing':function(req,res){
			//console.log(req)
			res.writeHead(200, {
		        'Content-Type': 'text/html'
		    });
		    fs.readFile('./lobby/landingpage.html', null, function (error, data) {
		        if (error) {
		            res.writeHead(404);
		            res.write('Whoops! File not found!');
		        } else {
		            res.write(data);
		        }
		        res.end();
		    })
		},
		css:function(req,res){
			res.writeHead(200, {
		        'Content-Type': 'text/css'
		    });
		    fs.readFile('./lobby/css/styles.css', null, function (error, data) {
		        if (error) {
		            res.writeHead(404);
		            res.write('Whoops! File not found!');
		        } else {
		            res.write(data);
		        }
		        res.end();
		    })
		},
		'jquery':function(req,res){
			res.writeHead(200, {
		        'Content-Type': 'application/javascript'
		    });
		    fs.readFile('./lobby/js/jquery-3.1.1.js', null, function (error, data) {
		        if (error) {
		            res.writeHead(404);
		            res.write('Whoops! File not found!');
		        } else {
		            res.write(data);
		        }
		        res.end();
		    });
		},
		'lobbyjs':function(req,res){
			res.writeHead(200, {
		        'Content-Type': 'application/javascript'
		    });
		    fs.readFile('./lobby/js/lobby.js', null, function (error, data) {
		        if (error) {
		            res.writeHead(404);
		            res.write('Whoops! File not found!');
		        } else {
		            res.write(data);
		        }
		        res.end();
		    });
		},
		
  }
  
  // Create reverse proxy instance
  var proxy = httpProxy.createProxy({ws:true});

  // Create http server that leverages reverse proxy instance
  // and proxy rules to proxy requests to different targets
  server=http.createServer(function(req, res) {

    // a match method is exposed on the proxy rules instance
    // to test a request to see if it matches against one of the specified rules
    //console.log(req.headers)
	if(req.headers.referer!='http://alanisboard.ddns.net:8081/'){
		origin={url:req.headers.referer}

		var origTarget=proxyRules.match(origin);
		sockets[req.headers.cookie]=origTarget
	}
	
	var target = proxyRules.match(req);
	
	var info=websiteRules.match(req)
	
    if (target) {
	  console.log(target)
      return proxy.web(req, res, {
        target: target,
      });
	}else if(sockets[req.headers.cookie]){
	  console.log(sockets[req.headers.cookie])
      return proxy.web(req, res, {
        target: sockets[req.headers.cookie],
		ws:true
      });
	}else if(info){
		//console.log(respondF[info])
		return respondF[info](req,res);
	}else{
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		console.log(req)
		res.end('The request url and path did not match any of the listed rules!');
	}
  }).listen(externalPort);
  server.on('upgrade', function (req, socket, head) {
	let target = sockets[req.headers.cookie];
	if (target) {
		proxy.ws(req, socket, head, {target: target});
	}
});
/*
  server.on('upgrade', function (req, socket, head) {
    var target = proxyRules.match(req);
	console.log(req)
    if (target) {
		console.log('proxy ws',target)
		return proxy.ws(req, socket,head, {
			target: target,
			ws:true
		});
    }
})

*/

var allforked={}
var room=-1
var activeGames = [];
var avalibleGames = {}
var avaliblePorts = [];


function nextPort(){
    avaliblePorts=[]
	let unavaliblePorts=activeGames.map(x=>x.port-startPort).sort((a, b) => a - b)
	let currentPort=0
	for(let i=0; i<unavaliblePorts.length; i++){
		for(let j=currentPort; j<unavaliblePorts[i];j++){
			avaliblePorts.push(j)
		}
        currentPort=unavaliblePorts[1]+1
	}
	if(unavaliblePorts.length==0){unavaliblePorts=[-1]}
    avaliblePorts.push(unavaliblePorts.pop()+1)
    return avaliblePorts.shift()+startPort
}


function getGames(){
	const testFolder = './games/';
	fs.readdirSync(testFolder).forEach(file => {
		try{
			let temp=require('./games/'+file+'/serverconfig.js')
			let name=''
			temp.dirName='./games/'+file
			if(temp.name==undefined){
				name=file
			}else{
				name=temp.name
			}
			if(avalibleGames[name]==undefined || !avalibleGames[name].folderExposed){
				avalibleGames[name]=temp
				//app.use(namespace,express.static(avalibleGames[name].dirName+'/'+avalibleGames[name].clientFolder))
				avalibleGames[name].folderExposed=true
				if(avalibleGames[name].connect==undefined){
					let namespace='/'+name+'Connect'
					avalibleGames[name].connect=io.of(namespace+'/').on('connection',connectionFunction)
				}
			}else{
				let currentGame=avalibleGames[name]
				if(currentGame.clientFolder!=temp.clientFolder){
					//app.use(namespace,express.static(avalibleGames[name].dirName+'/'+avalibleGames[name].clientFolder))
				}
				/*for(key of Object.keys(temp)){
					if(key!="connect"){
						currentGame[key]=temp[key]
					}
				}*/
			}
		}catch(err){
			console.log('did not succesfuly import ',file)
			//console.log(file,' err ',err)
		}
	});
	console.log(avalibleGames.Keys)
}

function createGame(type){
	console.log(type)
	let connectorSocket={}
	let newgame=''
	getGames()
	//TODO
	
	if(type in avalibleGames){
		console.log('valid game')
		room+=1
		//socket.userData.myIDinGame=socket.id
		//new forked
		let port=nextPort()
		console.log(port,'is passed port')
		let forked = fork(avalibleGames[type].serverPath,[port],{cwd:'games/'+type+'/'});
		//forked.send({ID:socket.userData.myIDinGame,command:'addPlayer'})
		forked.room=type+room
		//forked.connectorSocket=avalibleGames[type].connectorSocket
		forked.disconnectedPlayers=[]
		forked.on('message', (msg) => {
			console.log('msg',msg)
		});
		forked.on('exit', function(code) {
			console.log(`About to exit ${forked.room} with code ${code}`);
			//forked.connectorSocket.in(forked.room).emit('forward to room','/')
			delete allforked[forked.room]
			activeGames=[]
			for(game in allforked){activeGames.push({name:game,URL:allforked[game].URL})}
		});
		let forkedURL='/'+forked.room+'/'
		//pathRewrites[forkedURL]=''
		options['.*'+forkedURL]='http://localhost:'+port
		forked.URL=forkedURL
		forked.port=port
		//socket.emit('forward to room',forkedURL)
		
		//load game files

		allforked[forked.room]=forked
		activeGames=[]
		for(game in allforked){activeGames.push({name:game,URL:allforked[game].URL})}
		return forkedURL
	}
}

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
	if(input.includes('$') && !input.includes('$$')){
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