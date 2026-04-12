// "use strict";
/* =============================================================== *\

   Incredibox copyrights So Far So Good © 2015
   Object app contenant les infos et éléments à charger

\* =============================================================== */

var app = new function(){

	this.name = 'The Love';
	this.version = '4';
	this.date = '2014';
	this.folder = 'asset-v4/';
	this.looptime = 7990;//this.looptime = 4760;// inutile si le son "aspire" est en WAV (heu... à vérifier)
	this.totalframe = 192*2;// 24 fps -> (8 x 24 img/s = 192 frame) x 2 (boucle A et boucle B)
	this.nbpolo = 7;
	this.nbloopbonus = 1;
	this.recmaxloop = 23;// faut que ça fasse environ 3 minutes
	this.recminloop = 3;// faut que ça fasse environ 20 secondes
	this.recmintime = Math.round(this.looptime/1000)*this.recminloop;
	this.sndtype = 'mp3';
	this.sndaspire = 'aspire.wav';// les sons bouclent parfaitement avec un métronome en WAV
	this.spritepolo = 'polo-sprite.png';
	this.spritepicto = 'game-picto@2x.png';

	this.col0 = '#D8A365';// light
	this.col1 = '#BA7B3D';// normal
	this.col2 = '#A16224';// dark
	this.col3 = '#6A3501';// more dark (:active)
	this.col4 = '#422101';// very dark
	
	this.animearray = [
		{name:'drum1_kick',			color:'E5A90E', uniqsnd:false},
		{name:'drum2_snare',		color:'E5A90E', uniqsnd:false},
		{name:'drum3_touti',		color:'E5A90E', uniqsnd:true},
		{name:'drum4_charley',	 	color:'E5A90E', uniqsnd:true},
		{name:'drum5_chatom',		color:'E5A90E', uniqsnd:false},
		{name:'effect1_bass',		color:'0CB6CB', uniqsnd:false},
		{name:'effect2_enigmatic',	color:'0CB6CB', uniqsnd:true},
		{name:'effect3_cry',		color:'0CB6CB', uniqsnd:true},
		{name:'effect4_odoyouno',	color:'0CB6CB', uniqsnd:true},
		{name:'effect5_oua',		color:'0CB6CB', uniqsnd:true},
		{name:'melo1_toun',			color:'F42828', uniqsnd:false},
		{name:'melo2_flute',		color:'F42828', uniqsnd:false},
		{name:'melo3_neou',	 		color:'F42828', uniqsnd:false},
		{name:'melo4_hu',	 		color:'F42828', uniqsnd:false},
		{name:'melo5_ah',			color:'F42828', uniqsnd:true},
		{name:'chips1_feel',	 	color:'787DFF', uniqsnd:false},
		{name:'chips2_chillin',	 	color:'787DFF', uniqsnd:true},
		{name:'chips3_yeah',	 	color:'787DFF', uniqsnd:true},
		{name:'chips4_filback',		color:'787DFF', uniqsnd:false},
		{name:'chips5_teylo',		color:'787DFF', uniqsnd:true}
	];
	 
	this.bonusarray = [
		{name:'Baby',	src:'v4-baby.mp4',		code:'1,2,6,11,17',		sound:'bonus-baby.'+this.sndtype},
		{name:'Follow', src:'v4-follow.mp4',	code:'1,6,8,12,18',		sound:'bonus-follow.'+this.sndtype},
		{name:'Eagle', 	src:'v4-eagle.mp4',		code:'1,3,6,13,16',		sound:'bonus-eagle.'+this.sndtype}
	];

	// ------------------------------ PAS ENVIE DE REMPLIR LE TOUT À LA MANO !
	for(var a=0, lng=this.animearray.length; a<lng; a++){
		var name = this.animearray[a].name;
		this.animearray[a].soundA = name+'_a.'+this.sndtype;
		this.animearray[a].soundB = this.animearray[a].uniqsnd ? name+'_a.'+this.sndtype : name+'_b.'+this.sndtype;
		this.animearray[a].anime = name+'-sprite.png';
		this.animearray[a].animeData = name+'.json';
	}
}