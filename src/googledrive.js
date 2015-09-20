var gClientId = null;
var gFiles = {};
var gEvents = [];

var triggerGLoad = function(err)
{
	for(var i = 0; i < gEvents.length; ++i)
		gEvents[i](err);
};

var gapiTest = setInterval(function() {
	if(gapi.auth)
	{
		clearInterval(gapiTest);
		triggerGLoad(null);
	}
}, 100);

var onGapiLoad = function(callback)
{
	if(gapi.auth)
		callback(null);
	else
		gEvents.push(callback);
};

var gConnect = function(callback)
{
	onGapiLoad(function(err) {
		if(err)
		{
			callback(err);
			return;
		}
		
		gapi.auth.authorize({
			client_id: gClientId,
			scope: ["https://www.googleapis.com/auth/drive"],
			immediate: true
		}, function(authResult) {
			if(!authResult.error)
			{
				callback(null);
				return;
			}

			gapi.auth.authorize({
				client_id: gClientId,
				scope: ["https://www.googleapis.com/auth/drive"],
				immediate: false
			}, function(authResult) {
				if(authResult.error)
					callback(authResult.error);
				else
					callback(null);
			});
		});
	});
};

var googleDrive = {

	init: function(options)
	{
		gClientId = options.client_id;
	},

	connect: function(callback)
	{
		gConnect(function(err) {
			if(err)
			{
				callback(err);
				return;
			}
				
			gapi.client.load("drive", "v2", function() {
				gapi.client.drive.files.list({}).execute(function(data) {
					if(!data)
					{
						callback("unable to get files list");
						return;
					}

					var items = data.items;
					for(var i = 0; i < items.length; ++i)
						gFiles[items[i].title] = items[i].id;

					gapi.client.drive.about.get().execute(function(data) {
						if(data)
							callback(null, {name: data.name});
						else
							callback("unable to get user infos");
					});
				});
			});
		});
	},

	readFile: function(path, callback)
	{
		if(!gFiles[path])
		{
			callback({status: 404, responseText: "File Not Found"});
			return;
		}

		gapi.client.drive.files.get({"fileId":gFiles[path]}).execute(function(data) {
			if(!data)
			{
				callback({status: 500, responseText: "Internal Server Error"});
				return;
			}
			
			var url = data.downloadUrl;
			var accessToken = gapi.auth.getToken().access_token;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url);
			xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
			xhr.onload = function() {
				callback(null, xhr.responseText);
			};
			xhr.onerror = function() {
				callback({
					status: xhr.status,
					responseText: xhr.responseText
				});
			};
			xhr.send();
		});
	},

	writeFile: function(path, content, callback)
	{
		var boundary = "-------314159265358979323846";
		var delimiter = "\r\n--" + boundary + "\r\n";
		var close_delim = "\r\n--" + boundary + "--";
		var contentType = "text/plain";
		var metadata = {
			"title": path,
			"mimeType": contentType
		};
		
		var multipartRequestBody =
			delimiter +
			'Content-Type: application/json\r\n\r\n' +
			JSON.stringify(metadata) +
			delimiter +
			'Content-Type: ' + contentType + '\r\n' +
			'\r\n' +
			content +
			close_delim;

		var id = gFiles[path];
		var reqPath = "/upload/drive/v2/files";
		if(id)
			reqPath += "/" + id;

		var request = gapi.client.request({
			path: reqPath,
			method: id ? "PUT" : "POST",
			params: {uploadType:"multipart"},
			headers: {"Content-Type": 'multipart/mixed; boundary="' + boundary + '"'},
			body: multipartRequestBody
		});
		
		request.execute(function(data) {
			if(!data)
				callback("unable to write file");
			else
			{
				if(!id)
					gFiles[path] = data.id;
				callback(null);
			}
		});
	}
	
};
