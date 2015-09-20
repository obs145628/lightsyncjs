var keysInfos = ls.init("main._keys", {});
var lastSync = ls.init("_last_sync", -1);

var syncRunning = false;
var appPrefix = "lightsync_";

var lisy = {

	/**
	 * Add default prefix to the key if it hasn't any
	 * @param {string} key
	 * @returns {string}
	 */
 	getFullKey: function(key)
	{
		if(key.indexOf(".") === -1)
		   return "main." + key;
		else
			return key;
	},

	onSetItem: function(key, callback)
	{
		lisy.on("set_" + lisy.getFullKey(key), callback);
	},

	onRemoveItem: function(key, callback)
	{
		lisy.on("remove_" + lisy.getFullKey(key), callback);
	},

	onClientSetItem: function(key, callback)
	{
		lisy.on("clientset_" + lisy.getFullKey(key), callback);
	},

	onClientRemoveItem: function(key, callback)
	{
		lisy.on("clientremove_" + lisy.getFullKey(key), callback);
	},

	onServerSetItem: function(key, callback)
	{
		lisy.on("servertset_" + lisy.getFullKey(key), callback);
	},

	onServerRemoveItem: function(key, callback)
	{
		lisy.on("serverremove_" + lisy.getFullKey(key), callback);
	},

	/**
	 * Returns the timestamp in milliseconds of the date of the last synchronosation, or -1 if no synchronisation occured yet
	 * @returns {number}
	 */
	getLastSyncTime: function()
	{
		return lastSync;
	},

	/**
	 * Indicates if the synchronisation is running
	 * @returns {bool}
	 */
	isSyncing: function()
	{
		return syncRunning;
	},

	/**
	 * Inits both lightSync and filesRemote
	 * @params {object} options
	 * @params {string} [options._name=lightsync] prefix added to saved files
	 */
	init: function(options)
	{
		if(options._name)
		{
			appPrefix = options._name + "_";
			delete options._name;
		}
		
		filesRemote.init(options);
	},

	/** Signout from the server and clear all data */
	signout: function()
	{
		ls.clear();
		keysInfos = [];
		lastSync = -1;
		lisy.trigger("clear");
		filesRemote.signout();
	},

	/**
	 * Try synchronising local storage with the server
	 * @param {lisy~syncCb} callback
	 */
	sync: function(callback)
	{
		if(syncRunning)
		{
			callback("already syncing");
			return;
		}

		syncRunning = true;

		filesRemote.readFile(appPrefix +  "main", function(err, data) {
			var serverMain = null;
			if(err)
			{
				if(err.status === 404)
				{
					serverMain = {
						_keys: {}
					};
				}
				else
				{
					syncRunning = false;
					callback(err);
					return;
				}
			}
			else
				serverMain = JSON.parse(data);


			var serverKeys = serverMain._keys;

			var serverSet = [];
			var serverRm  = [];
			var clientSet = [];
			var clientRm = [];

			for(var key in keysInfos)
			{
				var clientKey = keysInfos[key];
				var serverKey = serverKeys[key];
				if(clientKey[1] && serverKey && serverKey[1])
				{
					if(clientKey[0] > serverKey[0])
						serverSet.push(key);
					else if(clientKey[0] < serverKey[0])
						clientSet.push(key);
				}

				else if(clientKey[1] && (!serverKey || !serverKey[1]))
				{
					if(!serverKey || clientKey[0] > serverKey[0])
						serverSet.push(key);
					else
						clientRm.push(key);
				}

				else if(!clientKey[1] && serverKey && serverKey[1])
				{
					if(clientKey[0] > serverKey[0])
						serverRm.push(key);
					else
						clientSet.push(key);
				}
			}
			

			for(var key in serverKeys)
				if(!keysInfos[key] && serverKeys[key][1])
					clientSet.push(key);

			var toFileRep = function(data)
			{
				var o = {};
				for(var i = 0; i < data.length; ++i)
				{
					var key = data[i];
					var dotI = key.indexOf(".");
					var file = key.substr(0, dotI);
					if(typeof o[file] === "undefined")
						o[file] = [];
					o[file].push(key.substr(dotI+1));
				}
				return o;
			};

			for(var i = 0; i < serverSet.length; ++i)
				serverKeys[serverSet[i]] = keysInfos[serverSet[i]];
			for(var i = 0; i < serverRm.length; ++i)
				serverKeys[serverRm[i]] = keysInfos[serverRm[i]];
			

			var fClientSet = toFileRep(clientSet);
			var fClientRm = toFileRep(clientRm);
			var fServerSet = toFileRep(serverSet);
			var fServerRm = toFileRep(serverRm);

			var readFiles = [];
			for(var file in fClientSet)
				if(file !== "main" && readFiles.indexOf(file) === -1)
					readFiles.push(file);
			for(var file in fServerSet)
				if(file !== "main" && readFiles.indexOf(file) === -1)
					readFiles.push(file);
			for(var file in fServerRm)
				if(file !== "main" && readFiles.indexOf(file) === -1)
					readFiles.push(file);

			var readData = {};
			readData.main = serverMain;
			
			var readCallback = function()
			{
				var writeFiles = [];

				for(var file in fServerSet)
				{
					if(file !== "main" && writeFiles.indexOf(file) === -1)
						writeFiles.push(file);
					var keys = fServerSet[file];
					
					for(var i = 0; i < keys.length; ++i)
						readData[file][keys[i]] = ls.get(file + "." + keys[i]);
				}

				for(var file in fServerRm)
				{
					if(file !== "main" && writeFiles.indexOf(file) === -1)
						writeFiles.push(file);
					var keys = fServerRm[file];
					for(var i = 0; i < keys.length; ++i)
						delete readData[file][keys[i]];
				}

				var writeCallback = function()
				{
					for(var file in fClientSet)
					{
						var keys = fClientSet[file];
						for(var i = 0; i < keys.length; ++i)
						{
							var key = file + "." + keys[i];
							ls.set(key, readData[file][keys[i]]);
							lisy.trigger("serverset_" + key);
							lisy.trigger("serversetAny", key);
							lisy.trigger("set_" + key);
							lisy.trigger("setAny", key);
						}
					}

					for(var file in fClientRm)
					{
						var keys = fClientRm[file];
						for(var i = 0; i < keys.length; ++i)
						{
							var key = file + "." + keys[i];
							ls.remove(key);
							lisy.trigger("serverremove_" + key);
							lisy.trigger("serverremoveAny", key);
							lisy.trigger("remove_" + key);
							lisy.trigger("removeAny", key);
						}
					}

					keysInfos = serverKeys;
					ls.set("main._keys", keysInfos);
					syncRunning = false;
					var time = new Date().getTime();
					ls.set("_last_sync", time);
					lastSync = time;
					callback();
				};

				var writeMain = function()
				{
					filesRemote.writeFile(appPrefix + "main", JSON.stringify(readData.main), function(err) {
						if(err)
						{
							syncRunning = false;
							callback(err);
						}
						else
							writeCallback();
					});
				};

				if(!serverSet.length && !serverRm.length)
					writeCallback();
				else if(!writeFiles.length)
					writeMain();

				var nbWrote = 0;

				for(var i = 0; i < writeFiles.length; ++i)
				{
					filesRemote.writeFile(appPrefix + writeFiles[i], JSON.stringify(readData[writeFiles[i]]), function(err) {
						if(err)
						{
							syncRunning = false;
							callback(err);
						}
						else if(++nbWrote === writeFiles.length)
							writeMain();
					});
				}
				
			};
			
			if(readFiles.length === 0)
				readCallback();

			var nbRead = 0;
			for(var i = 0; i < readFiles.length; ++i)
			{
				(function(i)
				 {
					 filesRemote.readFile(appPrefix + readFiles[i], function(err, data) {
						 if(err)
						 {
							 if(err.status === 404)
								 readData[readFiles[i]] = {};
							 else
							 {
								 syncRunning = false;
								 callback(err);
								 return;
							 }
						 }
						 else
							 readData[readFiles[i]] = JSON.parse(data);

						 if(++nbRead === readFiles.length)
							 readCallback();
					 });
				 })(i);
			}

			
		});
			
	},

	/**
	 * Get item from the local storage
	 * @param {string} key
	 * @return {*}
	 */
	getItem: function(key)
	{
		return ls.get(lisy.getFullKey(key));
	},

	/**
	 * Save item to the local storage
	 * @param {string} key
	 * @param {*} content
	 */
	setItem: function(key, value)
	{
		key = lisy.getFullKey(key);
		ls.set(key, value);
		keysInfos[key] = [new Date().getTime(), true];
		ls.set("main._keys", keysInfos);
		lisy.trigger("clientset_" + key);
		lisy.trigger("clientsetAny", key);
		lisy.trigger("set_" + key);
		lisy.trigger("setAny", key);
	},

	/**
	 * Indicates if the local storage contains an item
	 * @param {string} key
	 * @returns {bool}
	 */
	hasItem: function(key)
	{
		key = lisy.getFullKey(key);
		return keysInfos[key] && keysInfos[key][1];
	},

	/**
	 * Set the value of an item if it isn't in the local storage, and returns it
	 * @param {string} key
	 * @param {*} value
	 * @return {µ}
	 */
	initItem: function(key, value)
	{
		if(lisy.hasItem(key))
			return lisy.getItem(key);
		else
		{
			lisy.setItem(key, value);
			return value;
		}
	},

	/**
	 * Removes item from the local storage
	 * @param {string} key
	 */
	removeItem: function(key)
	{
		if(!lisy.hasItem(key))
			return;
		
		key = lisy.getFullKey(key);
		ls.remove(key);
		keysInfos[key] = [new Date().getTime(), false];
		ls.set("main._keys", keysInfos);
		lisy.trigger("clientremove_" + key);
		lisy.trigger("clientremoveAny", key);
		lisy.trigger("remove_" + key);
		lisy.trigger("removeAny", key);
	},

	/**
	 * Get the modification timestamp in ms of a local storage item
	 * @param {string} key
	 * @returns {number}
	 */
	getModifiedTime: function(key)
	{
		key = lisy.getFullKey(key);
		if(!keysInfos[key] || !keysInfos[key][1])
			return null;
		else
			return keysInfos[key][0];
	},

	/**
	 * Get the list of all keys in the local storage
	 * @returns {string[]}
	 */
	getKeys: function()
	{
		var keys = [];
		for(var key in keysInfos)
			if(keysInfos[key][1])
				keys.push(key);
		return keys;
	}
	
};
useEvents(lisy);

lisy.filesRemote = filesRemote;
lisy.connect = filesRemote.connect;
lisy.getUserInfos = filesRemote.getUserInfos;
lisy.isConfigured = filesRemote.isConfigured;
lisy.isConnected = filesRemote.isConnected;
lisy.getServerName = filesRemote.getServerName;
lisy.addServer = filesRemote.addServer;
lisy.getCollection = getCollection;
