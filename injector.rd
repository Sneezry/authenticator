Injector = github.Injector = {}


getSuper = (property, args...) ->
  result = @constructor.__super__[property]
  
  if _.isFunction(result) then result.apply(@, args) else result
  

setupStorage = (model) ->
  {name, type} = model.storage ? {}

  if name and type
    model.chromeStorage = new Backbone.ChromeStorage(name, type)
