// author : EL mansouri Abdelilah
jQuery(document).ready(function($){
	var ua 						= navigator.userAgent, 
  evently 					= (ua.match(/iPad/i)) ? "touchstart" : "click";
	var titleSite 		= "Mémoire d'algérie";
	window.titleSite 	= titleSite;
		
	var uri 					= new URI(document.URL);
	var pat			 			= uri.pathname().split('?');
	var pathname 			= pat[0].split('/');
	
	window.pathname 	= pat[0];

	window.page 			= pathname[1];
	if(window.page == 'document'){
		var linkInit		= '/api/document/'+pathname[2]+'/';
		window.period_key = 'all';
	
	}else if(pathname[3]){
		var linkInit = '/api/document/period/'+pathname[2]+'/search/'+pathname[3]+'/'+pathname[4]+'/';
		window.period_key = pathname[2];
		var sourceXML 		= '/gmap/'+window.period_key+'.xml';
		initialize(sourceXML); 
	}else{
		window.period_key = pathname[2];
		var linkInit 					='/api/document/period/'+window.period_key+'/';
		var sourceXML 		= '/gmap/'+window.period_key+'.xml';
		initialize(sourceXML); 
	}
	
	init(linkInit, window.period_key, window.page);
	// History.js
  var History = window.History;
  if ( !History.enabled ) {
      return false;
  }
  
  History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
		var state = History.getState();
		window.page				= state.data.page;
		window.period_key	= state.data.period;
		jQuery('#singleDetail .cp-pause').click();
		
		_gaq.push(['_trackPageview', state.url]); // Push dans l'analytics le changement d'url

		if(window.page == 'map'){
			displayMap(window.period_key, window.page);
		}else if(window.page == 'timeline'){
			displayTimeline(window.period_key, window.page);
		}else if(window.page == 'timelineTown'){
			window.page = 'timeline';
			displayTimelineTown(state.data.link);
		}else if(window.page == 'timelineTag'){
			window.page = 'timeline';
			displayTimelineTag(state.data.link);
		}else if(window.page == 'document'){
			displayTimelineDetail(state.data.link, window.page);
		}
  });
    
	$('header nav a').live(evently, function(event){
		
		var rel 		= $(this).attr('rel');	
		var text 		= $(this).text();
		window.page = rel;
		History.pushState({page:window.page,period:window.period_key }, null, '/'+window.page+'/'+window.period_key+'/');
		event.preventDefault();
	});

	$('.tooltip').live(evently, function(event){	
		if(window.page == 'document'){
			window.page = 'timeline';
		}
		tooltip(window.page,this);
		var urlState = '/'+window.page+'/'+window.period_key+'/';
		History.pushState({page:window.page,period:window.period_key }, null, urlState);
		event.preventDefault();
	});
	
	$(".btinfo").live(evently, function(event) {
		var town 			= $(this).attr('rel');
		var link 			= '/api/document/period/'+window.period_key+'/search/town/'+town+'/';
		var urlState 	= '/timeline/'+window.period_key+'/town/'+town+'/';
		History.pushState({page:'timelineTown',period:window.period_key, link:link }, null, urlState);
		event.preventDefault();
	});
	
	$(".bt_consult").live(evently, function(event) {
		var id 			= $(this).attr('rel');
		var link 			= '/api/document/'+id+'/';
		var urlState 	= '/document/'+id+'/';
		History.pushState({page:'document',period:window.period_key, link:link  }, null, urlState);
		event.preventDefault();
	});
	$(".bt_retour").live(evently, function(event) {
		History.back(-1);
		event.preventDefault();
	});
	
	$(".bt_more").live(evently, function(event) {
		window.timelineNbItem = window.timelineNbItem+20;
		var link = window.api_search;
		var new_link = window.api_search + "?from=" + window.timelineNbItem;
		get_result_json_search(new_link, 'add');
		event.preventDefault();
	});
	
	$(".bt_tag").live(evently, function(event) {
		var tag 			= $(this).text();
		var link 			= '/api/document/period/'+window.period_key+'/search/tag/'+tag+'/';
		var urlState 	= '/timeline/'+window.period_key+'/tag/'+tag+'/';
		History.pushState({page:'timelineTag',period:window.period_key, link:link }, null, urlState);
		event.preventDefault();
	});
	
	$(".bt_top").live(evently, function(event) {
		$('body').animate({scrollTop: $('body').offset().top}, 'slow');
		
		event.preventDefault();
	});
	
	// tooltip
	if ($.browser.msie && $.browser.version.substr(0,1)<7){
		$('.tooltip').mouseover(function(){
			$(this).children('span').show();
		}).mouseout(function(){
			$(this).children('span').hide();
		})
	}	
	
	// lightbox
	$('.lightbox').live(evently, function(event) {
		event.preventDefault();
		var activePop = $(this).attr('href');
		showPopup(activePop);
	});
	
	
	$('.lightDoc').live(evently, function(event) {
		var src = $(this).attr('href');
		var desc = $(this).attr('title');
		
		$('#contentDoc').html('<p>'+desc+'</p><br /><img src="'+src+'" alt="" class="img" width="100%" />');
		showPopup('#docPop');
		event.preventDefault();
		
	});
	
	$('.close, .mask').live(evently ,function(event) {
		event.preventDefault();
			hidePopup();
	});
	
	// tog
	$('.tog').live(evently ,function(event) {
		event.preventDefault();
		$(this).toggleClass('active');
		$(this).next().toggle('200');
			
	});

	// Lancement de la recherche sur la timeline
	$('#searchbutton').live('click', function(event){
		event.preventDefault();
		var keyword = $("#searchall").val();
		if (keyword && keyword.length > 3){
			var link = "/api/document/period/" + window.period_key + "/search/all/" + keyword;
			get_result_json_search(link);	
		}
		return false;
	});
	
	// NEWSLETTER
	$("#formNewsletter a#submit").live("click", function(event){	
		event.preventDefault();
		var required 		= ["#formNewsletter #name", "#formNewsletter #email"];
		var name 			= $("#formNewsletter #name");
		var email 			= $("#formNewsletter #email");
		var emptyerror 	= "Votre champ est vide";
		var emailerror 	= "Veuillez saisir un email valide";
		for (var i = 0, l = required.length; i < l; i++){
			var input = $(required[i]);
			if ((input.val() == "") || (input.val() == emptyerror)){
				input.addClass("needsfilled");
				input.val(emptyerror);
			}
			else {
				input.removeClass("needsfilled");
			}
		}
		// Validate the e-mail.
		var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (!regex.test(email.val())) {
			email.addClass("needsfilled");
			email.val(emailerror);
		}

		//if any inputs on the page have the class 'needsfilled' the form will not submit
		if ($(":input").hasClass("needsfilled")) {
			return false;
		} 
		else {
			var link = '/api/newsletter/add/'+email.val()+'/'+encodeURIComponent(name.val());
			console.log(link);

			jQuery.ajax({
				url: link,
				type: 'GET',
				success: function(data, textStatus, jqXHR) { 
					$("#formNewsletter a#submit").fadeOut(400, function(){
						$("#formNewsletter .notice").removeClass("error");
						$("#formNewsletter .notice").html("Vous êtes désormais abonné à notre newsletter. Merci.");
					});					
					return false;
				},
				error: function(jqXHR, textStatus, errorThrown){
					$("#formNewsletter .notice").addClass("error");
					$("#formNewsletter .notice").html(jqXHR.responseText);
					return false;
				}
      });
		}
		return false;
	});
	
	// Clears any fields in the form when the user clicks on them
	$(":input").focus(function(){		
	   if ($(this).hasClass("needsfilled") ) {
			$(this).val("");
			$(this).removeClass("needsfilled");
	   }
	});
	
	// Player
	var playlist = [
		{
			title:"Ali",
			mp3:"/sons/ali-1.mp3"
		},
		{
			title:"Ali",
			mp3:"/sons/ali-2.mp3"
		},
		{
			title:"Amine",
			mp3:"/sons/amine-1.mp3"
		},
		{
			title:"Amine",
			mp3:"/sons/amine-2.mp3"
		},
		{
			title:"Hortense",
			mp3:"/sons/hortense.mp3"
		},
		{
			title:"Julien",
			free:true,
			mp3:"/sons/julien.mp3"
		},
		{
			title:"Larbi",
			mp3:"/sons/larbi-1.mp3"
		},
		{
			title:"Larbi",
			mp3:"/sons/larbi-2.mp3"
		},
		{
			title:"Marion",
			mp3:"/sons/marion.mp3"
		},
		{
			title:"Mesbah",
			free:true,
			mp3:"/sons/mesbah-1.mp3"
		},
		{
			title:"Mesbah",
			mp3:"/sons/mesbah-2.mp3"
		},
		{
			title:"Saiah",
			free: true,
			mp3:"/sons/saiah.mp3"
		},
		{
			title:"Sofia",
			mp3:"/sons/sofia-1.mp3"
		},
		{
			title:"Sofia",
			mp3:"/sons/sofia-2.mp3"
		}
	];
	newPlaylist = playlist.sort( randOrd );
	new jPlayerPlaylist({
			jPlayer: "#jquery_jplayer_1",
			cssSelectorAncestor: "#jp_container_1"
		}, 
		newPlaylist, 
		{
			swfPath: "/js/jPlayer",
			supplied: "mp3",
			wmode: "window",
			loop: true,
			volume : 0.8,
			volumechange: commonVolume,
			ready: function() {
    		$(this).jPlayer("play");
    	}
		}
	);
	$(".inline").colorbox({
		title: false,
		inline:true, 
		width:"50%",
		arrowKey: false,
		slideshow: false,
		opacity:0.6
		
	});
	
	
	
});// fin dom event

