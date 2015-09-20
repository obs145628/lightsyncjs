/**
 * Add event's functons on, off and trigger to an object
 * @param {object} o
 **/
var useEvents = function(o)
{
	/**
	 * Add an event listener
	 * @param {string} name event's name
	 * @param {function} callback event's listener
	 **/
	o.on = function(name, callback)
	{
		if(typeof this._listeners === "undefined")
			this._listeners = {};
		if(typeof this._listeners[name] === "undefined")
			this._listeners[name] = [];
		this._listeners[name].push(callback);
	};

	/**
	 * Remove event's listener
	 * @param {string} name event's name
	 * @param {function} [callback] If precised, only remove this listener, otherwise remove all listeners of the event
	 **/
	o.off = function(name, callback)
	{
		if(typeof this._listeners[name] === "undefined")
			return;

		if(typeof callback === "undefined")
			this._listeners[name] = [];
		else
		{
			var i = this._listeners[name].indexOf(callback);
			if(i !== -1)
				this._listeners[name].splice(i, 1);
		}
	},

	/**
	 * Trigger an event with the specified parameters
	 * @param {string} name even'ts name
	 * @param {...*} [args] Arguments send to the listeners
	 */
	o.trigger = function(name)
	{
		if(!this._listeners || !this._listeners[name])
			return;
		var listeners = this._listeners[name];
		var args = Array.prototype.slice.call(arguments, 1);
		for(var i = 0; i < listeners.length; ++i)
			listeners[i].apply(this, args);
	};
};
