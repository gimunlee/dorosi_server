var express=require("express");
var app=express();
var body_parser=require("body-parser");
var mongoose=require("mongoose");

mongoose.connect("mongodb://localhost/dorosi");

var db = mongoose.connection;

db.on('error', console.error.bind(console, "connection error:"));

app.use(body_parser.urlencoded({extended:true}));
app.use(body_parser.json());

mongoose.Promise=global.Promise;

db.once('open',function() {
    console.log("mongodb connected");
});

app.get("/",function(req, res) {
    console.log("Hello");
    res.sendfile('./socketclient.html');
});

var port = 10240;
var server = app.listen(10240,function() {
    console.log("Listening " + port);
});
var io = require("socket.io")(server);

var board=require("./board.js");
var room=require("./room.js");
board(app,mongoose);
room(app,mongoose,io,board);
// server.listen(10241);