function randOrd(){
return (Math.round(Math.random())-0.5); 
}

function init(linkInit, period, page){
	var start = true;
	navigation(page, start);
	window.timelineNbItem = 0;
	if(page == 'document'){
		displayTimelineDetail(linkInit);
	}else{
		if(period == 'all'){
			jQuery('.choixEvenement').addClass('all');
		}else{
			jQuery('.choixEvenement').removeClass('all');
		}
		
		jQuery('header nav ul').addClass('page-'+page);
		jQuery('a.bt_'+page).addClass('active');
		jQuery('#bloc_'+page).show();
		
		var newcolor = jQuery('#period_'+period).attr('class');
		var text 	= jQuery('#period_'+period+' .tooltip span').text();
		
		jQuery('.title_period').text(text);
		var oldColor = jQuery('.choixEvenement #enc').attr('class');
		jQuery('.choixEvenement #enc, .choixEvenement #enc2').removeClass(oldColor).addClass(newcolor);
		jQuery('.question.inline').attr('href', '#'+period);
	
		// color de la bande evntCol
		var colorEvnt 			= jQuery('#evntCol').attr('class');
		jQuery('#evntCol').removeClass(colorEvnt).addClass(newcolor);
		
		get_result_json_search(linkInit);
		
		History.pushState({page:window.page,period:window.period_key }, null, window.pathname);
	}
	start = false;
}
// MAP
var infoBubble;
var map;
function initialize(sourceXML) {
	//alert(periodKey);
	var styleAlgerie = [
	  {
	    featureType: "poi",
	    elementType: "geometry",
	    stylers: [
	      { hue: "#00ffa2" },
	      { gamma: 1.02 },
	      { lightness: -57 },
	      { saturation: 7 }
	    ]
	  },{
	    featureType: "landscape.natural",
	    stylers: [
	      { hue: "#11ff00" },
	      { saturation: -7 },
	      { lightness: -2 },
	      { gamma: 0.93 }
	    ]
	  },{
	    featureType: "water",
	    stylers: [
	      { hue: "#00e5ff" },
	      { lightness: -49 },
	      { saturation: 9 }
	    ]
	  }
	]
  var myLatlng = new google.maps.LatLng(33.027088,4.350586);
  var myOptions = {
    zoom: 5,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.HYBRID,
    //styles: styleAlgerie,
    scrollwheel: false
  }
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  downloadUrl(sourceXML, function(data) {
    var markers = data.documentElement.getElementsByTagName("marker");
    for (var i = 0; i < markers.length; i++) {
    	var lat							= parseFloat(markers[i].getAttribute("lat"));
    	var lng 						= parseFloat(markers[i].getAttribute("lng"));
    	var name 						= markers[i].getAttribute("name");
    	var nbdoc 					= markers[i].getAttribute("nbdoc");
    	var militaire 			= markers[i].getAttribute("militaire");
    	var personnelle 			= markers[i].getAttribute("personnelle");
    	var administrative	= markers[i].getAttribute("administrative");
      var latlng 					= new google.maps.LatLng(lat,lng);
      var marker 					= createMarker(name, nbdoc, militaire, personnelle, administrative, latlng);
        
     }
   });
}

