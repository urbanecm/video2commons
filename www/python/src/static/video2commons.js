( function( $ ) {
	'use strict';

	var loaderImage = '<img alt="File:Ajax-loader.gif" src="//upload.wikimedia.org/wikipedia/commons/d/de/Ajax-loader.gif" data-file-width="32" data-file-height="32" height="32" width="32">';

	var htmlContent = {
		removebutton: '<button type="button" class="btn btn-danger btn-xs pull-right"><span class="glyphicon glyphicon-trash"></span> ' + window.labels.remove + '</button>',
		restartbutton: '<button type="button" class="btn btn-warning btn-xs pull-right"><span class="glyphicon glyphicon-repeat"></span> ' + window.labels.restart + '</button>',
		loading: '<center>' + loaderImage + '&nbsp;&nbsp;' + window.labels.loading + '...</center>',
		errorGeneric: '<div class="alert alert-danger">' + window.labels.errorGeneric + '.</div>',
		yourTasks: '<div class="container" id="content"><h4>' + window.labels.yourTasks + ':</h4><table id="tasktable" class="table"><tbody></tbody></table></div>',
		addTask: '<input class="btn btn-primary btn-success btn-md" type="button" accesskey="n" value="' + window.labels.addTask + '...">',
		requestServerSide: '<a class="btn btn-primary btn-success btn-md pull-right disabled" id="ssubtn">' + window.labels.createServerSide + '</a>',
		progressbar: '<div class="progress"><div class="progress-bar" role="progressbar"></div></div>'
	};

	var video2commons = window.video2commons = {};


	video2commons.init = function() {
		$( '#content' )
			.html( htmlContent.loading );
		video2commons.checkStatus();
	};

	video2commons.checkStatus = function() {
		if ( window.lastStatusCheck )
			clearTimeout( window.lastStatusCheck );
		var url = 'api/status';
		$.get( url )
			.done( function( data ) {
				if ( !$( '#tasktable' )
					.length ) video2commons.setupTables();
				video2commons.populateResults( data );
				window.lastStatusCheck = setTimeout( video2commons.checkStatus, ( data.hasrunning ) ? 5000 : 60000 );
			} )
			.fail( function() {
				$( '#content' )
					.html( htmlContent.genericError );
			} );
	};

	video2commons.setupTables = function() {
		$( '#content' )
			.html( htmlContent.yourTasks );
		var addButton = $( htmlContent.addTask );
		$( '#content' )
			.append( addButton );
		addButton.click( function() {
			video2commons.addTask();
		} );
		var ssuButton = $( htmlContent.requestServerSide );
		$( '#content' )
			.append( ssuButton.hide() );
	};

	video2commons.setProgressBar = function( item, progress ) {
		var bar = item.find( '.progress-bar' );
		if ( progress < 0 ) {
			bar.addClass( 'progress-bar-striped active' )
				.addClass( 'active' )
				.text( '' );
			progress = 100;
		} else {
			bar.removeClass( 'progress-bar-striped active' )
				.text( progress + '%' );
		}

		bar.attr( {
			"aria-valuenow": progress,
			"aria-valuemin": "0",
			"aria-valuemax": "100",
			style: "width:" + progress + "%"
		} );
	};

	video2commons.getTaskIDFromDOMID = function( id ) {
		var result = /^(?:task-)?(.+?)(?:-(?:title|statustext|progress|removebutton|restartbutton))?$/.exec( id );
		return result[ 1 ];
	};

	video2commons.populateResults = function( data ) {
		var table = $( '#tasktable > tbody' );

		$( '#task-new' )
			.remove();

		// remove extras
		table.find( '> tr' )
			.each( function() {
				var row = $( this ),
					id = video2commons.getTaskIDFromDOMID( row.attr( 'id' ) );
				if ( data.ids.indexOf( id ) < 0 ) {
					row.remove();
				}
			} );

		// add & update others
		$.each( data.values, function( i, val ) {
			var id = 'task-' + val.id,
				row = $( '#' + id ),
				setup = false;
			if ( !row.length ) {
				row = $( '<tr />' );
				row.attr( {
					id: id,
					status: val.status
				} );
				table.append( row );
				setup = true;
			} else if ( row.attr( 'status' ) !== val.status ) {
				row.html( '' );
				setup = true;
			}

			var removebutton; // to make JSHint happy

			if ( setup ) {
				switch ( val.status ) {
					case 'progress':
						row.append( $( '<td />' )
								.attr( 'id', id + '-title' )
								.attr( 'width', '30%' ) )
							.append( $( '<td />' )
								.attr( 'id', id + '-status' )
								.attr( 'width', '40%' )
								.append( $( '<span />' )
									.attr( 'id', id + '-statustext' ) ) )
							.append( $( '<td />' )
								.attr( 'id', id + '-progress' )
								.attr( 'width', '30%' ) );
						var progressbar = row.find( '#' + id + '-progress' )
							.html( htmlContent.progressbar );
						video2commons.setProgressBar( progressbar, -1 );
						row.removeClass( 'success danger' );
						break;
					case 'done':

						removebutton = video2commons.removebutton( this, id );
						video2commons.appendButtoms(
							[ removebutton ],
							row, [ 'danger', 'success' ],
							id
						);
						break;
					case 'fail':

						removebutton = video2commons.removebutton( this, id );
						var restartbutton = $( htmlContent.restartbuttom )
							.attr( 'id', id + '-restartbutton' )
							.hide();

						video2commons.appendButtoms(
							[ removebutton, restartbutton ],
							row, [ 'success', 'danger' ],
							id
						);
						break;
					case 'needssu':

						removebutton = video2commons.removebutton( this, id );
						var uploadlink = $( window.labels.requestServerSide )
							.attr( 'href', val.url );

						video2commons.appendButtoms(
							[ uploadlink, removebutton ],
							row, [ 'success', 'danger' ],
							id
						);
						break;
				}

				row.attr( 'status', val.status );
			}

			row.find( '#' + id + '-title' )
				.text( val.title );
			if ( val.status === 'done' ) {
				row.find( '#' + id + '-statustext' )
					.html( window.labels.taskDone + ' <a></a>.' )
					.find( 'a' )
					.attr( 'href', val.url )
					.text( val.text );
			} else if ( val.status === 'needssu' ) {
				row.find( '#' + id + '-statustext' )
					.html( window.labels.errorTooLarge )
					.find( 'a' )
					.attr( 'href', val.url );
			} else if ( val.status === 'fail' ) {
				row.find( '#' + id + '-statustext' )
					.text( val.text );
				if ( val.restartable ) {
					row.find( '#' + id + '-restartbutton' )
						.show()
						.off()
						.click( function() {
							$( this )
								.addClass( 'disabled' );
							video2commons.restartTask( video2commons.getTaskIDFromDOMID( $( this )
								.attr( 'id' ) ) );
						} );
				} else {
					row.find( '#' + id + '-restartbutton' )
						.off()
						.hide();
				}
			} else {
				row.find( '#' + id + '-statustext' )
					.text( val.text );
			}

			if ( val.status === 'progress' )
				video2commons.setProgressBar( row.find( '#' + id + '-progress' ), val.progress );
		} );

		if ( data.ssulink ) {
			$( '#ssubtn' )
				.removeClass( 'disabled' )
				.show()
				.attr( 'href', data.ssulink );
		} else {
			$( '#ssubtn' )
				.addClass( 'disabled' )
				.hide();
		}
	};

	video2commons.addTask = function() {
		if ( !window.addTaskDialog ) {
			//addTask.html
			$.get( 'static/html/addTask.min.html' )
				.success( function( data ) {
					window.addTaskDialog = $( '<div>' )
						.html( data );

					window.addTaskDialog.addClass( 'modal fade' )
						.attr( {
							id: 'addTaskDialog',
							role: 'dialog'
						} );
					$( 'body' )
						.append( window.addTaskDialog );

					// HACK
					window.addTaskDialog.find( '.modal-body' )
						.keypress( function( e ) {
							if ( ( e.which || e.keyCode ) === 13 &&
								!( $( ':focus' )
									.is( 'textarea' ) ) ) {
								window.addTaskDialog.find( '.modal-footer #btn-next' )
									.click();
								e.preventDefault();
							}
						} );


					video2commons.openTaskModal();

				} );

		} else // It's not redundant because Ajax load
			video2commons.openTaskModal();
	};

	video2commons.newTask = function() {
		var url = 'api/task/new';
		$.post( url )
			.done( function( data ) {
				window.newTaskTempID = data.id;
				video2commons.setupAddTaskDialog( data );
			} )
			.fail( function() {
				window.addTaskDialog.html( htmlContent.errorGeneric );
			} );
	};

	video2commons.setupAddTaskDialog = function( data ) {
		window.addTaskDialog.find( '#dialog-spinner' )
			.hide();
		if ( data.step !== 'error' )
			window.addTaskStep = data.step;
		switch ( data.step ) {
			case 'error':
				if ( !window.addTaskDialog.find( '.modal-body #dialog-errorbox' )
					.length ) {
					window.addTaskDialog.find( '.modal-body' )
						.append(
							$( '<div class="alert alert-danger" id="dialog-errorbox"></div>' )
						);
				}
				window.addTaskDialog.find( '.modal-body #dialog-errorbox' )
					.text( 'Error: ' + data.error )
					.show();
				break;
			case 'source':
				//sourceForm.html
				$.get( 'static/html/sourceForm.min.html' )
					.success( function( dataHtml ) {
						window.addTaskDialog.find( '.modal-body' )
							.html( dataHtml );

						window.addTaskDialog.find( '#url' )
							.val( data.url )
							.focus();
						window.addTaskDialog.find( '#video' )
							.prop( 'checked', data.video );
						window.addTaskDialog.find( '#audio' )
							.prop( 'checked', data.audio );
						window.addTaskDialog.find( '#subtitles' )
							.prop( 'checked', data.subtitles );
					} );
				break;
			case 'target':
				//targetForm.html
				$.get( 'static/html/targetForm.min.html' )
					.success( function( dataHtml ) {

						window.addTaskDialog.find( '.modal-body' )
							.html( dataHtml );

						window.addTaskDialog.find( '#filename' )
							.val( data.filename )
							.focus();
						$.each( data.formats, function( i, desc ) {
							window.addTaskDialog.find( '#format' )
								.append( $( '<option></option>' )
									.text( desc ) );
						} );
						window.addTaskDialog.find( '#format' )
							.val( data.format );
						window.addTaskDialog.find( '#filedesc' )
							.val( data.filedesc );
					} );


				break;
			case 'confirm':
				//confirmForm.html
				$.get( 'static/html/confirmForm.min.html' )
					.success( function( dataHtml ) {

						window.addTaskDialog.find( '.modal-body' )
							.html( dataHtml );

						video2commons.setText( [
							'url',
							'extractor',
							'keep',
							'filename',
							'format'
						], data );

						window.addTaskDialog.find( '#filedesc' )
							.val( data.filedesc );

						window.addTaskDialog.find( '#btn-next' )
							.focus();
					} );
		}

		switch ( window.addTaskStep ) {
			case 'source':
				window.addTaskDialog.find( '#btn-prev' )
					.addClass( 'disabled' )
					.off();
				window.addTaskDialog.find( '#btn-next' )
					.removeClass( 'disabled' )
					.html( window.labels.next + ' <span class="glyphicon glyphicon-chevron-right"></span>' )
					.off();
				window.addTaskDialog.find( '#btn-next' )
					.click( function() {

						video2commons.disablePrevNext();

						window.addTaskDialog.find( '#dialog-spinner' )
							.show();
						var postdata = {
							id: window.newTaskTempID,
							action: 'next',
							step: window.addTaskStep,
							url: window.addTaskDialog.find( '#url' )
								.val(),
							video: window.addTaskDialog.find( '#video' )
								.is( ":checked" ),
							audio: window.addTaskDialog.find( '#audio' )
								.is( ":checked" ),
							subtitles: window.addTaskDialog.find( '#subtitles' )
								.is( ":checked" )
						};

						video2commons.submitTask( postdata );
					} );
				break;
			case 'target':
				window.addTaskDialog.find( '#btn-prev' )
					.removeClass( 'disabled' )
					.off();
				window.addTaskDialog.find( '#btn-next' )
					.removeClass( 'disabled' )
					.html( window.labels.next + 't <span class="glyphicon glyphicon-chevron-right"></span>' )
					.off();

				video2commons.addTargetDialog( 'prev' );
				video2commons.addTargetDialog( 'next' );
				break;
			case 'confirm':
				window.addTaskDialog.find( '#btn-prev' )
					.removeClass( 'disabled' )
					.off();
				window.addTaskDialog.find( '#btn-next' )
					.removeClass( 'disabled' )
					.html( window.labels.confirm + ' <span class="glyphicon glyphicon-ok"></span>' )
					.off();
				window.addTaskDialog.find( '#btn-prev' )
					.click( function() {
						video2commons.disablePrevNext();

						window.addTaskDialog.find( '#dialog-spinner' )
							.show();
						var postdata = {
							id: window.newTaskTempID,
							action: 'prev',
							step: window.addTaskStep
						};

						video2commons.submitTask( postdata );

					} );
				window.addTaskDialog.find( '#btn-next' )
					.click( function() {
						video2commons.disablePrevNext();

						window.addTaskDialog.modal( "hide" );
						$( '#tasktable > tbody' )
							.append( '<tr id="task-new"><td colspan="3">' + loaderImage + '</td></tr>' );
						var postdata = {
							id: window.newTaskTempID,
							action: 'next',
							step: window.addTaskStep
						};

						$.post( 'api/task/submit', postdata )
							.done( function( data ) {
								if ( data.error )
									window.alert( data.error );
								video2commons.checkStatus();
							} );
					} );
		}
	};

	video2commons.removeTask = function( taskid ) {
		video2commons.eventTask( taskid, 'remove' );
	};

	video2commons.restartTask = function( taskid ) {
		video2commons.eventTask( taskid, 'restart' );
	};

	video2commons.eventTask = function( taskid, eventName ) {
		$.post( 'api/task/' + eventName, {
				id: taskid
			} )
			.done( function( data ) {
				if ( data.error )
					window.alert( data.error );
				video2commons.checkStatus();
			} );
	};

	video2commons.setText = function( arr, data ) {
		for ( var i = 0; i < arr.length; i++ )
			window.addTaskDialog.find( '#' + arr[ i ] )
			.text( data[ arr[ i ] ] );
	};

	video2commons.getPostData = function( action ) {
		return {
			id: window.newTaskTempID,
			action: action,
			step: window.addTaskStep,
			filename: window.addTaskDialog.find( '#filename' )
				.val(),
			format: window.addTaskDialog.find( '#format' )
				.val(),
			filedesc: window.addTaskDialog.find( '#filedesc' )
				.val()
		};
	};

	video2commons.submitTask = function( postdata ) {
		$.post( 'api/task/submit', postdata )
			.done( function( data ) {
				if ( data.error )
					window.alert( data.error );
				video2commons.setupAddTaskDialog( data );
			} );
	};

	video2commons.addTargetDialog = function( type ) {

		window.addTaskDialog.find( '#btn-' + type )
			.click( function() {
				window.addTaskDialog.find( '.modal-body #dialog-errorbox' )
					.hide();
				window.addTaskDialog.find( '#btn-prev' )
					.addClass( 'disabled' )
					.off();
				window.addTaskDialog.find( '#btn-next' )
					.addClass( 'disabled' )
					.off();
				window.addTaskDialog.find( '#dialog-spinner' )
					.show();

				video2commons.submitTask( video2commons.getPostData( type ) );

			} );
	};

	video2commons.disablePrevNext = function() {
		window.addTaskDialog.find( '.modal-body #dialog-errorbox' )
			.hide();
		window.addTaskDialog.find( '#btn-prev' )
			.addClass( 'disabled' )
			.off();
		window.addTaskDialog.find( '#btn-next' )
			.addClass( 'disabled' )
			.off();
	};

	video2commons.removeButtomClick = function( obj ) {
		return function() {
			$( obj )
				.addClass( 'disabled' );
			video2commons.removeTask( video2commons.getTaskIDFromDOMID( $( obj )
				.attr( 'id' ) ) );
		};
	};

	video2commons.removebutton = function( obj, id ) {
		return $( htmlContent.removebutton )
			.attr( 'id', id + '-removebutton' )
			.off()
			.click( video2commons.removeButtomClick( obj ) );
	};

	video2commons.appendButtoms = function( buttomArray, row, type, id ) {
		row.append( $( '<td />' )
			.attr( 'id', id + '-title' )
			.attr( 'width', '30%' ) );

		var butoms = $( '<td />' )
			.attr( 'id', id + '-status' )
			.attr( 'width', '70%' )
			.attr( 'colspan', '2' )
			.append( $( '<span />' )
				.attr( 'id', id + '-statustext' ) )
			.append( buttomArray[ 0 ] );

		for ( var i = 1; i < buttomArray.length; i++ )

			butoms.append( buttomArray[ i ] );

		row.append( butoms )
			.removeClass( type[ 0 ] )
			.addClass( type[ 1 ] );

		//return row;
	};

	video2commons.openTaskModal = function() {
		window.addTaskDialog.find( '#dialog-spinner' )
			.hide();
		window.addTaskDialog.find( '.modal-body' )
			.html( '<center>' + loaderImage + '</center>' );

		video2commons.newTask();
		window.addTaskDialog.modal();

		// HACK
		window.addTaskDialog.on( 'shown.bs.modal', function() {
			window.addTaskDialog.find( '#url' )
				.focus();
		} );
	};

	$( document )
		.ready( function() {
			video2commons.init();
		} );
}( jQuery ) );
