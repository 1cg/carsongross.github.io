'use strict';

var ScheduleTable = require('bonzi-table').Schedules.Table;
var React = window.React;
var ReactDOM = window.ReactDOM;
var rows = window.SERVER.games;
var clubs = window.SERVER.clubs;
var divisions = window.SERVER.divisions;
var ageGroups = window.SERVER.ageGroups;
var isLeague = window.SERVER.isLeague;
var eventName = window.SERVER.eventName;
var regEvents = window.SERVER.regEvents;
var partialGames = window.SERVER.partialGames;
var $ = window.$;

ReactDOM.render(
	<ScheduleTable
		rows={rows}
		clubs={clubs}
		divisions={divisions}
		ageGroups={ageGroups}
		isLeague={isLeague}
		eventName={eventName}
		regEvents={regEvents}
		partialGames={partialGames}
	/>,
	document.getElementById('schedule-games')
);

$('.table-download')
	.addClass('standings-action-icon')
	.addClass('standings-download-icon');

$('.game-list-table').on('click', '.jerseycolorsmall', function() {
	if (!$(this).data( 'jersey-init')) {
		$(this).data('jersey-init', true);
		var icons = $(this).children('.jerseyicons')
			.clone()
			.css('display', 'block')
			.children('.widget')
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
	setTimeout(function() {
		$(self).tstooltip('show');
	});
});