function createMarker(name, nbdoc, militaire, personnelle, administrative, latlng) {
  var marker = new google.maps.Marker({position: latlng, map: map,draggable: false});
  
  google.maps.event.addListener(marker, "click", function() {
  	var textDoc;
    if (infoBubble) infoBubble.close();
    if(nbdoc > 1){
    	textDoc = 'documents disponibles';
    }else{
    	textDoc = 'document disponible';
    }
    var contentString = '<div class="infoW"><h2>'+name+'</h2><span class="nbdoc">'+nbdoc+' '+textDoc+'</span><ul><li>Archive militaire : '+militaire+'</li><li>Archive personnelle : '+personnelle+'</li><li>Archive administrative : '+administrative+'</li></ul><a href="#" class="btinfo bt" rel="'+name+'">Voir les documents</a><div class="clear"></div></div>';
    
		infoBubble = new InfoBubble({
      content: contentString,
      shadowStyle: 1,
	    padding: 15,
	    borderRadius: 3,
	    arrowSize: 15,
	    borderWidth: 1,
	    borderColor: '#a2a39e',
	    disableAutoPan: false,
	    hideCloseButton: false,
	    arrowPosition: 20,
	    backgroundColor: '#faf9f8',
	    maxWidth: 300,
	    maxHeight: '',
	    minWidth: 220,
	    minHeight: '',
	    backgroundClassName: 'phoney',
	    arrowStyle: 0
      });
      infoBubble.open(map, marker);
  });

  return marker;
}
  
