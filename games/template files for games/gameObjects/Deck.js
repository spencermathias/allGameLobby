// nodejs for a deck module. https://nodejs.org/docs/latest/api/modules.html
var isClient=false
const deckDict={novelcount:0}
class IDset{
	constructor(cardID,deckID){
		this.cardID=cardID
		this.deckID=deckID
	}
}


class Deck{
	constructor(cardDesc,deckID){
		this.cardDesc = cardDesc //CONST
		this.propKeys = Object.keys(this.cardDesc) //CONST
		
		let constants = [1]
		let constant = 1
		for(let propIndex = this.propKeys.length-1; propIndex >= 0; propIndex--){
			constant *= this.cardDesc[this.propKeys[propIndex]].length
			constants.unshift(constant)
		}
		
		this.totalCards = constants.shift() //first number is the total number of cards
			
		this.divConstants = constants //CONST
		//this.pile =[]
		//for( let i = 0;i<this.totalCards;i++){this.pile.push(this.getProperties(i));}
		//if(!isClient){this.shuffle(5)}
		if(deckDict[deckID]!=undefined){
			this.deckID=''+deckID+deckDict.novelcount
			deckDict.novelcount++
			deckDict[this.deckID]=this
		}else{
			this.deckID=''+deckID
			deckDict[this.deckID]=this
		}
		this.cardSettings = {
			funct2changeCard:undefined,
			click:function(){
				console.log('not overloaded yet')
			},
			width:10
		}
	}
	
	getProperties(cardNum){
		if(cardNum > this.totalCards) return undefined
		
		let cardProp = {}
		cardProp.ID=cardNum
		cardProp.deckID=this.deckID
		for(let propIndex = 0; propIndex < this.propKeys.length; propIndex++){
			let currentPropertyKey = this.propKeys[propIndex]  //'color'
			let currentPropertyList = this.cardDesc[currentPropertyKey] //['green','red','blue']
			
			//integer divide to get value
			let valueIndex = Math.floor(cardNum / this.divConstants[propIndex])
			cardProp[currentPropertyKey] = currentPropertyList[valueIndex]
			
			//subtract
			cardNum -= this.divConstants[propIndex]*valueIndex
		}
		return cardProp
	}
	
	
	
	makeCardObject(cardNum){
		let cardVals=this.getProperties(cardNum)
		
		let newCard= new Card(cardNum,cardVals)
		newCard.visuals.width=this.cardSettings.width
		let newProps=this.cardSettings.funct2changeCard(this.getProperties(cardNum))
		for(let prop in newProps){
			newCard.visuals[prop]=newProps[prop]
		}
		newCard.click=this.cardSettings.click
		return newCard
	}
	getCards(cardNums){
		return cardNums.map((num)=>{return this.makeCardObject(num)})
	}
}

class Pile{
	constructor(ArrayOfCards){
		this.cards=[]
		for(let card of ArrayOfCards){
			if(card instanceof Card){
				this.cards.push(card)
			}else if(typeof card=='Object'){		
				this.cards.push(deckDict[card.deckID].makeCardObject(card.ID))
			}
		}
		this.showOpps={
			showTop:false,
			showAll:false,
			hideNumber:true
		}
		this.vis={
			x:0,
			y:0,
			scale:1,
			pileWidth:this.cards.length*50,
			rotate:0,
			centered:true,
			topCardOnRight:true
		}
		this.drawnCards=[]
		
	}
	addPile(pile){
		if(pile instanceof Pile){
			while(pile.cards.length>0){this.cards.push(pile.cards.pop())}			
		}
		console.log('other pile is now empty')
	}
	addDeck(deck){
		if(deck instanceof Deck){
			this.cards.push(...deck.getCards([...Array(deck.totalCards).keys()]))
		}
	}
	deal(n=1){
		let hand=[]
		while(n){
			hand.push(this.cards.shift());n--;
		}
		let pile=new Pile(hand)
		return pile
	}

	returnCard(card){
		if(card instanceof Card){
			let index = Math.floor(Math.random()*this.cards.length)
			this.cards.splice(index,0,card)
		}
	}

	shuffle(n=1){
		while(n){
			let m = this.cards.length, i;
			while(m){
				i = Math.floor(Math.random() * m--);
				[this.cards[m],this.cards[i]]=[this.cards[i],this.cards[m]]
			}
			n--
		}
	}
	
	placePile(ctx,visuals,showOpps){
		for(const prop in visuals){
			this.vis[prop]=visuals[prop]
		}
		for(const prop in showOpps){
			this.showOpps[prop]=showOpps[prop]
		}
		
	}
	clickFunct(click){
		return this.drawnCards.some((card)=>{return card.clickFunct(click)})
	}
	
	draw(ctx){
		this.drawnCards=[]
		if(this.showOpps.hideNumber){
			if(this.showOpps.showTop){
				this.cards[0].place(this.vis)
				this.drawnCards.push(this.cards[0])
			}else{
				this.cards[0].backplace(this.vis)
				this.drawnCards.push(this.cards[0])
			}
		}else{
			let half = this.cards.length/2;
			let spacing = this.vis.pileWidth*this.vis.centered/this.cards.length;
			
			for(let card in this.cards){
				let cardLoc={
					x: (this.vis.x + Math.floor((card - half + .5)*spacing))*(-1+2*this.vis.topCardOnRight),
					y: this.vis.y,
					scale:this.vis.scale
				}
				if(this.showOpps.showAll){
					this.cards[card].place(cardLoc)
				}else if(this.showOpps.showTop && card==0){
					this.cards[0].place(cardLoc)
				}else{
					this.cards[card].backplace(cardLoc)
				}
				this.drawnCards.push(this.cards[card])
			}
		}
		ctx.save()
		ctx.rotate(this.vis.rotate)
		for(let card of this.drawnCards){
			card.draw(ctx)
		}
		ctx.restore()
	}
	alertChange(funct){
		if(typeof pilechange == 'function'){
			pilechange(this,funct)
		}
	}
}

