var handleXHREvents = function(xhr, callback)
{
	xhr.onreadystatechange = function()
	{
		if(xhr.readyState === 4)
		{
			if(xhr.status === 200)
			{
				var data = xhr.responseText;
				var parsedData = null;
				try
				{
					parsedData  = JSON.parse(data);
				}
				catch(e)
				{
					parsedData = data;
				}
				callback(null, parsedData);
			}
			else
			{
				callback({
					status: xhr.status,
					responseText: xhr.responseText
				});
			}
		}
	};
};

var http = {

	/**
	 * Send an AJAX get request
	 * @param {string} url the request's url
	 * @param {xhrCallback} callback called when the response is ready
	 */
	get: function(url, callback)
	{
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		handleXHREvents(xhr, callback);
		xhr.send();
	},

	/**
	 * Send an AJAX post json request
	 * @param {string} url the request's url
	 * @param {object} params request body send in JSON
	 * @param {xhrCallback} callback called when the response is ready
	 */ 
	post: function(url, params, callback)
	{
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-type", "application/json");
		handleXHREvents(xhr, callback);
		xhr.send(JSON.stringify(params));
	}
	
};

/**
 * Callback for handling xhr response
 * @callback xhrCallback
 * @param {object} err A response error if something went wrong, otherwise null
 * @param {number} err.status
 * @param {string} err.responseText
 * @param {object} data The response body, it's an object if the response is in JSON, otherwise a string
 */
