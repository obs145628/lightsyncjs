var sha1 = require("sha1");
var fs = require("fs");
var path = require("path");

var accounts = null;
var keys = null;
var saveAccounts = function() { fs.writeFile(path.join(appOptions.dataDir, appOptions.accountsFile), JSON.stringify(accounts), function(){}); };
var saveKeys = function() { fs.writeFile(path.join(appOptions.dataDir, appOptions.keysFile), JSON.stringify(keys), function(){}); };


var appOptions = {

	dataDir: "data",
	accountsFile: "accounts.json",
	keysFile: "keys.json",

	userTest: function(user)
	{
		return user.length >= 1 && user.length <= 48 && /^[a-zA-Z0-9_-]+$/.test(user);
	},
	
	passTest: function(pass)
	{
		return pass.length >= 1 && pass.length <= 48;
	}
	
};

var getKey = function()
{
	return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);
	}); 
};

var getAnswer = function(data)
{
	return {content: data};
};

var getError = function(message)
{
	return {
		err: {
			status: 500,
			responseText: message
		}
	};
};

var getFileError = function(err)
{
	if(err.code === "ENOENT")
	{
		return {
			err: {
				status: 404,
				responseText: "File not found"
			}
		};
	}
	return {
		err: {
			status: 500,
			reponseText: "Interal File Server error"
		}
	};
};

var checkPath = function(user, p)
{
	p = path.normalize(p);
	if(p[0] == "/")
		p = p.substr(1);
	if(path.isAbsolute(p) || p.indexOf("..") !== -1 || p.indexOf("~/") !== -1)
		return null;

	var userPath = path.join(appOptions.dataDir, user);
	p = path.join(userPath, p);
	var relative = path.relative(userPath, p);
	if(relative.indexOf("..") !== -1)
		return null;
	
	return p;
};

var createKey = function(user)
{
	var key = getKey();
	keys.push({
		user: user,
		key: key
	});
	saveKeys();
	return key;
};

var userAvailable = function(user)
{
	for(var i = 0; i < accounts.length; ++i)
		if(accounts[i].user === user)
			return getAnswer(false);
	return getAnswer(true);
};

var createAccount = function(user, pass)
{
	if(!appOptions.userTest(user) || !appOptions.passTest(pass) ||  !userAvailable(user).content)
		return getError("Unable to sign up : invalid credentials");
	accounts.push({
		user: user,
		pass: sha1(pass)
	});
	saveAccounts();
	fs.mkdirSync(path.join(appOptions.dataDir, user));
	return getAnswer(createKey(user));
};

var connect = function(user, pass) {
	var hash = sha1(pass);
	for(var i = 0; i < accounts.length; ++i)
		if(accounts[i].user === user && accounts[i].pass === hash)
			return getAnswer(createKey(user));
	return getError("Unable to sign in : invalid username/password");
};

var signout = function(key) {
	for(var i = 0; i < keys.length; ++i)
	{
		if(key === keys[i].key)
		{
			keys.splice(i, 1);
			saveKeys();
			return getAnswer(null);
		}
	}
	return getError("Unable to signout : invalid key");
};

var getUser = function(key) {
	for(var i = 0; i < keys.length; ++i)
		if(keys[i].key === key)
			return keys[i].user;
	return null;
};

var testKey = function(key)
{
	return getAnswer(!!getUser(key));
};

var getUserInfos = function(key)
{
	var user = getUser(key);
	if(!user)
		return getError("invalid key");
	return getAnswer({name: user});
};

var readFile = function(key, p, callback)
{
	var user = getUser(key);
	if(!user)
	{
		callback(getError("Invalid key"));
		return;
	}

	p = checkPath(user, p);
	if(p === null)
	{
		callback(getError("forbidden path"));
		return;
	}

	fs.readFile(p, function(err, data) {
		if(err)
			callback(getFileError(err));
		else
			callback(getAnswer(data.toString()));
	});
};

var writeFile = function(key, p, content, callback)
{
	var user = getUser(key);
	if(!user)
	{
		callback(getError("Invalid key"));
		return;
	}

	p = checkPath(user, p);
	if(p === null)
	{
		callback(getError("forbidden path"));
		return;
	}

	fs.writeFile(p, content, function(err) {
		if(err)
			callback(getFileError(err));
		else
			callback(getAnswer(null));
	});
};


var handleCommand = function(options, callback)
{
	switch(options.command)
	{
		case "signin":
		callback(connect(options.user, options.pass));
		break;

		case "signup":
		callback(createAccount(options.user, options.pass));
		break;

		case "signout":
		callback(signout(options.key));
		break;

		case "userav":
		callback(userAvailable(options.user));
		break;

		case "testkey":
		callback(testKey(options.key));
		break;

		case "userinfos":
		callback(getUserInfos(options.key));
		break;

		case "readfile":
		readFile(options.key, options.path, callback);
		break;

		case "writefile":
		writeFile(options.key, options.path, options.content, callback);
		break;		

		default:
		callback(getError("Unknown command"));
	};
};

module.exports = {

	config: function(options) {
		for(var option in options)
			appOptions[option] = options[option];
	},
	
	listen: function(app)
	{

		try {
			accounts = JSON.parse(fs.readFileSync(path.join(appOptions.dataDir, appOptions.accountsFile)));
		} catch(e) {
			accounts = [];
		}
		try {
			keys = JSON.parse(fs.readFileSync(path.join(appOptions.dataDir, appOptions.keysFile)));
		} catch(err){ 
			keys = [];
		}
		
		app.post("/obsdbserver", function(req, res) {
			handleCommand(req.body, function(message) {
				res.send(JSON.stringify(message));
			});
		});
	}
};
