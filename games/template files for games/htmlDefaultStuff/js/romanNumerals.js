class Roman{
	constructor(string){
		string=string.toLowerCase()
		this.magnitudes=string.split(',')
		this.sign=1
		if(this.magnitudes[0]=='-'){
			this.sign=-1
			this.magnitudes.shift()
		}
	},
	add(a){
		
	},
	addm(a,b,c){
		a.indexOf('v')
		
	},
	mag2dec(place){
		let mag=this.magnitudes[place]
		let tot=0
		let sign=-1
		for (l of mag){
			if(l=='v'){
				tot+=5
				sign=1
			}else{
				tot+=sign
			}
		}
		return mag
	}
}