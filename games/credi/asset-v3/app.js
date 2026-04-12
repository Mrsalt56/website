// "use strict";
/* =============================================================== *\

   Incredibox copyrights So Far So Good © 2015
   Object app contenant les infos et éléments à charger

\* =============================================================== */

var app = new function(){

	this.name = 'Sunrise';
	this.version = '3';
	this.date = '2013';
	this.folder = 'asset-v3/';
	this.looptime = 7990;//this.looptime = 4760;// inutile si le son "aspire" est en WAV (heu... à vérifier)
	this.totalframe = 192*2;// 24 fps -> (8 x 24 img/s = 192 frame) x 2 (boucle A et boucle B)
	this.nbpolo = 7;
	this.nbloopbonus = 4;
	this.recmaxloop = 23;// faut que ça fasse environ 3 minutes
	this.recminloop = 3;// faut que ça fasse environ 20 secondes
	this.recmintime = Math.round(this.looptime/1000)*this.recminloop;
	this.sndtype = 'mp3';
	this.sndaspire = 'aspire.wav';// les sons bouclent parfaitement avec un métronome en WAV
	this.spritepolo = 'polo-sprite.png';
	this.spritepicto = 'game-picto@2x.png';

	this.col0 = '#6E96A0';// light
	this.col1 = '#3C646E';// normal
	this.col2 = '#28505A';// dark
	this.col3 = '#143C46';// more dark (:active)
	this.col4 = '#002832';// very dark
	
	this.animearray = [
		{name:'drum1_ballet',	color:'1EB482', uniqsnd:true},
		{name:'drum2_kick',		color:'1EB482', uniqsnd:true},
		{name:'drum3_snare',	color:'1EB482', uniqsnd:true},
		{name:'drum4_lead',	 	color:'1EB482', uniqsnd:true},
		{name:'drum5_charley',	color:'1EB482', uniqsnd:true},
		{name:'effet1_long',	color:'50B4E6', uniqsnd:false},
		{name:'effet2_daft1',	color:'50B4E6', uniqsnd:true},
		{name:'effet3_tududu',	color:'50B4E6', uniqsnd:true},
		{name:'effet4_daft2',	color:'50B4E6', uniqsnd:true},
		{name:'effet5_rythme',	color:'50B4E6', uniqsnd:false},
		{name:'melo1_tuu',		color:'FA5050', uniqsnd:true},
		{name:'melo2_indien',	color:'FA5050', uniqsnd:true},
		{name:'melo3_armo',	 	color:'FA5050', uniqsnd:true},
		{name:'melo4_clav',	 	color:'FA5050', uniqsnd:false},
		{name:'melo5_siffle',	color:'FA5050', uniqsnd:true},
		{name:'voix1_waya',	 	color:'E6C832', uniqsnd:true},
		{name:'voix2_ride',	 	color:'E6C832', uniqsnd:false},
		{name:'voix3_over',	 	color:'E6C832', uniqsnd:false},
		{name:'voix4_colors',	color:'E6C832', uniqsnd:true},
		{name:'voix5_sunrise',	color:'E6C832', uniqsnd:false}
	];
	 
	this.bonusarray = [
		{name:'Lill Child', src:'v3-child.mp4',	code:'2,4,9,14,16',		sound:'bonus-child.'+this.sndtype},
		{name:'Dance',	 	src:'v3-dance.mp4',			code:'2,3,5,6,14',		sound:'bonus-dance.'+this.sndtype},
		{name:'Sunrise',	src:'v3-sunrise.mp4',		code:'6,11,13,16,18',	sound:'bonus-sunrise.'+this.sndtype}
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