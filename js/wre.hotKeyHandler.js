/* wre.hotKeyHandler.js v13.3.1
 * Waldemar Reusch <waldemar.reusch@googlemail.com
 */

(function(wre){
	wre.hotKeyHandler = function(e, m){
		var fn = e.functions || e.data && e.data.functions || {},
			hk = e.hotkeys || e.data && e.data.hotkeys || [],
			h = function(e){
			var k = e.which, c = e.ctrlKey, a = e.altKey, s = e.shiftKey, t = $(e.target),
				is = function(s){return s.split(/\s*,\s*/).some(function(n){return t.is(n);})},
				stop = function(){e.preventDefault();e.stopPropagation();return false;},
				ks = {
					ESC : k===27, ENTER : k===13, TAB : k===9, SPACE : k === 32, BACKSPACE : k === 8,
					UP : k===38, DOWN : k === 40, LEFT : k === 37, RIGHT : k === 39, DEL : k === 46,
					PGUP : k == 33, PGDOWN : k === 34, HOME : k === 36, END : k === 35,
				};
			e.which && hk.length && hk.forEach(function(h){
				var f; return f = ( isNaN( h.key ) ? ks[ h.key.toUpperCase() ] : h.key === k )
				&& ( e.type === ( h.type || "keydown" ))
				&& ( h.shift === undefined || h.shift === s )
				&& ( h.ctrl === undefined || h.ctrl === c )
				&& ( h.alt === undefined || h.alt === a )
				&& ( h.is === undefined || is( h.is ) )
				&& ( h.isNot === undefined || !is( h.isNot ) )
				&& ( typeof h.action === "function" && h.action || fn && fn[ h.action ] || window[ h.action ] ),
				typeof f === "function" && ((h.pd?false:stop()) || f.call( t[0], e, m ))
			})
		}
		return e.functions ? h : h(e)
	}
})(window.wre||(window.wre={}))