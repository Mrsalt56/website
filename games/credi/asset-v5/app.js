// "use strict";
/* =============================================================== *\

   Incredibox copyrights So Far So Good © 2015
   Object app contenant les infos et éléments à charger

\* =============================================================== */

var app = new function(){

	this.name = 'Brazil';
	this.version = '5';
	this.date = '2016';
	this.folder = 'asset-v5/';
	this.looptime = 7990;//this.looptime = 4760;// inutile si le son "aspire" est en WAV (heu... à vérifier)
	this.totalframe = 192*2;// 24 fps -> (8 x 24 img/s = 192 frame) x 2 (boucle A et boucle B)
	this.nbpolo = 7;
	this.nbloopbonus = 1;
	this.recmaxloop = 23;// faut que ça fasse environ 3 minutes
	this.recminloop = 3;// faut que ça fasse environ 20 secondes
	this.recmintime = Math.round(this.looptime/1000)*this.recminloop;
	this.sndtype = 'mp3';// mp3, wav (ogg marche pas sur IOS)
	this.sndaspire = 'aspire.wav';// les sons bouclent parfaitement avec un métronome en WAV
	this.spritepolo = 'polo-sprite.png';
	this.spritepicto = 'game-picto@2x.png';

	this.col0 = '#6EB950';// light
	this.col1 = '#41A032';// normal
	this.col2 = '#2D7D28';// dark
	this.col3 = '#235023';// more dark (:active)
	this.col4 = '#14321E';// very dark
	
	this.animearray = [
		{name:'1_poum',			color:'FAB405', uniqsnd:true},
		{name:'2_creuki',		color:'FAB405', uniqsnd:true},
		{name:'3_shaka',		color:'FAB405', uniqsnd:true},
		{name:'4_chouk',	 	color:'FAB405', uniqsnd:true},
		{name:'5_kaliak',		color:'FAB405', uniqsnd:true},
		{name:'6_tek',			color:'23BEE1', uniqsnd:true},
		{name:'7_tuk',			color:'23BEE1', uniqsnd:true},
		{name:'8_teung',		color:'23BEE1', uniqsnd:true},
		{name:'9_ting',			color:'23BEE1', uniqsnd:true},
		{name:'10_kougou',		color:'23BEE1', uniqsnd:true},
		{name:'11_parimba',		color:'64B92D', uniqsnd:true},
		{name:'12_coloko',		color:'64B92D', uniqsnd:true},
		{name:'13_clav',	 	color:'64B92D', uniqsnd:true},
		{name:'14_tromp',	 	color:'64B92D', uniqsnd:true},
		{name:'15_trompolo',	color:'64B92D', uniqsnd:true},
		{name:'16_bass',	 	color:'E63C14', uniqsnd:true},
		{name:'17_wa',	 		color:'E63C14', uniqsnd:true},
		{name:'18_ya',	 		color:'E63C14', uniqsnd:true},
		{name:'19_palapa',		color:'E63C14', uniqsnd:true},
		{name:'20_oh',			color:'E63C14', uniqsnd:true}
	];
	 
	this.bonusarray = [
		{name:'Felicidade',	src:'v5-felicidade.mp4',	code:'1,3,6,10,16',		sound:'bonus-felicidade.'+this.sndtype},
		{name:'Chegou', 	src:'v5-chegou.mp4',		code:'1,4,9,13,17',		sound:'bonus-chegou.'+this.sndtype},
		{name:'Musica', 	src:'v5-musica.mp4',		code:'1,5,7,14,19',		sound:'bonus-musica.'+this.sndtype}
	];

	this.unlockerarray = [];

	/*	------------------------------ REMPLIR UN TABLEAU AVEC LES ID DE PICTO QUI UNLOCK LES BONUS
		Comme on pourra directement demander à un picto "est-ce que tu fais partie de la combinaison d'un bonus ?"
		Ça va par exemple servir à afficher un point coloré sous les polos si ils font partie d'une combinaison bonus
		Edit : Je l'ai fait, en fait c'est naz, quand il y a des polos qui appartiennent à 2 bonus différents et qui affichent un point sous leur bidou, bas c'ets confus, on comprend pas bien ce que ça veut dire...
	*/

	var that = this;
	
	function trierCodeBonus(){
		for(var a=0; a<that.bonusarray.length; a++){
			var codeArr = that.bonusarray[a].code.split(',');
			for(var b=0; b<codeArr.length; b++){
				var pictoCode = Number(codeArr[b]);
				var found = false;
				for(var c=0; c<that.unlockerarray.length; c++){
					if(that.unlockerarray[c] == pictoCode){
						found = true;
						break;
					}
				}
				if(!found){
					that.unlockerarray[c] = pictoCode;
				}
			}
		}
		console.log(that.unlockerarray)
	}
	trierCodeBonus(); // Pas besoin finalement, ça servait 

	/*	------------------------------ REMPLIR LE TABLEAU ANIMEARRAY */
	
	for(var a=0, lng=this.animearray.length; a<lng; a++){
		var name = this.animearray[a].name;
		this.animearray[a].soundA = name+'_a.'+this.sndtype;
		this.animearray[a].soundB = this.animearray[a].uniqsnd ? name+'_a.'+this.sndtype : name+'_b.'+this.sndtype;
		this.animearray[a].anime = name+'-sprite.png';
		this.animearray[a].animeData = name+'.json';
	}
}