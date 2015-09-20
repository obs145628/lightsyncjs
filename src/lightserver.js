var getStoredKey = function()
{
	return ls.get("datadb_key");
};

var setStoredKey = function(key)
{
	ls.set("datadb_key", key);
};

var clearStoredKey = function()
{
	ls.remove("datadb_key");
};

var serverRequest = function(command, callback, options)
{
	if(typeof options === "undefined")
		options = {};
	options.command = command;
	options.key = getStoredKey();
	http.post("/obsdbserver", options, function(err, data) {
		if(err)
			callback(err);
		else if(data.err)
			callback(data.err);
		else if(data.content)
			callback(null, data.content);
		else
			callback(null);
	});
};



var lightServer = {

	init: function() {},

	signin: function(user, pass, callback)
	{
		serverRequest("signin", callback, {
			user: user,
			pass: pass
		});
	},

	signup: function(user, pass, callback)
	{
		serverRequest("signup", callback, {
			user: user,
			pass: pass
		});
	},

	userAvailable: function(user, callback)
	{
		serverRequest("userav", callback, {user: user});
	},

	testKey: function(key, callback)
	{
		serverRequest("testkey", callback);
	},

	getUserInfos: function(callback)
	{
		serverRequest("userinfos", callback);
	},

	readFile: function(path, callback)
	{
		serverRequest("readfile", callback, {path: path});
	},

	writeFile: function(path, content, callback)
	{
		serverRequest("writefile", callback, {
			path: path,
			content: content
		});
	},

	connect: function(callback)
	{
		var key = getStoredKey();
		if(key)
		{
			lightServer.testKey(key, function(err, ok) {
				if(err)
					callback(err);
				else if(!ok)
				{
					callback("invalid key");
					clearStoredKey();
				}
				else
					lightServer.getUserInfos(callback);
			});
		}
		else
		{
			var connectCallback = function(err, key)
			{
				if(err)
					callback(err);
				else
				{
					setStoredKey(key);
					lightServer.getUserInfos(callback);
				}
			};
			
			var user = prompt("LightServer Username (empty if no account)");

			if(user === "")
			{
				user = prompt("New LightServer Username");
				var pass1 = prompt("LightServer Password");
				var pass2 = prompt("Repeat Your password");
				if(pass1 !== pass2)
					callback("passwords don't match");
				else
					lightServer.signup(user, pass1, connectCallback);
			}
			else
			{
				var pass = prompt("LightServer PassWord");
				lightServer.signin(user, pass, connectCallback);
			}
		}
	}
};
