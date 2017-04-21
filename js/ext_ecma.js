/*
    Copyright 2011 / 2012

        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Heiko Vogel
        Alfred Wassermann,

    This file is part of the JSXGraph GUI project.
    This code isn't licensed yet.
*/

Array.prototype.dist = function (v) {
	var i, dist = 0;
	for (i=0; i<this.length; i++)
		dist += Math.pow((this[i]-v[i]), 2)
	return Math.sqrt(dist);
};

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, "");
};

String.prototype.trimTrailZeroes = function() {
    return this.replace(/(.\d*?)0+$/, "$1").replace(/\.$/, "");
};

String.prototype.sanitize = function() {
	return this.replace(/\n/g, " ").replace(/\r/g, "").replace(/\t+/, '').replace(/ +/g, ' ').trim();
};

String.prototype.cleanTerm = function() {
    var ret = this.replace(/\n/g, "").replace(/\r/g, "");

    ret = ret.replace(/^ *function *\( *x* *\) *{ *return */, "").replace(/[ ;]*} *$/, "");
    //ret = ret./*replace(/;/g, "").*/replace(/"/g, "&quot;");

    return ret;
};

String.prototype.capitalize = function() {
	return this.replace(/(^|\s)([a-z])/g, function(m, p1, p2) {
		return p1 + p2.toUpperCase();
	});
};

Number.prototype.trimTrailZeroes = function() {
    return parseFloat(this.toString().trimTrailZeroes());
};