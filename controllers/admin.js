/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * Admin controller : Handle all the admin interface
 */
exports.init = function(app){
	var utils 				= require(app.path + '/models/utils.js');			// Include utils functions
	var static_datas 		= require(app.path + '/models/static_datas.js');	// Include functions to get static datas
	var googlemapxml 		= require(app.path + '/batch/googlemap-xml.js');	// Include kml builder
	var async 				= require('async'); 								// Node module to handle asynchronous request
	var moment 				= require('moment'); 								// Node module to handle dates	
	var fs 					= require('fs.extra');								// Node module to handle file system copy and move
	var inspect 			= require('eyes').inspector();						// Node module to display object nicely in console
	var wrench 				= require('wrench');								// Node module to handle recursive operations on file system	
	var bcrypt 				= require('bcrypt'); 								// Node module to handle password encryption
	//var graph 				= require('fbgraph');								// Node module to request Facebook graph api

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Middleware to control is the user is logged as an admin
	 * 				Call this middleware on every request that need admin access right
	 * 				Example : app.get("/admin", [requireAdminRights], function(req, res, next){ ... });
	 */
	function requireAdminRights (req, res, next) {	
		if (req.session.user && req.session.user.admin) {									// Check if the user is logged in
			next();
		}
		else {
			res.redirect("/admin/login");													// If the user doesn't have any session, redirect him to the login page
		}
	}

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description The route to /admin is just a shortcut to /admin/main.
	 *				Before redirecting the user to /admin/main, the middleware check if the user has the admin rights
	 */
	app.get("/admin", [requireAdminRights], function(req, res, next){	
		res.redirect("/admin/main");						// After having checked the user has admin right, redirect him to the /admin/main page
	});

	
	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Display the login page to invite him to login via Facebook
	 *				Define the redirectTo path in the user session to redirect him on /admin page after he logged in
	 */
	app.get('/admin/login', function(req, res, next){
		var locals = {
			admin: true,														// Define the page as an admin page
			page_title : app.Models.Default_locals.pre_title + " : Login"		// Define page title
		};
		req.session.redirectTo = "/admin";										// Define the redirectTo path to redirect the user after he loggedin via Facebook
		res.render('admin/login', locals);										// Display the login page
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Logout the user
	 */
	app.get('/admin/logout', function(req, res, next){
		req.session.destroy();													// Destroy the user session
		res.redirect("/admin/main");											// Redirect him to the admin page
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Check if user credentials are correct
	 */
	app.post('/admin/login', function(req, res, next){
		var login = req.body.login;									// Get the login
		var salt = bcrypt.genSaltSync(); 							// Generate a salt for encryption

		app.Models.User.findOne({login: login}, function(err, user){
			if (err){
				console.log("An error happened while authenticating the user");
				console.log(err);
				next(err);
			}
			else {
				if (user && user.login == login){
					if (!user.admin){
						req.flash("error", "You don't have admin rights. Please contact the administrator");	
						res.redirect("/admin/login");
					}
					else {
						var db_password = user.password;
						if (bcrypt.compareSync(req.body.password, db_password)){
							req.session.user = {};				// Create a user object in the user session
							req.session.user.login = login;		// Add the login to the user session object
							req.session.user.admin = true;		// Set the user as admin
							res.redirect("/admin");
						}
						else{
							req.flash("error", "Incorrect login or password");
							res.redirect("/admin/login");
						}
					}
				}
				else {
					req.flash("error", "Incorrect login or password");
					res.redirect("/admin/login");
				}
			}
		});
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Adminitration Dashbord : Give access to all admin pages
	 */
	app.get('/admin/main', [requireAdminRights], function(req, res, next){
		var locals = {
			admin: true,																			// Define the page as an admin page
			page_title : app.Models.Default_locals.pre_title + " : Panneau d'administration"		// Define page title
		};
		res.render('admin/main', locals);															// Display the dashboard page
	});	

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Display a list of all documents
	 */
	app.get('/admin/documents', [requireAdminRights], function(req, res, next){
		var locals = {
			admin : true,																			// Define the page as an admin page
			page_title : app.Models.Default_locals.pre_title + " : Liste des documents",			// Define page title
		};
		
		async.parallel({																			// Get all asynchronous data
			documents: function(callback){
					app.Models.Document.find({}, [], {sort:{'creation_date':-1}}, callback);		// Get all documents by creating date Descending
				}
			},
			function(err, results){																	// Callback launch after all asynchronous request are done
				if (!err){															
					locals.documents = results.documents;											// Get documents result
					res.render('admin/document/list', locals);										// Render the page "Add a new document"
				}
				else {
					console.log(err);																// If an error happend while getting asynchronous data, lot it
					next(err);																		// And delegate error handling
				}
			}
		);
	});


	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Display the page to add a new document
	 */
	app.get('/admin/documents/add', [requireAdminRights], function(req, res, next){ 		
		var locals = {
			admin: true,																			// Define the page as an admin page
			page_title : app.Models.Default_locals.pre_title + " : Ajouter un nouveau document",	// Define page title
			index : 0,																				// First index of list elements (events and medias)
			departements : static_datas.getAllDepartements(),										// Get departement list for options list
			wilayas_old : static_datas.getAllWilayasOld(),											// Get old wilaya list for options list
			wilayas_actual : static_datas.getAllWilayasActual()										// Get new wilaya list for options list
		};
		
		res.render('admin/document/add', locals);
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Return a page fragment to add a location to the document
	 *				Index parameter is used to add indentifier to the block.
	 */
	app.get('/admin/documents/location/add/:index', [requireAdminRights], function(req, res, next){
		var locals = {
			layout : false,												// Disable the layout, just return the fragment of html code wihout html, head, body, etc.
			index : req.params.index,									// Get the index parameter
			departements : static_datas.getAllDepartements(),			// Get departement list for options list
			wilayas_old : static_datas.getAllWilayasOld(),				// Get old wilaya list for options list
			wilayas_actual : static_datas.getAllWilayasActual()			// Get new wilaya list for options list
		};
		res.render('admin/document/parts/location_add', locals);		// Render the template with location form using the index parameter
	});


	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Return a page fragment to add a media to the document
	 *				Index parameter is used to add indentifier to the block.
	 */
	app.get('/admin/documents/media/add/:index', [requireAdminRights], function(req, res, next){
		var locals = {
			layout : false,												// Disable the layout, just return the fragment of html code wihout html, head, body, etc.
			index : req.params.index									// Get the index parameter
		};
		res.render('admin/document/parts/media_add', locals);			// Render the template with media form using the index parameter
	});


	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Display the page to edit an existing document
	 */
	app.get('/admin/documents/:id/edit', [requireAdminRights], function(req, res, next){ 		
		var locals = {
			admin: true																							// Define the page as an admin page
		};

		async.parallel({																						// Get all asynchronous data
				document: function(callback){
					app.Models.Document.findById(req.params.id, callback);										// Get document information. The document is identified by his id given has parameter
				}
			},
			function(err, results){																				// Callback launch after all asynchronous request are done
				if (!err){					
					locals.document = formatDocumentForTemplate(results.document);								// Get document information. The result is modified by formatDocumentForTemplate to handle tags, people and dates
					locals.departements = static_datas.getAllDepartements();									// Get departement list for options list
					locals.wilayas_old = static_datas.getAllWilayasOld();										// Get old wilaya list for options list
					locals.wilayas_actual = static_datas.getAllWilayasActual();									// Get new wilaya list for options list
					locals.page_title = app.Models.Default_locals.pre_title + " : " + locals.document.title;	// Define page title
					res.render('admin/document/edit', locals);													// Display the edit document page
				}
				else {
					console.log("Error while loading data before rendering /admin/document/:id/edit");			// If an error happened while getting document information, log it 
					next(err);																					// And delegate error handling
				}
			}
		);
	});


	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Handle form submit while editing a document
	 */
	app.post('/admin/documents/:id/edit', [requireAdminRights], function(req, res, next){ 		
		async.parallel({																						// Get all asynchronous data
				document: function(callback){
					app.Models.Document.findById(req.params.id, callback);										// Get document data idenfified by his id
				}
			},
			function(err, results){																				// Callback launch after all asynchronous request are done
				if (!err){					
					var document = results.document;															// Store old document

					if (req.body.submit == "Supprimer"){														// If a remove has been asked
						var documentID = document.id;															// Get the document id
						document.remove(function(err){															// Delete document in the database
							if (err){																						// If there was an error
								req.flash('error', "Le document : '" + document.title + "' n'a pas pu être supprimé");		// Add a new flash error message
							}
							else {																										// If document has been removed
								wrench.rmdirSyncRecursive(app.path_public + "/medias/" + documentID, function(err){						// Let's remove the media directory of the document
									if (err){																							// If there was an error
										console.log("Le répertoire médias du document : " + documentID + "n'a pas pu être supprimé");	// Log the error
										console.log(e);	
									}											
								});
							}
						});
						res.redirect('/admin/documents/');														// Redirect the user to the document list
					}
					else {
						updateDocument(req, document, function(err, document){ 									// Call update document, to check for error, update document and define the right status document
							if (!err){																			// If there was no error during document update
								document.save(function(err){ 													// Save the document to the database
									if(err){																	// If an error while saving the document
										console.log("Erreur lors de l'enregistrement du document :");			// Log the error
										console.log(err);
										req.flash('error', "Une erreur est survenue lors de l'enregistrement du document. Veuillez nous en excuser");	// Add a new flash to inform the document wasn't saved
										res.redirect('/admin/documents/');										// Redirect the user to the document list
									}
									else {
										googlemapxml.generateGMapsFile(app);												// Update google maps xml files
										if(document.status == "published"){													// Test if the saved document is a publish one
											console.log("New document publication : " + document.id);						// It is a publish one. Log the document creation
											req.flash('info', "Le document : '" + document.title + "' a été publié");		// Add a new flash info to confirm publication
											res.redirect('/admin/documents/');												// Redirect the user to the document list
										}
										else {
											if (document.status == "invalid"){												// If the document has the status invalid
												res.redirect('/admin/documents/' + document.id + '/edit');					// Redirect the user to the edition page to allow him to make correction
											}
											else if (document.status == "draft"){											// If the document has the status draft
												req.flash('info', "Le document : '" + document.id + "' a été sauvegardé");	// Add a new flash info to confirm save
												res.redirect('/admin/documents/');											// Redirect the user to the document list
											}
										}
									}
								});
							}
							else {
								console.log("Error while updating the document after his edition");		// If an error happened while getting document information
								console.log(err);														// Log the error
								res.redirect('/admin/documents/');										// Redirect the user to the document list
							}
						});	
					}
				}
				else {																					// If and error happened while getting document information
					console.log("Error while getting document information after editing it");			// Log the error
					next(err);																			// Delegate error handling
				}
			}
		);
	});



	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Handle form submit while adding a new document
	 */
	app.post('/admin/documents/add', [requireAdminRights], function(req, res){
		var new_document = new app.Models.Document(); 												// Instantiace a new document model
		updateDocument(req, new_document, function(err, document){ 									// Update the new document with submitted data and control them
			if (!err){																				// If there wasn't any error while updating the document
				document.save(function(err){ 														// Save the document to the database
					if(err){																		// If there was an error while saving the document
						console.log("Erreur lors de l'enregistrement du document :");				// Log the error
						console.log(err);
						req.flash('error', "Une erreur est survenue lors de l'enregistrement du document. Veuillez nous en excuser");	// Add a new flash to inform the user that the document wasn't saved
						res.redirect('/admin/documents/');											// Redirect the user to the document list
					}
					else {
						googlemapxml.generateGMapsFile(app);												// Update google maps xml files
						if(document.status == "published"){													// Test if the saved document is a publish one
							console.log("New document publication : " + document.id);						// It is a publish one. Log the document creation
							req.flash('info', "Le document : '" + document.title + "' a été publié");		// Add a new flash info to confirm publication
							res.redirect('/admin/documents/');												// Redirect the user to the document list
						}
						else {
							if (document.status == "invalid"){												// If the document has the invalid status
								res.redirect('/admin/documents/' + document.id + '/edit');					// Redirect the user to the document editing page to allow him to correct problems
							}
							else if (document.status == "draft"){											// If the document has the draft status
								req.flash('info', "Le document : '" + document.id + "' a été sauvegardé");	// Add a new flash info to confirm save
								res.redirect('/admin/documents/');											// Redirect the user to the document list
							}
						}
					}
				});
			}
			else {																				// If an error happend while updating the document
				console.log("Error while updating the document after submitting a new one");	// Log the error
				console.log(err);
				res.redirect('/admin/documents/');												// Redirect the user to the document list
			}
		});

	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Display an admin page to list all tags and control if there is doubles etc
	 */
	app.get('/admin/tag/list', [requireAdminRights], function(req, res, next){
		var locals = {
			admin: true,																			// Define the page as an admin page
			page_title : app.Models.Default_locals.pre_title + " : Liste des tags disponibles"		// Define the page title
		};

		app.Models.Document.distinct('tags', {}, function(err, tags){								// Get all dinstinct tags saved in the database
			if (err){																				// If and error happened while getting tags
				console.log("Error while getting all distinct tags");								// Log it
				next(err);																			// And delegate error handling
			}
			else {
				locals.tags = tags.sort();															// Save tag list to locals
				res.render('admin/tag/list', locals);												// Render the tag list page
			}
		});
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Display an admin page with all documents with a specified tags
	 */
	app.get('/admin/tag/edit/:tag', [requireAdminRights], function(req, res, next){
		var tag = req.params.tag;																				// Get the tag given as parameter
		var locals = {
			admin: true,																						// Define the page as an admin page
			page_title : app.Models.Default_locals.pre_title + " : Liste des documents ayant le tag : " + tag 	// Define the page title
		};

		app.Models.Document.find({tags: tag}, ['title'], {}, function(err, documents){							// Find all document with the specified tag
			if (err){														// If and error happened while getting documents
				console.log("Error while getting all distinct tags");		// Log it
				next(err);													// And delegate error handling
			}
			else {
				locals.documents = documents;								// Save the document list into locals
				locals.tag = tag;											// Save the tag into locals
				res.render('admin/tag/edit', locals);						// Render the tag edition page
			}
		});
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Display an admin page to list every users
	 */
	app.get('/admin/user/list', [requireAdminRights], function(req, res, next){
		var locals = {
			admin: true,																						// Define the page as an admin page
			page_title : app.Models.Default_locals.pre_title + " : Liste des utilisateurs" 						// Define the page title
		};
		app.Models.User.find({}, [], {sort: {login:1}}, function(err, users){
			if (err){														// If and error happened while getting users
				console.log("Error while getting all users");				// Log it
				next(err);													// And delegate error handling
			}
			else {
				locals.users = users;										// Save the user list into locals
				res.render('admin/user/list', locals);						// Render the user list page
			}
		});
	});


	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Display a user edition page
	 */
	app.get('/admin/user/edit/:login', [requireAdminRights], function(req, res, next){
		var login = req.params.login;
		var locals = {
			admin: true,																						// Define the page as an admin page
			page_title : app.Models.Default_locals.pre_title + " : Edition de l'utilisateur : " + login			// Define the page title
		};
		app.Models.User.findOne({login: login}, function(err, user){
			if (err){														// If and error happened while getting users
				console.log("Error while getting the user");				// Log it
				next(err);													// And delegate error handling
			}
			else {
				locals.user = user;											// Save the user into locals
				res.render('admin/user/edit', locals);						// Render the user edition page
			}
		});
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Update the document with all data that came from the form and that don't need database request
	 */
	function save_synchronous_document_informations(document, form, files){		
		document.modification_date = new Date();									// Save document last modification date
		
		document.title = form.title;												// Save document title, description, etc.
		document.description = form.description;
		document.text = form.text;
		document.doc_author = form.doc_author;
		document.doc_date = utils.getDateFromString(form.doc_date);
		document.doc_language = form.doc_language;

		document.people = [];														// Initilize the people list (stored as an array in the databse)
		if (form.people.length > 0){												// Extract individual names from people field
			var individuals = form.people.split(",");								// Split names separated by ","		
			for (var i = 0, l = individuals.length; i < l; i++){					// Loop on all names
				var indivitual = individuals[i].trim();								// Before saving names, trim string to remove needless spaces
				if (indivitual.length > 0){
					document.people.nonAtomicPush(indivitual);						// Add individual to the document. 
																					// "nonAtomicPush" make the replacement of the people attribute in the attribute. 
																					// With a classic push, it only add the array content to the end of the existing attribute
				}
				
			}	
		}
			
		document.tags = [];															
		if (form.tags.length > 0){													// Extract tags from tags field
			var tags = form.tags.split(",");										// Split tags separated by ","
			for (var i = 0, l = tags.length; i < l; i++){							// Loop on all tags
				var tag = tags[i].trim();											// Before saving tags, trim string to remove needless spaces
				if (tag.length > 0){
					document.tags.nonAtomicPush(tag.toLowerCase());					// Convert the tag to a lowercase string and add if to the document with a nonAtomicPush
				}
				
			}	
		}
		
		document.source = form.source;
		document.origin = form.origin;
		document.type = form.type;

		
		document.dates = [];														// Initiliaze the tag list
		if (form.key_dates.length > 0){												// Extract dates from dates field
			var dates = form.key_dates.split(",");									// Split dates separated by ","
			for (var i = 0, l = dates.length; i < l; i++){
				var date_string = dates[i].trim();									// Before saving dates, trim string to remove needless spaces
				var date = utils.getDateFromString(date_string);					// Concert string dates in a really javascript Date Object
				if (date){			
					document.dates.nonAtomicPush(date);								// Add date to the document
				}
			}	
		}

		// Save locations
		document.locations = [];
		document.locations.splice();
		if (typeof form.location != "undefined"){									// Check if locations were sent
			for (var i = 0, l = form.location.length; i < l; i++){					// Loop on all available locations
				var location = form.location[i];									// Get current location
				if (location != null && typeof location == "object"){				// Check that the location in the array is a valid location (to handle location remove)
					save_new_location(document, location);							// Save current location to the document	
				}
			}
		}
		
		// Save medias
		if (document.medias != null && typeof document.medias != "undefined" 
			&& typeof document.medias == "object" && document.medias.length > 0){ 	// Check if the document has already saved document
			remove_deleted_medias(document, form.medias);							// Remove all already saved document that are not sent anymore
		}

		if (typeof form.medias != "undefined"){										// Check if medias were posted in the form
			for (var i = 0, l = form.medias.length; i < l; i++){					// Loop on all posted medias
				var form_media = form.medias[i];									// Get the current media
				if (form_media != null && typeof form_media == "object"){			// Check the media is a well formed media
					if (form_media.id == ""){										// Check if the form media has an id to check if there is an uploaded file or not
						if (files.medias.length >= i ){								// Check the uploaded files array is not smaller than our media array
							var file = 	files.medias[i].file;						// Get the current media
							update_media(document, form_media, file);				// Save the media
						}	
					}
					else {
						update_media(document, form_media, null);					// This is an update of an existing media, no need to give a file
					}
					
				}
			}
		}
	}

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Update the document with all data that need an asynchronous request to the database
	 */
	function save_asynchronous_document_informations(document, form, save_callback){		
		var async_requests = {};									// List of asynchronous request that has to be made before saving the document
		var async_request_count = 0;								// Count the number of asynchronous request

		if (document.dates && document.dates.length > 0){			// If dates are defined
			async_requests.periods = function(callback){			// Retrieve all periods to add events to the document later
				app.Models.Period.find({}, callback);
			};
			async_request_count++;									// Increase the request counter
		}

		if (async_request_count > 0){													// Check if there is some async request to execute
			async.parallel(async_requests, function(err, callback){ 					// Launch an async request set
				if (!err){																// If there isn't any error
					var periods = callback.periods;										// Get all periods
					var added_periods = [];												// Create an already added periods to avoid double
					document.periods = [];												// Store all document periods

					for (var i = 0, l = callback.periods.length; i < l; i++){			// Loop on every period
						var period = callback.periods[i];								// Get the current period
						var begin_date = period.begin;									// Get the period begin date
						var end_date = period.end;										// Get the period end date

						for (var j = 0, m = document.dates.length; j < m; j++){			// Loop on all document dates
							var date = document.dates[j];								// Get the current date
							if ( (date >= begin_date) && (date <= end_date) ){			// Check if the date is include in the current period
								if (added_periods.indexOf(period.id) < 0){				// Check if the period has been already added
									added_periods.push(period.id);						// Add the period to the already added periods
									document.periods.nonAtomicPush(period);				// If not, add the period in the document with a nonAtomicPush
								}
							}
						}
					}

					save_callback(null, document);					// Execute the callback when all async request are done
				}
				else {					
					save_callback(err, null);						// If an error happened while retrieving the periods, execute call with error parameter
				}			
			});
		}
		else {
			save_callback(null, document);							// No need to execute async request, let's execute the callback
		}
	}

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Add a new location to the document
	 */
	function save_new_location(document, form_location){
		var new_location = {};										// Create a new Location embedded document

		new_location.country = form_location.country;				// Save location attributes
		new_location.town = form_location.town;
		new_location.locality = form_location.locality;
		new_location.wilaya_old = form_location.wilaya_old;
		new_location.wilaya_actual = form_location.wilaya_actual;
		new_location.country = form_location.country;
		new_location.departement = form_location.departement;
		new_location.coordinates = [new Number(form_location.lon), new Number(form_location.lat)];	// Save coordinates. Important : it's longitude first, then latitude
		
		document.locations.nonAtomicPush(new_location);				// Add the new Location to the document with nonAtomicPush
	}


	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Delete all medias that were deleted in the form. It will remove physically the media too.
	 */
	function remove_deleted_medias(document, form_media){		
		var media_ids = [];												// Store all media ids inside return by the form
		if (form_media && typeof form_media != "undefined"){			// Loop on the posted form
			for (var i = 0, l = form_media.length; i < l; i++){
				var media = form_media[i];	
				if (typeof media != "undefined"){
					media_ids.push(media.id);							// Add media id to the array	
				}
			}
		}	

		// Now we have all existing ids in the form. Let's get all existing media inside the document 
		// and remove media that were not submitted in the form.

		var medias_ids_to_remove = [];												// Store the list of media ids to remove

		if (document.medias && typeof document.medias != "undefined"){				// Loop on all media stored inside the saved document
			for (var i = 0, l = document.medias.length; i < l; i++){	
				var media = document.medias[i];										// Get the current media
				var current_media_id = media.id;
				if (media_ids.indexOf("" + current_media_id) < 0){					// If the media id does not exist inside the posted form					
					try {
						fs.unlinkSync(app.path_public + media.file);				// Remove physically the media file
						medias_ids_to_remove.push(current_media_id);				// Add the id to the list of media to remove
					}
					catch (e){
						console.log("Supression du média impossible : " + current_media_id);	// If an error happened while deleting the file
						console.log(e);															// Log it and do nothing
					}
				}
			}
		}

		for (var i = 0, l = medias_ids_to_remove.length; i < l; i++){	// Loop on all ids to remove
			var id = medias_ids_to_remove[i];							// Get the current id
			document.medias.id(id).remove();							// Remove the media from the list after having found it by his id			
		}

		return document;												// Return the updated document
	}

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Add or update media into the document
	 */
	function update_media(document, form_media, file){
		if (null == file){															// If the file is null, just update media infos
			for (var i = 0, l = document.medias.length; i < l; i++){				// Loop on all existing media inside the document to update it
				var media = document.medias[i];										
				if (media._id == form_media.id){									// Find the stored media by id
					media.title = form_media.title;									// Update media informations
					media.description = form_media.description;
					media.credits = form_media.credits;
					break;															// The media is updated, no need to continue the loop
				}
			}
		}
		else {																		// There is a media file, this is a new one			
			var new_media = {};														// Create a new media object
			new_media.title = form_media.title;										// Insert media informations
			new_media.description = form_media.description;
			new_media.credits = form_media.credits;

			var tmp_path = file.path;												// Get the temporary path of the uploaded file
			var file_extension = "";
				
			switch(file.mime){														// Depending the mime type, affecte a file extension
				case "image/jpeg":
					file_extension = "jpg";
					new_media.type = "photo";
					break;
				case "image/png":
					file_extension = "png";
					new_media.type = "photo";
					break;
				case "audio/mpeg":
					file_extension = "mp3";
					new_media.type = "audio";
					break;
				case "audio/mp3":
					file_extension = "mp3";
					new_media.type = "audio";
					break;
			}

			if (file_extension != ""){														// Add the document only if it's a supported media type
				var timestamp = new Date().getTime();										// Get the current timestamp
				timestamp += Math.round( 1000 * (1 + Math.random()));						// Add a SALT just because I'm a real maniac to create a unique filename

				var filename = timestamp + "." + file_extension;							// Filename of the moved file
				utils.createMediaDocumentDir(app.path, document._id, function(dir_path){	// Create the document media folder if it doesn't exist
					new_path = dir_path + "/" + filename;									// Generate the new file_path
					new_media.file = new_path.replace(app.path_public, "");					// Store the relative path to the file
					fs.move(tmp_path, new_path, function(err){								// Move the tmp media file to the media document folder
						if (err){															// If an error happened while moving the file
							throw err;														// Throw it
						}
					});	
				});

				document.medias.push(new_media);											// Add the new media to the document
			}
		}
	}

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Before rendering a document, array type attributes must be rendered as a string with comma separated values
	 */
	function formatDocumentForTemplate(document){
		var formatted_dates = [];													// Store formatted key_dates
		for (var i = 0, l = document.dates.length; i < l; i++){						// Loop on every key_dates
			formatted_dates[i] = utils.getStringFromDate(document.dates[i]);		// Format date
		}
		document.joined_key_dates = formatted_dates.join(", ");
		document.formatted_doc_date = utils.getStringFromDate(document.doc_date);	// Format document date

		document.joined_people = document.people.join(", ");						// Transform people list in string
		document.joined_tags = document.tags.join(", ");							// Transform tags list in string

		return document;															// Return updated document
	}

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description After a form submit, it's necessary to validate datas
	 *				An array with all found errors will be returned and display with flash message. If the array is empty, the document is valid !
	 */
	function validateDocument(req){
		var errors = [];
		if (null == req.body.title || "" == req.body.title)										// Title is mandatory
			errors.push("Le champ <strong>Titre</strong> est obligatoire");
		
		if (null == req.body.description || "" == req.body.description)							// Description/Résumé is mandatory
			errors.push("Le champ <strong>Résumé</strong> est obligatoire");

		if (null == req.body.source || "" == req.body.source)									// Source is mandatory
			errors.push("Le champ <strong>Source</strong> est obligatoire");

		if (null == req.body.origin || "" == req.body.origin)									// Origin is mandatory
			errors.push("Le champ <strong>Origine</strong> est obligatoire");

		if (null == req.body.type || "" == req.body.type)										// Type is mandatory
			errors.push("Le champ <strong>Type</strong> est obligatoire");

		if (null == req.body.doc_date || "" == req.body.doc_date){								// Edition date is mandatory
			errors.push("Le champ <strong>Date d'édition</strong> est obligatoire");
		}
		else {
			var date_string = req.body.doc_date.trim();	
			var date = utils.getDateFromString(date_string);									// Edition date must be a valid date
			if (!date)
				errors.push("Le champ <strong>Date d'édition</strong> n'est pas valide");
		}
			
		if (null == req.body.doc_language || "" == req.body.doc_language)						// Doc language is mandatory
			errors.push("Le champ <strong>Langue du document</strong> est obligatoire");

		var oneValidDate = false;																// At least one valid key date must be stored.
		if (req.body.key_dates && req.body.key_dates.length > 0){								// Validate all the key dates			
			var dates = req.body.key_dates.split(",");											// Separate dates inside an array
			for (var i = 0, l = dates.length; i < l; i++){										// Loop on the array
				var date_string = dates[i].trim();												// Trim the date to delete unwanted spaces
				var date = utils.getDateFromString(date_string);								// Control the date
				if (!date){			
					errors.push("Date clée : " + date_string + " invalide");					// If the control returned false, add an error message
				}
				else {
					oneValidDate = true;														// Indicate that a valid key date has been found
				}
			}
		}

		if (!oneValidDate){
			errors.push("Au moins une <strong>date clée</strong> valide doit être renseignée");	// Key date is mandatory
		}

		if (typeof req.body.location != "undefined"){											// Check only if locations were added
			for (var i = 0, l = req.body.location.length; i < l; i++){							// Loop on all available locations
				var location = req.body.location[i];											// Get current location
				if (location != null && typeof location == "object"){							// Check that the location in the array is a valid location (to handle location remove)
					if (location.country == ""){												// Country is mandatory
						errors.push("Pays est obligatoire");
					}
					if (location.town == ""){													// Town is mandatory
						errors.push("Ville est obligatoire");
					}
					if (location.lon == "" || location.lat == "" || isNaN(location.lon) || isNaN(location.lat)){	// Geocoordinates are mandatory
						errors.push("Logitude/Latitude sont obligatoires et doivent être valides");
					}
				}
			}
		}

		if (typeof req.body.medias != "undefined"){												// Check only if media were added
			for (var i = 0, l = req.body.medias.length; i < l; i++){							// Loop on all available medias
				var media = req.body.medias[i];													// Get current media
				if (media != null && typeof media == "object"){									
					if (media.title == ""){														// Title is mandatory
						errors.push("Titre du média est obligatoire");
					}
				}
			}
		}

		return errors;																			// Return the errors array. If it is empty, the document is ready to publish
	}

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Update a document after form submit (add or edit)
	 *				Check data to set the right status
	 *				Update synchronous datas
	 *				Update asynchronous datas
	 */
	function updateDocument(req, document, callback){
		var errors = [];																			// List of validation errors		

		if (req.body.submit == "Publier"){															// The user asked to published the document
			errors = validateDocument(req);															// First validate the submitted document

			if (errors.length > 0){																	// If there is some errors
				console.log("The document publication failed, the document will be saved as invalid : " + document.id);

				for (var i = 0, l = errors.length; i < l; i++){											
					console.log("Form validation failed : " + errors[i]);							// Log form validation error message
					req.flash('error', errors[i]);													// Add all error the flash messages
				}

				document.status = "invalid";														// Set the document status to invalid
			}
			else {
				document.status = "published";														// Validation passed, set the document status to published		
			}
		}
		else if (req.body.submit == "Enregistrer brouillon"){										// The user asked to save the document as draft
			document.status = "draft";																// Set the document status to draft
		}			

		save_synchronous_document_informations(document, req.body, req.files);						// Save all synchronous datas
		save_asynchronous_document_informations(document, req.body, callback);						// Save all synchronous datas (periods)
	}

} // End of exports.init = function(app)