function displayMap(period,page){
	navigation(page);
	window.timelineNbItem = 0;
	sourceXML = '/gmap/'+period+'.xml';
	initialize(sourceXML); 	
}
function displayTimeline(period, page){
	
	navigation(page);
	var link = '/api/document/period/'+period+'/';
	window.timelineNbItem = 0;

	get_result_json_search(link);
	
}
function displayTimelineTown(link){
	navigation('timeline');
	window.timelineNbItem = 0;

	get_result_json_search(link);
	
}
function displayTimelineTag(link){
	navigation('timeline');
	window.timelineNbItem = 0;
	get_result_json_search(link);
}
function displayTimelineDetail(link){
	navigation('document');
	
	jQuery('.texte').removeClass('none'); 
	jQuery('.mainRight').removeClass('large');
	jQuery.getJSON(link, function(jd) {
		var titreDoc, dateDoc, resume, author, source, typeDoc, paysOrigin, villeC, dateC, nomC, tags, texte, mediasList;		

		jQuery('.titreDoc').html(jd.title);
		jQuery('.dateDoc').html(jd.doc_date); 
		jQuery('.resume').html(jd.description);
		jQuery('.author').html(jd.doc_author); 
		jQuery('.source').html(getNameFromCode("source", jd.source)); 
		jQuery('.typeDoc').html(getNameFromCode("type", jd.type)); 
		jQuery('.paysOrigin').html(getNameFromCode("origin", jd.origin));
		jQuery('.texte').html(jd.text); 
		
		if(jd.text == ''){
			var firstTitle		= jd.medias[0].title;
			var firstDesc			= jd.medias[0].description;
			var firstCredits 	= jd.medias[0].credits;
			var firstSrc 			= jd.medias[0].file;
			
			var firstB 				= '<h2>'+firstTitle+'</h2><p>'+firstDesc+'</p><a class="lightDoc" href="'+firstSrc+'" title="'+jd.medias[0].description+'"><img src="'+firstSrc+'" alt="'+firstTitle+'" width="100%" />';
			
			
			jQuery('.texte').html(firstB);
			//jQuery('.texte').addClass('none'); 
			//jQuery('.mainRight').addClass('large'); 
		}

		// tags
		var nbtags	= jd.tags.length;
		tags = '<ul>';	
		
		for (var t=0; t<nbtags; t++) {
			tags += '<li><a href="#" class="bt_tag" title="'+jd.tags[t]+'">'+jd.tags[t]+'</a></li>';
		}
		tags += '</ul>';
		jQuery('.tags').html(tags);
		
		// Date citees
		dateC = '';
		var nbDates	= jd.dates.length;
		for (var d=0; d<nbDates; d++) {
			if(d==0){var virgule="";}else{var virgule=" , "; }
			dateC += virgule+jd.dates[d];
		}
		jQuery('.dateC').html(dateC);
		
		// People
		var nbPeople	= jd.people.length;
		nomC ='';
		for (var p=0; p<nbPeople; p++) {
			if(p==0){var virgule="";}else{var virgule=" , "; }
			nomC += virgule+jd.people[p];
		}
		jQuery('.nomC').html(nomC);
		
		// locations
		var nbLocation	= jd.locations.length;
		for (var l=0; l<nbLocation; l++) {
			if(l==0){var virgule="";}else{var virgule=" , "; }
			villeC = virgule+jd.locations[l].town;
		}
		jQuery('.villeC').html(villeC);
		
		// media
		var nbMedias	= jd.medias.length;
		
		mediasList = '';
		if(nbMedias==0){
				mediasList += '<div class="no-media">- Il n\'y a aucun média</div>';
		}
		for (var m=0; m<nbMedias; m++) {
			
			if(jd.medias[m].type == 'photo'){
				if(jd.medias[m].credits){
					var credits = '<br /><span class="credits">Crédits : '+jd.medias[m].credits+'</span>';
				}else{
					var credits = '';
				}
				
				mediasList += '<div class="item type_'+jd.medias[m].type+'"><a class="groupDoc" rel="groupDocs" href="'+jd.medias[m].file+'" title="'+jd.medias[m].description+'"><img src="'+jd.medias[m].file+'" alt="'+jd.medias[m].title+'" /></a><span class="name">'+jd.medias[m].title+credits+'</span><div class="clear"></div></div>';
			}else if(jd.medias[m].type == 'audio'){
				
				mediasList += '<div class="item type_'+jd.medias[m].type+'" >';
				mediasList += '<script type="text/javascript">jQuery("#jquery_jplayer_'+jd.medias[m]._id+'").jPlayer({ready: function () {jQuery(this).jPlayer("setMedia", {mp3:"'+jd.medias[m].file+'" });},play: function() {jQuery(this).jPlayer("pauseOthers");},cssSelectorAncestor: "#jp_container_'+jd.medias[m]._id+'",swfPath: "/js/jPlayer",supplied: "mp3",wmode: "window",volumechange: commonVolume});</script>';
				
				mediasList += '<div id="jquery_jplayer_'+jd.medias[m]._id+'" class="jp-jplayer"></div><div id="jp_container_'+jd.medias[m]._id+'" class="jp-audio"><div class="jp-type-single"><div class="jp-gui jp-interface"><ul class="jp-controls"><li><a href="javascript:;" class="jp-play" tabindex="1">play</a></li><li><a href="javascript:;" class="jp-pause" tabindex="1">pause</a></li></ul></div></div></div>';
				
				mediasList += '<span class="name">'+jd.medias[m].title+credits+'</span><div class="clear"></div>';
				mediasList += '</div>';
			}
			
		}
		mediasList += '<script type="text/javascript">$(".groupDoc").colorbox({ rel:"groupDocs",transition:"elastic",height: "96%"});</script><div class="clear"></div>';

		jQuery("#comments").empty();
		var fbcomments = '<div data-num-posts="5" data-width="720" class="fb-comments" data-href="' + window.location.href + '"></div>';
		jQuery("#comments").html(fbcomments);
		jQuery('.mediasList').html(mediasList);
	});
}