class Card {
	constructor(cardID,properties){
		this.cardID=cardID
		this.props=properties
		if(isClient){
			this.visuals={
				width:10,
				hwRatio:1.3,
				text:'',
				fontSize:50,
				fillColor:'#ffe0b3',
				outlineColor:'#000000',
				textColor:'#000000',
				textOutlineColor:'#000000',
				textSlant:false,
			}
		}else{
			this.visuals={}
		}
	}
	
	updateSize(screenProps){
		this.x = screenProps.x;
		this.y = screenProps.y;
		this.width = screenProps.scale*10;
		this.height = screenProps.scale*10*this.visuals.hwRatio;
		this.clickArea = {minX: this.x - this.width/2, minY: this.y - this.height/2, maxX: this.x + this.width/2, maxY: this.y + this.height/2};
	}
	clickFunct(click){
		let area=this.clickArea
		if( click.x  < area.maxX){
			if( click.x > area.minX){
				if( click.y < area.maxY){
					if( click.y > area.minY){
						this.click()
						return true;
					}
				}
			}
		}
		return false
	}
	place(loc){
		this.loc=loc
		this.updateSize(loc)
		this.visible=true
		this.draw=(ctx)=>{
			if(this.visible){
				ctx.save();
				ctx.textAlign="center";
				ctx.textBaseline = "middle";
				ctx.fillStyle = this.visuals.fillColor;
				ctx.strokeStyle = this.visuals.outlineColor;
				ctx.beginPath();
				this.roundRect(ctx, this.clickArea.minX, this.clickArea.minY, this.width, this.height, this.width/8, this.visuals.fillColor, this.visuals.outlineColor);


				//draw number
				ctx.font = '' + this.visuals.fontSize + "px Arimo" //Arial Black, Gadget, Arial, sans-serif";
				ctx.fillStyle = this.visuals.textColor;
				ctx.strokeStyle = this.visuals.textOutlineColor;
				ctx.translate(this.x, this.y);
				if(this.visuals.textSlant){
					ctx.rotate(Math.atan(this.height/this.width));
				}
				if(this.visuals.textColor != undefined){
					this.multiLine(ctx,this.visuals.text,this.visuals.fontSize,0)//this.width/2);
				}
				if(this.visuals.textOutline != undefined){
					ctx.strokeText(this.visuals.text, 0, 0);
				}
				ctx.restore();
			}
		}
	}
	
	backplace(loc){
		this.loc=loc
		this.updateSize(loc)
		this.visible=true
		this.draw=(ctx)=>{
			if(this.visible){
				ctx.save();
				ctx.textAlign="center";
				ctx.strokeStyle = this.visuals.outlineColor;
				this.roundRect(ctx, this.clickArea.minX, this.clickArea.minY, this.width, this.height, this.width/8, this.visuals.fillColor != undefined, this.visuals.outlineColor != undefined);
				ctx.translate(this.x, this.y);
				ctx.restore();
			}
		}
	}
	
	roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  		ctx.save()
  		//ctx.translate(0,-y)
		if (typeof radius === 'undefined') {
			radius = 5;
		}
		if (typeof radius === 'number') {
			radius = {tl: radius, tr: radius, br: radius, bl: radius};
		} else {
			var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
			for (var side in defaultRadius) {
				radius[side] = radius[side] || defaultRadius[side];
			}
		}
		ctx.beginPath();
		ctx.moveTo(x + radius.tl, y);
		ctx.lineTo(x + width - radius.tr, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		ctx.lineTo(x + width, y + height - radius.br);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		ctx.lineTo(x + radius.bl, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
		ctx.lineTo(x, y + radius.tl);
		ctx.quadraticCurveTo(x, y, x + radius.tl, y);
		ctx.closePath();
		if (fill) {
			ctx.fillStyle=fill
			ctx.fill();
		}
		if (stroke) {
			ctx.strokeStyle=stroke
			ctx.stroke();
		}
		ctx.restore()
	}

	multiLine(ctx,text,fontSize,x){
		var lineHeight = Math.floor(fontSize*1.5);
		var strText=String(text)
		var lines = strText.split('\n');
		var offsetHeight=0
		if(lines.length>1){
			offsetHeight=(1-lines.length)*lineHeight/2
			//ctx.textAlign='start'
			for (var i = 0; i<lines.length; i++){
				ctx.fillText(lines[i], -x/2.1, offsetHeight + (i*lineHeight) )
			}
		}else{ctx.fillText(strText,0,0);}
	}
} 



//try/catch to allow use on client and server side
try {
	module.exports = Deck
	
} catch (err){
	isClient=true
	console.log("you must be client side!")
} 

/*let a = new Deck({suit:['♥','♦','♣','♠'], number:['A',2,3,4,5,6,7,8,9,10,'J','Q','K']}) //MSB->LSB

let c = []
for(let b = 0; b<52; b++){
	c.push(a.getProperties(b))
}
console.log(c)*/
