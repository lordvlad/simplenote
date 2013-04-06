/*
 * creating standartized objects
 */

function Obj(a,b,c){
	"use strict"; (function d(a,b,c){ return a[0]?(c=a.shift(),a[0]?d(a,b[c]=b[c]||{}):b[c]=b[c]||{}):!1; }(a.split(/\./).slice(0,-1),window));
	return $.extend( true, Function("return ("+a+"="+"function(a){if(!(this instanceof "+a+")){return new "+a+"(a);}this._init&&this._init.call(this,a);});")(),{prototype:b},c);
}
(function(_,time,uuid){


	Obj("Simplenote",{
		// private methods
		_init: function(){
			var self 		 = this;
			this.nodes		 = _([]);
			this.branch 	 = _([]);
			this.breadcrumbs = _(function(){
				return self.branch[1] ? self.branch().map(function(n){return n.title();}) : [];
			});
			this.toplvlnodes = _(function(){
				return self.branch()[0] ? self.branch()[self.branch().length-1].children() : [];
			});
		},
		_create: function($){
			var a = Simplenote.Node({
				smplnt : this,
				parent : { id : null },
				title  : "home",
			});
			this.branch.push( a );
		},
		addNodeHere : function( a ){
			this.addNodeAt( a, this.branch()[this.branch().length-1] );
		},
		addNodeAt : function( a, b ){
			Simplenote.Node($.extend(a,{parent:b,smplnt:this}));
		}
	},{
		// static methods
	});

	Obj("Simplenote.Node",{
		// private methods
		_init: function(o){
			var self 		= this;
			this.smplnt		= o.smplnt;
			this.title 		= _(o.title|| "");
			this.id			= o.id || uuid();
			this.parent     = _(o.parent.id);
			this.tags 		= _([]);
			this.note 		= Simplenote.Content(o.content||"");
			this.children 	= _(function(){
				return self.smplnt.nodes().filter(function(n){return n.parent===self.id});
			});
			this.deadline	= _(0);
			this.files		= _([]);
			this.bookmarked = _(false);
			this.done		= _(false);
		
			this.smplnt.nodes.push( this );
		},
		editTags : function(){
			this.tags(prompt("enter tags as a comma-seperated list", this.tags().join(", ")).split(/\s*,\s*/));
		},
		editDeadline : function(){
			
		},
		toggleBookmark : function(){
			this.bookmark(!this.bookmark());
		},
		remove : function(){
			this.smplnt.nodes.remove( this );
		},
		
		
	},{
		// static methods
	});
	
	Obj("Simplenote.Content",{
	
	},{
	
	});
	
}(function(v){return v&&((v.call||v.read)&&ko.computed(v)||v.map&&ko.observableArray(v))||ko.observable(v)},(function(){ var a = ko.observable(0); setInterval(function(){a(new Date());},1e3); return a; }()),a=(function(c,b,e){c=[],b=function(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)};return function(){while(~c.indexOf(e=b()));return c.push(e),e}}())
));

// Get the party started
(function($,v,e){$(function(){v.element=$(e);v._create($);ko.applyBindings(v);});}(jQuery,window.note = new Simplenote,"#body"));