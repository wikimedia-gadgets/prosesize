/* eslint-disable */
// rewrite of [[User:Dr_pda/prosesize.js]]
// TODO: modernize (User:Shubinator/DYKcheck.js may have useful code? or use xtools api ) and fix to work on all maintained skins propose to become gadget
// Wikipedia:Village_pump_(technical)/Archive_161#"Page_size"_Tool:_"Word_count"_script_'User:Dr_pda/prosesize.js'_does_not_work_with_skin_=_Timeless
function loadXMLDocPassingTemplate( url, handler, page ) {
	// branch for native XMLHttpRequest object
	if ( window.XMLHttpRequest ) {
		var req = new XMLHttpRequest();
	}
	// branch for IE/Windows ActiveX version
	else if ( window.ActiveXObject ) {
		var req = new ActiveXObject( 'Microsoft.XMLHTTP' );
	}
	if ( req ) {
		req.onreadystatechange = function () {
			handler( req, page );
		};
		req.open( 'GET', url, true );
		req.send( '' );
	}
}

function getWikiText( req, page ) {
	// only if req shows "loaded"
	if ( req.readyState === 4 ) {
		// only if "OK"
		if ( req.status === 200 ) {
			// ...processing statements go here...
			response = req.responseXML.documentElement;
			var rev = response.getElementsByTagName( 'rev' );
			if ( rev.length > 0 ) {
				var result = rev[ 0 ].getAttribute( 'size' );
				if ( result > 10240 ) {
					result = ( result / 1024 ).toFixed( 0 ) + '&nbsp;kB';
				} else {
					result = result + '&nbsp;B';
				}
				wiki_value = document.createElement( 'li' );
				wiki_value.id = 'wiki-size';
				wiki_value.innerHTML = '<b>Wiki text: </b>' + result;
				var output = document.getElementById( 'document-size-stats' );
				prose_value = document.getElementById( 'prose-size' );
				output.insertBefore( wiki_value, prose_value );
			} else {
				// alert("There was a problem using the Wikipedia Search to find the wiki text size\nEither the search is not working or the correct article did not appear on the first page of results");
				wiki_value = document.createElement( 'li' );
				wiki_value.id = 'wiki-size';
				wiki_value.innerHTML = '<b>Wiki text: </b>Problem getting wiki text size';
				var output = document.getElementById( 'document-size-stats' );
				prose_value = document.getElementById( 'prose-size' );
				output.insertBefore( wiki_value, prose_value );
			}
		} else {
			alert( 'There was a problem retrieving the XML data:\n' +
				req.statusText );
		}
	}
}

function getFileSize( req, page ) {
	// only if req shows "loaded"
	if ( req.readyState == 4 ) {
		// only if "OK"
		if ( req.status == 200 ) {
			// ...processing statements go here...
			var fsize = req.responseText.length;
			window.status = fsize;
			var total_value = document.createElement( 'li' );
			total_value.id = 'total-size';
			total_value.innerHTML = '<b>File size: </b>' + ( fsize / 1024 ).toFixed( 0 ) + '&nbsp;kB';
			var output = document.getElementById( 'document-size-stats' );
			var prose_html_value = document.getElementById( 'prose-size-html' );
			output.insertBefore( total_value, prose_html_value );
		} else {
			alert( 'There was a problem retrieving the XML data:\n' +
				req.statusText + '\n(' + url + ')' );
		}
	}
}

function getLength( id ) {
	var textLength = 0;
	for ( var i = 0; i < id.childNodes.length; i++ ) {
		if ( id.childNodes[ i ].nodeType === Node.TEXT_NODE ) {
			textLength += id.childNodes[ i ].nodeValue.length;
		} else if ( id.childNodes[ i ].nodeType === Node.ELEMENT_NODE &&
			( id.childNodes[ i ].id == 'coordinates' || id.childNodes[ i ].className.indexOf( 'emplate' ) != -1 ) ) {
			// special case for {{coord}} and {{fact}}-like templates
			// Exclude from length, and don't set background yellow
			id.childNodes[ i ].style.cssText = 'background-color:white';
		} else {
			textLength += getLength( id.childNodes[ i ] );
		}
	}
	return textLength;
}

function getRefMarkLength( id, html ) {
	var textLength = 0;
	for ( var i = 0; i < id.childNodes.length; i++ ) {
		if ( id.childNodes[ i ].nodeType === Node.ELEMENT_NODE && id.childNodes[ i ].className == 'reference' ) {
			textLength += ( html ) ? id.childNodes[ i ].innerHTML.length : getLength( id.childNodes[ i ] );
		}
	}
	return textLength;
}

