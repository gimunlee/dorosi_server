var pathPrefix = "/board";
var moment = require("moment");

var boardSchema;
var Board;
module.exports = function (app, mongoose) {
    boardSchema = mongoose.Schema({
        tag: String,
        size: Number,
        words: [String],
        answers: [String]
    });
    Board = mongoose.model('boards', boardSchema);
    module.exports.Board=Board;

    app.get(pathPrefix + "/testupload", function (req, res) {
        console.log("Request for test board uploading");
        var testBoard = new Board({
            tag: 'testBoard',
            size: 10,
            words: ["항", "아", "비", "장", "보", "피", "닉", "스", "치", "파",
                "호", "스", "레", "젤", "앤", "스", "로", "마", "리", "타",
                "이", "놀", "와", "툼", "르", "하", "턴", "치", "라", "카",
                "던", "타", "룰", "칸", "코", "스", "시", "란", "프", "샌",
                "오", "런", "쿤", "루", "피", "티", "토", "시", "톡", "소",
                "바", "그", "다", "드", "뉴", "시", "시", "론", "드", "이",
                "상", "파", "울", "루", "애", "델", "드", "코", "토", "니",
                "킨", "샤", "사", "틀", "본", "스", "리", "사", "시", "시",
                "나", "트", "발", "메", "밴", "고", "드", "마", "르", "멕",
                "고", "리", "이", "쿠", "카", "라", "마", "이", "도", "에"],
            answers: ["아비장", "샌프란시스코", "로스앤젤레스", "바그다드", "상파울루", "로마", "시드니", "멕시코시티", "시애틀", "리스본", "보스턴", "뉴델리", "오타와", "호놀룰루", "토론토", "마드리드"]
        });
        testBoard.save();
        res.send("test board uploaded");
    });
}