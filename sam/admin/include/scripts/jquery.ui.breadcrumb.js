(function( $ )
{
	"use strict";

	$.widget( 'bonzi.breadcrumb',
	{
		options: {
			limit: 100,
			popOnClick: false
		},
		_createWidget: function( options, element )
		{
			// This plugin must be called on an unordered list.
			if ( element.tagName.toLowerCase() != 'ul' )
				{return;}

			$.Widget.prototype._createWidget.apply( this, arguments );
		},
		_create: function()
		{
			var self = this;
			this.element
				.addClass( 'bonzi-breadcrumb' )
				.addClass( 'ui-helper-clearfix' )
				.delegate( 'li', 'click', function( event /*, ui*/ )
				{
					if ( $(this).parent()[0] !== self.element[0] )
						return;

					if ( self.options.popOnClick )
					{
						self.pop( $(this).index() );
					}

					if ( !event.isDefaultPrevented() && !event.isPropagationStopped() )
					{
						if ( !$(event.target).parentsUntil( 'li', 'a[href]' ).andSelf().is('a[href]') )
						{
							var link = $(this).find('*').andSelf().filter('a[href]').first();
							if ( link.length > 0 )
							{
								var emulatedEvent = new $.Event( event );
								link.trigger( emulatedEvent );
								if ( emulatedEvent.isDefaultPrevented() || emulatedEvent.isPropagationStopped() )
									{return;}

								window.location = link.attr( 'href' );
							}
						}

						self._trigger( 'click',  event, { el: $(this), index: $(this).index() } );
					}
				});

			this.enforceLimit();
		},
		push: function( html, options )
		{
			options = options || {};

			var li = $('<li />')
				.prependTo( this.element )
				.html( html );

			if ( options.attributes )
			{
				li.attr( options.attributes );
			}

			this.enforceLimit();

			return li;
		},
		enforceLimit: function()
		{
			var children = this.element.children('li');
			if ( children.length < this.options.limit )
				{return;}

			children.slice( this.options.limit ).remove();
		},
		get: function( index )
		{
			if ( typeof index === 'undefined' )
				{index = 0;}
			else if ( typeof index !== 'number' )
				{return $();}

			var children = this.element.children('li');
			var max = children.length - 1;

			if ( index < 0 )
			{
				index = max + index;
			}

			if ( index > max || index < 0 )
				{return $();}

			return $(children[index]);
		},
		find: function( start, end, callback )
		{
			if ( start instanceof Function )
			{
				callback = start;
				start = null;
				end = null;
			}
			else if ( end instanceof Function )
			{
				callback = end;
				end = null;
			}
			else if ( !callback instanceof Function )
			{
				return false;
			}

			var children = this.element.children('li');

			if ( typeof start !== 'number' || start < 0 )
			{
				start = 0;
			}
			if ( typeof end !== 'number' || end >= children.length )
			{
				end = children.length - 1;
			}

			for ( ; start <= end; ++start )
			{
				if ( !callback( $(children[start]), start ) )
					{continue;}

				return start;
			}

			return false;
		},
		count: function()
		{
			return this.element.children('li').length;
		},
		pop: function( count )
		{
			if ( typeof count !== 'number' )
				{count = 1;}
			else if ( count < 1 )
				{return;}

			var children = this.element.children('li');
			var length = children.length;

			if ( count > length )
				{count = length;}

			children.slice( 0, count ).remove();
		},
		clear: function()
		{
			this.element.children('li').remove();
		}
	});
}( jQuery ));