var dropboxClient = null;

var dropboxError = function(err)
{
	if(!err)
		return null;
	return {
		status: err.status,
		responseText: err.responseText
	};
};

var dropboxWrapper = {

	init: function(options)
	{
		dropboxClient = new Dropbox.Client(options);
		if(isCordova)
			dropboxClient.authDriver(new Dropbox.AuthDriver.Cordova());
		else
		{
			dropboxClient.authDriver(new Dropbox.AuthDriver.Popup({
                receiverUrl: options.receiverUrl
            }));
		}
	},

	getUserInfos: function(callback)
	{
		dropboxClient.getAccountInfo(function(err, data) {
			if(err)
				callback(dropboxError(err));
			else
				callback(null, {name: data.name});
		});
	},

	readFile: function(path, callback)
	{
		dropboxClient.readFile(path, function(err, data) {
			callback(dropboxError(err), data);
		});
	},

	writeFile: function(path, content, callback)
	{
		dropboxClient.writeFile(path, content, function(err) {
			callback(dropboxError(err));
		});
	},

	connect: function(callback)
	{
		dropboxClient.authenticate(function(err) {
			if(err)
				callback(dropboxError(err));
			else
				dropboxWrapper.getUserInfos(callback);
		});
	}
	
};
