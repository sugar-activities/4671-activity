/*
    Copyright 2011 / 2012

        Alfred Wassermann
        Michael Gerhaeuser,
        Carsten Miller,
        Matthias Ehmann,
        Heiko Vogel,

    This file is part of the JSXGraph GUI project.
    This code isn't licensed yet.
*/

(function () {
    if ($.browser.msie) {
        // Internet Explorer doesn't really support this stuff. At least not IE <= 9
        return;
    }

    var appCache = window.applicationCache;

    if (typeof appCache == 'undefined') {
        // in case app cache is not supported by the browser we don't need to tell the user.
        // besides: GUI.Lang.std is not initialized by now, all the alert box would tell us is "undefined".
        //GUI.alert(GUI.Lang.std.appcache_error);
    }

    appCache.on = appCache.addEventListener;

    var report = function (ev) {

        console.log('appCacheEvent: ' + ev.type + ' -- ' + new Date().toISOString());

        if (!('progress' === ev.type || 'downloading' === ev.type || 'checking' === ev.type
            || 'noupdate' === ev.type || 'cached' === ev.type)) {

            if ('updateready' == ev.type) {
                if (!GUI.release) {
                    GUI.alert('new version available, updating');
                }
                window.location.reload();
            }

            if ('error' === ev.type && !GUI.release) {
                if (navigator.onLine)
                    GUI.alert('appcache error!');
                else
                    console.log('appcache error!');
            }
        }
    };

    appCache.on('checking', report, false);
    appCache.on('error', report, false);
    appCache.on('noupdate', report, false);
    appCache.on('downloading', report, false);
    appCache.on('progress', report, false);
    appCache.on('updateready', report, false);
    appCache.on('cached', report, false);

}());