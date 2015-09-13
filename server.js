var express = require("express");

var app = express();
app.use(express.static("tests"));
var server = app.listen(8080, function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Server started. Listening at port %s", port);
});
