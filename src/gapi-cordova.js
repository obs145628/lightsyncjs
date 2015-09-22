var cdvGClientId = null;
var cdvGFiles = {};
var cdvclient_secret = null;
var cdvaccess_token = null;

var cdvGConnect = function(callback)
{

	var redirect_uri = "http://localhost/";
	
	var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + $.param({
		client_id: cdvGClientId,
		redirect_uri: redirect_uri,
		response_type: "code",
		scope: "https://www.googleapis.com/auth/drive"
	});
	
	var authWindow = window.open(authUrl, "_blank", "location=no,toolbar=no");

	$(authWindow).on('loadstart', function(e) {
		var url = e.originalEvent.url;
		var code = /\?code=(.+)$/.exec(url);
		var error = /\?error=(.+)$/.exec(url);

		if (code || error)
			authWindow.close();

		if (code)
		{
			$.post('https://accounts.google.com/o/oauth2/token', {
				code: code[1],
				client_id: cdvGClientId,
				client_secret: cdvclient_secret,
				redirect_uri: redirect_uri,
				grant_type: 'authorization_code'
			}).done(function(data)
			{
				cdvaccess_token = data.access_token;
				callback(null);
			}).fail(function(response) {
				callback(response);
			});
		}
		else if (error)
			callback(error);
	});
	
};

var cdvGGetFilesList = function(callback)
{
	var term = null;
	$.ajax({
		url:'https://www.googleapis.com/drive/v2/files?alt=json&access_token='+cdvaccess_token,
		type:'GET',
		data:term,
		dataType:'json',
		error:function(jqXHR,text_status,strError){
			callback(text_status);
		},
		success:function(data)
		{
			callback(null, data);
		}
	});
};

var cdvGGetUserInfos = function(callback)
{
	var term = null;
	$.ajax({
		url:'https://www.googleapis.com/drive/v2/about?alt=json&access_token='+cdvaccess_token,
		type:'GET',
		data:term,
		dataType:'json',
		error:function(jqXHR,text_status,strError){
			callback(text_status);
		},
		success:function(data)
		{
			callback(null, data);
		}
	});
};

var cdvGGetDataProfile = function(callback)
{
	var term = null;
	$.ajax({
		url:'https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token='+cdvaccess_token,
		type:'GET',
		data:term,
		dataType:'json',
		error:function(jqXHR,text_status,strError){
			callback(text_status);
		},
		success:function(data)
		{
			callback(null, data);
		}
	});
};

var cdvGoogleDrive = {

	init: function(options)
	{
		cdvGClientId = options.client_id;
		cdvclient_secret = options.client_secret;
	},

	connect: function(callback)
	{
		cdvGConnect(function(err) {
			if(err)
			{
				callback("Unable to connect with google");
				return;
			}

			cdvGGetFilesList(function(err, data) {
				if(err)
				{
					callback("Unable to get files list");
					return;
				}

				var items = data.items;
				for(var i = 0; i < items.length; ++i)
					cdvGFiles[items[i].title] = items[i].id;

				cdvGGetUserInfos(function(err, data) {
					if(err)
						callback("unable to get user infos");
					else
						callback(null, {name: data.name});
				});		
			});
		});
	},

	readFile: function(path, callback)
	{
		if(!cdvGFiles[path])
		{
			callback({status: 404, responseText: "File Not Found"});
			return;
		}

		var term = null;
		$.ajax({
			url: 'https://www.googleapis.com/drive/v2/files/' + cdvGFiles[path] + '?alt=json&access_token='+cdvaccess_token,
			type:'GET',
			data:term,
			dataType:'json',
			error:function(jqXHR,text_status,strError){
				callback({
					status: jqXHR.status,
					responseText: jqXHR.responseText
				});
			},
			success:function(data)
			{	
				var url = data.downloadUrl;
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url);
				xhr.setRequestHeader('Authorization', 'Bearer ' + cdvaccess_token);
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
			}
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

		var id = cdvGFiles[path];
		var reqPath = "https://www.googleapis.com/upload/drive/v2/files";
		if(id)
			reqPath += "/" + id;

		$.ajax({
			url: reqPath + "?" + $.param({
				alt: "json",
				access_token: cdvaccess_token,
				uploadType: "multipart"
			}),
			method: id ? "PUT" : "POST",
			headers: {"Content-Type": 'multipart/mixed; boundary="' + boundary + '"'},
			data: multipartRequestBody,
			error:function(jqXHR,text_status,strError){
				callback(text_status);
			},
			success:function(data)
			{
				if(!id)
					cdvGFiles[path] = data.id;
				callback(null);
			}
		});
	}
	
};
