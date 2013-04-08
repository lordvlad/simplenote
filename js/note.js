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
ko.bindingHandlers.editable = {
	init : function( el, acc ){
		$(el).attr("contenteditable",true).html(acc()()).blur(function(){acc()($(el).html().replace(/&nbsp;$|^&nbsp;|^\s*|\s*$/g,""));}).focus(function(){$(el).html(acc()()||"&nbsp;");});
		acc().subscribe(function(){$(el).html(acc()());});
	},
}


var isPlainObject = jQuery.isPlainObject;
(function(_,time,uuid){


	Obj("Simplenote",{
		// private methods
		_init: function(){
			var self 		 	= this;
			this.nodes		 	= _([]);
			this.branch 	 	= _([]);
			this.hash 			= (function(){
				var a = _(); function b(c){					
					return c&&c.match?(location.hash="#"+c):a(location.hash&&location.hash.match(/.(.*)/)&&location.hash.match(/.(.*)/)[1]||"") 
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
			this.bookmars 		= _(function(){
				return self.nodes()[1] ? self.nodes().filter(function(n){return n.bookmarked();}) : [];
			}).extend({throttle: 10});
			this.timeout 		= null;
			this.interval 		= null;
		},
		_create: function($){
			var self = this;
			try {
				var json = JSON.parse( localStorage.notes );
				json.nodes.forEach(function(n){ Simplenote.Node( $.extend(n,{smplnt:self}) );});
				self.branch( json.branch.map(function(n){ return self.nodes().filter(function(m){return m.id===n;})[0]; }) );
			
			} catch( e ) {
				this.branch.push( Simplenote.Node({
					smplnt : this,
					parent : _(null),
					title  : _("home"),
				}) );
			}
			$( document ).on( "click", ".headline", function(e){
				var t = $(e.target);
				if (t.is(":not(.bullet), :not(.action), :not(.ellipsis), :not(.additional)")){ t.parents(".headline").find("title").focus(); }
			});
			$( document ).on({
				"keydown" : wre.hotKeyHandler( this.hotkeys, this ),
				"keyup" : function(){ self.save.call(self);},
				"dblclick" : function(e){ $(e.target).is(".headline, .title") && self.hash( ko.dataFor(e.target).id );}
			});
			self.startPeriodicalSave();
		},
		attachElement : function(el,item){
			$(el).filter(".node").data("item",item);
			item.element = $(el).filter(".node")[0];
		},
		save : function(){
			var self = this;
			clearTimeout( this.timeout );
			this.timeout = setTimeout( function(){ localStorage.notes = JSON.stringify( self.toJSON() ); }, 100 );
		},
		startPeriodicalSave : function(){
			this.interval = setInterval( this.save.call( this ), 6e4 );
		},
		stopPeriodicalSave : function(){
			clearInterval( this.interval );
		},
		addNodeHere : function( a ){
			if (! isPlainObject(a) ) a = {};
			this.addNodeTo( this.current(), a );
		},
		addNodeTo : function( b, a ){
			Simplenote.Node($.extend(a,{parent:b,smplnt:this}));
		},
		insertNodeAfter : function( b, a ){
			Simplenote.Node($.extend(a,{parent:b.parent(),smplnt:this,after:b}));
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
					a.note(a.note()||"&nbsp");
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
					console.log( self.current().id );
				},
				"zoomOut" : function(e,self){
					var a  = ko.dataFor( this );
					a.active( false );
					self.hash( self.current().parent() || "" );
					a.active(true);
				}
			},
			hotkeys : [
				{ shift : false, ctrl : true,  alt : false, key : 74,      							action : "next" }, 			// j
				{ shift : false, ctrl : true,  alt : false, key : "DOWN",  							action : "next" }, 			// down
				{ shift : false, ctrl : true,  alt : false, key : 75,      							action : "prev" }, 			// k
				{ shift : false, ctrl : true,  alt : false, key : "UP",    							action : "prev" }, 			// up
				{ shift : false, ctrl : false, alt : false, key : "ENTER", 	is : ".title", 			action : "addBelow" }, 		// enter
				{ shift : true , ctrl : false, alt : false, key : "ENTER", 	is : ".title",          action : "editNote" }, 		// shift enter
				{ shift : true , ctrl : false, alt : false, key : "ENTER", 	is : ".notes",          action : "editTitle" },		// shift enter
				{ shift : false, ctrl : true,  alt : false, key : "ENTER", 	is : ".title, .notes",	action : "addChild" },	 	// ctrl enter
				{ shift : false, ctrl : false, alt : false, key : "TAB",   	is : ".title, .notes",	action : "indent" },   		// tab
				{ shift : true,  ctrl : false, alt : false, key : "TAB",  	is : ".title, .notes",	action : "outdent" },		// shift tab
				{ shift : false, ctrl : true,  alt : false, key : "SPACE",	is : ".title, .notes",	action : "toggleExpand" },	// ctrl space
				{ shift : false, ctrl : false, alt : true , key : "RIGHT",	is : ".title, .notes",	action : "zoomIn" }, 		// alt right
				{ shift : false, ctrl : false, alt : true , key : 70,		is : ".title, .notes",	action : "zoomIn" }, 		// alt f
				{ shift : false, ctrl : false, alt : true , key : "LEFT",	is : ".title, .notes",	action : "zoomOut" }, 		// alt left
				{ shift : false, ctrl : false, alt : true , key : 66,		is : ".title, .notes",	action : "zoomOut" }, 		// alt b
				
			]
		},
		toJSON : function(){
			return {
				nodes 	: this.nodes(),
				branch 	: this.branch().map(function(n){return n.id})
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
		}
	});

	Obj("Simplenote.Node",{
		// private methods
		_init: function(o){
			var self 			 	= this;
			this.smplnt			 	= o.smplnt;
			this.title 			 	= (function(){
				var a = _( o.title|| "&nbsp;");
				return _({
					read: function(){ return a() },
					write: function(v){a( Simplenote.Node.parse(v) ); }
				});
			}());
			this.id				 	= o.id || uuid();
			this.parent     	 	= _((o.parent&&o.parent.id)||o.parent);
			this.tags 			 	= _(o.tags||[]);
			this.note 		 	 	= (function(){
				var a = _( o.note || "" );
				return _({
					read: function(){ return a(); },
					write: function(v){ a( Simplenote.Node.parse(v) ); }
				});
			}());
			this.deadline	     	= _(o.deadline&&new Date(o.deadline)||false);
			this.files		 	 	= _(o.files||[]);
			this.bookmarked  	 	= _(o.bookmarked||false);
			this.done		 	 	= _(o.done||false);
			this.expanded			= _(o.expanded||false);
			this.editingTitle    	= _(false);
			this.active				= _(true);
			this.activeNote			= _(false);
			this.children 	 	 	= _(function(){ return self.smplnt.nodes().filter(function(n){return n.parent()===self.id});});
			this.hasNote		 	= _(function(){ return self.note().length; });
			this.hasChildren		= _(function(){ return self.children().length; });
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
				parent		: this.parent(),
				title 		: this.active() && $(this.element).find(".title").html() || this.title(),
				note 		: this.activeNote() && $(this.element).find(".notes").html() || this.note(),
				expanded	: this.expanded(),
				done 		: this.done(),
				deadline	: this.deadline(),
				tags		: this.tags(),
				files		: this.files(),
				bookmarked	: this.bookmarked()
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
		}
	});	
	
}(function(v){return v&&((v.call||v.read)&&ko.computed(v)||v.map&&ko.observableArray(v))||ko.observable(v)},(function(){ var a = ko.observable(0); setInterval(function(){a(new Date());},1e3); return a; }()),a=(function(c,b,e){c=[],b=function(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)};return function(){while(~c.indexOf(e=b()));return c.push(e),e}}())
));

// Get the party started
(function($,v,e){$(function(){v.element=$(e);v._create($);ko.applyBindings(v);});}(jQuery,window.note = new Simplenote,"#body"));