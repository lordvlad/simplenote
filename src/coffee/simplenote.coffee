###
@class SimpleNote
###
class SimpleNote 
  constructor : ->
    # simple variables  
    @timeout   = null
    @interval   = null
    root    = null
    # observable Arrays
    # stores all the nodes
    @nodes     = obs []
    # stores all the tags
    @tags      = obs []
    # all selected elements
    @selected = obs () =>
      @nodes.filter "selected"
    # computed values
    # get and set the currently active nodes
    @current   = obs
      read   : => @nodes.find( "current" ) or null
      write   : ( node ) =>
        @nodes.find( "current" ).current?( false )
        @nodes.find( "id", node.id ? node  ).current?( true )
    # get the parents of the current node
    @breadcrumbs = obs => @current().parents?()
    # get all bookmarked nodes
    @bookmarks = obs =>  if @nodes[1] then @nodes.filter "bookmarked" else []
    # throttle computed variables which depend on nodes
    @current.extend throttle: 10
    @breadcrumbs.extend throttle : 10
    @bookmarks.extend throttle : 10
  
  # only return nodes and tags on serialization
  toJSON : =>
    return {
      nodes   : @nodes()
      tags  : @tags()
    }
    
  # revive from JSON data
  # @param {Object} data json object containting all needed data
  revive : =>
    if data = store.get "simpleNote", true
      koMap @, data
      @root = @nodes.find("id","simpleNoteRoot")
    else 
      root = new Node { smplnt : @ }
      root.id = "simpleNoteRoot"
      @root = root
    @current @root
    @
  
  # saves own data to localStorage
  save : =>
    timout.clear @timeout
    @timeout = timeout.set 100, -> store.set @id, @
    @
    
  create : ->
    try 
      json = JSON.parse localStorage.notes, revive
    catch error 
      @root = SimpleNote.Node smplnt : @, parent : obs null, title : obs "home"
    $doc = $ document
    $doc.on "click", ".headline", (e)->
      $t = $ e.target
      $t.parents(".headline").find("title").focus() unless $t.is(".bullet, .action, .ellipsis, .additional")
    $doc.on  "keydown", wre.HotKeyHandler( @hotkeys, @ )
    $doc.on "keyup, click", => @save()
    @pop = $("<audio>").attr({src:"snd/pop.mp3"}).appendTo("body")[0]
    @startPeriodicalSave()
    @
    
  # functions on self
  startPeriodicalSave : ->
    @interval = interval.set 6e4, @save
    @
    
  stopPeriodicalSave : ->
    interval.clear @interval
    @
    
  # functions on selected nodes  
  selectionRemove : =>
    if confirm "really delete all selected outlines?" 
      @nodes.removeAll @selected()
      @save()
    @
  selectionUnselect : => 
    for node in @selected() 
      do node.selected no
    @
  selectionInvert : =>
    for node in @selected()
      do node.selected not node.selected()
    @
  selectionArchive : =>
    for node in @selected() 
      do node.archived yes
    @
  selectionEditTags : =>
  
  # functions on selected text
  textBold : =>
  textItalics : =>
  textUnderline : =>
  textLink : =>
  textEmbed : =>
  
  # functions that create nodes
  addNodeTo : ( parent, options ) =>
    options = {} unless isObj options
    self = @
    Node $.extend options, { parent: parent, smplnt: self }
  insertNodeHere : ( options ) ->
    @addNodeTo @current(), options
  insertNodeAfter : ( node, options ) ->
    @addNodeTo @current().parent(), options
  
  

SimpleNote.liststyletypes = [
  { name : "none", value : [] }
  { name : "1, 2, 3", value: ["decimal"] }
  { name : "1., 2., 3.", value: ["decimal","dot"] }
  { name : "1.1, 1.2, 1.3", value : ["decimal","dot","add"] }
  { name : "a, b, c", value: ["lowerAlpha"] }
  { name : "(a), (b), (c)", value : ["lowerAlpha","dot"] }
  { name : "A, B, C", value: ["upperAlpha"] }
  { name : "(A), (B), (C)", value : ["upperAlpha","dot"] }
]