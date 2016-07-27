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

    // 143.248.48.232:10240/room/create/?boardtag=cities&roomtag=gimunRoom
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
    // app.get(pathPrefix + "/move", (req, res) => {
    //     console.log("Request for moving dorosi " + req.query.dorosiid);
    //     var delta = [0, 0];
    //     switch (req.query.direction) {
    //         case "left": delta[0] = -1; break;
    //         case "right": delta[0] = 1; break;
    //         case "down": delta[1] = -1; break;
    //         case "up": delta[1] = 1; break;
    //     }
    //     Room.findOne({ "tag": req.query.roomtag }, (err, room) => {
    //         if (room) {
    //             var movingDorosi = null;
    //             _.each(room.dorosis, (dorosi, index) => {
    //                 if (dorosi.dorosiid == req.query.dorosiid)
    //                     movingDorosi = dorosi;
    //             })
    //             if (movingDorosi != null) {
    //                 //Check whether the move is valid.
    //                 var currentPos = movingDorosi.dorosiposition;
    //                 var newPos = currentPos + delta[0] + delta[1] * room.size;
    //                 console.log("-> current position : " + movingDorosi.dorosiposition);
    //                 if (isValidMove(currentPos, delta, room.size) && allDorosiPositions(room.dorosis).indexOf(newPos) == -1) {
    //                     movingDorosi.dorosiposition = newPos;
    //                     movingDorosi.direction = req.query.direction;
    //                     logAndRes(res, "dorosi " + movingDorosi.dorosiid + " starts to move to " + movingDorosi.dorosiposition + ".");
    //                     room.save();
    //                 }
    //                 else
    //                     logAndRes(res, "move from " + currentPos + " to " + req.query.direction + " is invalid");
    //             }
    //             else
    //                 logAndRes(res, "Cannot find dorosi " + req.query.dorosiid);
    //         }
    //         else
    //             logAndRes(res, "No room of tag " + req.query.roomtag);
    //     });
    // });
    // 143.248.48.232:10240/room/flag/?roomtag=gimunRoom&dorosiid=gimunDo5
    // app.get(pathPrefix + "/flag", (req, res) => {
    //     console.log("Request for flag dorosi " + req.query.dorosiid);
    //     Room.findOne({ "tag": req.query.roomtag }, (err, room) => {
    //         if (room) {
    //             var flagDorosi = null;
    //             _.each(room.dorosis, (dorosi, index) => {
    //                 if (dorosi.dorosiid == req.query.dorosiid)
    //                     flagDorosi = dorosi;
    //             });
    //             if (flagDorosi != null) {
    //                 var currentPos = flagDorosi.dorosiposition;
    //                 flagDorosi.flagposition = currentPos;
    //                 room.save();
    //                 logAndRes(res, "Flag on " + flagDorosi.flagposition);
    //             }
    //             else
    //                 logAndRes(res, "Cannot find dorosi " + req.query.dorosiid);
    //         }
    //         else
    //             logAndRes(res, "No room of tag " + req.query.roomtag);
    //     });
    // })

    // var usersockets=[];
    // var userroomtags=[];
    // var userids=[];
    var user = {};
    var idsFromSocket = {};
    io.on("connection", (socket) => {
        console.log("connected");

        var soid = socket.id;
        console.log("soid = " + soid);
        var tweet = { user: "nodesource", text: "Hello," };
        var interval = setInterval(() => {
            // console.log("tweet");
            socket.emit("tweet", tweet);
        }, 60);

        console.log("-> socketid : " + socket.id);

        socket.on("join", (reqString) => {
            console.log("on join event : " + reqString);
            var req = JSON.parse(reqString);
            var dorosiid = req.dorosiid;

            Room.findOne({"tag":req.roomtag},(err,room) => {
                if(room) {
                    var joiningDorosi = null;
                    _.each(room.dorosis,(dorosi,index) => {
                        if(dorosi.dorosiid==dorosiid)
                            joiningDorosi=dorosi;
                    });
                    if(joiningDorosi==null) {
                        var existingDorosiPositions=allDorosiPositions(room.dorosis);
                        var newPos=0;
                        while(existingDorosiPositions.indexOf(newPos)>-1)
                            newPos++;
                        var newDorosi = {
                            dorosiid: dorosiid,
                            team: (dorosiid.charCodeAt(0))%3+1,
                            flagposition: -1,
                            dorosiposition: newPos,
                            direction: "right"
                        };
                        room.dorosis.push(newDorosi);
                        joiningDorosi=newDorosi;
                        room.save();
                    }
                    user[dorosiid]={"roomtag":req.roomtag,"dorosiid":dorosiid,"team":joiningDorosi.team,"socket":socket.id,"updated":false};
                    idsFromSocket[socket.id] = dorosiid;
                    console.log("-> socketid : " + socket.id);

                    console.log("emit board data");
                    Board.findOne({"tag":room.boardtag},(err, board) => {
                        if(board)
                            io.to(user[dorosiid].socket).emit("load",board);
                        else
                            console.log("== No board of tag " + room.boardtag);
                    });
                }
                else
                    console.log("== No room of tag " + req.roomtag);
            });
        });
        socket.on("load completed", (reqString) => {
            console.log("on load completed :");
            var req = JSON.parse(reqString);
            //send first room info.
            Room.findOne({ "tag": user[req.dorosiid].roomtag }, (err, room) => {
                console.log("emit first updateboard");
                console.log(JSON.stringify(room));
                io.to(user[req.dorosiid].socket).emit("updateboard", room);
            });
        })
        socket.on("update success", (reqString2) => {
            // console.log("on update success : " + reqString2);
            var req2 = JSON.parse(reqString2);
            user[req2.dorosiid].updated = true;
            // console.log("-> from " + req2.dorosiid);
            // console.log("-> user info : " + user[req2.dorosiid]);
            // console.log("-> users : " + JSON.stringify(user));
            Room.findOne({ "tag": req2.roomtag }, (err, room2) => {
                // console.log("emit");
                io.to(user[req2.dorosiid].socket).emit("updateboard", room2);
            })
            // socket.emit("updateboard",room)
        });
        socket.on("update failed", (reqString3) => {
            console.log("on update failed : " + reqString3);
            var req3 = JSON.parse(reqString3);
            user[req3.dorosiid].updated = true;
            console.log("-> from " + req3.dorosiid);
            // console.log("-> user info : " + user[req3.dorosiid]);
            console.log("-> users : " + JSON.stringify(user));

            console.log("-> error : " + req3.error);

            Room.findOne({ "tag": req3.roomtag }, (err, room3) => {
                // console.log("emit");
                io.to(user[req3.dorosiid].socket).emit("updateboard", room3);
            })
        });

        socket.on("move", (reqString4) => {
            console.log("on move : " + reqString4);
            var req4 = JSON.parse(reqString4);
            Room.findOne({ "tag": req4.roomtag }, (err, room4) => {
                if (room4) {
                    var delta = [0, 0];
                    switch (req4.direction) {
                        case "left": delta[0] = -1; break;
                        case "right": delta[0] = 1; break;
                        case "down": delta[1] = -1; break;
                        case "up": delta[1] = 1; break;
                    }
                    var movingDorosi = null;
                    _.each(room4.dorosis, (dorosi, index) => {
                        if (dorosi.dorosiid == req4.dorosiid)
                            movingDorosi = dorosi;
                    });
                    if (movingDorosi != null) {
                        var currentPos = movingDorosi.dorosiposition;
                        var newPos = currentPos + delta[0] + delta[1] * room4.size;
                        console.log("-> current Position : " + movingDorosi.dorosiposition);
                        if (isValidMove(currentPos, delta, room4.size) && allDorosiPositions(room4.dorosis).indexOf(newPos) == -1) {
                            movingDorosi.dorosiposition = newPos;
                            movingDorosi.direction = req4.direction;
                            console.log("-> dorosi " + movingDorosi.dorosiid + " starts to move to " + movingDorosi.dorosiposition);
                            room4.save();
                        }
                    }
                    else
                        console.log("-> " + req4.dorosiid + " is not found.");
                }
                else
                    console.log("-> room " + req4.roomtag + " is not found.");
            })
        });
        socket.on("flag", (reqString5) => {
            console.log("on flag : " + reqString5);
            var req5 = JSON.parse(reqString5);
            Room.findOne({ "tag": req5.roomtag }, (err, room5) => {
                if (room5) {
                    Board.findOne({ "tag": room5.boardtag }, (err, board) => {
                        if (board) {
                            var flagDorosi = null;
                            _.each(room5.dorosis, (dorosi, index) => {
                                if (dorosi.dorosiid == req5.dorosiid)
                                    flagDorosi = dorosi;
                            });
                            if (flagDorosi != null) {
                                var currentPos = flagDorosi.dorosiposition;
                                var flagPos = flagDorosi.flagposition;
                                //Check answer

                                var flagX = flagPos % board.size;
                                var flagY = Math.floor(flagPos / board.size);
                                var currentX = currentPos % board.size;
                                var currentY = Math.floor(currentPos / board.size);

                                function norm(t) {
                                    if(t==0) return 0;
                                    else  return t / Math.abs(t);
                                }
                                var deltaX = norm(currentX - flagX);
                                var deltaY = norm(currentY - flagY);
                                console.log("deltaX = " + deltaX + " deltaY = " + deltaY);

                                if ((deltaX * deltaY == 0 || Math.abs(currentX - flagX) == Math.abs(currentY - flagY)) && flagPos != -1) {
                                    var tempAnswer = "";
                                    var tempPos = flagPos;
                                    while (tempPos != currentPos) {
                                        tempAnswer = tempAnswer + board.words[tempPos];
                                        tempPos += deltaX + deltaY * board.size;
                                    }
                                    tempAnswer = tempAnswer +board.words[currentPos];
                                    var answerIndex = board.answers.indexOf(tempAnswer);
                                    if (answerIndex > -1) {
                                        console.log("=================== ANSWER!!");
                                        console.log("team : " + flagDorosi.team);
                                        tempPos = flagPos;
                                        while (tempPos != currentPos) {
                                            // room5.tiles[tempPos] = flagDorosi.team;
                                            console.log("====== tempPos : " + tempPos + "// team : " + flagDorosi.team);
                                            // room5.tiles[tempPos]=1;
                                            room5.tiles.set(tempPos,flagDorosi.team);
                                            tempPos += deltaX + deltaY * board.size;
                                        }
                                        room5.tiles.set(tempPos,flagDorosi.team);
                                        // room5.tiles[currentPos] = flagDorosi.team;

                                    }
                                    console.log("-> tempAnswer = " + tempAnswer);
                                }

                                flagDorosi.flagposition = currentPos;
                                console.log("Flag on " + flagDorosi.flagposition);
                                // console.log("room5.tiles[1] : " + room5.tiles[1]);
                                // room5.tiles[1]=3;
                                // console.log("room5.tiles[1] : " + room5.tiles[1]);
                                room5.save();
                            }
                            else
                                console.log("-> " + req5.dorosiid + " is not found.");
                        }
                        else
                            console.log("-> " + room.boardtag + " is not found.");
                    });
                }
                else
                    console.log("-> room " + req5.roomtag + " is not found.");
            });//////
        })

        socket.on("disconnect", () => {
            // clearInterval(updateBoardInterval);
            var thisUser = user[idsFromSocket[socket.id]];

            Room.findOne({"tag":thisUser.roomtag},(err, room) => {
                var deleteDorosi = null;
                var deleteIndex = -1;
                _.each(room.dorosis,(dorosi, index) => {
                    if(dorosi.dorosiid=thisUser.dorosiid) {
                        deleteDorosi=dorosi;
                        deleteIndex=index;
                    }
                });
                if(deleteDorosi!=null) {
                    room.dorosis.splice(deleteIndex,1);
                    room.save();
                }
                else
                    console.log("dorosi not found");
            });
            delete user[idsFromSocket[socket.id]];
            console.log("disconnected");
        });
    });
}