var frServers = {};
var connectedServer = ls.init("_fr_co_server", null);
var connectedToServer = false;
var userInfos = ls.init("_fr_user_infos", null);

var connecting = false;
var onConnect = [];
var connectToServer = function(callback, firstCo)
{
	if(connecting)
	{
		onConnect.push(callback);
		return;
	}
	
	if(!connectedServer && !firstCo)
	{
		callback("no server defined");
		return;
	}
	if(connectedToServer)
	{
		callback(null);
		return;
	}

	connecting = true;

	if(!firstCo)
		firstCo = connectedServer;
	
	frServers[firstCo].connect(function(err, data) {
		connecting = false;
		if(err)
			callback(err);
		else
		{
			connectedToServer = true;
			userInfos = data;
			ls.set("_fr_user_infos", data);
			callback(null);
		}
		for(var i = 0; i < onConnect.length; ++i)
			onConnect[i](err);
	});
};


var filesRemote = {

	
	/**
	 * Extends fileRemote by adding a new server helper
	 * @param {string} name server's name
	 * @param {object} server object with server's function
	 */
	addServer: function(name, server)
	{
		frServers[name] = server;
	},

	/**
	 * Initialize servers helpers
	 * @param {object} options Each key is a name of a server, and the value is send to the server's init function
	 */
	init: function(options)
	{
		for(var lib in options)
		{
			frServers[lib].init(options[lib]);
		}
		connectToServer(function(){});
	},

	/**
	 * Try establishing connection with a server
	 * @param {string} serverName
	 * @param {filesRemote~connectCb} callback
	 */
	connect: function(serverName, callback)
	{	
		if(connectedServer)
		{
			callback("already conected");
			return;
		}

		connectToServer(function(err) {
			if(err)
				callback(err);
			else
			{
				connectedServer = serverName;
				ls.set("_fr_co_server", connectedServer);
				callback(null);
			}
		}, serverName);
	},

	/** Sign out from the connected sever */
	signout: function()
	{
		ls.set("_fr_co_server", null);
		connectedServer = null;
		connectedToServer = false;
		ls.set("fr_user_infos", null);
		userInfos = null;
		onConnect = [];
	},

	/**
	 * Indicates if the user has parametred a server
	 * returns {bool}
	 */
	isConfigured: function()
	{
		return !!connectedServer;
	},

	/**
	 * Indicates if a connection is established with a server
	 * @returns {bool}
	 */
	isConnected: function()
	{
		return connectedToServer;
	},

	/**
	 * Returns user informations from the server, or null if the server isn't configured
	 * @returns {object|null}
	 */
	getUserInfos: function()
	{
		return userInfos;
	},

	/**
	 * Returns server name, or null if the server isn't configured
	 * @returns {string|null}
	 */
	getServerName: function()
	{
		return connectedServer; 
	},

	/**
	 * Get a file content from the server
	 * @param {string} path
	 * @param {filesRemote~readFileCb} callback
	 */
	readFile: function(path, callback)
	{
		connectToServer(function(err) {
			if(err)
				callback(err);
			else
				frServers[connectedServer].readFile(path, callback);
		});
	},
	
	/**
	 * Write a file to the server
	 * @param {string} path
	 * @param {string} content
	 * @param {filesRemote~writeFileCb} callback
	 */
	writeFile: function(path, content, callback)
	{
		connectToServer(function(err) {
			if(err)
				callback(err);
			else
				frServers[connectedServer].writeFile(path, content, callback);
		});
	}

	/**
	 * Callback called when the connection response is ready
	 * @callback filesRemote~connectCb
	 * @param {*|null} err An error object if something went wrong, null otherwise
	 */

	/**
	 * Callback called when the read file response is ready
	 * @callback filesRemote~readFileCb
	 * @param {object|null} err An error object if something went wrong, null otherwise
	 * @param {number} err.status
	 * @param {string} err.responseText
	 * @param {string|null} content File content
	 */

	/**
	 * Callback called when the write file response is ready
	 * @callback filesRemote~writeFileCb
	 * @param {*|null} err An error object if something went wrong, null otherwise
	 */

	
	
};

filesRemote.addServer("googledrive", isCordova ? cdvGoogleDrive : googleDrive);
filesRemote.addServer("dropbox", dropboxWrapper);
filesRemote.addServer("lightserver", lightServer);
