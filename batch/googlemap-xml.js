/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * This class was made to create an XML and use it in googlemap. But that's a pretty old fashion way and it will be rewritten soon to send a json file
 */

var mongoose 		= require("mongoose");					// Require mongoose module
var inspect 		= require('eyes').inspector();			// Require eyes inspector module
var fs 				= require('fs');						// Require file system module
var async 			= require('async'); 					// Require asynchronous request module

// ==================================
// GENERATE ALL GOOGLE MAP XML FILES
// ==================================
exports.generateGMapsFile = function(app){
	
	// Generate Global xml
	app.Models.Document.find({status:'published'}, function(err, docs){
		var towns = buildTownsList(docs);
		var file = app.path_public + "/gmap/all.xml";
		writeXMLFile(towns, file);
	});

	// Generate an individual xml for each periods
	app.Models.Period.findAllOrdered(function(err, periods){
		for (var i = 0, l = periods.length; i < l; i++){
			var period = periods[i];
			var period_key = period.key;
			app.Models.Document.find({status:'published', 'periods.key': period_key}, function(err, docs){
				if (docs.length > 0 && typeof docs[0].periods[0] != "undefined"){
					var period_key = docs[0].periods[0].key;
					var towns = buildTownsList(docs);
					var file = app.path_public + "/gmap/" + period_key + ".xml";				
					writeXMLFile(towns, file);
				}					
			});
		}
	});
}

function buildTownsList(docs){
	var towns = {};
	for (var i = 0, l = docs.length; i < l; i ++){
		var document = docs[i];

		for (var j = 0, m = document.locations.length; j < m; j++){
			var location = document.locations[j];
			var key = location.town.toLowerCase();
			if (typeof towns[key] == "undefined"){
				towns[key] = {};
				towns[key]["town"] = location.town;
				towns[key]["coordinates"] = location.coordinates;
				towns[key]["count"] = 1;
				towns[key]["documents"] = {
					militaire : 0,
					personnelle : 0,
					administrative : 0
				};
				towns[key]["documents"][document.source] = 1;
			}
			else {
				if (typeof towns[key]["documents"][document.source] == "undefined"){
					towns[key]["documents"][document.source] = 1;
				}
				else {
					towns[key]["documents"][document.source] ++;
				}
				towns[key]["count"] ++;
			}
		}
	}
	return towns;
}

function writeXMLFile(towns, file){
	var doc = '<?xml version="1.0" encoding="UTF-8"?>\n';										// Define XML encoding
	doc += '<markers>\n';																		// Start markers list

	for (town_key in towns){																// Loop on every town
		var town = towns[town_key];															// Get the current town
		doc += '\t<marker id="' + town_key + '"' ;											// Add a marker with an id
		doc += ' name="' + town.town + '"';													// Add the marker name
		doc += ' lat="' + town.coordinates[1] + '" lng="' + town.coordinates[0] + '"';
		doc += ' nbdoc="' + town.count + '" militaire="' + town.documents.militaire + '" personnelle="' + town.documents.personnelle + '" administrative="' + town.documents.administrative + '"';
		doc += ' />\n';
	}

	doc += '</markers>';

	fs.writeFile(file, doc, function(err){
		if (err){
			console.log(err);
		}
	});
}