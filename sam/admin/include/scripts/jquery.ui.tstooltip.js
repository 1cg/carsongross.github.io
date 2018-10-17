/**
 * A tooltip widget.
 *
 * Usage: $('#someInputOrElement').tstooltip({
 *			content: 'Hey, pay attention to this'
 *});
 */
(function($)
{
	var instances = $();
	var hideHandler = null;

	function cls( cn )
	{
		return 'tstt-' + cn;
	}
	function sel( cn )
	{
		return '.tstt-' + cn;
	}

	$.widget('ui.tstooltip', {
		options: {
			content: '',	//not sure what to do if this is not specified.  Probably just be a sad panda.
			width: 200,
			zIndex: '',
			hideOnTargetClick: false,
			autoHide: true,
			autoShow: true,
			pointer: null,	//pointer icon, e.g.: {url: 'url', width: x, height: y}
			pointerPosition: 'center',	//top, center, bottom
			appendTo: null,	//an element, selector, or 'target'.  Default: 'body'
			addClass: '',	//classes to add to the popup for help with styling etc.
			fadeSpeed: 500
		},

		_create: function()
		{
			var t = this,
				o = t.options,
				nobubble = false,
				target = t.element,
				el = $('<div/>')
					.hide()
					.data( this.widgetName + '-element', this.element )
					.css({
						position: 'absolute',
						width: o.width,
						'z-index': o.zIndex
					})
					.append( o.content )
					.appendTo( o.appendTo === 'target' ? target.parent() : ( o.appendTo || 'body' ) )
					.addClass( cls( 'tooltip' ) )
					.addClass( 'ui-corner-all' );

			if ( o.addClass )
			{
				el.addClass( o.addClass );
			}

			t.element.addClass( this.widgetName + '-target' );

			t.el = el;

			t.pointer = $('<div />')
				.css({
					position: 'absolute',
					background: 'translucent'
				})
				.addClass( cls( 'pointer' ) )
				.appendTo( el );
			
			if ( o.pointer )
			{
				t.pointer.css({
					'background-image': "url('" + o.pointer.url + "')",
					width: o.pointer.width,
					height: o.pointer.height
				});
			}

			if ( o.autoHide && !hideHandler )
			{
				hideHandler = true;
				$(document).bind( 'click.' + t.widgetName, function( ev )
				{
					var widgets = instances;
					var inst = $(ev.target)
						.closest( sel( 'tooltip' ) + ',.' + t.widgetName + '-target' );

					if ( inst.data( t.widgetName + '-element' ) )
					{
						inst = inst.data( t.widgetName + '-element' );
					}

					if ( inst === nobubble )
					{
						nobubble = false;
						return;
					}

					if ( inst )
					{
						widgets = widgets.not( inst );
					}

					widgets.tstooltip( 'hide' );
				});
			}

			if ( o.autoHide && !o.hideOnTargetClick )
			{
				target.bind( 'click.' + t.widgetName, function()
				{
					nobubble = t.element;
				});
			}

			instances = instances.add( this.element );
		},

		_init: function()
		{
			if ( this.options.autoShow )
			{
				this.show();
			}
		},

		show: function( pos )
		{
			var target = this.element;
			var pointer = this.pointer;
			var el = this.el;
			var pointerPosition = this.options.pointerPosition;
			var self = this;

			if ( el.is( ':visible' ) )
			{
				return;
			}

			this._trigger( 'show' );

			el
				//initial fade in a little bit to make the browser give
				// it dimensions
				.fadeTo(1, 0.01, function()
				{
					if ( !pos )
					{
						var targetPos = {
							pos: target.position(),
							off: target.offset()
						};

						pos = {
							top: targetPos.off.top,
							left: targetPos.off.left
						};
					}

					var offset = 0;
					var borderWidth = ( el.outerWidth(true) - el.innerWidth() ) / 2;

					if ( el.height() > 150 && !offset )
					{
						offset = 100;
					}

					el
						.position({
							my: 'left ' + pointerPosition,
							at: 'right ' + pointerPosition,
							of: target,
							offset: '5 0'	//offset of 5 for looks ( so it doesn't touch the target )
						})
						.fadeTo( self.options.fadeSpeed, 1 );

					if ( el.position().left > target.position().left )
					{
						pointer
							.removeClass( cls( 'right' ) )
							.addClass( cls( 'left' ) );

						pointer.position({
							my: 'right ' + pointerPosition,
							at: 'left ' + pointerPosition,
							of: el,
							offset: borderWidth + ' 0' //offset of border width so it covers the border
						});
					}
					else
					{
						pointer
							.removeClass( cls( 'left' ) )
							.addClass( cls( 'right' ) );

						pointer.position({
							my: 'left ' + pointerPosition,
							at: 'right ' + pointerPosition,
							of: el,
							offset: '-' + borderWidth + ' 0' //offset of border width so it covers the border
						});
					}
			
				});
		},

		hide: function( callback )
		{
			var self = this;
			this._trigger( 'hide' );
			this.el.fadeOut( 'fast', function()
			{
				callback && callback.apply( self, arguments );
			} );
		},

		_setOption: function( key, value )
		{
			if ( key === 'content' )
			{
				this.el.empty().append( value );
			}
			
			//this._super( '_setOption', key, value );
			$.Widget.prototype._setOption.apply( this, arguments );
		},

		//newer jquery UI's seem to call _destroy, this is for some older version
		destroy: function()
		{
			instances = instances.not( this.element );
			this.el.remove();
			this.element.removeClass( this.widgetName + '-target' );

			$.Widget.prototype.destroy.apply( this, arguments );

			if ( this.el )
			{
				this._destroy();
			}
		},

		_destroy: function()
		{
			this.el.remove();
			delete( this.el );

			return this;
		}
});
})(jQuery);


