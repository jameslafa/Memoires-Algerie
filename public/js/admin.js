jQuery(document).ready(function($){
	var index_locations = $("#locations .location").length - 1;
	var index_medias = $("#medias .media").length - 1;

	// Add a new location
	$("a.add_location").live("click", function(event){
		event.preventDefault();
		var ajaxOptions = {
			url:"/admin/documents/location/add/" + (index_locations + 1),
			type:"GET",
			dataType:"html",
			success:function(data){
				$("#locations .location_container").append(data);
				index_locations++;
			}
		};
		$.ajax(ajaxOptions);
		return false;
	});

	$("a.remove_location").live("click", function(event){
		event.preventDefault();
		var locationid = $(this).attr("locationid");
		$(".location[locationid=" + locationid + "]").remove();
	});

	// Add a new media
	$("a.add_media").live("click", function(event){
		event.preventDefault();
		var ajaxOptions = {
			url:"/admin/documents/media/add/" + (index_medias + 1),
			type:"GET",
			dataType:"html",
			success:function(data){
				$("#medias .media_container").append(data);
				index_medias++;
			}
		};
		$.ajax(ajaxOptions);

		return false;
	});

	$("a.remove_media").live("click", function(event){
		event.preventDefault();
		var locationid = $(this).attr("mediaid");
		$(".media[mediaid=" + locationid + "]").remove();
	});

	if ($("#document_list").length){
		var options = {
			valueNames: [ 'title', 'status', 'type' ],
			page : 5000
		};

		var documentList = new List('list_of_document', options);
	}

	if ($("#tags_list").length){
		var options = {
			valueNames: [ 'tag' ],
			page : 5000
		};

		var tagList = new List('list_of_tags', options);
	}

	if ($("#document_edit").length){
		tinyMCE.init({
			mode : "textareas",
			theme : "simple",
			valid_styles : { '*' : 'font-weight,font-style' },
			valid_elements : "a[href|target=_blank],strong/b,div[align],br,p,em/i",
			plugins : "paste",
 			paste_auto_cleanup_on_paste : true
		});
	}
});
