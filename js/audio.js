/*
    Copyright 2011 / 2012

        Alfred Wassermann
        Michael Gerhaeuser,
        Carsten Miller,
        Matthias Ehmann,
        Heiko Vogel

    This file is part of the JSXGraph GUI project.
    This code isn't licensed yet.
*/

(function () {

    'use strict';
    
    var s;
    
    GUI.Audio = {

        /**
         * List of available sounds.
         * @type Object
         */
        sounds: {
            'click': 'audio-click',
            'bubble': 'audio-bubble',
            'plastic': 'audio-plastic'
        },

        levels: [0, 0.23, 0.55, 1],

        /**
         * Sound enabled?
         * @type Boolean
         * @default true
         */
        enabled: true,

        /**
         * Dummy player to extract supported codecs etc.
         * @type Node
         */
        dummy: document.getElementById('audio-dummy'),

        /**
         * Used sound format, depends on the browser. Possible values: 'mp3' and 'ogg'.
         * @type String
         * @default 'mp3'
         */
        format: 'mp3',

        /**
         * Plays a sound.
         * @param what What sound to play. Currently only 'click' is available.
         */
        play: function (what) {
            var volume = GUI.Settings.get('volume');
                //base = 6*Math.E;

            if (GUI.Settings.get('sound') && GUI.Audio.sounds[what] && GUI.Audio[what] && volume > 0) {
                //GUI.Audio[what].volume = volume / 3;
                //GUI.Audio[what].volume = (Math.pow(base, volume*0.33333)-1)/(base-1);
                GUI.Audio[what].volume = this.levels[volume];
                GUI.Audio[what].play();
            }
        }
    };
    
    // determine codec
    if (GUI.Audio.dummy) {
        GUI.Audio.format = (typeof GUI.Audio.dummy.canPlayType === "function" && GUI.Audio.dummy.canPlayType("audio/mpeg") !== "") ? 'mp3' : 'ogg';

        // load audio files
        for (s in GUI.Audio.sounds) {
            if (GUI.Audio.sounds.hasOwnProperty(s)) {
                GUI.Audio[s] = document.getElementById(GUI.Audio.sounds[s]);
                GUI.Audio[s].src = 'audio/' + s + '.' + GUI.Audio.format;
            }
        }
    }

    /**
     * Browser independent vibrate function.
     */
    GUI.Audio.vibrate = (function(){
        if (navigator.vibrate) {
            return function (dur) {
                if (GUI.Settings.get('vibrate')) {
                    return navigator.vibrate(dur);
                }
            };
        }
        
        if (navigator.mozVibrate) {
            return function (dur) {
                if (GUI.Settings.get('vibrate')) {
                    return navigator.mozVibrate(dur);
                }
            };
        } 
        
        if (navigator.webkitVibrate) {
            return function (dur) {
                if (GUI.Settings.get('vibrate')) {
                    return navigator.webkitVibrate(dur);
                }
            };
        } 
        
        if (navigator.oVibrate) {
            return function (dur) {
                if (GUI.Settings.get('vibrate')) {
                    return navigator.oVibrate(dur);
                }
            };
        } 
        
        if (navigator.msVibrate) {
            return function (dur) {
                if (GUI.Settings.get('vibrate')) {
                    return navigator.msVibrate(dur);
                }
            };
        }
        
        return function (dur) { };
    }());
    
}());
