/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * Api controller : Handle all api services
 */
exports.init = function(app){
	var utils 				= require(app.path + '/models/utils.js');			// Include utils functions
	var inspect 			= require('eyes').inspector({maxLength: 1000});						// Node module to display object nicely in console

	var search_fields		= ["title", "locations.town", "dates", "source", "description", "tags", "type"];

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Return all available periods
	 */
	app.get('/api/periods', function(req,res){
		app.Models.Period.findAllOrdered(function(err, periods){ 	// Call the findAllOrdered to get all periods chronologicaly ordered
			sendResults(res, err, periods);						// Send the result
		});
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Return the document information
	 * @param documentID : the document objectId
	 */
	app.get('/api/document/:documentID', function(req, res, next){
		var documentID = req.params.documentID;													// Get the documentID
		
		var search_criterias = {																// Initialize the search_criterias
			status : 'published',
			_id : documentID		
		};																

		app.Models.Document.findOne(search_criterias, [], {}, function(err, document){			// Find the document
			sendResults(res, err, document);													// Send the result
		});
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Return all documents available is a defined period
	 * @param period : the period key. Can be "all"
	 */
	app.get('/api/document/period/:period/', function(req, res, next){
		var period = req.params.period;															// Get the period
		var from = req.param('from') || 0;														// Get the from parameter. If not define, set the default value
		var limit = req.param('limit') || 20;													// Get the limit parameter. If not define, set the default value
		
		var search_criterias = {																// Initialize the search_criterias
			status : 'published'		
		};																

		if (period != "all"){																	// If the period is not defined to all
			search_criterias["periods.key"] = period;											// Search document on the period
		}

		app.Models.Document.find(search_criterias, search_fields, {sort:{'dates':1}, skip: from, limit: limit}, function(err, documents){	// Find documents
			sendResults(res, err, documents);													// Send the result
		});
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Find a document for a defined period and looking an many fields :
	 *					- tags
	 *					- title
	 *					- town
	 *					- people
	 *					- doc_author
	 * @param period : the period key. Can be "all"
	 * @param keyword : the keyword.
	 */
	app.get('/api/document/period/:period/search/all/:keyword', function(req, res, next){
		var keyword = req.params.keyword;														// Get the search keyword
		var period = req.params.period;															// Get the period
		var from = req.param('from') || 0;														// Get the from parameter. If not define, set the default value
		var limit = req.param('limit') || 20;													// Get the limit parameter. If not define, set the default value

		if (keyword == null || keyword.length < 3){												// Check the keywork is at least a 3 characters work
			res.send("Invalid search item : must be at least 3 characters", 500);
			return;
		}
		
		var search_criterias = {																// Initialize the search_criterias
			status : 'published'		
		};		

		if (period != "all"){																	// If the period is not defined to all
			search_criterias["periods.key"] = period;											// Search document on the period
		}
		var date = utils.getDateFromString(keyword);											// Try to convert keyword in a date

		if (date){																				// If the keyword is a date
			search_criterias.dates = date;														// Make a reasearch on the dates field
		}
		else {																					// Else, search on other fields
			var regex = new RegExp(keyword.toLowerCase(), "i");
			search_criterias.$or = [															// Search $or to search on many fields
					{'tags': regex},															// Search on tags
					{'title': regex},															// Search on title
					{'locations.town': regex},													// Search on city name
					{'people': regex},															// Search on people name
					{'doc_author': regex}														// Search on document author
				];
		}

		app.Models.Document.find(search_criterias, search_fields, {sort:{'dates':1}, skip: from, limit: limit}, function(err, documents){	// Find documents
			sendResults(res, err, documents);													// Send the result
		});
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Return all documents available is a defined period and on a defiend criteria
	 * @param period : the period key. Can be "all"
	 * @param criteria : the criteria of the search. Can be "tag", "people", "date", "town", "locality"
	 * @param key : the keyword of the search
	 * @param optional_key : the optional keyword used for search that may need 2 keywords like dates
	 */
	app.get('/api/document/period/:period/search/:criteria/:key/:optional_key?', function(req, res, next){
		var criteria = req.params.criteria;													// Get the search criteria
		var key = req.params.key;															// Get the search key
		var period = req.params.period;														// Get the period
		var optional_key = req.params.option_key;											// Get the second and optional key

		var from = req.param('from') || 0;													// Get the from parameter. If not define, set the default value
		var limit = req.param('limit') || 20;												// Get the limit parameter. If not define, set the default value

		if (!criteria){																		// Check that a search criteria was defined
			res.send("A search criteria must be defined", 500);								// Return an error 500 and display the message
			return;
		}
		if (!key){																			// Check that a search key was defined
			res.send("A search key must be defined", 500);									// Return an error 500 and display the message
			return;
		}

		var search_criterias = {																// Initialize the search_criterias
			status : 'published'		
		};		

		if (period != "all"){																// If the period is not defined to all
			search_criterias["periods.key"] = period;										// Search document on the period
		}

		var regex = new RegExp(key.toLowerCase(), "i");

		switch(criteria){
			case "tag" : 																	// Search a tag
				search_criterias.tags = regex;
				break;
			case "people" : 																// Search a person
				search_criterias.people = regex;
				break;
			case "date" : 																	// Search for a date
				var begin_date = utils.getDateFromString(key);
				if (optional_key){															// If an end date was defined, search between the begin date and end date
					var end_date = utils.getDateFromString(optional_key);
					search_criterias.dates = {$gte: begin_date, $lte: end_date}
				}
				else {																		// Else, search from the begin date
					search_criterias.dates = {$gte: begin_date}
				}
				break;
			case "town" :
				search_criterias['locations.town'] = regex;									// Search for a city
				break;
			case "locality" :
				search_criterias['locations.locality'] = regex;								// Search for a locality
				break;
			default :
				res.send("Invalid search criteria : " + criteria, 500);						// Return an error 500 and display the message
				return;
		}

		app.Models.Document.find(search_criterias, search_fields, {sort:{'dates':1}, skip: from, limit: limit}, function(err, documents){		// Find documents
			sendResults(res, err, documents);												// Send the result
		});
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Add a new person in the newsletter list
	 * @param email
	 * @param name Optionnal name of the person who wants to register
	 */
	app.get('/api/newsletter/add/:email/:name?', function(req, res, next){
		var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

		var email = req.params.email;
		var name = req.params.name;
		if (email && regex.test(email)){
			var newsletter = new app.Models.Newsletter();
			newsletter.email = email;
			newsletter.name = name;
			newsletter.key = utils.randomKeyGenerator();

			newsletter.save(function(err){
				if (err){
					console.log(err);
					if (err.code == 11000){
						res.send("Vous êtes déjà abonné à notre newsletter.", 500);	
					}
				}
				else {
					res.send("Suscribtion done", 200);
				}
			});
		}
		else {
			res.send("Votre email n'est pas valide : " + email, 500);
		}
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @function
	 * @description Return a JSON response to the browser
	 */
	function sendResults(res, err, documents){
		if (err){																				// If an error happened, 
			res.send("An error happened while searching : \n" + err.message, 500);				// Return an error 500 and display the message
			return;
		}
		else {
			for (var i = 0, l = documents.length; i < l; i++){									// For every docs, format dates
				var document = documents[i];													// Get the current doc
				if (document.dates){
					var formatted_dates = [];													// Store all formatted dates
					for (var j = 0, m = document.dates.length; j < m; j++){						// Loop on every key dates
						var date = document.dates[j];											// Get the current date
						formatted_dates.push(utils.getStringFromDate(date));					// Format the date
					}
					
					document._doc.dates = formatted_dates;										// Replace the date in the initial object
				}

				if (document.doc_date){
					document._doc.doc_date = utils.getStringFromDate(document.doc_date);		// Update document date
				}
			}
			
			res.send(documents);																// Send the json response
		}
	}


}// End of exports.init = function(app)