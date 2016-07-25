var pathPrefix = "/room";

module.exports = function (app, mongoose, board) {
    var Board=board.Board;

    var roomSchema = mongoose.Schema({
        tag: String,
        boardtag: String,
        size: Number,
        tiles: [Number],
        dorosis: [{
            dorosiid: String,
            team: Number,
            flagposition: Number,
            dorosiposition: [Number],
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
                tag:'testRoom',
                boardtag:'testBoard',
                size: board.size,
                tiles: initialTiles,
                dorosis: []
            });
            testRoom.save();
            console.log("room created");
            res.send("room created");
        });
    });
}