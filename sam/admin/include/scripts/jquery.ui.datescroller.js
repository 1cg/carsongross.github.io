( function( $ )
{
	"use strict";

	var widgetName = 'datescroller';

	$.widget( 'ui.' + widgetName,
	{
		_scroller: null,
		_leftButton: null,
		_rightButton: null,
		_calendar: null,
		_datepicker: null,
		_daysContainer: null,
		_daysWrapper: null,

		_clickHandler: null,

		_baseDate: null,
		_currentOffset: null,
		_offsets: null,

		options:
		{
			selected: null, //date object
			calendar: true,
			length: 7,
			showEvents: true,
			skipEventlessDays: true,
			eventTitle: 'Event',
			eventTitlePlural: null,
			eventCounts: [],
			theme: true
		},

		select: function( date )
		{
			if ( !this._isValidDate( date ) )
				return this;

			date = this._zeroDay( date );

			var offset = this._getNearestValidOffset( date );
			this.scrollTo( offset );
		},

		scrollBy: function( places )
		{
			if ( places === 0 )
				return this;

			if ( !places )
				places = 1;

			var offset = this._currentOffset;
			var i = 0,
				iLen = Math.abs( places ),
				interval = places > 0 ? 1 : -1;

			for ( ; i < iLen ; i++ )
			{
				offset = this._getNextOffset( offset, interval );
			}

			if ( this.options.skipEventlessDays )
			{
				if ( offset > this._events.max )
					offset = this._events.max;
				else if ( offset < this._events.min )
					offset = this._events.min;
				else
				{
					while( !this._events[ offset ] )
					{
						offset = this._getNextOffset( offset, interval );
					}
				}
			}

			this.scrollTo( offset );
		},

		scrollTo: function( offset )
		{
			var date = this._addDays( this._baseDate, offset );

			if ( this._onBeforeSelect( date ) )
			{
				this._scrollTo( offset );
				this._currentOffset = offset;

				this._checkButtons();

				this._onSelect( date );
			}

			return this;
		},

		getDate: function()
		{
			return this._addDays( this._baseDate, this._currentOffset );
		},

		_create: function()
		{
			this._offsets = [];

			this._setBaseDate();
			this._initEvents();
			this._render();
			this.select( this.options.selected );
		},

		_initEvents: function()
		{
			if ( !$.isArray( this.options.eventCounts ) )
				this.options.eventCounts = [];

			this._events = {};

			var events = this.options.eventCounts;

			var i = events.length;
			while( i-- )
			{
				var event = events[ i ];

				if ( event instanceof Date )
					event = { date: event };

				if ( !this._isValidDate( event.date ) )
					continue;

				var distance = this._daysDifference( event.date, this._baseDate );

				if ( 'count' in event )
					event.count = typeof event.count === 'number' ? Math.floor( event.count ) : 0;
				else
					event.count = 1;

				if ( distance in this._events )
					this._events[ distance ] += event.count;
				else
					this._events[ distance ] = event.count;

				if ( this._events[ distance ] > 0 )
				{
					if ( !( 'max' in this._events ) || distance > this._events.max )
						this._events.max = distance;

					if ( !( 'min' in this._events ) || distance < this._events.min )
						this._events.min = distance;
				}
			}

			if ( !( 'min' in this._events ) )
				this._events.min = 0;

			if ( !( 'max' in this._events ) )
				this._events.max = 0;
		},

		_setBaseDate: function()
		{
			if ( !this._isValidDate( this.options.selected ) )
				this.options.selected = new Date();

			this.options.selected = this._zeroDay( this.options.selected );

			this._baseDate = this.options.selected;
		},

		_render: function()
		{
			this.element.addClass( 'dscroll-container ui-helper-clearfix' );

			if ( this.options.theme )
				this.element.addClass( 'ui-widget' );

			if ( this.options.calendar )
				this._renderCalendar();

			this._renderScroller();
		},

		_renderCalendar: function()
		{
			var self = this;

			this._calendar = $( '<div/>' )
				.addClass( 'dscroll-calendar' )
				.appendTo( this.element )
				.click( function( event )
				{
					if ( $( event.target ).closest( '.ui-datepicker, .ui-datepicker-header, .ui-datepicker-calendar' ).length )
						return;

					self._toggleDatepicker();

					event.stopPropagation();
					return false;
				})
			;

			this._clickHandler = function( event )
			{
				if ( $( event.target ).closest( '.ui-datepicker, .ui-datepicker-header, .ui-datepicker-calendar' ).length )
					return;

				self._hideDatepicker();
			};

			$( document ).on( 'click', this._clickHandler );

			var calendarIcon = $( '<span/>' )
				.addClass( 'dscroll-calendar-icon' )
				.appendTo( this._calendar )
			;

			if ( this.options.theme )
			{
				calendarIcon.addClass( 'ui-icon ui-icon-calendar' );

				this._calendar
					.addClass( 'ui-corner-all' )
					.append( $( '<span/>' )
						.addClass( 'ui-icon ui-icon-triangle-1-s' )
					)
				;
				this._buttonize( this._calendar );
			}

			this._renderDatepicker();
		},

		_renderDatepicker: function()
		{
			var self = this;

			this._datepicker = $( '<div/>' )
				.addClass( 'dscroll-datepicker' )
				.hide()
				.appendTo( this._calendar )
				.datepicker(
				{
					onSelect: function()
					{
						self.select( self._datepicker.datepicker( 'getDate' ) );
						self._hideDatepicker();

						//fix the buttons, after jQuery re-renders them
						setTimeout( function()
						{
							self._renderDatepickerButtons();
						}, 0 );
					},
					onChangeMonthYear: function()
					{
						setTimeout( function()
						{
							self._renderDatepickerButtons();
						}, 0 );
					},
					defaultDate: this.options.selected,
					showButtonPanel: true,
					maxDate: this.options.skipEventlessDays ? this._addDays( this._baseDate, this._events.max ) : null,
					minDate: this.options.skipEventlessDays ? this._addDays( this._baseDate, this._events.min ) : null,
					beforeShowDay: function( date )
					{
						var show = true;

						var offset = self._daysDifference( date, self._baseDate );
						var numEvents = self._events[ offset ] || 0;

						if ( self.options.skipEventlessDays )
						{
							if ( !numEvents )
								show = false;
						}

						var text = numEvents;
						text += ' ' + self._getEventTitle( numEvents !== 1 );

						return [ show, '', text ];
					}
				})
			;

			this._renderDatepickerButtons();
		},

		_renderDatepickerButtons: function()
		{
			var self = this;
			var panel = this._datepicker.find( '.ui-datepicker-buttonpane' );

			panel.empty();

			var today = $( '<button>' )
				.text( 'Today' )
				.click( function()
				{
					self.select( new Date() );
					self._hideDatepicker();
				})
				.appendTo( panel )
			;

			if ( this.options.theme )
				today.addClass( 'ui-corner-all' );

			this._buttonize( today );
		},

		_renderScroller: function()
		{
			var self = this;

			this._scroller = $( '<div/>' )
				.addClass( 'dscroll-scroller' );

			this._leftButton = $( '<div/>' )
				.addClass( 'dscroll-scroll-button dscroll-left-button' )
				.click( function()
				{
					self.scrollBy( -self.options.length );
				})
				.appendTo( this._scroller )
			;

			var leftButtonIcon = $( '<span/>' )
				.addClass( 'dscroll-left-button-icon')
				.appendTo( this._leftButton );

			this._daysContainer = this._getDaysContainer()
				.appendTo( this._scroller )
			;

			this._daysWrapper = this._getDaysWrapper()
				.appendTo( this._daysContainer );

			this._rightButton = $( '<div/>' )
				.addClass( 'dscroll-scroll-button dscroll-right-button' )
				.click( function()
				{
					self.scrollBy( self.options.length );
				})
				.appendTo( this._scroller )
			;

			var rightButtonIcon = $( '<span/>' )
				.addClass( 'dscroll-right-button-icon')
				.appendTo( this._rightButton );

			if ( this.options.theme )
			{
				this._leftButton.addClass( 'ui-corner-left' );

				leftButtonIcon.addClass( 'ui-icon ui-icon-triangle-1-w' );

				this._buttonize( this._leftButton );

				this._rightButton.addClass( 'ui-corner-right' )
				;

				rightButtonIcon.addClass( 'ui-icon ui-icon-triangle-1-e' );

				this._buttonize( this._rightButton );
			}

			this._scroller.appendTo( this.element );
		},

		_getDaysContainer: function()
		{
			return $( '<div/>' )
				.addClass( 'dscroll-days' )
			;
		},

		_getDaysWrapper: function()
		{
			return $( '<div/>' )
				.addClass( 'dscroll-days-wrapper' )
			;
		},

		_scrollTo: function( offset )
		{
			if ( this._currentOffset === offset )
				return;

			this._renderDaysForOffset( offset );

			this._slideTo( this._currentOffset, { animate: false } );
			this._slideTo( offset );
		},

		_checkButtons: function()
		{
			if ( !this.options.skipEventlessDays )
				return;

			var disabledClass = 'dscroll-disabled';

			if ( this.options.theme )
				disabledClass += ' ui-state-disabled';

			if ( this._currentOffset >= this._events.max )
				this._rightButton.addClass( disabledClass );
			else
				this._rightButton.removeClass( disabledClass );

			if ( this._currentOffset <= this._events.min )
				this._leftButton.addClass( disabledClass );
			else
				this._leftButton.removeClass( disabledClass );
		},

		_slideTo: function( offset, options )
		{
			options = options || {};

			var leftIndex,
				leftDay,
				leftPixelOffset;

			var offsetIndex = $.inArray( offset, this._offsets );

			if ( offsetIndex === -1 )
				return;

			var selectedClass = 'dscroll-selected';
			if ( this.options.theme )
				selectedClass += ' ui-state-active';

			this._daysWrapper
				.children()
				.removeClass( selectedClass )
				.filter( ':nth-child(' + ( offsetIndex + 1 ) + ')' )
				.addClass( selectedClass )
			;

			leftIndex = offsetIndex - Math.floor( this.options.length / 2 );

			leftDay = this._daysWrapper.children( ':nth-child(' + ( leftIndex + 1 ) + ')' );

			leftPixelOffset = -leftDay.position().left;
			leftPixelOffset += parseInt( leftDay.css( 'border-left-width' ), 10 ) || 0;
			leftPixelOffset = Math.min( 0, leftPixelOffset );

			this._daysWrapper
				.stop();

			if ( !( 'animate' in options ) || options.animate )
			{
				this._daysWrapper
					.animate(
					{
						left: leftPixelOffset
					})
				;
			}
			else
			{
				this._daysWrapper.css(
				{
					left: leftPixelOffset
				});
			}
		},

		_renderDaysForOffset: function( offset )
		{
			var numBefore = Math.floor( this.options.length / 2 );
			var numAfter = this.options.length % 2 ? numBefore : numBefore + 1;

			var i, iLen;
			var current = offset;

			this._renderDay( current );

			i = 0;
			iLen = numBefore;
			for( ; i < iLen; i++ )
			{
				current = this._getNextOffset( current, -1 );
				this._renderDay( current );
			}

			i = 0;
			iLen = numAfter;
			current = offset;
			for( ; i < iLen; i++ )
			{
				current = this._getNextOffset( current, 1 );
				this._renderDay( current );
			}

			this._clampWidth();
		},

		_clampWidth: function()
		{
			//fixes IE7 where _daysWrapper wraps causing positioning errors
			var lastDayPosition = this._daysWrapper.children( ':last-child' ).position();
			if ( lastDayPosition && lastDayPosition.top !== 0 )
				this._daysWrapper.width( this._daysWrapper.width() * 2 );

			if ( this._daysContainer.attr( 'width' ) )
				return;

			this._daysContainer.width( this._daysContainer.width() );
		},

		_renderDay: function( offset )
		{
			var day = this._getDay( offset );

			if ( !this._offsets.length || offset > this._offsets[ this._offsets.length - 1 ] )
			{
				day.appendTo( this._daysWrapper );
				this._offsets.push( offset );
			}
			else if ( offset < this._offsets[ 0 ] )
			{
				day.prependTo( this._daysWrapper );
				this._offsets.unshift( offset );
			}
			else
			{
				var i = this._offsets.length;
				while( i-- && i > 0 )
				{
					if ( this._offsets[ i ] > offset && this._offsets[ i - 1 ] < offset )
					{
						day.insertBefore( this._daysWrapper.children( ':nth-child(' + ( i + 1 ) + ')' ) );
						this._offsets.splice( i, 0, offset );
					}
				}
			}
		},

		_getDay: function( offset )
		{
			var self = this,
				day = this._getDayContainer(),
				date = this._addDays( this._baseDate, offset ),
				now = new Date();

			day.click( function()
			{
				if ( day.is( '.dscroll-disabled' ) )
					return;

				self.select( date );
			});

			var showYear = date.getFullYear() !== now.getFullYear();

			var dateContainer = $( '<span/>' )
				.addClass( 'dscroll-date' )
				.append( this._prettyDate( date, showYear ) )
				.appendTo( day );

			if ( showYear )
				dateContainer.addClass( 'dscroll-date-with-year' );

			if ( this.options.showEvents )
			{
				var numEvents = this._getNumEventsFor( offset );

				$( '<span/>' )
					.addClass( 'dscroll-events' )
					.append( numEvents + ' ' + this._getEventTitle( numEvents !== 1 ) )
					.appendTo( day )
				;

				if ( numEvents === 0 && this.options.skipEventlessDays )
				{
					day.addClass( 'dscroll-disabled' );

					if ( this.options.theme )
						day.addClass( 'ui-state-disabled' );
				}

			}

			if ( offset === this._todaysOffset() )
			{
				day.addClass( 'dscroll-today' );

				if ( this.options.theme )
					day.addClass( 'ui-state-highlight' );
			}

			return day;
		},

		_getNumEventsFor: function( offset )
		{
			return this._events[ offset ] || 0;
		},

		_getDayContainer: function()
		{
			var day = $( '<span/>' )
				.addClass( 'dscroll-day' )
			;

			if ( this.options.theme )
				this._buttonize( day );

			return day;
		},

		_showDatepicker: function()
		{
			this._datepicker.show();
		},

		_hideDatepicker: function()
		{
			this._datepicker.hide();
		},

		_toggleDatepicker: function()
		{
			if ( this._datepicker.is( ':visible' ) )
				this._hideDatepicker();
			else
				this._showDatepicker();
		},

		_isValidDate: function( date )
		{
			return ( date instanceof Date ) && !isNaN( date.getTime() );
		},

		_getEventTitle: function( plural )
		{
			if ( !plural )
				return this.options.eventTitle;
			else
				return this.options.eventTitlePlural || this.options.eventTitle + 's';
		},

		_prettyDate: function( date, showYear )
		{
			var pretty = '';
			var days = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
			var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

			pretty += days[ date.getDay() ] + ', ' + months[ date.getMonth() ] + ' ' + date.getDate();

			if ( showYear )
				pretty += ' ' + date.getFullYear();

			return pretty;
		},

		_addDays: function( date, days )
		{
			var	dayMs = 24 * 60 * 60 * 1000;

			return new Date( date.getTime() + dayMs * days );
		},

		_isSameDay: function( dateA, dateB )
		{
			if ( !this._isValidDate( dateA ) || !this._isValidDate( dateB ) )
				return false;

			dateA = this._zeroDay( dateA );
			dateB = this._zeroDay( dateB );

			return dateA.getTime() === dateB.getTime();
		},

		_daysDifference: function( dateA, dateB )
		{
			var dayMs = 24 * 60 * 60 * 1000;

			dateA = this._zeroDay( dateA );
			dateB = this._zeroDay( dateB );

			return Math.ceil( ( dateA.getTime() - dateB.getTime() ) / dayMs );
		},

		_zeroDay: function( date )
		{
			date = new Date( date.getTime() );

			date.setHours( 0 );
			date.setMinutes( 0 );
			date.setSeconds( 0 );
			date.setMilliseconds( 0 );

			return date;
		},

		_getNextOffset: function( offset, interval )
		{
			if ( interval === 0 )
				return offset;

			if ( !this.options.skipEventlessDays )
				return offset + interval;

			do
			{
				offset += interval;

				if ( offset === this._todaysOffset() )
					break;

				if ( offset < this._events.min || offset > this._events.max )
					break;
			}
			while ( !this._events[ offset ] );

			return offset;
		},

		_todaysOffset: function()
		{
			return this._daysDifference( new Date(), this._baseDate );
		},

		_getNearestValidOffset: function( date )
		{
			date = this._zeroDay( date );

			var offset = this._daysDifference( date, this._baseDate );

			if ( !this.options.skipEventlessDays )
				return offset;

			var found = false;
			var i = 0;
			while( !found )
			{
				if ( ( offset + i ) > this._events.max && ( offset - i ) < this._events.min )
				{
					found = true;
					offset = 0;
				}
				else if ( this._events[ offset + i ] )
				{
					found = true;
					offset = offset + i;
				}
				else if ( this._events[ offset - i ] )
				{
					found = true;
					offset = offset - i;
				}

				i++;
			}

			return offset;
		},

		_buttonize: function( element )
		{
			element
				.addClass( 'ui-state-default ui-widget-content' )
				.hover( function()
				{
					if ( element.is( '.ui-state-disabled' ) )
						return;

					element.removeClass( 'ui-state-default' );
					element.addClass( 'ui-state-hover' );
				},
				function()
				{
					element.addClass( 'ui-state-default' );
					element.removeClass( 'ui-state-hover' );
				});
		},

		_onBeforeSelect: function( date )
		{
			return this._trigger( 'beforeselect', null, { date: date } ) !== false;
		},

		_onSelect: function( date )
		{
			return this._trigger( 'select', null, { date: date } ) !== false;
		},

		_destroy: function()
		{
			$( document ).off( 'click', this._clickHandler );
		}
	});

}( jQuery ) );