function getDocumentSize() {
	var bodyContent = $( '.mw-parser-output' );

	if ( bodyContent.length === 0 ) {
		return;
	}

	if ( $( 'document-size-stats' ).length ) {
		// if statistics already exist, turn them off and remove highlighting
		$( 'document-size-stats' ).remove();
		$( 'document-size-header' ).remove();
		bodyContent.children( 'p' ).removeClass( 'prosesize-highlight' );
	} else {
		var Api = new mw.Api();
		output = $( 'ul' ).prop( 'id', 'document-size-stats' );

		var prose_html_value = $( 'li' ).prop( 'id', 'prose-size-html' );
		var ref_html_value = $( 'li' ).prop( 'id', 'ref-size-html' );
		var prose_value = $( 'li' ).prop( 'id', 'prose-size' );
		var ref_value = $( 'li' ).prop( 'id', 'ref-size' );

		output.append( prose_html_value, ref_html_value, prose_value, ref_value );

		var header = $( 'span' )
			.prop( 'id', 'document-size-header' )
			.html( '<br/>Document statistics: <small><i>(See <a href="//en.wikipedia.org/wiki/User_talk:Dr_pda/prosesize.js">here</a> for details.)<i></small>' );

		bodyContent.prepend( header, output );

		// File size not well defined for preview mode or section edit
		if ( mw.config.get( 'wgAction' ) != 'submit' ) {
			loadXMLDocPassingTemplate( location.pathname, getFileSize, '' );
		}
		// Calculate prose size and size of reference markers ([1] etc)
		var pList = bodyContent.children( 'p' );

		prose_size = 0;
		prose_size_html = 0;
		refmark_size = 0;
		refmark_size_html = 0;
		word_count = 0;
		for ( var i = 0; i < pList.length; i++ ) {
			var para = pList[ i ];
			if ( para.parentNode == bodyContent ) {
				prose_size += getLength( para );
				prose_size_html += para.innerHTML.length;
				refmark_size += getRefMarkLength( para, false );
				refmark_size_html += getRefMarkLength( para, true );
				word_count += para.innerHTML.replace( /(<([^>]+)>)/ig, '' ).split( ' ' ).length;
				para.style.cssText = 'background-color:yellow';
			}
		}

		if ( ( prose_size - refmark_size ) > 10240 ) {
			prose_value.innerHTML = '<b>Prose size (text only): </b>' + ( ( prose_size - refmark_size ) / 1024 ).toFixed( 0 ) + '&nbsp;kB (' + word_count + ' words) "readable prose size"';
		} else {
			prose_value.innerHTML = '<b>Prose size (text only): </b>' + ( prose_size - refmark_size ) + '&nbsp;B (' + word_count + ' words) "readable prose size"';
		}

		if ( ( prose_size_html - refmark_size_html ) > 10240 ) {
			prose_html_value.innerHTML = '<b>Prose size (including all HTML code): </b>' + ( ( prose_size_html - refmark_size_html ) / 1024 ).toFixed( 0 ) + '&nbsp;kB';
		} else {
			prose_html_value.innerHTML = '<b>Prose size (including all HTML code): </b>' + ( prose_size_html - refmark_size_html ) + '&nbsp;B';
		}

		// Calculate size of references (i.e. output of <references/>)
		var rList = bodyContent.getElementsByTagName( 'ol' );
		var ref_size = 0;
		var ref_size_html = 0;
		for ( var i = 0; i < rList.length; i++ ) {
			if ( rList[ i ].parentNode.className == 'references' ) {
				ref_size = getLength( rList[ i ] );
				ref_size_html = rList[ i ].innerHTML.length;
			}
		}

		if ( ( ref_size + refmark_size ) > 10240 ) {
			ref_value.innerHTML = '<b>References (text only): </b>' + ( ( ref_size + refmark_size ) / 1024 ).toFixed( 0 ) + '&nbsp;kB';
		} else {
			ref_value.innerHTML = '<b>References (text only): </b>' + ( ref_size + refmark_size ) + '&nbsp;B';
		}

		if ( ( ref_size_html + refmark_size_html ) > 10240 ) {
			ref_html_value.innerHTML = '<b>References (including all HTML code): </b>' + ( ( ref_size_html + refmark_size_html ) / 1024 ).toFixed( 0 ) + '&nbsp;kB';
		} else {
			ref_html_value.innerHTML = '<b>References (including all HTML code): </b>' + ( ref_size_html + refmark_size_html ) + '&nbsp;B';
		}

		// get correct name of article from wikipedia-defined global variables
		var pageNameUnderscores = mw.config.get( 'wgPageName' );
		var pageNameSpaces = pageNameUnderscores.replace( /_/g, ' ' );
		if ( mw.config.get( 'wgAction' ) == 'submit' ) {
			// Get size of text in edit box
			result = document.getElementById( 'wpTextbox1' ).value.length;
			if ( result > 10240 ) {
				result = ( result / 1024 ).toFixed( 0 ) + '&nbsp;kB';
			} else {
				result = result + '&nbsp;B';
			}
			wiki_value = document.createElement( 'li' );
			wiki_value.id = 'wiki-size';
			wiki_value.innerHTML = '<b>Wiki text: </b>' + result;
			var output = document.getElementById( 'document-size-stats' );
			prose_value = document.getElementById( 'prose-size' );
			output.insertBefore( wiki_value, prose_value );
		} else {
			// Get revision size from API
			Apiresult = Api.get( {
				prop: 'revisions',
				rvprop: 'size',
				revids: mw.config.get( 'wgRevisionId' ),
				formatversion: 2
			} );
			loadXMLDocPassingTemplate( searchURL, getWikiText, pageNameSpaces );
		}
	}
}

$.when( $.ready, mw.loader.using( 'mediawiki.util' ) ).then( function () {
	// Depending on whether in edit mode or preview/view mode, show the approppiate response upon clicking the portlet link
	var func, $portlet;
	if ( mw.config.get( 'wgAction' ) == 'edit' || ( mw.config.get( 'wgAction' ) == 'submit' && document.getElementById( 'wikiDiff' ) ) ) {
		func = function () {
			alert( 'You need to preview the text for the prose size script to work in edit mode.' );
		};
		$portlet.addClass( 'prosesize-portlet-link-edit-mode' );
	} else if ( [ 'view', 'submit', 'historysubmit', 'purge' ].indexOf( mw.config.get( 'wgAction' ) ) !== -1 ) {
		func = function () {
			getDocumentSize();
		};
	}
	if ( func ) {
		$portlet = $( mw.util.addPortletLink( 'p-tb', '#', 'Page size', 't-page-size', 'Calculate page and prose size' ) );
		$portlet.on( 'click', function ( e ) {
			e.preventDefault();
			func();
		} );
	}
} );

// </nowiki>
