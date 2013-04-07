(function(date){
	var t = [ 1000, 60, 60, 24, 7, 4.33, 12 ],
		isNum = function(n){ return !isNaN( parseFloat( n ) ) && isFinite( n ) },
		prod = function(a,b){return a*b},
		firstIndex = function(a,n){var i=-1;a.some(function(r,j){return r.test(n)&&(i=j)>-1});return i},
		y = [ /\bjan/i, /\bfeb/i,/\bm[a‰]r[cz]/i,/\bapril/i,/\bma[iy]/i,/\bjun[ei]/i,/\bjul[iy]/i,/\baug/i,/\bsep/i,/\bo[ck]t/i,/\bnov/i,/\bde[cz]/i ],
		w = [  /\b(?:null|no|keiner|zero)\b/i, /\b(?:one|eine|erste|first)[nrm]*\b/i, /\b(?:two|zwei|second)(?:te[rn])?\b/i, /\b(?:drei|three|third|dritte[rn])\b/i, /\b(?:vier|four)(?:te[rn]|th)?\b/i, /\b(?:f[¸‹]nf|five|fifth)(te[rn])?\b/i, /\b(?:sechs|six)(?:te[rn]|th)?\b/i, /\b(?:sieb|seven)(?:te[rn]|en|th)?\b/i, /\b(?:acht|eight)(?:h|e[rn])?\b/i,  /\b(?:neun|nin)(?:e|th|te[rn])?\b/i,  /\b(?:zehn|ten)(?:te[rn]|th)?\b/i,  /\b(?:elf|eleven)(?:te[rn]|th)?\b/i,  /\b(?:zw[ˆ÷]lf|twelv)(?:e|te[rn]|th)?\b/i];
		u = [ /\bse[ck][uo]nd[sen]*\b/i, /\bminute[ns]*\b/i, /\b(?:stunde|hour)[ns]*\b/i, /\b(?:tag|day)[ens]*\b/i , /\b(?:woche|week)[ns]*\b/i, /\b(?:monat|month)[ens]*\b/ ,/\b(?:jahr|year)[ens]*\b/i ];
	date.parse = function( string ){
		if ( !string ) return null;
		if ((d=new Date(string)).toString()!=="Invalid Date"){ return d; }
		var match, d = new Date();
		// in 2 week, in 5 seconds, in drei stunden, in zwˆlf jahren
		if ( match = string.match( /in\s+([\d\w‰ˆ¸ƒ÷‹]+)\s+(\w+)/ ) ){
			var v = isNum(match[1]) ? match[1] : firstIndex( w , match[ 1 ] ),
				m = t.slice( 0,firstIndex( u, match[ 2 ] ) + 1 ).reduce(prod);
			d.setTime( d.getTime() + v * m );
		}
		// on may 4th, dec 1st, dec 10
		else if ( match = string.match( /on\s+(\w+)\s+([\d\w]+)/ ) ){
			d.setMonth( firstIndex( y, match[ 1 ] ) );
			d.setDate( isNum( match[2] ) ? match[ 2 ] : firstIndex( w, match[ 2 ] ) );
		}
		// am 2ten m‰rz, am vierten april
		else if ( match = string.match( /am\s+(?:(\d+)(?:ter|ten|th)?)?([\w‰ˆ¸ƒ÷‹]+)?\s+([\wˆ‰¸÷ƒ‹]+)/ ) ) {
			var m = firstIndex( y, match[ 3 ] );
			d.setMonth( m >= d.getMonth() ? m : m+12 );			
			d.setDate( match[1] || match[2] && firstIndex( w, match[ 1 ] ) );
		}
		// am montag, on tuesday ....
		else if ( match = string.match( /(?:am|on)\s+(\w+)/ ) ) {
			var s = [/\b(?:sonntag|sunday)\b/i, /\bmon[td]a[gy]\b/i, /\b(?:dienstag|tuesday)\b/i, /\b(?:mittwoch|wednesday)\b/i, /\b(?:donnerstag|thursday)\b/i, /\b(?:freitag|friday)\b/i, /\b(?:samstag|sonnabend|saturday)\b/i ],
				v = firstIndex( s, match[1] );
			d.setDay( v >= d.getDay() ? v : v+7 );
		}
		// tomorrow, day after tomorrow
		else if ( match = string.match(/([¸‹]bermorgen|day\s\after\stomorrow)\s*\bum\s+(?:(\d\d)\:(\d\d)?)?([\d\w‰ˆ¸ƒ÷‹]+)?/i) ){
			d.setDate( d.getDate() + 2 );			
			if ( match[2] ) { d.setHours( match[2]); d.setMinutes( match[3] || 0 ) }			
			if ( match[4] ) { d.setHours( firstIndex( w, match[4] ) ) }
		}
		// morgen, tomorrow, morgen um 10, um 12
		else if ( match = string.match(/(tomorrow|morgen)(?:\s*\bum\s+(?:(\d\d)\:(\d\d)?)?([\w‰ˆ¸ƒ÷‹]+)?)?/i)){
			if ( match[1] ) { d.setDate( d.getDate() + 1 ); }
			if ( match[2] ) { d.setHours( match[2]), d.setMinutes( match[3] || 0 ) }			
			if ( match[4] ) { d.setHours( firstIndex( w, match[4] ) ) }
		}
		// morgen, tomorrow
		else if ( match = string.match(/(tomorrow|morgen)/i) ){
			d.setDate( d.getDate() + 1 );
		}
		// um 12, um 13
		else if ( match = string.match(/\bum\s+(?:(\d\d)\:(\d\d)?)?([\w‰ˆ¸ƒ÷‹]+)?/)){
			if ( match[1] ) { d.setHours( match[1]), d.setMinutes( match[2] || 0 ) }			
			if ( match[3] ) { d.setHours( firstIndex( w, match[3] ) ) }
		}
		// jetzt, now 
		else if ( match = string.match( /jetzt|now/ ) ){
			// do not modify time
		}
		else {
			return  new Date(NaN);
		}
		return  d;
	};
	date.prototype.setDay = function( day ){
		return this.setTime( this.getTime() + ( t.slice(0,4).reduce( prod ) * ( day - this.getDay() ) ) ), this;		
	}

})(window.Date);