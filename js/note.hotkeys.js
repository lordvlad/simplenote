notehotkeys = {
	functions : {
		"next" : function(e,self){
			var a = $(this).findNext(".node:visible"); a.length && (a = ko.dataFor(a[0])) && a.active(true);
		},
		"prev" : function(e,self){
			var a = $(this).parents(".node:visible:first").findPrev(".node:visible"); a.length && (a = ko.dataFor(a[0])) && a.active(true);
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
			//this.innerHTML = Simplenote.Node.parseHeadline(this.innerHTML)
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
}