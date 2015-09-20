/**
 * Shortcut for get/set localStorage items
 * @param {string} key
 * @param {*} [value] If precised the function makes a set, otherwise a get
 * @returns {*|null} Return nothing for a get, or the item value for a set
 */
var ls = function(key, value)
{
	if(typeof value === "undefined")
		return ls.get(key);
	else
		return ls.set(key, value);
};

/**
 * Get localstorage item, using JSON.parse
 * @param {string} key
 * @returns {*}
 */
ls.get = function(key)
{
	return JSON.parse(localStorage.getItem(key));
};

/**
 * Set localstorage item, using JSON.stringify
 * @param{string} key
 * @param {*} value
 */
ls.set = function(key, value)
{
	localStorage.setItem(key, JSON.stringify(value));
};

/**
 * Indicates if an item is present in the local storage
 * @param {string} key
 * @returns {bool}
 */
ls.has = function(key)
{
	return localStorage.getItem(key) !== null;
};

/**
 * Set the value of an item if it isn't on the local storage, and retuns it
 * @param {string} key
 * @param {*} value
 * @returns {*}
 */
ls.init = function(key, value)
{
	if(ls.has(key))
		return ls.get(key);
	else
	{
		ls.set(value);
		return value;
	}
};

/**
 * Remove an item from the local storage
 * @param {string} key
 * @returns {object}
 */
ls.remove = function(key)
{
	localStorage.removeItem(key);
};

/** Remove all items from the local storage */
ls.clear = function()
{
	localStorage.clear();
};
