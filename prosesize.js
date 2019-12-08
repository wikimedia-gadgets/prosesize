/*  _____________________________________________________________________________
 * |                                                                             |
 * |                    === WARNING: GLOBAL GADGET FILE ===                      |
 * |                  Changes to this page affect many users.                    |
 * | Please discuss changes on the talk page or on [[WT:Gadget]] before editing. |
 * |_____________________________________________________________________________|
 *
 */
/**
 * Prosesize
 * Documentation at [[Wikipedia:Prosesize]]
 * Rewrite of [[User:Dr_pda/prosesize.js]].
*/
'use strict';
( function () {
	function sizeFormatter( size ) {
		if ( size > 10240 ) {
			return ( Math.round( size / 1024 ) + '&nbsp;kB' );
		} else {
			return ( size + '&nbsp;B' );
		}
	}

	function sizeElement( id, text, size, extraText ) {
		return $( '<li>' )
			.prop( 'id', id )
			.append( $( '<b>' ).text( text ) )
			.append( ' ' + sizeFormatter( size ) + ( extraText || '' ) );
	}

	function getRevisionSize( proseValue ) {
		var Api = new mw.Api();
		function appendResult( size ) {
			var wikiValue = sizeElement( 'wiki-size', 'Wiki text:', size );
			proseValue.before( wikiValue );
		}
		if ( mw.config.get( 'wgAction' ) === 'submit' ) {
			// Get size of text in edit box
			// eslint-disable-next-line no-jquery/no-global-selector
			appendResult( $( '#wpTextbox1' ).textSelection( 'getContents' ).length );
		} else if ( mw.config.get( 'wgIsArticle' ) ) {
			// Get revision size from API
			Api.get( {
				action: 'query',
				prop: 'revisions',
				rvprop: 'size',
				revids: mw.config.get( 'wgRevisionId' ),
				formatversion: 2
			} ).then( function ( result ) {
				appendResult( result.query.pages[ 0 ].revisions[ 0 ].size );
			} );
		}
	}

	function getFileSize( proseHtmlValue ) {
		// HTML document size not well defined for preview mode or section edit
		if ( mw.config.get( 'wgAction' ) !== 'submit' ) {
			$.get( location ).then( function ( result ) {
				var fsize = sizeElement( 'total-size', 'HTML document size:', result.length );
				proseHtmlValue.before( fsize );
			} );
		}
	}

	function getLength( id ) {
		var i;
		var textLength = 0;
		for ( i = 0; i < id.childNodes.length; i++ ) {
			if ( id.childNodes[ i ].nodeType === Node.TEXT_NODE ) {
				textLength += id.childNodes[ i ].nodeValue.length;
			} else if (
				id.childNodes[ i ].nodeType === Node.ELEMENT_NODE &&
				( id.childNodes[ i ].id === 'coordinates' || id.childNodes[ i ].className.indexOf( 'emplate' ) !== -1 )
			) {
				// special case for {{coord}} and {{fact}}-like templates
				// Exclude from length, and don't set background yellow
				id.childNodes[ i ].className += ' prosesize-special-template';
			} else {
				textLength += getLength( id.childNodes[ i ] );
			}
		}
		return textLength;
	}

	function getRefMarkLength( id, html ) {
		var i;
		var textLength = 0;
		for ( i = 0; i < id.childNodes.length; i++ ) {
			if (
				id.childNodes[ i ].nodeType === Node.ELEMENT_NODE &&
				id.childNodes[ i ].className === 'reference'
			) {
				textLength += ( html ) ?
					id.childNodes[ i ].innerHTML.length :
					getLength( id.childNodes[ i ] );
			}
		}
		return textLength;
	}

	function main() {
		var proseValue, refValue, refHtmlValue, proseHtmlValue;
		// eslint-disable-next-line no-jquery/no-global-selector
		var parserOutput = $( '.mw-parser-output' );
		// eslint-disable-next-line no-jquery/no-global-selector
		var prevStats = $( '#document-size-stats' );
		// eslint-disable-next-line no-jquery/no-global-selector
		var prevHeader = $( '#document-size-header' );
		var proseSize = 0;
		var proseSizeHtml = 0;
		var refmarksize = 0;
		var refmarkSizeHtml = 0;
		var wordCount = 0;
		var refSize = 0;
		var refSizeHtml = 0;
		var header = $( '<span>' )
			.prop( 'id', 'document-size-header' )
			.html( 'Document statistics <small>(<a href="//en.wikipedia.org/wiki/Wikipedia:Prosesize">more information</a>)</small>:' );
		var output = $( '<ul>' )
			.prop( 'id', 'document-size-stats' );
		var combined = $( '<div>' )
			.prop( 'id', 'document-size' )
			.append( header, output );
		if ( parserOutput.length === 0 ) {
			return;
		}
		if ( prevStats.length ) {
			// If statistics already exist, turn them off and remove highlighting
			prevStats.remove();
			prevHeader.remove();
			parserOutput.children( 'p' ).removeClass( 'prosesize-highlight' );
		} else {
			// Calculate prose size and size of reference markers ([1] etc)
			parserOutput.children( 'p' ).each( function () {
				$( this ).addClass( 'prosesize-highlight' );
				proseSize += getLength( this );
				proseSizeHtml += this.innerHTML.length;
				refmarksize += getRefMarkLength( this, false );
				refmarkSizeHtml += getRefMarkLength( this, true );
				wordCount += this.innerHTML.replace( /(<([^>]+)>)/ig, '' ).split( ' ' ).length;
			} );

			// Calculate size of references (i.e. output of <references/>)
			parserOutput.find( 'ol.references' ).each( function () {
				refSize = getLength( this );
				refSizeHtml = this.innerHTML.length;
			} );

			proseValue = sizeElement( 'prose-size', 'Prose size (text only):', proseSize - refmarksize, ' (' + wordCount + ' words) "readable prose size"' );
			refValue = sizeElement( 'ref-size', 'References (text only):', refSize + refmarksize );
			refHtmlValue = sizeElement( 'ref-size-html', 'References (including all HTML code):', refSizeHtml + refmarkSizeHtml );
			proseHtmlValue = sizeElement( 'prose-size-html', 'Prose size (including all HTML code):', proseSizeHtml - refmarkSizeHtml );
			output.append( proseHtmlValue, refHtmlValue, proseValue, refValue );
			parserOutput.prepend( combined );
			getFileSize( proseHtmlValue );
			getRevisionSize( proseValue );
		}
	}

	if (
		!mw.config.get( 'wgCanonicalSpecialPageName' )
	) {
		$.ready.then( function () {
			/**
			 * Depending on whether in edit mode or preview/view mode,
			 * show the approppiate response upon clicking the portlet link
			*/
			var func, $portlet, notEnabled = false;
			if (
				mw.config.get( 'wgAction' ) === 'edit' ||
				( mw.config.get( 'wgAction' ) === 'submit' && document.getElementById( 'wikiDiff' ) )
			) {
				notEnabled = true;
				func = function () {
					mw.notify( 'You need to preview the text for the prose size script to work in edit mode.' );
				};
			} else if ( [ 'view', 'submit', 'historysubmit', 'purge' ].indexOf( mw.config.get( 'wgAction' ) ) !== -1 ) {
				func = main;
			}
			if ( func ) {
				$portlet = $( mw.util.addPortletLink( 'p-tb', '#', 'Page size', 't-page-size', 'Calculate page and prose size' ) );
				if ( notEnabled ) {
					$portlet.addClass( 'prosesize-portlet-link-edit-mode' );
				}
				$portlet.on( 'click', function ( e ) {
					e.preventDefault();
					if ( window.ve && ve.init && ve.init.target && ve.init.target.active ) {
						mw.notify( 'Prosesize does not work with the Visual Editor.' );
					} else {
						func();
					}
				} );
			}
		} );
	}
}() );
