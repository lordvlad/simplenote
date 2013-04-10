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
(function($,a){$.extend(true,a,{
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
});}(jQuery, ko.bindingHandlers));
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


var isPlainObject = jQuery.isPlainObject;
(function($,_,time,uuid){


	Obj("Simplenote",{
		// private methods
		_init: function(){
			var self 		 	= this;
			this.nodes		 	= _([]);
			this.hash 			= (function(){
				var a = _(); function b(c){					
					return c&&c.match?(location.hash="#"+c):a(location.hash&&location.hash.match(/.(.*)/)&&location.hash.match(/.(.*)/)[1]||"");
				}; a.subscribe(b); onhashchange=b; return b(), a;
			}());
			this.current 		= _(function(){	
				return self.nodes().filter(function(n){ return n.id === self.hash(); })[0] || self.nodes().filter(function(n){ return n.parent() === null; })[0];
			})
			this.breadcrumbs	= _(function(){
				var x = [], t = self.current();
				while ( t ){ x.unshift( { text: t.title(), href:"#"+t.id } ); t = self.nodes().filter(function(n){ return n.id === t.parent(); })[0]; }
				return x[1] && x || [];
			}).extend({throttle: 10});
			this.bookmarks 		= _(function(){
				return self.nodes()[1] ? self.nodes().filter(function(n){return n.bookmarked();}) : [];
			}).extend({throttle: 10});
			this.timeout 		= null;
			this.interval 		= null;
		},
		_create: function(){
			var self = this;
			try {
				var json = JSON.parse( localStorage.notes );
				json.nodes.forEach(function(n){ Simplenote.Node( $.extend(n,{smplnt:self}) );});			
			} catch( e ) {
				this.root = Simplenote.Node({
					smplnt : this,
					parent : _(null),
					title  : _("home"),
				});
			}
			$( document ).on( "click", ".headline", function(e){
				var t = $(e.target);
				if (t.is(":not(.bullet), :not(.action), :not(.ellipsis), :not(.additional)")){ t.parents(".headline").find("title").focus(); }
			});
			$( document ).on({
				"keydown" : wre.hotKeyHandler( this.hotkeys, this ),
				"keyup" : function(e){ self.save.call(self); },
				"click" : function(e){ 
					self.save.call(self);
					$(e.target).is(".headline") && !$(e.target).parents("#addNode").length && ko.dataFor( e.target ).active(true);
				},
				"dblclick" : function(e){ $(e.target).is(".headline, .title") && self.hash( ko.dataFor(e.target).id );}
			});			
			this.pop = $("<audio>").attr({src:"snd/pop.mp3"}).appendTo("body")[0];
			self.startPeriodicalSave();
		},
		attachElement : function(el,item){
			console.log("NEW RENDER");
			$(el).filter(".node").data("item",item);
			item.element = $(el).filter(".node")[0];
		},
		findLostNodes : function(){
			var a = this.nodes().map(function(n){return n.id}),
				b = this.nodes().filter(function(n){return n.parent() && !~a.indexOf(n.parent())});
			if (!b[0]) return;
			var c = this.addNodeTo( this.root, { title : "*** LOST NODES ***" } );
			b.forEach(function(n){n.parent(c.id);});
		},
		save : function(){
			var self = this;
			clearTimeout( this.timeout );
			this.timeout = setTimeout( function(){ localStorage.notes = JSON.stringify( self.toJSON() ); }, 100 );
		},
		startPeriodicalSave : function(){
			var self = this;
			this.interval = setInterval( function(){self.save.call( self );}, 6e4 );
		},
		stopPeriodicalSave : function(){
			clearInterval( this.interval );
		},
		addNodeHere : function( a ){
			if (! isPlainObject(a) ) { self = a.smplnt; a = {}; } else { self = this }
			return self.addNodeTo( self.current(), a );
		},
		addNodeTo : function( b, a ){
			return Simplenote.Node($.extend(a,{parent:b,smplnt:this}));
		},
		insertNodeAfter : function( b, a ){
			return Simplenote.Node($.extend(a,{listStyleType:b.listStyleType(),parent:b.parent(),smplnt:this,after:b}));
		},			
		hotkeys : {
			functions : {
				"next" : function(e,self){
					var x = $(this).parents("#list").length < 1 ? $("#list>li:visible").first().data("ko") : $(this).parents("li").last().nextALL("#list>li:visible").first().data("ko");
					x && x.active && x.active( true );
				},
				"prev" : function(e,self){
					var x = $(this).parents("#list").length < 1 ? $("#list>li:visible").last().data("ko") : $(this).parents("li").last().prevALL("#list>li:visible").last().data("ko");
					x && x.active && x.active( true );
				},
				"addBelow" : function(e,self){
					ko.dataFor(this).active(false);
					self.insertNodeAfter( ko.dataFor( this ) );
				},
				"addChild" : function(e,self){
					var a = ko.dataFor( this );
					a.expanded( true );
					self.addNodeTo( a );
				},
				"editNote" : function(){
					var a = ko.dataFor( this );
					a.expanded( true );
					a.note(a.note()||"");
					a.activeNote( true );
				},
				"editTitle" : function(){
					ko.dataFor( this ).active(true);
				},
				"indent" : function(){
					var a = ko.dataFor( this ),b;
					if ( ! (b = $(this).parents(".node:first").prev()[0]) ) return;
					a.active(false);
					b = ko.dataFor( b );
					b.expanded( true );
					a.parent( b.id );
					a.active(true);
				},
				"outdent" : function(){
					var a = ko.dataFor( this ), b;
					if ( ! ( b =$(this).parents(".node")[1] ) ) return;
					a.active(false);
					b = ko.dataFor( b );
					a.parent( b.parent() );
					a.active( true );
				},
				"toggleExpand" : function(){
					ko.dataFor(this).toggleExpanded();
				},
				"zoomIn" : function(e,self){
					var a = ko.dataFor( this );
					a.active(false);
					self.hash( a.id );
					a.active(true);
				},
				"zoomOut" : function(e,self){
					var a  = ko.dataFor( this );
					a.active( false );
					self.hash( self.current().parent() || "" );
					a.active(true);
				},
				"backspace" : function(e,self){
					this.innerHTML = Simplenote.Node.parse(this.innerHTML)
					if ( this.innerHTML[0] ) return;
					this.innerHTML = "";
					var a = ko.dataFor( this );
					if ( $(this).is(".notes") ){
						a.active(true);
						self.save();
					} else if ( $(this).is(".title") ) {
						if ( a.listStyleType()[2] ) return a.listStyleType.splice(2);
						if ( a.listStyleType()[1] ) return a.listStyleType.splice(1);
						if ( a.listStyleType()[0] ) return a.listStyleType.splice(0);
						var b= ko.dataFor( $(this).parents(".node").first().findPrev(".node")[0] );
						return self.nodes.remove(a), b.active(true);
					}
				}
			},
			hotkeys : [
				{ shift : false, ctrl : true,  alt : false, key : 74,				      										action : "next" }, 			// j
				{ shift : false, ctrl : true,  alt : false, key : "DOWN",  														action : "next" }, 			// down
				{ shift : false, ctrl : true,  alt : false, key : 75,      														action : "prev" }, 			// k
				{ shift : false, ctrl : true,  alt : false, key : "UP",    														action : "prev" }, 			// up
				{ shift : false, ctrl : false, alt : false, key : "ENTER", 								is : ".title", 			action : "addBelow" }, 		// enter
				{ shift : true , ctrl : false, alt : false, key : "ENTER", 								is : ".title",          action : "editNote" }, 		// shift enter
				{ shift : true , ctrl : false, alt : false, key : "ENTER", 								is : ".notes",          action : "editTitle" },		// shift enter
				{ shift : false, ctrl : false, alt : false, key : "TAB",   								is : ".title",			action : "indent" },   		// tab
				{ shift : true,  ctrl : false, alt : false, key : "TAB",  								is : ".title",			action : "outdent" },		// shift tab
				{ shift : false, ctrl : true,  alt : false, key : "ENTER", 								is : ".title, .notes",	action : "addChild" },	 	// ctrl enter
				{ shift : false, ctrl : true,  alt : false, key : "SPACE",								is : ".title, .notes",	action : "toggleExpand" },	// ctrl space
				{ shift : false, ctrl : false, alt : true , key : "RIGHT",								is : ".title, .notes",	action : "zoomIn" }, 		// alt right
				{ shift : false, ctrl : false, alt : true , key : 70,									is : ".title, .notes",	action : "zoomIn" }, 		// alt f
				{ shift : false, ctrl : false, alt : true , key : "LEFT",								is : ".title, .notes",	action : "zoomOut" }, 		// alt left
				{ shift : false, ctrl : false, alt : true , key : 66,									is : ".title, .notes",	action : "zoomOut" }, 		// alt b
				{ shift : false, ctrl : false, alt : false, key : "BACKSPACE",	pd:true,				is : ".title, .notes",  action : "backspace" },		// backspace
				
			]
		},
		toJSON : function(){
			return {
				nodes 	: this.nodes()
			}
		}
	},{
		// static methods
		alert : function( string,  callback ){
			$("#alert").remove();
			return $("<div id='alert'>").html( string ).dialog({ modal: true, title: "alert", buttons:{ "ok":function(){$(this).dialog("destroy").remove();callback&&callback()}}}).find(":button").focus()
		},
		confirm : function( string, callback ){
			$("#confirm").remove();
			$("<div id='confirm'>").html( string ).dialog({ modal: true, title: "confirm", buttons:{ "ok":function(){$(this).dialog("destroy").remove();callback&&callback(true)},"cancel":function(){$(this).dialog("destroy").remove();callback&&callback(false)}}}).find(":button:first").focus()
		},
		prompt : function( string, prefill, callback ){
			if ( !callback && $.isFunction( prefill ) ) { callback = prefill; prefill = "" }
			$("#prompt").remove();
			$("<div id='prompt'>").html( "<p>"+string+"</p><input style='display:block;width: 100%;' type='text' value='"+prefill+"' />" ).dialog({modal: true, title: "prompt", buttons:{"ok":function(){var x = $("input",this).val();$(this).dialog("destroy").remove();callback&&callback(x);},"cancel":function(){$(this).dialog("destroy").remove();callback&&callback(null)}}}).find("input").keydown(function(e){if(e.which===13){e.preventDefault();e.stopPropagation();$(this).parent().parent().find(":button:contains('ok')").click();return false;}}).focus()
		},
		choose : function( string, choices, callback ){
			if ( typeof choices === "string" && choices.match(/,/) ) choices = choices.split(/,\s*/);
			$("#choose").remove();
			$("<div id='choose'>").html( "<p>"+string+"</p><div class='choice'>"+$.map( choices, function( n, i ){ return "<input"+(!i?" checked":"")+" type='radio' name='choice' id='choice_"+(n.value||n.replace(/\s/g,"_"))+"' value='"+(n.value||n.replace(/\s/g,"_"))+"'><label for='choice_"+(n.value||n.replace(/\s/g,"_"))+"'>"+(n.label||n)+"</label>" } ).join("") +"</div>" ).find("div.choice").buttonset().end().dialog({modal: true, title: "choose", buttons: { "ok" : function(){var x = $(":radio:checked", this).val();$(this).dialog("destroy").remove();callback&&callback(x);},"cancel":function(){$(this).dialog("destroy").remove();callback&&callback(null);}}});
		},
		note : function( string ){
			$("#note").remove();
			var n = $("<div id='note' class='ui-widget-content ui-tooltip'>"+string+"</div>").appendTo( "body" ), w=n.width()/2;;
			n.hide().css({"border-radius":4,position:"fixed",top:"10px",left:"50%","margin-left":-w}).fadeIn( 100 ).delay( 4000 ).fadeOut( 100 );
		},
	});

	Obj("Simplenote.Node",{
		// private methods
		_init: function(o){
			console.log("new node");
			var self 			 	= this;
			this.smplnt			 	= o.smplnt;
			this.id				 	= o.id || uuid();
			this.parent     	 	= _((o.parent&&o.parent.id)||o.parent);
			if ( o.parent === null ) { this.smplnt.root = this }
			this.title 			 	= (function(){ var a = _( o.title|| ""); return _({ read: function(){ return a() }, write: function(v){a( Simplenote.Node.parse(v) ); } }); }());
			this.note 		 	 	= (function(){ var a = _( o.note || "" ); return _({ read: function(){ return a(); }, write: function(v){ a( Simplenote.Node.parse(v) ); } }); }());
			this.tags 			 	= _(o.tags||[]);
			this.deadline	     	= _(o.deadline&&new Date(o.deadline)||false);
			this.files		 	 	= _(o.files||[]);
			this.bookmarked  	 	= _(o.bookmarked||false);
			this.done		 	 	= _(o.done||false);
			this.expanded			= _(o.expanded||false);
			this.listStyleType		= _(o.listStyleType||[]);
			this.editingTitle    	= _(false);
			this.active				= _(true);
			this.activeNote			= _(false);
			this.isCurrent			= _(function(){ return self.smplnt.current() === self });
			this.findChildren		= function(){ return self.children(self.smplnt.nodes().filter(function(n){return n.parent()===self.id}));};
			this.children 	 	 	= (function(){
				var a = _([])/*, b = _(function(){ return self.smplnt.nodes().filter(function(n){return n.parent()===self.id});}).extend({throttle:10})*/;
				
				/*b.subscribe(function(v){
					if ( !v.length && !a().length ) return;
					if ( !v.length ) return a([]);
					if ( !a().length ) return a(v);
					console.log( a(), v );				
				});*/
				a.subscribe(function(){console.log("children changed");});
				return a;
				
			}());
			this.hasNote		 	= _(function(){ return self.note().length; });
			this.hasChildren		= _(function(){ return self.children().length; });
			this.cssClass			= _(function(){ return self.listStyleType().concat("node").filter(Boolean).join(" "); });
			this.bullet				= _(function(){ return ( self.hasNote() || self.hasChildren() ) && ( !self.expanded() && "&#9658;" || self.expanded() && "&#9660;" ) || "&#9679;"; });
			this.deadlineDisplay 	= _(function(){ time(); var d = self.deadline(); return d?(d>new Date?moment(d).calendar():self.alarm()):"";});
			this.showEllipsis    	= _(function(){ return self.hasNote() && !self.expanded(); });
		
			if ( o.after ){
				this.smplnt.nodes.splice( this.smplnt.nodes().indexOf( o.after )+1, 0, this );
			} else {
				this.smplnt.nodes.push( this );
			}
		},
		alarm : function(){
			this.deadline(false);
			self.smplnt.pop.play();
			Simplenote.alert( this.title() );
			return"";
		},
		editTags : function(){
			var self = this;
			Simplenote.prompt("enter tags as a comma-seperated list", this.tags().join(", "),function(a){self.tags(a&&a.split(/\s*,\s*/)||[]);});
		},
		editDeadline : function(){
			var self = this;
			Simplenote.prompt("enter deadline", this.deadline()||new Date,function(a){self.deadline(Date.parse(a))});
		},
		editFiles : function(){
			
		},
		toggleBookmark : function(){
			this.bookmarked(!this.bookmarked());
		},
		toggleNote : function(){
			this.showNote(!this.showNote());
		},
		toggleExpanded : function(){
			this.expanded( (this.hasNote() || this.hasChildren) && !this.expanded() );
		},
		remove : function(){
			var self = this;
			Simplenote.confirm("really delete this node?", function(a){ a&&self.smplnt.nodes.remove( self );});
		},
		editDetailed : function(){
		
		},
		toJSON : function(){
			return {
				id 			: this.id,
				//pos			: this.pos(),
				parent		: this.parent(),
				title 		: this.active() && $(this.element).find(".title").html() || this.title(),
				note 		: this.activeNote() && $(this.element).find(".notes").html() || this.note(),
				expanded	: this.expanded(),
				done 		: this.done(),
				deadline	: this.deadline(),
				tags		: this.tags(),
				files		: this.files(),
				bookmarked	: this.bookmarked(),
				listStyleType: this.listStyleType()
			}
		}
		
	},{
		// static methods
		parse : function(a){
			return a
				.replace(/<a[^>]*>|<\/a>/g,"").replace(/(http\:\/\/)?(www\.[\w.]+)/ig,function(m){return "<a href=\""+(m.match(/http/i)?m:"http://"+m)+"\">"+m+"</a>"}) // links
				.replace(/<b>|<\/b>/g,"").replace(/\*[\w‰ˆ¸ƒ÷‹ﬂ\s]+\*/ig,function(m){return "<b>"+m+"</b>"}) // bold
				.replace(/<u>|<\/u>/g,"").replace(/\_[\w‰ˆ¸ƒ÷‹ﬂ\s]+\_/ig,function(m){return "<u>"+m+"</u>"}) // underline
				.replace(/<i>|<\/i>/g,"").replace(/\/[\w‰ˆ¸ƒ÷‹ﬂ\s]+\//ig,function(m){return "<i>"+m+"</i>"}) // italics
				.replace(/<br>$|<br\/>$/,"")
		}
	});	
	
}(jQuery,function(v){return v&&((v.call||v.read)&&ko.computed(v)||v.map&&ko.observableArray(v))||ko.observable(v)},(function(){ var a = ko.observable(0); setInterval(function(){a(new Date());},1e3); return a; }()),a=(function(c,b,e){c=[],b=function(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)};return function(){while(~c.indexOf(e=b()));return c.push(e),e}}())
));

// Get the party started
(function($,v,e){$(function(){v.element=$(e);v._create();ko.applyBindings(v);});}(jQuery,window.note = new Simplenote,"#body"));