var pathPrefix = "/room";

var _ = require("underscore");

function logAndRes(res, msg) {
    console.log("-> " + msg);
    res.send(msg);
}

module.exports = function (app, mongoose, io, board) {
    var Board = board.Board;

    var roomSchema = mongoose.Schema({
        tag: String,
        boardtag: String,
        size: Number,
        tiles: [Number],
        dorosis: [{
            dorosiid: String,
            team: Number,
            flagposition: Number,
            dorosiposition: Number,
            direction: String
        }]
    });
    var Room = mongoose.model('rooms', roomSchema);

    app.get(pathPrefix + "/testcreate", function (req, res) {
        console.log("Request for creating test room");
        var testBoard = Board.findOne({ "tag": 'testBoard' }, function (err, board) {
            var initialTiles = [];
            for (var i = 0; i < board.size * board.size; i++) {
                initialTiles.push(0);
            }
            initialTiles[8] = 1;
            initialTiles[27] = 2;
            initialTiles[28] = 2;
            initialTiles[29] = 2;

            var testRoom = new Room({
                tag: 'testRoom',
                boardtag: 'testBoard',
                size: board.size,
                tiles: initialTiles,
                dorosis: []
            });
            testRoom.save();
            logAndRes(res, "room created");
        });
    });

    // 143.248.48.232:10240/room/create/?boardtag=testBoard&roomtag=testRoom
    app.get(pathPrefix + "/create", (req, res) => {
        console.log("creating new room");
        var board = Board.findOne({ "tag": req.query.boardtag }, (err, board) => {
            if (board) {
                var initialTiles = [];
                for (var i = 0; i < board.size * board.size; i++)
                    initialTiles.push(0);
                var room = new Room({
                    tag: req.query.roomtag,
                    boardtag: req.query.boardtag,
                    size: board.size,
                    tiles: initialTiles,
                    dorosis: []
                });
                room.save();
                logAndRes(res, "Room " + room.tag + " created with board " + room.boardtag);
            }
            else
                logAndRes(res, "No board of tag " + req.query.boardtag);
        });
    })

    function allDorosiPositions(dorosis) {
        var existingDorosiPositions = [];
        _.each(dorosis, (dorosi, index) => {
            existingDorosiPositions.push(dorosi.dorosiposition);
        });
        return existingDorosiPositions;
    }
    function isValidMove(pos, delta, size) {
        var x = pos % size;
        var y = pos / size;
        return x + delta[0] >= 0 && (x + delta[0] < size) && y + delta[1] >= 0 && y + delta[1] < size;
    }

    // 143.248.48.232:10240/room/join?roomtag=gimunRoom&dorosiid=gimunDo&team=1
    app.get(pathPrefix + "/join", (req, res) => {
        var roomtag = req.query.roomtag;
        console.log("Request for joining of tag " + roomtag);
        var room = Room.findOne({ "tag": roomtag }, (err, room) => {
            if (room) {
                var existingDorosiPositions = allDorosiPositions(room.dorosis);
                var newPosition = 0;
                while (existingDorosiPositions.indexOf(newPosition) > -1)
                    newPosition++;

                var newDorosi = {
                    dorosiid: req.query.dorosiid,
                    team: req.query.team,
                    flagposition: -1,
                    dorosiposition: newPosition,
                    direction: "right"
                };
                room.dorosis.push(newDorosi);
                room.save();
                console.log("-> Dorosiid : " + req.query.dorosiid);
                console.log("-> team : " + req.query.team);
                console.log("-> Joined. Spawned at " + newPosition);
                res.send("joined");
            }
            else
                logAndRes(res, "No room of tag " + roomtag);
        });
    });

    // 143.248.48.232:10240/room/move/?direction=up&roomtag=gimunRoom&dorosiid=gimunDo5
    app.get(pathPrefix + "/move", (req, res) => {
        console.log("Request for moving dorosi " + req.query.dorosiid);
        var delta = [0, 0];
        switch (req.query.direction) {
            case "left": delta[0] = -1; break;
            case "right": delta[0] = 1; break;
            case "down": delta[1] = -1; break;
            case "up": delta[1] = 1; break;
        }
        Room.findOne({ "tag": req.query.roomtag }, (err, room) => {
            if (room) {
                var movingDorosi = null;
                _.each(room.dorosis, (dorosi, index) => {
                    if (dorosi.dorosiid == req.query.dorosiid)
                        movingDorosi = dorosi;
                })
                if (movingDorosi != null) {
                    //Check whether the move is valid.
                    var currentPos = movingDorosi.dorosiposition;
                    var newPos = currentPos + delta[0] + delta[1] * room.size;
                    console.log("-> current position : " + movingDorosi.dorosiposition);
                    if (isValidMove(currentPos, delta, room.size) && allDorosiPositions(room.dorosis).indexOf(newPos)==-1) {
                        movingDorosi.dorosiposition = newPos;
                        movingDorosi.direction = req.query.direction;
                        logAndRes(res, "dorosi " + movingDorosi.dorosiid + " starts to move to " + movingDorosi.dorosiposition + ".");
                        room.save();
                    }
                    else
                        logAndRes(res, "move from " + currentPos + " to " + req.query.direction + " is invalid");
                }
                else
                    logAndRes(res, "Cannot find dorosi " + req.query.dorosiid);
            }
            else
                logAndRes(res, "No room of tag " + req.query.roomtag);
        });
    });
    // 143.248.48.232:10240/room/flag/?roomtag=gimunRoom&dorosiid=gimunDo5
    app.get(pathPrefix + "/flag", (req, res) => {
        console.log("Request for flag dorosi " + req.query.dorosiid);
        Room.findOne({ "tag": req.query.roomtag}, (err, room) => {
            if(room) {
                var flagDorosi = null;
                _.each(room.dorosis, (dorosi, index) => {
                    if(dorosi.dorosiid == req.query.dorosiid)
                        flagDorosi=dorosi;
                });
                if(flagDorosi !=null) {
                    var currentPos = flagDorosi.dorosiposition;
                    flagDorosi.flagposition=currentPos;
                    room.save();
                    logAndRes(res,"Flag on " + flagDorosi.flagposition);
                }
                else
                    logAndRes(res,"Cannot find dorosi " + req.query.dorosiid);
            }
            else
                logAndRes(res, "No room of tag " + req.query.roomtag);
        });
    })

    io.on("connection", (socket) => {
        console.log("connected");
        // var tweet = { user: "nodesource", text: "Hello," };
        // var interval = setInterval(() => {
        //     io.sockets.emit("tweet", tweet);
        // }, 1000);

        socket.on("join", (req) => {
            console.log("Joining of roomtag " + req.roomtag);
            console.log("-> dorosiid = " + dorosiid);
            console.log("-> team : " + team);

            var room = Room.findOne({ "tag": req.roomtag }, (err, room) => {
                if (room) {
                    //find a blank for this dorosi
                    var board = Board.findOne({ "tag": room.boardtag }, (err, room) => {
                    });
                }
                else {
                    console.log("No room of tag " + roomtag);
                    res.writeHead(404);
                    res.end();
                }
            })
        })

        socket.on("disconnect", () => {
            clearInterval(interval);
            console.log("disconnected");
        });
    });
}