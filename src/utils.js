/**
 * Realise a shallow copy of a litteral object
 * @param {object} o
 * @returns {object}
 */
var cloneObject = function(obj)
{
	var clone = {};
	for(var key in obj)
		if(obj.hasOwnProperty(key))
			clone[key] = obj[key];
	return clone;
};


