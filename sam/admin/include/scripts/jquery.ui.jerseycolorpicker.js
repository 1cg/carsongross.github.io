/**
 * bonzi.jerseycolorpicker
 * (a jQuery UI plugin)
 *
 * Copyright (c) 2013 Bonzi Sports Software Inc.
 *
 */

(function( $ )
{
    "use strict";
    //tstooltip is an optional jQuery plugin that enables editing.  If it isn't there, editing won't work
    //because the edit form is displayed in the tooltip.
    function tstooltip( el )
    {
        if ( el.tstooltip )
        {
            return el.tstooltip.apply( el, Array.prototype.slice.call( arguments, 1 ) );
        }
    }

    //find out of v is true-y or unspecified.  Unspecified is null for this.
    function notFalse(v)
    {
        return !!v || v === null;
    }

    $.widget( 'bonzi.jerseycolorpicker',
    {
        options: {
            // all the options
            availableColors: [
                { name: 'Black', value: '000000', fg: 'eeeeee' },
                { name: 'Grey', value: '808080', fg: 'ffffff' },
                { name: 'White', value: 'ffffff', fg: '000000' },
                { name: 'Red', value: 'ff0000', fg: '000000' },
                { name: 'Orange', value: 'ffa500', fg: '000000' },
                { name: 'Pink', value: 'ffc0cb', fg: '000000' },
                { name: 'Yellow', value: 'ffff00', fg: '000000' },
                { name: 'Green', value: '008000', fg: 'eeeeee' },
                { name: 'Dark Blue', value: '00008b', fg: 'ffffff' },
                { name: 'Royal Blue', value: '4169e1', fg: 'eeeeee' },
                { name: 'Light Blue', value: 'add8e6', fg: '000000' },
                { name: 'Purple', value: '800080', fg: 'ffffff' }
            ],

            defaultColor: '808080',

            validatecolors: true,

            popupElement: '<div/>',
            popupLocation: 'target',
            pointerPosition: 'center',  //see tstooltip option
            doneButton: '<button name="colorsok">Done</button>',
            doneclicked: null,  //callback - called with this context and a click event
            editable: true,     //just shows the color icons if this is false.
            hideLabels: false,

            iJerseyColorBottom: null,
            iJerseyAwayBottom: null,
            iJerseyAwayTop: null,
            iJerseyPatternTop: null,

            /*
            colors: [
                {name: null, top1: null, top2: null, bottom: null}
            ],
            */
           
            cHomeTopColor1: null,
            cHomeTopColor2: null,
            cHomeBottomColor: null,
            cAwayTopColor1: null,
            cAwayTopColor2: null,
            cAwayBottomColor: null
        },
        _colorKeys: {
            cHomeTopColor1: true,
            cHomeTopColor2: true,
            cHomeBottomColor: true,
            cAwayTopColor1: true,
            cAwayTopColor2: true,
            cAwayBottomColor: true
        },
        _colormap: {},
        _popup: null,
        _origContents: null,
        _nonechosen: null,
        _homeIcons: null,
        _awayIcons: null,
        _cancelColors: null,
        _create: function()
        {
            this._makeColorMap();
            var o = this.options;
            var self = this;
            var popup = $(o.popupElement);
            var formSubmitted = false;    //inter callback communication

            this._readFromDOM(); //read form values out of the DOM first.

            //sanitize the options
            //If you say top pattern is not allowed, the color 2 on top is ignored.
            
            o.cHomeTopColor2 = notFalse( o.iJerseyPatternTop ) && o.cHomeTopColor2;
            o.cAwayTopColor1 = notFalse( o.iJerseyAwayTop ) && o.cAwayTopColor1;
            o.cAwayTopColor2 = notFalse( o.iJerseyAwayTop ) && notFalse( o.iJerseyPatternTop ) && o.cAwayTopColor2;
            o.cHomeBottomColor = notFalse( o.iJerseyColorBottom ) && o.cHomeBottomColor;
            o.cAwayBottomColor = notFalse( o.iJerseyColorBottom ) && notFalse( o.iJerseyAwayBottom ) && o.cAwayBottomColor;

            var showIcons = o.cHomeTopColor1
                            || o.cHomeTopColor2
                            || o.cHomeBottomColor
                            || o.cAwayTopColor1
                            || o.cAwayTopColor2
                            || o.cAwayBottomColor;

            var showAway = o.cAwayTopColor1 || o.cAwayTopColor2 || o.cAwayBottomColor;
            var showHomeLabel = !o.hideLabels && ( showAway || o.iJerseyAwayBottom || o.iJerseyAwayTop );

            this._origContents = $(this.element).children().detach();

            this._popup = popup;

            this.element.addClass( 'jerseycolorpicker' );

            this._groups = $('<div/>')
                .addClass( 'groups' )
                .appendTo( this.element );

            this._homeIcons = this._jerseyIconGroup( showHomeLabel ? 'Home' : '',
                    o.cHomeTopColor1 || o.defaultColor,
                    o.cHomeTopColor2 || o.cHomeTopColor1 || o.defaultColor,
                    o.cHomeBottomColor || o.defaultColor
                )
                .addClass( 'home' )
                .appendTo( this._groups );

            
            this._nonechosen = $('<span class="nonechosen">No uniform colors selected</span>')
                    .appendTo( this._groups );

            this._awayIcons = this._jerseyIconGroup( 'Away',
                    o.cAwayTopColor1 || o.defaultColor,
                    o.cAwayTopColor2 || o.cAwayTopColor1 || o.defaultColor,
                    o.cAwayBottomColor || o.defaultColor
                )
                .addClass( 'away' )
                .appendTo( this._groups );

            if ( showIcons )
            {
                this._nonechosen.hide();
            }
            else if ( !o.editable )
            {
                this._trigger( 'nothingtoshow' );
            }
            else
            {
                this._homeIcons.hide();
            }

            if ( !showIcons || !showAway )
            {
                this._awayIcons.hide();
            }

            if ( o.editable )
            {
                tstooltip( this._groups, {
                    content: popup,
                    appendTo: o.popupLocation,
                    width: '',
                    addClass: 'jersey-colors-tooltip',
                    pointerPosition: this.options.pointerPosition,
                    autoShow: false,
                    hide: function()
                    {
                        if ( formSubmitted )
                            return;

                        if ( self._cancelColors )
                        {
                            for ( var k in self._colorKeys )
                            {
                                if ( self._colorKeys.hasOwnProperty( k ) )
                                        o[ k ] = self._cancelColors[ k ];
                            }
                            self._refreshColorForm();
                            self._cancelColors = null;
                        }
                    }
                });

                this._table = $('<table/>')
                    .appendTo( popup );

                var header = $('<tr/>')
                    .append( '<th>Top</th>' );

                this._thead = $('<thead/>')
                    .append( header )
                    .appendTo( this._table );

                this._tbody = $('<tbody/>')
                    .appendTo( this._table );

                var row = $('<tr/>')
                        .appendTo( this._tbody ),
                    cell1 = $('<td/>')
                        .appendTo( row ),
                    cell2 = $('<td/>')
                        .appendTo( row );

                $('<tr/>')
                    .append( $('<td colspan="2" class="colorsok"/>')
                        .append( o.doneButton ) )
                    .appendTo( this._tbody )
                    .find( 'button' )
                    .click( function( ev )
                    {
                        if ( o.validatecolors && !self._validateColors() )
                        {
                            self._trigger( 'invalidcolors' );
                            ev.preventDefault();
                            return;
                        }

                        formSubmitted = true;

                        tstooltip( $(self._groups), 'hide' );
                        if ( o.doneclicked && o.doneclicked.call( self, ev ) )
                        {
                            $(this).closest( 'form' ).submit();
                        }

                        ev.preventDefault();
                    });

                this._jerseySection({
                        title: 'Home',
                        color1: {name: 'cHomeTopColor1', value: o.cHomeTopColor1 || false },
                        color2: {name: 'cHomeTopColor2', value: o.cHomeTopColor2 || false },
                        pattern: this.options.iJerseyPatternTop
                    })
                    .addClass( 'home' )
                    .appendTo( cell1 );

                if ( this.options.iJerseyAwayTop )
                {
                    this._jerseySection({
                            title: 'Away',
                            color1: {name: 'cAwayTopColor1', value: o.cAwayTopColor1 || false },
                            color2: {name: 'cAwayTopColor2', value: o.cAwayTopColor2 || false },
                            pattern: this.options.iJerseyPatternTop
                        })
                    .addClass( 'away' )
                        .appendTo( cell1 );
                }

                if ( this.options.iJerseyColorBottom )
                {
                    header.append( '<th>Bottom</th>' );
                    
                    this._jerseySection({
                            title: this.options.iJerseyAwayBottom ? 'Home' : '',
                            color1: {name: 'cHomeBottomColor', value: o.cHomeBottomColor || false }
                        }).appendTo( cell2 );

                    if ( this.options.iJerseyAwayBottom )
                    {
                        this._jerseySection({
                            title: 'Away',
                            color1: {name: 'cAwayBottomColor', value: o.cAwayBottomColor || false }
                        }).appendTo( cell2 );
                    }
                }
            }

            var hoverIn = null,
                hoverOut = null,
                clickMsg;
            if ( o.editable )
            {
                clickMsg = $('<span/>')
                    .addClass( 'click-msg' )
                    .text( 'click to edit' )
                    .appendTo( this._groups )
                    .hide();

                this._groups
                    .css( 'cursor', 'pointer' )
                    .click( function()
                    {
                        self._cancelColors = {};
                        formSubmitted = false;
                        for ( var k in self._colorKeys )
                        {
                            if ( self._colorKeys.hasOwnProperty( k ) )
                                self._cancelColors[ k ] = o[ k ];
                        }
                        $(this).tstooltip( 'show' );
                    })
                    .hover( function()
                    {
                        if ( hoverIn )
                            return;

                        if ( hoverOut )
                        {
                            clearTimeout( hoverOut );
                            hoverOut = null;
                        }

                        hoverIn = setTimeout( function()
                        {
                            clickMsg.fadeIn();
                            hoverIn = null;
                        }, 200);

                    }, function()
                    {
                        if ( hoverIn )
                        {
                            clearTimeout( hoverIn );
                            hoverIn = null;
                        }

                        clickMsg.fadeOut();
                    });

            }

            this.refreshColors();
        },

        /**
         * Gets the jersey color options from the DOM, if options are not specified.
         * DOM structure: expects hidden inputs with names that match up with the color options.
         * Any other structure is ignored.
         */
        _readFromDOM: function()
        {
            var colopts = {
                cHomeTopColor1: true,
                cHomeTopColor2: true,
                cHomeBottomColor: true,
                cAwayTopColor1: true,
                cAwayTopColor2: true,
                cAwayBottomColor: true
            };

            var o = this.options;

            $(this.element).find( 'input' ).each( function()
            {
                var name = $(this).attr( 'name' );
                if ( colopts.hasOwnProperty( name ) && o[ name ] === null )
                {
                    o[ name ] = $(this).val();
                }
            });
        },

        getPopup: function()
        {
            return this._popup;
        },

        _jerseyIconGroup: function( title )
        {
            var group = $('<span/>')
                .addClass( 'group' )
                .append( $('<span/>')
                    .addClass( 'subtext' )
                    .text( title )
                    );

            $('<div />')
                .addClass( 'icons' )
                .append( $('<span/>')
                    .addClass( 'top1' ) )
                    //.css( 'background-color', top1 && ('#' + top1 ) || '' ) )
                .append( $('<span/>')
                    .addClass( 'top2' ) )
                    //.css( 'background-color', top2 && ('#' + top2 ) || '' ) )
                .append( $('<span/>')
                    .addClass( 'bottom' ) )
                    //.css( 'background-color', bottom && ('#' + bottom ) || '' ) )
                .prependTo( group );

            return group;
        },

        _colorName: function( color1, color2 )
        {
            color1 = color1 && this._colormap[ color1 ];
            color2 = color2 && this._colormap[ color2 ];

            if ( !color1 )
                return '';

            var name = color1.name;

            if ( color2 )
            {
                name = 'Pattern: ' + name + ' and ' + color2.name;
            }

            return name;
        },

        refreshColors: function()
        {
            var o = this.options;

            this._groups
                .find( '.home .top1' )
                    .attr( 'title', this._colorName( o.cHomeTopColor1, o.cHomeTopColor2 ) )
                    .css( 'background-color', '#' + ( o.cHomeTopColor1 || o.defaultColor ) )
                    .end()
                .find( '.home .top2' )
                    .attr( 'title', this._colorName( o.cHomeTopColor1, o.cHomeTopColor2 ) )
                    .css( 'background-color', '#' + ( o.cHomeTopColor2 || o.cHomeTopColor1 || o.defaultColor ) )
                    .end()
                .find( '.home .bottom' )
                    .attr( 'title', this._colorName( o.cHomeBottomColor ) )
                    .css( 'background-color', '#' + ( o.cHomeBottomColor || o.defaultColor ) )
                    .end()
                .find( '.away .top1' )
                    .attr( 'title', this._colorName( o.cAwayTopColor1, o.cAwayTopColor2 ) )
                    .css( 'background-color', '#' + ( o.cAwayTopColor1 || o.defaultColor ) )
                    .end()
                .find( '.away .top2' )
                    .attr( 'title', this._colorName( o.cAwayTopColor1, o.cAwayTopColor2 ) )
                    .css( 'background-color', '#' + ( o.cAwayTopColor2 || o.cAwayTopColor1 || o.defaultColor ) )
                    .end()
                .find( '.away .bottom' )
                    .attr( 'title', this._colorName( o.cAwayBottomColor ) )
                    .css( 'background-color', '#' + ( o.cAwayBottomColor || o.defaultColor ) )
                    .end();

            //jQuery .hide() and show are broken because they try to "restore" the previous
            //display, ignoring what CSS would do.  So .hide().show() results in an inline
            //display: inline which can't be overridden by a stylesheet.
            this._homeIcons
                .add( this._awayIcons )
                .css( 'display', 'none' );

            this._nonechosen.show();
            if ( o.cHomeTopColor1 || o.cHomeTopColor2 || o.cHomeBottomColor )
            {
                this._nonechosen.css( 'display', 'none' );
                this._homeIcons.css( 'display', '' );
                if ( o.iJerseyAwayBottom || o.iJerseyAwayTop )
                    this._homeIcons.children( '.subtext' ).text( 'Home' );
                else
                    this._homeIcons.children( '.subtext' ).text( '' );
            }

            if ( o.cAwayTopColor1 || o.cAwayTopColor2 || o.cAwayBottomColor )
            {
                this._nonechosen.css( 'display', 'none' );
                this._awayIcons.css( 'display', '' );
            }

        },

        _refreshColorForm: function()
        {
            for ( var k in this._colorKeys )
            {
                if ( this._colorKeys.hasOwnProperty( k ) )
                {
                    $(this._popup).find( '[name=' + k + ']' )
                        .val( this.options[ k ] )
                        .find( '[selected]' )
                            .removeAttr( 'selected' )
                            .end()
                        .find( '[value=' + this.options[ k ] + ']' )
                            .attr( 'selected', 'selected' )
                            .end()
                        .trigger( 'change' );
                }
            }
        },

        _makeColorMap: function()
        {
            this._colormap = {};
            for ( var i = 0; i < this.options.availableColors.length; i++ )
            {
                var color = this.options.availableColors[i];
                this._colormap[ color.value ] = color;
            }
        },

        /**
         *
         * 
         * @param  {object} opts {
         *  title: label for the section,
         *  color1: { name: fieldName, value: color1 },
         *  color2: { name: fieldName2, value: color2 }, //ignored if pattern falsy
         *  pattern: true, false (allow pattern, no allow pattern)
         * }
         * @return {jQuery}
         */
        _jerseySection: function( opts )
        {
            var el = $('<div/>'),
                color1 = $('<label/>')
                    .text( opts.pattern ? 'Color 1' : opts.title )
                    .append( 
                        this._colorChooser( false, opts.color1.value )
                            .attr( 'name', opts.color1.name )
                    ),
                self = this,
                patternchooser,
                color2,
                mocolors;

            if ( opts.pattern )
            {
                patternchooser = this._colorChooser( true, opts.color2.value ? 'pattern' : 'solid' )
                    .attr( 'name', 'mainselect' );

                $('<label />')
                    .text( opts.title || '' )
                    .append( patternchooser )
                    .appendTo( el );        
                
                mocolors = $('<div />')
                    .append( color1 )
                    .appendTo( el );

                color2 = $('<label/>')
                    .text( 'Color 2')
                    .append( 
                        this._colorChooser( false, opts.color2.value )
                            .attr( 'name', opts.color2.name )
                    );

                patternchooser.bind( 'change', function()
                {
                    if ( $(this).val() === 'pattern' )
                    {
                        color2
                            .find( 'option[selected]' )
                                .removeAttr( 'selected' )
                                .end()
                            .val( self.options[ opts.color2.name || opts.color1.name ] )
                            .find( 'option[value=' + self.options[ opts.color2.name || opts.color1.name ] + ']' )
                                .attr( 'selected', 'selected' );

                        color2.appendTo( mocolors );
                        self.options[ opts.color2.name ] = self.options[ opts.color1.name ];
                        color2.find( 'select').change();
                    }
                    else
                    {
                        color2.detach();
                        self.options[ opts.color2.name ] = null;
                        self.refreshColors();
                    }
                }).bind( 'keypress', function(){
                    var thing = this;
                    setTimeout( function(){ $(thing).change(); }, 0 );
                });

                patternchooser.change();
            }
            else
            {
                el.append( color1 );
            }

            return el;
        },

        _colorChooser: function( patternOpt, value )
        {
            var el = $('<select />');
            var self = this;
            var option;

            if ( patternOpt )
            {
                $('<option/>')
                    .text( 'Solid' )
                    .attr( 'value', 'solid' )
                    .appendTo( el );

                option = $('<option/>')
                    .text( 'Pattern' )
                    .attr( 'value', 'pattern' )
                    .appendTo( el );

                if ( value === 'pattern' )
                {
                    option.attr( 'selected', 'selected' );
                    el.val( value );
                }
            }
            else
            {
                el.addClass( 'required' );

                $('<option/>')
                    .text( 'Choose color' )
                    .css({
                        color: '#000000',
                        'background-color': '#cccccc'
                    })
                    .attr( 'value', '' )
                    .attr( 'selected', 'selected' )
                    .appendTo( el );

                for ( var i = 0; i < this.options.availableColors.length; i++ )
                {
                    var color = this.options.availableColors[i];
                    var opt = $('<option />')
                        .text( color.name )
                        .css({
                            'background-color': '#' + color.value,
                            color: color.fg ? '#' + color.fg : ''
                        })
                        .attr( 'value', color.value )
                        .appendTo( el );

                    if ( color.value === value )
                    {
                        el.val( value );
                        opt.attr( 'selected', 'selected' );
                    }
                }

                el.bind( 'change', function()
                {
                    var color = self._colormap[ $(this).val() ] || '';
                    $(this).css({
                        color: color && color.fg ? '#' + color.fg : '',
                        'background-color': color && color.value ? '#' + color.value : ''
                    });

                    if ( $(this).attr( 'name' ) in self.options )
                    {
                        self.options[ $(this).attr( 'name' ) ] = color && color.value || null;
                        self.refreshColors();
                    }
                }).bind( 'keypress', function(){
                    var thing = this;
                    setTimeout( function(){ $(thing).change(); }, 0 );
                });

                el.trigger( 'change' );
            }

            return el;
        },

        _validateColors: function()
        {
            var oneempty = false;
            var anyselected = false;
            $(this._popup).find( 'select.required' )
                .each( function()
                {

                    if ( !$(this).val() )
                        oneempty = true;

                    if ( $(this).val() )
                        anyselected = true;

                    if ( oneempty && anyselected )
                    {
                        return false;
                    }
                });
            return !(oneempty && anyselected);
        },

        _destroy: function()
        {
            $(this.element)
                .empty()
                .removeClass( 'jerseycolorpicker' )
                .append( this._origContents );
        }
    });
}( jQuery ));
