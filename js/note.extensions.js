/*
 * creating standartized objects
 */

function Obj(a,b,c){
	"use strict"; (function d(a,b,c){ return a[0]?(c=a.shift(),a[0]?d(a,b[c]=b[c]||{}):b[c]=b[c]||{}):!1; }(a.split(/\./).slice(0,-1),window));
	return $.extend( true, Function("return ("+a+"="+"function(a){if(!(this instanceof "+a+")){return new "+a+"(a);}this._init&&this._init.call(this,a);});")(),{prototype:b},c);
}

/* 
 * extend knockout
 */
jQuery.extend(true,ko.bindingHandlers,{
	menu : {
		init : function( el, acc ){
			var el = $(el),
				selector = acc().selector || acc() || "a",
				eventHandler = acc().onselect || false,
				timer = null,
				hide = function(){ timer = setTimeout(function(){ $(el).hide("fast",function(){$(el).css({top:0,left:0});}).trigger("release"); }, 250);},
				where = null;
			el.on( "click.menu", selector, function(e){ el.trigger("menuselect", { item: ko.dataFor( this ) } ); el.hide(); })
				.on( "mouseout", hide )
				.on( "mousein, mouseover", function(){ setTimeout(function(){clearTimeout(timer);},1); } )
				.on( "position", function( e, t ){ where = $(t); $(el).position({ my:"right top", at:"right bottom", of: where}).show("fast");where.on("mouseout.menu",hide);})
				.on( "release", function(){ $(el).off("menuselect"); where.off(".menu"); } );
			if ( eventHandler ) { el.on( "menuselect", eventHandler ); }
		}
	},
	dblclick : {
		init : function( el, acc, all, obj ){
			$(el).on("dblclick", function(){ acc().call(obj);});
		}
	},
	editable : {
		init : function( el, acc ){
			$(el).attr("contenteditable",true).html(acc()()).blur(function(){acc()($(el).html().replace(/&nbsp;$|^&nbsp;|^\s*|\s*$/g,""));}).focus(function(){$(el).html(acc()()||"");});
			acc().subscribe(function(){$(el).html(acc()());});
		},
	},
	sortable : {
		init: function( el, acc, all, obj, cntx ){
			$( el ).sortable({
				items : ".node",
				handle: ".bullet",				
				placeholder: "sortable-placeholder",
				connectWith: ".children",
				start : function( e, ui ){ ko.dataFor(ui.item[0]).expanded(false); },
				stop : function(e, ui ){
					return;
				}
			});
		}
	},
});
/*
 * extend jQuery's index function
 */
(function($){
	$.fn.oldIndex = $.fn.index;
	$.fn.index = function(){
		if (! $.isNumeric(arguments[0]) ) return $.fn.oldIndex.apply(this,arguments);
		return this.siblings().addBack().eq(arguments[0]).before(this)
	};
}(jQuery));