function navigation(page, start){
	var classU 		= jQuery('header nav ul').attr('class');	
	jQuery('header nav a').removeClass('active');
	
	jQuery('body').removeClass('screen-document');
	jQuery('body').removeClass('screen-timeline');
	jQuery('body').removeClass('screen-map');
	if(page == 'document'){
		jQuery('body').addClass('screen-document');
		jQuery('a.bt_timeline').addClass('active');
		jQuery('header nav ul').removeClass(classU).addClass('page-timeline');
	}
	
	if(page == 'timeline'){
		jQuery('body').addClass('screen-timeline');
		var bt = '.bt_'+page;
		jQuery('a.bt_timeline').addClass('active');
		jQuery('header nav ul').removeClass(classU).addClass('page-timeline');
		
	}
	if(page == 'map'){
		jQuery('body').addClass('screen-map');
		var bt = '.bt_'+page;
		jQuery('a.bt_map').addClass('active');
		jQuery('header nav ul').removeClass(classU).addClass('page-map');
	}
}

function tooltip(page, bt){
	navigation(page);
	window.period_key 	= jQuery(bt).attr('rel');
	var title 					= jQuery(bt).attr('title');
	var classEncBefore 	= jQuery('#enc').attr('class');
	var classEncAfter 	= jQuery(bt).parent().attr('class');
	
	if( jQuery('.choixEvenement').hasClass('all') ){
		jQuery('.choixEvenement').slideToggle('slow');
		jQuery('.choixEvenement').removeClass('all');
	}
	jQuery('.title_period').text(title);
	jQuery('.choixEvenement #enc, .choixEvenement #enc2').removeClass(classEncBefore).addClass(classEncAfter);
	jQuery('.question.inline').attr('href', '#'+window.period_key);
	
	sourceXML = '/gmap/'+window.period_key+'.xml';
	initialize(sourceXML); 
	
	// color de la bande evntCol
	var color 					= jQuery(bt).parent().attr('class');
	var colorEvnt 			= jQuery('#evntCol').attr('class');
	jQuery('#evntCol').removeClass(colorEvnt).addClass(color);

}

