var collections = {};

var createObject = function(Parent)
{
	if(typeof Object.create !== "undefined")
		return Object.create(Parent);

	var F = function(){};
	F.prototype = Parent;
	return new F();
};

var getId = function()
{
	return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);
	}); 
};

/**
 * LightSync data collection
 * @class
 */
var Collection = {

	/**
	 * Initializes the collection object
	 * @param {string} key The prefix of the keys in the local storage
	 */
	init: function(key)
	{
		this._key = key + "_";
		this._items = [];

		var keys = lisy.getKeys();
		for(var i = 0; i < keys.length; ++i)
		{
			if(keys[i].indexOf(this._key) === 0)
			{
				var id = keys[i].substr(this._key.length);
				var item = lisy.getItem(keys[i]);
				item.id = id;
				item.date = new Date(lisy.getModifiedTime(keys[i]));
				this._items.push(item);
			}
		}

		var self = this;

		lisy.on("serversetAny", function(key) {
			if(key.indexOf(self._key) !== 0)
				return;

			var id = key.substr(self._key.length);
			var item = lisy.getItem(key);
			item.date = new Date(lisy.getModifiedTime(key));
			var i = 0;
			for(; i < self._items.length && self._items[i].id !== id; ++i);

			if(i === self._items.length)
			{
				item.id = id;
				self._items.push(item);
				self.trigger("add", item);
			}
			else
			{
				var oldItem = cloneObject(self._items[i]);
				for(var attr in item)
					self._items[i][attr] = item[attr];
				self.trigger("update_" + item.id, oldItem, item);
				self.trigger("updateAny", oldItem, item);
			}

			self.trigger("change");
		});

		lisy.on("serverremoveAny", function(key) {
			if(key.indexOf(self._key) !== 0)
				return;

			var id = key.substr(self._key.length);
			var i = 0;
			for(; self._items[i].id !== id; ++i);

			var item = self._items[i];
			self._items.splice(i, 1);

			self.trigger("remove_" + item.id, item);
			self.trigger("removeAny", item);
			self.trigger("change");
		});

		lisy.on("clear", function() {
			for(var i = 0; i < self._items.length;)
			{
				var item = self._items[0];
				self._items.splice(0, 1);
				self.trigger("remove_" + item.id, item);
				self.trigger("removeAny", item);
			}
			self.trigger("clear");
			self.trigger("change");
		});
		
	},

	_getDataClone: function(item)
	{
		var dataItem = {};
		for(var key in item)
			if(item.hasOwnProperty(key) && key !== "date" && key !== "id")
				dataItem[key] = item[key];
		return dataItem;
	},

	/**
	 * Returns collection items
	 * @returns {object[]}
	 */
	getItems: function()
	{
		return this._items;
	},

	/**
	 * Remove an item from the collection
	 * @param {object} item
	 */
	removeItem: function(item)
	{
		var i = this._items.indexOf(item);
		if(i !== -1)
		{
			this._items.splice(i, 1);
			lisy.removeItem(this._key + item.id);
			this.trigger("remove_" + item.id, item);
			this.trigger("removeAny", item);
			this.trigger("change");
		}
	},
	
	/**
	 * Add an item to the collection
	 * @param {object} item
	 */
	addItem: function(item)
	{
		var id = getId();
		var key = this._key + id;
		item.id = id;
		item.date = new Date(lisy.getModifiedTime(key));
		this._items.push(item);
		lisy.setItem(key, this._getDataClone(item));
		this.trigger("add", item);
		this.trigger("change");
	},

	/**
	 * Update an item of the collection
	 * @param {object} item The updated item
	 */
	updateItem: function(item)
	{
		var i = this._items.indexOf(item);
		if(i === -1)
			return;

		var oldItem = lisy.getItem(this._key + item.id);
		lisy.setItem(this._key + item.id, this._getDataClone(item));
		this.trigger("update_" + item.id, oldItem, item);
		this.trigger("updateAny", oldItem, item);
		this.trigger("change");
	},
	
	/** remove all items from the collection */
	clear: function()
	{
		for(var i = 0; i < this._items.length;)
			this.removeItem(this._items[0]);
		this.trigger("clear");
	},

	/** Returns the item with the specified id, or null if the id doesn't exists
	 * @param {string} id
	 * returns {object|null}
	 */
	getById: function(id)
	{
		for(var i = 0; i < this._items.length; ++i)
			if(this._items[i].id === id)
				return this._items[i];
		return null;
	},

	onUpdateItem: function(item, callback)
	{
		this.on("updte_" + item.id, callback);
	},

	onRemoveItem: function(item, callback)
	{
		this.on("remove_" + item.id, callback);
	}
	
};
useEvents(Collection);

/**
 * Collection's Factory, creates a Collection object if doesn't exists yet, and returns it
 * @param {string} key
 */
var getCollection = function(key)
{
	key = lisy.getFullKey(key);
	if(typeof collections[key] !== "undefined")
		return collections[key];

	collections[key] = createObject(Collection);
	collections[key].init.apply(collections[key], arguments);
	return collections[key];
};
