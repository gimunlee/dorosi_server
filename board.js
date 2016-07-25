var pathPrefix = "/board";
var moment = require("moment");

var boardSchema;
var Board;

var dictionarySchema;
var Dictionary;

module.exports = function (app, mongoose) {
    boardSchema = mongoose.Schema({
        tag: String,
        size: Number,
        words: [String],
        answers: [String]
    });

    dictionarySchema = mongoose.Schema({
        tag: String,
        words: [String]
    });

    Board = mongoose.model('boards', boardSchema);
    module.exports.Board = Board;

    Dictionary = mongoose.model('dictionaries', dictionarySchema);

    var length = 20;

    var directions = [length-1, length, length+1, -1, 1, -length-1, -length, -length+1];
    var directionsX = [-1,0,1,-1,1,-1,0,1];
    var directionsY = [1,1,1,0,0,-1,-1,-1];
    var try_limit = 100;
    var max_words = Math.floor(length * length / 10);
    var words = [];
    var answer = [];
    var answer_full="";

    var word_board = new Array(length * length);

    Dictionary.findOne({ 'tag': "cities" }, function (err, doc) {
        words = doc.words;
        words.sort(function (a, b) {
            return b.length - a.length;
        }); // sorting words
        for (var i = 0; answer.length < max_words && i < try_limit; i++) {
            for (var j = 0; j < words.length; j++) {
                var start, end;
                var path = [];
                var w = words[j];
                if (w == null)
                    continue;

                var end = null;
                while (end == null) {
                    var index=Math.floor(Math.random() * directions.length);
                    dir = directions[index];
                    var dirX=directionsX[index];
                    var dirY=directionsY[index];
                    start = randomRange(0, length * length);
                    var startX = start % length;
                    var startY = Math.floor(start / length);
                    var endX = startX+dirX*(w.length-1);
                    var endY = startY+dirY*(w.length-1);

                    if (endX >= 0 && (endX < length) && endY >= 0 && endY < length) {
                        end = endX + endY * length;
                        break;
                    }
                }
                //console.log('directions [' +   '] = ' + dir + '');
                var p = start;
                var path = [];
                while (p != end) {
                    path.push(p);
                    p += dir;
                }
                path.push(end);

                var i = 0;
                for (i = 0; i < path.length; i++) {
                    if ((word_board[path[i]] != null) && (w.charAt(i) != word_board[path[i]]))
                        break;
                }

                if (i == path.length) { // 문제가 없을 경우 board에 단어를 넣는다. 
                    for (var i = 0; i < path.length; i++)
                        word_board[path[i]] = w.charAt(i);
                    answer.push(w);
                    answer_full += w;
                    //words[j] = null;
                }
            }
        }

        for (var i = 0; i < length * length; i++) {
            if (word_board[i] == undefined)
                word_board[i] = answer_full.charAt(randomRange(0, answer_full.length - 1));
        }

        console.log("finished");
            var logstr = "";
        for (var i = 0; i < length; i++) {
            for (var j = 0; j < length; j++) {
                logstr += word_board[i * length + j];
            }
            logstr+="\n";
        }
            console.log(logstr);
        for(var i=0;i<answer.length;i++) {
            console.log(answer[i]);
        }
        new Board({
            tag: 'cities',
            size: length,
            words: word_board,
            answers: answer
        }).save();
    });


    app.get(pathPrefix + "/testupload", function (req, res) {
        console.log("Request for test board uploading");
        var testBoard = new Board({
            tag: 'testBoard',
            size: 10,
            words: word_board,
            answers: answer
        });
        testBoard.save();
        res.send("test board uploaded");
    });

    /*var Dictionary = mongoose.model('dictionaries', dictionarySchema);
    new Dictionary({
        tag: 'cities',
        words: ["가와사키","가자지구","가지암텝","고베","고이아니아","과룰류스","과야킬","과테말라시티","광저우","광주","교토","구아달라하라","구이양","그랜드래피즈","그린스","글래스고","기자","기타큐슈","나고야","나구푸르","나시크","나이로비","나탈","나폴리","난닝","난양","난창","난충","남경","남안","내쉬빌","노보시비르스크","뉴욕","니즈니노브고로드","닝보","다르에스살람","다바오","다칭","다카","다카르","다퉁","달라스","대구","대련","대전","더반","덴버","델리","도네츠크","도쿄","동관","두바이","두알라","뒤셀도르프","드니프로페트롭스크","디마슈크","디트로이트","또레온","라고스","라바트","라스베이거스","라아나바","라왈핀디","라지코트","라호르","란저우","러크나우","런던","레시페","레온","로마","로사리오","로스앤젤레스","로테르담","롤리","루디아나","루붐바시","루사카","루안다","루이빌","뤄양","리마","리버풀","리스본","리옹","리우데자네이로","리즈","리치몬드","린이","마나우스","마닐라","마두라이","마드리드","마라카이보","마르세유","마세이오","마슈","마이애미","마카사어","마푸토","만하임","맨체스터","메단","멕시코시티","멜버른","멤피스","모가디슈","모술","모스크바","몬테레이","몬테비데오","몬트리올","물탄","뭄바이","뮌헨","미국","미네아폴리스","민스크","밀란","밀워키","바그다드","바도다라","바라나시","바랭퀼라","바르셀로나","바르키시메토","바마코","바오터우","바쿠","반둥","발렌시아","발렌시아","방갈로르","방콕","밴쿠버","버사","버지니아비치","버팔로","베닌시티","베를린","베오그라드","베이루트","베이징","벨로리존테","보고타","보스톤","보팔","복주","본에서","볼고그라드","볼티모어","부다페스트","부바네스와르","부산","부에노스아이레스","부쿠레슈티","브라자빌","브뤼셀","브리즈번","비엔나","비자야와다","비자크하팟남","빅토리아","사나","사마라","사이타마현","산살바도르","산타크루스","산터우","산토도밍고","산토스","산티아고","산후안","살바도르","삿포로","상추","상트페테르부르크","상파울루","상하이","새너제이","새크라멘토","샌디에고","샌안토니오","샌프란시스코","샤오산","샬럿","샹판","서울","선양","선전","세마랑","세부","세비야","세인트루이스","센다이","셰필드","셴양","소주","소피아","솔트레이크시티","수라바야","수랏","쉬라즈","스리","스자좡","스톡홀름","스투트가르트","시드니","시아먼","시안","시애틀","시우다드후아레스","시카고","신시내티","신양","싱가포르","쑤저우","아그라","아다나","아디스아바바","아르리야드","아마다바드","아비장","아산솔","아순시온","아크라","아테네","안바드","안샨","안타나나리보","알라하바드","알렉산드리아","알마티","알허트툼","암리차르","암만","암스테르담","애들레이드","애틀랜타","야운데","양곤","에센","엘자자이르","예레반","옌타이","오란","오사카","오스틴","오카야마","오클라호마시티","오클랜드","오타와","올랜도","옴두르만","와가두구","와쏘우","요코하마","요하네스버그","우루무치","우시","우한","원저우","웨스트요크셔","웨이팡","이란","이스탄불","이즈미르","인도르","인디애나폴리스","인천","자발푸르","자이푸르","자카르타","잠셰드푸르","잭슨빌","전시용","정저우","제남","제다","조양","주하","중산","지린","짜오좡","찬디가르","창사","창춘","천주","천진","청도","청두","첸나이","첼랴빈스크","충칭","카노","카두나","카라치","카라카스","카불","카사블랑카","카오슝","카이로","카토비체","카트만두","칸푸르","캄팔라","캄피나스","캔자스시티","캘거리","케손시티","케이프타운","코나크리","코르도바","코임바토르","코친","코펜하겐","콜럼버스","콜롬보","콜카타","쿠리티바","쿠알라룸푸르","쿠웨이트","쿤밍","퀴토","클리블랜드","키예프","킨샤사","타라불루스","타슈켄트","타오위안","타이난","타이위안","타이중","타이페이","탐파","탕산","토론토","토리노","톨루카","튀니스","트빌리시","티후아나","파나마시티","파리","파트나","팔렘방","퍼스","페샤와르","평양","포르탈레자","포르투","포르투알레그레","포트하코트","포틀랜드","푸네","푸순","푸양","푸에블라데사라고사","프놈펜","프라하","프랑크푸르트","프레스턴","프로비던스","피닉스","피츠버그","필라델피아","하노이","하라레","하르키우","하마","하얼빈","하이데라바드","하이커우","한단","할라브","함부르크","항주","허베이","허저","허페이","헤이그","호치민시","홍콩","화이난","후아레스","후쿠오카","휴스턴","히로시마","힘스"]
    }).save();*/

}

function randomRange(n1, n2) {
    return Math.floor((Math.random() * (n2 - n1)) + n1);
}

function getPath(start, end, puzzle_length, dir) {
    var startx = start[0];
    var starty = start[1];
    var endx = end[0];
    var endy = end[1];
    var stepX = dir[0];
    var stepY = dir[1];

    var x = startx;
    var y = starty;

    var cellList = [];

    while ((x >= 0) && (x < puzzle_length) && (y >= 0) && (y < puzzle_length)) {
        cellList.push([x, y]);
        if ((x == endx) && (y == endy)) {
            return cellList;
        }
        x += stepX;
        y += stepY;
    }

    return null;
}

Array.prototype.remove = function (value) {
    var idx = this.indexOf(value);
    if (idx != -1) {
        return this.splice(idx, 1); // The second parameter is the number of elements to remove.
    }
    return false;
}