function get_result_json_search(link, add){
	
	if(add == 'add'){
	}else{
		window.api_search = link;
		jQuery('#resultDoc').html('');
	}
	
	jQuery.getJSON(link, function(jd) {
		var tree 	= "";
		var nbItems	= jd.length;
		if(nbItems<20){
			jQuery('.bt_more').addClass('none');
		}
		else {
			jQuery('.bt_more').removeClass('none');
		}
		for (var i=0; i<nbItems; i++) {
			if(i == (nbItems-1)){
				classe ="last";
			}
			tree += '<div class="item_time">';
			tree += '<div class="sourceType">';
			
			tree += '<span>' + getNameFromCode("source", jd[i].source)+' / '+getNameFromCode("type", jd[i].type)+'</span>';
			tree += '</div><!-- fin sources -->';
			
			tree += '<div class="left">';
			tree += '<h3>'+jd[i].title+'</h3>';
			// villes citées
			var nbVille	= jd[i].locations.length;
			if(nbVille > 0){
				tree += '<span><b>Villes citées :</b> ';
				for (var v=0; v<nbVille; v++) {
					if(v==0){var virgule="";}else{var virgule=", "; }
					tree += virgule+jd[i].locations[v].town;
				}
				tree += '</span>';
			}
			// dates citées
			var nbDates	= jd[i].dates.length;
			if(nbDates > 0){
				tree += '<span><b>Dates citées :</b> ';
				for (var d=0; d<nbDates; d++) {
					if(d==0){var virgule="";}else{var virgule=" , "; }
					tree += virgule+jd[i].dates[d];
				}
				tree += '</span>';
			}
			tree += '</div><!-- fin left -->';
			tree += '<div class="clear"></div>';
			tree += '<div class="desc">';
				tree += '<p>'+jd[i].description+'</p>';
			tree += '</div>';
			tree += '<div class="tags"><ul>';
			// tags
			var nbTags	= jd[i].tags.length;
			for (var t=0; t<nbTags; t++) {
				tree += '<li><a href="#" class="bt_tag" title="'+jd[i].tags[t]+'">'+jd[i].tags[t]+'</a></li>';
			}
			tree += '</ul><div class="clear"></div></div>';
			tree += '<a href="#" rel="'+jd[i]._id+'" class="bt bt_consult" title="'+jd[i].title+'" ><span></span>Consulter<br />le document</a>';
			tree += '<div class="clear"></div></div><!-- fin item_time -->';
		}
		
		if(nbItems == 0){
			jQuery('#resultDoc').append('<p class="noDoc">Il n\'y aucun document</p>');
		}else{
			jQuery('#resultDoc').append(tree);
		}
		
		
	});
}

