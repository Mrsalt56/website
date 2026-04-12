// "use strict";
/* =============================================================== *\

   Incredibox copyrights So Far So Good © 2015
   Object app contenant les infos et éléments à charger

\* =============================================================== */

var app = new function(){
	
	this.name = 'Little Miss';
	this.version = '2';
	this.date = '2012';
	this.folder = 'asset-v2/';
	this.looptime = 4780;//this.looptime = 4760;// inutile si le son "aspire" est en WAV (heu... à vérifier)
	this.totalframe = 116*2;// 24 fps -> (8 x 24 img/s = 192 frame) x 2 (boucle A et boucle B)
	this.nbpolo = 7;
	this.nbloopbonus = 4;
	this.recmaxloop = 38;// faut que ça fasse environ 3 minutes
	this.recminloop = 5;
	this.recmintime = Math.round(this.looptime/1000)*this.recminloop;
	this.sndtype = 'mp3';
	this.sndaspire = 'aspire.wav';// 4780 // les sons bouclent parfaitement avec un métronome en WAV
	this.spritepolo = 'polo-sprite.png';
	this.spritepicto = 'game-picto@2x.png';

	this.col0 = '#EB4B4B';// light
	this.col1 = '#C32D2D';// normal
	this.col2 = '#9B2323';// dark
	this.col3 = '#691E1E';// more dark (:active)
	this.col4 = '#371919';// very dark
	
	this.animearray = [
		{name:'beat1_boom',			color:'828282', uniqsnd:false},
		{name:'beat2_kashi',		color:'828282', uniqsnd:true},
		{name:'beat3_paomeu',		color:'828282', uniqsnd:true},
		{name:'beat4_ptttpeu', 		color:'828282', uniqsnd:false},
		{name:'beat5_slupttt',		color:'828282', uniqsnd:true},
		{name:'effet1_poulll',		color:'828282', uniqsnd:false},
		{name:'effet2_tucati',		color:'828282', uniqsnd:true},
		{name:'effet3_tuilopta',	color:'828282', uniqsnd:false},
		{name:'effet4_tululou',		color:'828282', uniqsnd:true},
		{name:'effet5_tumttt',		color:'828282', uniqsnd:false},
		{name:'melo1_nananana',		color:'828282', uniqsnd:false},
		{name:'melo2_pelulu',		color:'828282', uniqsnd:false},
		{name:'melo3_siffle',		color:'828282', uniqsnd:false},
		{name:'melo4_tatouti',		color:'828282', uniqsnd:false},
		{name:'melo5_tvutvutvu',	color:'828282', uniqsnd:false},
		{name:'coeur1_oaaah',	 	color:'828282', uniqsnd:false},
		{name:'coeur2_cougou',	 	color:'828282', uniqsnd:false},
		{name:'coeur3_porticoeur',	color:'828282', uniqsnd:false},
		{name:'voix1_isit',			color:'828282', uniqsnd:false},
		{name:'voix2_uare',			color:'828282', uniqsnd:false}
	];
	 
	this.bonusarray = [
		{name:'Are you satisfy', 	src:'v2-satisfy.mp4',	code:'1,4,6,9,12',	sound:'bonus-satisfy.'+this.sndtype},
		{name:'Little Miss',	 	src:'v2-miss.mp4',		code:'5,6,7,13,15', sound:'bonus-miss.'+this.sndtype},
		{name:'Why this world',		src:'v2-world.mp4',		code:'6,8,9,14,18',	sound:'bonus-world.'+this.sndtype}
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