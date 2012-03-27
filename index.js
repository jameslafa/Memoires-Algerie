/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @description Memoires d'Algérie : application bootstrap.
 * 				In production launch : NODE_ENV=production node index.js
 *				In development launch : NODE_ENV=development node index.js
 */
var path = __dirname;											// set app filesystem path

// Include node modules
var express 			= require('express'); 					// http server
var stylus 				= require('stylus'); 					// css parser
var mongoose 			= require('mongoose'); 					// mongodb connector
var inspect 			= require('eyes').inspector();			// Node module to display object nicely in console
var sessionMongoose 	= require("session-mongoose");
//var mongooseAuth 		= require('mongoose-auth');
//var everyauth			= require('mongoose-auth/node_modules/everyauth');
var app;														// express application 


/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @function
 * @description Boot the application and initialize models and controllers
 */
exports.boot = function(){
	app = express.createServer();								// Create express instance server	
	app.splashscreen = process.env.ALGERIE_SPLASHSCREEN;		// Get splashscreen environnement variable to know if a splashscreen should be displayed instead of the application
	bootApplication(app);										// Boot application
	bootModels(app);											// Boot models
	bootControllers(app);										// Boot controllers
	return app;
};

/**
 * @author : James Lafa / Twitter : @jameslafa
 * 
 * @function
 * @description Configure the application, express server depending the environnement (production or development)
 */
function bootApplication(app){
	app.path = path;								// Store in the app the path of the application on the filesystem
	app.path_public = path + '/public';				// Store in the app the path of the public forler. It contains all static ressources

	// **********************************************************
	// Define the application configuration in DEVELOPMENT mode *
	// **********************************************************
	app.configure('development', function(){
		app.use(stylus.middleware({					// Configure stylus
			src: __dirname + '/views', 				// .styl files are located in `/views`
			dest: __dirname + '/public', 			// .styl resources are compiled `/public/css`
			force: true,							// Force Stylus to recompile files
			debug: true,							// Active debug mode
			compile: function (str, path) { 		// optional, but recommended
				return stylus(str)
					.set('filename', 		path)	// Set the filename of the compiled file
					.set('compress', 		false)  // Don't compress the file
					.set('compileDebug', 	true)   // Debug the compilation
					.set('force', 			true)   // Force the recompilation
					.set('debug', 			true)   // Notify when compilation is launched
					.set('linenos', 		true);  // Print .styl line numbers in .css files
			}
		}));
		app.use(express.errorHandler({ 	
			showStack: true, 						// Display stack when an error occured
			dumpExceptions: true 					// Dump the exception when an error occured
		}));
//		everyauth.debug = true;						// Set the everyauth module in debug mode
		app.use(express.logger('dev')); 			// Enable logger in dev mode
		console.log("*** APPLICATION IS LAUNCH IN DEV MODE ***");		
	});

	// *********************************************************
	// Define the application configuration in PRODUCTION mode *
	// *********************************************************
	app.configure('production', function(){
		app.use(stylus.middleware({					// Configure stylus
			src: __dirname + '/views', 				// .styl files are located in `/views`
			dest: __dirname + '/public', 			// .styl resources are compiled `/public/css`
			force: false,							// Don't force stylus to recompile styles on each page show
			debug: false,							// Don't debug stylus compilation
			compile: function (str, path) { 	
				return stylus(str)
					.set('filename', 		path)	// Set the filename of the compiled file
					.set('compress', 		true)	// Compress the css for production
					.set('compileDebug', 	false)	// Don't debug the compilation
					.set('force', 			false)  // Don't force the recompilation
					.set('debug', 			false)  // Don't debug the compilation launch
					.set('linenos', 		false); // Don't print .styl line numbers in .css files
			}
		}));
		app.use(express.errorHandler({ 								
			showStack: false, 						// Don't display stack when an error occured
			dumpExceptions: false 					// Don't dump the exception when an error occured
		}));
//		everyauth.debug = false;					// Disable the everyauth debug mode 
		app.use(express.logger('short')); 			// Enable logger in short mode
		console.log("*** APPLICATION IS LAUNCH IN PRODUCTION MODE ***");		
	});

	// *********************************************
	// Define the GLOBAL application configuration *
	// *********************************************
	app.configure(function () {					
		app.set('view engine', 'jade'); 							// Define jade as default template engine	
		app.set('views', path + '/views'); 							// Define views directory	
		app.use(express.static(app.path_public)); 					// Define public directory with static files	
		app.use(express.bodyParser()); 								// Enable bodyParser middleware for express
		app.use(express.cookieParser()); 							// Enable cookieParser middleware for express		
		app.dynamicHelpers({messages:require('express-messages')});	// Activate express Messages
		
		var mongooseSessionStore = new sessionMongoose({			// Enable session store in mongoose
			url: "mongodb://localhost/session",						// Connection to session database on mongoose
			interval: 60000											// Interval validation in millisec
		});	

		app.use(express.session({									// Enable express session middleware
			store: mongooseSessionStore,							// Define the mongoose store to handle session
			secret: 'elwatan&owni'									// Set the secury key for hashing session keys
		}));
	});
	
	app.error(function(err, req, res, next){						// Define an error handler to catch error thrown 
		console.log("** Error intercepted : ");						// Log that an error has been intercepted
		console.log(err);											// Log the error in console
		res.render('errors/500', {									// Render a page to display the the error stack
			page_title : app.Models.Default_locals.pre_title + " : An error happened !",
			error: err.stack 										// Set the error stack to display it on the page
		});
	});
}

/**
 * @author : James Lafa / Twitter : @jameslafa
 * 
 * @function
 * @description Boot model : define all schemas and models and store it in the application
 */
function bootModels(app){
	app.Models = {};												// Store all defined models in the application to access to them from anywhere in the app
	app.Models.Default_locals = {									// Store default variable
		pre_title : "Mémoires d'Algérie"							// Store application title used in every page
	}

	var models = require(path + '/models/models.js');				// Include models definition
	
	models.init(app, mongoose);										// Initialize Mongoose models definition		

	app.mongoose = mongoose.connect('mongodb://localhost/algerie', function(err){ 	// Connect the application to the database
		if (err){																	// If an error is sent while connecting
			throw err;																// Throw the error
		} 
	});
}

/**
 * @author : James Lafa / Twitter : @jameslafa
 * 
 * @function
 * @description Boot model : define all schemas and models and store it in the application
 */
function bootControllers(app){

	var api_controller = require(path + '/controllers/api.js');			// Include api controller
	api_controller.init(app);											// Initialize api controller

	var admin_controller = require(path + '/controllers/admin.js');		// Include document controller
	admin_controller.init(app);											// Initialize document controller	

	var home_controller = require(path + '/controllers/home.js');		// Include home controller
	home_controller.init(app);											// Initialize home controller

	//app.use(mongooseAuth.middleware());									// Enable mongooseAuth middleware to define routes like /auth/facebook automatically
	//mongooseAuth.helpExpress(app);
}


exports.boot().listen(3030);											// Make the server listen port 3030
console.log("Express server %s listening on port %d", express.version, app.address().port);		// Log in the console that the server has started !