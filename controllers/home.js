/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @description Home controller : Handle all the application navigation
 */
exports.init = function(app){

	/*
	 * @constant
	 * @description The default page of the application. The user should be redirected to this path if the route is unclear
	 */
	const default_page = "/map/all";

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 * @function
	 * @description Middleware excuted before desplaying the application to check if the a splashscreen should be rendered or the usual application.
	 *				To make the application display a splashscreen instead of the usual screens (maintenance time for example) :
	 *					- define an environnement variable called ALGERIE_SPLASHSCREEN and give it the value of the splashscreen view name
	 *					- create a view in directory "/views/splashscreens/" called with the same name as the value of the ALGERIE_SPLASHSCREEN variable, with .jade at the end
	 *				To allow administrators to view the application, the function test of the user is logged in. If he is, the application don't display the splashscreen
	 */
	function showSplashScreen (req, res, next) {
		if (typeof app.splashscreen == "undefined" || app.splashscreen == null || app.splashscreen == ""){	// If app.splashscreen is undefined, do nothing and go on next route
			next();																							// Go to the next route
		}
		else {																								// If the app.splashscreen has a value
			if (req.session.user) {																			// Check if the user is logged in in administration panel
				next();																						// If user is logged in, show the application as usual
			}
			else {																							// Else
				res.render("splashscreens/" + app.splashscreen, {layout:false}); 							// Display the defined splashscreen	
			}
		}
	}

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 * 
	 * @description Define the default route of the application
	 *				- If the user has a session and a defined redirectTo attribute, let's redirect him to this path
	 *				- Else, redirect him to the default page
	 */
	app.get('/', [showSplashScreen], function(req, res, next){		
		if (typeof req.session != "undefined" 							// Check if the user has a session
				&& typeof req.session.redirectTo != "undefined" 		// Check if in his session he has a defined redirectTo attribtue
				&& req.session.redirectTo != null 
				&& req.session.redirectTo != ""){
			var redirectapth = req.session.redirectTo;					// Store the redirectTo path
			req.session.redirectTo = "";								// Erase the attribute in the user session
			res.redirect(redirectapth);									// Redirect him to the path
		}
		else {															// The user has no session or no defined redirectTo attribute
			res.redirect(default_page);									// Let's redirect him to the default page
		}
	});


	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 * 
	 * @description Define the route to access to the single document page view
	 */
	app.get('/document/:documentId', [showSplashScreen], function(req, res, next){
		var search_criterias = {						// Initialize the search_criterias
			status : 'published',						// Search only for published document
			_id : req.params.documentId					// Search document with the id given as parameter
		};																

		var fields = ["title", "description"];			// Return only title and description. We need it for og:tags (Facebook) meta tags

		app.Models.Document.findOne(search_criterias, fields, {}, function(err, document){		// Find the document
			if (err){																			// If there is an error, documentId is probably wrong
				res.redirect(default_page);														// Redirect the user to the default page
			}
			else {																				// If the document is found
				var locals = {																	// Define the locals to send it to the template
					fb : {
						title : document.title,													// Define the document title
						url : "http://www.memoires-algerie.org/document/" + document.id,		// Define the document url
						description : document.description										// Define the document description
					}					
				};
				displayHome(req, res, locals);			// Display the home page
			}
		});
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 * 
	 * @description Define the route to access to the map
	 */
	app.get('/map/:period', [showSplashScreen], function(req, res, next){
		if (isValidPeriod(req.params.period)){			// Check that the period given as parameter is correct
			var locals = {								// Define the locals to send it to the template
				fb : {
					title : "Mémoires d'Algérie",
					url : "http://www.memoires-algerie.org/map/all",
					description : "50 ans après les accords d'Evian, El Watan et OWNI ouvrent les portes d'un musée numérique réunissant archives personnelles et officielles classifiées."
				}
			};
			displayHome(req, res, locals);				// Display the home page	
		}
		else {											// If the period is not valid
			res.redirect(default_page);					// Redirect the user the default page
		}
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 * 
	 * @description Define the route to the timeline
	 */
	app.get('/timeline/:period/:criteria?/:search_value?', [showSplashScreen], function(req, res, next){
		if (isValidPeriod(req.params.period)){			// Check that the period given as parameter is correct
			var locals = {								// Define the locals to send it to the template
				fb : {
					title : "Mémoires d'Algérie",
					url : "http://www.memoires-algerie.org/map/all",
					description : "50 ans après les accords d'Evian, El Watan et OWNI ouvrent les portes d'un musée numérique réunissant archives personnelles et officielles classifiées."
				}				
			};
			displayHome(req, res, locals);				// Display the home page
		}
		else {											// If the period is not valid
			res.redirect(default_page);					// Redirect the user the default page
		}
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Define the CATCH_ALL route to avoid 404 page. If this route is catched, redirect the user to the default page.
	 * 				WARNING : This route MUST be the last one defined because it catches everything ...
	 */
	app.get('*', [showSplashScreen], function(req, res, next){
		res.redirect(default_page);						// Redirect the user to the default page
	});

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Display the home page
	 */
	function displayHome(req, res, locals){		
		locals.page_title = app.Models.Default_locals.pre_title + " : Accueil",		// Define page title
		app.Models.Period.findAllOrdered(function(err, periods){					// Find all periods to display the timeline	
			if (err){																// If an error happened while find periods, nothing can be done
				next(err);															// Throw the error it will be displayed on the browser
			}
			else {
				locals.periods = periods;											// The the periods into local object
				res.render('home', locals);											// Render the homepage
			}
		});
	}

	/**
	 * @author : James Lafa / Twitter : @jameslafa
	 *
	 * @description Check if the period key exist
	 */
	function isValidPeriod(period){
		var periods = [	"all", "drole_de_guerre", "plongee_dans_guerre", "guerre_totale_asymetrique", 
						"difficile_marche_vers_negociation", "periode_transitoire", "ete_discorde"];	// List all available periods
		
		return (periods.indexOf(period) > -1); // Return true if the period given as parameter exist in the previous list
	}
} // End of exports.init = function(app)


