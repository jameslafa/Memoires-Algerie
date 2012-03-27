/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @description Function to return data that didn't need to be in a database
 */
var moment 	= require('moment'); 		// Node module to handle dates
var fs 		= require('fs'); 			// Node module to handle file system interactions

/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @function
 * @description Return a Date object created from a String.
 * @param date_string String representation of a date. The format must be YYYY/MM/DD
 * @return Date object if convertion worked, else null
 */
exports.getDateFromString = function(date_string){
	var date_validate_regex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
	if (date_validate_regex.test(date_string)){								// Validate that the string date in well formatted
		var new_date = moment(date_string + "+0000", "DD-MM-YYYY-ZZ");		// Create a javascript String object
		return new_date;													// Return it
	}
	return null;
}

/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @function
 * @description Return a String representation of a Date Object
 * @param date Javascript date object
 * @return A String with format "DD/MM/YYYY"
 */
exports.getStringFromDate = function(date){		
	if (null != date && typeof date == "object"){
		var date_object = new Date(date);							// Create a javascript date object from string
		if (date_object){
			return moment(date_object).format("DD/MM/YYYY");		// Format the date with momentjs
		}	
	}		
	return "";
}

/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @function
 * @description Create the media folder of a document if it doesn't exist
 * @param path The rootdir of the application
 * @param documentId The id of the document. It will be the name of the folder
 * @param callback The function to call after the directory was created
 */
exports.createMediaDocumentDir = function (path, documentId, callback){
	var dir_path = path + "/public/medias/" + documentId;					// Define
	try {
		var stat = fs.statSync(dir_path);
		callback(dir_path);	
	}
	catch(e){
		if (e.code == "ENOENT"){
			try {
				fs.mkdirSync(dir_path);	
				callback(dir_path);
			}
			catch(e){
				callback("");
			}
		}
		else {
			console.log(e);
			callback(dir_path);
		}		
	}
}

/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @function
 * @description Generate a random key used for newsletter
 * @return a string with a random key
 */
exports.randomKeyGenerator = function(){
	var curedate = new Date();
	return curedate.getTime() * Math.pow(2,16) * Math.random();
}

