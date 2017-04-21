var JXGHWR = {

    strokes: [],
    points: [],
    pointsRaw: [],
    pointCloudsRaw: [],

    strokeID: 0,
    lastDate: 0,
    startDate: 0,
    minTimeDiff: 30,
    minStrokeLength: 5,
    maxDistance: 20,

    types: {
        'D': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
        'Sep': [',', '.'],
        'L': ['x', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'i', 'l', 'n', 'o', 's', 't'],
        'Op': ['+', '-', '*', '/', '^'],
        'K': ['(', ')','|'],
        'Ot': ['sqrt', '='],
        'V': ['x', 'y']
    },

    recognizerP: null,
    recognizerN: null,

    /**
     * Canvas variables
     */

    canvas: null,
    g: null,
    rc: null,
    timeout: null,

    /**
     *
     */

    needsClear: false,
    isDown: false,

    init: function(cv, tb) {

        this.strokes = [];
        this.points = [];
        this.pointsRaw = [];

        this.strokeID = 0;

        this.canvas = cv;
        this.textbox = tb;

        this.initCanvas();

        this.lastDate = new Date();

        this.recognizerP = new JXGHWR_PDollarRecognizer();
        this.recognizerN = new JXGHWR_NDollarRecognizer(true);

        this.readGesturesFromLocalStorage();
    },

    readGesturesFromLocalStorage: function() {
        var pointCloudsRaw, i, le;

        if (localStorage) // otherwise IE 10 complains
            pointCloudsRaw = JSON.parse(localStorage.getItem('JXGPointClouds'));

        if (pointCloudsRaw!=null) {

            this.pointCloudsRaw = pointCloudsRaw;
            for (i = 0; i < pointCloudsRaw.length; ++i) {
                this.recognizerP.AddGesture(
                    pointCloudsRaw[i].Name,
                    this.convertPoints(pointCloudsRaw[i].Points, 'p')
                );

                le = pointCloudsRaw[i].Points.length;
                if (pointCloudsRaw[i].Points[le - 1][2] === 1) {  // unistroke gesture
                    this.recognizerN.AddGesture(
                        pointCloudsRaw[i].Name,
                        true,
                        [this.convertPoints(pointCloudsRaw[i].Points)]
                    );
                }
            }
        }

        for (i = 0; i < this.recognizerP.PointClouds.length; ++i) {
            le = this.recognizerP.PointClouds[i].Points.length;
            this.recognizerP.PointClouds[i].NrStrokes = this.recognizerP.PointClouds[i].Points[le - 1].ID;
        }
    },

    addGestureRaw: function(name, points) {
        this.pointCloudsRaw.push({
            Name: name,
            Points: points.slice(0)
        });
    },

    convertPoints: function(pointsRaw, type) {
        var i, le, points, p;

        points = [];
        le = pointsRaw.length;
        for (i = 0; i < le; ++i) {
            p = {
                X: pointsRaw[i][0],
                Y: pointsRaw[i][1]
            };

            if (type === 'p') {
                p.ID = pointsRaw[i][2] ;
            }
            points.push(p);
        }
        return points;
    },

    convertPointsN: function(pcRaw) {
        var i, pc, le, name, points, p;

        name = pcRaw.Name;
        points = [];
        le = pcRaw.Points.length;
        for (i = 0; i < le; ++i) {
            p = {
                X: pcRaw.Points[i][0],
                Y: pcRaw.Points[i][1]
            };
            points.push(p);
        }
        pc = new this.recognizerN.AddMultistroke(name, true, [points]);

        return pc;
    },

    getBBox: function(stroke) {
        var i, le = stroke.length, bb = [Infinity, Infinity, 0, 0];

        for(i = 0; i < le; i++) {
            bb[0] = (stroke[i].X < bb[0]) ? stroke[i].X : bb[0];
            bb[1] = (stroke[i].Y < bb[1]) ? stroke[i].Y : bb[1];
            bb[2] = (stroke[i].X > bb[2]) ? stroke[i].X : bb[2];
            bb[3] = (stroke[i].Y > bb[3]) ? stroke[i].Y : bb[3];
        }
        return bb;
    },

    getType: function(c) {
        var item, i, le;

        for (item in this.types) {
            le = this.types[item].length;
            for (i = 0; i < le; i++) {
                if (c === this.types[item][i]) {
                    return item;
                }
            }
        }
        return '';
    },

    getStrokeNr: function(stroke) {
        return stroke[stroke.length - 1].ID;
    },

    makeGoodlist: function(c, txt, lastbb, actbb) {
        var list = [], t, last2 = '',
            height = lastbb[3] - lastbb[1];

        if (height > 1) {
            height *= 0.5;
        }

        if (txt.length > 1) {
            last2 = txt.slice(-2);
        }

        t = this.getType(c);
        if (c === '') {
            list = list.concat(['+', '-']);
            list = list.concat(this.types['D']);
            list = list.concat(['(']);
            list = list.concat(this.types['L']);
            list = list.concat(this.types['V']);
            list = list.concat(this.types['Ot']);
        } else if (c !== '(' && c !== '|' && c !== '/' &&
            actbb[3] - actbb[1] < 40 &&
            lastbb[1] + 30 < actbb[1] &&       // if char is roughly in the middle of the previous it is - or  +.
            lastbb[3] - 30 > actbb[3]) {
            list = list.concat(['+', '-']);
        } else if (t === 'V') {
            list = list.concat(this.types['Op']);
            list = list.concat(this.types['K']);
        } else if (t === 'D') {
            list = list.concat(this.types['D']);
            list = list.concat(this.types['V']);
            list = list.concat(['sqrt']);

            if (lastbb[3] + 5 < actbb[3] &&       // char has to be reach slichtly below last char
                lastbb[3] - height < actbb[1]) {  // char may reach at most to the middle of last char
                list = list.concat([',']);
                // Don't allow (e)l.
                list = list.concat(['x', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'i', 'n', 'o', 's', 't']);
            } else {
                list = list.concat(this.types['Op']);
                list = list.concat(this.types['K']);
                list = list.concat(this.types['L']);
            }

        } else if (t === 'Op') {
            list = list.concat(this.types['D']);
            list = list.concat(['(']);
            //list = list.concat(this.types['L']);
            list = list.concat(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'l', 's', 't']);
            list = list.concat(this.types['V']);
            list = list.concat(['sqrt']);
        } else if (c === '(') {
            list = list.concat(this.types['D']);
            list = list.concat(['(']);
            list = list.concat(this.types['L']);
            list = list.concat(this.types['V']);
            list = list.concat(['sqrt']);
        } else if (c === ')') {
            list = list.concat(this.types['Op']);
            list = list.concat(')');

            //list = list.concat(this.types['D']);
            //list = list.concat(this.types['L']);
            //list = list.concat(this.types['V']);

        } else if (last2 === 'si' || last2 === 'ta') {
            list = list.concat(['n']);
        } else if (last2 === 'co') {
            list = list.concat(['s']);
        } else if (last2 === 'lo') {
            list = list.concat(['g']);
        } else if (t === 'L') {
            list = list.concat(this.types['V']);
            list = list.concat(this.types['Op']);
            list = list.concat(this.types['K']);
            if (c === 's') {
                list = list.concat(['i']);        // sin
            } else if (c === 'c') {
                list = list.concat(['o']);        // cos
            } else if (c === 'l') {
                list = list.concat(['o', 'n']);   // log, ln
            } else if (c === 't') {
                list = list.concat(['a']);        // ta
            }
        } else {
            list = list.concat(this.types['D']);
            list = list.concat(this.types['Op']);
            list = list.concat(this.types['K']);
            list = list.concat(this.types['L']);
            list = list.concat(this.types['V']);
            list = list.concat(this.types['Ot']);
        }

        return list;
    },

    /**
     * Sort strokes from left to right
     */
    sortStrokes: function() {
        var that = this;
        this.strokes.sort(function(a,b){
            var bba = that.getBBox(a), bbb = that.getBBox(b);
            return bba[0]-bbb[0];
        });
    },

    /**
     * Collect left-over stroke before starting recognizerP.
     */
    collectStroke: function() {
        if (this.strokeID !== 0) {
            this.startDate = new Date();
            if (this.startDate.getTime() - this.lastDate.getTime() > this.minTimeDiff) {
                // Copy points for dollar p algorithm
                this.strokes.push( this.points.slice(0) );
                this.strokeID = 0;
            }
        }
    },

    /**
     * Combine strokes which intersect each other or which are connected
     * into single strokes.
     */
    recombineStrokes: function() {
        var i, j, sid, le;


        if (this.strokes.length > 1) {
            for (i = 1; i < this.strokes.length; i++) {
                if (this.isConnected(this.strokes[i-1], this.strokes[i]) ||
                    this.isCrossing(this.strokes[i-1], this.strokes[i])) {

                    // Adapt strokeID
                    le = this.strokes[i-1].length;
                    sid = this.strokes[i-1][le-1].ID;

                    le = this.strokes[i].length;
                    for (j = 0; j < le; j++) {
                        this.strokes[i][j].ID += sid;
                    }

                    // Copy stroke from stroke[i] to stroke[i-1]
                    this.strokes[i-1] = this.strokes[i-1].concat( this.strokes[i].slice(0) );
                    this.strokes.splice(i, 1);
                }
            }
        }
    },

    /**
     * Input: last char and two bounding boxes.
     */
    isExponent: function(last, lastbb, actbb) {
        var height = lastbb[3] - lastbb[1];

        if (height > 1) {
            height *= 0.5;
        }

        if (last !== '.'  && last !== ','  && last !== '-'  &&
            //  top of char is slightly above top of last char
            lastbb[1] > actbb[1] + 5 &&
            // bottom of char is above middle height of last char
            lastbb[3] - height > actbb[3]
            ) {

            return true;
        }

        return false;
    },

    /**
     * Input: last bounding box and actual bounding box.
     */
    isEndExponent: function(lastbb, actbb) {
        var height = lastbb[3] - lastbb[1];

        if (height > 1) {
            height *= 2.0/3.0;
        }

        if (
        // bottom of char is below two third of height of last char
            lastbb[3] - height < actbb[1] &&
                lastbb[3] < actbb[3]
            ) {

            return true;
        }

        return false;
    },

    recognize: function() {
        var txt = '',
            result,
            quality = '',
            last = '',
            i, list,
            lastbb = [0,0,0,0], bb,
            expLevel = 0,
            botLine = [],
            sqrtLevel = 0,
            sqrtLine = [],
            sqrtEnd = [],
            st;

        //st = new Date();

        this.collectStroke();
        this.sortStrokes();
        this.recombineStrokes();

        /**
         * Apply $P or $N to every stroke.
         */
        for (i = 0; i < this.strokes.length; i++) {

            // this.paintBBox(this.strokes[i]);
            bb = this.getBBox(this.strokes[i]);


            // Detect end of square roots
            while (sqrtLevel > 0 && bb[2] > sqrtEnd[sqrtLevel]) {
                last = ')';
                txt += last;
                lastbb[3] = sqrtLine[expLevel];
                --sqrtLevel;
            }
            // Detect end of exponent
            while (expLevel > 0 && this.isEndExponent(lastbb, bb)) {
                last = ')';
                txt += last;
                --expLevel;
                lastbb[3] = botLine[expLevel];
            }

            if (this.strokes[i].length >= this.minStrokeLength) {
                // Detect exponents.
                // This is needed before calling makeGoodlist(), because
                // it influences the possible choices for the next symbol.
                if (i>0 && this.isExponent(last, lastbb, bb)) {
                    last = '^';
                    txt += last;
                    last = '(';
                    txt += last;
                    botLine[expLevel] = lastbb[3];
                    ++expLevel;
                }

                list = this.makeGoodlist(last, txt, lastbb, bb);
                this.strokes[i].NrStrokes = this.getStrokeNr(this.strokes[i]);  // Determine number of strokes

                if (this.strokes[i].NrStrokes === 1) {
                    result = this.recognizerN.Recognize([this.strokes[i]], true, false, true, list);
                } else {
                    result = this.recognizerP.Recognize(this.strokes[i], list);
                }

                if (result.Name === '|' && bb[2] - bb[0] > 30) {
                    result.Name = '/';
                }
                quality += result.Score.toFixed(2) + ' ';

            } else {
                // We have a dot.
                // There are three possibilities: ., i, or *
                bb = this.getBBox(this.strokes[i]);
                result = { Name:'' };

                // If last symbol is digit and the dot is close to the baseline, it is a separator
                if (last.match(/\d/) && bb[1] > lastbb[3] - 30 && bb[3] < lastbb[3] + 30) {    // .
                    result.Name = '.';

                    // If the dot is close to the topline the last symbol is an "i"
                } else if (bb[2] < lastbb[2] + 20 &&
                    bb[3] < lastbb[1] && bb[3] < lastbb[3]) {        // i (only backward recognition)
                    result.Name = 'i';
                    txt = txt.slice(0, -1);
                } else {                                                   // *
                    result.Name = '*';
                }
                // lastbb = [0,0,0,0];
                quality += '1.0 ';
            }

            // Handle square root stretches
            if (result.Name === 'sqrt') {
                result.Name += '(';
                ++sqrtLevel;
                sqrtLine[sqrtLevel] = bb[3];
                sqrtEnd[sqrtLevel] = bb[2];
            }

            last = result.Name;
            lastbb = bb.slice(0);
            txt += last;

            /**
             * Post processing. Better do it after each step.
             */
                // Handle '='
            txt = txt.replace(/--/g, '=');
            txt = txt.replace(/-\^-/g, '=');

            // Handle i
            txt = txt.replace(/,\*/g, 'i');
            txt = txt.replace(/\|\*/g, 'i');
            txt = txt.replace(/\(\*/g, 'i');
            txt = txt.replace(/i\*/g, 'i');

            // Handle the case 3.a which is probably 3*a
            txt = txt.replace(/(\d)\.([a-z])/g, '$1*$2');

            // Handle log, sin, cos
            txt = txt.replace(/l0g/g, 'log');
            txt = txt.replace(/\wi\D{1}/g, 'sin');
            txt = txt.replace(/sin\*/g, 'sin');
            txt = txt.replace(/co./g, 'cos');
            txt = txt.replace(/c0s/g, 'cos');
        }

        // Add closing parenthesis for exponents and square roots
        while (expLevel > 0) {
            txt += ')';
            --expLevel;
        }
        while (sqrtLevel > 0) {
            txt += ')';
            --sqrtLevel;
        }

        /**
         * Finalize recognition
         */
        this.strokeID = 0; // signal to begin new gesture on next mouse-down

        //txt += '\ntime:' + ((new Date()).getTime() -  st.getTime());

        return {
            str: txt,
            quality: quality
        };
    },

    /**
     * Euclidean distance between two "D points.
     */
    dist: function(a, b) {
        return Math.sqrt((a.X - b.X) * (a.X - b.X) + (a.Y - b.Y) * (a.Y - b.Y));
    },

    rand: function(low, high) {
        return Math.floor((high - low + 1) * Math.random()) + low;
    },

    /**
     * Detect if two strokes are connected
     */
    isConnected: function(s1, s2) {
        var thresh = this.maxDistance, isC = false;

        if (this.dist(s1[0], s2[0]) <= thresh) {
            isC = true;
        } else if (this.dist(s1[0], s2[s2.length - 1]) <= thresh) {
            isC = true;
        } else if (this.dist(s1[s1.length - 1], s2[0]) <= thresh) {
            isC = true;
        } else if (this.dist(s1[s1.length - 1], s2[s2.length - 1]) <= thresh) {
            isC = true;
        }

        return isC;
    },

    /**
     * Detect if two strokes cross each other,
     */
    isCrossing: function(s1, s2) {
        var i, j, le1 = s1.length, le2 = s2.length, isC = false,
            a1, a2, b1, b2,
            bb1, bb2, c1, c2;

        if (le1 < 2 || le2 < 2) {
            return isC;
        }

        for (i = 1; i < le1; i++) {
            a1 = s1[i - 1];
            a2 = s1[i];
            bb1 = [Math.min(a1.X, a2.X), Math.min(a1.Y, a2.Y),
                Math.max(a1.X, a2.X), Math.max(a1.Y, a2.Y)];

            for (j = 1; j < le2; j++) {
                b1 = s2[j - 1];
                b2 = s2[j];
                bb2 = [Math.min(b1.X, b2.X), Math.min(b1.Y, b2.Y),
                    Math.max(b1.X, b2.X), Math.max(b1.Y, b2.Y)];

                if (bb1[2] >= bb2[0] && bb1[0] <= bb2[2] && bb1[1] <= bb2[3] && bb1[3] >= bb2[1]) {
                    c1 = (b1.X - a1.X) * (a2.Y - a1.Y) - (b1.Y - a1.Y) * (a2.X - a1.X);
                    c2 = (b2.X - a1.X) * (a2.Y - a1.Y) - (b2.Y - a1.Y) * (a2.X - a1.X);
                    if (c1 * c2 <= 0.0) {
                        isC = true;
                        return isC;
                    }
                }
            }
        }

        return isC;
    },

    initCanvas: function() {

        this.g = this.canvas.getContext('2d');
        this.g.lineWidth = 3;
        this.g.font = "14px Arial";
/*
        // Draw top bar
        var col = "rgb(" + this.rand(0,200) + "," + this.rand(0,200) + "," + this.rand(0,200) + ")";

        this.g.fillStyle = col;
        this.g.fillRect(0, 0, this.canvas.width, 20);
*/
    },

    /**
     * Get dimensions and upper left corner of the canvas element.

     getCanvasRect: function() {
        var canvas = this.canvas,
            w = canvas.width,
            h = canvas.height,
            cx = canvas.offsetLeft,
            cy = canvas.offsetTop;

        while (canvas.offsetParent != null) {
            canvas = canvas.offsetParent;
            cx += canvas.offsetLeft;
            cy += canvas.offsetTop;
        }
        return {x: cx, y: cy, width: w, height: h};
    },
     */

    getScrollY: function() {
        //var scrollY = 0, os;

        // os = $(this.canvas).position();
        // scrollY = os.top;


        // if (typeof(document.body.parentElement) != 'undefined') {
        // scrollY = document.body.parentElement.scrollTop; // IE
        // } else if (typeof(window.pageYOffset) != 'undefined') {
        // scrollY = window.pageYOffset; // FF
        // }

        //return scrollY;
        return 0;
    },

    clearStrokes: function() {
        this.points.length = 0;
        this.pointsRaw.length = 0;
        this.strokeID = 0;
        this.strokes.length = 0;

        this.g.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //this.drawText("Canvas cleared.");
        this.needsClear = false;

        if (this.textbox !== null)  {
            this.textbox.value = "";
        }
    },

    downEvent: function(evt) {
        var x = evt.pageX,
            y = evt.pageY,
            button = evt.button,
            t = evt.targetTouches,
            col;

        if (t) {
            button = 0;
            x = t[0].pageX;
            y = t[0].pageY;
        }

        if (this.needsClear) {
            this.clearStrokes();
        }

        if (button <= 1 || typeof button === 'undefined') {
            this.isDown = true;

            x -= this.offsetX;
            y -= this.offsetY;

            //x -= this.rc.x;
            //y -= this.rc.y; // - this.getScrollY();

            if (this.strokeID !== 0) {
                this.startDate = new Date();
                if (this.startDate.getTime() - this.lastDate.getTime() > this.minTimeDiff) {

                    // Copy points for dollar p recognition
                    this.strokes.push( this.points.slice(0) );
                    this.strokeID = 0;
                } else {
                    clearTimeout(this.timeout);
                }
            }

            if (this.strokeID === 0) { // starting a new gesture
                this.points.length = 0;
                this.pointsRaw.length = 0;

                // set random color
                //col = "rgb(" + this.rand(0,200) + "," + this.rand(0,200) + "," + this.rand(0,200) + ")";
                col = "rgb(20, 30, 200)";

                this.g.fillStyle = col;
                this.g.strokeStyle = col;
            }

            // Rectangle to mark the beginning of a stroke
            //this.g.fillRect(x - 4, y - 3, 9, 9);
            this.g.beginPath();            
            this.g.arc(x, y, 2, 0, 2 * Math.PI, false);
            this.g.closePath();            
            this.g.fill();

            // Start new stroke
            ++this.strokeID;
            this.points[this.points.length] = {
                X: x,
                Y: y,
                ID: this.strokeID
            };
            this.pointsRaw.push([x, y, this.strokeID]);
        }

        if (evt && evt.preventDefault) {
            evt.preventDefault();
        } else if (window.event) {
            window.event.returnValue = false;
        }
    },

    moveEvent: function(evt) {
        var x = evt.pageX,
            y = evt.pageY,
            t = evt.targetTouches;

        if (t) {
            x = t[0].pageX;
            y = t[0].pageY;
        }

        if (this.isDown) {

            x -= this.offsetX;
            y -= this.offsetY;

            //x -= this.rc.x;
            //y -= this.rc.y; // - this.getScrollY();

            // Append point
            this.points[this.points.length] = {
                X: x,
                Y: y,
                ID: this.strokeID
            };
            this.pointsRaw.push([x, y, this.strokeID]);

            this.drawConnectedPoint(this.pointsRaw.length - 2, this.pointsRaw.length - 1);
        }
    },

    upEvent: function() {
        if (this.isDown) {
            this.isDown = false;
            this.lastDate = new Date();
        }
    },

    drawConnectedPoint: function(from, to) {
        this.g.beginPath();
        this.g.moveTo(this.pointsRaw[from][0], this.pointsRaw[from][1]);
        this.g.lineTo(this.pointsRaw[to][0], this.pointsRaw[to][1]);
        this.g.closePath();
        this.g.stroke();
    },

    drawText: function(str) {
        this.g.fillStyle = "rgb(255,255,136)";
        this.g.fillRect(0, 0, this.canvas.width, 20);
        this.g.fillStyle = "rgb(0,0,255)";
        this.g.fillText(str, 1, 14);
    },

    paintBBox: function(stroke) {
        var bb = this.getBBox(stroke),
            col = "rgb(100,100,100)";

        bb[0] -= 3;
        bb[1] -= 3;
        bb[2] += 3;
        bb[3] += 3;

        this.g.lineWidth = 1;
        this.g.strokeStyle = col;
        this.g.beginPath();
        this.g.moveTo(bb[0], bb[1]);
        this.g.lineTo(bb[2], bb[1]);
        this.g.lineTo(bb[2], bb[3]);
        this.g.lineTo(bb[0], bb[3]);
        this.g.closePath();
        this.g.stroke();
        this.g.lineWidth = 3;
    },

    /**
     * Manage gestures
     */

    onAddGesture: function(name) {
        if (this.pointsRaw.length >= this.minStrokeLength && name.length > 0) {
            this.addGestureRaw(name, this.pointsRaw);
        }
        this.clearStrokes();
    },

    onSave: function() {
        localStorage.removeItem('JXGPointClouds');
        localStorage.setItem('JXGPointClouds', JSON.stringify(this.pointCloudsRaw));
        if (this.textbox !== null)  {
            this.textbox.value = this.pointCloudsRaw.length + " gestures saved";
        }
    },

    onDeleteAll: function() {
        localStorage.removeItem('JXGPointClouds');
        this.pointCloudsRaw = [];
        if (this.textbox !== null)  {
            this.textbox.value = JSON.stringify(this.pointCloudsRaw);
        }
    },

    /**
     * 'pointcloud' has to be a (hidden) input element of the form.
     */

    onSubmit: function() {
        GUI.getId('pointcloud').value = JSON.stringify(this.pointCloudsRaw);
        GUI.getId('SEND').submit();
    },

    printStats: function() {
        var stat = {}, i, t = '';

        for (i = 0; i < this.pointCloudsRaw.length; ++i) {
            if (stat[this.pointCloudsRaw[i].Name]) {
                stat[this.pointCloudsRaw[i].Name]++;
            } else {
                stat[this.pointCloudsRaw[i].Name] = 1;
            }
        }

        for (i in stat) {
            t += '"' + i + '": ' + stat[i] + '\n';
        }

        if (this.textbox !== null)  {
            this.textbox.value = t;
        }
    }
};
