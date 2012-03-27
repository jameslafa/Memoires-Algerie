/**
 * @author : James Lafa @jameslafa
 *
 * @description Model definition to interact with MongoDB database
 */
var mongooseAuth = require('mongoose-auth');								// Require mongooseAuth module 

/**
 * @author : James Lafa @jameslafa
 * 
 * @function
 * @description Define all schemas and register them in mongoose
 */
exports.init = function(app, mongoose){
	var Schema = mongoose.Schema;
	
	// ***************************
	// Register the Period model *
	// ***************************
	var Period = new Schema({												// Create the Period schema
		begin			: {type: Date, index: true},
		end				: {type: Date, index: true},
		title			: {type: String},
		description		: {type: String},
		color			: {type: String},
		key				: {type: String, index: true}
	});

	
	Period.statics.findAllOrdered = function findAllOrdered(callback){		// Register a static function to Period model to find all periods chronology ordered
		return this.find({}, [], {sort:{'begin':1}}, callback);				// Find all periods and sort them on begin attribute with ascendant order
	};

	mongoose.model('Period', Period);										// Register Period model in mongoose
	app.Models.Period = mongoose.model('Period');							// Store the Period model in the application


	// *****************************
	// Register the Document model *
	// *****************************
	
	var Media = new Schema({																		// Create the Media schema. It will be used as EmbedDocument inside Document model
		type			: {type: String, enum: ["audio", "photo"]},
		title			: {type: String},
		description		: {type: String},
		credits			: {type: String},
		file 			: {type: String}
	});

	var Location = new Schema({																		// Create the Location schema. It will be used as EmbedDocument inside Document model
		country			: {type: String, enum:["", "fr","dz", "ma", "tn", "eg"], index: true},		
		town			: {type: String, index: true},
		locality		: {type: String, index: true},
		wilaya_old		: {type: String, index: true},
		wilaya_actual	: {type: String, index: true},
		departement		: {type: String, index: true},
		coordinates		: {type: Array}																// GPS coordinates must be stored in an array of 2 float in this order : Longitude and Latitude (Respecting this order is mandatory)
	});

	Location.index({coordinates : '2d'}); 															// Index GPS coordonates attributes

	var Document = new Schema({																		// Create the Document schema
		title				: {type: String},
		description			: {type: String},
		text				: {type: String},
		source				: {type: String, lowercase: true , enum:["","militaire","administrative","personnelle"], index: true},
		origin				: {type: String, lowercase: true , enum:["","fr","dz", "ma", "tn", "eg"], index: true},
		type				: {type: String, lowercase: true , enum:["","operation","interrogatoire","renseignement","temoignage"], index: true},
		locations			: {type: [Location]},
		dates				: {type: [Date]},
		periods 			: {type: [Period]},
		people				: {type: [String]},
		doc_author			: {type: String},
		doc_date			: {type: Date},
		doc_language		: {type: String, lowercase: true , enum:["","fr","dz"], index: true},
		tags				: {type: [String], lowercase: true, index: true},
		medias 				: {type: [Media]},
		creation_date		: {type: Date, default: Date.now },
		modification_date 	: {type: Date, default: Date.now },
		status				: {type: String, lowercase: true, enum:["","published", "draft", "submitted", "invalid"], index: true}
	});

	mongoose.model('Document', Document);								// Register Document model in mongoose
	app.Models.Document = mongoose.model('Document');					// Store the Document model in the application


	// *******************************
	// Register the Newsletter model *
	// *******************************
	var Newsletter = new Schema({										// Create the Newsletter schema 
		name 				: {type: String},
		email				: {type: String, unique: true},
		key					: {type: Number, index: true},
		creation_date		: {type: Date, default: Date.now }
	});

	mongoose.model('Newsletter', Newsletter);							// Register Newsletter model in mongoose
	app.Models.Newsletter = mongoose.model('Newsletter');				// Store the Newsletter model in the application


	// *************************
	// Register the User model *
	// *************************

	// The user model is used to
	var User = new Schema({
		login		: {type: String, unique: true},							// Login of the user
		password	: {type: String},										// Encrypted password in blowfish of the user
		name		: {type: String},										// Fullname of the user
		admin 		: {type: Boolean, default:false}						// Admin attribute to know if the user has admin privilege or not
	});

	/*User.plugin(mongooseAuth, { 											// Add need attribute to the schema to handle facebook authentication
		everymodule: {
			everyauth: {
				User: function () {
					return app.Models.User;									// Tell everyauth which model to use
				}
			}
		},
		facebook: {															// Enable facebook module on everyauth
			everyauth: {
				appId : app.Models.Default_locals.facebook.appId,			// Set the Facebook appId
				appSecret : app.Models.Default_locals.facebook.appSecret,	// Set the Facebook appSecret
				redirectPath : '/'											// Return to the "/" path after login
			}
		}
	}); */

	mongoose.model('User', User);											// Register User model in mongoose
	app.Models.User = mongoose.model('User');								// Store the User model in the application
}