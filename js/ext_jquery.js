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

(function($) {

	/* Enable the text selection functionality */
	$.fn.enableSelection = function() {
		return this.each(function() {
			$(this).removeAttr('unselectable')
				.css({
					'-moz-user-select':'text',
					'-webkit-user-select':'text',
					'-khtml-user-select':'text',
					'-o-user-select':'text',
					'user-select':'text'
				});

		});
	};

	/* Disable the text selection functionality */
	$.fn.disableSelection = function() {
		return this.each(function() {
			$(this).attr('unselectable', 'on')
				.css({
					'-moz-user-select':'none',
					'-webkit-user-select':'none',
					'-khtml-user-select':'none',
					'-o-user-select':'none',
					'user-select':'none'
				});

		});
	};

	/* Compute the height of an elements margins, borders and paddings */
	$.fn.mbpHeight = function() {
		var height = parseInt(this.css('padding-top'));
		height += parseInt(this.css('padding-bottom'));
		height += parseInt(this.css('margin-top'));
		height += parseInt(this.css('margin-bottom'));
		height += parseInt(this.css('border-top-width'));
		height += parseInt(this.css('border-bottom-width'));
		return height;
	};

	/* Compute the width of an elements margins, borders and paddings */
	$.fn.mbpWidth = function() {
		var width = parseInt(this.css('padding-left'));
		width += parseInt(this.css('padding-right'));
		width += parseInt(this.css('margin-left'));
		width += parseInt(this.css('margin-right'));
		width += parseInt(this.css('border-left-width'));
		width += parseInt(this.css('border-right-width'));
		return width;
	};

	/* Compute the outer height of an element including its margins, paddings and borders */
	$.fn.outerHeight = function() {
		return parseInt(this.css('height')) + this.mbpHeight();
	};

	/* Compute the outer width of an element including its margins, paddings and borders */
	$.fn.outerWidth = function() {
		return parseInt(this.css('width')) + this.mbpWidth();
	};

    /*function scrollbarWidth() {
     var div = $('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
     // Append our div, do our calculation and then remove it
     $('body').append(div);
     var w1 = $('div', div).innerWidth();
     div.css('overflow-y', 'scroll');
     var w2 = $('div', div).innerWidth();
     $(div).remove();
     return (w1 - w2);
     }
     */

})(jQuery);