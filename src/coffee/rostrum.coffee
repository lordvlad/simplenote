# setTimeout and interval
timeout =
  set : ( ms, fn ) -> setTimeout fn, ms
  clear : ( t ) -> clearTimeout t
interval =
  set : ( ms, fn ) -> setInterval fn, ms
  clear : ( i ) -> clearInterval i

# create storage
store = 
  set : ( key, val ) -> localStorage.setItem key, ( if isString val then val else JSON.stringify val )
  get : ( key, rev ) -> ret = localStorage.getItem key; if rev then JSON.parse ret, revive else JSON.parse ret
  remove : ( key ) -> localStorage.removeItem key
  
# revive objects
revive = ( key, value ) ->
  if value and value.__constructor and ( c = window[ value.__constructor ] or revive.constructors[ value.class ] ) and typeof c.fromJSON is "function" 
    cl.fromJSON( value )
  else value
  
# create observables
obs = ( value, owner ) ->
  switch
    when value and ( value.call or value.read or value.write ) then ko.computed value
    when value and value.map then ko.observableArray value, owner or this
    else ko.observable value
  
# create a uuid
uuid = do () ->
  ids = []
  id = (a) ->
    if a then (a^Math.random()*16>>a/4).toString(16) else ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,id)
  return () ->
    loop
      e=id()
      break if !~ids.indexOf e
    ids.push(e)
    e
    
# create a timer
time = do() ->
  a = obs 0
  interval.set 1e3, ->a new Date
  a

# borrow from jQuery
isFn = jQuery.isFunction
isArr = jQuery.isArray
isObj = jQuery.isPlainObject
isNum = jQuery.isNumeric
isStr = ( v ) -> typeof v is "string"
isDate = ( v ) -> if Object.prototype.toString.call(v) isnt '[object Date]' then return false else return not isNaN v.getTime()
  
# get length of an object, array or string
sizeOf = ( v ) ->
  switch
    when isNum v then v.split("").length
    when isStr v or isArr v then v.length
    when isObj v then (k for own k of v).length
    else null

# map values to an knockout model
koMap = ( model, map ) ->
  for key, value of map
    if ko.isWriteableObservable model[ key ] then model[ key ] value
    else model[ key ] = value
  model
    
    
    
    