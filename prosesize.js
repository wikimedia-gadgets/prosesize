// rewrite of [[User:Dr_pda/prosesize.js]]
( function () {
	function sizeFormatter( size ) {
		if ( size > 10240 ) {
			return ( ( size / 1024 ).toFixed( 0 ) + '&nbsp;kB' );
		} else {
			return ( size + '&nbsp;B' );
		}
	}

	function sizeElement( id, text, size, extraText ) {
		return $( '<li>' )
			.prop( 'id', id )
			.html( $( '<b>' ).text( text ).append( ' ' + sizeFormatter( size ) + ( extraText || '' ) ) );
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
			appendResult( $( '#wpTextbox1' ).html().length );
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
			}
			);
		}
	}

	function getFileSize( proseHtmlValue ) {
	// File size not well defined for preview mode or section edit
		if ( mw.config.get( 'wgAction' ) !== 'submit' ) {
			$.get( location ).then( function ( result ) {
				var fsize = sizeElement( 'total-size', 'File size:', result.length );
				proseHtmlValue.prepend( fsize );
			} );
		}
	}

	function getLength( id ) {
		var i;
		var textLength = 0;
		for ( i = 0; i < id.childNodes.length; i++ ) {
			if ( id.childNodes[ i ].nodeType === Node.TEXT_NODE ) {
				textLength += id.childNodes[ i ].nodeValue.length;
			} else if ( id.childNodes[ i ].nodeType === Node.ELEMENT_NODE &&
			( id.childNodes[ i ].id === 'coordinates' || id.childNodes[ i ].className.indexOf( 'emplate' ) !== -1 ) ) {
			// special case for {{coord}} and {{fact}}-like templates
			// Exclude from length, and don't set background yellow
				id.childNodes[ i ].addClass( 'prosesize-special-template' );
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
			if ( id.childNodes[ i ].nodeType === Node.ELEMENT_NODE && id.childNodes[ i ].className === 'reference' ) {
				textLength += ( html ) ? id.childNodes[ i ].innerHTML.length : getLength( id.childNodes[ i ] );
			}
		}
		return textLength;
	}

	function main() {
		var proseValue, refValue, refHtmlValue, proseHtmlValue;
		// eslint-disable-next-line no-jquery/no-global-selector
		var bodyContent = $( '.mw-parser-output' );
		// eslint-disable-next-line no-jquery/no-global-selector
		var prevStats = $( 'document-size-stats' );
		var proseSize = 0;
		var proseSizeHtml = 0;
		var refmarksize = 0;
		var refmarkSizeHtml = 0;
		var wordCount = 0;
		var refSize = 0;
		var refSizeHtml = 0;
		var header = $( '<span>' )
			.prop( 'id', 'document-size-header' )
			.html( '<br/>Document statistics: <small><i>(See <a href="//en.wikipedia.org/wiki/Wikipedia:Prosesize">here</a> for details.)<i></small>' );
		var output = $( '<ul>' ).prop( 'id', 'document-size-stats' );
		if ( bodyContent.length === 0 ) {
			return;
		}
		if ( prevStats.length ) {
		// if statistics already exist, turn them off and remove highlighting
			prevStats.remove();
			prevStats.children( 'document-size-header' ).remove();
			bodyContent.children( 'p' ).removeClass( 'prosesize-highlight' );
		} else {
			// Calculate prose size and size of reference markers ([1] etc)

			bodyContent.children( 'p' ).each( function () {
				proseSize += getLength( this );
				proseSizeHtml += this.innerHTML.length;
				refmarksize += getRefMarkLength( this, false );
				refmarkSizeHtml += getRefMarkLength( this, true );
				wordCount += this.innerHTML.replace( /(<([^>]+)>)/ig, '' ).split( ' ' ).length;
				$( this ).addClass( 'prosesize-highlight' );
			} );

			// Calculate size of references (i.e. output of <references/>)
			bodyContent.find( 'ol.references' ).each( function () {
				refSize = getLength( this );
				refSizeHtml = this.innerHTML.length;
			} );

			proseValue = sizeElement( 'prose-size', 'Prose size (text only):', proseSize - refmarksize, ' (' + wordCount + ' words) "readable prose size"' );
			refValue = sizeElement( 'ref-size', 'References (text only):', refSize + refmarksize );
			refHtmlValue = sizeElement( 'ref-size-html', 'References (including all HTML code):', refSizeHtml + refmarkSizeHtml, ' (' + wordCount + ' words) "readable prose size"' );
			proseHtmlValue = sizeElement( 'prose-size-html', 'Prose size (including all HTML code):', proseSizeHtml - refmarkSizeHtml );
			output.append( proseHtmlValue, refHtmlValue, proseValue, refValue );
			bodyContent.prepend( header, output );
			getFileSize( proseHtmlValue );
			getRevisionSize( proseValue );
		}
	}

	if (
		!mw.config.get( 'wgCanonicalSpecialPageName' )
	) {
		$.when( $.ready, mw.loader.using( [ 'mediawiki.api', 'mediawiki.util' ] ) ).then( function () {
			// Depending on whether in edit mode or preview/view mode, show the approppiate response upon clicking the portlet link
			var func, $portlet;
			if ( mw.config.get( 'wgAction' ) === 'edit' || ( mw.config.get( 'wgAction' ) === 'submit' && document.getElementById( 'wikiDiff' ) ) ) {
				func = function () {
					mw.notify( 'You need to preview the text for the prose size script to work in edit mode.' );
				};
				$portlet.addClass( 'prosesize-portlet-link-edit-mode' );
			} else if ( [ 'view', 'submit', 'historysubmit', 'purge' ].indexOf( mw.config.get( 'wgAction' ) ) !== -1 ) {
				func = main;
			}
			if ( func ) {
				$portlet = $( mw.util.addPortletLink( 'p-tb', '#', 'Page size', 't-page-size', 'Calculate page and prose size' ) );
				$portlet.on( 'click', function ( e ) {
					e.preventDefault();
					func();
				} );
			}
		} );
	}
}() );
