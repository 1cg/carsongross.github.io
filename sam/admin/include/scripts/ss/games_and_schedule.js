/* global gLinkPrefix */
(function( base64_encode ){

$(document).ready(function()
{
	"use strict";

	var iFrame = false;

	if ( window.self !== window.top )
		iFrame = true;

	if ( iFrame )
	{
		$( '.game-list-table a, .standings-table a' )
			.attr( 'target', '_blank' );
	}

	var division = $('[name="divisionID"]').val();
	var playerSect = '';
	var playerTitle = '';

	if (division) {
		playerSect = 'topten';
		playerTitle = 'Top Ten Players';
	} else {
		playerSect = 'topscorers';
		playerTitle = 'Top Scorers';
	}

	$( '.game-list-table' ).datescrollertable();
	$( '.standings-table' ).wrap( '<div class="standings-wrapper"/>' );
	$( '.path-header' )
		.append( $( '.path-header' )
			.children().get().reverse() )
		.breadcrumb()
		.find( 'li[data-id]' )
		.css(
		{
			cursor: 'pointer',
			'text-decoration': 'underline'
		})
		.click( function()
		{
			document.location = gLinkPrefix + '/sam/standings/ss/schedule.php?containerID=' + $(this).attr( 'data-id' );
		});

	$( '.game-list-table' ).on( 'click', '.jerseycolorsmall', function()
	{
		if ( !$(this).data( 'jersey-init' ) )
		{
			$(this).data( 'jersey-init', true );
			var icons = $(this).children( '.jerseyicons' )
				.clone()
				.css( 'display', 'block' )
				.children( '.widget' )
					.jerseycolorpicker({
						editable: false
					})
					.end();

			$(this).tstooltip({
				content: icons,
				autoShow: false,
				width: ''
			});

		}

		var self = this;
		setTimeout( function()
		{
			$(self).tstooltip( 'show' );
		});
	});

	if ( $( '.standings-header-score-entry' ).length === 0 )
	{
		$( '<span/>' )
			.addClass( 'standings-action-icon')
			.addClass( 'standings-print-icon' )
			.attr(
			{
				title: 'Print'
			})
			.appendTo( '.standings-header' )
			.click(function()
			{
				var form = $("#pform");
				var opts = 	{
					title: 'Print Options',
					button: 'Print',
					standings: !!$(this).parents('.standings-header-standings').length,
					schedule: !!$(this).parents('.standings-header-schedule').length,
					bracket: !!$(this).parents('.standings-header-bracket').length
				};
				opts[playerSect] = !!$(this).parents('.standings-header-' + playerSect).length;

				download(form, opts);

				return false;
			});

		$( '<span/>' )
			.addClass( 'standings-action-icon')
			.addClass( 'standings-download-icon' )
			.attr(
			{
				title: 'Download'
			})
			.appendTo( '.standings-header' )
			.click(function()
			{
				var form = $("#cform");

				if ($(this).closest('.standings-header-standings').length) {
					form.find('[name="standings"]').val(1);
					form.find('[name="' + playerSect + '"]').val(0);
					form.find('[name="schedule"]').val(0);
					form.find('[name="bracket"]').val(0);
				} else if ($(this).closest('.standings-header-' + playerSect).length) {
					form.find('[name="standings"]').val(0);
					form.find('[name="' + playerSect + '"]').val(1);
					form.find('[name="schedule"]').val(0);
					form.find( '[name="bracket"]').val(0);
				} else if ($(this).closest('.standings-header-schedule').length) {
					form.find('[name="standings"]').val(0);
					form.find('[name="' + playerSect + '"]').val(0);
					form.find('[name="schedule"]').val(1);
					form.find('[name="bracket"]').val(0);
				} else if ($(this).closest('.standings-header-bracket').length) {
					form.find('[name="standings"]').val(0);
					form.find('[name="' + playerSect + '"]').val(0);
					form.find('[name="schedule"]').val(0);
					form.find('[name="bracket"]').val(1);
				}

				form.submit();

				return false;
			});
	}
	else
	{
		$( '.game-list-table button' ).button();
		$( '.game-list-table' ).on( 'click', 'button', function()
		{
			var scoreWindow;
			switch( $(this).attr( 'name' ) )
			{
			case 'gdr':
				scoreWindow = window.open( 'gameRosterEdit.php?eventid=' + $(this).attr('data-gameid') +
					'&teamid=' + $('#teamid').val() +
					'&regeventid=' + $('#regeventid').val() +
					'&sig=' + $('#sig').val()/*, null, "scrollbars=1,height=800,width=600"*/ );
				scoreWindow.submitCallback = function()
				{
					window.location.reload();
				};
				break;
			case 'score':
				window.open( 'enter_scores.php?eventid=' + $(this).attr('data-gameid') +
					'&teamid=' + $('#teamid').val() +
					'&regeventid=' + $('#regeventid').val() +
					'&sig=' + $('#sig').val(), null, "scrollbars=1,height=800,width=700" );

				localStorage.removeItem( 'refresh' );
				watchStorageValue( 'refresh', function( val )
				{
					if ( val )
					{
						localStorage.removeItem( 'refresh' );
						window.location.reload();
					}
				});
				break;
			case 'pitchreport':
				scoreWindow = window.open( window.gLinkPrefix + '/sam/admin/reports/pitch_count.php?containerId=' + base64_encode( $('#teamid').val() ) +
					'&hash=' + $('#sig').val()/*, null, "scrollbars=1,height=800,width=600"*/ );
				scoreWindow.submitCallback = function()
				{
					window.location.reload();
				};
				break;
			}
		});

		$( 'div.collapsible' ).prev().click( function ()
		{
			if ( $(this).next().is( ':visible' ) )
			{
				$(this).find( '.ui-icon' ).removeClass( 'ui-icon-triangle-1-s' ).addClass( 'ui-icon-triangle-1-e' );
				$(this).next().hide();
			}
			else
			{
				$(this).find( '.ui-icon' ).removeClass( 'ui-icon-triangle-1-e' ).addClass( 'ui-icon-triangle-1-s' );
				$(this).next().show();
			}
		});
		$( '.game-list-table .game-list-score-entry > button.played' ).prop( 'disabled', true ).addClass( 'ui-state-disabled' )
			.attr( 'title', 'This game already has a score entered. Contact the administrator if this score needs to be changed.' );
		$( '.game-list-table' ).datescrollertable( 'scrollTo', $( '.game-list-table .game-list-score-entry > button:not(.played)' ).eq(0));
	}

	function download( form, options )
	{
		options = options || {};

		var dialog = $('<div/>')
			.css(
			{
				padding: 10
			})
		;

		var standings = $('<input id="include-standings" type="checkbox">');
		var players = $('<input id="include-' + playerSect + '" type="checkbox">');
		var schedule = $('<input id="include-schedule" type="checkbox">');
		var bracket = $('<input id="include-bracket" type="checkbox">');

		if (options.standings) {
			standings.attr('checked', 'checked');
		}
		if (options[playerSect]) {
			players.attr('checked', 'checked');
		}
		if (options.schedule) {
			schedule.attr('checked', 'checked');
		}
		if (options.bracket) {
			bracket.attr('checked', 'checked');
		}

		$('<span/>')
			.css(
			{
				'margin-left': '20px'
			})
			.append('Include')
			.appendTo(dialog);

		var list = $('<ul/>')
			.css(
			{
				'list-style': 'none',
				padding: 0,
				margin: 0,
				'margin-left': '20px',
				'margin-top': '10px'
			})
			.appendTo(dialog);

		$('<li/>')
			.append(standings)
			.append($('<label for="include-standings"/>')
				.append('Standings')
			)
			.appendTo(list)
		;
		$('<li/>')
			.append(players)
			.append($('<label for="include-' + playerSect + '"/>')
				.append(playerTitle)
			)
			.appendTo(list)
		;
		$('<li/>')
			.append(schedule)
			.append($('<label for="include-schedule"/>')
				.append('Schedule')
			)
			.appendTo(list)
		;
		$( '<li/>' )
			.append(bracket)
			.append($('<label for="include-bracket"/>')
				.append('Bracket Schedule')
			)
			.appendTo(list)
		;

		dialog
			.dialog(
			{
				title: options.title,
				modal: true,
				buttons:
				[
					{
						text: options.button,
						click: function()
						{
							form.find( '[name="standings"]' ).val( standings.is( ':checked' ) ? 1 : 0 );
							form.find( '[name="schedule"]' ).val( schedule.is( ':checked' ) ? 1 : 0 );
							form.find('[name="bracket"]').val(bracket.is(':checked') ? 1 : 0);
							form.find('[name="' + playerSect + '"]').val(players.is(':checked') ? 1 : 0);

							form.submit();
							$(this).dialog( 'close' );
						}
					}
				],
				close: function()
				{
					$(this).remove();
				}
			});
	}

	function watchStorageValue( name, callback, interval )
	{
		interval = interval || 500;
		var id = '_dumb_' + name,
			init = localStorage.getItem( name );

		if ( !window[ id ] )
		{
			window[ id ] = {
				cb: []
			};

			setTimeout( function checker_interval()
			{
				var val = localStorage.getItem( name );
				if ( val === init )
				{
					setTimeout( checker_interval, interval );
				}
				else
				{
					trigger( val );
				}
			}, interval );
		}

		window[ id ].cb.push( callback );

		function trigger( val )
		{
			var cb = window[ id ].cb;
			window[ id ] = null;	//IE8 doesn't support deleting from window. WHAT IS WRONG WITH THEM?
			for ( var i = 0; i < cb.length; i++ )
			{
				callback( val );
			}
		}
	}

});

}( window.base64_encode ));