function showPopup(activePop) {
	jQuery(activePop).before('<div class="mask"></div>');
	var popupH = jQuery(activePop).height();
	var popupW = jQuery(activePop).width();
	jQuery(activePop).css("margin-top", "-" + (popupH / 2) + "px");
	jQuery(activePop).css("margin-left", "-" + (popupW  + 140) / 2 + "px");
	jQuery(".mask").css('opacity', 0).fadeTo(300, 0.4, function () { jQuery(activePop).fadeIn(500); });
}
function hidePopup() {
     jQuery(".mask").fadeOut('fast', function () { jQuery(this).remove() });
     jQuery(".popup").fadeOut('fast', function () { jQuery(this).hide() });
}

function getNameFromCode(item, code){
	if (item == "type"){
		switch (code) {
			case "operation" :
				return "Bilan d'opération";
			case "interrogatoire" :
				return "Interrogatoire";
			case "renseignement" :
				return "Renseignement";
			case "temoignage" :
				return "Témoignage";
		}
	}
	else if (item == "source"){
		switch (code) {
			case "administrative" :
				return "Archive administrative";
			case "militaire" :
				return "Archive militaire";
			case "personnelle" :
				return "Archive personnelle";
		}
	}
	else if (item == "origin"){
		switch (code){
			case "dz":
				return "Algérie";
			case "eg":
				return "Egypte";
			case "fr":
				return "France";
			case "ma":
				return "Maroc";
			case "tn":
				return "Tunisie";
		}
	}
}

var volumeBeingChanged = false;
function commonVolume(event) {

    if(!volumeBeingChanged) {
        volumeBeingChanged = true;
        jQuery(".jp-jplayer")
        .jPlayer("option", "volume", event.jPlayer.options.volume)
        .jPlayer("option", "muted", event.jPlayer.options.muted);
        // The other events have occurred, so set the flag back again
        volumeBeingChanged = false;
    }
}
    