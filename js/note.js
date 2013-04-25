var isPlainObject = jQuery.isPlainObject;
(function(_,time,uuid){
	"use strict";
	/*
	 * Simplenote
	 */
	Obj("Simplenote",{
		// private methods
		_init: function(){
			var self 		 	= this;
			this.nodes		 	= _([]);
			this.tags			= _([]);
			this.selected		= _(function(){return self.nodes().filter(function(n){ return n.selected(); });});			
			this.current 		= (function(){
				var a = _(false); return _({read: function(){ return a(); }, write : function(v){ a(v&&v.id&&v||self.nodes().filter(function(n){return n.id===v})[0]);} });
			}());
			this.timeout 		= null;
			this.interval 		= null;
			this.filter = {
				tags : _([]),
				date : {
					compare : _(""),
					withDate : _(0)
				},
				title : _(""),
			};
			this.filter.inactive = _(function(){ return !(self.filter.tags().length||self.filter.date.compare().length||self.filter.title().length);})
			this.filterFn = _(function(){
				return function(node){
					var t = self.filter.tags(), T = node.tags(), c = self.filter.date.compare(), d = self.filter.date.withDate(), D = node.deadline(), s = self.filter.title(), r = s && new RegExp( s, "i" );
					return ( t.length ? ( T.length ? t.every(function(n){return ~T.indexOf(n);}) : false ) : true ) &&
						( d ? ( D ? ( c[0]==="a"?D>d:d>D ) : false ) : true ) &&
						( r ? r.test( node.title() ) : true );
				};
			});
			this.breadcrumbs	= _(function(){
				var x = [], t = self.current();
				while ( t ){ x.unshift( t ); t = self.nodes().filter(function(n){ return n.id === t.parent(); })[0]; }
				return x;
			}).extend({throttle: 10});
			
			this.bookmarks 		= _(function(){
				return self.nodes()[1] ? self.nodes().filter(function(n){return n.bookmarked();}) : [];
			}).extend({throttle: 10});
			
			Simplenote.Route.addRoute(/id\:([\w\d-]{36})/i, function(m){ self.current(m[1]); },function(){ self.current(self.root);});
			Simplenote.Route.addRoute(/tags\:([^\/]*)/,function(m){ m = m&&m[1].split(/\s*,\s*/)||false; m && self.filter.tags(m.map(function(n){return Simplenote.Tag.findByName(n,self)})) || self.filter.tags([]); },function(){self.filter.tags([]);});
		},
		_create: function(){
			var self = this;
			try {
				var json = JSON.parse( localStorage.notes );
				json.tags.forEach(function(n){ Simplenote.Tag( $.extend(n,{smplnt:self}) );});
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
				"keyup, click" : function(e){ self.save.call(self); },
			});			
			this.pop = $("<audio>").attr({src:"snd/pop.mp3"}).appendTo("body")[0];
			self.startPeriodicalSave();
			Simplenote.Route.checkRoute();
		},
		liststyletypes : [
			{ name : "none", value : [] },
			{ name : "1, 2, 3", value: ["decimal"] },
			{ name : "1., 2., 3.", value: ["decimal","dot"] },
			{ name : "1.1, 1.2, 1.3", value : ["decimal","dot","add"] },
			{ name : "a, b, c", value: ["lowerAlpha"] },
			{ name : "(a), (b), (c)", value : ["lowerAlpha","dot"] },
			{ name : "A, B, C", value: ["upperAlpha"] },
			{ name : "(A), (B), (C)", value : ["upperAlpha","dot"] },
			
		],
		attachElement : function(el,item){
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
			var self = (this instanceof Simplenote)?this:ko.contextFor(this).$root;
			clearTimeout( self.timeout );
			self.timeout = setTimeout( function(){ localStorage.notes = JSON.stringify( self.toJSON() ); }, 100 );
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
			return Simplenote.Node($.extend(a,{parent:b.id,smplnt:this}));
		},
		insertNodeAfter : function( b, a ){
			return Simplenote.Node($.extend(a,{listStyleType:b.listStyleType(),parent:b.parent(),smplnt:this,after:b}));
		},
		selection : {
			remove: function(){
				var self = this;
				Simplenote.confirm("Really delete all selected outline nodes?",function(a){
					if (!a) return;
					self.nodes.removeAll(self.selected());
					self.save();
				});
			},
			unselect : function(){
				this.selected().forEach(function(n){ n.selected(false); });
			},
			invert : function(){
				this.nodes().forEach(function(n){ $(n.element).is(":visible") && n.selected(!n.selected()); });
			},
			archive : function(){
			
			},
			editTags : function(){
			
			}
		},
		text : {
			bold:function(){},
			italic:function(){},
			underline:function(){},
			link:function(){},
			embed:function(){}
		},
		hotkeys : notehotkeys,
		toJSON : function(){
			return {
				nodes 	: this.nodes(),
				tags	: this.tags(),
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
	/*
	 * Simplenote.Route
	 */
	Obj("Simplenote.Route",{},{
		routes : [],
		checkRoute : function(){var v=Simplenote.Route.hash(); Simplenote.Route.routes.forEach(function(r,m){ if (m=v.match(r.expr) ) {r.action(m)} else if(r.fail){r.fail();}; }); },
		hash : (function(){var a=_("");function b(v){(typeof v)[0]==="s"?(location.hash="#"+v.replace(/\/$/,""),Simplenote.Route.checkRoute()):a(location.hash.replace(/^#/,"").replace(/\/$/,""));};return (window.onhashchange=b)(),a.subscribe(b),a;}()),
		getHash : function(k){ var m=Simplenote.Route.hash().match( new RegExp(k+"\:([^\/]*)","i") ); return m&&m[1]||0[0];},
		addHash : function(k,v){ Simplenote.Route.hash( Simplenote.Route.hash()+(Simplenote.Route.hash().length?"/":"")+(v?k+":":"")+v ); },
		removeHash : function(k){ var r = new RegExp( "(?:\/)?"+k+"\:[^\/]+","i" ); Simplenote.Route.hash( Simplenote.Route.hash().replace( r, "" ) ); },
		removeFromHash : function(k,v,r,a){
			var r = new RegExp( "("+k+"\:)([^\/]+)","i" ); Simplenote.Route.hash(Simplenote.Route.hash().replace(r,function(m){ m=m.match(r); a=m[2].split(/\s*,\s*/);a.splice(a.indexOf(v),1);return a.length?m[1]+a.join(","):"";}));
		},
		toggleInHash : function(k,v,r){((r = Simplenote.Route).getHash(k) && r.getHash(k).match( new RegExp( v )))?r.removeFromHash(k,v):r.addToHash(k,v)},
		addToHash : function(k,v){ Simplenote.Route.setHash(k,[Simplenote.Route.getHash(k),v].filter(Boolean).join());},
		setHash : function(k,v,r){ (r=Simplenote.Route).hash().match(new RegExp(k,"i"))?r.hash( r.hash().replace(new RegExp(k+"\:([^\/]+)","i"),function(m){m=m.match(/(\w+\:)([^\/])/);return m[1]+v;}) ):r.addHash(k,v); },
		addRoute : function(k,v,f){ Simplenote.Route.routes.push( { "expr" : k.expr || k, "action" : k.action || v, "fail" : k.fail || f } ); Simplenote.Route.checkRoute(); },
		removeRoute : function(k){ Simplenote.Route.routes.forEach(function(r,i){ if ( r.expr.toString() === k.toString() ) delete Simplenote.Route.routes[i]; }); } 
	});
	/*
	 * Simplenote.Tag
	 */
	Obj("Simplenote.Tag",{
		_init: function(o){
			var self = this;
			this.name = _(o.name || o);
			this.color = _(o.color || "white");
			this.smplnt = o.smplnt;
			this.smplnt.tags.push(this);
			this.inFilter = _(function(){return ~self.smplnt.filter.tags().indexOf(self);});
			this.count = _(function(){ return self.smplnt.nodes().filter(function(n){return ~n.tags().indexOf(self);}).length; });
		},
		toJSON : function(){
			return {
				name : this.name(),
				color : this.color()
			};
		},
		toggleThisInFilter : function(){
			Simplenote.Route.toggleInHash("tags",this.name());
		}
	},{
		findByName : function(n,s){
			var a = s.tags().filter(function(m){return m.name()===n;}); return a&&a[0]||0[0];
		}
	});
	/*
	 * Simplenote.Node
	 */
	Obj("Simplenote.Node",{
		// private methods
		_init: function(o){
			//console.log("new node");
			var self 			 	= this;
			this.smplnt			 	= o.smplnt;
			this.id				 	= o.id || uuid();
			this.parent     	 	= _((o.parent&&o.parent.id)||o.parent);
			if ( o.parent === null ) { this.smplnt.root = this }
			this.title 			 	= (function(){ var a = _( o.title&&unescape(o.title)|| ""); return _({ read: function(){ return a() }, write: function(v){a( Simplenote.Node.parseHeadline(v) ); } }); }());
			this.note 		 	 	= (function(){ var a = _( o.note&&unescape(o.note) || "" ); return _({ read: function(){ return a(); }, write: function(v){ a( Simplenote.Node.parseNote(v) ); } }); }());
			this.tags 			 	= _(o.tags&&o.tags.map(function(n){return Simplenote.Tag.findByName(n.name||n,self.smplnt);})||[]);
			this.deadline	     	= _(o.deadline&&new Date(o.deadline)||false);
			this.files		 	 	= _(o.files||[]);
			this.bookmarked  	 	= _(o.bookmarked||false);
			this.done		 	 	= _(o.done||false);
			this.expanded			= _(o.expanded||false);
			this.listStyleType		= _(o.listStyleType||[]);
			this.pos				= _(o.pos||0);
			this.editingTitle    	= _(false);
			this.active				= _(true);
			this.activeNote			= _(false);
			this.selected			= _(false);
			this.isCurrent			= _(function(){ return self === self.smplnt.current(); });
			this.childrenComp		= _(function(){ return self.smplnt.nodes.filter("parent",self.id).sort(function(a,b){return a.pos()-b.pos();});}).extend({throttle:10});
			this.childrenVis		= _(function(){ return self.childrenComp().filter(function(n){return n.display();}); });
			this.children			= _([]);
			this.childrenVis.subscribe(function(v){self.children(v);});
			this.children.subscribe(function(v){v.forEach(function(n,i){ n.pos(i);n.parent(self.id);});});
			this.display			= _(function(){ return self.smplnt.filterFn()( self )||self.children().some(function(n){return n.display()==="block";})});
			this.hasNote		 	= _(function(){ return self.note().length; });
			this.hasChildren		= _(function(){ return self.children().length; });
			this.cssClass			= _(function(){ return self.listStyleType().concat("node").filter(Boolean).join(" "); });
			this.bullet				= _(function(){ return ( self.hasNote() || self.hasChildren() ) && ( !self.expanded() && "&#9658;" || self.expanded() && "&#9660;" ) || "&#9679;"; });
			this.deadlineDisplay 	= _(function(){ time(); var d = self.deadline(); return d?(d>new Date?moment(d).fromNow():self.alarm()):"";});
			this.showEllipsis    	= _(function(){ return self.hasNote() && !self.expanded(); });
		
			if ( o.after ){
				this.smplnt.nodes.splice( this.smplnt.nodes().indexOf( o.after )+1, 0, this );
			} else {
				this.smplnt.nodes.push( this );
			}
		},
		alarm : function(){
			this.deadline(false);
			this.smplnt.pop.play();
			Simplenote.alert( this.title() );
			return"";
		},
		editListStyleType : function(n,e){
			var self = this;
			$("#listStyleTypeMenu")
				.trigger("position", e.target )
				.on("menuselect",function(e,ui){
					if ( !ui || !ui.item ) return;
					self.andSiblings().forEach(function(n){n.listStyleType( ui.item.value )});
				});
		},
		editTags : function(n,e){
			var self = this;
			$("#tagsMenu")
				.trigger("position", e.target )
				.on("menuselect",function(e,ui){
					if ( ! ui || !ui.item ) return;
					if ( ! self.tags.remove( ui.item ).length ) { self.tags.push( ui.item ); }
				});
		},
		editDeadline : function(){
			this.deadline(Date.parse(prompt("enter deadline", this.deadline())));
		},
		editFiles : function(){
			alert("coming soon")
		},
		open : function(){
			Simplenote.Route.setHash( "id", this.id );
		},
		toggleBookmarked : function(){
			this.bookmarked(!this.bookmarked());
		},
		toggleExpanded : function(){
			this.expanded( (this.hasNote() || this.hasChildren) && !this.expanded() );
		},
		toggleSelected : function(){
			this.selected(!this.selected());
		},
		remove : function(){
			confirm("really delete this node?") && this.smplnt.nodes.remove( this );
		},
		siblings : function(){
			return Simplenote.Node.findSiblingsOf( this );
		},
		andSiblings : function(){
			return this.siblings().concat(this);
		},
		toJSON : function(){
			return {
				id 			: this.id,
				pos			: this.pos(),
				parent		: this.parent(),
				title 		: escape( this.active() && $(this.element).find(".title").html() || this.title() ),
				note 		: escape( this.activeNote() && $(this.element).find(".notes").html() || this.note() ),
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
		parseHeadline : function(a){
			return a.replace(/<br>$|<br\/>$/,"")
		},
		parseNote : function(a){
			return a;//Simplenote.Node.parseHeadline(a);
		},
		parsePaste : function(a){
			
		},
		findById : function(id,s,a){
			a=s.nodes().filter(function(n){return n.id===id;}); return a&&a[0]||0[0];
		},
		findSiblingsOf: function( a,b ){
			return b=a.parent(), a.smplnt.nodes().filter(function(n){return n.parent()===b&&a!==n;});
		}
	});	
	
}(function(v,t){return v&&((v.call||v.read||v.read||v.write)&&ko.computed(v)||v.map&&ko.observableArray(v,t||this))||ko.observable(v)},(function(){ var a = ko.observable(0); setInterval(function(){a(new Date());},1e3); return a; }()),a=(function(c,b,e){c=[],b=function(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)};return function(){while(~c.indexOf(e=b()));return c.push(e),e}}())
));

// Get the party started
(function(v,e){$(function(){v.element=$(e);v._create();ko.applyBindings(v);});}(window.note = new Simplenote,"#body"));