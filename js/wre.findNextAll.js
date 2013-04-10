(function($){
	var a = "compareDocumentPosition";
	$.fn.findNextAll = function( selector ){
	  var that = this[ 0 ], selection = $( selector ).get();
	  return this.pushStack( !that && selection || $.grep( selection, function( n ){ return ~[4,12,20].indexOf( that[a]( n ) ) }));
	}
	$.fn.findNext = function( selector ){
	  return this.pushStack( this.findNextAll( selector ).first() );
	}
	$.fn.findPrevAll = function( selector ){
	  var that = this[ 0 ], selection = $( selector ).get();
	  return this.pushStack( !that && selection || $.grep( selection, function( n ){ return ~[2,10,18].indexOf( that[a]( n ) ) }));
	}
	$.fn.findPrev = function( selector ){
	  return this.pushStack( this.findPrevAll( selector ).last() );
	}
}(jQuery))