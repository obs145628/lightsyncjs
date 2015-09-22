lightSync.init({
	_name: "lightsyncjs-example",
	"lightserver": {},
	"dropbox": {
		key: "gjexnb20idqkshp",
		receiverUrl: "http://localhost:8080/example/auth_receiver.html"
	},
	"googledrive": {
		client_id: "175501597543-sis50cnv45ma7bmbtl5cmu795cemsr4q.apps.googleusercontent.com",
		//client_secret: "..." only needed for cordova
	}
});

var onSignin = function(err)
{
	document.getElementById("coerror").style.display = err ? "block" : "none";
	
	if(err)
		return;

	document.getElementById("user").style.display = "block";
	document.getElementById("signin").style.display = "none";
	document.getElementById("userinfos").innerHTML = lightSync.getUserInfos().name + " (" + lightSync.getServerName() + ")";
	updateSyncTime();
};

var updateSyncTime = function()
{
	var syncTime = lightSync.getLastSyncTime();
	var message;
	if(lightSync.isSyncing())
		message = "(Syncing ...)";
	else
		message = "(Last sync: " + (syncTime === -1 ? "Never" : new Date(syncTime).toString()) + ")";
	document.getElementById("syncstate").innerHTML = message;
};

var notes = lightSync.getCollection("example-notes");
var items = notes.getItems();

window.onload = function()
{
	
	document.getElementById("sync").addEventListener("click", function(e) {
		lightSync.sync(function(err) {
			if(err)
				console.log(err);
			updateSyncTime();
		});
		e.preventDefault();
		updateSyncTime();
	});

	document.getElementById("signout").addEventListener("click", function(e) {
		lightSync.signout();
		document.getElementById("signin").style.display = "block";
		document.getElementById("user").style.display = "none";
		e.preventDefault();
	});

	(["dropbox", "googledrive", "lightserver"]).forEach(function(server) {
		document.getElementById(server).addEventListener("click", function() {
			lightSync.connect(server, onSignin);
		});	
	});

	document.getElementById("addform").addEventListener("submit", function(e) {
		notes.addItem({
			title: document.getElementById("title").value,
			content: document.getElementById("content").value
		});
		document.getElementById("title").value = "";
		document.getElementById("content").value = "";
		e.preventDefault();
	});

	
	var printNotes = function()
	{
		var code = "";
		for(var i = 0; i < items.length; ++i)
		{
			var note = items[i];
			code += "<h1>" + note.title + "</h1>";
			code += "<p>" + note.content + "</p>";
			code += "<p>" + note.date + "</p>";
			code += '<p><a href="#" id="rm' + i + '">Remove</a></p>';
			code += "<hr />";
		}

		if(code === "")
			code = "No Note";
		
		document.getElementById("notes").innerHTML = code;

		var links = document.getElementById("notes").getElementsByTagName("a");
		for(var i = 0; i < links.length; ++i)
		{
			links[i].addEventListener("click", function(e) {
				notes.removeItem(items[parseInt(e.target.id.substr(2))]);
				e.preventDefault();
			});
		}
		
	};

	notes.on("change", printNotes);
	printNotes();
	
	
	var connected = lightSync.isConfigured();

	if(connected)
		onSignin(null);
	else
		document.getElementById("user").style.display = "none";

	document.getElementById("coerror").style.display = "none";
	
};
