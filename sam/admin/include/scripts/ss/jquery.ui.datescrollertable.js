( function( $ )
{
	"use strict";

	var widgetName = 'datescrollertable';

	$.widget( 'ui.' + widgetName,
	{
		options:
		{
			height: 400,
			scrollOffset: -30,
			padEnd: 40,
			eventSelector: '.game-list-time',
			timeAttr: 'data-time',
			eventTitle: 'Game'
		},

		_outer: null,

		_create: function()
		{
			this._wrap();
		},

		_wrap: function()
		{
			this._outer = $( '<div/>' )
				.addClass( 'dstable-outer' )
				.insertBefore( this.element )
			;

			this._wrapper = $( '<div/>' )
				.addClass( 'dstable-wrapper' )
				.css(
				{
					position: 'relative',
					maxHeight: this.options.height + 'px',
					'overflow-y': 'auto'
				})
				.appendTo( this._outer )
			;

			this.element.appendTo( this._wrapper );

			if ( this.options.padEnd )
			{
				$( '<div/>' )
					.height( this.options.padEnd )
					.appendTo( this._wrapper );
			}

			this._renderDatescroller();
		},

		_renderDatescroller: function()
		{
			var self = this;

			this._datescroller = $( '<div/>' )
				.prependTo( this._outer )
				.datescroller(
				{
					theme: false,
					eventCounts: this._getEvents(),
					eventTitle: this.options.eventTitle,
					select: function( event, ui )
					{
						if ( self._datescroller )
							self._goTo( ui.date );
						else
							self._goTo( ui.date, { animate: false } );
					}
				})
			;
		},

		_getEvents: function()
		{
			var self = this,
				eventElems = this.element.find( this.options.eventSelector ),
				events = [];

			eventElems.each( function()
			{
				var timestamp = parseInt( $( this ).attr( self.options.timeAttr ), 10 );

				if ( !timestamp )
					return;

				var date = new Date( timestamp * 1000 );

				events.push( date );
			});

			return events;
		},

		_goTo: function( date, options )
		{
			var dateString = date.getFullYear() + '-' + ( date.getMonth() < 9 ? '0' : '' ) + ( date.getMonth() + 1 ) + '-' + ( date.getDate() < 10 ? '0' : '' ) + date.getDate();

			var anchor = this.element.find( 'a[name="' + dateString + '"]' );

			this.scrollTo( anchor, options );
		},

		scrollTo: function( element, options )
		{
			options = options || {};

			if ( !element.length )
				return;

			var offset = element.position().top + this._wrapper.scrollTop() + this.options.scrollOffset;

			this._wrapper.stop();

			if ( !( 'animate' in options ) || options.animate )
				this._wrapper.animate( { scrollTop: offset } );
			else
				this._wrapper.scrollTop( offset );
		}
	});

}( jQuery ) );