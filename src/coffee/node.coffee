###
* @class Node
###
class Node
  constructor : ( options ) ->
    # simple variables
    @smplnt = options.smplnt
    @id = uuid()
    # observable variables      
    @parent = obs options.parent or null
    @title = obs ""
    @title.extend parse : Node.parseHeadline
    @note = obs ""
    @note.extend parse : Node.parseNote
    @deadline = obs null
    @deadline.extend parse : Node.parseDate
    @bookmarked = obs false
    @done = obs false
    @expanded = obs false
    @listStyleType = obs []
    @position = obs 0
    @editingTitle = obs false
    @editingNote = obs false
    @selected = obs false
    @current = obs false
    # observable arrays  
    @parents = obs []
    @tags = obs []
    @tags.extend pickFrom : { array: @smplnt.tags, key : "name" }
    @files = obs []
    @children = obs []
    @hasNote = obs => @note().length
    @hasChildren = obs => @children.length
    @cssClass = obs => @listStyleType().concat("node").filter(Boolean).join(" ")
    @bullet = obs => ( @hasNote() or @hasChildren ) and ( not @expanded() and "&#9658;" or @expanded() and "&#9660" ) or "&9679;"
    @deadlineDisplay = obs => 
      time()
      d = @deadline()
      if d is not null
        if d > new Date then moment(d).fromNow()
        else @alarm()
      else ""
    
    # push self to simplenote nodes
    @smplnt.nodes.push @
    
  alarm : ->
    @deadline null
    @smplnt.pop.play()
    alert @title()
    return ""
  editTags : ( n, e ) =>
    $("#tagsMenu")
      .trigger "position", e.target
      .on "menuselect", (e, ui) ->
        return unless ui and ui.item
        if not @tags.remove ui.item then @tags.push ui.item
  
  
  toJSON : =>
    $.extend ko.toJS @, { __constructor : 'Node' }
  
  # STATIC revive from JSON data
  # @param {Object} data json object containting all needed data
  @fromJSON : ( data ) =>
    instance = new @
    koMap instance, data
  # STATIC parseNote
  @parseNote : (v) => v
  @parseHeadline : (v) => v
  @parseDate : (v) => v = new Date v; v = null if not isDate v; v
  
  
  
