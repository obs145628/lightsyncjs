lisy.init({
	_name: "tests",
	"lightserver": {},
	"dropbox": {
		key: "npszzfbz3h7jpgw",
		receiverUrl: "http://localhost:8080/tests/auth_receiver.html"
	},
	"googledrive": {
		client_id: "1070338777886-keta04k0adtp04s9269rktt6al294kpb.apps.googleusercontent.com"
	}
});


var onSignin = function(err)
{
	if(err)
	{
		console.log(err);
		return;
	}

	document.getElementById("user").style.display = "block";
	document.getElementById("signin").style.display = "none";
	document.getElementById("userinfos").innerHTML = lisy.getUserInfos().name + " (" + lisy.getServerName() + ")";
	updateSyncTime();
};

var updateSyncTime = function()
{
	var syncTime = lisy.getLastSyncTime();
	var message = syncTime === -1 ? "Never" : new Date(syncTime).toString();
	document.getElementById("syncstate").innerHTML = "(Last sync: " + message + ")";
};

var notes = getCollection("notes-tests");
var items = notes.getItems();

window.onload = function()
{
	
	document.getElementById("sync").addEventListener("click", function(e) {
		lisy.sync(function(err) {
			if(err)
			{
				console.log(err);
				return;
			}

			var keys = lisy.getKeys();
			for(var i = 0; i < keys.length; ++i)
			{
				console.log(keys[i] + " => " + lisy.getItem(keys[i]));
			}

			console.log("synced");
			updateSyncTime();
		});
		e.preventDefault();
	});

	document.getElementById("signout").addEventListener("click", function(e) {
		lisy.signout();
		document.getElementById("signin").style.display = "block";
		document.getElementById("user").style.display = "none";
		e.preventDefault();
	});

	(["dropbox", "googledrive", "lightserver"]).forEach(function(server) {
		document.getElementById(server).addEventListener("click", function() {
			lisy.connect(server, onSignin);
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
	
	
	var connected = lisy.isConfigured();

	if(connected)
		onSignin(null);
	else
		document.getElementById("user").style.display = "none";
	
};
