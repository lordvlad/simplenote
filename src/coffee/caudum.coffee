# jquery closure
do ( $ = jQuery, view = "#body", model = window.note = new SimpleNote ) ->
  # jquery onload event
  $ ->
    # extend window with simplenote classes
    $.extend true, window, {
      SimpleNote  : SimpleNote
      Node    : Node
    }
    # attach view to element
    model.element = $ view
    # apply knockout bindings
    ko.applyBindings model, $(view)[0]
    # revive model
    model.revive()