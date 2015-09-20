var express = require("express");
var lightServer = require("./lightserver");
var bodyParser = require("body-parser");

var app = express();

app.use(express.static("./"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
lightServer.listen(app);


var server = app.listen(8080, function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Server started. Listening at port %s", port);
});
