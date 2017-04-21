JXG.extend(GUI, {

    parseURL: function(str) {

        var url = {}, tmp, param, i;

        tmp = str.split('?');
        url.base = tmp[0];
        url.data = tmp[1];
        url.anchor = '';

        if (url.base.indexOf('#') > -1) {
            tmp = url.base.split('#');
            url.base = tmp[0];
            url.anchor = tmp[1];
        } else if (url.data && url.data.indexOf('#') > -1) {
            tmp = url.data.split('#');
            url.data = tmp[0];
            url.anchor = tmp[1];
        }

        url.param = {};

        if (url.data) {
            tmp = url.data.split('&');

            for (i = 0; i < tmp.length; i++) {
                param = tmp[i].split('=');
                url.param[param[0]] = param[1];
            }
        }

        return url;
    }
});

/*global JXG:true, GUI:true, jQuery:true, init_jsx_gui:true, unescape: true, Piwik:true */

$(document).ready(function () {
    var url, name, gallery = true, id;

    if (!JXG.supportsSVG()) {
        $('#splash-hint > h3').html('We\'re sorry, but your browser is not supported.');
        return;
    }

    init_jsx_gui('jxgbox');
    GUI.Gallery.init();

    // Parse the URL and read out the GET parameters
    url = GUI.parseURL(window.location.href);

    if (url.param.edit === 'true') {
        gallery = false;

        if (!url.param.source) {
            url.param.source = 'ls';
        }

        if (url.param.source === 'ls' && !url.param.id) {
            url.param.id = GUI.Gallery.files[GUI.Gallery.currentItem].fullid;
        }

        id = url.param.id;
    }

    if (url.param.source === 'url') {
        name = url.param.name || GUI.Lang.std.untitled + '-' + (GUI.fileCounter + 1);
        id = GUI.Gallery.createStorageItem(name, url.param.id);
    }

    $('#splash').hide();

    // update file list, start loading the previews, etc...
    GUI.Gallery.switchGallery();

    if (!gallery) {
        GUI.currentConstruction = {
            source: url.param.source,
            id: id,
            redirect: unescape(url.param.redirect)
        };
        // this is required to actually show the axis. see comment 6 on ticket #225
        //GUI.loadConstruction(name, GUI.Storage.getItem(name), axis);
        //$.mobile.changePage($('#mainWindow'), {transition: GUI.transition});
        GUI.Gallery.switchMainWindow();
    }
});
