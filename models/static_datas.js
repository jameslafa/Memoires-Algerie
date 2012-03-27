/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @description Function to return data that didn't need to be in a database
 */

/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @function
 * @description Return an array of all Algerian department
 */
exports.getAllDepartements = function(){
	return [	"Alger", "Batna", "Bône", "Constantine", "Médéa", 
					"Mostaganem", "Oasis", "Oran", "Orléansville", 
					"Sétif", "Tiaret", "Tlemcen", "Tizi Ouzou", "Saïda", "Saoura"];
}

/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @function
 * @description Return an array of all Algerian wilaya before the war
 */
exports.getAllWilayasOld = function(){
	return [	"Wilaya I (Aurès)", "Wilaya II (Nord-constantinois)", "Wilaya III (Kabylie)", 
				"Wilaya IV (Algérois)", "Wilaya V (Ouest)", "Wilaya VI (Sud)"];
}

/**
 * @author : James Lafa / Twitter : @jameslafa
 *
 * @function
 * @description Return an array of all Algerian wilaya after the war
 */
exports.getAllWilayasActual = function(){
	return [	"Adrar", "Aïn Defla", "Aïn Témouchent", "Alger", "Annaba", "Batna", "Béchar", 
				"Béjaïa", "Biskra", "Blida", "Bordj Bou Arreridj", "Bouira", "Boumerdès", 
				"Chlef", "Constantine", "Djelfa", "El Bayadh", "El Oued", "El Tarf", "Ghardaia", 
				"Guelma", "Illizi", "Jijel", "Khenchela", "Laghouat", "M'Sila", "Mascara", "Médéa", 
				"Mila", "Mostaganem", "Naâma", "Oran", "Ouargla", "Oum El Bouaghi", "Relizane", "Saïda", 
				"Sétif", "Sidi Bel Abbès", "Skikda", "Souk Ahras", "Tamanrasset", "Tébessa", "Tiaret", 
				"Tindouf", "Tipaza", "Tissemsilt", "Tizi Ouzou", "Tlemcen"];
}