/*Garden Topbar*/

(function() { var mlt='g',ml=null; if (typeof exports === 'object') {ml=exports;exports=undefined;mlt='r'} else if (typeof define === 'function' && define.amd) {ml=define;define=undefined;mlt='a'} 

/* Zepto v1.0-1-ga3cab6c - polyfill zepto detect event ajax form fx - zeptojs.com/license */


;(function(undefined){
  if (String.prototype.trim === undefined) // fix for iOS 3.2
    String.prototype.trim = function(){ return this.replace(/^\s+|\s+$/g, '') }

  // For iOS 3.x
  // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
  if (Array.prototype.reduce === undefined)
    Array.prototype.reduce = function(fun){
      if(this === void 0 || this === null) throw new TypeError()
      var t = Object(this), len = t.length >>> 0, k = 0, accumulator
      if(typeof fun != 'function') throw new TypeError()
      if(len == 0 && arguments.length == 1) throw new TypeError()

      if(arguments.length >= 2)
       accumulator = arguments[1]
      else
        do{
          if(k in t){
            accumulator = t[k++]
            break
          }
          if(++k >= len) throw new TypeError()
        } while (true)

      while (k < len){
        if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t)
        k++
      }
      return accumulator
    }

})()

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
    document = window.document,
    elementDisplay = {}, classCache = {},
    getComputedStyle = document.defaultView.getComputedStyle,
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    classSelectorRE = /^\.([\w-]+)$/,
    idSelectorRE = /^#([\w-]*)$/,
    tagSelectorRE = /^[\w-]+$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div')

  zepto.matches = function(element, selector) {
    if (!element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && obj.__proto__ == Object.prototype
  }
  function isArray(value) { return value instanceof Array }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
    if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
    if (!(name in containers)) name = '*'

    var nodes, dom, container = containers[name]
    container.innerHTML = '' + html
    dom = $.each(slice.call(container.childNodes), function(){
      container.removeChild(this)
    })
    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }
    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function(dom, selector) {
    dom = dom || []
    dom.__proto__ = $.fn
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function(selector, context) {
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, juts return it
    else if (zepto.isZ(selector)) return selector
    else {
      var dom
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes. If a plain object is given, duplicate it.
      else if (isObject(selector))
        dom = [isPlainObject(selector) ? $.extend({}, selector) : selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
      // create a new Zepto collection from the nodes found
      return zepto.Z(dom, selector)
    }
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  zepto.qsa = function(element, selector){
    var found
    return (isDocument(element) && idSelectorRE.test(selector)) ?
      ( (found = element.getElementById(RegExp.$1)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
      slice.call(
        classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
        tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
        element.querySelectorAll(selector)
      )
  }

  function filtered(nodes, selector) {
    return selector === undefined ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = function(parent, node) {
    return parent !== node && parent.contains(node)
  }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className,
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    var num
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          !isNaN(num = Number(value)) ? num :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  $.trim = function(str) { return str.trim() }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      if (readyRE.test(document.readyState)) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this
      if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return result
    },
    closest: function(selector, context){
      var node = this[0], collection = false
      if (typeof selector == 'object') collection = $(selector)
      while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
        node = node !== context && !isDocument(node) && node.parentNode
      return $(node)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = null)
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return html === undefined ?
        (this.length > 0 ? this[0].innerHTML : null) :
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        })
    },
    text: function(text){
      return text === undefined ?
        (this.length > 0 ? this[0].textContent : null) :
        this.each(function(){ this.textContent = text })
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && value === undefined) ?
        (this.length == 0 || this[0].nodeType !== 1 ? undefined :
          (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && setAttribute(this, name) })
    },
    prop: function(name, value){
      return (value === undefined) ?
        (this[0] && this[0][name]) :
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        })
    },
    data: function(name, value){
      var data = this.attr('data-' + dasherize(name), value)
      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      return (value === undefined) ?
        (this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(o){ return this.selected }).pluck('value') :
           this[0].value)
        ) :
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        })
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (this.length==0) return null
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2 && typeof property == 'string')
        return this[0] && (this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property))

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      return this.each(function(idx){
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
    scrollTop: function(){
      if (!this.length) return
      return ('scrollTop' in this[0]) ? this[0].scrollTop : this[0].scrollY
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    $.fn[dimension] = function(value){
      var offset, el = this[0],
        Dimension = dimension.replace(/./, function(m){ return m[0].toUpperCase() })
      if (value === undefined) return isWindow(el) ? el['inner' + Dimension] :
        isDocument(el) ? el.documentElement['offset' + Dimension] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var key in node.childNodes) traverseNode(node.childNodes[key], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            argType = type(arg)
            return argType == "object" || argType == "array" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          traverseNode(parent.insertBefore(node, target), function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src)
              window['eval'].call(window, el.innerHTML)
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

window.Zepto = Zepto
'$' in window || (window.$ = Zepto)

;(function($){
  function detect(ua){
    var os = this.os = {}, browser = this.browser = {},
      webkit = ua.match(/WebKit\/([\d.]+)/),
      android = ua.match(/(Android)\s+([\d.]+)/),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      kindle = ua.match(/Kindle\/([\d.]+)/),
      silk = ua.match(/Silk\/([\d._]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
      bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
      rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
      playbook = ua.match(/PlayBook/),
      chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
      firefox = ua.match(/Firefox\/([\d.]+)/)

    // Todo: clean this up with a better OS/browser seperation:
    // - discern (more) between multiple browsers on android
    // - decide if kindle fire in silk mode is android or not
    // - Firefox on Android doesn't specify the Android version
    // - possibly devide in os, device and browser hashes

    if (browser.webkit = !!webkit) browser.version = webkit[1]

    if (android) os.android = true, os.version = android[2]
    if (iphone) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
    if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
    if (webos) os.webos = true, os.version = webos[2]
    if (touchpad) os.touchpad = true
    if (blackberry) os.blackberry = true, os.version = blackberry[2]
    if (bb10) os.bb10 = true, os.version = bb10[2]
    if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2]
    if (playbook) browser.playbook = true
    if (kindle) os.kindle = true, os.version = kindle[1]
    if (silk) browser.silk = true, browser.version = silk[1]
    if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
    if (chrome) browser.chrome = true, browser.version = chrome[1]
    if (firefox) browser.firefox = true, browser.version = firefox[1]

    os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) || (firefox && ua.match(/Tablet/)))
    os.phone  = !!(!os.tablet && (android || iphone || webos || blackberry || bb10 ||
      (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) || (firefox && ua.match(/Mobile/))))
  }

  detect.call($, navigator.userAgent)
  // make available to unit tests
  $.__detect = detect

})(Zepto)

;(function($){
  var $$ = $.zepto.qsa, handlers = {}, _zid = 1, specialEvents={},
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eachEvent(events, fn, iterator){
    if ($.type(events) != "string") $.each(events, iterator)
    else events.split(/\s/).forEach(function(type){ iterator(type, fn) })
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (handler.e == 'focus' || handler.e == 'blur') ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || type
  }

  function add(element, events, fn, selector, getDelegate, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    eachEvent(events, fn, function(event, fn){
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = getDelegate && getDelegate(fn, event)
      var callback  = handler.del || fn
      handler.proxy = function (e) {
        var result = callback.apply(element, [e].concat(e.data))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    eachEvent(events || '', fn, function(event, fn){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    if ($.isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (typeof context == 'string') {
      return $.proxy(fn[context], fn)
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, callback){
    return this.each(function(){
      add(this, event, callback)
    })
  }
  $.fn.unbind = function(event, callback){
    return this.each(function(){
      remove(this, event, callback)
    })
  }
  $.fn.one = function(event, callback){
    return this.each(function(i, element){
      add(this, event, callback, null, function(fn, type){
        return function(){
          var result = fn.apply(element, arguments)
          remove(element, type, fn)
          return result
        }
      })
    })
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }
  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    $.each(eventMethods, function(name, predicate) {
      proxy[name] = function(){
        this[predicate] = returnTrue
        return event[name].apply(event, arguments)
      }
      proxy[predicate] = returnFalse
    })
    return proxy
  }

  // emulates the 'defaultPrevented' property for browsers that have none
  function fix(event) {
    if (!('defaultPrevented' in event)) {
      event.defaultPrevented = false
      var prevent = event.preventDefault
      event.preventDefault = function() {
        this.defaultPrevented = true
        prevent.call(this)
      }
    }
  }

  $.fn.delegate = function(selector, event, callback){
    return this.each(function(i, element){
      add(element, event, callback, selector, function(fn){
        return function(e){
          var evt, match = $(e.target).closest(selector, element).get(0)
          if (match) {
            evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
            return fn.apply(match, [evt].concat([].slice.call(arguments, 1)))
          }
        }
      })
    })
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, callback){
    return !selector || $.isFunction(selector) ?
      this.bind(event, selector || callback) : this.delegate(selector, event, callback)
  }
  $.fn.off = function(event, selector, callback){
    return !selector || $.isFunction(selector) ?
      this.unbind(event, selector || callback) : this.undelegate(selector, event, callback)
  }

  $.fn.trigger = function(event, data){
    if (typeof event == 'string' || $.isPlainObject(event)) event = $.Event(event)
    fix(event)
    event.data = data
    return this.each(function(){
      // items in the collection might not be DOM elements
      // (todo: possibly support events on plain old objects)
      if('dispatchEvent' in this) this.dispatchEvent(event)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, data){
    var e, result
    this.each(function(i, element){
      e = createProxy(typeof event == 'string' ? $.Event(event) : event)
      e.data = data
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return callback ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  ;['focus', 'blur'].forEach(function(name) {
    $.fn[name] = function(callback) {
      if (callback) this.bind(name, callback)
      else this.each(function(){
        try { this[name]() }
        catch(e) {}
      })
      return this
    }
  })

  $.Event = function(type, props) {
    if (typeof type != 'string') props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true, null, null, null, null, null, null, null, null, null, null, null, null)
    event.isDefaultPrevented = function(){ return this.defaultPrevented }
    return event
  }

})(Zepto)

;(function($){
  var jsonpID = 0,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.defaultPrevented
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options){
    if (!('type' in options)) return $.ajax(options)

    var callbackName = 'jsonp' + (++jsonpID),
      script = document.createElement('script'),
      cleanup = function() {
        clearTimeout(abortTimeout)
        $(script).remove()
        delete window[callbackName]
      },
      abort = function(type){
        cleanup()
        // In case of manual abort or timeout, keep an empty function as callback
        // so that the SCRIPT tag that eventually loads won't result in an error.
        if (!type || type == 'timeout') window[callbackName] = empty
        ajaxError(null, type || 'abort', xhr, options)
      },
      xhr = { abort: abort }, abortTimeout

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return false
    }

    window[callbackName] = function(data){
      cleanup()
      ajaxSuccess(data, xhr, options)
    }

    script.onerror = function() { abort('error') }

    script.src = options.url.replace(/=\?/, '=' + callbackName)
    $('head').append(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout')
    }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    accepts: {
      script: 'text/javascript, application/javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true,
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data)
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {})
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
      RegExp.$2 != window.location.host

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)
    if (settings.cache === false) settings.url = appendQuery(settings.url, '_=' + Date.now())

    var dataType = settings.dataType, hasPlaceholder = /=\?/.test(settings.url)
    if (dataType == 'jsonp' || hasPlaceholder) {
      if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
      return $.ajaxJSONP(settings)
    }

    var mime = settings.accepts[dataType],
        baseHeaders = { },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(), abortTimeout

    if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
    if (mime) {
      baseHeaders['Accept'] = mime
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
    settings.headers = $.extend(baseHeaders, settings.headers || {})

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty;
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script')    (1,eval)(result)
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings)
          else ajaxSuccess(result, xhr, settings)
        } else {
          ajaxError(null, xhr.status ? 'error' : 'abort', xhr, settings)
        }
      }
    }

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async)

    for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      return false
    }

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    var hasData = !$.isFunction(data)
    return {
      url:      url,
      data:     hasData  ? data : undefined,
      success:  !hasData ? data : $.isFunction(success) ? success : undefined,
      dataType: hasData  ? dataType || success : success
    }
  }

  $.get = function(url, data, success, dataType){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(url, data, success, dataType){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(url, data, success){
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function(url, data, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
    options.success = function(response){
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)

;(function ($) {
  $.fn.serializeArray = function () {
    var result = [], el
    $( Array.prototype.slice.call(this.get(0).elements) ).each(function () {
      el = $(this)
      var type = el.attr('type')
      if (this.nodeName.toLowerCase() != 'fieldset' &&
        !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
        ((type != 'radio' && type != 'checkbox') || this.checked))
        result.push({
          name: el.attr('name'),
          value: el.val()
        })
    })
    return result
  }

  $.fn.serialize = function () {
    var result = []
    this.serializeArray().forEach(function (elm) {
      result.push( encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value) )
    })
    return result.join('&')
  }

  $.fn.submit = function (callback) {
    if (callback) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.defaultPrevented) this.get(0).submit()
    }
    return this
  }

})(Zepto)

;(function($, undefined){
  var prefix = '', eventPrefix, endEventName, endAnimationName,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS' },
    document = window.document, testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    transform,
    transitionProperty, transitionDuration, transitionTiming,
    animationName, animationDuration, animationTiming,
    cssReset = {}

  function dasherize(str) { return downcase(str.replace(/([a-z])([A-Z])/, '$1-$2')) }
  function downcase(str) { return str.toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : downcase(name) }

  $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + downcase(vendor) + '-'
      eventPrefix = event
      return false
    }
  })

  transform = prefix + 'transform'
  cssReset[transitionProperty = prefix + 'transition-property'] =
  cssReset[transitionDuration = prefix + 'transition-duration'] =
  cssReset[transitionTiming   = prefix + 'transition-timing-function'] =
  cssReset[animationName      = prefix + 'animation-name'] =
  cssReset[animationDuration  = prefix + 'animation-duration'] =
  cssReset[animationTiming    = prefix + 'animation-timing-function'] = ''

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    speeds: { _default: 400, fast: 200, slow: 600 },
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  }

  $.fn.animate = function(properties, duration, ease, callback){
    if ($.isPlainObject(duration))
      ease = duration.easing, callback = duration.complete, duration = duration.duration
    if (duration) duration = (typeof duration == 'number' ? duration :
                    ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
    return this.anim(properties, duration, ease, callback)
  }

  $.fn.anim = function(properties, duration, ease, callback){
    var key, cssValues = {}, cssProperties, transforms = '',
        that = this, wrappedCallback, endEvent = $.fx.transitionEnd

    if (duration === undefined) duration = 0.4
    if ($.fx.off) duration = 0

    if (typeof properties == 'string') {
      // keyframe animation
      cssValues[animationName] = properties
      cssValues[animationDuration] = duration + 's'
      cssValues[animationTiming] = (ease || 'linear')
      endEvent = $.fx.animationEnd
    } else {
      cssProperties = []
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
        else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

      if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
      if (duration > 0 && typeof properties === 'object') {
        cssValues[transitionProperty] = cssProperties.join(', ')
        cssValues[transitionDuration] = duration + 's'
        cssValues[transitionTiming] = (ease || 'linear')
      }
    }

    wrappedCallback = function(event){
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
        $(event.target).unbind(endEvent, wrappedCallback)
      }
      $(this).css(cssReset)
      callback && callback.call(this)
    }
    if (duration > 0) this.bind(endEvent, wrappedCallback)

    // trigger page reflow so new elements can animate
    this.size() && this.get(0).clientLeft

    this.css(cssValues)

    if (duration <= 0) setTimeout(function() {
      that.each(function(){ wrappedCallback.call(this) })
    }, 0)

    return this
  }

  testEl = null
})(Zepto);

/**
 * Adapted for use in the browser and packaged for Kanso by Caolan McMahon.
 * This build does not include IDNA Support in order to avoid the punycode
 * dependency.
 *
 * Adding amd support.
 *
 * @module
 */


// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


// IDNA SUPPORT REMOVED FOR KANSO BUILD
//var punycode = require('punycode');

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['querystring'],factory);
    } else {
        root.url = factory(root.querystring);
    }
}(this, function (querystring) {

var exports = {};

// ADDED FOR BROWSER SUPPORT - functions borrowed from underscore.js
var _keys = Object.keys || function(obj) {
  if (obj !== Object(obj)) throw new TypeError('Invalid object');
  var keys = [];
  for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
  return keys;
};
var nativeIndexOf = Array.prototype.indexOf;
var _indexOf = function(array, item) {
  if (array == null) return -1;
  var i, l;
  if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
  for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
  return -1;
};


exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]+$/,
    // RFC 2396: characters reserved for delimiting URLs.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '~', '[', ']', '`'].concat(delims),
    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''],
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#']
      .concat(unwise).concat(autoEscape),
    nonAuthChars = ['/', '@', '?', '#'].concat(delims),
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,
    hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always have a path component.
    pathedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    }


function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && typeof(url) === 'object' && url.href) return url;

  if (typeof url !== 'string') {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var out = {},
      rest = url;

  // cut off any delimiters.
  // This is to support parse stuff like "<http://foo.com>"
  for (var i = 0, l = rest.length; i < l; i++) {
    if (_indexOf(delims, rest.charAt(i)) === -1) break;
  }
  if (i !== 0) rest = rest.substr(i);


  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    out.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      out.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {
    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    // don't enforce full RFC correctness, just be unstupid about it.

    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the first @ sign, unless some non-auth character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    var atSign = rest.indexOf('@');
    if (atSign !== -1) {
      // there *may be* an auth
      var hasAuth = true;
      for (var i = 0, l = nonAuthChars.length; i < l; i++) {
        var index = rest.indexOf(nonAuthChars[i]);
        if (index !== -1 && index < atSign) {
          // not a valid auth.  Something like http://foo.com/bar@baz/
          hasAuth = false;
          break;
        }
      }
      if (hasAuth) {
        // pluck off the auth portion.
        out.auth = rest.substr(0, atSign);
        rest = rest.substr(atSign + 1);
      }
    }

    var firstNonHost = -1;
    for (var i = 0, l = nonHostChars.length; i < l; i++) {
      var index = rest.indexOf(nonHostChars[i]);
      if (index !== -1 &&
          (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
    }

    if (firstNonHost !== -1) {
      out.host = rest.substr(0, firstNonHost);
      rest = rest.substr(firstNonHost);
    } else {
      out.host = rest;
      rest = '';
    }

    // pull out port.
    var p = parseHost(out.host);
    var keys = _keys(p);
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      out[key] = p[key];
    }

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    out.hostname = out.hostname || '';

    // validate a little.
    if (out.hostname.length > hostnameMaxLen) {
      out.hostname = '';
    } else {
      var hostparts = out.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            out.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    // hostnames are always lower case.
    out.hostname = out.hostname.toLowerCase();


    // IDNA SUPPORT REMOVED FOR KANSO BUILD

    // IDNA Support: Returns a puny coded representation of "domain".
    // It only converts the part of the domain name that
    // has non ASCII characters. I.e. it dosent matter if
    // you call it with a domain that already is in ASCII.
    /*
    var domainArray = out.hostname.split('.');
    var newOut = [];
    for (var i = 0; i < domainArray.length; ++i) {
      var s = domainArray[i];
      newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
          'xn--' + punycode.encode(s) : s);
    }
    out.hostname = newOut.join('.');
    */


    out.host = (out.hostname || '') +
        ((out.port) ? ':' + out.port : '');
    out.href += out.host;
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }

    // Now make sure that delims never appear in a url.
    var chop = rest.length;
    for (var i = 0, l = delims.length; i < l; i++) {
      var c = rest.indexOf(delims[i]);
      if (c !== -1) {
        chop = Math.min(c, chop);
      }
    }
    rest = rest.substr(0, chop);
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    out.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    out.search = rest.substr(qm);
    out.query = rest.substr(qm + 1);
    if (parseQueryString) {
      out.query = querystring.parse(out.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    out.search = '';
    out.query = {};
  }
  if (rest) out.pathname = rest;
  if (slashedProtocol[proto] &&
      out.hostname && !out.pathname) {
    out.pathname = '/';
  }

  //to support http.request
  if (out.pathname || out.search) {
    out.path = (out.pathname ? out.pathname : '') +
               (out.search ? out.search : '');
  }

  // finally, reconstruct the href based on what has been validated.
  out.href = urlFormat(out);
  return out;
}

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (typeof(obj) === 'string') obj = urlParse(obj);

  var auth = obj.auth || '';
  if (auth) {
    auth = auth.split('@').join('%40');
    for (var i = 0, l = nonAuthChars.length; i < l; i++) {
      var nAC = nonAuthChars[i];
      auth = auth.split(nAC).join(encodeURIComponent(nAC));
    }
    auth += '@';
  }

  var protocol = obj.protocol || '',
      host = (obj.host !== undefined) ? auth + obj.host :
          obj.hostname !== undefined ? (
              auth + obj.hostname +
              (obj.port ? ':' + obj.port : '')
          ) :
          false,
      pathname = obj.pathname || '',
      query = obj.query &&
              ((typeof obj.query === 'object' &&
                _keys(obj.query).length) ?
                 querystring.stringify(obj.query) :
                 '') || '',
      search = obj.search || (query && ('?' + query)) || '',
      hash = obj.hash || '';

  if (protocol && protocol.substr(protocol.length - 1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (obj.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  return protocol + host + pathname + search + hash;
}

function urlResolve(source, relative) {
  return urlFormat(urlResolveObject(source, relative));
}

function urlResolveObject(source, relative) {
  if (!source) return relative;

  source = urlParse(urlFormat(source), false, true);
  relative = urlParse(urlFormat(relative), false, true);

  // hash is always overridden, no matter what.
  source.hash = relative.hash;

  if (relative.href === '') {
    source.href = urlFormat(source);
    return source;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    relative.protocol = source.protocol;
    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[relative.protocol] &&
        relative.hostname && !relative.pathname) {
      relative.path = relative.pathname = '/';
    }
    relative.href = urlFormat(relative);
    return relative;
  }

  if (relative.protocol && relative.protocol !== source.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      relative.href = urlFormat(relative);
      return relative;
    }
    source.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      relative.pathname = relPath.join('/');
    }
    source.pathname = relative.pathname;
    source.search = relative.search;
    source.query = relative.query;
    source.host = relative.host || '';
    source.auth = relative.auth;
    source.hostname = relative.hostname || relative.host;
    source.port = relative.port;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.slashes = source.slashes || relative.slashes;
    source.href = urlFormat(source);
    return source;
  }

  var isSourceAbs = (source.pathname && source.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host !== undefined ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (source.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = source.pathname && source.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = source.protocol &&
          !slashedProtocol[source.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // source.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {

    delete source.hostname;
    delete source.port;
    if (source.host) {
      if (srcPath[0] === '') srcPath[0] = source.host;
      else srcPath.unshift(source.host);
    }
    delete source.host;
    if (relative.protocol) {
      delete relative.hostname;
      delete relative.port;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      delete relative.host;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    source.host = (relative.host || relative.host === '') ?
                      relative.host : source.host;
    source.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : source.hostname;
    source.search = relative.search;
    source.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    source.search = relative.search;
    source.query = relative.query;
  } else if ('search' in relative) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      source.hostname = source.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = source.host && source.host.indexOf('@') > 0 ?
                       source.host.split('@') : false;
      if (authInHost) {
        source.auth = authInHost.shift();
        source.host = source.hostname = authInHost.shift();
      }
    }
    source.search = relative.search;
    source.query = relative.query;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.href = urlFormat(source);
    return source;
  }
  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    delete source.pathname;
    //to support http.request
    if (!source.search) {
      source.path = '/' + source.search;
    } else {
      delete source.path;
    }
    source.href = urlFormat(source);
    return source;
  }
  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(srcPath.length - 1)[0];
  var hasTrailingSlash = (
      (source.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(srcPath.join('/').length - 1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    source.hostname = source.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = source.host && source.host.indexOf('@') > 0 ?
                     source.host.split('@') : false;
    if (authInHost) {
      source.auth = authInHost.shift();
      source.host = source.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (source.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  source.pathname = srcPath.join('/');
  //to support request.http
  if (source.pathname !== undefined || source.search !== undefined) {
    source.path = (source.pathname ? source.pathname : '') +
                  (source.search ? source.search : '');
  }
  source.auth = relative.auth || source.auth;
  source.slashes = source.slashes || relative.slashes;
  source.href = urlFormat(source);
  return source;
}

function parseHost(host) {
  var out = {};
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    out.port = port.substr(1);
    host = host.substr(0, host.length - port.length);
  }
  if (host) out.hostname = host;
  return out;
}
    return exports;
}));
/*global setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root = this,
        previous_async = root.async;

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    //// cross-browser compatiblity functions ////

    var _forEach = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _forEach(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _forEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        async.nextTick = function (fn) {
            setTimeout(fn, 0);
        };
    }
    else {
        async.nextTick = process.nextTick;
    }

    async.forEach = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _forEach(arr, function (x) {
            iterator(x, function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback(null);
                    }
                }
            });
        });
    };

    async.forEachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };

    async.forEachLimit = function (arr, limit, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length || limit <= 0) {
            return callback();
        }
        var completed = 0;
        var started = 0;
        var running = 0;

        (function replenish () {
            if (completed === arr.length) {
                return callback();
            }

            while (running < limit && started < arr.length) {
                started += 1;
                running += 1;
                iterator(arr[started - 1], function (err) {
                    if (err) {
                        callback(err);
                        callback = function () {};
                    }
                    else {
                        completed += 1;
                        running -= 1;
                        if (completed === arr.length) {
                            callback();
                        }
                        else {
                            replenish();
                        }
                    }
                });
            }
        })();
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEach].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);


    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.forEachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _forEach(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _forEach(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                if (err) {
                    callback(err);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    taskComplete();
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.nextTick(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    async.parallel = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEach(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.queue = function (worker, concurrency) {
        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _forEach(data, function(task) {
                    q.tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (q.saturated && q.tasks.length == concurrency) {
                        q.saturated();
                    }
                    async.nextTick(q.process);
                });
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if(q.empty && q.tasks.length == 0) q.empty();
                    workers += 1;
                    worker(task.data, function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if(q.drain && q.tasks.length + workers == 0) q.drain();
                        q.process();
                    });
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _forEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define('async', [], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

//     Underscore.js 1.3.3
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js** and **"CommonJS"**, with
  // backwards-compatibility for the old `require()` API. If we're not in
  // CommonJS, add `_` to the global object via a string identifier for
  // the Closure Compiler "advanced" mode. Registration as an AMD module
  // via define() happens at the end of this file.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      rand = Math.floor(Math.random() * (index + 1));
      shuffled[index] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, val, context) {
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      if (a === void 0) return 1;
      if (b === void 0) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj)                                     return [];
    if (_.isArray(obj))                           return slice.call(obj);
    if (_.isArguments(obj))                       return slice.call(obj);
    if (obj.toArray && _.isFunction(obj.toArray)) return obj.toArray();
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.isArray(obj) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var results = [];
    // The `isSorted` flag is irrelevant if the array only contains two elements.
    if (array.length < 3) isSorted = true;
    _.reduce(initial, function (memo, value, index) {
      if (isSorted ? _.last(memo) !== value || !memo.length : !_.include(memo, value)) {
        memo.push(value);
        results.push(array[index]);
      }
      return memo;
    }, []);
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1), true);
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more, result;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        result = func.apply(context, args);
      }
      whenDone();
      throttling = true;
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var result = {};
    each(_.flatten(slice.call(arguments, 1)), function(key) {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return _.isNumber(obj) && isFinite(obj);
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Has own property?
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    '\\': '\\',
    "'": "'",
    'r': '\r',
    'n': '\n',
    't': '\t',
    'u2028': '\u2028',
    'u2029': '\u2029'
  };

  for (var p in escapes) escapes[escapes[p]] = p;
  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(unescaper, function(match, escape) {
      return escapes[escape];
    });
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults(settings || {}, _.templateSettings);

    // Compile the template source, taking care to escape characters that
    // cannot be included in a string literal and then unescape them in code
    // blocks.
    var source = "__p+='" + text
      .replace(escaper, function(match) {
        return '\\' + escapes[match];
      })
      .replace(settings.escape || noMatch, function(match, code) {
        return "'+\n_.escape(" + unescape(code) + ")+\n'";
      })
      .replace(settings.interpolate || noMatch, function(match, code) {
        return "'+\n(" + unescape(code) + ")+\n'";
      })
      .replace(settings.evaluate || noMatch, function(match, code) {
        return "';\n" + unescape(code) + "\n;__p+='";
      }) + "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __p='';" +
      "var print=function(){__p+=Array.prototype.join.call(arguments, '')};\n" +
      source + "return __p;\n";

    var render = new Function(settings.variable || 'obj', '_', source);
    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for build time
    // precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' +
      source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

  // AMD define happens at the end for compatibility with AMD loaders
  // that don't enforce next-turn semantics on modules.
  if (typeof define === 'function' && define.amd) {
    define('underscore', function() {
      var exports = _;
      exports._ = _;
      return exports;
    });
  }

}).call(this);

/**
 * ## Events module
 *
 * This is a browser port of the node.js events module. Many objects and
 * modules emit events and these are instances of events.EventEmitter.
 *

 *
 * Functions can then be attached to objects, to be executed when an event is
 * emitted. These functions are called listeners.
 *
 * @module
 */

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.events = factory();
    }
}(this, function () {
/**
 * To access the EventEmitter class, require('events').EventEmitter.
 *
 * When an EventEmitter instance experiences an error, the typical action is to
 * emit an 'error' event. Error events are treated as a special case. If there
 * is no listener for it, then the default action is for the error to throw.
 *
 * All EventEmitters emit the event 'newListener' when new listeners are added.
 *
 * @name events.EventEmitter
 * @api public
 *
 * ```javascript
 *
 * // create an event emitter
 * var emitter = new EventEmitter();
 * ```
 */
 var exports = {};

var EventEmitter = function () {};

exports.EventEmitter = EventEmitter;

var toString = Object.prototype.toString;

var isArray = Array.isArray || function (obj) {
    return toString.call(obj) === '[object Array]';
};

var _indexOf = function (arr, el) {
    if (arr.indexOf) {
        return arr.indexOf(el);
    }
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === el) {
            return i;
        }
    }
    return -1;
};


/**
 * By default EventEmitters will print a warning if more than 10 listeners are
 * added for a particular event. This is a useful default which helps finding
 * memory leaks. Obviously not all Emitters should be limited to 10. This
 * function allows that to be increased. Set to zero for unlimited.
 *
 * @name emitter.setMaxListeners(n)
 * @param {Number} n - The maximum number of listeners
 * @api public
 */

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


/**
 * Execute each of the listeners in order with the supplied arguments.
 *
 * @name emitter.emit(event, [arg1], [arg2], [...])
 * @param {String} event - The event name/id to fire
 * @api public
 */

EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};


/**
 * Adds a listener to the end of the listeners array for the specified event.
 *
 * @name emitter.on(event, listener) | emitter.addListener(event, listener)
 * @param {String} event - The event name/id to listen for
 * @param {Function} listener - The function to bind to the event
 * @api public
 *
 * ```javascript
 * session.on('change', function (userCtx) {
 *     console.log('session changed!');
 * });
 * ```
 */

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

/**
 * Adds a one time listener for the event. This listener is invoked only the
 * next time the event is fired, after which it is removed.
 *
 * @name emitter.once(event, listener)
 * @param {String} event- The event name/id to listen for
 * @param {Function} listener - The function to bind to the event
 * @api public
 *
 * ```javascript
 * db.once('unauthorized', function (req) {
 *     // this event listener will fire once, then be unbound
 * });
 * ```
 */

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

/**
 * Remove a listener from the listener array for the specified event. Caution:
 * changes array indices in the listener array behind the listener.
 *
 * @name emitter.removeListener(event, listener)
 * @param {String} event - The event name/id to remove the listener from
 * @param {Function} listener - The listener function to remove
 * @api public
 *
 * ```javascript
 * var callback = function (init) {
 *     console.log('duality app loaded');
 * };
 * devents.on('init', callback);
 * // ...
 * devents.removeListener('init', callback);
 * ```
 */

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = _indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

/**
 * Removes all listeners, or those of the specified event.
 *
 * @name emitter.removeAllListeners([event])
 * @param {String} event - Event name/id to remove all listeners for (optional)
 * @api public
 */

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

/**
 * Returns an array of listeners for the specified event. This array can be
 * manipulated, e.g. to remove listeners.
 *
 * @name emitter.listeners(event)
 * @param {String} events - The event name/id to return listeners for
 * @api public
 *
 * ```javascript
 * session.on('change', function (stream) {
 *     console.log('session changed');
 * });
 * console.log(util.inspect(session.listeners('change'))); // [ [Function] ]
 * ```
 */

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};


/**
 * @name emitter Event: 'newListener'
 *
 * This event is emitted any time someone adds a new listener.
 *
 * ```javascript
 * emitter.on('newListener', function (event, listener) {
 *     // new listener added
 * });
 * ```
 */

return exports;

}));
/*
 * Stately.js: A JavaScript based finite-state machine (FSM) engine.
 *
 * Copyright (c) 2012 Florian Schäfer (florian.schaefer@gmail.com)
 * Released under MIT license.
 *
 * Version: 1.0.0
 *
 */
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.Stately = factory();
    }
})(this, function () {

    var
        toString = Object.prototype.toString,

        InvalidStateError = (function () {

            function InvalidStateError(message) {

                this.name = 'InvalidStateError';

                this.message = message;
            }

            InvalidStateError.prototype = new Error();

            InvalidStateError.prototype.constructor = InvalidStateError;

            return InvalidStateError;
        })();

    function Stately(statesObject) {

        if (typeof statesObject === 'function') {

            statesObject = statesObject();
        }

        if (toString.call(statesObject) !== '[object Object]') {

            throw new InvalidStateError('Stately.js: Invalid states object: `' + statesObject + '`.');
        }

        var
            currentState,

            notificationStore = [],

            notify = function () {

                var notifications = notificationStore.slice();

                for (var i = 0, l = notifications.length; i < l; i++) {

                    notifications[i].apply(this, arguments);
                }
            },

            stateStore = {

                getMachineState: function getMachineState() {

                    return currentState.name;
                },

                setMachineState: function setMachineState(nextState /*, eventName */) {

                    var
                        eventName = arguments[1],

                        onBeforeState,

                        onEnterState,

                        onLeaveState,

                        lastState = currentState;

                    if (!nextState || !nextState.name || !stateStore[nextState.name]) {

                        throw new InvalidStateError('Stately.js: Transitioned into invalid state: `' + setMachineState.caller + '`.');
                    }

                    currentState = nextState;

                    onBeforeState = stateMachine['onbefore' + currentState.name];

                    if (onBeforeState && typeof onBeforeState === 'function') {

                        onBeforeState.call(stateStore, eventName, lastState.name, nextState.name);
                    }

                    onEnterState = stateMachine['onenter' + currentState.name] || stateMachine['on' + currentState.name];

                    if (onEnterState && typeof onEnterState === 'function') {

                        onEnterState.call(stateStore, eventName, lastState.name, nextState.name);
                    }

                    onLeaveState = stateMachine['onleave' + lastState.name];

                    if (onLeaveState && typeof onLeaveState === 'function') {

                        onLeaveState.call(stateStore, eventName, lastState.name, nextState.name);
                    }

                    notify.call(stateStore, eventName, lastState.name, nextState.name);

                    return this;
                },

                getMachineEvents: function getMachineEvents() {

                    var events = [];

                    for (var property in currentState) {

                        if (currentState.hasOwnProperty(property)) {

                            if (typeof currentState[property] === 'function') {

                                events.push(property);
                            }
                        }
                    }

                    return events;
                }

            },

            stateMachine = {

                getMachineState: stateStore.getMachineState,

                getMachineEvents: stateStore.getMachineEvents,

                bind: function bind(callback) {

                    if (callback) {

                        notificationStore.push(callback);
                    }

                    return this;
                },

                unbind: function unbind(callback) {

                    if (!callback) {

                        notificationStore = [];

                    } else {

                        for (var i = 0, l = notificationStore.length; i < l; i++) {

                            if (notificationStore[i] === callback) {

                                notificationStore.splice(i, 1);
                            }
                        }
                    }

                    return this;
                }
            },

            transition = function transition(stateName, eventName, nextEvent) {

                return function event() {

                    var
                        onBeforeEvent,

                        onAfterEvent,

                        nextState,

                        eventValue = stateMachine;

                    if (stateStore[stateName] !== currentState) {

                        if (nextEvent) {

                            eventValue = nextEvent.apply(stateStore, arguments);
                        }

                        return eventValue;
                    }

                    onBeforeEvent = stateMachine['onbefore' + eventName];

                    if (onBeforeEvent && typeof onBeforeEvent === 'function') {

                        onBeforeEvent.call(stateStore, eventName, currentState.name, currentState.name);
                    }

                    eventValue = stateStore[stateName][eventName].apply(stateStore, arguments);

                    if (typeof eventValue === 'undefined') {

                        nextState = currentState;

                        eventValue = stateMachine;

                    } else if (toString.call(eventValue) === '[object Object]') {

                        nextState = (eventValue === stateStore ? currentState : eventValue);

                        eventValue = stateMachine;

                    } else if (toString.call(eventValue) === '[object Array]' && eventValue.length >= 1) {

                        nextState = eventValue[0];

                        eventValue = eventValue[1];
                    }

                    onAfterEvent = stateMachine['onafter' + eventName] || stateMachine['on' + eventName];

                    if (onAfterEvent && typeof onAfterEvent === 'function') {

                        onAfterEvent.call(stateStore, eventName, currentState.name, nextState.name);
                    }

                    stateStore.setMachineState(nextState, eventName);

                    return eventValue;
                };
            };

        for (var stateName in statesObject) {

            if (statesObject.hasOwnProperty(stateName)) {

                stateStore[stateName] = statesObject[stateName];

                for (var eventName in stateStore[stateName]) {

                    if (stateStore[stateName].hasOwnProperty(eventName)) {

                        if (typeof stateStore[stateName][eventName] === 'string') {

                            stateStore[stateName][eventName] = (function (stateName) {

                                return function event() {

                                    return this[stateName];
                                };

                            })(stateStore[stateName][eventName]);
                        }

                        if (typeof stateStore[stateName][eventName] === 'function') {

                            stateMachine[eventName] = transition(stateName, eventName, stateMachine[eventName]);
                        }
                    }
                }

                stateStore[stateName].name = stateName;

                if (!currentState) {

                    currentState = stateStore[stateName];
                }
            }
        }

        if (!currentState) {

            throw new InvalidStateError('Stately.js: Invalid initial state.');
        }

        return stateMachine;
    }

    Stately.machine = function machine(statesObject) {
        return new Stately(statesObject);
    };

    Stately.InvalidStateError = InvalidStateError;

    return Stately;

});

/* svg.js v0.5-5-g7a2188b - svg element container fx event group arrange defs mask pattern gradient doc shape wrap rect ellipse line poly path image text nested sugar - svgjs.com/license */
(function (root, factory) {if (typeof exports === 'object') {module.exports = factory(); } else if (typeof define === 'function' && define.amd) {define([],factory); } else {root.jscss = factory(); } }(this, function () {

  this.svg = function(element) {
    return new SVG.Doc(element);
  };
  
  // The main wrapping element
  this.SVG = {
    /* default namespaces */
    ns:    'http://www.w3.org/2000/svg',
    xlink: 'http://www.w3.org/1999/xlink',
    
    /* defs id sequence */
    did: 0,
    
    // Method for element creation
    create: function(element) {
      return document.createElementNS(this.ns, element);
    },
    // Method for extending objects
    extend: function(object, module) {
      for (var key in module)
        object.prototype[key] = module[key];
    }
    
  };

  SVG.Element = function Element(node) {
    /* keep reference to the element node */
    if (this.node = node)
      this.type = node.nodeName;
    
    /* initialize attribute store with defaults */
    this.attrs = {
      'fill-opacity':   1,
      'stroke-opacity': 1,
      'stroke-width':   0,
      fill:     '#000',
      stroke:   '#000',
      opacity:  1,
      x:        0,
      y:        0,
      cx:       0,
      cy:       0,
      width:    0,
      height:   0,
      r:        0,
      rx:       0,
      ry:       0
    };
    
    /* initialize transformation store with defaults */
    this.trans = {
      x:        0,
      y:        0,
      scaleX:   1,
      scaleY:   1,
      rotation: 0,
      skewX:    0,
      skewY:    0
    };
  
  };
  
  //
  SVG.extend(SVG.Element, {
    // Move element to given x and y values
    move: function(x, y) {
      return this.attr({
        x: x,
        y: y
      });
    },
    // Move element by its center
    center: function(x, y) {
      var box = this.bbox();
      
      return this.move(x - box.width / 2, y - box.height / 2);
    },
    // Set element size to given width and height
    size: function(width, height) { 
      return this.attr({
        width:  width,
        height: height
      });
    },
    // Clone element
    clone: function() {
      var clone;
      
      /* if this is a wrapped shape */
      if (this instanceof SVG.Wrap) {
        /* build new wrapped shape */
        clone = this.parent[this.child.node.nodeName]();
        clone.attrs = this.attrs;
        
        /* copy child attributes and transformations */
        clone.child.trans = this.child.trans;
        clone.child.attr(this.child.attrs).transform({});
        
        /* re-plot shape */
        if (clone.plot)
          clone.plot(this.child.attrs[this.child instanceof SVG.Path ? 'd' : 'points']);
        
      } else {
        var name = this.node.nodeName;
        
        /* invoke shape method with shape-specific arguments */
        clone = name == 'rect' ?
          this.parent[name](this.attrs.width, this.attrs.height) :
        name == 'ellipse' ?
          this.parent[name](this.attrs.rx * 2, this.attrs.ry * 2) :
        name == 'image' ?
          this.parent[name](this.src) :
        name == 'text' ?
          this.parent[name](this.content) :
        name == 'g' ?
          this.parent.group() :
          this.parent[name]();
        
        clone.attr(this.attrs);
      }
      
      /* copy transformations */
      clone.trans = this.trans;
      
      /* apply attributes and translations */
      return clone.transform({});
    },
    // Remove element
    remove: function() {
      return this.parent != null ? this.parent.remove(this) : void 0;
    },
    // Get parent document
    doc: function() {
      return this._parent(SVG.Doc);
    },
    // Get parent nested document
    nested: function() {
      return this._parent(SVG.Nested);
    },
    // Set svg element attribute
    attr: function(a, v, n) {
      if (arguments.length < 2) {
        /* apply every attribute individually if an object is passed */
        if (typeof a == 'object')
          for (v in a) this.attr(v, a[v]);
        
        /* act as a getter for style attributes */
        else if (this._isStyle(a))
          return a == 'text' ?
                   this.content :
                 a == 'leading' ?
                   this[a] :
                   this.style[a];
        
        /* act as a getter if the first and only argument is not an object */
        else
          return this.attrs[a];
      
      } else {
        /* store value */
        this.attrs[a] = v;
        
        /* treat x differently on text elements */
        if (a == 'x' && this._isText())
          for (var i = this.lines.length - 1; i >= 0; i--)
            this.lines[i].attr(a, v);
        
        /* set the actual attribute */
        else
          n != null ?
            this.node.setAttributeNS(n, a, v) :
            this.node.setAttribute(a, v);
        
        /* if the passed argument belongs to the style as well, add it there */
        if (this._isStyle(a)) {
          a == 'text' ?
            this.text(v) :
          a == 'leading' ?
            this[a] = v :
            this.style[a] = v;
        
          this.text(this.content);
        }
      }
      
      return this;
    },
    // Manage transformations
    transform: function(o) {
      /* act as a getter if the first argument is a string */
      if (typeof o === 'string')
        return this.trans[o];
        
      /* ... otherwise continue as a setter */
      var key, transform = [];
      
      /* merge values */
      for (key in o)
        if (o[key] != null)
          this.trans[key] = o[key];
      
      /* alias current transformations */
      o = this.trans;
      
      /* add rotation */
      if (o.rotation != 0) {
        var box = this.bbox();
        transform.push('rotate(' + o.rotation + ',' + (o.cx != null ? o.cx : box.cx) + ',' + (o.cy != null ? o.cy : box.cy) + ')');
      }
      
      /* add scale */
      transform.push('scale(' + o.scaleX + ',' + o.scaleY + ')');
      
      /* add skew on x axis */
      if (o.skewX != 0)
        transform.push('skewX(' + o.skewX + ')');
      
      /* add skew on y axis */
      if (o.skewY != 0)
        transform.push('skewY(' + o.skewY + ')')
      
      /* add translation */
      transform.push('translate(' + o.x + ',' + o.y + ')');
      
      /* add only te required transformations */
      return this.attr('transform', transform.join(' '));
    },
    // Store data values on svg nodes
    data: function(a, v, r) {
      if (arguments.length < 2) {
        try {
          return JSON.parse(this.attr('data-' + a));
        } catch(e) {
          return this.attr('data-' + a);
        };
        
      } else {
        v === null ?
          this.node.removeAttribute('data-' + a) :
          this.attr('data-' + a, r === true ? v : JSON.stringify(v));
      }
      
      return this;
    },
    // Get bounding box
    bbox: function() {
      /* actual, native bounding box */
      var box = this.node.getBBox();
      
      return {
        /* include translations on x an y */
        x:      box.x + this.trans.x,
        y:      box.y + this.trans.y,
        
        /* add the center */
        cx:     box.x + this.trans.x + box.width  / 2,
        cy:     box.y + this.trans.y + box.height / 2,
        
        /* plain width and height */
        width:  box.width,
        height: box.height
      };
    },
    // Checks whether the given point inside the bounding box of the element
    inside: function(x, y) {
      var box = this.bbox();
      
      return x > box.x &&
             y > box.y &&
             x < box.x + box.width &&
             y < box.y + box.height;
    },
    // Show element
    show: function() {
      this.node.style.display = '';
      
      return this;
    },
    // Hide element
    hide: function() {
      this.node.style.display = 'none';
      
      return this;
    },
    // Is element visible?
    visible: function() {
      return this.node.style.display != 'none';
    },
    // Private: find svg parent by instance
    _parent: function(parent) {
      var element = this;
      
      while (element != null && !(element instanceof parent))
        element = element.parent;
  
      return element;
    },
    // Private: tester method for style detection
    _isStyle: function(attr) {
      return typeof attr == 'string' && this._isText() ? (/^font|text|leading/).test(attr) : false;
    },
    // Private: element type tester
    _isText: function() {
      return this instanceof SVG.Text;
    }
    
  });


  SVG.Container = function Container(element) {
    this.constructor.call(this, element);
  };
  
  // Inherit from SVG.Element
  SVG.Container.prototype = new SVG.Element();
  
  //
  SVG.extend(SVG.Container, {
    // Add given element at a position
    add: function(element, index) {
      if (!this.has(element)) {
        index = index == null ? this.children().length : index;
        this.children().splice(index, 0, element);
        this.node.insertBefore(element.node, this.node.childNodes[index] || null);
        element.parent = this;
      }
      
      return this;
    },
    // Basically does the same as `add()` but returns the added element
    put: function(element, index) {
      this.add(element, index);
      return element;
    },
    // Checks if the given element is a child
    has: function(element) {
      return this.children().indexOf(element) >= 0;
    },
    // Returns all child elements
    children: function() {
      return this._children || (this._children = []);
    },
    // Iterates over all children and invokes a given block
    each: function(block) {
      var index,
          children = this.children();
      
      for (index = 0, length = children.length; index < length; index++)
        if (children[index] instanceof SVG.Shape)
          block.apply(children[index], [index, children]);
      
      return this;
    },
    // Remove a given child element
    remove: function(element) {
      return this.removeAt(this.children().indexOf(element));
    },
    // Remove a child element at a given position
    removeAt: function(index) {
      if (0 <= index && index < this.children().length) {
        var element = this.children()[index];
        this.children().splice(index, 1);
        this.node.removeChild(element.node);
        element.parent = null;
      }
      
      return this;
    },
    // Returns defs element
    defs: function() {
      return this._defs || (this._defs = this.put(new SVG.Defs(), 0));
    },
    // Re-level defs to first positon in element stack
    level: function() {
      return this.remove(this.defs()).put(this.defs(), 0);
    },
    // Create a group element
    group: function() {
      return this.put(new SVG.G());
    },
    // Create a rect element
    rect: function(width, height) {
      return this.put(new SVG.Rect().size(width, height));
    },
    // Create circle element, based on ellipse
    circle: function(diameter) {
      return this.ellipse(diameter);
    },
    // Create an ellipse
    ellipse: function(width, height) {
      return this.put(new SVG.Ellipse().size(width, height));
    },
    // Create a wrapped polyline element
    polyline: function(points) {
      return this.put(new SVG.Wrap(new SVG.Polyline())).plot(points);
    },
    // Create a wrapped polygon element
    polygon: function(points) {
      return this.put(new SVG.Wrap(new SVG.Polygon())).plot(points);
    },
    // Create a wrapped path element
    path: function(data) {
      return this.put(new SVG.Wrap(new SVG.Path())).plot(data);
    },
    // Create image element, load image and set its size
    image: function(source, width, height) {
      width = width != null ? width : 100;
      return this.put(new SVG.Image().load(source).size(width, height != null ? height : width));
    },
    // Create text element
    text: function(text) {
      return this.put(new SVG.Text().text(text));
    },
    // Create nested svg document
    nested: function() {
      return this.put(new SVG.Nested());
    },
    // Create gradient element in defs
    gradient: function(type, block) {
      return this.defs().gradient(type, block);
    },
    // Create pattern element in defs
    pattern: function(width, height, block) {
      return this.defs().pattern(width, height, block);
    },
    // Create masking element
    mask: function() {
      return this.defs().put(new SVG.Mask());
    },
    // Get first child, skipping the defs node
    first: function() {
      return this.children()[0] instanceof SVG.Defs ? this.children()[1] : this.children()[0];
    },
    // Get the last child
    last: function() {
      return this.children()[this.children().length - 1];
    },
    // Remove all elements in this container
    clear: function() {
      this._children = [];
      
      while (this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild);
      
      return this;
    }
    
  });

  SVG.FX = function FX(element) {
    /* store target element */
    this.target = element;
  };
  
  //
  SVG.extend(SVG.FX, {
    // Add animation parameters and start animation
    animate: function(duration, ease) {
      /* ensure default duration and easing */
      duration = duration == null ? 1000 : duration;
      ease = ease || '<>';
      
      var akeys, tkeys, tvalues,
          element   = this.target,
          fx        = this,
          start     = (new Date).getTime(),
          finish    = start + duration;
      
      /* start animation */
      this.interval = setInterval(function(){
        // This code was borrowed from the emile.js micro framework by Thomas Fuchs, aka MadRobby.
        var index,
            time = (new Date).getTime(),
            pos = time > finish ? 1 : (time - start) / duration;
        
        /* collect attribute keys */
        if (akeys == null) {
          akeys = [];
          for (var key in fx.attrs)
            akeys.push(key);
        };
        
        /* collect transformation keys */
        if (tkeys == null) {
          tkeys = [];
          for (var key in fx.trans)
            tkeys.push(key);
          
          tvalues = {};
        };
        
        /* apply easing */
        pos = ease == '<>' ?
          (-Math.cos(pos * Math.PI) / 2) + 0.5 :
        ease == '>' ?
          Math.sin(pos * Math.PI / 2) :
        ease == '<' ?
          -Math.cos(pos * Math.PI / 2) + 1 :
        ease == '-' ?
          pos :
        typeof ease == 'function' ?
          ease(pos) :
          pos;
        
        /* run all position properties */
        if (fx._move)
          element.move(fx._at(fx._move.x, pos), fx._at(fx._move.y, pos));
        else if (fx._center)
          element.move(fx._at(fx._center.x, pos), fx._at(fx._center.y, pos));
        
        /* run all size properties */
        if (fx._size)
          element.size(fx._at(fx._size.width, pos), fx._at(fx._size.height, pos));
        
        /* animate attributes */
        for (index = akeys.length - 1; index >= 0; index--)
          element.attr(akeys[index], fx._at(fx.attrs[akeys[index]], pos));
        
        /* animate transformations */
        if (tkeys.length > 0) {
          for (index = tkeys.length - 1; index >= 0; index--)
            tvalues[tkeys[index]] = fx._at(fx.trans[tkeys[index]], pos);
          
          element.transform(tvalues);
        }
        
        /* finish off animation */
        if (time > finish) {
          clearInterval(fx.interval);
          fx._after ? fx._after.apply(element, [fx]) : fx.stop();
        }
          
      }, duration > 10 ? 10 : duration);
      
      return this;
    },
    // Add animatable attributes
    attr: function(a, v, n) {
      if (typeof a == 'object')
        for (var key in a)
          this.attr(key, a[key]);
      
      else
        this.attrs[a] = { from: this.target.attr(a), to: v };
      
      return this;  
    },
    // Add animatable transformations
    transform: function(o) {
      for (var key in o)
        this.trans[key] = { from: this.target.trans[key], to: o[key] };
      
      return this;
    },
    // Add animatable move
    move: function(x, y) {
      var box = this.target.bbox();
      
      this._move = {
        x: { from: box.x, to: x },
        y: { from: box.y, to: y }
      };
      
      return this;
    },
    // Add animatable size
    size: function(width, height) {
      var box = this.target.bbox();
      
      this._size = {
        width:  { from: box.width,  to: width  },
        height: { from: box.height, to: height }
      };
      
      return this;
    },
    // Add animatable center
    center: function(x, y) {
      var box = this.target.bbox();
      
      this._move = {
        x: { from: box.cx, to: x },
        y: { from: box.cy, to: y }
      };
      
      return this;
    },
    // Callback after animation
    after: function(after) {
      this._after = after;
      
      return this;
    },
    // Stop running animation
    stop: function() {
      /* stop current animation */
      clearInterval(this.interval);
      
      /* reset storage for properties that need animation */
      this.attrs  = {};
      this.trans  = {};
      this._move  = null;
      this._size  = null;
      this._after = null;
      
      return this;
    },
    // Private: at position according to from and to
    _at: function(o, pos) {
      /* if a number, recalculate pos */
      return typeof o.from == 'number' ?
        o.from + (o.to - o.from) * pos :
      
      /* if animating to a color */
      o.to.r || /^#/.test(o.to) ?
        this._color(o, pos) :
      
      /* for all other values wait until pos has reached 1 to return the final value */
      pos < 1 ? o.from : o.to;
    },
    // Private: tween color
    _color: function(o, pos) {
      var from, to;
      
      /* convert FROM hex to rgb */
      from = this._h2r(o.from || '#000');
      
      /* convert TO hex to rgb */
      to = this._h2r(o.to);
      
      /* tween color and return hex */
      return this._r2h({
        r: ~~(from.r + (to.r - from.r) * pos),
        g: ~~(from.g + (to.g - from.g) * pos),
        b: ~~(from.b + (to.b - from.b) * pos)
      });
    },
    // Private: convert hex to rgb object
    _h2r: function(hex) {
      /* parse full hex */
      var match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this._fh(hex));
      
      /* if the hex is successfully parsed, return it in rgb, otherwise return black */
      return match ? {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16)
      } : { r: 0, g: 0, b: 0 };
    },
    // Private: convert rgb object to hex string
    _r2h: function(rgb) {
      return '#' + this._c2h(rgb.r) + this._c2h(rgb.g) + this._c2h(rgb.b);
    },
    // Private: convert component to hex
    _c2h: function(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? '0' + hex : hex;
    },
    // Private: force potential 3-based hex to 6-based 
    _fh: function(hex) {
      return hex.length == 4 ?
        [ '#',
          hex.substring(1, 2), hex.substring(1, 2),
          hex.substring(2, 3), hex.substring(2, 3),
          hex.substring(3, 4), hex.substring(3, 4)
        ].join('') : hex;
    }
    
  });
  //
  SVG.extend(SVG.Element, {
    // Get fx module or create a new one, then animate with given duration and ease
    animate: function(duration, ease) {
      return (this.fx || (this.fx = new SVG.FX(this))).stop().animate(duration, ease);
    },
    // Stop current animation; this is an alias to the fx instance
    stop: function() {
      this.fx.stop();
      
      return this;
    }
    
  });
  // Usage:
  
  //     rect.animate(1500, '>').move(200, 300).after(function() {
  //       this.fill({ color: '#f06' });
  //     });


  [ 'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'mouseover',
    'mouseout',
    'mousemove',
    'mouseenter',
    'mouseleave',
    'touchstart',
    'touchend',
    'touchmove',
    'touchcancel' ].forEach(function(event) {
    
    /* add event to SVG.Element */
    SVG.Element.prototype[event] = function(f) {
      var self = this;
      
      /* bind event to element rather than element node */
      this.node['on' + event] = typeof f == 'function'
        ? function() { return f.apply(self, arguments); }
        : null;
      
      return this;
    };
    
  });
  
  // Add event binder in the SVG namespace
  SVG.on = function(node, event, listener) {
    if (node.addEventListener)
      node.addEventListener(event, listener, false);
    else
      node.attachEvent('on' + event, listener);
  };
  
  // Add event unbinder in the SVG namespace
  SVG.off = function(node, event, listener) {
    if (node.removeEventListener)
      node.removeEventListener(event, listener, false);
    else
      node.detachEvent('on' + event, listener);
  };
  
  //
  SVG.extend(SVG.Element, {
    // Bind given event to listener
    on: function(event, listener) {
      SVG.on(this.node, event, listener);
      
      return this;
    },
    // Unbind event from listener
    off: function(event, listener) {
      SVG.off(this.node, event, listener);
      
      return this;
    }
  });

  SVG.G = function G() {
    this.constructor.call(this, SVG.create('g'));
  };
  
  // Inherit from SVG.Container
  SVG.G.prototype = new SVG.Container();
  
  SVG.extend(SVG.G, {
    // Get defs
    defs: function() {
      return this.doc().defs();
    }
    
  });

  SVG.extend(SVG.Element, {
    // Get all siblings, including myself
    siblings: function() {
      return this.parent.children();
    },
    // Get the curent position siblings
    position: function() {
      return this.siblings().indexOf(this);
    },
    // Get the next element (will return null if there is none)
    next: function() {
      return this.siblings()[this.position() + 1];
    },
    // Get the next element (will return null if there is none)
    previous: function() {
      return this.siblings()[this.position() - 1];
    },
    // Send given element one step forward
    forward: function() {
      return this.parent.remove(this).put(this, this.position() + 1);
    },
    // Send given element one step backward
    backward: function() {
      var i;
      
      this.parent.level();
      
      i = this.position();
      
      if (i > 1)
        this.parent.remove(this).add(this, i - 1);
      
      return this;
    },
    // Send given element all the way to the front
    front: function() {
      return this.parent.remove(this).put(this);
    },
    // Send given element all the way to the back
    back: function() {
      this.parent.level();
      
      if (this.position() > 1)
        this.parent.remove(this).add(this, 0);
      
      return this;
    }
    
  });

  SVG.Defs = function Defs() {
    this.constructor.call(this, SVG.create('defs'));
  };
  
  // Inherits from SVG.Container
  SVG.Defs.prototype = new SVG.Container();

  SVG.Mask = function Mask() {
    this.constructor.call(this, SVG.create('mask'));
    
    /* set unique id */
    this.attr('id', (this.id = 'svgjs_element_' + (SVG.did++)));
  };
  
  // Inherit from SVG.Container
  SVG.Mask.prototype = new SVG.Container();
  
  SVG.extend(SVG.Element, {
    
    // Distribute mask to svg element
    maskWith: function(element) {
      /* use given mask or create a new one */
      this.mask = element instanceof SVG.Mask ? element : this.parent.mask().add(element);
      
      return this.attr('mask', 'url(#' + this.mask.id + ')');
    }
    
  });

  SVG.Pattern = function Pattern(type) {
    this.constructor.call(this, SVG.create('pattern'));
    
    /* set unique id */
    this.attr('id', (this.id = 'svgjs_element_' + (SVG.did++)));
  };
  
  // Inherit from SVG.Container
  SVG.Pattern.prototype = new SVG.Container();
  
  //
  SVG.extend(SVG.Pattern, {
    // Return the fill id
    fill: function() {
      return 'url(#' + this.id + ')';
    }
    
  });
  
  //
  SVG.extend(SVG.Defs, {
    
    /* define gradient */
    pattern: function(width, height, block) {
      var element = this.put(new SVG.Pattern());
      
      /* invoke passed block */
      block(element);
      
      return element.attr({
        x:            0,
        y:            0,
        width:        width,
        height:       height,
        patternUnits: 'userSpaceOnUse'
      });
    }
    
  });

  SVG.Gradient = function Gradient(type) {
    this.constructor.call(this, SVG.create(type + 'Gradient'));
    
    /* set unique id */
    this.attr('id', (this.id = 'svgjs_element_' + (SVG.did++)));
    
    /* store type */
    this.type = type;
  };
  
  // Inherit from SVG.Container
  SVG.Gradient.prototype = new SVG.Container();
  
  //
  SVG.extend(SVG.Gradient, {
    // From position
    from: function(x, y) {
      return this.type == 'radial' ?
        this.attr({ fx: x + '%', fy: y + '%' }) :
        this.attr({ x1: x + '%', y1: y + '%' });
    },
    // To position
    to: function(x, y) {
      return this.type == 'radial' ?
        this.attr({ cx: x + '%', cy: y + '%' }) :
        this.attr({ x2: x + '%', y2: y + '%' });
    },
    // Radius for radial gradient
    radius: function(radius) {
      return this.type == 'radial' ?
        this.attr({ r: radius + '%' }) :
        this;
    },
    // Add a color stop
    at: function(stop) {
      return this.put(new SVG.Stop(stop));
    },
    // Update gradient
    update: function(block) {
      /* remove all stops */
      while (this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild);
      
      /* invoke passed block */
      block(this);
      
      return this;
    },
    // Return the fill id
    fill: function() {
      return 'url(#' + this.id + ')';
    }
    
  });
  
  //
  SVG.extend(SVG.Defs, {
    
    /* define gradient */
    gradient: function(type, block) {
      var element = this.put(new SVG.Gradient(type));
      
      /* invoke passed block */
      block(element);
      
      return element;
    }
    
  });
  
  
  SVG.Stop = function Stop(stop) {
    this.constructor.call(this, SVG.create('stop'));
    
    /* immediatelly build stop */
    this.update(stop);
  };
  
  // Inherit from SVG.Element
  SVG.Stop.prototype = new SVG.Element();
  
  //
  SVG.extend(SVG.Stop, {
    
    /* add color stops */
    update: function(o) {
      var index,
          style = '',
          attr  = ['opacity', 'color'];
      
      /* build style attribute */
      for (index = attr.length - 1; index >= 0; index--)
        if (o[attr[index]] != null)
          style += 'stop-' + attr[index] + ':' + o[attr[index]] + ';';
      
      /* set attributes */
      return this.attr({
        offset: (o.offset != null ? o.offset : this.attrs.offset || 0) + '%',
        style:  style
      });
    }
    
  });
  


  SVG.Doc = function Doc(element) {
    this.constructor.call(this, SVG.create('svg'));
    
    /* ensure the presence of a html element */
    this.parent = typeof element == 'string' ?
      document.getElementById(element) :
      element;
    
    /* set svg element attributes and create the <defs> node */
    this.
      attr({ xmlns: SVG.ns, version: '1.1', width: '100%', height: '100%' }).
      attr('xlink', SVG.xlink, SVG.ns).
      defs();
    
    /* ensure correct rendering for safari */
    this.stage(); 
  };
  
  // Inherits from SVG.Container
  SVG.Doc.prototype = new SVG.Container();
  
  // Hack for safari preventing text to be rendered in one line.
  // Basically it sets the position of the svg node to absolute
  // when the dom is loaded, and resets it to relative a few milliseconds later.
  SVG.Doc.prototype.stage = function() {
    var check,
        element = this,
        wrapper = document.createElement('div');
    
    /* set temp wrapper to position relative */
    wrapper.style.cssText = 'position:relative;height:100%;';
    
    /* put element into wrapper */
    element.parent.appendChild(wrapper);
    wrapper.appendChild(element.node);
    
    /* check for dom:ready */
    check = function() {
      if (document.readyState === 'complete') {
        element.attr('style', 'position:absolute;');
        setTimeout(function() {
          /* set position back to relative */
          element.attr('style', 'position:relative;');
          
          /* remove temp wrapper */
          element.parent.removeChild(element.node.parentNode);
          element.node.parentNode.removeChild(element.node);
          element.parent.appendChild(element.node);
          
        }, 5);
      } else {
        setTimeout(check, 10);
      }
    };
    
    check();
    
    return this;
  };

  SVG.Shape = function Shape(element) {
    this.constructor.call(this, element);
  };
  
  // Inherit from SVG.Element
  SVG.Shape.prototype = new SVG.Element();

  SVG.Wrap = function Wrap(element) {
    this.constructor.call(this, SVG.create('g'));
    
    /* insert and store child */
    this.node.insertBefore(element.node, null);
    this.child = element;
    this.type = element.node.nodeName;
  };
  
  // inherit from SVG.Shape
  SVG.Wrap.prototype = new SVG.Shape();
  
  SVG.extend(SVG.Wrap, {
    // Move wrapper around
    move: function(x, y) {
      return this.transform({
        x: x,
        y: y
      });
    },
    // Set the actual size in pixels
    size: function(width, height) {
      var scale = width / this._b.width;
      
      this.child.transform({
        scaleX: scale,
        scaleY: height != null ? height / this._b.height : scale
      });
  
      return this;
    },
    // Move by center
    center: function(x, y) {
      return this.move(
        x + (this._b.width  * this.child.trans.scaleX) / -2,
        y + (this._b.height * this.child.trans.scaleY) / -2
      );
    },
    // Create distributed attr
    attr: function(a, v, n) {
      /* call individual attributes if an object is given */
      if (typeof a == 'object') {
        for (v in a) this.attr(v, a[v]);
      
      /* act as a getter if only one argument is given */
      } else if (arguments.length < 2) {
        return a == 'transform' ? this.attrs[a] : this.child.attrs[a];
      
      /* apply locally for certain attributes */
      } else if (a == 'transform') {
        this.attrs[a] = v;
        
        n != null ?
          this.node.setAttributeNS(n, a, v) :
          this.node.setAttribute(a, v);
      
      /* apply attributes to child */
      } else {
        this.child.attr(a, v, n);
      }
      
      return this;
    },
    // Distribute plot method to child
    plot: function(data) {
      /* plot new shape */
      this.child.plot(data);
      
      /* get and store new bbox */
      this._b = this.child.bbox();
      
      /* reposition element withing wrapper */
      this.child.transform({
        x: -this._b.x,
        y: -this._b.y
      });
      
      return this;
    }
    
  });

  SVG.Rect = function Rect() {
    this.constructor.call(this, SVG.create('rect'));
  };
  
  // Inherit from SVG.Shape
  SVG.Rect.prototype = new SVG.Shape();

  SVG.Ellipse = function Ellipse() {
    this.constructor.call(this, SVG.create('ellipse'));
  };
  
  // Inherit from SVG.Shape
  SVG.Ellipse.prototype = new SVG.Shape();
  
  //
  SVG.extend(SVG.Ellipse, {
    // Custom move function
    move: function(x, y) {
      this.attrs.x = x;
      this.attrs.y = y;
      
      return this.center();
    },
    // Custom size function
    size: function(width, height) {
      return this.
        attr({ rx: width / 2, ry: (height != null ? height : width) / 2 }).
        center();
    },
    // Custom center function
    center: function(x, y) {
      return this.attr({
        cx: x || (this.attrs.x || 0) + (this.attrs.rx || 0),
        cy: y || (this.attrs.y || 0) + (this.attrs.ry || 0)
      });
    }
    
  });
  
  // Usage:
  
  //     draw.ellipse(200, 100);

  SVG.Line = function Line() {
    this.constructor.call(this, SVG.create('line'));
  };
  
  // Inherit from SVG.Shape
  SVG.Line.prototype = new SVG.Shape();
  
  // Add required methods
  SVG.extend(SVG.Line, {
    // Move line
    move: function(x, y) {
      var bbox = this.bbox();
      
      return this.attr({
        x1: this.attr('x1') - bbox.x + x,
        y1: this.attr('y1') - bbox.y + y,
        x2: this.attr('x2') - bbox.x + x,
        y2: this.attr('y2') - bbox.y + y
      });
    },
    // Move element by its center
    center: function(x, y) {
      var bbox = this.bbox();
      
      return this.move(x - bbox.width / 2, y - bbox.height / 2);
    },
    // Set line size by width and height
    size: function(width, height) {
      var bbox = this.bbox();
      
      this.attr(this.attr('x1') < this.attr('x2') ? 'x2' : 'x1', bbox.x + width);
      return this.attr(this.attr('y1') < this.attr('y2') ? 'y2' : 'y1', bbox.y + height);
    }
  });
  
  // Extend all container modules
  SVG.extend(SVG.Container, {
    line: function(x1, y1, x2, y2) {
      return this.put(new SVG.Line().attr({
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
      }));
    }
  });

  SVG.Poly = {
    // Set polygon data with default zero point if no data is passed
    plot: function(points) {
      this.attr('points', points || '0,0');
      
      return this;
    }
  };
  
  SVG.Polyline = function Polyline() {
    this.constructor.call(this, SVG.create('polyline'));
  };
  
  // Inherit from SVG.Shape
  SVG.Polyline.prototype = new SVG.Shape();
  
  // Add polygon-specific functions
  SVG.extend(SVG.Polyline, SVG.Poly);
  
  SVG.Polygon = function Polygon() {
    this.constructor.call(this, SVG.create('polygon'));
  };
  
  // Inherit from SVG.Shape
  SVG.Polygon.prototype = new SVG.Shape();
  
  // Add polygon-specific functions
  SVG.extend(SVG.Polygon, SVG.Poly);

  SVG.Path = function Path() {
    this.constructor.call(this, SVG.create('path'));
  };
  
  // Inherit from SVG.Shape
  SVG.Path.prototype = new SVG.Shape();
  
  SVG.extend(SVG.Path, {
    
    /* move using transform */
    move: function(x, y) {
      this.transform({
        x: x,
        y: y
      });
    },
    
    /* set path data */
    plot: function(data) {
      return this.attr('d', data || 'M0,0');
    }
    
  });

  SVG.Image = function Image() {
    this.constructor.call(this, SVG.create('image'));
  };
  
  // Inherit from SVG.Element
  SVG.Image.prototype = new SVG.Shape();
  
  SVG.extend(SVG.Image, {
    
    /* (re)load image */
    load: function(url) {
      this.src = url;
      return (url ? this.attr('xlink:href', url, SVG.xlink) : this);
    }
    
  });

  var _styleAttr = ['size', 'family', 'weight', 'stretch', 'variant', 'style'];
  
  SVG.Text = function Text() {
    this.constructor.call(this, SVG.create('text'));
    
    /* define default style */
    this.style = { 'font-size':  16, 'font-family': 'Helvetica', 'text-anchor': 'start' };
    this.leading = 1.2;
  };
  
  // Inherit from SVG.Element
  SVG.Text.prototype = new SVG.Shape();
  
  SVG.extend(SVG.Text, {
    // Set the text content
    text: function(text) {
      /* update the content */
      this.content = text = text || 'text';
      this.lines = [];
      
      var index, length, tspan,
          style   = this._style(),
          parent  = this.doc(),
          lines   = text.split("\n"),
          size    = this.style['font-size'];
      
      /* remove existing child nodes */
      while (this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild);
      
      /* build new lines */
      for (index = 0, length = lines.length; index < length; index++) {
        /* create new tspan and set attributes */
        tspan = new TSpan().
          text(lines[index]).
          attr({
            dy:     size * this.leading - (index == 0 ? size * 0.3 : 0),
            x:      (this.attrs.x || 0),
            style:  style
          });
        
        /* add new tspan */
        this.node.appendChild(tspan.node);
        this.lines.push(tspan);
      };
      
      /* set style */
      return this.attr('style', style);
    },
    
    // Build style based on _styleAttr
    _style: function() {
      var index, style = '';
      
      for (index = _styleAttr.length - 1; index >= 0; index--)
        if (this.style['font-' + _styleAttr[index]] != null)
          style += 'font-' + _styleAttr[index] + ':' + this.style['font-' + _styleAttr[index]] + ';';
      
      style += 'text-anchor:' + this.style['text-anchor'] + ';';
        
      return style;
    }
    
  });
  
  
  function TSpan() {
    this.constructor.call(this, SVG.create('tspan'));
  };
  
  // Inherit from SVG.Shape
  TSpan.prototype = new SVG.Shape();
  
  // Include the container object
  SVG.extend(TSpan, {
    // Set text content
    text: function(text) {
      this.node.appendChild(document.createTextNode(text));
      
      return this;
    }
    
  });

  SVG.Nested = function Nested() {
    this.constructor.call(this, SVG.create('svg'));
    this.attr('overflow', 'visible');
  };
  
  // Inherit from SVG.Container
  SVG.Nested.prototype = new SVG.Container();

  SVG._stroke = ['color', 'width', 'opacity', 'linecap', 'linejoin', 'miterlimit', 'dasharray', 'dashoffset'];
  SVG._fill   = ['color', 'opacity', 'rule'];
  
  
  // Prepend correct color prefix
  var _colorPrefix = function(type, attr) {
    return attr == 'color' ? type : type + '-' + attr;
  };
  
  /* Add sugar for fill and stroke */
  ['fill', 'stroke'].forEach(function(method) {
    
    // Set fill color and opacity
    SVG.Shape.prototype[method] = function(o) {
      var index;
      
      if (typeof o == 'string')
        this.attr(method, o);
      
      else
        /* set all attributes from _fillAttr and _strokeAttr list */
        for (index = SVG['_' + method].length - 1; index >= 0; index--)
          if (o[SVG['_' + method][index]] != null)
            this.attr(_colorPrefix(method, SVG['_' + method][index]), o[SVG['_' + method][index]]);
      
      return this;
    };
    
  });
  
  [SVG.Element, SVG.FX].forEach(function(module) {
    if (module) {
      SVG.extend(module, {
        // Rotation
        rotate: function(angle) {
          return this.transform({
            rotation: angle || 0
          });
        },
        // Skew
        skew: function(x, y) {
          return this.transform({
            skewX: x || 0,
            skewY: y || 0
          });
        },
        // Scale
        scale: function(x, y) {
          return this.transform({
            scaleX: x,
            scaleY: y == null ? x : y
          });
        },
        // Opacity
        opacity: function(value) {
          return this.attr('opacity', value);
        }
  
      });
    }
  });
  
  if (SVG.G) {
    SVG.extend(SVG.G, {
      // Move using translate
      move: function(x, y) {
        return this.transform({
          x: x,
          y: y
        });
      }
  
    });
  }
  
  if (SVG.Text) {
    SVG.extend(SVG.Text, {
      // Set font 
      font: function(o) {
        var key, attr = {};
  
        for (key in o)
          key == 'leading' ?
            attr[key] = o[key] :
          key == 'anchor' ?
            attr['text-anchor'] = o[key] :
          _styleAttr.indexOf(key) > -1 ?
            attr['font-'+ key] = o[key] :
            void 0;
  
        return this.attr(attr).text(this.content);
      }
  
    });
  }
  


return svg; }));

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('svg'));
    } else if (typeof define === 'function' && define.amd) {
        define(['svg'],factory);
    } else {
        root.SyncIcon = factory(root.svg);
    }
}(this, function (svg) {

var icon = function(element, options) {
    var me = this;

    var defaults = {
        size: 294,
        disabled_color: '#ccc',
        mouseover_color: '#eee',
        online_color: '#090',
        sync_color: '#050',
        offline_color: '#900',
        state: 'disabled'
    };

    if (!options) options = defaults;
    if (!options.size) options.size = defaults.size;
    if (!options.disabled_color) options.disabled_color = defaults.disabled_color;
    if (!options.mouseover_color) options.mouseover_color = defaults.mouseover_color;
    if (!options.online_color) options.online_color = defaults.online_color;
    if (!options.offline_color) options.offline_color = defaults.offline_color;
    if (!options.state) options.state = defaults.state;


    this.options = options;
    this.callback = false;
    this.animating = false;

    var orginal_height = 256;
    var original_width = 294;

    me.options.height =  ( orginal_height/original_width ) * me.options.size;

    this.paper = svg(element).size(me.options.size, me.options.size);
    this.main_path = this.paper.path(main_icon);
    this.main_path.size(me.options.size  , me.options.height);
    this.main_path.attr({ fill: this.options.disabled_color });


    var rotate_on = function(callback){
        me.animating = true;
        me.main_path.animate(1000, '<>').rotate(0).after(function(){
            me.animating = false;
            if (callback) callback();
        });
    };

    var rotate_off = function(callback) {
        me.animating = true;
        me.main_path.animate(1000, '<>').rotate(-90).after(function(){
            me.animating = false;
            if (callback) callback();
        });
    };

    var online_state = function(){
        me.main_path.rotate(0);
        me.main_path.attr({fill: me.options.online_color});
        me.options.state = 'online';
    };

    var offline_state = function() {
        me.main_path.rotate(0);
        me.main_path.attr({fill: me.options.offline_color});
        me.options.state = 'offline';
    };

    var syncing_state = function() {
        me.main_path.rotate(0);
        var gradient = me.paper.gradient('linear', function(stop) {
          stop.at({ offset: 0, color: me.options.sync_color, opacity: 1 });
          stop.at({ offset: 100, color: me.options.online_color, opacity: 1 });
        });

        var count = 0;
        me.sync_interval = setInterval(function(){

            gradient.update(function(stop) {
              stop.at({ offset: count, color: me.options.online_color, opacity: 1 });
              stop.at({ offset: 100, color: me.options.sync_color, opacity: 1 });
              count+=10;
              if (count > 100) count = 0;
            });

        }, 100);

        me.main_path.attr({ fill: gradient.fill() });
        me.options.state = 'syncing';
    };

    var disabled_state = function(){
        me.main_path.rotate(-90);
        me.main_path.attr({fill: me.options.disabled_color});
        me.options.state = 'disabled';
    };

    this.state_change = function(to_state) {
        if (me.sync_interval && to_state !== 'syncing') {
            clearInterval(me.sync_interval);
            me.sync_interval = null;
        }
        // animation between transitions
        if (me.options.state === 'disabled' && to_state ==='online') {
            return rotate_on(online_state);
        }
        if (me.options.state === 'disabled' && to_state ==='offline') {
            return rotate_on(offline_state);
        }
        if (me.options.state ==='disabled'  && to_state === 'syncing') {
            return rotate_on(syncing_state);
        }
        if (me.options.state === 'online' && to_state ==='disabled') {
            return rotate_off(disabled_state);
        }
        if (me.options.state === 'offline' && to_state ==='disabled') {
            return rotate_off(disabled_state);
        }
        if (to_state === 'online') return online_state();
        if (to_state === 'offline') return offline_state();
        if (to_state === 'syncing') return syncing_state();
        if (to_state === 'disabled') return disabled_state();
    };

    this.paper.on('mouseover', function(){
        if (me.animating) return;
        //me.main_path.animate(500, '>').attr({ fill: me.options.mouseover_color });
    });
    this.paper.on('mouseout', function(){
        if (me.animating) return;
        //me.state_change(me.options.state);
    });


    this.clicked = function() {
        if (me.callback) me.callback('click');
    };

    me.paper.touchstart(function(){
        me.clicked();
    });

    me.paper.click(function(){
        me.clicked();
    });

    me.state_change(me.options.state);
};

icon.prototype.disabled = function() {
    this.state_change('disabled');
};

icon.prototype.offline = function() {
    this.state_change('offline');
};

icon.prototype.online = function(){
    this.state_change('online');
};


icon.prototype.syncing = function() {
    this.state_change('syncing');
};

icon.prototype.click = function(callback) {
    this.callback = callback;
};

icon.prototype.getState = function() {
    return this.options.state;
};

var main_icon = "M294.1,79.0H246.3C226.7,31.9,180.0,0,128.1,0C57.5,0,0,57.4,0,128.1C0,198.8,57.5,256.3,128.1,256.3c51.9,0,98.5-31.8,118.2-79.0h47.7V79.0zM256.1,139.2H128.1c-6.1,0-11.1-4.9-11.1-11.1c0-6.1,4.9-11.1,11.1-11.1h127.9V139.2zM128.1,218.3c-49.7,0-90.1-40.4-90.1-90.1c0-49.7,40.4-90.1,90.1-90.1c30.8,0,59.1,16.0,75.5,41.0h-75.5c-27.0,0-49.1,22.0-49.1,49.1c0,27.0,22.0,49.1,49.1,49.1h75.5C187.3,202.3,159.0,218.3,128.1,218.3z";

var online_icon ="M-7.2727275,54.781471C-7.2727275,54.781471,-8.8503233,54.781471,-8.8503233,54.781471C-8.8503233,54.781471,-8.8503233,52.267212,-8.8503233,52.267212C-8.8503233,52.267212,-7.272727499999999,52.267212,-7.272727499999999,52.267212C-7.272727499999999,52.267212,-7.2727275,54.781471,-7.2727275,54.781471 M-9.6861906,54.780155C-9.6861906,54.780155,-11.263786,54.780155,-11.263786,54.780155C-11.263786,54.780155,-11.263786,52.265896,-11.263786,52.265896C-11.263786,52.265896,-9.6861906,52.265896,-9.6861906,52.265896C-9.6861906,52.265896,-9.6861906,54.780155,-9.6861906,54.780155 M-12.035547,54.779095C-12.035547,54.779095,-13.613142999999999,54.779095,-13.613142999999999,54.779095C-13.613142999999999,54.779095,-13.613142999999999,52.264835,-13.613142999999999,52.264835C-13.613142999999999,52.264835,-12.035547,52.264835,-12.035547,52.264835C-12.035547,52.264835,-12.035547,54.779095,-12.035547,54.779095";


return icon;
}));
/*!
  * Bowser - a browser detector
  * https://github.com/ded/bowser
  * MIT License | (c) Dustin Diaz 2011
  */
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( );
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.bowser = factory();
    }
}(this, function () {
  /**
    * navigator.userAgent =>
    * Chrome:  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.57 Safari/534.24"
    * Opera:   "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.7; U; en) Presto/2.7.62 Version/11.01"
    * Safari:  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; en-us) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1"
    * IE:      "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C)"
    * Firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0) Gecko/20100101 Firefox/4.0"
    * iPhone:  "Mozilla/5.0 (iPhone Simulator; U; CPU iPhone OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5"
    * iPad:    "Mozilla/5.0 (iPad; U; CPU OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5",
    * Android: "Mozilla/5.0 (Linux; U; Android 2.3.4; en-us; T-Mobile G2 Build/GRJ22) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1"
    * Touchpad: "Mozilla/5.0 (hp-tabled;Linux;hpwOS/3.0.5; U; en-US)) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/234.83 Safari/534.6 TouchPad/1.0"
    * PhantomJS: "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.5.0 Safari/534.34"
    */

  var ua = navigator.userAgent
    , t = true
    , ie = /msie/i.test(ua)
    , chrome = /chrome/i.test(ua)
    , phantom = /phantom/i.test(ua)
    , safari = /safari/i.test(ua) && !chrome && !phantom
    , iphone = /iphone/i.test(ua)
    , ipad = /ipad/i.test(ua)
    , touchpad = /touchpad/i.test(ua)
    , android = /android/i.test(ua)
    , opera = /opera/i.test(ua)
    , firefox = /firefox/i.test(ua)
    , gecko = /gecko\//i.test(ua)
    , seamonkey = /seamonkey\//i.test(ua)
    , webkitVersion = /version\/(\d+(\.\d+)?)/i
    , o

  function detect() {

    if (ie) return {
        msie: t
      , version: ua.match(/msie (\d+(\.\d+)?);/i)[1]
    }
    if (chrome) return {
        webkit: t
      , chrome: t
      , version: ua.match(/chrome\/(\d+(\.\d+)?)/i)[1]
    }
    if (phantom) return {
        webkit: t
      , phantom: t
      , version: ua.match(/phantomjs\/(\d+(\.\d+)+)/i)[1]
    }
    if (touchpad) return {
        webkit: t
      , touchpad: t
      , version : ua.match(/touchpad\/(\d+(\.\d+)?)/i)[1]
    }
    if (iphone || ipad) {
      o = {
          webkit: t
        , mobile: t
        , ios: t
        , iphone: iphone
        , ipad: ipad
      }
      // WTF: version is not part of user agent in web apps
      if (webkitVersion.test(ua)) {
        o.version = ua.match(webkitVersion)[1]
      }
      return o
    }
    if (android) return {
        webkit: t
      , android: t
      , mobile: t
      , version: ua.match(webkitVersion)[1]
    }
    if (safari) return {
        webkit: t
      , safari: t
      , version: ua.match(webkitVersion)[1]
    }
    if (opera) return {
        opera: t
      , version: ua.match(webkitVersion)[1]
    }
    if (gecko) {
      o = {
          gecko: t
        , mozilla: t
        , version: ua.match(/firefox\/(\d+(\.\d+)?)/i)[1]
      }
      if (firefox) o.firefox = t
      return o
    }
    if (seamonkey) return {
        seamonkey: t
      , version: ua.match(/seamonkey\/(\d+(\.\d+)?)/i)[1]
    }
  }

  var bowser = detect()

  // Graded Browser Support
  // http://developer.yahoo.com/yui/articles/gbs
  if ((bowser.msie && bowser.version >= 7) ||
      (bowser.chrome && bowser.version >= 10) ||
      (bowser.firefox && bowser.version >= 4.0) ||
      (bowser.safari && bowser.version >= 5) ||
      (bowser.opera && bowser.version >= 10.0)) {
    bowser.a = t;
  }

  else if ((bowser.msie && bowser.version < 7) ||
      (bowser.chrome && bowser.version < 10) ||
      (bowser.firefox && bowser.version < 4.0) ||
      (bowser.safari && bowser.version < 5) ||
      (bowser.opera && bowser.version < 10.0)) {
    bowser.c = t
  } else bowser.x = t

  return bowser
}));

/*PouchDB*/


(function() {


// BEGIN Math.uuid.js

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

/*
 * Generate a random uuid.
 *
 * USAGE: Math.uuid(length, radix)
 *   length - the desired number of characters
 *   radix  - the number of allowable values for each character.
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> Math.uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 *
 *   // One argument - returns ID of the specified length
 *   >>> Math.uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
 *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 */
(function() {
  // Private array of chars to use
  var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

  Math.uuid = function (len, radix) {
    var chars = CHARS, uuid = [];
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (var i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (var i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  };

  // A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
  // by minimizing calls to random()
  Math.uuidFast = function() {
    var chars = CHARS, uuid = new Array(36), rnd=0, r;
    for (var i = 0; i < 36; i++) {
      if (i==8 || i==13 ||  i==18 || i==23) {
        uuid[i] = '-';
      } else if (i==14) {
        uuid[i] = '4';
      } else {
        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
        r = rnd & 0xf;
        rnd = rnd >> 4;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
    return uuid.join('');
  };

  // A more compact, but less performant, RFC4122v4 solution:
  Math.uuidCompact = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    }).toUpperCase();
  };
})();

// END Math.uuid.js

/**
*
*  MD5 (Message-Digest Algorithm)
*
*  For original source see http://www.webtoolkit.info/
*  Download: 15.02.2009 from http://www.webtoolkit.info/javascript-md5.html
*
*  Licensed under CC-BY 2.0 License
*  (http://creativecommons.org/licenses/by/2.0/uk/)
*
**/

var Crypto = {};
(function() {
  Crypto.MD5 = function(string) {

    function RotateLeft(lValue, iShiftBits) {
      return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
    }

    function AddUnsigned(lX,lY) {
      var lX4,lY4,lX8,lY8,lResult;
      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
      if (lX4 & lY4) {
        return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      }
      if (lX4 | lY4) {
        if (lResult & 0x40000000) {
          return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        } else {
          return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        }
      } else {
        return (lResult ^ lX8 ^ lY8);
      }
    }

    function F(x,y,z) { return (x & y) | ((~x) & z); }
    function G(x,y,z) { return (x & z) | (y & (~z)); }
    function H(x,y,z) { return (x ^ y ^ z); }
    function I(x,y,z) { return (y ^ (x | (~z))); }

    function FF(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    };

    function GG(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    };

    function HH(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    };

    function II(a,b,c,d,x,s,ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
    };

    function ConvertToWordArray(string) {
      var lWordCount;
      var lMessageLength = string.length;
      var lNumberOfWords_temp1=lMessageLength + 8;
      var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
      var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
      var lWordArray=Array(lNumberOfWords-1);
      var lBytePosition = 0;
      var lByteCount = 0;
      while ( lByteCount < lMessageLength ) {
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
        lByteCount++;
      }
      lWordCount = (lByteCount-(lByteCount % 4))/4;
      lBytePosition = (lByteCount % 4)*8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
      lWordArray[lNumberOfWords-2] = lMessageLength<<3;
      lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
      return lWordArray;
    };

    function WordToHex(lValue) {
      var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
      for (lCount = 0;lCount<=3;lCount++) {
        lByte = (lValue>>>(lCount*8)) & 255;
        WordToHexValue_temp = "0" + lByte.toString(16);
        WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
      }
      return WordToHexValue;
    };

    //**	function Utf8Encode(string) removed. Aready defined in pidcrypt_utils.js

    var x=Array();
    var k,AA,BB,CC,DD,a,b,c,d;
    var S11=7, S12=12, S13=17, S14=22;
    var S21=5, S22=9 , S23=14, S24=20;
    var S31=4, S32=11, S33=16, S34=23;
    var S41=6, S42=10, S43=15, S44=21;

    //	string = Utf8Encode(string); #function call removed

    x = ConvertToWordArray(string);

    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

    for (k=0;k<x.length;k+=16) {
      AA=a; BB=b; CC=c; DD=d;
      a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
      d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
      c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
      b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
      a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
      d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
      c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
      b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
      a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
      d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
      c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
      b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
      a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
      d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
      c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
      b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
      a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
      d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
      c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
      b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
      a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
      d=GG(d,a,b,c,x[k+10],S22,0x2441453);
      c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
      b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
      a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
      d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
      c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
      b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
      a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
      d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
      c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
      b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
      a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
      d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
      c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
      b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
      a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
      d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
      c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
      b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
      a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
      d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
      c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
      b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
      a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
      d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
      c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
      b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
      a=II(a,b,c,d,x[k+0], S41,0xF4292244);
      d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
      c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
      b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
      a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
      d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
      c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
      b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
      a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
      d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
      c=II(c,d,a,b,x[k+6], S43,0xA3014314);
      b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
      a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
      d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
      c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
      b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
      a=AddUnsigned(a,AA);
      b=AddUnsigned(b,BB);
      c=AddUnsigned(c,CC);
      d=AddUnsigned(d,DD);
    }
    var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
    return temp.toLowerCase();
  }
})();

// END Crypto.md5.js

//----------------------------------------------------------------------
//
// ECMAScript 5 Polyfills
//  from www.calocomrmen./polyfill/
//
//----------------------------------------------------------------------

//----------------------------------------------------------------------
// ES5 15.2 Object Objects
//----------------------------------------------------------------------



// ES 15.2.3.6 Object.defineProperty ( O, P, Attributes )
// Partial support for most common case - getters, setters, and values
(function() {
  if (!Object.defineProperty ||
      !(function () { try { Object.defineProperty({}, 'x', {}); return true; } catch (e) { return false; } } ())) {
    var orig = Object.defineProperty;
    Object.defineProperty = function (o, prop, desc) {
      "use strict";

      // In IE8 try built-in implementation for defining properties on DOM prototypes.
      if (orig) { try { return orig(o, prop, desc); } catch (e) {} }

      if (o !== Object(o)) { throw new TypeError("Object.defineProperty called on non-object"); }
      if (Object.prototype.__defineGetter__ && ('get' in desc)) {
        Object.prototype.__defineGetter__.call(o, prop, desc.get);
      }
      if (Object.prototype.__defineSetter__ && ('set' in desc)) {
        Object.prototype.__defineSetter__.call(o, prop, desc.set);
      }
      if ('value' in desc) {
        o[prop] = desc.value;
      }
      return o;
    };
  }
}());



// ES5 15.2.3.14 Object.keys ( O )
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = function (o) {
    if (o !== Object(o)) { throw new TypeError('Object.keys called on non-object'); }
    var ret = [], p;
    for (p in o) {
      if (Object.prototype.hasOwnProperty.call(o, p)) {
        ret.push(p);
      }
    }
    return ret;
  };
}

//----------------------------------------------------------------------
// ES5 15.4 Array Objects
//----------------------------------------------------------------------



// ES5 15.4.4.18 Array.prototype.forEach ( callbackfn [ , thisArg ] )
// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function (fun /*, thisp */) {
    "use strict";

    if (this === void 0 || this === null) { throw new TypeError(); }

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function") { throw new TypeError(); }

    var thisp = arguments[1], i;
    for (i = 0; i < len; i++) {
      if (i in t) {
        fun.call(thisp, t[i], i, t);
      }
    }
  };
}


// ES5 15.4.4.19 Array.prototype.map ( callbackfn [ , thisArg ] )
// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/Map
if (!Array.prototype.map) {
  Array.prototype.map = function (fun /*, thisp */) {
    "use strict";

    if (this === void 0 || this === null) { throw new TypeError(); }

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function") { throw new TypeError(); }

    var res = []; res.length = len;
    var thisp = arguments[1], i;
    for (i = 0; i < len; i++) {
      if (i in t) {
        res[i] = fun.call(thisp, t[i], i, t);
      }
    }

    return res;
  };
}


"use strict";

var Pouch = function Pouch(name, opts, callback) {

  if (!(this instanceof Pouch)) {
    return new Pouch(name, opts, callback);
  }

  if (typeof opts === 'function' || typeof opts === 'undefined') {
    callback = opts;
    opts = {};
  }

  if (typeof name === 'object') {
    opts = name;
    name = undefined;
  }

  var backend = Pouch.parseAdapter(opts.name || name);
  opts.name = opts.name || backend.name;
  opts.adapter = opts.adapter || backend.adapter;

  if (!Pouch.adapters[opts.adapter]) {
    throw 'Adapter is missing';
  }

  if (!Pouch.adapters[opts.adapter].valid()) {
    throw 'Invalid Adapter';
  }

  var adapter = Pouch.adapters[opts.adapter](opts, function(err, db) {
    if (err) {
      if (callback) callback(err);
      return;
    }
    for (var plugin in Pouch.plugins) {
      // In future these will likely need to be async to allow the plugin
      // to initialise
      var pluginObj = Pouch.plugins[plugin](db);
      for (var api in pluginObj) {
        // We let things like the http adapter use its own implementation
        // as it shares a lot of code
        if (!(api in db)) {
          db[api] = pluginObj[api];
        }
      }
    }
    callback(null, db);
  });
  for (var j in adapter) {
    this[j] = adapter[j];
  }
};

Pouch.DEBUG = false;

Pouch.adapters = {};
Pouch.plugins = {};

Pouch.parseAdapter = function(name) {

  var match = name.match(/([a-z\-]*):\/\/(.*)/);
  if (match) {
    // the http adapter expects the fully qualified name
    name = /http(s?)/.test(match[1]) ? match[1] + '://' + match[2] : match[2];
    var adapter = match[1];
    if (!Pouch.adapters[adapter].valid()) {
      throw 'Invalid adapter';
    }
    return {name: name, adapter: match[1]};
  }

  var rank = {'idb': 1, 'leveldb': 2, 'websql': 3, 'http': 4, 'https': 4};
  var rankedAdapter = Object.keys(Pouch.adapters).sort(function(a, b) {
    return rank[a] - rank[b];
  })[0];

  return {
    name: name,
    adapter: rankedAdapter
  };

  throw 'No Valid Adapter.';
};


Pouch.destroy = function(name, callback) {
  for (var plugin in Pouch.plugins) {
    Pouch.plugins[plugin]._delete(name);
  }
  var opts = Pouch.parseAdapter(name);
  Pouch.adapters[opts.adapter].destroy(opts.name, callback);
};

Pouch.adapter = function (id, obj) {
  if (obj.valid()) {
    Pouch.adapters[id] = obj;
  }
};

Pouch.plugin = function(id, obj) {
  Pouch.plugins[id] = obj;
};

// Enumerate errors, add the status code so we can reflect the HTTP api
// in future
Pouch.Errors = {
  MISSING_BULK_DOCS: {
    status: 400,
    error: 'bad_request',
    reason: "Missing JSON list of 'docs'"
  },
  MISSING_DOC: {
    status: 404,
    error: 'not_found',
    reason: 'missing'
  },
  REV_CONFLICT: {
    status: 409,
    error: 'conflict',
    reason: 'Document update conflict'
  },
  INVALID_ID: {
    status: 400,
    error: 'invalid_id',
    reason: '_id field must contain a string'
  },
  MISSING_ID: {
    status: 412,
    error: 'missing_id',
    reason: '_id is required for puts'
  },
  RESERVED_ID: {
    status: 400,
    error: 'bad_request',
    reason: 'Only reserved document ids may start with underscore.'
  },
  NOT_OPEN: {
    status: 412,
    error: 'precondition_failed',
    reason: 'Database not open so cannot close'
  },
  UNKNOWN_ERROR: {
    status: 500,
    error: 'unknown_error',
    reason: 'Database encountered an unknown error'
  },
  INVALID_REQUEST: {
    status: 400,
    error: 'invalid_request',
    reason: 'Request was invalid'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  global.Pouch = Pouch;
  Pouch.merge = require('./pouch.merge.js').merge;
  Pouch.collate = require('./pouch.collate.js').collate;
  Pouch.replicate = require('./pouch.replicate.js').replicate;
  Pouch.utils = require('./pouch.utils.js');
  module.exports = Pouch;

  // load adapters known to work under node
  var adapters = ['leveldb', 'http'];
  adapters.map(function(adapter) {
    var adapter_path = './adapters/pouch.'+adapter+'.js';
    require(adapter_path);
  });
  require('./plugins/pouchdb.mapreduce.js');
} else {
  this.Pouch = Pouch;
}

(function() {
  // a few hacks to get things in the right place for node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pouch;
  }

  Pouch.collate = function(a, b) {
    var ai = collationIndex(a);
    var bi = collationIndex(b);
    if ((ai - bi) !== 0) {
      return ai - bi;
    }
    if (a === null) {
      return 0;
    }
    if (typeof a === 'number') {
      return a - b;
    }
    if (typeof a === 'boolean') {
      return a < b ? -1 : 1;
    }
    if (typeof a === 'string') {
      return stringCollate(a, b);
    }
    if (Array.isArray(a)) {
      return arrayCollate(a, b)
    }
    if (typeof a === 'object') {
      return objectCollate(a, b);
    }
  }

  var stringCollate = function(a, b) {
    // See: https://github.com/daleharvey/pouchdb/issues/40
    // This is incompatible with the CouchDB implementation, but its the
    // best we can do for now
    return (a === b) ? 0 : ((a > b) ? 1 : -1);
  }

  var objectCollate = function(a, b) {
    var ak = Object.keys(a), bk = Object.keys(b);
    var len = Math.min(ak.length, bk.length);
    for (var i = 0; i < len; i++) {
      // First sort the keys
      var sort = Pouch.collate(ak[i], bk[i]);
      if (sort !== 0) {
        return sort;
      }
      // if the keys are equal sort the values
      sort = Pouch.collate(a[ak[i]], b[bk[i]]);
      if (sort !== 0) {
        return sort;
      }

    }
    return (ak.length === bk.length) ? 0 :
      (ak.length > bk.length) ? 1 : -1;
  }

  var arrayCollate = function(a, b) {
    var len = Math.min(a.length, b.length);
    for (var i = 0; i < len; i++) {
      var sort = Pouch.collate(a[i], b[i]);
      if (sort !== 0) {
        return sort;
      }
    }
    return (a.length === b.length) ? 0 :
      (a.length > b.length) ? 1 : -1;
  }

  // The collation is defined by erlangs ordered terms
  // the atoms null, true, false come first, then numbers, strings,
  // arrays, then objects
  var collationIndex = function(x) {
    var id = ['boolean', 'number', 'string', 'object'];
    if (id.indexOf(typeof x) !== -1) {
      if (x === null) {
        return 1;
      }
      return id.indexOf(typeof x) + 2;
    }
    if (Array.isArray(x)) {
      return 4.5;
    }
  }

}).call(this);

(function() {
  // a few hacks to get things in the right place for node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Pouch;
    var utils = require('./pouch.utils.js');
    for (var k in utils) {
      global[k] = utils[k];
    }
  }

  // for a better overview of what this is doing, read:
  // https://github.com/apache/couchdb/blob/master/src/couchdb/couch_key_tree.erl
  //
  // But for a quick intro, CouchDB uses a revision tree to store a documents
  // history, A -> B -> C, when a document has conflicts, that is a branch in the
  // tree, A -> (B1 | B2 -> C), We store these as a nested array in the format
  //
  // KeyTree = [Path ... ]
  // Path = {pos: position_from_root, ids: Tree}
  // Tree = [Key, Tree]

  // Turn a path as a flat array into a tree with a single branch
  function pathToTree(path) {
    var root = [path.shift(), []];
    var leaf = root;
    while (path.length) {
      nleaf = [path.shift(), []];
      leaf[1].push(nleaf);
      leaf = nleaf;
    }
    return root;
  }

  // To ensure we dont grow the revision tree infinitely, we stem old revisions
  function stem(tree, depth) {
    // First we break out the tree into a complete list of root to leaf paths,
    // we cut off the start of the path and generate a new set of flat trees
    var stemmedPaths = rootToLeaf(tree).map(function(path) {
      var stemmed = path.ids.slice(-depth);
      return {
        pos: path.pos + (path.ids.length - stemmed.length),
        ids: pathToTree(stemmed)
      };
    });
    // Then we remerge all those flat trees together, ensuring that we dont
    // connect trees that would go beyond the depth limit
    return stemmedPaths.reduce(function(prev, current, i, arr) {
      return doMerge(prev, current, true).tree;
    }, [stemmedPaths.shift()]);
  }

  // Merge two trees together
  // The roots of tree1 and tree2 must be the same revision

  function mergeTree(in_tree1, in_tree2) {
    var queue = [{tree1: in_tree1, tree2: in_tree2}];
    var conflicts = false;
    while (queue.length > 0) {
      var item = queue.pop();
      var tree1 = item.tree1;
      var tree2 = item.tree2;

      for (var i = 0; i < tree2[1].length; i++) {
        if (!tree1[1][0]) {
          conflicts = 'new_leaf';
          tree1[1][0] = tree2[1][i];
          continue;
        }

        var merged = false;
        for (var j = 0; j < tree1[1].length; j++) {
          if (tree1[1][j][0] == tree2[1][i][0]) {
            queue.push({tree1: tree1[1][j], tree2: tree2[1][i]});
            merged = true;
          }
        }
        if (!merged) {
          conflicts = 'new_branch';
          tree1[1].push(tree2[1][i]);
          tree1[1].sort();
        }
      }
    }
    return {conflicts: conflicts, tree: in_tree1};
  }

  function doMerge(tree, path, dontExpand) {
    var restree = [];
    var conflicts = false;
    var merged = false;
    var res, branch;

    if (!tree.length) {
      return {tree: [path], conflicts: 'new_leaf'};
    }

    tree.forEach(function(branch) {
      if (branch.pos === path.pos && branch.ids[0] === path.ids[0]) {
        // Paths start at the same position and have the same root, so they need
        // merged
        res = mergeTree(branch.ids, path.ids);
        restree.push({pos: branch.pos, ids: res.tree});
        conflicts = conflicts || res.conflicts;
        merged = true;
      } else if (dontExpand !== true) {
        // The paths start at a different position, take the earliest path and
        // traverse up until it as at the same point from root as the path we want to
        // merge.  If the keys match we return the longer path with the other merged
        // After stemming we dont want to expand the trees

        var t1 = branch.pos < path.pos ? branch : path;
        var t2 = branch.pos < path.pos ? path : branch;
        var diff = t2.pos - t1.pos;

        var candidateParents = [];

        var trees = [];
        trees.push({ids: t1.ids, diff: diff, parent: null, parentIdx: null});
        while (trees.length > 0) {
          var item = trees.pop();
          if (item.diff == 0) {
            if (item.ids[0] == t2.ids[0]) {
              candidateParents.push(item);
            }
            continue;
          }
          if (!item.ids) continue;
          item.ids[1].forEach(function(el, idx) {
            trees.push({ids: el, diff: item.diff-1, parent: item.ids, parentIdx: idx});
          });
        }

        var el = candidateParents[0];

        if (!el) {
          restree.push(branch);
        } else {
          res = mergeTree(el.ids, t2.ids);
          el.parent[1][el.parentIdx] = res.tree;
          restree.push({pos: t1.pos, ids: t1.ids});
          conflicts = conflicts || res.conflicts;
          merged = true;
        }
      } else {
        restree.push(branch);
      }
    });

    // We didnt find
    if (!merged) {
      restree.push(path);
    }

    restree.sort(function(a, b) {
      return a.pos - b.pos;
    });

    return {
      tree: restree,
      conflicts: conflicts || 'internal_node'
    };
  }

  Pouch.merge = function(tree, path, depth) {
    // Ugh, nicer way to not modify arguments in place?
    tree = extend(true, [], tree);
    path = extend(true, {}, path);
    var newTree = doMerge(tree, path);
    return {
      tree: stem(newTree.tree, depth),
      conflicts: newTree.conflicts
    };
  };

  // We fetch all leafs of the revision tree, and sort them based on tree length
  // and whether they were deleted, undeleted documents with the longest revision
  // tree (most edits) win
  // The final sort algorithm is slightly documented in a sidebar here:
  // http://guide.couchdb.org/draft/conflicts.html
  Pouch.merge.winningRev = function(metadata) {
    var deletions = metadata.deletions || {};
    var leafs = [];

    traverseRevTree(metadata.rev_tree, function(isLeaf, pos, id) {
      if (isLeaf) leafs.push({pos: pos, id: id});
    });

    leafs.forEach(function(leaf) {
      leaf.deleted = leaf.id in deletions;
    });

    leafs.sort(function(a, b) {
      if (a.deleted !== b.deleted) {
        return a.deleted > b.deleted ? 1 : -1;
      }
      if (a.pos !== b.pos) {
        return b.pos - a.pos;
      }
      return a.id < b.id ? 1 : -1;
    });
    return leafs[0].pos + '-' + leafs[0].id;
  };

}).call(this);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Pouch;
}

(function() {

  function replicate(src, target, opts, callback, replicateRet) {

    fetchCheckpoint(src, target, opts, function(checkpoint) {
      var results = [];
      var completed = false;
      var pending = 0;
      var last_seq = checkpoint;
      var continuous = opts.continuous || false;
      var result = {
        ok: true,
        start_time: new Date(),
        docs_read: 0,
        docs_written: 0
      };

      function isCompleted() {
        if (completed && pending === 0) {
          result.end_time = new Date();
          writeCheckpoint(src, target, opts, last_seq, function() {
            call(callback, null, result);
          });
        }
      }

      if (replicateRet.cancelled) {
        return;
      }

      var repOpts = {
        continuous: continuous,
        since: checkpoint,
        style: 'all_docs',
        onChange: function(change) {
          last_seq = change.seq;
          results.push(change);
          result.docs_read++;
          pending++;
          var diff = {};
          diff[change.id] = change.changes.map(function(x) { return x.rev; });
          target.revsDiff(diff, function(err, diffs) {
            if (err) {
              if (continuous)
                replicateRet.cancel();
              call(callback, err, null);
              return;
            }
            if (Object.keys(diffs).length === 0) {
              pending--;
              isCompleted();
              return;
            }
            for (var id in diffs) {
              diffs[id].missing.map(function(rev) {
                src.get(id, {revs: true, rev: rev, attachments: true}, function(err, doc) {
                  target.bulkDocs({docs: [doc]}, {new_edits: false}, function() {
                    if (opts.onChange) {
                      opts.onChange.apply(this, [result]);
                    }
                    result.docs_written++;
                    pending--;
                    isCompleted();
                  });
                });
              });
            }
          });
        },
        complete: function(err, res) {
          completed = true;
          isCompleted();
        }
      };

      if (opts.filter) {
        repOpts.filter = opts.filter;
      }

      if (opts.query_params) {
        repOpts.query_params = opts.query_params;
      }

      var changes = src.changes(repOpts);
      if (opts.continuous) {
        replicateRet.cancel = changes.cancel;
      }
    });
  }

  function toPouch(db, callback) {
    if (typeof db === 'string') {
      return new Pouch(db, callback);
    }
    callback(null, db);
  }

  Pouch.replicate = function(src, target, opts, callback) {
    // TODO: This needs some cleaning up, from the replicate call I want
    // to return a promise in which I can cancel continuous replications
    // this will just proxy requests to cancel the changes feed but only
    // after we start actually running the changes feed
    if (opts instanceof Function) {
      callback = opts;
      opts = {}
    }
    if (opts === undefined) {
      opts = {};
    }

    var ret = function() {
      this.cancelled = false;
      this.cancel = function() {
        this.cancelled = true;
      }
    }
    var replicateRet = new ret();
    toPouch(src, function(err, src) {
      if (err) {
        return call(callback, err);
      }
      toPouch(target, function(err, target) {
        if (err) {
          return call(callback, err);
        }
        replicate(src, target, opts, callback, replicateRet);
      });
    });
    return replicateRet;
  };

}).call(this);

// Pretty dumb name for a function, just wraps callback calls so we dont
// to if (callback) callback() everywhere
var call = function(fun) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (typeof fun === typeof Function) {
    fun.apply(this, args);
  }
}

// Wrapper for functions that call the bulkdocs api with a single doc,
// if the first result is an error, return an error
var yankError = function(callback) {
  return function(err, results) {
    if (err || results[0].error) {
      call(callback, err || results[0]);
    } else {
      call(callback, null, results[0]);
    }
  };
};

var isAttachmentId = function(id) {
  return (/\//.test(id)
      && !/^_local/.test(id)
      && !/^_design/.test(id));
}

// Parse document ids: docid[/attachid]
//   - /attachid is optional, and can have slashes in it too
//   - int ids and strings beginning with _design or _local are not split
// returns an object: { docId: docid, attachmentId: attachid }
var parseDocId = function(id) {
  var ids = (typeof id === 'string') && !(/^_(design|local)\//.test(id))
    ? id.split('/')
    : [id]
  return {
    docId: ids[0],
    attachmentId: ids.splice(1).join('/').replace(/^\/+/, '')
  }
}

// check if a specific revision of a doc has been deleted
//  - metadata: the metadata object from the doc store
//  - rev: (optional) the revision to check. defaults to metadata.rev
var isDeleted = function(metadata, rev) {
  if (!metadata || !metadata.deletions) return false;
  if (!rev) {
    rev = Pouch.merge.winningRev(metadata);
  }
  if (rev.indexOf('-') >= 0) {
    rev = rev.split('-')[1];
  }

  return metadata.deletions[rev] === true;
}

// Determine id an ID is valid
//   - invalid IDs begin with an underescore that does not begin '_design' or '_local'
//   - any other string value is a valid id
var isValidId = function(id) {
  if (/^_/.test(id)) {
    return /^_(design|local)/.test(id);
  }
  return true;
}

// Preprocess documents, parse their revisions, assign an id and a
// revision for new writes that are missing them, etc
var parseDoc = function(doc, newEdits) {
  var error = null;

  // check for an attachment id and add attachments as needed
  if (doc._id) {
    var id = parseDocId(doc._id);
    if (id.attachmentId !== '') {
      var attachment = btoa(JSON.stringify(doc));
      doc = {
        _id: id.docId,
      }
      if (!doc._attachments) {
        doc._attachments = {};
      }
      doc._attachments[id.attachmentId] = {
        content_type: 'application/json',
        data: attachment
      }
    }
  }

  if (newEdits) {
    if (!doc._id) {
      doc._id = Math.uuid();
    }
    var newRevId = Math.uuid(32, 16).toLowerCase();
    var nRevNum;
    if (doc._rev) {
      var revInfo = /^(\d+)-(.+)$/.exec(doc._rev);
      if (!revInfo) {
        throw "invalid value for property '_rev'";
      }
      doc._rev_tree = [{
        pos: parseInt(revInfo[1], 10),
        ids: [revInfo[2], [[newRevId, []]]]
      }];
      nRevNum = parseInt(revInfo[1], 10) + 1;
    } else {
      doc._rev_tree = [{
        pos: 1,
        ids : [newRevId, []]
      }];
      nRevNum = 1;
    }
  } else {
    if (doc._revisions) {
      doc._rev_tree = [{
        pos: doc._revisions.start - doc._revisions.ids.length + 1,
        ids: doc._revisions.ids.reduce(function(acc, x) {
          if (acc === null) {
            return [x, []];
          } else {
            return [x, [acc]];
          }
        }, null)
      }];
      nRevNum = doc._revisions.start;
      newRevId = doc._revisions.ids[0];
    }
    if (!doc._rev_tree) {
      var revInfo = /^(\d+)-(.+)$/.exec(doc._rev);
      nRevNum = parseInt(revInfo[1], 10);
      newRevId = revInfo[2];
      doc._rev_tree = [{
        pos: parseInt(revInfo[1], 10),
        ids: [revInfo[2], []]
      }];
    }
  }

  if (typeof doc._id !== 'string') {
    error = Pouch.Errors.INVALID_ID;
  }
  else if (!isValidId(doc._id)) {
    error = Pouch.Errors.RESERVED_ID;
  }

  doc._id = decodeURIComponent(doc._id);
  doc._rev = [nRevNum, newRevId].join('-');

  if (error) {
    return error;
  }

  return Object.keys(doc).reduce(function(acc, key) {
    if (/^_/.test(key) && key !== '_attachments') {
      acc.metadata[key.slice(1)] = doc[key];
    } else {
      acc.data[key] = doc[key];
    }
    return acc;
  }, {metadata : {}, data : {}});
};

var compareRevs = function(a, b) {
  // Sort by id
  if (a.id !== b.id) {
    return (a.id < b.id ? -1 : 1);
  }
  // Then by deleted
  if (a.deleted ^ b.deleted) {
    return (a.deleted ? -1 : 1);
  }
  // Then by rev id
  if (a.rev_tree[0].pos === b.rev_tree[0].pos) {
    return (a.rev_tree[0].ids < b.rev_tree[0].ids ? -1 : 1);
  }
  // Then by depth of edits
  return (a.rev_tree[0].start < b.rev_tree[0].start ? -1 : 1);
};

// Pretty much all below can be combined into a higher order function to
// traverse revisions
// Callback has signature function(isLeaf, pos, id, [context])
// The return value from the callback will be passed as context to all children of that node
var traverseRevTree = function(revs, callback) {
  var toVisit = [];

  revs.forEach(function(tree) {
    toVisit.push({pos: tree.pos, ids: tree.ids});
  });

  while (toVisit.length > 0) {
    var node = toVisit.pop(),
        pos = node.pos,
        tree = node.ids;
    var newCtx = callback(tree[1].length == 0, pos, tree[0], node.ctx);
    tree[1].forEach(function(branch) {
      toVisit.push({pos: pos+1, ids: branch, ctx: newCtx});
    });
  }
}

var collectRevs = function(path) {
  var revs = [];

  traverseRevTree([path], function(isLeaf, pos, id) {
    revs.push({rev: pos + "-" + id, status: 'available'});
  });

  return revs;
}

var collectLeaves = function(revs) {
  var leaves = [];
  traverseRevTree(revs, function(isLeaf, pos, id) {
    if (isLeaf) leaves.unshift({rev: pos + "-" + id, pos: pos});
  });
  leaves.sort(function(a, b) {
    return b.pos-a.pos;
  });
  leaves.map(function(leaf) { delete leaf.pos });
  return leaves;
}

var collectConflicts = function(revs) {
  var leaves = collectLeaves(revs);
  // First is current rev
  leaves.shift();
  return leaves.map(function(x) { return x.rev; });
}

var fetchCheckpoint = function(src, target, opts, callback) {
  var filter_func = '';
  if(typeof opts.filter != "undefined"){
    filter_func = opts.filter.toString();
  }

  var id = Crypto.MD5(src.id() + target.id() + filter_func);
  src.get('_local/' + id, function(err, doc) {
    if (err && err.status === 404) {
      callback(0);
    } else {
      callback(doc.last_seq);
    }
  });
};

var writeCheckpoint = function(src, target, opts, checkpoint, callback) {
  var filter_func = '';
  if(typeof opts.filter != "undefined"){
    filter_func = opts.filter.toString();
  }

  var check = {
    _id: '_local/' + Crypto.MD5(src.id() + target.id() + filter_func),
    last_seq: checkpoint
  };
  src.get(check._id, function(err, doc) {
    if (doc && doc._rev) {
      check._rev = doc._rev;
    }
    src.put(check, function(err, doc) {
      callback();
    });
  });
};

var arrayFirst = function(arr, callback) {
  for (var i = 0; i < arr.length; i++) {
    if (callback(arr[i], i) === true) {
      return arr[i];
    }
  }
  return false;
};

var filterChange = function(opts) {
  return function(change) {
    if (opts.filter && !opts.filter.call(this, change.doc)) {
      return;
    }
    if (!opts.include_docs) {
      delete change.doc;
    }
    call(opts.onChange, change);
  }
};

var rootToLeaf = function(tree) {
  var paths = [];
  traverseRevTree(tree, function(isLeaf, pos, id, history) {
    history = history ? history.slice(0) : [];
    history.push(id);
    if (isLeaf) {
      var rootPos = pos + 1 - history.length;
      paths.unshift({pos: rootPos, ids: history});
    }
    return history;
  });
  return paths;
};

var ajax = function ajax(options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  var defaultOptions = {
    method : "GET",
    headers: {},
    json: true,
    timeout: 10000
  };
  options = extend(true, defaultOptions, options);
  if (options.auth) {
      var token = btoa(options.auth.username + ':' + options.auth.password);
      options.headers.Authorization = 'Basic ' + token;
  }
  var onSuccess = function(obj, resp, cb){
    if (!options.json && typeof obj !== 'string') {
          obj = JSON.stringify(obj);
    } else if (options.json && typeof obj === 'string') {
          obj = JSON.parse(obj);
    }
    call(cb, null, obj, resp);
  };
  var onError = function(err, cb){
    var errParsed;
    var errObj = err.responseText ? {status: err.status} : err; //this seems too clever
         try{
          errParsed = JSON.parse(err.responseText); //would prefer not to have a try/catch clause
          errObj = extend(true, {}, errObj, errParsed);
         } catch(e){}
         call(cb, errObj);
  };
  if (typeof window !== 'undefined' && window.XMLHttpRequest) {
    var timer,timedout  = false;
    var xhr = new XMLHttpRequest();
    xhr.open(options.method, options.url);
    if (options.json) {
      options.headers.Accept = 'application/json';
      options.headers['Content-Type'] = 'application/json';
      if (options.body && typeof options.body !== "string") {
        options.body = JSON.stringify(options.body);
      }
    }
    for (var key in options.headers){
      xhr.setRequestHeader(key, options.headers[key]);
    }
    if (!("body" in options)) {
      options.body = null;
    }

    var abortReq = function() {
        timedout=true;
        xhr.abort();
        call(onError, xhr, callback);
      }
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4 || timedout) return;
      clearTimeout(timer);
      if (xhr.status >= 200 && xhr.status < 300){
        call(onSuccess, xhr.responseText, xhr, callback);
      } else {
         call(onError, xhr, callback);
      }
    };
    if (options.timeout > 0) {
      timer = setTimeout(abortReq, options.timeout);
    }
    xhr.send(options.body);
    return {abort:abortReq};
  } else {
    if (options.json) {
      options.headers.Accept = 'application/json';
      options.headers['Content-Type'] = 'application/json';
    }
    return request(options, function(err, response, body) {
      if (err) {
        err.status = response ? response.statusCode : 400;
        return call(onError, err, callback);
      }

      var content_type = response.headers['content-type']
        , data = (body || '');

      // CouchDB doesn't always return the right content-type for JSON data, so
      // we check for ^{ and }$ (ignoring leading/trailing whitespace)
      if (options.json && typeof data !== 'object' && (/json/.test(content_type)
          || (/^[\s]*{/.test(data) && /}[\s]*$/.test(data)))) {
        data = JSON.parse(data);
      }

      if (data.error) {
        data.status = response.statusCode;
        call(onError, data, callback);
      }
      else {
        call(onSuccess, data, response, callback);
      }
    });
  }
};

// Extends method
// (taken from http://code.jquery.com/jquery-1.9.0.js)
// Populate the class2type map
var class2type = {};

var types = ["Boolean", "Number", "String", "Function", "Array", "Date", "RegExp", "Object", "Error"];
for (var i = 0; i < types.length; i++) {
  var typename = types[i];
  class2type[ "[object " + typename + "]" ] = typename.toLowerCase();
}

var core_toString = class2type.toString;
var core_hasOwn = class2type.hasOwnProperty;

var type = function(obj) {
  if (obj === null) {
    return String( obj );
  }
  return typeof obj === "object" || typeof obj === "function" ?
    class2type[core_toString.call(obj)] || "object" :
    typeof obj;
};

var isPlainObject = function( obj ) {
  // Must be an Object.
  // Because of IE, we also have to check the presence of the constructor property.
  // Make sure that DOM nodes and window objects don't pass through, as well
  if ( !obj || type(obj) !== "object" || obj.nodeType || isWindow( obj ) ) {
    return false;
  }

  try {
    // Not own constructor property must be Object
    if ( obj.constructor &&
      !core_hasOwn.call(obj, "constructor") &&
      !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
      return false;
    }
  } catch ( e ) {
    // IE8,9 Will throw exceptions on certain host objects #9897
    return false;
  }

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.

  var key;
  for ( key in obj ) {}

  return key === undefined || core_hasOwn.call( obj, key );
};

var isFunction = function(obj) {
  return type(obj) === "function";
};

var isWindow = function(obj) {
  return obj != null && obj == obj.window;
};

var isArray = Array.isArray || function(obj) {
  return type(obj) === "array";
};

var extend = function() {
  var options, name, src, copy, copyIsArray, clone,
    target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false;

  // Handle a deep copy situation
  if ( typeof target === "boolean" ) {
    deep = target;
    target = arguments[1] || {};
    // skip the boolean and the target
    i = 2;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if ( typeof target !== "object" && !isFunction(target) ) {
    target = {};
  }

  // extend jQuery itself if only one argument is passed
  if ( length === i ) {
    target = this;
    --i;
  }

  for ( ; i < length; i++ ) {
    // Only deal with non-null/undefined values
    if ((options = arguments[ i ]) != null) {
      // Extend the base object
      for ( name in options ) {
        src = target[ name ];
        copy = options[ name ];

        // Prevent never-ending loop
        if ( target === copy ) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = isArray(copy)) ) ) {
          if ( copyIsArray ) {
            copyIsArray = false;
            clone = src && isArray(src) ? src : [];

          } else {
            clone = src && isPlainObject(src) ? src : {};
          }

          // Never move original objects, clone them
          target[ name ] = extend( deep, clone, copy );

        // Don't bring in undefined values
        } else if ( copy !== undefined ) {
          target[ name ] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
};

// Basic wrapper for localStorage
var win = this;
var localJSON = (function(){
  if (!win.localStorage) {
    return false;
  }
  return {
    set: function(prop, val) {
      localStorage.setItem(prop, JSON.stringify(val));
    },
    get: function(prop, def) {
      try {
        if (localStorage.getItem(prop) === null) {
          return def;
        }
        return JSON.parse((localStorage.getItem(prop) || 'false'));
      } catch(err) {
        return def;
      }
    },
    remove: function(prop) {
      localStorage.removeItem(prop);
    }
  };
})();

// btoa and atob don't exist in node. see https://developer.mozilla.org/en-US/docs/DOM/window.btoa
if (typeof btoa === 'undefined') {
  btoa = function(str) {
    return new Buffer(unescape(encodeURIComponent(str)), 'binary').toString('base64');
  }
}
if (typeof atob === 'undefined') {
  atob = function(str) {
    return decodeURIComponent(escape(new Buffer(str, 'base64').toString('binary')));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  // use node.js's crypto library instead of the Crypto object created by deps/uuid.js
  var crypto = require('crypto');
  var Crypto = {
    MD5: function(str) {
      return crypto.createHash('md5').update(str).digest('hex');
    }
  }
  request = require('request');
  _ = require('underscore');
  $ = _;

  module.exports = {
    Crypto: Crypto,
    call: call,
    yankError: yankError,
    isAttachmentId: isAttachmentId,
    parseDocId: parseDocId,
    parseDoc: parseDoc,
    isDeleted: isDeleted,
    compareRevs: compareRevs,
    collectRevs: collectRevs,
    collectLeaves: collectLeaves,
    collectConflicts: collectConflicts,
    fetchCheckpoint: fetchCheckpoint,
    writeCheckpoint: writeCheckpoint,
    arrayFirst: arrayFirst,
    filterChange: filterChange,
    ajax: ajax,
    atob: atob,
    btoa: btoa,
    extend: extend,
    traverseRevTree: traverseRevTree,
    rootToLeaf: rootToLeaf,
    isPlainObject: isPlainObject,
    isArray: isArray
  }
}

var Changes = function() {

  var api = {};
  var listeners = {};

  window.addEventListener("storage", function(e) {
    api.notify(e.key);
  });

  api.addListener = function(db_name, id, db, opts) {
    if (!listeners[db_name]) {
      listeners[db_name] = {};
    }
    listeners[db_name][id] = {
      db: db,
      opts: opts
    };
  }

  api.removeListener = function(db_name, id) {
    delete listeners[db_name][id];
  }

  api.clearListeners = function(db_name) {
    delete listeners[db_name];
  }

  api.notify = function(db_name) {
    if (!listeners[db_name]) { return; }
    for (var i in listeners[db_name]) {
      var opts = listeners[db_name][i].opts;
      listeners[db_name][i].db.changes({
        include_docs: opts.include_docs,
        conflicts: opts.conflicts,
        continuous: false,
        filter: opts.filter,
        since: opts.since,
        onChange: function(c) {
          if (c.seq > opts.since) {
            opts.since = c.seq;
            call(opts.onChange, c);
          }
        }
      });
    }
  }

  return api;
};


"use strict";

var HTTP_TIMEOUT = 10000;

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri (str) {
  var o = parseUri.options;
  var m = o.parser[o.strictMode ? "strict" : "loose"].exec(str);
  var uri = {};
  var i = 14;

  while (i--) uri[o.key[i]] = m[i] || "";

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
}

parseUri.options = {
  strictMode: false,
  key: ["source","protocol","authority","userInfo","user","password","host",
        "port","relative","path","directory","file","query","anchor"],
  q:   {
    name:   "queryKey",
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  parser: {
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};

// Get all the information you possibly can about the URI given by name and
// return it as a suitable object.
function getHost(name) {
  // If the given name contains "http:"
  if (/http(s?):/.test(name)) {
    // Prase the URI into all its little bits
    var uri = parseUri(name);

    // Store the fact that it is a remote URI
    uri.remote = true;

    // Store the user and password as a separate auth object
    if (uri.user || uri.password) {
      uri.auth = {username: uri.user, password: uri.password};
    }

    // Split the path part of the URI into parts using '/' as the delimiter
    // after removing any leading '/' and any trailing '/'
    var parts = uri.path.replace(/(^\/|\/$)/g, '').split('/');

    // Store the first part as the database name and remove it from the parts
    // array
    uri.db = parts.pop();

    // Restore the path by joining all the remaining parts (all the parts
    // except for the database name) with '/'s
    uri.path = parts.join('/');

    return uri;
  }

  // If the given name does not contain 'http:' then return a very basic object
  // with no host, the current path, the given name as the database name and no
  // username/password
  return {host: '', path: '/', db: name, auth: false};
}

// Generate a URL with the host data given by opts and the given path
function genDBUrl(opts, path) {
  // If the host is remote
  if (opts.remote) {
    // If the host already has a path, then we need to have a path delimiter
    // Otherwise, the path delimiter is the empty string
    var pathDel = !opts.path ? '' : '/';

    // Return the URL made up of all the host's information and the given path
    return opts.protocol + '://' + opts.host + ':' + opts.port + '/' +
      opts.path + pathDel + opts.db + '/' + path;
  }

  // If the host is not remote, then return the URL made up of just the
  // database name and the given path
  return '/' + opts.db + '/' + path;
}

// Generate a URL with the host data given by opts and the given path
function genUrl(opts, path) {
  if (opts.remote) {
    return opts.protocol + '://' + opts.host + ':' + opts.port + '/' + path;
  }
  return '/' + path;
}

// Implements the PouchDB API for dealing with CouchDB instances over HTTP
var HttpPouch = function(opts, callback) {

  // Parse the URI given by opts.name into an easy-to-use object
  var host = getHost(opts.name);
  if (opts.auth) host.auth = opts.auth;

  // Generate the database URL based on the host
  var db_url = genDBUrl(host, '');

  // The functions that will be publically available for HttpPouch
  var api = {};

  var uuids = {
    list: [],
    get: function(opts, callback) {
      if (typeof opts === 'function') {
        callback = opts;
        opts = {count: 10};
      }
      var cb = function(err, body) {
        if (err || !('uuids' in body)) {
          call(callback, err || Pouch.Errors.UNKNOWN_ERROR);
        } else {
          uuids.list = uuids.list.concat(body.uuids);
          call(callback, null, "OK");
        }
      };
      var params = '?count=' + opts.count;
      ajax({
        auth: host.auth,
        method: 'GET',
        url: genUrl(host, '_uuids') + params
      }, cb);
    }
  };

  // Create a new CouchDB database based on the given opts
  var createDB = function(){
    ajax({auth: host.auth, method: 'PUT', url: db_url}, function(err, ret) {
      // If we get an "Unauthorized" error
      if (err && err.status === 401) {
        // Test if the database already exists
        ajax({auth: host.auth, method: 'HEAD', url: db_url}, function (err, ret) {
          // If there is still an error
          if (err) {
            // Give the error to the callback to deal with
            call(callback, err);
          } else {
            // Continue as if there had been no errors
            call(callback, null, api);
          }
        });
        // If there were no errros or if the only error is "Precondition Failed"
        // (note: "Precondition Failed" occurs when we try to create a database
        // that already exists)
      } else if (!err || err.status === 412) {
        // Continue as if there had been no errors
        call(callback, null, api);
      } else {
        call(callback, Pouch.Errors.UNKNOWN_ERROR);
      }
    });
  };

  // ajax({auth: host.auth, method: 'GET', url: db_url}, function(err, ret) {
  //   //check if the db exists
  //   if (err) {
  //     if (err.status === 404) {
  //       //if it doesn't, create it
  //       createDB();
  //     } else {
  //       call(callback, err);
  //     }
  //   } else {
  //     //go do stuff with the db
  //     call(callback, null, api);
  //     }
  // });

  api.type = function() {
    return 'http';
  };

  // The HttpPouch's ID is its URL
  api.id = function() {
    return genDBUrl(host, '');
  };

  api.request = function(options, callback) {
    options.auth = host.auth;
    options.url = genDBUrl(host, options.url);
    ajax(options, callback);
  };

  // Sends a POST request to the host calling the couchdb _compact function
  //    version: The version of CouchDB it is running
  api.compact = function(callback) {
    ajax({
      auth: host.auth,
      url: genDBUrl(host, '_compact'),
      method: 'POST'
    }, callback)
  }

  // Calls GET on the host, which gets back a JSON string containing
  //    couchdb: A welcome string
  //    version: The version of CouchDB it is running
  api.info = function(callback) {
    ajax({
      auth: host.auth,
      method:'GET',
      url: genDBUrl(host, ''),
    }, callback);
  };

  // Get the document with the given id from the database given by host.
  // The id could be solely the _id in the database, or it may be a
  // _design/ID or _local/ID path
  api.get = function(id, opts, callback) {
    // If no options were given, set the callback to the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    // List of parameters to add to the GET request
    var params = [];

    // If it exists, add the opts.revs value to the list of parameters.
    // If revs=true then the resulting JSON will include a field
    // _revisions containing an array of the revision IDs.
    if (opts.revs) {
      params.push('revs=true');
    }

    // If it exists, add the opts.revs_info value to the list of parameters.
    // If revs_info=true then the resulting JSON will include the field
    // _revs_info containing an array of objects in which each object
    // representing an available revision.
    if (opts.revs_info) {
      params.push('revs_info=true');
    }

    // If it exists, add the opts.attachments value to the list of parameters.
    // If attachments=true the resulting JSON will include the base64-encoded
    // contents in the "data" property of each attachment.
    if (opts.attachments) {
      params.push('attachments=true');
    }

    // If it exists, add the opts.rev value to the list of parameters.
    // If rev is given a revision number then get the specified revision.
    if (opts.rev) {
      params.push('rev=' + opts.rev);
    }

    // If it exists, add the opts.conflicts value to the list of parameters.
    // If conflicts=true then the resulting JSON will include the field
    // _conflicts containing all the conflicting revisions.
    if (opts.conflicts) {
      params.push('conflicts=' + opts.conflicts);
    }

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    params = params === '' ? '' : '?' + params;

    // Set the options for the ajax call
    var options = {
      auth: host.auth,
      method: 'GET',
      url: genDBUrl(host, id + params)
    };

    // If the given id contains at least one '/' and the part before the '/'
    // is NOT "_design" and is NOT "_local"
    // OR
    // If the given id contains at least two '/' and the part before the first
    // '/' is "_design".
    // TODO This second condition seems strange since if parts[0] === '_design'
    // then we already know that parts[0] !== '_local'.
    var parts = id.split('/');
    if ((parts.length > 1 && parts[0] !== '_design' && parts[0] !== '_local') ||
        (parts.length > 2 && parts[0] === '_design' && parts[0] !== '_local')) {
      // Nothing is expected back from the server
      options.json = false;
    }

    // Get the document
    ajax(options, function(err, doc, xhr) {
      // If the document does not exist, send an error to the callback
      if (err) {
        return call(callback, Pouch.Errors.MISSING_DOC);
      }

      // Send the document to the callback
      call(callback, null, doc, xhr);
    });
  };

  // Delete the document given by doc from the database given by host.
  api.remove = function(doc, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    // Delete the document
    ajax({
      auth: host.auth,
      method:'DELETE',
      url: genDBUrl(host, doc._id) + '?rev=' + doc._rev
    }, callback);
  };

  // Remove the attachment given by the id and rev
  api.removeAttachment = function idb_removeAttachment(id, rev, callback) {
    ajax({
      auth: host.auth,
      method: 'DELETE',
      url: genDBUrl(host, id) + '?rev=' + rev,
    }, callback);
  };

  // Add the attachment given by doc and the content type given by type
  // to the document with the given id, the revision given by rev, and
  // add it to the database given by host.
  api.putAttachment = function(id, rev, doc, type, callback) {
    // Add the attachment
    ajax({
      auth: host.auth,
      method:'PUT',
      url: genDBUrl(host, id) + '?rev=' + rev,
      headers: {'Content-Type': type},
      body: doc
    }, callback);
  };

  // Add the document given by doc (in JSON string format) to the database
  // given by host. This fails if the doc has no _id field.
  api.put = function(doc, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    if (!doc || !('_id' in doc)) {
      return call(callback, Pouch.Errors.MISSING_ID);
    }

    // List of parameter to add to the PUT request
    var params = [];

    // If it exists, add the opts.new_edits value to the list of parameters.
    // If new_edits = false then the database will NOT assign this document a
    // new revision number
    if (opts && typeof opts.new_edits !== 'undefined') {
      params.push('new_edits=' + opts.new_edits);
    }

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    if (params !== '') {
      params = '?' + params;
    }

    // Add the document
    ajax({
      auth: host.auth,
      method: 'PUT',
      url: genDBUrl(host, doc._id) + params,
      body: doc
    }, callback);
  };

  // Add the document given by doc (in JSON string format) to the database
  // given by host. This does not assume that doc is a new document (i.e. does not
  // have a _id or a _rev field.
  api.post = function(doc, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (! ("_id" in doc)) {
      if (uuids.list.length > 0) {
        doc._id = uuids.list.pop();
        api.put(doc, opts, callback);
      }else {
        uuids.get(function(err, resp) {
          if (err) {
            return call(callback, Pouch.Errors.UNKNOWN_ERROR);
          }
          doc._id = uuids.list.pop();
          api.put(doc, opts, callback);
        });
      }
    } else {
      api.put(doc, opts, callback);
    }
  };

  // Update/create multiple documents given by req in the database
  // given by host.
  api.bulkDocs = function(req, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (!opts) {
      opts = {}
    }

    // If opts.new_edits exists add it to the document data to be
    // send to the database.
    // If new_edits=false then it prevents the database from creating
    // new revision numbers for the documents. Instead it just uses
    // the old ones. This is used in database replication.
    if (typeof opts.new_edits !== 'undefined') {
      req.new_edits = opts.new_edits;
    }

    // Update/create the documents
    ajax({
      auth: host.auth,
      method:'POST',
      url: genDBUrl(host, '_bulk_docs'),
      body: req
    }, callback);
  };

  // Get a listing of the documents in the database given
  // by host and ordered by increasing id.
  api.allDocs = function(opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    // List of parameters to add to the GET request
    var params = [];
    var body = undefined;
    var method = 'GET';

    // TODO I don't see conflicts as a valid parameter for a
    // _all_docs request (see http://wiki.apache.org/couchdb/HTTP_Document_API#all_docs)
    if (opts.conflicts) {
      params.push('conflicts=true');
    }

    // If opts.include_docs exists, add the include_docs value to the
    // list of parameters.
    // If include_docs=true then include the associated document with each
    // result.
    if (opts.include_docs) {
      params.push('include_docs=true');
    }

    // If opts.startkey exists, add the startkey value to the list of
    // parameters.
    // If startkey is given then the returned list of documents will
    // start with the document whose id is startkey.
    if (opts.startkey) {
      params.push('startkey=' +
                  encodeURIComponent(JSON.stringify(opts.startkey)));
    }

    // If opts.endkey exists, add the endkey value to the list of parameters.
    // If endkey is given then the returned list of docuemnts will
    // end with the document whose id is endkey.
    if (opts.endkey) {
      params.push('endkey=' + encodeURIComponent(JSON.stringify(opts.endkey)));
    }

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    if (params !== '') {
      params = '?' + params;
    }

    // If keys are supplied, issue a POST request to circumvent GET query string limits
    // see http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
    if (typeof opts.keys !== 'undefined') {
      method = 'POST';
      body = JSON.stringify({keys:opts.keys});
    }

    // Get the document listing
    ajax({
      auth: host.auth,
      method: method,
      url: genDBUrl(host, '_all_docs' + params),
      body: body
    }, callback);
  };
  // Get a list of changes made to documents in the database given by host.
  // TODO According to the README, there should be two other methods here,
  // api.changes.addListener and api.changes.removeListener.
  api.changes = function(opts) {

    if (Pouch.DEBUG)
      console.log(db_url + ': Start Changes Feed: continuous=' + opts.continuous);

    // Query string of all the parameters to add to the GET request
    var params = [],
        paramsStr;

    if (opts.style) {
      params.push('style='+opts.style);
    }

    // If opts.include_docs exists, opts.filter exists, and opts.filter is a
    // function, add the include_docs value to the query string.
    // If include_docs=true then include the associated document with each
    // result.
    if (opts.include_docs || opts.filter && typeof opts.filter === 'function') {
      params.push('include_docs=true');
    }

    // If opts.continuous exists, add the feed value to the query string.
    // If feed=longpoll then it waits for either a timeout or a change to
    // occur before returning.
    if (opts.continuous) {
      params.push('feed=longpoll');
    }

    // If opts.conflicts exists, add the conflicts value to the query string.
    // TODO I can't find documentation of what conflicts=true does. See
    // http://wiki.apache.org/couchdb/HTTP_database_API#Changes
    if (opts.conflicts) {
      params.push('conflicts=true');
    }

    // If opts.descending exists, add the descending value to the query string.
    // if descending=true then the change results are returned in
    // descending order (most recent change first).
    if (opts.descending) {
      params.push('descending=true');
    }

    // If opts.filter exists and is a string then add the filter value
    // to the query string.
    // If filter is given a string containing the name of a filter in
    // the design, then only documents passing through the filter will
    // be returned.
    if (opts.filter && typeof opts.filter === 'string') {
      params.push('filter=' + opts.filter);
    }

    // If opts.query_params exists, pass it through to the changes request.
    // These parameters may be used by the filter on the source database.
    if (opts.query_params && typeof opts.query_params === 'object') {
      for (var param_name in opts.query_params) {
        if (opts.query_params.hasOwnProperty(param_name)) {
          params.push(param_name+'='+opts.query_params[param_name]);
        }
      }
    }

    paramsStr = '?';

    if (params.length > 0) {
      paramsStr += params.join('&');
    }

    var xhr;
    var last_seq;

    // Get all the changes starting wtih the one immediately after the
    // sequence number given by since.
    var fetch = function(since, callback) {
      // Set the options for the ajax call
      var xhrOpts = {
        auth: host.auth, method:'GET',
        url: genDBUrl(host, '_changes' + paramsStr + '&since=' + since),
        timeout: null          // _changes can take a long time to generate, especially when filtered
      };
      last_seq = since;

      if (opts.aborted) {
        return;
      }

      // Get the changes
      xhr = ajax(xhrOpts, callback);
    };

    // If opts.since exists, get all the changes from the sequence
    // number given by opts.since. Otherwise, get all the changes
    // from the sequence number 0.
    var fetchTimeout = 10;
    var fetchRetryCount = 0;
    var fetched = function(err, res) {
      // If the result of the ajax call (res) contains changes (res.results)
      if (res && res.results) {
        // For each change
        res.results.forEach(function(c) {
          var hasFilter = opts.filter && typeof opts.filter === 'function';
          if (opts.aborted || hasFilter && !opts.filter.apply(this, [c.doc])) {
            return;
          }

          // Process the change
          call(opts.onChange, c);
        });
      }
      // The changes feed may have timed out with no results
      // if so reuse last update sequence
      if (res && res.last_seq) {
        last_seq = res.last_seq;
      }

      if (opts.continuous) {
        // Increase retry delay exponentially as long as errors persist
        if (err) fetchRetryCount += 1;
        else fetchRetryCount = 0;
        var timeoutMultiplier = 1 << fetchRetryCount;       // i.e. Math.pow(2, fetchRetryCount)

        var retryWait = fetchTimeout * timeoutMultiplier;
        var maximumWait = opts.maximumWait || 30000;
        if (retryWait > maximumWait) {
          call(opts.complete, err || Pouch.Errors.UNKNOWN_ERROR, null);
        }

        // Queue a call to fetch again with the newest sequence number
        setTimeout(function () {
          fetch(last_seq, fetched);
        }, retryWait);
      } else {
        // We're done, call the callback
        call(opts.complete, null, res);
      }
    };

    fetch(opts.since || 0, fetched);

    // Return a method to cancel this method from processing any more
    return {
      cancel: function() {
        if (Pouch.DEBUG)
          console.log(db_url + ': Cancel Changes Feed');
        opts.aborted = true;
        xhr.abort();
      }
    };
  };

  // Given a set of document/revision IDs (given by req), tets the subset of
  // those that do NOT correspond to revisions stored in the database.
  // See http://wiki.apache.org/couchdb/HttpPostRevsDiff
  api.revsDiff = function(req, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    // Get the missing document/revision IDs
    ajax({
      auth: host.auth,
      method:'POST',
      url: genDBUrl(host, '_revs_diff'),
      body: req
    }, function(err, res) {
      call(callback, null, res);
    });
  };

  api.replicate = {};

  // Replicate from the database given by url to this HttpPouch
  api.replicate.from = function(url, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(url, api, opts, callback);
  };

  // Replicate to the database given by dbName from this HttpPouch
  api.replicate.to = function(dbName, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(api, dbName, opts, callback);
  };

  api.close = function(callback) {
    call(callback, null);
  };

  call(callback, null, api);
  return api;
};

// Delete the HttpPouch specified by the given name.
HttpPouch.destroy = function(name, callback) {
  var host = getHost(name);
  ajax({auth: host.auth, method: 'DELETE', url: genDBUrl(host, '')}, callback);
};

// HttpPouch is a valid adapter.
HttpPouch.valid = function() {
  return true;
};

if (typeof module !== 'undefined' && module.exports) {
  // running in node
  var pouchdir = '../';
  this.Pouch = require(pouchdir + 'pouch.js')
  this.ajax = Pouch.utils.ajax;
}

// Set HttpPouch to be the adapter used with the http scheme.
Pouch.adapter('http', HttpPouch);
Pouch.adapter('https', HttpPouch);

// While most of the IDB behaviors match between implementations a
// lot of the names still differ. This section tries to normalize the
// different objects & methods.
window.indexedDB = window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB;

// still needed for R/W transactions in Android Chrome. follow MDN example:
// https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#transaction
// note though that Chrome Canary fails on undefined READ_WRITE constants
// on the native IDBTransaction object
window.IDBTransaction = (window.IDBTransaction && window.IDBTransaction.READ_WRITE)
  ? window.IDBTransaction
  : (window.webkitIDBTransaction && window.webkitIDBTransaction.READ_WRITE)
    ? window.webkitIDBTransaction
    : { READ_WRITE: 'readwrite' };

window.IDBKeyRange = window.IDBKeyRange ||
  window.webkitIDBKeyRange;

window.storageInfo = window.storageInfo ||
  window.webkitStorageInfo;

window.requestFileSystem = window.requestFileSystem ||
    window.webkitRequestFileSystem;

var idbError = function(callback) {
  return function(event) {
    call(callback, {
      status: 500,
      error: event.type,
      reason: event.target
    });
  };
};

var IdbPouch = function(opts, callback) {

  // IndexedDB requires a versioned database structure, this is going to make
  // it hard to dynamically create object stores if we needed to for things
  // like views
  var POUCH_VERSION = 1;

  // The object stores created for each database
  // DOC_STORE stores the document meta data, its revision history and state
  var DOC_STORE = 'document-store';
  // BY_SEQ_STORE stores a particular version of a document, keyed by its
  // sequence id
  var BY_SEQ_STORE = 'by-sequence';
  // Where we store attachments
  var ATTACH_STORE = 'attach-store';
  // Where we store meta data
  var META_STORE = 'meta-store';


  var name = opts.name;
  var req = indexedDB.open(name, POUCH_VERSION);
  var meta = {
    id: 'meta-store',
    updateSeq: 0,
  };

  var instanceId = null;

  // var storeAttachmentsInIDB = !(window.storageInfo && window.requestFileSystem);
  // We cant store attachments on the filesystem due to a limitation in the
  // indexeddb api, it will close a transaction when we yield to the event loop
  var storeAttachmentsInIDB = true;

  var api = {};
  var idb = null;

  if (Pouch.DEBUG)
    console.log(name + ': Open Database');

  // TODO: before we release, make sure we write upgrade needed
  // in a way that supports a future upgrade path
  req.onupgradeneeded = function(e) {
    var db = e.target.result;
    db.createObjectStore(DOC_STORE, {keyPath : 'id'})
      .createIndex('seq', 'seq', {unique: true});
    db.createObjectStore(BY_SEQ_STORE, {autoIncrement : true})
      .createIndex('_rev', '_rev', {unique: true});
    db.createObjectStore(ATTACH_STORE, {keyPath: 'digest'});
    db.createObjectStore(META_STORE, {keyPath: 'id', autoIncrement: false});
  };

  req.onsuccess = function(e) {

    idb = e.target.result;

    var txn = idb.transaction([META_STORE], IDBTransaction.READ_WRITE);

    idb.onversionchange = function() {
      idb.close();
    };

    // polyfill the new onupgradeneeded api for chrome. can get rid of when
    // saucelabs moves to chrome 23
    if (idb.setVersion && Number(idb.version) !== POUCH_VERSION) {
      var versionReq = idb.setVersion(POUCH_VERSION);
      versionReq.onsuccess = function(evt) {
        function setVersionComplete() {
          req.onsuccess(e);
        }
        evt.target.result.oncomplete = setVersionComplete;
        req.onupgradeneeded(e);
      };
      return;
    }

    var req = txn.objectStore(META_STORE).get('meta-store');

    req.onsuccess = function(e) {
      var reqDBId,
          result;

      if (e.target.result) {
        meta = e.target.result;
      }

      if (name + '_id' in meta) {
        instanceId = meta[name + '_id'];
      } else {
        instanceId = Math.uuid();

        meta[name + '_id'] = instanceId;
        reqDBId = txn.objectStore(META_STORE).put(meta);
      }
      call(callback, null, api);
    }
  };

  req.onerror = idbError(callback);

  api.type = function() {
    return 'idb';
  };

  // Each database needs a unique id so that we can store the sequence
  // checkpoint without having other databases confuse itself.
  api.id = function idb_id() {
    return instanceId;
  };

  api.bulkDocs = function idb_bulkDocs(req, opts, callback) {

    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (!opts) {
      opts = {};
    }

    if (!req.docs) {
      return call(callback, Pouch.Errors.MISSING_BULK_DOCS);
    }

    var newEdits = 'new_edits' in opts ? opts.new_edits : true;
    var userDocs = extend(true, [], req.docs);

    // Parse the docs, give them a sequence number for the result
    var docInfos = userDocs.map(function(doc, i) {
      var newDoc = parseDoc(doc, newEdits);
      newDoc._bulk_seq = i;
      if (doc._deleted) {
        if (!newDoc.metadata.deletions) {
          newDoc.metadata.deletions = {};
        }
        newDoc.metadata.deletions[doc._rev.split('-')[1]] = true;
      }
      return newDoc;
    });

    var results = [];
    var docs = [];

    // Group multiple edits to the same document
    docInfos.forEach(function(docInfo) {
      if (docInfo.error) {
        return results.push(docInfo);
      }
      if (!docs.length || docInfo.metadata.id !== docs[0].metadata.id) {
        return docs.unshift(docInfo);
      }
      // We mark subsequent bulk docs with a duplicate id as conflicts
      results.push(makeErr(Pouch.Errors.REV_CONFLICT, docInfo._bulk_seq));
    });

    function processDocs() {
      if (!docs.length) {
        return;
      }
      var currentDoc = docs.shift();
      var req = txn.objectStore(DOC_STORE).get(currentDoc.metadata.id);
      req.onsuccess = function process_docRead(event) {
        var oldDoc = event.target.result;
        if (!oldDoc) {
          insertDoc(currentDoc);
        } else {
          updateDoc(oldDoc, currentDoc);
        }
      };
    }

    function complete(event) {
      var aresults = [];
      results.sort(sortByBulkSeq);
      results.forEach(function(result) {
        delete result._bulk_seq;
        if (result.error) {
          aresults.push(result);
          return;
        }
        var metadata = result.metadata;
        var rev = Pouch.merge.winningRev(metadata);

        aresults.push({
          ok: true,
          id: metadata.id,
          rev: rev
        });

        if (/_local/.test(metadata.id)) {
          return;
        }

        IdbPouch.Changes.notify(name);
        localStorage[name] = (localStorage[name] === "a") ? "b" : "a";
      });
      call(callback, null, aresults);
    }

    function writeDoc(docInfo, callback) {
      var err = null;
      var recv = 0;

      docInfo.data._id = docInfo.metadata.id;
      docInfo.data._rev = docInfo.metadata.rev;

      meta.updateSeq++;
      var req = txn.objectStore(META_STORE).put(meta);

      if (isDeleted(docInfo.metadata, docInfo.metadata.rev)) {
        docInfo.data._deleted = true;
      }

      var attachments = docInfo.data._attachments ?
        Object.keys(docInfo.data._attachments) : [];

      for (var key in docInfo.data._attachments) {
        if (!docInfo.data._attachments[key].stub) {
          var data = docInfo.data._attachments[key].data;
          var digest = 'md5-' + Crypto.MD5(data);
          delete docInfo.data._attachments[key].data;
          docInfo.data._attachments[key].digest = digest;
          saveAttachment(docInfo, digest, data, function(err) {
            recv++;
            collectResults(err);
          });
        } else {
          recv++;
          collectResults();
        }
      }

      if (!attachments.length) {
        finish();
      }

      function collectResults(attachmentErr) {
        if (!err) {
          if (attachmentErr) {
            err = attachmentErr;
            call(callback, err);
          } else if (recv == attachments.length) {
            finish();
          }
        }
      }

      function finish() {
        var dataReq = txn.objectStore(BY_SEQ_STORE).put(docInfo.data);
        dataReq.onsuccess = function(e) {
          if (Pouch.DEBUG)
            console.log(name + ': Wrote Document ', docInfo.metadata.id);
          docInfo.metadata.seq = e.target.result;
          // Current _rev is calculated from _rev_tree on read
          delete docInfo.metadata.rev;
          var metaDataReq = txn.objectStore(DOC_STORE).put(docInfo.metadata);
          metaDataReq.onsuccess = function() {
            results.push(docInfo);
            call(callback);
          };
        };
      }
    }

    function updateDoc(oldDoc, docInfo) {
      var merged = Pouch.merge(oldDoc.rev_tree, docInfo.metadata.rev_tree[0], 1000);

      var inConflict = (isDeleted(oldDoc) && isDeleted(docInfo.metadata)) ||
        (!isDeleted(oldDoc) && newEdits && merged.conflicts !== 'new_leaf');

      if (inConflict) {
        results.push(makeErr(Pouch.Errors.REV_CONFLICT, docInfo._bulk_seq));
        return processDocs();
      }

      docInfo.metadata.rev_tree = merged.tree;
      writeDoc(docInfo, processDocs);
    }

    function insertDoc(docInfo) {
      // Cant insert new deleted documents
      if ('was_delete' in opts && isDeleted(docInfo.metadata)) {
        results.push(Pouch.Errors.MISSING_DOC);
        return processDocs();
      }
      writeDoc(docInfo, processDocs);
    }

    // Insert sequence number into the error so we can sort later
    function makeErr(err, seq) {
      err._bulk_seq = seq;
      return err;
    }

    function saveAttachment(docInfo, digest, data, callback) {
      if (storeAttachmentsInIDB) {
        var objectStore = txn.objectStore(ATTACH_STORE);
        var getReq = objectStore.get(digest).onsuccess = function(e) {
          var ref = [docInfo.metadata.id, docInfo.metadata.rev].join('@');
          var newAtt = {digest: digest, body: data};

          if (e.target.result) {
            if (e.target.result.refs) {
              // only update references if this attachment already has them
              // since we cannot migrate old style attachments here without
              // doing a full db scan for references
              newAtt.refs = e.target.result.refs;
              newAtt.refs[ref] = true;
            }
          } else {
            newAtt.refs = {};
            newAtt.refs[ref] = true;
          }

          var putReq = objectStore.put(newAtt).onsuccess = function(e) {
            call(callback);
          };
          putReq.onerror = putReq.ontimeout = idbError(callback);
        };
        getReq.onerror = getReq.ontimeout = idbError(callback);
      } else {
        // right now fire and forget, needs cleaned
        writeAttachmentToFile(digest,data);
        call(callback);
      }
    }

    var txn = idb.transaction([DOC_STORE, BY_SEQ_STORE, ATTACH_STORE, META_STORE], IDBTransaction.READ_WRITE);
    txn.onerror = idbError(callback);
    txn.ontimeout = idbError(callback);
    txn.oncomplete = complete;

    processDocs();

  };

  function sortByBulkSeq(a, b) {
    return a._bulk_seq - b._bulk_seq;
  }

  // First we look up the metadata in the ids database, then we fetch the
  // current revision(s) from the by sequence store
  api.get = function idb_get(id, opts, callback) {

    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    id = parseDocId(id);
    if (id.attachmentId !== '') {
      return api.getAttachment(id, {decode: true}, callback);
    }

    var result;
    var txn = idb.transaction([DOC_STORE, BY_SEQ_STORE, ATTACH_STORE], 'readonly');
    txn.oncomplete = function() {
      if ('error' in result) {
        call(callback, result);
      } else {
        call(callback, null, result);
      }
    };

    txn.objectStore(DOC_STORE).get(id.docId).onsuccess = function(e) {
      var metadata = e.target.result;
      if (!e.target.result || (isDeleted(metadata, opts.rev) && !opts.rev)) {
        result = Pouch.Errors.MISSING_DOC;
        return;
      }

      var rev = Pouch.merge.winningRev(metadata);
      var key = opts.rev ? opts.rev : rev;
      var index = txn.objectStore(BY_SEQ_STORE).index('_rev');

      index.get(key).onsuccess = function(e) {
        var doc = e.target.result;
        if (opts.revs) {
          var path = arrayFirst(rootToLeaf(metadata.rev_tree), function(arr) {
            return arr.ids.indexOf(doc._rev.split('-')[1]) !== -1;
          });
          path.ids.reverse();
          doc._revisions = {
            start: (path.pos + path.ids.length) - 1,
            ids: path.ids
          };
        }
        if (opts.revs_info) {
          doc._revs_info = metadata.rev_tree.reduce(function(prev, current) {
            return prev.concat(collectRevs(current));
          }, []);
        }
        if (opts.conflicts) {
          var conflicts = collectConflicts(metadata.rev_tree);
          if (conflicts.length) {
            doc._conflicts = conflicts;
          }
        }

        if (opts.attachments && doc._attachments) {
          var attachments = Object.keys(doc._attachments);
          var recv = 0;

          attachments.forEach(function(key) {
            api.getAttachment(doc._id + '/' + key, {txn: txn}, function(err, data) {
              doc._attachments[key].data = data;

              if (++recv === attachments.length) {
                result = doc;
              }
            });
          });
        } else {
          if (doc._attachments){
            for (var key in doc._attachments) {
              doc._attachments[key].stub = true;
            }
          }
          result = doc;
        }
      };
    };
  };

  api.getAttachment = function(id, opts, callback) {
    if (opts instanceof Function) {
      callback = opts;
      opts = {};
    }
    if (typeof id === 'string') {
      id = parseDocId(id);
    }

    var result;
    var txn;

    // This can be called while we are in a current transaction, pass the context
    // along and dont wait for the transaction to complete here.
    if ('txn' in opts) {
      txn = opts.txn;
    } else {
      txn = idb.transaction([DOC_STORE, BY_SEQ_STORE, ATTACH_STORE], 'readonly');
      txn.oncomplete = function() { call(callback, null, result); }
    }

    txn.objectStore(DOC_STORE).get(id.docId).onsuccess = function(e) {
      var metadata = e.target.result;
      var bySeq = txn.objectStore(BY_SEQ_STORE);
      bySeq.get(metadata.seq).onsuccess = function(e) {
        var attachment = e.target.result._attachments[id.attachmentId];
        var digest = attachment.digest;
        var type = attachment.content_type

        function postProcessDoc(data) {
          if (opts.decode) {
            data = atob(data);
          }
          return data;
        }

        if (storeAttachmentsInIDB) {
          txn.objectStore(ATTACH_STORE).get(digest).onsuccess = function(e) {
            var data = e.target.result.body;
            result = postProcessDoc(data);
            if ('txn' in opts) {
              call(callback, null, result);
            }
          }
        } else {
          // This will be buggy, it will cause the transaction to be closed
          // as we will be returning to the event loop waiting on the file to
          // read, switch back to idb asap
          readAttachmentFromFile(digest, function(data) {
            result = postProcessDoc(data);
            if ('txn' in opts) {
              call(callback, null, result);
            }
          });
        }
      };
    }
    return;
  }

  api.put = function(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    if (!doc || !('_id' in doc)) {
      return call(callback, Pouch.Errors.MISSING_ID);
    }
    return api.bulkDocs({docs: [doc]}, opts, yankError(callback));
  }

  api.post = function idb_put(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return api.bulkDocs({docs: [doc]}, opts, yankError(callback));
  };

  api.putAttachment = function idb_putAttachment(id, rev, doc, type, callback) {
    id = parseDocId(id);
    api.get(id.docId, {attachments: true}, function(err, obj) {
      obj._attachments || (obj._attachments = {});
      obj._attachments[id.attachmentId] = {
        content_type: type,
        data: btoa(doc)
      }
      api.put(obj, callback);
    });
  };

  api.remove = function idb_remove(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts.was_delete = true;
    var newDoc = extend(true, {}, doc);
    newDoc._deleted = true;
    return api.bulkDocs({docs: [newDoc]}, opts, yankError(callback));
  };

  api.removeAttachment = function idb_removeAttachment(id, rev, callback) {
    id = parseDocId(id);
    api.get(id.docId, function(err, obj) {
      if (err) {
        call(callback, err);
        return;
      }

      if (obj._rev != rev) {
        call(callback, Pouch.Errors.REV_CONFLICT);
        return;
      }

      obj._attachments || (obj._attachments = {});
      delete obj._attachments[id.attachmentId];
      api.put(obj, callback);
    });
  };

  api.allDocs = function idb_allDocs(opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    var start = 'startkey' in opts ? opts.startkey : false;
    var end = 'endkey' in opts ? opts.endkey : false;

    var descending = 'descending' in opts ? opts.descending : false;
    descending = descending ? 'prev' : null;

    var keyRange = start && end ? IDBKeyRange.bound(start, end, false, false)
      : start ? IDBKeyRange.lowerBound(start, true)
      : end ? IDBKeyRange.upperBound(end) : null;

    var result;
    var transaction = idb.transaction([DOC_STORE, BY_SEQ_STORE], 'readonly');
    transaction.oncomplete = function() { callback(null, result); };

    var oStore = transaction.objectStore(DOC_STORE);
    var oCursor = descending ? oStore.openCursor(keyRange, descending)
      : oStore.openCursor(keyRange);
    var results = [];
    oCursor.onsuccess = function(e) {
      if (!e.target.result) {
        result = {
          total_rows: results.length,
          rows: results
        };
        return;
      }
      var cursor = e.target.result;
      function allDocsInner(metadata, data) {
        if (/_local/.test(metadata.id)) {
          return cursor['continue']();
        }
        if (!isDeleted(metadata)) {
          var doc = {
            id: metadata.id,
            key: metadata.id,
            value: {
              rev: Pouch.merge.winningRev(metadata)
            }
          };
          if (opts.include_docs) {
            doc.doc = data;
            doc.doc._rev = Pouch.merge.winningRev(metadata);
            if (opts.conflicts) {
              doc.doc._conflicts = collectConflicts(metadata.rev_tree);
            }
          }
          results.push(doc);
        }
        cursor['continue']();
      }

      if (!opts.include_docs) {
        allDocsInner(cursor.value);
      } else {
        var index = transaction.objectStore(BY_SEQ_STORE);
        index.get(cursor.value.seq).onsuccess = function(event) {
          allDocsInner(cursor.value, event.target.result);
        };
      }
    }
  };

  // Looping through all the documents in the database is a terrible idea
  // easiest to implement though, should probably keep a counter
  api.info = function idb_info(callback) {
    var count = 0;
    var result;
    var txn = idb.transaction([DOC_STORE], 'readonly');

    txn.oncomplete = function() {
      callback(null, result);
    };

    txn.objectStore(DOC_STORE).openCursor().onsuccess = function(e) {
        var cursor = e.target.result;
        if (!cursor) {
          result = {
            db_name: name,
            doc_count: count,
            update_seq: meta.updateSeq
          };
          return;
        }
        if (cursor.value.deleted !== true) {
          count++;
        }
        cursor['continue']();
      };
  };

  api.revsDiff = function idb_revsDiff(req, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var ids = Object.keys(req);
    var count = 0;
    var missing = {};

    function readDoc(err, doc, id) {
      req[id].map(function(revId) {
        var matches = function(x) { return x.rev !== revId; };
        if (!doc || doc._revs_info.every(matches)) {
          if (!missing[id]) {
            missing[id] = {missing: []};
          }
          missing[id].missing.push(revId);
        }
      });

      if (++count === ids.length) {
        return call(callback, null, missing);
      }
    }

    ids.map(function(id) {
      api.get(id, {revs_info: true}, function(err, doc) {
        readDoc(err, doc, id);
      });
    });
  };

  api.changes = function idb_changes(opts) {

    if (!opts.since) {
      opts.since = 0;
    }

    if (Pouch.DEBUG)
      console.log(name + ': Start Changes Feed: continuous=' + opts.continuous);

    var descending = 'descending' in opts ? opts.descending : false;
    descending = descending ? 'prev' : null;

    var results = [], resultIndices = {}, dedupResults = [];
    var id = name + ':' + Math.uuid();
    var txn;

    if (opts.filter && typeof opts.filter === 'string') {
      var filterName = opts.filter.split('/');
      api.get('_design/' + filterName[0], function(err, ddoc) {
        var filter = eval('(function() { return ' +
                          ddoc.filters[filterName[1]] + ' })()');
        opts.filter = filter;
        fetchChanges();
      });
    } else {
      fetchChanges();
    }

    function fetchChanges() {
      txn = idb.transaction([DOC_STORE, BY_SEQ_STORE]);
      txn.oncomplete = onTxnComplete;
      var req = descending
        ? txn.objectStore(BY_SEQ_STORE)
          .openCursor(IDBKeyRange.lowerBound(opts.since, true), descending)
        : txn.objectStore(BY_SEQ_STORE)
          .openCursor(IDBKeyRange.lowerBound(opts.since, true));
      req.onsuccess = onsuccess;
      req.onerror = onerror;
    }

    function onsuccess(event) {
      if (!event.target.result) {
        if (opts.continuous && !opts.cancelled) {
          IdbPouch.Changes.addListener(name, id, api, opts);
        }

        // Filter out null results casued by deduping
        for (var i = 0, l = results.length; i < l; i++ ) {
          var result = results[i];
          if (result) dedupResults.push(result);
        }
        return false;
      }

      var cursor = event.target.result;

      // Try to pre-emptively dedup to save us a bunch of idb calls
      var changeId = cursor.value._id, changeIdIndex = resultIndices[changeId];
      if (changeIdIndex !== undefined) {
        results[changeIdIndex].seq = cursor.key; // update so it has the later sequence number
        results.push(results[changeIdIndex]);
        results[changeIdIndex] = null;
        resultIndices[changeId] = results.length - 1;
        return cursor['continue']();
      }

      var index = txn.objectStore(DOC_STORE);
      index.get(cursor.value._id).onsuccess = function(event) {
        var metadata = event.target.result;
        if (/_local/.test(metadata.id)) {
          return cursor['continue']();
        }

        var mainRev = Pouch.merge.winningRev(metadata);
        var index = txn.objectStore(BY_SEQ_STORE).index('_rev');
        index.get(mainRev).onsuccess = function(docevent) {
          var doc = docevent.target.result;
          var changeList = [{rev: mainRev}]
          if (opts.style === 'all_docs') {
          //  console.log('all docs', changeList, collectLeaves(metadata.rev_tree));
            changeList = collectLeaves(metadata.rev_tree);
          }
          var change = {
            id: metadata.id,
            seq: cursor.key,
            changes: changeList,
            doc: doc,
          };
          if (isDeleted(metadata, mainRev)) {
            change.deleted = true;
          }
          if (opts.conflicts) {
            change.doc._conflicts = collectConflicts(metadata.rev_tree);
          }

          // Dedupe the changes feed
          var changeId = change.id, changeIdIndex = resultIndices[changeId];
          if (changeIdIndex !== undefined) {
            results[changeIdIndex] = null;
          }
          results.push(change);
          resultIndices[changeId] = results.length - 1;
          cursor['continue']();
        }
      };
    };

    function onTxnComplete() {
      dedupResults.map(function(c) {
        if (opts.filter && !opts.filter.apply(this, [c.doc])) {
          return;
        }
        if (!opts.include_docs) {
          delete c.doc;
        }
        if (c.seq > opts.since) {
          opts.since = c.seq;
          call(opts.onChange, c);
        }
      });
      if (!opts.continuous || (opts.continuous && !opts.cancelled)) {
        call(opts.complete, null, {results: dedupResults});
      }
    };

    function onerror(error) {
      if (opts.continuous && !opts.cancelled) {
        IdbPouch.Changes.addListener(name, id, opts);
      }
      else {
        call(opts.complete);
      }
    };

    if (opts.continuous) {
      return {
        cancel: function() {
          if (Pouch.DEBUG)
            console.log(name + ': Cancel Changes Feed');
          opts.cancelled = true;
          IdbPouch.Changes.removeListener(name, id);
        }
      }
    }
  };

  api.replicate = {};

  api.replicate.from = function idb_replicate_from(url, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(url, api, opts, callback);
  };

  api.replicate.to = function idb_replicate_to(dbName, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(api, dbName, opts, callback);
  };

  // Functions for reading and writing an attachment in the html5 file system
  // instead of idb
  function toArray(list) {
    return Array.prototype.slice.call(list || [], 0);
  }
  function fileErrorHandler(e) {
    console.error('File system error',e);
  }

  //Delete attachments that are no longer referenced by any existing documents
  function deleteOrphanedFiles(currentQuota){
    api.allDocs({include_docs:true},function(err, response) {
      window.requestFileSystem(window.PERSISTENT, currentQuota, function(fs){
      var dirReader = fs.root.createReader();
      var entries = [];
      var docRows = response.rows;

      // Call the reader.readEntries() until no more results are returned.
      var readEntries = function() {
        dirReader.readEntries (function(results) {
          if (!results.length) {
            for (var i in entries){
              var entryIsReferenced = false;
              for (var k in docRows){
                if (docRows[k].doc){
                  var aDoc = docRows[k].doc;
                  if (aDoc._attachments) {
                    for (var j in aDoc._attachments) {
                      if (aDoc._attachments[j].digest==entries[i].name) {
                        entryIsReferenced = true;
                      }
                    };
                  }
                  if (entryIsReferenced) break;
                }
              };
              if (!entryIsReferenced){
                entries[i].remove(function() {
                  if (Pouch.DEBUG)
                    console.log("Removed orphaned attachment: "+entries[i].name);
                }, fileErrorHandler);
              }
            };
          } else {
            entries = entries.concat(toArray(results));
            readEntries();
          }
        }, fileErrorHandler);
      };

      readEntries(); // Start reading dirs.

      }, fileErrorHandler);
    });
  }

  function writeAttachmentToFile(digest, data, type){
    //Check the current file quota and increase it if necessary
    window.storageInfo.queryUsageAndQuota(window.PERSISTENT, function(currentUsage, currentQuota) {
      var newQuota = currentQuota;
      if (currentQuota == 0){
        newQuota = 1000*1024*1024; //start with 1GB
      }else if ((currentUsage/currentQuota) > 0.8){
        deleteOrphanedFiles(currentQuota); //delete old attachments when we hit 80% usage
      }else if ((currentUsage/currentQuota) > 0.9){
        newQuota=2*currentQuota; //double the quota when we hit 90% usage
      }

      if (Pouch.DEBUG)
        console.log("Current file quota: "+currentQuota+", current usage:"+currentUsage+", new quota will be: "+newQuota);

      //Ask for file quota. This does nothing if the proper quota size has already been granted.
      window.storageInfo.requestQuota(window.PERSISTENT, newQuota, function(grantedBytes) {
        window.storageInfo.queryUsageAndQuota(window.PERSISTENT, function(currentUsage, currentQuota) {
          window.requestFileSystem(window.PERSISTENT, currentQuota, function(fs){
            fs.root.getFile(digest, {create: true}, function(fileEntry) {
              fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = function(e) {
                  if (Pouch.DEBUG)
                    console.log('Wrote attachment');
                };
                fileWriter.onerror = function(e) {
                  console.error('File write failed: ' + e.toString());
                };
                var blob = new Blob([data], {type: type});
                fileWriter.write(blob);
              }, fileErrorHandler);
            }, fileErrorHandler);
          }, fileErrorHandler);
        }, fileErrorHandler);
      }, fileErrorHandler);
    },fileErrorHandler);
  }

  function readAttachmentFromFile(digest, callback){
    window.storageInfo.queryUsageAndQuota(window.PERSISTENT, function(currentUsage, currentQuota) {
      window.requestFileSystem(window.PERSISTENT, currentQuota, function(fs){
        fs.root.getFile(digest, {}, function(fileEntry) {
          fileEntry.file(function(file) {
            var reader = new FileReader();
            reader.onloadend = function(e) {
              data = this.result;
              if (Pouch.DEBUG)
                console.log("Read attachment");
              callback(data);
            };
            reader.readAsBinaryString(file);
          }, fileErrorHandler);
        }, fileErrorHandler);
      }, fileErrorHandler);
    }, fileErrorHandler);
  }

  api.close = function(callback) {
    if (idb === null) {
      return call(callback, Pouch.Errors.NOT_OPEN);
    }

    // https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#close
    // "Returns immediately and closes the connection in a separate thread..."
    idb.close();
    call(callback, null);
  };

  return api;
};

IdbPouch.valid = function idb_valid() {
  if (!document.location.host) {
    console.error('indexedDB cannot be used in pages served from the filesystem');
  }
  return !!window.indexedDB && !!document.location.host;
};

IdbPouch.destroy = function idb_destroy(name, callback) {
  if (Pouch.DEBUG)
    console.log(name + ': Delete Database');
  IdbPouch.Changes.clearListeners(name);
  var req = indexedDB.deleteDatabase(name);

  req.onsuccess = function() {
    call(callback, null);
  };

  req.onerror = idbError(callback);
};

IdbPouch.Changes = Changes();

Pouch.adapter('idb', IdbPouch);

"use strict";

function quote(str) {
  return "'" + str + "'";
}

var POUCH_VERSION = 1;
var POUCH_SIZE = 5 * 1024 * 1024;

// The object stores created for each database
// DOC_STORE stores the document meta data, its revision history and state
var DOC_STORE = quote('document-store');
// BY_SEQ_STORE stores a particular version of a document, keyed by its
// sequence id
var BY_SEQ_STORE = quote('by-sequence');
// Where we store attachments
var ATTACH_STORE = quote('attach-store');
var META_STORE = quote('metadata-store');

var unknownError = function(callback) {
  return function(event) {
    call(callback, {
      status: 500,
      error: event.type,
      reason: event.target
    });
  };
};

var webSqlPouch = function(opts, callback) {

  var api = {};
  var update_seq = 0;
  var name = opts.name;

  var db = openDatabase(name, POUCH_VERSION, name, POUCH_SIZE);
  if (!db) {
    return call(callback, Pouch.Errors.UNKNOWN_ERROR);
  }

  function dbCreated() {
    callback(null, api);
  }

  db.transaction(function (tx) {
    var meta = 'CREATE TABLE IF NOT EXISTS ' + META_STORE +
      ' (update_seq)';
    var attach = 'CREATE TABLE IF NOT EXISTS ' + ATTACH_STORE +
      ' (digest, json)';
    var doc = 'CREATE TABLE IF NOT EXISTS ' + DOC_STORE +
      ' (id unique, seq, json, winningseq)';
    var seq = 'CREATE TABLE IF NOT EXISTS ' + BY_SEQ_STORE +
      ' (seq INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, rev UNIQUE, json)';

    tx.executeSql(attach);
    tx.executeSql(doc);
    tx.executeSql(seq);
    tx.executeSql(meta);

    var sql = 'SELECT update_seq FROM ' + META_STORE;
    tx.executeSql(sql, [], function(tx, result) {
      if (!result.rows.length) {
        var initSeq = 'INSERT INTO ' + META_STORE + ' (update_seq) VALUES (?)';
        tx.executeSql(initSeq, [0]);
        return;
      }
      update_seq = result.rows.item(0).update_seq;
    });
  }, unknownError(callback), dbCreated);

  api.type = function() {
    return 'websql';
  };

  api.id = function() {
    var id = localJSON.get(name + '_id', null);
    if (id === null) {
      id = Math.uuid();
      localJSON.set(name + '_id', id);
    }
    return id;
  };

  api.info = function(callback) {
    db.transaction(function(tx) {
      var sql = 'SELECT COUNT(id) AS count FROM ' + DOC_STORE;
      tx.executeSql(sql, [], function(tx, result) {
        callback(null, {
          db_name: name,
          doc_count: result.rows.item(0).count,
          update_seq: update_seq
        });
      });
    });
  };

  api.bulkDocs = function idb_bulkDocs(req, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (!opts) {
      opts = {};
    }

    if (!req.docs) {
      return call(callback, Pouch.Errors.MISSING_BULK_DOCS);
    }

    var newEdits = 'new_edits' in opts ? opts.new_edits : true;
    var userDocs = extend(true, [], req.docs);

    // Parse the docs, give them a sequence number for the result
    var docInfos = userDocs.map(function(doc, i) {
      var newDoc = parseDoc(doc, newEdits);
      newDoc._bulk_seq = i;
      if (doc._deleted) {
        if (!newDoc.metadata.deletions) {
          newDoc.metadata.deletions = {};
        }
        newDoc.metadata.deletions[doc._rev.split('-')[1]] = true;
      }
      return newDoc;
    });

    var tx;
    var results = [];
    var docs = [];
    var fetchedDocs = {};

    // Group multiple edits to the same document
    docInfos.forEach(function(docInfo) {
      if (docInfo.error) {
        return results.push(docInfo);
      }
      if (!docs.length || docInfo.metadata.id !== docs[0].metadata.id) {
        return docs.unshift(docInfo);
      }
      // We mark subsequent bulk docs with a duplicate id as conflicts
      results.push(makeErr(Pouch.Errors.REV_CONFLICT, docInfo._bulk_seq));
    });

    function sortByBulkSeq(a, b) {
      return a._bulk_seq - b._bulk_seq;
    }

    function complete(event) {
      var aresults = [];
      results.sort(sortByBulkSeq);
      results.forEach(function(result) {
        delete result._bulk_seq;
        if (result.error) {
          aresults.push(result);
          return;
        }
        var metadata = result.metadata;
        var rev = Pouch.merge.winningRev(metadata);

        aresults.push({
          ok: true,
          id: metadata.id,
          rev: rev
        });

        if (/_local/.test(metadata.id)) {
          return;
        }

        update_seq++;
        var sql = 'UPDATE ' + META_STORE + ' SET update_seq=?';
        tx.executeSql(sql, [update_seq], function() {
          webSqlPouch.Changes.notify(name);
          localStorage[name] = (localStorage[name] === "a") ? "b" : "a";
        });
      });
      call(callback, null, aresults);
    }

    function writeDoc(docInfo, callback, isUpdate) {
      var err = null;
      var recv = 0;

      docInfo.data._id = docInfo.metadata.id;
      docInfo.data._rev = docInfo.metadata.rev;

      if (isDeleted(docInfo.metadata, docInfo.metadata.rev)) {
        docInfo.data._deleted = true;
      }

      var attachments = docInfo.data._attachments ?
        Object.keys(docInfo.data._attachments) : [];

      for (var key in docInfo.data._attachments) {
        if (!docInfo.data._attachments[key].stub) {
          var data = docInfo.data._attachments[key].data;
          var digest = 'md5-' + Crypto.MD5(data);
          delete docInfo.data._attachments[key].data;
          docInfo.data._attachments[key].digest = digest;
          saveAttachment(docInfo, digest, data, function(err) {
            recv++;
            collectResults(err);
          });
        } else {
          recv++;
          collectResults();
        }
      }

      if (!attachments.length) {
        finish();
      }

      function collectResults(attachmentErr) {
        if (!err) {
          if (attachmentErr) {
            err = attachmentErr;
            call(callback, err);
          } else if (recv == attachments.length) {
            finish();
          }
        }
      }

      function dataWritten(tx, result) {
        var seq = docInfo.metadata.seq = result.insertId;
        delete docInfo.metadata.rev;

        var mainRev = Pouch.merge.winningRev(docInfo.metadata);

        var sql = isUpdate ?
          'UPDATE ' + DOC_STORE + ' SET seq=?, json=?, winningseq=(SELECT seq FROM ' + BY_SEQ_STORE + ' WHERE rev=?) WHERE id=?' :
          'INSERT INTO ' + DOC_STORE + ' (id, seq, winningseq, json) VALUES (?, ?, ?, ?);';
        var params = isUpdate ?
          [seq, JSON.stringify(docInfo.metadata), mainRev, docInfo.metadata.id] :
          [docInfo.metadata.id, seq, seq, JSON.stringify(docInfo.metadata)];
        tx.executeSql(sql, params, function(tx, result) {
          results.push(docInfo);
          call(callback, null);
        });
      }

      function finish() {
        var data = docInfo.data;
        var sql = 'INSERT INTO ' + BY_SEQ_STORE + ' (rev, json) VALUES (?, ?);';
        tx.executeSql(sql, [data._rev, JSON.stringify(data)], dataWritten);
      }
    }

    function updateDoc(oldDoc, docInfo) {
      var merged = Pouch.merge(oldDoc.rev_tree, docInfo.metadata.rev_tree[0], 1000);
      var inConflict = (isDeleted(oldDoc) && isDeleted(docInfo.metadata)) ||
        (!isDeleted(oldDoc) && newEdits && merged.conflicts !== 'new_leaf');

      if (inConflict) {
        results.push(makeErr(Pouch.Errors.REV_CONFLICT, docInfo._bulk_seq));
        return processDocs();
      }

      docInfo.metadata.rev_tree = merged.tree;
      writeDoc(docInfo, processDocs, true);
    }

    function insertDoc(docInfo) {
      // Cant insert new deleted documents
      if ('was_delete' in opts && isDeleted(docInfo.metadata)) {
        results.push(Pouch.Errors.MISSING_DOC);
        return processDocs();
      }
      writeDoc(docInfo, processDocs, false);
    }

    function processDocs() {
      if (!docs.length) {
        return complete();
      }
      var currentDoc = docs.shift();
      var id = currentDoc.metadata.id;
      if (id in fetchedDocs) {
        updateDoc(fetchedDocs[id], currentDoc);
      } else {
        insertDoc(currentDoc);
      }
    }

    // Insert sequence number into the error so we can sort later
    function makeErr(err, seq) {
      err._bulk_seq = seq;
      return err;
    }

    function saveAttachment(docInfo, digest, data, callback) {
      var ref = [docInfo.metadata.id, docInfo.metadata.rev].join('@');
      var newAtt = {digest: digest, body: data};
      var sql = 'SELECT * FROM ' + ATTACH_STORE + ' WHERE digest=?';
      tx.executeSql(sql, [digest], function(tx, result) {
        if (!result.rows.length) {
          newAtt.refs = {};
          newAtt.refs[ref] = true;
          sql = 'INSERT INTO ' + ATTACH_STORE + '(digest, json) VALUES (?, ?)';
          tx.executeSql(sql, [digest, JSON.stringify(newAtt)], function() {
            call(callback, null);
          });
        } else {
          newAtt.refs = JSON.parse(result.rows.item(0).json).refs;
          sql = 'UPDATE ' + ATTACH_STORE + ' SET json=? WHERE digest=?';
          tx.executeSql(sql, [JSON.stringify(newAtt), digest], function() {
            call(callback, null);
          });
        }
      });
    }

    function metadataFetched(tx, results) {
      for (var j=0; j<results.rows.length; j++) {
        var row = results.rows.item(j);
        fetchedDocs[row.id] = JSON.parse(row.json);
      }
      processDocs();
    }

    db.transaction(function(txn) {
      tx = txn;
      var ids = '(' + docs.map(function(d) {
        return quote(d.metadata.id);
      }).join(',') + ')';
      var sql = 'SELECT * FROM ' + DOC_STORE + ' WHERE id IN ' + ids;
      tx.executeSql(sql, [], metadataFetched);
    }, unknownError(callback));
  };

  api.put = function(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    if (!doc || !('_id' in doc)) {
      return call(callback, Pouch.Errors.MISSING_ID);
    }
    return api.bulkDocs({docs: [doc]}, opts, yankError(callback));
  };

  api.post = function idb_put(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return api.bulkDocs({docs: [doc]}, opts, yankError(callback));
  };

  api.revsDiff = function idb_revsDiff(req, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var ids = Object.keys(req);
    var count = 0;
    var missing = {};

    function readDoc(err, doc, id) {
      req[id].map(function(revId) {
        var matches = function(x) { return x.rev !== revId; };
        if (!doc || doc._revs_info.every(matches)) {
          if (!missing[id]) {
            missing[id] = {missing: []};
          }
          missing[id].missing.push(revId);
        }
      });

      if (++count === ids.length) {
        return call(callback, null, missing);
      }
    }

    ids.map(function(id) {
      api.get(id, {revs_info: true}, function(err, doc) {
        readDoc(err, doc, id);
      });
    });
  };

  api.remove = function idb_remove(doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts.was_delete = true;
    var newDoc = extend(true, {}, doc);
    newDoc._deleted = true;
    return api.bulkDocs({docs: [newDoc]}, opts, yankError(callback));
  };

  api.get = function(id, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    id = parseDocId(id);
    if (id.attachmentId !== '') {
      return api.getAttachment(id, {decode: true}, callback);
    }

    var result;
    db.transaction(function(tx) {
      var sql = 'SELECT * FROM ' + DOC_STORE + ' WHERE id=?';
      tx.executeSql(sql, [id.docId], function(tx, results) {
        if (!results.rows.length) {
          result = Pouch.Errors.MISSING_DOC;
          return;
        }
        var metadata = JSON.parse(results.rows.item(0).json);
        if (isDeleted(metadata, opts.rev) && !opts.rev) {
          result = Pouch.Errors.MISSING_DOC;
          return;
        }

        var rev = Pouch.merge.winningRev(metadata);
        var key = opts.rev ? opts.rev : rev;
        var sql = 'SELECT * FROM ' + BY_SEQ_STORE + ' WHERE rev=?';
        tx.executeSql(sql, [key], function(tx, results) {
          var doc = JSON.parse(results.rows.item(0).json);

          if (opts.revs) {
            var path = arrayFirst(rootToLeaf(metadata.rev_tree), function(arr) {
              return arr.ids.indexOf(doc._rev.split('-')[1]) !== -1;
            });
            path.ids.reverse();
            doc._revisions = {
              start: (path.pos + path.ids.length) - 1,
              ids: path.ids
            };
          }
          if (opts.revs_info) {
            doc._revs_info = metadata.rev_tree.reduce(function(prev, current) {
              return prev.concat(collectRevs(current));
            }, []);
          }
          if (opts.conflicts) {
            var conflicts = collectConflicts(metadata.rev_tree);
            if (conflicts.length) {
              doc._conflicts = conflicts;
            }
          }

          if (opts.attachments && doc._attachments) {
            var attachments = Object.keys(doc._attachments);
            var recv = 0;
            attachments.forEach(function(key) {
              api.getAttachment(doc._id + '/' + key, {txn: tx}, function(err, data) {
                doc._attachments[key].data = data;
                if (++recv === attachments.length) {
                  result = doc;
                }
              });
            });
          } else {
            if (doc._attachments){
              for (var key in doc._attachments) {
                doc._attachments[key].stub = true;
              }
            }
            result = doc;
          }
        });
      });
    }, unknownError(callback), function() {
      if ('error' in result) {
        call(callback, result);
      } else {
        call(callback, null, result);
      }
    });
  };

  api.allDocs = function(opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    var results = [];
    var start = 'startkey' in opts ? opts.startkey : false;
    var end = 'endkey' in opts ? opts.endkey : false;
    var descending = 'descending' in opts ? opts.descending : false;
    var sql = 'SELECT ' + DOC_STORE + '.id, ' + BY_SEQ_STORE + '.seq, ' +
      BY_SEQ_STORE + '.json AS data, ' + DOC_STORE + '.json AS metadata FROM ' +
      BY_SEQ_STORE + ' JOIN ' + DOC_STORE + ' ON ' + BY_SEQ_STORE + '.seq = ' +
      DOC_STORE + '.winningseq';

    if (start) {
      sql += ' WHERE ' + DOC_STORE + '.id >= "' + start + '"';
    }
    if (end) {
      sql += (start ? ' AND ' : ' WHERE ') + DOC_STORE + '.id <= "' + end + '"';
    }

    sql += ' ORDER BY ' + DOC_STORE + '.id ' + (descending ? 'DESC' : 'ASC');

    db.transaction(function(tx) {
      tx.executeSql(sql, [], function(tx, result) {
        for (var i = 0, l = result.rows.length; i < l; i++ ) {
          var doc = result.rows.item(i);
          var metadata = JSON.parse(doc.metadata);
          var data = JSON.parse(doc.data);
          if (!(/_local/.test(metadata.id) || isDeleted(metadata))) {
            var doc = {
              id: metadata.id,
              key: metadata.id,
              value: {rev: Pouch.merge.winningRev(metadata)}
            };
            if (opts.include_docs) {
              doc.doc = data;
              doc.doc._rev = Pouch.merge.winningRev(metadata);
              if (opts.conflicts) {
                doc.doc._conflicts = collectConflicts(metadata.rev_tree);
              }
            }
            results.push(doc);
          }
        }
      });
    }, unknownError(callback), function() {
      call(callback, null, {
        total_rows: results.length,
        rows: results
      });
    });
  }

  api.changes = function idb_changes(opts) {

    if (!opts.since) {
      opts.since = 0;
    }

    if (Pouch.DEBUG)
      console.log(name + ': Start Changes Feed: continuous=' + opts.continuous);

    var descending = 'descending' in opts ? opts.descending : false;
    descending = descending ? 'prev' : null;

    var results = [], resultIndices = {}, dedupResults = [];
    var id = name + ':' + Math.uuid();
    var txn;

    if (opts.filter && typeof opts.filter === 'string') {
      var filterName = opts.filter.split('/');
      api.get('_design/' + filterName[0], function(err, ddoc) {
        var filter = eval('(function() { return ' +
                          ddoc.filters[filterName[1]] + ' })()');
        opts.filter = filter;
        fetchChanges();
      });
    } else {
      fetchChanges();
    }

    function fetchChanges() {
      var sql = 'SELECT ' + DOC_STORE + '.id, ' + BY_SEQ_STORE + '.seq, ' +
        BY_SEQ_STORE + '.json AS data, ' + DOC_STORE + '.json AS metadata FROM ' +
        BY_SEQ_STORE + ' JOIN ' + DOC_STORE + ' ON ' + BY_SEQ_STORE + '.seq = ' +
        DOC_STORE + '.winningseq WHERE ' + DOC_STORE + '.seq > ' + opts.since +
        ' ORDER BY ' + DOC_STORE + '.seq ' + (descending ? 'DESC' : 'ASC');

      db.transaction(function(tx) {
        tx.executeSql(sql, [], function(tx, result) {
          for (var i = 0, l = result.rows.length; i < l; i++ ) {
            var doc = result.rows.item(i);
            var metadata = JSON.parse(doc.metadata);
            if (!/_local/.test(metadata.id)) {
              var change = {
                id: metadata.id,
                seq: doc.seq,
                changes: collectLeaves(metadata.rev_tree),
                doc: JSON.parse(doc.data),
              };
              change.doc._rev = Pouch.merge.winningRev(metadata);
              if (isDeleted(metadata, change.doc._rev)) {
                change.deleted = true;
              }
              if (opts.conflicts) {
                change.doc._conflicts = collectConflicts(metadata.rev_tree);
              }
              results.push(change);
            }
          }
          for (var i = 0, l = results.length; i < l; i++ ) {
            var result = results[i];
            if (result) dedupResults.push(result);
          }
          dedupResults.map(function(c) {
            if (opts.filter && !opts.filter.apply(this, [c.doc])) {
              return;
            }
            if (!opts.include_docs) {
              delete c.doc;
            }
            if (c.seq > opts.since) {
              opts.since = c.seq;
              call(opts.onChange, c);
            }
          });

          if (opts.continuous && !opts.cancelled) {
            webSqlPouch.Changes.addListener(name, id, api, opts);
          }
          else {
              call(opts.complete, null, {results: dedupResults});
          }
        });
      });
    }

    if (opts.continuous) {
      return {
        cancel: function() {
          if (Pouch.DEBUG)
            console.log(name + ': Cancel Changes Feed');
          opts.cancelled = true;
          webSqlPouch.Changes.removeListener(name, id);
        }
      }
    }
  };

  api.getAttachment = function(id, opts, callback) {
    if (opts instanceof Function) {
      callback = opts;
      opts = {};
    }
    if (typeof id === 'string') {
      id = parseDocId(id);
    }

    var res;
    // This can be called while we are in a current transaction, pass the context
    // along and dont wait for the transaction to complete here.
    if ('txn' in opts) {
      fetchAttachment(opts.txn);
    } else {
      db.transaction(fetchAttachment, unknownError(callback), function() {
        call(callback, null, res);
      });
    }

    function postProcessDoc(data) {
      if (opts.decode) {
        return atob(data);
      }
      return data;
    }

    function fetchAttachment(tx) {
      var sql = 'SELECT ' + BY_SEQ_STORE + '.json AS data FROM ' + DOC_STORE +
        ' JOIN ' + BY_SEQ_STORE + ' ON ' + BY_SEQ_STORE + '.seq = ' + DOC_STORE +
        '.seq WHERE ' + DOC_STORE + '.id = "' + id.docId + '"' ;
      tx.executeSql(sql, [], function(tx, result) {
        var doc = JSON.parse(result.rows.item(0).data);
        var attachment = doc._attachments[id.attachmentId];
        var digest = attachment.digest;
        var type = attachment.content_type;
        var sql = 'SELECT * FROM ' + ATTACH_STORE + ' WHERE digest=?';
        tx.executeSql(sql, [digest], function(tx, result) {
          var data = JSON.parse(result.rows.item(0).json).body;
          res = postProcessDoc(data);
          if ('txn' in opts) {
            call(callback, null, res);
          }
        });
      });
    }
  }

  // Everything below this are not dependant on the storage implementation
  // and can be shared between the adapters instead of reimplemented in each
  api.putAttachment = function idb_putAttachment(id, rev, doc, type, callback) {
    id = parseDocId(id);
    api.get(id.docId, {attachments: true}, function(err, obj) {
      obj._attachments || (obj._attachments = {});
      obj._attachments[id.attachmentId] = {
        content_type: type,
        data: btoa(doc)
      }
      api.put(obj, callback);
    });
  };

  api.removeAttachment = function idb_removeAttachment(id, rev, callback) {
    id = parseDocId(id);
    api.get(id.docId, function(err, obj) {
      if (err) {
        call(callback, err);
        return;
      }

      if (obj._rev != rev) {
        call(callback, Pouch.Errors.REV_CONFLICT);
        return;
      }

      obj._attachments || (obj._attachments = {});
      delete obj._attachments[id.attachmentId];
      api.put(obj, callback);
    });
  };

  api.replicate = {};

  api.replicate.from = function idb_replicate_from(url, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(url, api, opts, callback);
  };

  api.replicate.to = function idb_replicate_to(dbName, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return Pouch.replicate(api, dbName, opts, callback);
  };
}

webSqlPouch.valid = function() {
  return !!window.openDatabase;
};

webSqlPouch.destroy = function(name, callback) {
  var db = openDatabase(name, POUCH_VERSION, name, POUCH_SIZE);
  localJSON.set(name + '_id', null);
  db.transaction(function (tx) {
    tx.executeSql('DROP TABLE IF EXISTS ' + DOC_STORE, []);
    tx.executeSql('DROP TABLE IF EXISTS ' + BY_SEQ_STORE, []);
    tx.executeSql('DROP TABLE IF EXISTS ' + ATTACH_STORE, []);
    tx.executeSql('DROP TABLE IF EXISTS ' + META_STORE, []);
  }, unknownError(callback), function() {
    call(callback, null);
  });
};

webSqlPouch.Changes = Changes();

Pouch.adapter('websql', webSqlPouch);

/*global Pouch: true */

"use strict";

// This is the first implementation of a basic plugin, we register the
// plugin object with pouch and it is mixin'd to each database created
// (regardless of adapter), adapters can override plugins by providing
// their own implementation. functions on the plugin object that start
// with _ are reserved function that are called by pouchdb for special
// notifications.

// If we wanted to store incremental views we can do it here by listening
// to the changes feed (keeping track of our last update_seq between page loads)
// and storing the result of the map function (possibly using the upcoming
// extracted adapter functions)

var MapReduce = function(db) {

  function viewQuery(fun, options) {
    if (!options.complete) {
      return;
    }

    function sum(values) {
      return values.reduce(function(a, b) { return a + b; }, 0);
    }

    var results = [];
    var current = null;
    var num_started= 0;
    var completed= false;

    var emit = function(key, val) {
      var viewRow = {
        id: current.doc._id,
        key: key,
        value: val
      };

      if (options.startkey && Pouch.collate(key, options.startkey) < 0) return;
      if (options.endkey && Pouch.collate(key, options.endkey) > 0) return;
      if (options.key && Pouch.collate(key, options.key) !== 0) return;
      num_started++;
      if (options.include_docs) {
        //in this special case, join on _id (issue #106)
        if (val && typeof val === 'object' && val._id){
          db.get(val._id,
              function(_, joined_doc){
                if (joined_doc) {
                  viewRow.doc = joined_doc;
                }
                results.push(viewRow);
                checkComplete();
              });
          return;
        } else {
          viewRow.doc = current.doc;
        }
      }
      results.push(viewRow);
    };

    // ugly way to make sure references to 'emit' in map/reduce bind to the
    // above emit
    eval('fun.map = ' + fun.map.toString() + ';');
    if (fun.reduce) {
      eval('fun.reduce = ' + fun.reduce.toString() + ';');
    }

    // exclude  _conflicts key by default
    // or to use options.conflicts if it's set when called by db.query
    var conflicts = ('conflicts' in options ? options.conflicts : false);

    //only proceed once all documents are mapped and joined
    var checkComplete= function(){
      if (completed && results.length == num_started){
        results.sort(function(a, b) {
          return Pouch.collate(a.key, b.key);
        });
        if (options.descending) {
          results.reverse();
        }
        if (options.reduce === false) {
          return options.complete(null, {rows: results});
        }

        var groups = [];
        results.forEach(function(e) {
          var last = groups[groups.length-1] || null;
          if (last && Pouch.collate(last.key[0][0], e.key) === 0) {
            last.key.push([e.key, e.id]);
            last.value.push(e.value);
            return;
          }
          groups.push({key: [[e.key, e.id]], value: [e.value]});
        });
        groups.forEach(function(e) {
          e.value = fun.reduce(e.key, e.value) || null;
          e.key = e.key[0][0];
        });
        options.complete(null, {rows: groups});
      }
    }

    db.changes({
      conflicts: conflicts,
      include_docs: true,
      onChange: function(doc) {
        if (!('deleted' in doc)) {
          current = {doc: doc.doc};
          fun.map.call(this, doc.doc);
        }
      },
      complete: function() {
        completed= true;
        checkComplete();
      }
    });
  }

  function httpQuery(fun, opts, callback) {

    // List of parameters to add to the PUT request
    var params = [];
    var body = undefined;
    var method = 'GET';

    // If opts.reduce exists and is defined, then add it to the list
    // of parameters.
    // If reduce=false then the results are that of only the map function
    // not the final result of map and reduce.
    if (typeof opts.reduce !== 'undefined') {
      params.push('reduce=' + opts.reduce);
    }
    if (typeof opts.include_docs !== 'undefined') {
      params.push('include_docs=' + opts.include_docs);
    }
    if (typeof opts.limit !== 'undefined') {
      params.push('limit=' + opts.limit);
    }
    if (typeof opts.descending !== 'undefined') {
      params.push('descending=' + opts.descending);
    }
    if (typeof opts.startkey !== 'undefined') {
      params.push('startkey=' + encodeURIComponent(JSON.stringify(opts.startkey)));
    }
    if (typeof opts.endkey !== 'undefined') {
      params.push('endkey=' + encodeURIComponent(JSON.stringify(opts.endkey)));
    }
    if (typeof opts.key !== 'undefined') {
      params.push('key=' + encodeURIComponent(JSON.stringify(opts.key)));
    }

    // If keys are supplied, issue a POST request to circumvent GET query string limits
    // see http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
    if (typeof opts.keys !== 'undefined') {
      method = 'POST';
      body = JSON.stringify({keys:opts.keys});
    }

    // Format the list of parameters into a valid URI query string
    params = params.join('&');
    params = params === '' ? '' : '?' + params;

    // We are referencing a query defined in the design doc
    if (typeof fun === 'string') {
      var parts = fun.split('/');
      db.request({
        method: method,
        url: '_design/' + parts[0] + '/_view/' + parts[1] + params,
        body: body
      }, callback);
      return;
    }

    // We are using a temporary view, terrible for performance but good for testing
    var queryObject = JSON.parse(JSON.stringify(fun, function(key, val) {
      if (typeof val === 'function') {
        return val + ''; // implicitly `toString` it
      }
      return val;
    }));

    db.request({
      method:'POST',
      url: '_temp_view' + params,
      body: queryObject
    }, callback);
  }

  function query(fun, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    if (callback) {
      opts.complete = callback;
    }

    if (db.type() === 'http') {
      return httpQuery(fun, opts, callback);
    }

    if (typeof fun === 'object') {
      return viewQuery(fun, opts);
    }

    var parts = fun.split('/');
    db.get('_design/' + parts[0], function(err, doc) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      viewQuery({
        map: doc.views[parts[1]].map,
        reduce: doc.views[parts[1]].reduce
      }, opts);
    });
  }

  return {'query': query};
};

// Deletion is a noop since we dont store the results of the view
MapReduce._delete = function() { };

Pouch.plugin('mapreduce', MapReduce);


 })(this);

/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-applicationcache-indexeddb-localstorage-websqldatabase-testprop-testallprops-domprefixes
 */
;



window.Modernizr = (function( window, document, undefined ) {

    var version = '2.6.2',

    Modernizr = {},


    docElement = document.documentElement,

    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    inputElem  ,


    toString = {}.toString,    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),


    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName,



    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) {
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }


    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    function setCss( str ) {
        mStyle.cssText = str;
    }

    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    function is( obj, type ) {
        return typeof obj === type;
    }

    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }

    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                            if (elem === false) return props[i];

                            if (is(item, 'function')){
                                return item.bind(elem || obj);
                }

                            return item;
            }
        }
        return false;
    }

    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

            if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

            } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }

    tests['websqldatabase'] = function() {
      return !!window.openDatabase;
    };

    tests['indexedDB'] = function() {
      return !!testPropsAll("indexedDB", window);
    };
    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };
    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
                                    featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }



     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
                                              return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr;
     };


    setCss('');
    modElem = inputElem = null;


    Modernizr._version      = version;

    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;



    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };

    Modernizr.testAllProps  = testPropsAll;


    return Modernizr;

})(this, this.document);
;
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.garden_views = factory();
    }
}(this, function () {


var views = {};

views.by_active_install =  {
     map: function (doc) {
        if (!doc.type || doc.type !== 'install' ) return;
        if (doc.removed) return;
        emit(doc.dashboard_title, null);
     }
};

views.dashboard_assets = {
    map : function(doc) {

        var order;

        if (doc._id == 'settings') {
            emit([0], doc);
        }
        if (!doc.type) return; // safety first
        if (doc.type === 'install' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order, doc.dashboard_title, 'install'], { db : doc.installed.db });

        }
        if (doc.type === 'link' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order, doc.dashboard_title, 'link'], { url : doc.url });

        }
        if (doc.type === 'theme' && doc.selectedTheme) {
            emit([2], null);
        }
        if (doc.type === 'script') {
            emit([3], doc._rev);
        }
    }
};

views.cache_manifest = {
    map : function(doc) {

        var order;

        if (doc._id == 'settings') {
            emit([0], doc);
        }
        if (!doc.type) return; // safety first
        if (doc.type === 'install' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order], doc._rev);

        }
        if (doc.type === 'link' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order], doc._rev);

        }
        if (doc.type === 'theme' && doc.selectedTheme) {
            emit([2], doc._rev);
        }
        if (doc.type === 'script') {
            emit([3], doc._rev);
        }
    }
};


views.app_version_by_market = {
    map : function(doc) {
        if (!doc.type || doc.type !== 'install' ) return;
        if (doc.removed) return;

        var end = 'details/' + doc.doc_id;
        var src = doc.src.substring(0, doc.src.indexOf(end));

        var meta = doc.couchapp || doc.kanso;
        emit(src, {
            dashboard_title: doc.dashboard_title,
            app: doc.doc_id,
            version: meta.config.version
        });

    }
};



views.get_markets =  {
     map: function (doc) {
        if (doc.type && doc.type === 'market' ) {
            emit(doc.name, doc.url);
        }
     }
};

views.get_roles = {
    map : function(doc) {
        if (doc.type && doc.type === 'role' ) {
            emit(doc.name, doc.url);
        }
    }
};

views.get_syncs = {
    map : function(doc) {
        if (doc.type && doc.type === 'sync') {
            emit(doc.name, null);
        }
    }
};

return views;


}));
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( require('async'), require('pouchdb'), require('garden-views'), require('url'), require('stately.js'));
    } else if (typeof define === 'function' && define.amd) {
        define(['async','pouchdb', 'garden-views', 'url'],factory);
    } else {
        root.garden_dashboard_core = factory(root.async, root.Pouch, root.garden_views, root.url, root.Stately);
    }
}(this, function (async, Pouch, garden_views, url, Stately) {

var app = function(dashboard_db_url, options) {
    var core = this;
    core.dashboard_db_url = dashboard_db_url;
    core.options = options;
    core.pouchName = app.getPouchName(dashboard_db_url);
    core.cached_session = null;

    /*------   Private Methods ------------------*/
    // any methods that start with t_ transition the state machine


    var initState = function() {
        core.states = Stately({
            "INIT": {
                start : t_determine_state
            },
            "FIRST_VISIT" : {
                // couch available, pouch supported, never synced
                poll: t_poll_connectivity_no_pouch,
                sync: t_first_sync,
                topbar: topbar_remote,
                allAssets: allAssets_remote,
                settings: settings_remote
            },
            "OFFLINE_NO_HOPE" : {
                // no couch available, pouch supported, never synced
            },
            "READY_LOCAL_DB_UNSUPPORTED": {
                // couch available, pouch not supported
                poll: t_poll_connectivity_no_pouch,
                topbar: topbar_remote,
                allAssets: allAssets_remote,
                settings: settings_remote
            },
            "OFFLINE_WITH_USER" : {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                online: t_online,

                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            },
            "OFFLINE_WITHOUT_USER" : {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                online: t_online,
                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            },
            "ONLINE_WITH_USER" : {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                offline: t_offline,
                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            },
            "ONLINE_WITHOUT_USER": {
                poll : t_poll_connectivity,
                login: t_login,
                logout: t_logout,
                offline: t_offline,
                topbar: topbar_local,
                allAssets: allAssets_local,
                settings: settings_local
            }
        });
    };

    var t_determine_state = function() {
        var self = this;

        async.parallel({
            remote_dashboard : remote_dashboard,
            pouched_dashboard : function(cb) {

                if (core.options.disablePouch) {
                    return cb(null, {unsupported: true});
                }
                try {
                    pouched_dashboard(function(err, results){
                        if (err) return cb(null, {unsupported: true});
                        cb (null, results);
                    });
                } catch(e) {
                    cb(null, {unsupported: true});
                }
            },
            pouched_extra : function(cb) {

                if (core.options.disablePouch) {
                    return cb(null, {unsupported: true});
                }
                try {
                    pouched_extra(function(err, results){
                        if (err) return cb(null, {unsupported: true});
                        cb (null, results);
                    });
                } catch(e) {
                    cb(null, {unsupported: true});
                }
            }


        }, function(err, info){
            if (err || info.pouched_dashboard.unsupported) {
                return self.setMachineState(self.READY_LOCAL_DB_UNSUPPORTED);
            }
            if (info.remote_dashboard.available) {

                if (!info.pouched_dashboard.synced) {
                    return self.setMachineState(self.FIRST_VISIT);
                }
                else {

                    get_stored_session(function(err, session){
                        if (is_session_logged_in(session)) {
                            return self.setMachineState(self.ONLINE_WITH_USER);
                        }
                        return self.setMachineState(self.ONLINE_WITHOUT_USER);
                    });
                }
            }
            if (!info.remote_dashboard.available && info.pouched_dashboard.synced) {

                get_stored_session(function(err, session){

                    if (err || !session) self.setMachineState(self.OFFLINE_WITHOUT_USER);
                    if (is_session_logged_in(session))  return self.setMachineState(self.OFFLINE_WITH_USER);
                    return self.setMachineState(self.OFFLINE_WITHOUT_USER);
                });

            }
            if (!info.remote_dashboard.available && !info.pouched_dashboard.synced) {
                return self.states.setMachineState(self.OFFLINE_NO_HOPE);
            }
        });
    };



    var get_remote_session = function(callback) {
        core.remote_db.request({
            url: '../_session'
        }, callback);
    };

    var is_session_logged_in = function(session) {
        if (!session) return false;
        if (!session.userCtx) return false;
        if (!session.userCtx.name) return false;
        return true;
    };

    var store_session = function(session, callback) {
        if (!session) session = {userCtx: null};
        get_stored_session(function(err, stored_session){
            var update = true;
            if (err || !stored_session) stored_session = session;
            else {
                if (stored_session.userCtx.name === session.userCtx.name) {
                    update = false;
                }
                stored_session.userCtx = session.userCtx;
            }
            stored_session._id = 'session';
            if (update) {
                core.extra_db.put(stored_session, callback);
                core.cached_session = stored_session;
            }
            else callback(null, stored_session);
        });

    };

    var get_stored_session = function(callback) {
        core.extra_db.get('session', function(err, session){
            callback(err, session);
        });
    };


    var remote_dashboard = function(callback) {
        Pouch(core.dashboard_db_url, function(err, db){
            core.remote_db = db;
            // we swallow errors
            var results = {
                db: db,
                available: false,
                session: null
            };
            if (err) return callback(null, results);
            get_remote_session(function(err2, session){
                if (err2) return callback(null, results);
                core.cached_session = session;
                results.session = session;
                results.available = true;
                callback(null, results);
            });

        });

    };

    var pouched_dashboard = function(callback) {
        // return pouch, and if it has been synced with a dashbaord


        try {
            Pouch(core.pouchName, function(err, db){
                if (err) return callback(err);
                core.local_db = db;
                db.info(function(err, info) {
                    if (err) return callback(err);
                    var results = {
                        db : db,
                        synced : false
                    };
                    if (info.doc_count > 0) results.synced = true;
                    callback(null, results);
                });
            });
        } catch (e) {
            return callback(null, {unsupported: true});
        }
    };

    var pouched_extra = function(callback) {
        // return pouch, and if it has been synced with a dashbaord
        Pouch('dashbaord_extra', function(err, db){
            if (err) return callback(err);
            core.extra_db = db;
            callback(null, db);
        });
    };


    var t_poll_connectivity = function() {
        var self = this;

        get_remote_session(function(err, session){
            if (err) {
                // offline
                get_stored_session(function(err, session){
                    if (is_session_logged_in(session)) return self.setMachineState(self.OFFLINE_WITH_USER);
                    else return self.setMachineState(self.OFFLINE_WITHOUT_USER);
                });
            } else {
                // online
                store_session(session, function(err2) {
                    if (is_session_logged_in(session)) return self.setMachineState(self.ONLINE_WITH_USER);
                    else return self.setMachineState(self.ONLINE_WITHOUT_USER);
                });
            }
        });
    };

    var t_poll_connectivity_no_pouch = function() {
        var self = this;
        get_remote_session(function(err, session){
            if (err) return;
            core.cached_session = session;
            //trigger an update
            var state = self.getMachineState();
            self.setMachineState(self[state]);
        });
    };


    var t_first_sync = function() {
        var self = this;
        sync(function(err){
            if (err) return self.setMachineState(self.READY_LOCAL_DB_UNSUPPORTED);

            get_stored_session(function(err, session){
                if (err || !session) self.setMachineState(self.ONLINE_WITHOUT_USER);
                if (is_session_logged_in(session))  return self.setMachineState(self.ONLINE_WITH_USER);
                return self.setMachineState(self.ONLINE_WITHOUT_USER);
            });

        });
    };

    var sync = function(callback) {
        Pouch.replicate(core.remote_db, core.local_db, { filter: 'dashboard/docs_only' }, callback);
    };


    var t_login = function(user, password, callback) {
        // body...
    };

    var t_logout = function(callback) {

    };

    var t_online = function(callback) {

    };

    var t_offline = function(callback) {

    };

    var topbar_local = function(callback) {
        core.local_db.query(garden_views.dashboard_assets, {reduce: false, include_docs: true}, function(err, resp){
            topbar_process(err, resp, callback);
        });
    };

    var topbar_remote = function(callback) {
        core.remote_db.query('dashboard/dashboard_assets', {reduce: false, include_docs: true}, function(err, resp){
            topbar_process(err, resp, callback);
        });
    };

    var topbar_process = function(err, resp, callback) {
        var results = {
            settingsDoc : {},
            selectedThemeDoc : null,
            apps: [],
            scripts: []
        };
        if (err && err.status === 404 && err.reason === 'no_db_file') return topbar_empty(results, callback);
        if (err) return callback(err);
        async.forEach(resp.rows, function(row, cb){
            if (row.key[0] === 0) results.settingsDoc = row.value;
            if (row.key[0] === 1) {
                if (row.key[3] == 'install') {
                    results.apps.push({
                        title : row.key[2],
                        db :row.value.db,
                        doc : row.doc
                    });
                }
                if (row.key[3] == 'link') {
                    results.apps.push({
                        title : row.key[2],
                        link :row.value.url,
                        doc  : row.doc,
                        external : true
                    });
                }
            }
            if (row.key[0] === 2) results.selectedThemeDoc = row.doc;
            if (row.key[0] === 3) results.scripts.push(row.doc.src);
            cb();
        }, function(err){
            callback(err, results);
        });
    };

    var topbar_empty = function(results, callback) {
        results.no_db_file = true;
        callback(null, results);
    };

    var allAssets_local = function(callback) {
        core.local_db.allDocs(callback);
    };

    var allAssets_remote = function(callback) {
        core.remote_db.allDocs(callback);
    };

    var settings_local = function(callback) {
        core.local_db.get('settings', function(err, data){
            if (err && err.status === 404) return callback(null, {});
            callback(err, data);
        });
    };

    var settings_remote = function(callback) {
        core.remote_db.get('settings', function(err, data){
            if (err && err.status === 404) return callback(null, {});
            callback(err, data);
        });
    };

    initState();
};


/* --------- Public API  -------------------*/
// all proxy to the statemachine for the right action
// based on online/offline

app.prototype.start = function(callback) {
    var self = this;

    var onState = function(event, oldState, newState) {
        if (newState === 'INIT') return;
        self.states.unbind(onState);
        callback(null, newState);
    };
    self.states.bind(onState);
    self.states.start();
};

app.prototype.sync = function(callback) {
    this.states.sync(callback);
};

app.prototype.topbar = function(callback) {
    this.states.topbar(callback);
};

app.prototype.allAssets = function(callback) {
    this.states.allAssets(callback);
};

app.prototype.settings = function(callback) {
    this.states.settings(callback);
};

app.prototype.poll = function() {
    this.states.poll();
};

app.prototype.login = function(user, password, callback) {
    this.states.login(user, password, callback);
};

app.prototype.logout = function() {
    this.states.logout();
};

app.prototype.go_online = function() {
    this.states.online();
};

app.prototype.go_offline = function() {
    this.states.offline();
};

app.prototype.getState = function() {
    return this.states.getMachineState();
};

app.prototype.bind = function(func) {
    this.states.bind(func);
};

app.prototype.getCachedSession = function(callback) {
    var core = this;
    if (core.cached_session) {
        return callback(null, core.cached_session);
    }

    this.extra_db.get('session', function(err, session){
        if (err && err.status === 404) {
            // a special condition for the first time
            return callback(null, core.cached_session);
        }
        return callback(err, session);
    });
};

app.getPouchName = function(dashboard_db_url) {

  var parsed = url.parse(dashboard_db_url),
      namespace = parsed.hostname + parsed.port;

  if (parsed.pathname) {
     var clean = parsed.pathname.replace(/\//g, '_');
     namespace += clean;
  }
  return namespace;
};




return app;

}));
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.garden_default_settings = factory();
    }
}(this, function () {

return {
    frontpage : {
        use_markdown : true,
        use_html : false,
        show_activity_feed : false,
        markdown : "## Welcome to your Garden\n\nHere are some things you might want to do:\n\n- [Configure](./settings#/frontpage) this front page.\n- [Install](./install) some apps.\n- [Sync](./settings#/sync) with another garden.\n\n\n\n"
    },
    host_options : {
        short_urls : false,
        hostnames : 'http://localhost:5984,http://0.0.0.0:5985',
        short_app_urls : true,
        rootDashboard : false,
        hosted : false,
        login_type : 'local'

    },
    top_nav_bar : {
        disablePouch: true,
        showSession: true,
        divSelector: 'body',
        sticky: false,
        position: 'relative',
        defaultAppName: null,
        defaultTitle: 'CouchDB',

        bg_color : '#1D1D1D',
        link_color : '#BFBFBF',
        active_link_color : '#FFFFFF',
        active_link_bg_color : '#000000',
        active_bar_color : '#bd0000',
        show_brand : false,
        icon_name : null,
        brand_link : null,
        show_gravatar : true,
        show_username : true,
        notification_theme: 'libnotify',
        show_futon : true
    },
    sessions : {
        type : 'internal',
        internal : {
            login_type: 'local',
            redirect_frontpage_on_anon : false
        },
        other : {
            login_url : '/users/_design/users-default/_rewrite/#/login',
            login_url_next : '/users/_design/users-default/_rewrite/#/login/{next}',
            signup_url : '/users/_design/users-default/_rewrite/#/signup',
            profile_url : '/users/_design/users-default/_rewrite/#/profile/{username}'
        }
    }
};



}));
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( require('underscore'), require('garden-dashboard-core'), require('garden-default-settings'), require('url'));
    } else if (typeof define === 'function' && define.amd) {
        define(['underscore','garden-dashboard-core', 'garden-default-settings', 'url'],factory);
    } else {
        root.garden_menu = factory(root._, root.garden_dashboard_core, root.garden_default_settings, root.url);
    }
}(this, function (_, DashboardCore, default_settings, url) {

var app = function(dashboard_db_url, options) {
    this.dashboard_db_url = dashboard_db_url;
    this.options = options;
    this.dashboard_core = new DashboardCore(dashboard_db_url, options);

    // in case things are called out of order, fallback to default settings.
    this.settings = default_settings;

};

app.prototype.init = function(callback) {
    var menu = this;

    // some inital values
    var results = {
        core : menu.dashboard_core,
        state: 'OFFLINE_NO_HOPE',
        settings: null
    };

    menu.dashboard_core.start(function(err, state) {
        if (state === 'OFFLINE_NO_HOPE') return callback('OFFLINE_NO_HOPE', results);
        results.state = state;
        callback(null, results);
    });
};

app.prototype.getAppLinks = function(options, callback) {
    var menu = this;

    if (!callback) {
        callback = options;
        options = {};
    }

    menu.dashboard_core.topbar(function(err, results) {
        if (err) return callback(err);

        menu.settings = {};
        _.extend(menu.settings, results.settingsDoc, default_settings);


        results.dashboard_url = menu.dashboard_ui_url(menu.settings, results.no_db_file),
        results.home_url = menu.home_url(results.dashboard_url, results.no_db_file);
        results.settings_url  = menu.settings_url(results.dashboard_url, results.no_db_file);
        results.login_url = menu.login_url(results.dashboard_url, results.no_db_file);


        if (menu.settings.frontpage.use_link) {
            results.home_url = menu.settings.frontpage.link_url;
        }

        results.apps = _.map(results.apps, function(app) {
            if (app.db) {
                app.link = menu.app_url_ui(app.doc);
            }
            if (app.doc.remote_user && options.username && app.doc.remote_user !== username) {
                app.remote_user_warning = true;
                app.remote_user = app.doc.remote_user;
            }
            if (app.doc.kanso || app.doc.couchapp) {
                var meta = app.doc.couchapp || app.doc.kanso;
                app.desc = meta.config.description;
            }
            return app;
        });

        results.grouped_apps = _.groupBy(results.apps, function(app) {
            if (app.doc.onDropdownMenu) return "more_apps";
            else return "apps";
        });
        callback(null, results);
   });
};


app.prototype.login_url = function(dashboard_url, no_db_file) {
    if (no_db_file) return null;
    var login_url = dashboard_url + 'login';

    if (this.settings.sessions.type == 'other') {
        login_url = this.settings.sessions.other.login_url;
    }
    return login_url;
};

app.prototype.dashboard_ui_url = function(settings, no_db_file) {

    if (no_db_file) return null;

    if (settings.host_options.rootDashboard) {
        // only if the current host matches one of the specified hosts
        var use_short = false;
        // dermine if we are on the server or browser
        if (typeof window !== 'undefined') {
            var host = window.location.host;
            var hostnames = settings.host_options.hostnames.split(',');
            _.each(hostnames, function(hostname){
                var p = url.parse(hostname);
                var to_bind = p.hostname;
                if (p.port != '80' && (_.isString(p.port) || _.isNumber(p.port)) ) {
                    to_bind += ':' + p.port;
                }
                if (to_bind == host) use_short = true;
            });
            if (use_short) return '/';
        }
    }
    return  '/dashboard/_design/dashboard/_rewrite/';
};

app.prototype.home_url = function(dashboard_url, no_db_file) {
    if (no_db_file) return null;
    else return dashboard_url;
};


app.prototype.settings_url = function(dashboard_url, no_db_file) {
    if (no_db_file) return null;
    else return dashboard_url + "settings";
};

app.prototype.app_url_ui = function(app_install_doc, no_db_file) {

    if (no_db_file) return null;

    var meta = app_install_doc.couchapp || app_install_doc.kanso;
    try {
        if (meta.config.legacy_mode) {
            return '/' + app_install_doc.installed.db + '/_design/' + app_install_doc.doc_id  + app_install_doc.open_path;
        }
    } catch(ignore){}

    if (typeof window !== 'undefined' && this.settings.host_options.short_urls && this.settings.host_options.short_app_urls) {

        // only if the current host matches one of the specified hosts
        var use_short = false;

        // dermine if we are on the server or browser
        var host = window.location.host;

        var hostnames = this.settings.host_options.hostnames.split(',');
        _.each(hostnames, function(hostname){
            var p = url.parse(hostname);
            var to_bind = p.hostname;
            if (p.port != '80' && (_.isString(p.port) || _.isNumber(p.port)) ) {
                to_bind += ':' + p.port;
            }
            if (to_bind == host) use_short = true;
        });
        if (use_short) return '/' + app_install_doc.installed.db + '/';
    }
    return '/' + app_install_doc.installed.db + '/_design/' + app_install_doc.doc_id  + app_install_doc.open_path;
};

app.prototype.app_settings_ui = function(app_install_doc) {
    if (this.settings.host_options.rootDashboard) {
        return '/settings#/apps/' + app_install_doc._id;
    }
    return '/dashboard/_design/dashboard/_rewrite/settings#/apps/' + app_install_doc._id;
};


return app;

}));
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.jscss = factory();
    }
}(this, function () {

  var
    id = 0
  , indent = function(level){
      var out = "";
      for (var i = 0; i < level; i++){
        out += "  ";
      }
      return out
    }
  , jscss = {
      compile: function(obj){
        var
          selectors = {}
          // Build nested rules into single rules
        , _buildSelectors = function(hash, selector){
            var curr, type, selector, key;
            for (key in hash){
              type = typeof (curr = hash[key]);
              if (type == "string"){
                if (!selectors[selector]) selectors[selector] = {};
                selectors[selector][key] = curr;
              }else if (type == "object"){
                // Media query or animation or something
                if (key[0] == "@"){
                  selectors[key] = curr;
                }else{
                  _buildSelectors(curr, (selector ? (selector + " ") : "") + key);
                }
              }
            }
          }
          // Take a flat css object and turn it into a string
        , _compile = function(hash, level){
            var spaces = "  ", out = "", level = level || 0, curr;
            for (var key in hash){
              curr = hash[key];
              out += indent(level) + key;
              if (typeof curr == "object"){
                out += " {\n" + _compile(curr, level + 1) + indent(level) + "}\n";
              }else{
                out += ": " + curr + ";\n";
              }
            }
            return out;
          }
        ;
        _buildSelectors(obj, "");
        return _compile(selectors, 0);
      }
      // Embeds a
    , embed: function(styles, styleId){
        styleId || (styleId = "jscss-" + (id++));
        var el = document.createElement('style');
        el.type = "text/css";
        el.rel = "stylesheet";
        el.id = styleId;
        el.innerHTML = "\n" + styles;
        document.head.appendChild(el);
      }
    }
  ;

  return jscss;

}));
/*!
 * alertify.js
 * browser dialogs never looked so good
 *
 * @author Fabien Doiron <fabien.doiron@gmail.com>
 * @copyright Fabien Doiron 2013
 * @license MIT <http://opensource.org/licenses/mit-license.php>
 * @link http://fabien-d.github.com/alertify.js/
 * @module alertify
 * @version 0.4.0rc1
 */
(function (global, document, undefined) {
var AlertifyProto = (function () {
    

    var AlertifyProto,
        add,
        attach;

    /**
     * Add
     * Update bind and unbind method for browser
     * that support add/removeEventListener
     *
     * @return {undefined}
     */
    add = function () {
        this.on = function (el, event, fn) {
            el.addEventListener(event, fn, false);
        };
        this.off = function (el, event, fn) {
            el.removeEventListener(event, fn, false);
        };
    };

    /**
     * Attach
     * Update bind and unbind method for browser
     * that support attach/detachEvent
     *
     * @return {undefined}
     */
    attach = function () {
        this.on = function (el, event, fn) {
            el.attachEvent("on" + event, fn);
        };
        this.off = function (el, event, fn) {
            el.detachEvent("on" + event, fn);
        };
    };

    /**
     * Alertify Prototype API
     *
     * @type {Object}
     */
    AlertifyProto = {
        _version : "0.4.0",
        _prefix  : "alertify",
        get: function (id) {
            return document.getElementById(id);
        },
        on: function (el, event, fn) {
            if (typeof el.addEventListener === "function") {
                el.addEventListener(event, fn, false);
                add.call(this);
            } else if (el.attachEvent) {
                el.attachEvent("on" + event, fn);
                attach.call(this);
            }
        },
        off: function (el, event, fn) {
            if (typeof el.removeEventListener === "function") {
                el.removeEventListener(event, fn, false);
                add.call(this);
            } else if (el.detachEvent) {
                el.detachEvent("on" + event, fn);
                attach.call(this);
            }
        }
    };

    return AlertifyProto;
}());
var Alertify = (function () {
    

    var Alertify = function () {};
    Alertify.prototype = AlertifyProto;
    Alertify = new Alertify();

    return Alertify;
}());
var validate = (function () {
    

    var _checkValidation,
        validate;

    /**
     * Validate Parameters
     * The validation checks parameter against specified type.
     * If the parameter is set to optional, is will be valid unless
     * a parameter is specified and does not pass the test
     *
     * @param  {String}  type     Type to check parameter against
     * @param  {Mixed}   param    Parameter to check
     * @param  {Boolean} optional [Optional] Whether the parameter is optional
     * @return {Boolean}
     */
    _checkValidation = function (type, param, optional) {
        var valid = false;
        if (optional && typeof param === "undefined") {
            valid = true;
        } else {
            if (type === "object") {
                valid = (typeof param === "object" && !(param instanceof Array));
            } else {
                valid = (typeof param === type);
            }
        }
        return valid;
    };

    /**
     * Validate API
     *
     * @type {Object}
     */
    validate = {
        messages: {
            invalidArguments: "Invalid arguments"
        },
        isFunction: function (param, optional) {
            return _checkValidation("function", param, optional);
        },
        isNumber: function (param, optional) {
            return _checkValidation("number", param, optional);
        },
        isObject: function (param, optional) {
            return _checkValidation("object", param, optional);
        },
        isString: function (param, optional) {
            return _checkValidation("string", param, optional);
        },
    };

    return validate;
}());
var element = (function () {
    

    var element = {},
        setAttributes;

    /**
     * Set Attributes
     * Add attributes to a created element
     *
     * @param {Object} el     Created DOM element
     * @param {Object} params [Optional] Attributes object
     * @return {Object}
     */
    setAttributes = function (el, params) {
        var k;
        if (!validate.isObject(el) ||
            !validate.isObject(params, true)) {
            throw new Error(validate.messages.invalidArguments);
        }
        if (typeof params !== "undefined") {
            if (params.attributes) {
                for (k in params.attributes) {
                    if (params.attributes.hasOwnProperty(k)) {
                        el.setAttribute(k, params.attributes[k]);
                    }
                }
            }
            if (params.classes) {
                el.className = params.classes;
            }
        }
        return el;
    };

    /**
     * element API
     *
     * @type {Object}
     */
    element = {
        create: function (type, params) {
            var el;
            if (!validate.isString(type) ||
                !validate.isObject(params, true)) {
                throw new Error(validate.messages.invalidArguments);
            }

            el = document.createElement(type);
            el = setAttributes(el, params);
            return el;
        },
        ready: function (el) {
            if (!validate.isObject(el)) {
                throw new Error(validate.messages.invalidArguments);
            }
            if (el && el.scrollTop !== null) {
                return;
            } else {
                this.ready();
            }
        }
    };

    return element;
}());
var transition = (function () {
    

    var transition;

    /**
     * Transition
     * Determines if current browser supports CSS transitions
     * And if so, assigns the proper transition event
     *
     * @return {Object}
     */
    transition = function () {
        var t,
            type,
            supported   = false,
            el          = element.create("fakeelement"),
            transitions = {
                "WebkitTransition" : "webkitTransitionEnd",
                "MozTransition"    : "transitionend",
                "OTransition"      : "otransitionend",
                "transition"       : "transitionend"
            };

        for (t in transitions) {
            if (el.style[t] !== undefined) {
                type      = transitions[t];
                supported = true;
                break;
            }
        }

        return {
            type      : type,
            supported : supported
        };
    };

    return transition();
}());
var keys = (function () {
    

    var keys = {
        ENTER : 13,
        ESC   : 27,
        SPACE : 32
    };

    return keys;
}());
var Dialog = (function () {
    

    var dialog,
        _dialog = {};

    var Dialog = function () {
        var controls     = {},
            dialog       = {},
            isOpen       = false,
            queue        = [],
            tpl          = {},
            prefixEl     = Alertify._prefix + "-dialog",
            prefixCover  = Alertify._prefix + "-cover",
            clsElShow    = prefixEl + " is-" + prefixEl + "-showing",
            clsElHide    = prefixEl + " is-" + prefixEl + "-hidden",
            clsCoverShow = prefixCover + " is-" + prefixCover + "-showing",
            clsCoverHide = prefixCover + " is-" + prefixCover + "-hidden",
            elCallee,
            $,
            appendBtns,
            addListeners,
            build,
            hide,
            init,
            onBtnCancel,
            onBtnOK,
            onBtnResetFocus,
            onFormSubmit,
            onKeyUp,
            open,
            removeListeners,
            setFocus,
            setup;

        tpl = {
            buttons : {
                holder : "<nav class=\"alertify-buttons\">{{buttons}}</nav>",
                submit : "<button role=\"button\" type=\"submit\" class=\"alertify-button alertify-button-ok\" id=\"alertify-ok\">{{ok}}</button>",
                ok     : "<button role=\"button\" type=\"button\" class=\"alertify-button alertify-button-ok\" id=\"alertify-ok\">{{ok}}</button>",
                cancel : "<button role=\"button\" type=\"button\" class=\"alertify-button alertify-button-cancel\" id=\"alertify-cancel\">{{cancel}}</button>"
            },
            input   : "<div class=\"alertify-text-wrapper\"><input type=\"text\" class=\"alertify-text\" id=\"alertify-text\"></div>",
            message : "<p class=\"alertify-message\">{{message}}</p>",
            log     : "<article class=\"alertify-log{{class}}\">{{message}}</article>"
        };

        addListeners = function (item) {
            // ok event handler
            onBtnOK = function (event) {
                var val = "";
                if (typeof event.preventDefault !== "undefined") {
                    event.preventDefault();
                }
                removeListeners();
                hide();

                if (controls.input) {
                    val = controls.input.value;
                }
                if (typeof item.accept === "function") {
                    if (controls.input) {
                        item.accept(val);
                    } else {
                        item.accept();
                    }
                }
                return false;
            };

            // cancel event handler
            onBtnCancel = function (event) {
                if (typeof event.preventDefault !== "undefined") {
                    event.preventDefault();
                }
                removeListeners();
                hide();
                if (typeof item.deny === "function") {
                    item.deny();
                }
                return false;
            };

            // keyup handler
            onKeyUp = function (event) {
                var keyCode = event.keyCode;
                if (keyCode === keys.SPACE && !controls.input) {
                    onBtnOK(event);
                }
                if (keyCode === keys.ESC && controls.cancel) {
                    onBtnCancel(event);
                }
            };

            // reset focus to first item in the dialog
            onBtnResetFocus = function (event) {
                if (controls.input) {
                    controls.input.focus();
                } else if (controls.cancel) {
                    controls.cancel.focus();
                } else {
                    controls.ok.focus();
                }
            };

            // handle reset focus link
            // this ensures that the keyboard focus does not
            // ever leave the dialog box until an action has
            // been taken
            Alertify.on(controls.reset, "focus", onBtnResetFocus);
            // handle OK click
            if (controls.ok) {
                Alertify.on(controls.ok, "click", onBtnOK);
            }
            // handle Cancel click
            if (controls.cancel) {
                Alertify.on(controls.cancel, "click", onBtnCancel);
            }
            // listen for keys, Cancel => ESC
            Alertify.on(document.body, "keyup", onKeyUp);
            // bind form submit
            if (controls.form) {
                Alertify.on(controls.form, "submit", onBtnOK);
            }
            if (!transition.supported) {
                setFocus();
            }
        };

        /**
         * Append Buttons
         * Insert the buttons in the proper order
         *
         * @param  {String} secondary Cancel button string
         * @param  {String} primary   OK button string
         * @return {String}
         */
        appendBtns = function (secondary, primary) {
            return dialog.buttonReverse ? primary + secondary : secondary + primary;
        };

        build = function (item) {
            var html    = "",
                type    = item.type,
                message = item.message;

            html += "<div class=\"alertify-dialog-inner\">";

            if (dialog.buttonFocus === "none") {
                html += "<a href=\"#\" id=\"alertify-noneFocus\" class=\"alertify-hidden\"></a>";
            }

            if (type === "prompt") {
                html += "<form id=\"alertify-form\">";
            }

            html += "<article class=\"alertify-inner\">";
            html += tpl.message.replace("{{message}}", message);

            if (type === "prompt") {
                html += tpl.input;
            }

            html += tpl.buttons.holder;
            html += "</article>";

            if (type === "prompt") {
                html += "</form>";
            }

            html += "<a id=\"alertify-resetFocus\" class=\"alertify-resetFocus\" href=\"#\">Reset Focus</a>";
            html += "</div>";

            switch (type) {
            case "confirm":
                html = html.replace("{{buttons}}", appendBtns(tpl.buttons.cancel, tpl.buttons.ok));
                html = html.replace("{{ok}}", dialog.labels.ok).replace("{{cancel}}", dialog.labels.cancel);
                break;
            case "prompt":
                html = html.replace("{{buttons}}", appendBtns(tpl.buttons.cancel, tpl.buttons.submit));
                html = html.replace("{{ok}}", dialog.labels.ok).replace("{{cancel}}", dialog.labels.cancel);
                break;
            case "alert":
                html = html.replace("{{buttons}}", tpl.buttons.ok);
                html = html.replace("{{ok}}", dialog.labels.ok);
                break;
            }

            return html;
        };

        hide = function () {
            var transitionDone;
            queue.splice(0,1);
            if (queue.length > 0) {
                open(true);
            } else {
                isOpen = false;
                transitionDone = function (event) {
                    event.stopPropagation();
                    //this.className += " alertify-isHidden";
                    Alertify.off(this, transition.type, transitionDone);
                };
                if (transition.supported) {
                    Alertify.on(dialog.el, transition.type, transitionDone);
                    dialog.el.className = clsElHide;
                } else {
                    dialog.el.className = clsElHide;
                }
                dialog.cover.className  = clsCoverHide;
                elCallee.focus();
            }
        };

        /**
         * Initialize Dialog
         * Create the dialog and cover elements
         *
         * @return {Object}
         */
        init = function () {
            var cover = element.create("div", { classes: clsCoverHide }),
                el    = element.create("section", { classes: clsElHide });

            document.body.appendChild(cover);
            document.body.appendChild(el);
            element.ready(cover);
            element.ready(el);
            dialog.cover = cover;
            return el;
        };

        open = function (fromQueue) {
            var item = queue[0],
                onTransitionEnd;

            isOpen = true;

            onTransitionEnd = function (event) {
                event.stopPropagation();
                setFocus();
                Alertify.off(this, transition.type, onTransitionEnd);
            };

            if (transition.supported && !fromQueue) {
                Alertify.on(dialog.el, transition.type, onTransitionEnd);
            }
            dialog.el.innerHTML    = build(item);
            dialog.cover.className = clsCoverShow;
            dialog.el.className    = clsElShow;

            controls.reset  = Alertify.get("alertify-resetFocus");
            controls.ok     = Alertify.get("alertify-ok")     || undefined;
            controls.cancel = Alertify.get("alertify-cancel") || undefined;
            controls.focus  = (dialog.buttonFocus === "cancel" && controls.cancel) ? controls.cancel : ((dialog.buttonFocus === "none") ? Alertify.get("alertify-noneFocus") : controls.ok),
            controls.input  = Alertify.get("alertify-text")   || undefined;
            controls.form   = Alertify.get("alertify-form")   || undefined;

            if (typeof item.placeholder === "string" && item.placeholder !== "") {
                controls.input.value = item.placeholder;
            }

            if (fromQueue) {
                setFocus();
            }
            addListeners(item);
        };

        /**
         * Remove Event Listeners
         *
         * @return {undefined}
         */
        removeListeners = function () {
            Alertify.off(document.body, "keyup", onKeyUp);
            Alertify.off(controls.reset, "focus", onBtnResetFocus);
            if (controls.input) {
                Alertify.off(controls.form, "submit", onFormSubmit);
            }
            if (controls.ok) {
                Alertify.off(controls.ok, "click", onBtnOK);
            }
            if (controls.cancel) {
                Alertify.off(controls.cancel, "click", onBtnCancel);
            }
        };

        /**
         * Set Focus
         * Set focus to proper element
         *
         * @return {undefined}
         */
        setFocus = function () {
            if (controls.input) {
                controls.input.focus();
                controls.input.select();
            } else {
                controls.focus.focus();
            }
        };

        /**
         * Setup Dialog
         *
         * @param  {String} type        Dialog type
         * @param  {String} msg         Dialog message
         * @param  {Function} accept    [Optional] Accept callback
         * @param  {Function} deny      [Optional] Deny callback
         * @param  {String} placeholder [Optional] Input placeholder text
         * @return {undefined}
         */
        setup = function (type, msg, accept, deny, placeholder) {
            if (!validate.isString(type)          ||
                !validate.isString(msg)           ||
                !validate.isFunction(accept,true) ||
                !validate.isFunction(deny,true)   ||
                !validate.isString(placeholder, true)) {
                throw new Error(validate.messages.invalidArguments);
            }
            dialog.el = dialog.el || init();
            elCallee = document.activeElement;

            queue.push({
                type        : type,
                message     : msg,
                accept      : accept,
                deny        : deny,
                placeholder : placeholder
            });

            if (!isOpen) {
                open();
            }
        };

        return {
            buttonFocus   : "ok",
            buttonReverse : false,
            cover         : undefined,
            el            : undefined,
            labels: {
                ok: "OK",
                cancel: "Cancel"
            },
            alert: function (msg, accept) {
                dialog = this;
                setup("alert", msg, accept);
                return this;
            },
            confirm: function (msg, accept, deny) {
                dialog = this;
                setup("confirm", msg, accept, deny);
                return this;
            },
            prompt: function (msg, accept, deny, placeholder) {
                dialog = this;
                setup("prompt", msg, accept, deny, placeholder);
                return this;
            }
        };
    };

    return new Dialog();
}());
var Log = (function () {
    

    var Log,
        onTransitionEnd,
        remove,
        startTimer,
        prefix  = Alertify._prefix + "-log",
        clsShow = prefix + " is-" + prefix + "-showing",
        clsHide = prefix + " is-" + prefix + "-hidden";

    /**
     * Log Method
     *
     * @param {Object} parent HTML DOM to insert log message into
     * @param {String} type   Log type
     * @param {String} msg    Log message
     * @param {Number} delay  [Optional] Delay in ms
     */
    Log = function (parent, type, msg, delay) {
        if (!validate.isObject(parent) ||
            !validate.isString(type) ||
            !validate.isString(msg) ||
            !validate.isNumber(delay, true)) {
            throw new Error(validate.messages.invalidArguments);
        }

        this.delay  = (typeof delay !== "undefined") ? delay : 5000;
        this.msg    = msg;
        this.parent = parent;
        this.type   = type;
        this.create();
        this.show();
    };

    /**
     * Transition End
     * Handle CSS transition end
     *
     * @param  {Event} event Event
     * @return {undefined}
     */
    onTransitionEnd = function (event) {
        event.stopPropagation();
        if (typeof this.el !== "undefined") {
            Alertify.off(this.el, transition.type, this.fn);
            remove.call(this);
        }
    };

    /**
     * Remove
     * Remove the element from the DOM
     *
     * @return {undefined}
     */
    remove = function () {
        this.parent.removeChild(this.el);
        delete this.el;
    };

    /**
     * StartTimer
     *
     * @return {undefined}
     */
    startTimer = function () {
        var that = this;
        if (this.delay !== 0) {
            setTimeout(function () {
                that.close();
            }, this.delay);
        }
    };

    /**
     * Close
     * Prepare the log element to be removed.
     * Set an event listener for transition complete
     * or call the remove directly
     *
     * @return {undefined}
     */
    Log.prototype.close = function () {
        var that = this;
        if (typeof this.el !== "undefined" && this.el.parentNode === this.parent) {
            if (transition.supported) {
                this.fn = function (event) {
                    onTransitionEnd.call(that, event);
                };
                Alertify.on(this.el, transition.type, this.fn);
                this.el.className = clsHide + " " + prefix + "-" + this.type;
            } else {
                remove.call(this);
            }
        }
    };

    /**
     * Create
     * Create a new log element and
     * append it to the parent
     *
     * @return {undefined}
     */
    Log.prototype.create = function () {
        if (typeof this.el === "undefined") {
            var el = element.create("article", {
                classes: clsHide + " " + prefix + "-" + this.type
            });
            el.innerHTML = this.msg;
            this.parent.appendChild(el);
            element.ready(el);
            this.el = el;
        }
    };

    /**
     * Show
     * Show new log element and bind click listener
     *
     * @return {undefined}
     */
    Log.prototype.show = function () {
        var that = this;
        if (typeof this.el === "undefined") {
            return;
        }
        Alertify.on(this.el, "click", function () {
            that.close();
        });
        this.el.className = clsShow + " " + prefix + "-" + this.type;
        startTimer.call(this);
    };

    return Log;
}());
var logs = (function () {
    

    var init,
        createLog,
        validateParams,
        logs;

    /**
     * Init Method
     * Create the log holder element
     *
     * @return {Object} Log holder element
     */
    init = function () {
        var el = element.create("section", { classes: Alertify._prefix + "-logs" });
        document.body.appendChild(el);
        element.ready(el);
        return el;
    };

    /**
     * Create Log
     *
     * @param  {String} type  Log type
     * @param  {String} msg   Log message
     * @param  {Number} delay [Optional] Delay in ms
     * @return {Object}
     */
    createLog = function (type, msg, delay) {
        validateParams(type, msg, delay);
        this.el = this.el || init();
        return new Log(this.el, type, msg, delay);
    };

    /**
     * Validate Parameters
     *
     * @param  {String} type  Log type
     * @param  {String} msg   Log message
     * @param  {Number} delay [Optional] Delay in ms
     * @return {undefined}
     */
    validateParams = function (type, msg, delay) {
        if (!validate.isString(type) ||
            !validate.isString(msg) ||
            !validate.isNumber(delay, true)) {
            throw new Error(validate.messages.invalidArguments);
        }
    };

    /**
     * Logs API
     *
     * @type {Object}
     */
    logs = {
        delay : 5000,
        el    : undefined,
        create: function (type, msg, delay) {
            return createLog.call(this, type, msg, delay);
        },
        error: function (msg, delay) {
            return createLog.call(this, "error", msg, delay);
        },
        info: function (msg, delay) {
            return createLog.call(this, "info", msg, delay);
        },
        success: function (msg, delay) {
            return createLog.call(this, "success", msg, delay);
        }
    };

    return logs;
}());

    Alertify.dialog = Dialog;
    Alertify.log    = logs;
    window.Alertify = Alertify;


})(this, document);
/*
 * Foundation Responsive Library 4.0.0
 * http://foundation.zurb.com
 * Copyright 2013, ZURB
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
*/

/*jslint unparam: true, browser: true, indent: 2 */

(function () {
  // add dusty browser stuff
  if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun /*, thisp */) {
      "use strict";
   
      if (this == null) {
        throw new TypeError();
      }
   
      var t = Object(this),
          len = t.length >>> 0;
      if (typeof fun != "function") {
        try {
          throw new TypeError();
        } catch (e) {
          return;
        }
      }
   
      var res = [],
          thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in t) {
          var val = t[i]; // in case fun mutates this
          if (fun && fun.call(thisp, val, i, t)) {
            res.push(val);
          }
        }
      }
   
      return res;
    };

    if (!Function.prototype.bind) {
      Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
          // closest thing possible to the ECMAScript 5 internal IsCallable function
          throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
     
        var aArgs = Array.prototype.slice.call(arguments, 1), 
            fToBind = this, 
            fNOP = function () {},
            fBound = function () {
              return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
               aArgs.concat(Array.prototype.slice.call(arguments)));
            };
     
        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();
     
        return fBound;
      };
    }
  }

  // fake stop() for zepto.
  $.fn.stop = $.fn.stop || function() {
    return this;
  };
}());

;(function (window, document, undefined) {
  'use strict';

  window.Foundation = {
    name : 'Foundation',

    version : '4.0.0',

    // global Foundation cache object
    cache : {},

    init : function (scope, libraries, method, options, response, /* internal */ nc) {
      var library_arr,
          args = [scope, method, options, response],
          responses = [],
          nc = nc || false;

      // disable library error catching,
      // used for development only
      if (nc) this.nc = nc;

      // set foundation global scope
      this.scope = scope || this.scope;

      if (libraries && typeof libraries === 'string') {
        if (/off/i.test(libraries)) return this.off();

        library_arr = libraries.split(' ');

        if (library_arr.length > 0) {
          for (var i = library_arr.length - 1; i >= 0; i--) {
            responses.push(this.init_lib(library_arr[i], args));
          }
        }
      } else {
        for (var lib in this.libs) {
          responses.push(this.init_lib(lib, args));
        }
      }

      // if first argument is callback, add to args
      if (typeof libraries === 'function') {
        args.unshift(libraries);
      }

      return this.response_obj(responses, args);
    },

    response_obj : function (response_arr, args) {
      for (var callback in args) {
        if (typeof args[callback] === 'function') {
          return args[callback]({
            errors: response_arr.filter(function (s) {
              if (typeof s === 'string') return s;
            })
          });
        }
      }

      return response_arr;
    },

    init_lib : function (lib, args) {
      return this.trap(function () {
        if (this.libs.hasOwnProperty(lib)) {
          this.patch(this.libs[lib]);
          return this.libs[lib].init.apply(this.libs[lib], args);
        }
      }.bind(this), lib);
    },

    trap : function (fun, lib) {
      if (!this.nc) {
        try {
          return fun();
        } catch (e) {
          return this.error({name: lib, message: 'could not be initialized', more: e.name + ' ' + e.message});
        }
      }

      return fun();
    },

    patch : function (lib) {
      this.fix_outer(lib);
    },

    inherit : function (scope, methods) {
      var methods_arr = methods.split(' ');

      for (var i = methods_arr.length - 1; i >= 0; i--) {
        if (this.lib_methods.hasOwnProperty(methods_arr[i])) {
          this.libs[scope.name][methods_arr[i]] = this.lib_methods[methods_arr[i]];
        }
      }
    },

    libs : {},

    // methods that can be inherited in libraries
    lib_methods : {
      set_data : function (node, data) {
        // this.name references the name of the library calling this method
        var id = this.name + (+new Date());

        Foundation.cache[id] = data;
        node.attr('data-' + this.name + '-id', id);
      },

      get_data : function (node) {
        return Foundation.cache[node.attr('data-' + this.name + '-id')];
      },

      remove_data : function (node) {
        if (node) {
          delete Foundation.cache[node.attr('data-' + this.name + '-id')];
          node.attr('data-' + this.name + '-id', '');
        } else {
          $('[data-' + this.name + '-id]').each(function () {
            delete Foundation.cache[$(this).attr('data-' + this.name + '-id')];
            $(this).attr('data-' + this.name + '-id', '');
          });
        }
      },

      throttle : function(fun, delay) {
        var timer = null;
        return function () {
          var context = this, args = arguments;
          clearTimeout(timer);
          timer = setTimeout(function () {
            fun.apply(context, args);
          }, delay);
        };
      },

      // parses dat-options attribute on page nodes and turns
      // them into an object
      data_options : function (el) {
        var opts = {}, ii, p,
            opts_arr = (el.attr('data-options') || ':').split(';'),
            opts_len = opts_arr.length;

        function trim(str) {
          if (typeof str === 'string') return $.trim(str);
          return str;
        }

        // parse options
        for (ii = opts_len - 1; ii >= 0; ii--) {
          p = opts_arr[ii].split(':');

          if (/true/i.test(p[1])) p[1] = true;
          if (/false/i.test(p[1])) p[1] = false;

          if (p.length === 2) {
            opts[trim(p[0])] = trim(p[1]);
          }
        }

        return opts;
      },

      delay : function (fun, delay) {
        return setTimeout(fun, delay);
      },

      // animated scrolling
      scrollTo : function (el, to, duration) {
        if (duration < 0) return;
        var difference = to - $(window).scrollTop();
        var perTick = difference / duration * 10;

        this.scrollToTimerCache = setTimeout(function() {
          if (!isNaN(parseInt(perTick, 10))) {
            window.scrollTo(0, $(window).scrollTop() + perTick);
            this.scrollTo(el, to, duration - 10);
          }
        }.bind(this), 10);
      },

      // not supported in core Zepto
      scrollLeft : function (el) {
        if (!el.length) return;
        return ('scrollLeft' in el[0]) ? el[0].scrollLeft : el[0].pageXOffset;
      },

      // test for empty object or array
      empty : function (obj) {
        if (obj.length && obj.length > 0)    return false;
        if (obj.length && obj.length === 0)  return true;

        for (var key in obj) {
          if (hasOwnProperty.call(obj, key))    return false;
        }

        return true;
      }
    },

    fix_outer : function (lib) {
      lib.outerHeight = function (el, bool) {
        if (typeof Zepto === 'function') {
          return el.height();
        }

        if (typeof bool !== 'undefined') {
          return el.outerHeight(bool);
        }

        return el.outerHeight();
      };

      lib.outerWidth = function (el) {
        if (typeof Zepto === 'function') {
          return el.width();
        }

        if (typeof bool !== 'undefined') {
          return el.outerWidth(bool);
        }

        return el.outerWidth();
      };
    },

    error : function (error) {
      return error.name + ' ' + error.message + '; ' + error.more;
    },

    // remove all foundation events.
    off: function () {
      $(this.scope).off('.fndtn');
      $(window).off('.fndtn');
      return true;
    },

    zj : function () {
      try {
        return Zepto;
      } catch (e) {
        return jQuery;
      }
    }()
  },

  $.fn.foundation = function () {
    var args = Array.prototype.slice.call(arguments, 0);

    return this.each(function () {
      Foundation.init.apply(Foundation, [this].concat(args));
      return this;
    });
  };

}(this, this.document));

/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.topbar = {
    name : 'topbar',

    version : '4.0.2',

    settings : {
      index : 0,
      stickyClass : 'sticky',
      init : false
    },

    init : function (scope, method, options) {
      var self = this;
      this.scope = scope || this.scope;

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      }

      if (typeof method != 'string') {

        $('nav.top-bar').each(function () {
          self.settings.$w = $(window);
          self.settings.$topbar = $(this);
          self.settings.$section = self.settings.$topbar.find('section');
          self.settings.$titlebar = self.settings.$topbar.children('ul').first();


          self.settings.$topbar.data('index', 0);

          var breakpoint = $("<div class='top-bar-js-breakpoint'/>").insertAfter(self.settings.$topbar);
          self.settings.breakPoint = breakpoint.width();
          breakpoint.remove();

          self.assemble();

          if (!self.settings.$topbar.data('height')) self.largestUL();

          if (self.settings.$topbar.parent().hasClass('fixed')) {
            $('body').css('padding-top', this.outerHeight(this.settings.$topbar));
          }
        });

        if (!self.settings.init) {
          this.events();
        }

        return this.settings.init;
      } else {
        // fire method
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this;

      $(this.scope)
        .on('click.fndtn.topbar', '.top-bar .toggle-topbar', function (e) {
          var topbar = $(this).closest('.top-bar'),
              section = topbar.find('section, .section'),
              titlebar = topbar.children('ul').first();

          e.preventDefault();

          if (self.breakpoint()) {
            topbar
              .toggleClass('expanded')
              .css('min-height', '');
          }

          if (!topbar.hasClass('expanded')) {
            section.css({left: '0%'});
            section.find('>.name').css({left: '100%'});
            section.find('li.moved').removeClass('moved');
            topbar.data('index', 0);
          }
        })

        .on('click.fndtn.topbar', '.top-bar .has-dropdown>a', function (e) {
          var topbar = $(this).closest('.top-bar'),
              section = topbar.find('section, .section'),
              titlebar = topbar.children('ul').first();

          if (Modernizr.touch || self.breakpoint()) {
            e.preventDefault();
          }

          if (self.breakpoint()) {
            var $this = $(this),
                $selectedLi = $this.closest('li');

            topbar.data('index', topbar.data('index') + 1);
            $selectedLi.addClass('moved');
            section.css({left: -(100 * topbar.data('index')) + '%'});
            section.find('>.name').css({left: 100 * topbar.data('index') + '%'});

            $this.siblings('ul')
              .height(topbar.data('height') + self.outerHeight(titlebar, true));
            topbar
              .css('min-height', topbar.data('height') + self.outerHeight(titlebar, true) * 2)
          }
      });

      $(window).on('resize.fndtn.topbar', function () {
        if (!this.breakpoint()) {
          $('.top-bar').css('min-height', '');
        }
      }.bind(this));

      // Go up a level on Click
      $(this.scope).on('click.fndtn', '.top-bar .has-dropdown .back', function (e) {
        e.preventDefault();

        var $this = $(this),
            topbar = $this.closest('.top-bar'),
            section = topbar.find('section, .section'),
            $movedLi = $this.closest('li.moved'),
            $previousLevelUl = $movedLi.parent();

        topbar.data('index', topbar.data('index') - 1);
        section.css({left: -(100 * topbar.data('index')) + '%'});
        section.find('>.name').css({'left': 100 * topbar.data('index') + '%'});

        if (topbar.data('index') === 0) {
          topbar.css('min-height', 0);
        }

        setTimeout(function () {
          $movedLi.removeClass('moved');
        }, 300);
      });
    },

    breakpoint : function () {
      return $(window).width() <= this.settings.breakPoint || $('html').hasClass('lt-ie9');
    },

    assemble : function () {
      // Pull element out of the DOM for manipulation
      this.settings.$section.detach();

      this.settings.$section.find('.has-dropdown>a').each(function () {
        var $link = $(this),
            $dropdown = $link.siblings('.dropdown'),
            $titleLi = $('<li class="title back js-generated"><h5><a href="#">&laquo; Back</a></h5></li>');
        // Copy link to subnav
        $dropdown.prepend($titleLi);
      });

      // Put element back in the DOM
      this.settings.$section.appendTo(this.settings.$topbar);

      // check for sticky
      this.sticky();
    },

    largestUL : function () {
      var uls = this.settings.$topbar.find('section ul ul'),
          largest = uls.first(),
          total = 0,
          self = this;

      uls.each(function () {
        if ($(this).children('li').length > largest.children('li').length) {
          largest = $(this);
        }
      });

      largest.children('li').each(function () { total += self.outerHeight($(this), true); });

      this.settings.$topbar.data('height', total);
    },

    sticky : function () {
      var klass = '.' + this.settings.stickyClass;
      if ($(klass).length > 0) {
        var distance = $(klass).length ? $(klass).offset().top: 0,
            $window = $(window);
            var offst = this.outerHeight($('nav.top-bar'))+20;

          $window.scroll(function() {
            if ($window.scrollTop() >= (distance)) {
               $(klass).addClass("fixed");
                 $('body').css('padding-top',offst);
            }

           else if ($window.scrollTop() < distance) {
              $(klass).removeClass("fixed");
              $('body').css('padding-top','0');
           }
        });
      }
    },

    off : function () {
      $(this.scope).off('.fndtn.topbar');
      $(window).off('.fndtn.topbar');
    }
  };
}(Foundation.zj, this, this.document));

/*jslint unparam: true, browser: true, indent: 2 */

;(function ($, window, document, undefined) {
  'use strict';

  Foundation.libs.dropdown = {
    name : 'dropdown',

    version : '4.0.0',

    settings : {
      activeClass: 'open'
    },

    init : function (scope, method, options) {
      this.scope = scope || this.scope;
      Foundation.inherit(this, 'throttle');

      if (typeof method === 'object') {
        $.extend(true, this.settings, method);
      }

      if (typeof method != 'string') {

        if (!this.settings.init) {
          this.events();
        }

        return this.settings.init;
      } else {
        return this[method].call(this, options);
      }
    },

    events : function () {
      var self = this;

      $(this.scope).on('click.fndtn.dropdown', '[data-dropdown]', function (e) {
        e.preventDefault();
        e.stopPropagation();
        self.toggle($(this));
      });

      $('*, html, body').on('click.fndtn.dropdown', function (e) {
        if (!$(e.target).data('dropdown')) {
          $('[data-dropdown-content]')
            .css('left', '-99999px')
            .removeClass(self.settings.activeClass);
        }
      });

      $('[data-dropdown-content]').on('click.fndtn.dropdown', function (e) {
        e.stopPropagation();
      });

      $(window).on('resize.fndtn.dropdown', self.throttle(function () {
        self.resize.call(self);
      }, 50)).trigger('resize');

      this.settings.init = true;
    },

    toggle : function (target, resize) {
      var dropdown = $('#' + target.data('dropdown'));

      $('[data-dropdown-content]').not(dropdown).css('left', '-99999px');

      if (dropdown.hasClass(this.settings.activeClass)) {
        dropdown
          .css('left', '-99999px')
          .removeClass(this.settings.activeClass);
      } else {
        this
          .css(dropdown
            .addClass(this.settings.activeClass), target);
      }
    },

    resize : function () {
      var dropdown = $('[data-dropdown-content].open'),
          target = $("[data-dropdown='" + dropdown.attr('id') + "']");

      if (dropdown.length && target.length) {
        this.css(dropdown, target);
      }
    },

    css : function (dropdown, target) {
      var offset = target.offset();

      if (this.small()) {
        dropdown.css({
          position : 'absolute',
          width: '95%',
          left: '2.5%',
          'max-width': 'none',
          top: offset.top + this.outerHeight(target)
        });
      } else {
        var owc = this.outside_window_check(dropdown, target);

        dropdown.attr('style', '').css({
          position : 'absolute',
          top: offset.top + this.outerHeight(target),
          left: owc.left
        });

        dropdown.toggleClass('reverse', owc.reverse);

      }

      return dropdown;
    },

    outside_window_check : function(dropdown, target) {
      var offset = target.offset(),
          window_width = $(window).width(),
          dd_width = dropdown.width();

      if (offset.left + dd_width > window_width){
        return { left: window_width - dd_width, reverse: true };
      } else {
        return { left: offset.left, reverse: false};
      }

    },

    small : function () {
      return $(window).width() < 768 || $('html').hasClass('lt-ie9');
    },

    off: function () {
      $(this.scope).off('.fndtn.dropdown');
      $('html, body').off('.fndtn.dropdown');
      $(window).off('.fndtn.dropdown');
      $('[data-dropdown-content]').off('.fndtn.dropdown');
      this.settings.init = false;
    }
  };
}(Foundation.zj, this, this.document));

this["JST"] = this["JST"] || {};

this["JST"]["templates/profile.underscore"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
 if (!is_user) { 
;__p+='\n    <a class="login" href="'+
(login_url)+
'">Login</a>\n';
 } else { 
;__p+='\n    <a class="profile-link" data-dropdown="profile-drop">\n        <img src="http://www.gravatar.com/avatar/21232f297a57a5a743894a0e4a801fc3?size=20&amp;default=mm" alt="admin">\n        <span>'+
( displayName )+
'</span>\n    </a>\n\n\n';
 } 
;__p+='\n\n';
}
return __p;
};

this["JST"]["templates/topbar.underscore"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='';
 if (options.sticky) { 
;__p+='\n<div class="sticky">\n';
 } 
;__p+='\n\n\n<nav class="top-bar">\n\n    <ul class="title-area">\n      <!-- Title Area -->\n      <li class="name">\n        <h1><a href="';
if (data.home_url) {
;__p+=''+
(data.home_url)+
'';
}
;__p+='">'+
(options.defaultTitle)+
'</a></h1>\n      </li>\n      <!-- Remove the class "menu-icon" to get rid of menu icon. Take out "Menu" to just have icon alone -->\n      <li class="toggle-topbar menu-icon"><a href="#"><span>Menu</span></a></li>\n    </ul>\n\n\n    <section class="top-bar-section">\n        <ul class="left kanso-nav">\n            ';
 _.each(data.grouped_apps.apps, function(app) { 
;__p+='\n            <li>\n                <a href="'+
( app.link )+
'"\n\n                ';
 if (app.db) {  
;__p+='\n                    data-db="'+
(app.db)+
'"\n                ';
 } 
;__p+='\n\n                ';
 if (app.desc) {  
;__p+='\n                    title="'+
(app.desc)+
'"\n                ';
 } 
;__p+='\n\n                >'+
( app.title )+
'</a>\n            </li>\n            ';
 }) 
;__p+='\n\n            ';
 if (data.defaultApp) {  
;__p+='\n                <li>\n                  <a href="'+
( data.defaultApp.link )+
'">'+
( data.defaultApp.title )+
'</a>\n                </li>\n            ';
 } 
;__p+='\n\n            ';
 if (options.show_futon) {  
;__p+='\n                <li><a href="/fauxton/_design/fauxton/_rewrite/">Fauxton</a></li>\n            ';
 } 
;__p+='\n\n            ';
 if (data.no_db_file) {  
;__p+='\n                <li><a href="#" data-dropdown="initGarden-drop">Apps</a></li>\n            ';
 } 
;__p+='\n\n        </ul>\n\n        <!-- Right Nav Section -->\n        <ul class="right">\n          <li class="divider"></li>\n          <li><div id="dashboard-topbar-offline-icon"></div></li>\n          <li class="divider"></li>\n          <li id="dashboard-profile"></li>\n        </ul>\n      </section>\n</nav>\n\n<div id="profile-drop" class="f-dropdown content">\n    <img src="http://www.gravatar.com/avatar/21232f297a57a5a743894a0e4a801fc3?size=20&amp;default=mm" alt="admin">\n    <span>dsdasdasdas</span>\n</div>\n\n<div id="initGarden-drop" class="f-dropdown content">\n  Apps not enabled.\n  <button class="button" >Enable Apps</button>\n  <a href="http://apps.couchdb.apache.org">Learn More</a>\n</div>\n\n\n';
 if (options.sticky) { 
;__p+='\n</div>\n';
 } 
;__p+='';
}
return __p;
};
(function (root, factory) {if (typeof exports === 'object') {module.exports = factory(); } else if (typeof define === 'function' && define.amd) {define([],factory); } else { root.garden_menu_widget_extra_css = factory();} }(this, function () {  

return '\n.dashboard-topbar *,.dashboard-topbar \n*:before,.dashboard-topbar \n*:after {\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box; }\n\n.dashboard-topbar html,.dashboard-topbar \nbody {\n  font-size: 16px; }\n\n.dashboard-topbar body {\n  background: white;\n  color: #222222;\n  padding: 0;\n  margin: 0;\n  font-family: "Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif;\n  font-weight: normal;\n  font-style: normal;\n  line-height: 1;\n  position: relative;\n  -webkit-font-smoothing: antialiased; }\n\n.dashboard-topbar img,.dashboard-topbar \nobject,.dashboard-topbar \nembed {\n  max-width: 100%;\n  height: auto; }\n\n.dashboard-topbar object,.dashboard-topbar \nembed {\n  height: 100%; }\n\n.dashboard-topbar img {\n  -ms-interpolation-mode: bicubic; }\n\n.dashboard-topbar #map_canvas img,.dashboard-topbar \n#map_canvas embed,.dashboard-topbar \n#map_canvas object,.dashboard-topbar \n.map_canvas img,.dashboard-topbar \n.map_canvas embed,.dashboard-topbar \n.map_canvas object {\n  max-width: none !important; }\n\n.dashboard-topbar .left {\n  float: left; }\n\n.dashboard-topbar .right {\n  float: right; }\n\n.dashboard-topbar .text-left {\n  text-align: left; }\n\n.dashboard-topbar .text-right {\n  text-align: right; }\n\n.dashboard-topbar .text-center {\n  text-align: center; }\n\n.dashboard-topbar .text-justify {\n  text-align: justify; }\n\n.dashboard-topbar .hide {\n  display: none; }\n\n.dashboard-topbar img {\n  display: block; }\n\n.dashboard-topbar textarea {\n  height: auto;\n  min-height: 50px; }\n\n.dashboard-topbar select {\n  width: 100%; }\n\n/* Wrapped around .top-bar to contain to grid width */\n.dashboard-topbar .contain-to-grid {\n  width: 100%;\n  background: #111111; }\n\n.dashboard-topbar .fixed {\n  width: 100%;\n  left: 0;\n  position: fixed;\n  top: 0;\n  z-index: 99; }\n\n.dashboard-topbar .top-bar {\n  overflow: hidden;\n  height: 45px;\n  line-height: 45px;\n  position: relative;\n  background: #111111; }\n  .dashboard-topbar .top-bar ul {\n    margin-bottom: 0;\n    list-style: none; }\n  .dashboard-topbar .top-bar .row {\n    max-width: none; }\n  .dashboard-topbar .top-bar form,.dashboard-topbar \n  .top-bar input {\n    margin-bottom: 0; }\n  .dashboard-topbar .top-bar input {\n    height: 2.45em; }\n  .dashboard-topbar .top-bar .button {\n    padding-top: .5em;\n    padding-bottom: .5em;\n    margin-bottom: 0; }\n  .dashboard-topbar .top-bar .title-area {\n    position: relative; }\n  .dashboard-topbar .top-bar .name {\n    height: 45px;\n    margin: 0;\n    font-size: 16px; }\n    .dashboard-topbar .top-bar .name h1 {\n      line-height: 45px;\n      font-size: 1.0625em;\n      margin: 0; }\n      .dashboard-topbar .top-bar .name h1 a {\n        font-weight: bold;\n        color: white;\n        width: 50%;\n        display: block;\n        padding: 0 15px; }\n  .dashboard-topbar .top-bar .toggle-topbar {\n    position: absolute;\n    right: 0;\n    top: 0; }\n    .dashboard-topbar .top-bar .toggle-topbar a {\n      color: white;\n      text-transform: uppercase;\n      font-size: 0.8125em;\n      font-weight: bold;\n      position: relative;\n      display: block;\n      padding: 0 15px;\n      height: 45px;\n      line-height: 45px; }\n    .dashboard-topbar .top-bar .toggle-topbar.menu-icon {\n      right: 15px;\n      top: 50%;\n      margin-top: -16px;\n      padding-left: 40px; }\n      .dashboard-topbar .top-bar .toggle-topbar.menu-icon a {\n        text-indent: -48px;\n        width: 34px;\n        height: 34px;\n        line-height: 33px;\n        padding: 0;\n        color: white; }\n        .dashboard-topbar .top-bar .toggle-topbar.menu-icon a span {\n          position: absolute;\n          right: 0;\n          display: block;\n          width: 16px;\n          height: 0;\n          -webkit-box-shadow: 0 10px 0 1px white, 0 16px 0 1px white, 0 22px 0 1px white;\n          box-shadow: 0 10px 0 1px white, 0 16px 0 1px white, 0 22px 0 1px white; }\n  .dashboard-topbar .top-bar.expanded {\n    height: auto;\n    background: transparent; }\n    .dashboard-topbar .top-bar.expanded .title-area {\n      background: #111111; }\n    .dashboard-topbar .top-bar.expanded .toggle-topbar a {\n      color: #888888; }\n      .dashboard-topbar .top-bar.expanded .toggle-topbar a span {\n        -webkit-box-shadow: 0 10px 0 1px #888888, 0 16px 0 1px #888888, 0 22px 0 1px #888888;\n        box-shadow: 0 10px 0 1px #888888, 0 16px 0 1px #888888, 0 22px 0 1px #888888; }\n\n.dashboard-topbar .top-bar-section {\n  left: 0;\n  position: relative;\n  width: auto;\n  -webkit-transition: left 300ms ease-out;\n  -moz-transition: left 300ms ease-out;\n  transition: left 300ms ease-out; }\n  .dashboard-topbar .top-bar-section ul {\n    width: 100%;\n    height: auto;\n    display: block;\n    background: #333333;\n    font-size: 16px;\n    margin: 0; }\n  .dashboard-topbar .top-bar-section .divider {\n    border-bottom: solid 1px #4d4d4d;\n    border-top: solid 1px #1a1a1a;\n    clear: both;\n    height: 1px;\n    width: 100%; }\n  .dashboard-topbar .top-bar-section ul li > a {\n    display: block;\n    width: 100%;\n    padding: 12px 0 12px 15px;\n    color: white;\n    font-size: 0.8125em;\n    font-weight: bold;\n    background: #333333; }\n    .dashboard-topbar .top-bar-section ul li > a:hover {\n      background: #2b2b2b; }\n    .dashboard-topbar .top-bar-section ul li > a.button {\n      background: #2ba6cb;\n      font-size: 0.8125em; }\n      .dashboard-topbar .top-bar-section ul li > a.button:hover {\n        background: #2284a1; }\n    .dashboard-topbar .top-bar-section ul li > a.button.secondary {\n      background: #e9e9e9; }\n      .dashboard-topbar .top-bar-section ul li > a.button.secondary:hover {\n        background: #d0d0d0; }\n    .dashboard-topbar .top-bar-section ul li > a.button.success {\n      background: #5da423; }\n      .dashboard-topbar .top-bar-section ul li > a.button.success:hover {\n        background: #457a1a; }\n    .dashboard-topbar .top-bar-section ul li > a.button.alert {\n      background: #c60f13; }\n      .dashboard-topbar .top-bar-section ul li > a.button.alert:hover {\n        background: #970b0e; }\n  .dashboard-topbar .top-bar-section ul li.active a {\n    background: #2b2b2b; }\n  .dashboard-topbar .top-bar-section .has-form {\n    padding: 15px; }\n  .dashboard-topbar .top-bar-section .has-dropdown {\n    position: relative; }\n    .dashboard-topbar .top-bar-section .has-dropdown > a:after {\n      content: "";\n      display: block;\n      width: 0;\n      height: 0;\n      border: solid 5px;\n      border-color: transparent transparent transparent rgba(255, 255, 255, 0.5);\n      margin-right: 15px;\n      margin-top: -4.5px;\n      position: absolute;\n      top: 50%;\n      right: 0; }\n    .dashboard-topbar .top-bar-section .has-dropdown.moved {\n      position: static; }\n      .dashboard-topbar .top-bar-section .has-dropdown.moved > .dropdown {\n        visibility: visible; }\n  .dashboard-topbar .top-bar-section .dropdown {\n    position: absolute;\n    left: 100%;\n    top: 0;\n    visibility: hidden;\n    z-index: 99; }\n    .dashboard-topbar .top-bar-section .dropdown li {\n      width: 100%; }\n      .dashboard-topbar .top-bar-section .dropdown li a {\n        font-weight: normal;\n        padding: 8px 15px; }\n    .dashboard-topbar .top-bar-section .dropdown label {\n      padding: 8px 15px 2px;\n      margin-bottom: 0;\n      text-transform: uppercase;\n      color: #555;\n      font-weight: bold;\n      font-size: 0.625em; }\n\n.dashboard-topbar .top-bar-js-breakpoint {\n  width: 58.75em !important;\n  visibility: hidden; }\n\n.dashboard-topbar .js-generated {\n  display: block; }\n\n@media only screen and (min-width: 58.75em) {\n  .dashboard-topbar .top-bar {\n    background: #111111;\n    *zoom: 1;\n    overflow: visible; }.dashboard-topbar \n    .top-bar:before,.dashboard-topbar  .top-bar:after {\n      content: " ";\n      display: table; }.dashboard-topbar \n    .top-bar:after {\n      clear: both; }.dashboard-topbar \n    .top-bar .toggle-topbar {\n      display: none; }.dashboard-topbar \n    .top-bar .title-area {\n      float: left; }.dashboard-topbar \n    .top-bar .name h1 a {\n      width: auto; }.dashboard-topbar \n    .top-bar input,.dashboard-topbar \n    .top-bar .button {\n      line-height: 2em;\n      font-size: 0.875em;\n      height: 2em;\n      padding: 0 10px;\n      position: relative;\n      top: 8px; }.dashboard-topbar \n    .top-bar.expanded {\n      background: #111111; }.dashboard-topbar \n\n  .contain-to-grid .top-bar {\n    max-width: 62.5em;\n    margin: 0 auto; }.dashboard-topbar \n\n  .top-bar-section {\n    -webkit-transition: none 0 0;\n    -moz-transition: none 0 0;\n    transition: none 0 0;\n    left: 0 !important; }.dashboard-topbar \n    .top-bar-section ul {\n      width: auto;\n      height: auto !important;\n      display: inline; }.dashboard-topbar \n      .top-bar-section ul li {\n        float: left; }.dashboard-topbar \n        .top-bar-section ul li .js-generated {\n          display: none; }.dashboard-topbar \n    .top-bar-section li a:not(.button) {\n      padding: 0 15px;\n      line-height: 45px;\n      background: #111111; }.dashboard-topbar \n      .top-bar-section li a:not(.button):hover {\n        background: #2b2b2b; }.dashboard-topbar \n    .top-bar-section .has-dropdown > a {\n      padding-right: 35px !important; }.dashboard-topbar \n      .top-bar-section .has-dropdown > a:after {\n        content: "";\n        display: block;\n        width: 0;\n        height: 0;\n        border: solid 5px;\n        border-color: rgba(255, 255, 255, 0.5) transparent transparent transparent;\n        margin-top: -2.5px; }.dashboard-topbar \n    .top-bar-section .has-dropdown.moved {\n      position: relative; }.dashboard-topbar \n      .top-bar-section .has-dropdown.moved > .dropdown {\n        visibility: hidden; }.dashboard-topbar \n    .top-bar-section .has-dropdown:hover > .dropdown,.dashboard-topbar  .top-bar-section .has-dropdown:active > .dropdown {\n      visibility: visible; }.dashboard-topbar \n    .top-bar-section .has-dropdown .dropdown li.has-dropdown > a:after {\n      border: none;\n      content: "\\00bb";\n      margin-top: -7px;\n      right: 5px; }.dashboard-topbar \n    .top-bar-section .dropdown {\n      left: 0;\n      top: auto;\n      background: transparent; }.dashboard-topbar \n      .top-bar-section .dropdown li a {\n        line-height: 1;\n        white-space: nowrap;\n        padding: 7px 15px;\n        background: #1e1e1e; }.dashboard-topbar \n      .top-bar-section .dropdown li label {\n        white-space: nowrap;\n        background: #1e1e1e; }.dashboard-topbar \n      .top-bar-section .dropdown li .dropdown {\n        left: 100%;\n        top: 0; }.dashboard-topbar \n    .top-bar-section > ul > .divider {\n      border-bottom: none;\n      border-top: none;\n      border-right: solid 1px #2b2b2b;\n      border-left: solid 1px black;\n      clear: none;\n      height: 45px;\n      width: 0px; }.dashboard-topbar \n    .top-bar-section .has-form {\n      background: #111111;\n      padding: 0 15px;\n      height: 45px; }.dashboard-topbar \n    .top-bar-section ul.right li .dropdown {\n      left: auto;\n      right: 0; }.dashboard-topbar \n      .top-bar-section ul.right li .dropdown li .dropdown {\n        right: 100%; } }\n\n.dashboard-topbar *,.dashboard-topbar \n*:before,.dashboard-topbar \n*:after {\n  -moz-box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box; }\n\n.dashboard-topbar html,.dashboard-topbar \nbody {\n  font-size: 16px; }\n\n.dashboard-topbar body {\n  background: white;\n  color: #222222;\n  padding: 0;\n  margin: 0;\n  font-family: "Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif;\n  font-weight: normal;\n  font-style: normal;\n  line-height: 1;\n  position: relative;\n  -webkit-font-smoothing: antialiased; }\n\n.dashboard-topbar img,.dashboard-topbar \nobject,.dashboard-topbar \nembed {\n  max-width: 100%;\n  height: auto; }\n\n.dashboard-topbar object,.dashboard-topbar \nembed {\n  height: 100%; }\n\n.dashboard-topbar img {\n  -ms-interpolation-mode: bicubic; }\n\n.dashboard-topbar #map_canvas img,.dashboard-topbar \n#map_canvas embed,.dashboard-topbar \n#map_canvas object,.dashboard-topbar \n.map_canvas img,.dashboard-topbar \n.map_canvas embed,.dashboard-topbar \n.map_canvas object {\n  max-width: none !important; }\n\n.dashboard-topbar .left {\n  float: left; }\n\n.dashboard-topbar .right {\n  float: right; }\n\n.dashboard-topbar .text-left {\n  text-align: left; }\n\n.dashboard-topbar .text-right {\n  text-align: right; }\n\n.dashboard-topbar .text-center {\n  text-align: center; }\n\n.dashboard-topbar .text-justify {\n  text-align: justify; }\n\n.dashboard-topbar .hide {\n  display: none; }\n\n.dashboard-topbar img {\n  display: block; }\n\n.dashboard-topbar textarea {\n  height: auto;\n  min-height: 50px; }\n\n.dashboard-topbar select {\n  width: 100%; }\n\n@media only screen and (max-width: 767px) {\n  .dashboard-topbar .f-dropdown {\n    max-width: 100%;\n    left: 0; } }\n/* Foundation Dropdowns */\n.dashboard-topbar .f-dropdown {\n  position: absolute;\n  left: -9999px;\n  top: -9999px;\n  list-style: none;\n  width: 100%;\n  max-height: none;\n  height: auto;\n  background: white;\n  border: solid 1px #cccccc;\n  font-size: 16px;\n  z-index: 99;\n  margin-top: 2px;\n  max-width: 200px; }\n  .dashboard-topbar .f-dropdown *:first-child {\n    margin-top: 0; }\n  .dashboard-topbar .f-dropdown *:last-child {\n    margin-bottom: 0; }\n  .dashboard-topbar .f-dropdown:before {\n    content: "";\n    display: block;\n    width: 0;\n    height: 0;\n    border: solid 6px;\n    border-color: transparent transparent white transparent;\n    position: absolute;\n    top: -12px;\n    left: 10px;\n    z-index: 99; }\n  .dashboard-topbar .f-dropdown:after {\n    content: "";\n    display: block;\n    width: 0;\n    height: 0;\n    border: solid 7px;\n    border-color: transparent transparent #cccccc transparent;\n    position: absolute;\n    top: -14px;\n    left: 9px;\n    z-index: 98; }\n  .dashboard-topbar .f-dropdown li {\n    font-size: 0.875em;\n    cursor: pointer;\n    padding: 0.3125em 0.625em;\n    line-height: 1.125em;\n    margin: 0; }\n    .dashboard-topbar .f-dropdown li:hover,.dashboard-topbar  .f-dropdown li:focus {\n      background: #eeeeee; }\n    .dashboard-topbar .f-dropdown li a {\n      color: #555555; }\n  .dashboard-topbar .f-dropdown.content {\n    position: absolute;\n    left: -9999px;\n    top: -9999px;\n    list-style: none;\n    padding: 1.25em;\n    width: 100%;\n    height: auto;\n    max-height: none;\n    background: white;\n    border: solid 1px #cccccc;\n    font-size: 16px;\n    z-index: 99;\n    max-width: 200px; }\n    .dashboard-topbar .f-dropdown.content *:first-child {\n      margin-top: 0; }\n    .dashboard-topbar .f-dropdown.content *:last-child {\n      margin-bottom: 0; }\n  .dashboard-topbar .f-dropdown.tiny {\n    max-width: 200px; }\n  .dashboard-topbar .f-dropdown.small {\n    max-width: 300px; }\n  .dashboard-topbar .f-dropdown.medium {\n    max-width: 500px; }\n  .dashboard-topbar .f-dropdown.large {\n    max-width: 800px; }\n\n.dashboard-topbar .f-dropdown.reverse:after {\n  left: auto !important;\n  right: 9px !important;\n}\n\n.dashboard-topbar .f-dropdown.reverse:before {\n  left: auto !important;\n  right: 10px !important;\n}\n\n\n.alertify-cover {\n  position: fixed;\n  z-index: 9999;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: 0; }\n\n.alertify-dialog {\n  position: fixed;\n  z-index: 99999;\n  top: 50px;\n  left: 50%;\n  opacity: 1;\n  -webkit-transition: all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);\n  -moz-transition: all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);\n  -ms-transition: all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);\n  -o-transition: all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);\n  transition: all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275); }\n\n.alertify-resetFocus {\n  border: 0;\n  clip: rect(0 0 0 0);\n  height: 1px;\n  width: 1px;\n  margin: -1px;\n  padding: 0;\n  overflow: hidden;\n  position: absolute; }\n\n.alertify-text {\n  margin-bottom: 15px;\n  width: 100%;\n  font-size: 100%;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box; }\n\n.alertify-button,\n.alertify-button:hover,\n.alertify-button:active,\n.alertify-button:visited {\n  background: none;\n  text-decoration: none;\n  border: none;\n  line-height: 1.5;\n  font-size: 100%;\n  display: inline-block;\n  cursor: pointer;\n  margin-left: 5px; }\n\n.is-alertify-cover-hidden {\n  display: none; }\n\n.is-alertify-dialog-hidden {\n  opacity: 0;\n  display: none;\n  -webkit-transform: translate(0, -150px);\n  -moz-transform: translate(0, -150px);\n  -ms-transform: translate(0, -150px);\n  -o-transform: translate(0, -150px);\n  transform: translate(0, -150px); }\n\n:root * > .is-alertify-dialog-hidden {\n  display: block; }\n\n.alertify-logs {\n  position: fixed;\n  z-index: 9999; }\n\n.alertify-log {\n  position: relative;\n  display: block;\n  opacity: 0;\n  -webkit-transition: all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);\n  -moz-transition: all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);\n  -ms-transition: all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);\n  -o-transition: all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);\n  transition: all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275); }\n\n.is-alertify-log-showing {\n  opacity: 1; }\n\n.is-alertify-log-hidden {\n  opacity: 0; }\n\n.alertify-dialog {\n  width: 550px;\n  margin-left: -275px;\n  background: #FFF;\n  border: 10px solid #333333;\n  border: 10px solid rgba(0, 0, 0, 0.7);\n  border-radius: 8px;\n  box-shadow: 0 3px 3px rgba(0, 0, 0, 0.3);\n  -webkit-background-clip: padding;\n  -moz-background-clip: padding;\n  background-clip: padding-box; }\n\n.alertify-dialog-inner {\n  padding: 25px; }\n\n.alertify-inner {\n  text-align: center; }\n\n.alertify-text {\n  border: 1px solid #cccccc;\n  padding: 10px;\n  border-radius: 4px; }\n\n.alertify-button {\n  border-radius: 4px;\n  color: #FFF;\n  font-weight: bold;\n  padding: 6px 15px;\n  text-decoration: none;\n  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.5);\n  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.5);\n  background-image: -webkit-linear-gradient(top, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));\n  background-image:    -moz-linear-gradient(top, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));\n  background-image:     -ms-linear-gradient(top, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));\n  background-image:      -o-linear-gradient(top, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));\n  background-image:         linear-gradient(top, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0)); }\n\n.alertify-button:hover,\n.alertify-button:focus {\n  outline: none;\n  background-image: -webkit-linear-gradient(top, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0));\n  background-image:    -moz-linear-gradient(top, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0));\n  background-image:     -ms-linear-gradient(top, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0));\n  background-image:      -o-linear-gradient(top, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0));\n  background-image:         linear-gradient(top, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0)); }\n\n.alertify-button:focus {\n  box-shadow: 0 0 10px #2b72d5; }\n\n.alertify-button:active {\n  position: relative;\n  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.05); }\n\n.alertify-button-cancel,\n.alertify-button-cancel:hover,\n.alertify-button-cancel:focus {\n  background-color: #fe1a00;\n  border: 1px solid #cb1500; }\n\n.alertify-button-ok,\n.alertify-button-ok:hover,\n.alertify-button-ok:focus {\n  background-color: #5cb811;\n  border: 1px solid #45890d; }\n\n@media only screen and (max-width: 680px) {\n  .alertify-dialog {\n    width: 90%;\n    left: 5%;\n    margin: 0;\n    -webkit-box-sizing: border-box;\n    -moz-box-sizing: border-box;\n    box-sizing: border-box; } }\n.alertify-logs {\n  position: fixed;\n  z-index: 9999;\n  bottom: 8px;\n  right: 8px;\n  width: 300px; }\n\n.alertify-log {\n  margin-top: 8px;\n  right: -300px;\n  padding: 16px 16px;\n  border-radius: 4px; }\n\n.alertify-log-info {\n  background: #1F1F1F;\n  background: rgba(0, 0, 0, 0.9);\n  color: #FFF;\n  text-shadow: -1px -1px 0 rgba(0, 0, 0, 0.5); }\n\n.alertify-log-error {\n  color: #FFF;\n  background: #FE1A00;\n  background: rgba(254, 26, 0, 0.9); }\n\n.alertify-log-success {\n  color: #FFF;\n  background: #5CB811;\n  background: rgba(92, 184, 17, 0.9); }\n\n.is-alertify-log-showing {\n  right: 0; }\n\n.is-alertify-log-hidden {\n  right: -300px; }\n'
  }));

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(['bowser'],factory);
    } else {
        root.garden_menu_widget_css = factory(root.bowser);
    }
}(this, function (bowser) {

function getTopbarBackground(from, to) {
    // also check version
    if (bowser.webkit) return '-webkit-linear-gradient('+from+','+to+')';
    if (bowser.opera ) return '-o-linear-gradient('+from+','+to+')';
    if (bowser.mozilla) return '-moz-linear-gradient('+from+','+to+')';
    return 'linear-gradient('+from+','+to+')';
}


var css =  {

// These are missing from the foundation css, but seem to be needed:

'#dashboard-topbar' : {
    'color': '#222222',
    'font-family': '"Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif',
    'font-weight': 'normal',
    'font-style': 'normal',
    'font-size': '16px',
    '-webkit-font-smoothing': 'antialiased',
    'text-shadow': 'none',
    'z-index': '10000'
},


'.dashboard-topbar div, .dashboard-topbar dl, .dashboard-topbar dt, .dashboard-topbar dd, .dashboard-topbar ul, .dashboard-topbar ol, .dashboard-topbar li, .dashboard-topbar h1, .dashboard-topbar h2, .dashboard-topbar h3, .dashboard-topbar h4, .dashboard-topbar h5, .dashboard-topbar h6' : {
    'margin': '0',
    'padding': '0',
    'direction': 'ltr'
},

'#dashboard-topbar .top-bar-section .right': {
    'background-color': '#111111',
    'position': 'absolute',
    'top': '0px',
    'right': '0px'
},

'#dashboard-topbar .top-bar.expanded .top-bar-section .right': {
    'background-color': '#333333',
    'position': 'relative'
},


'#dashboard-topbar a' : {
  'text-decoration': 'none',
  'text-shadow': 'none'
},
'#dashboard-topbar a img': {
    'border': 'none'
},

// fix for current futon
'#dashboard-topbar .top-bar .name h1 a' : {
    'background': 'none'
},

'#dashboard-topbar .top-bar .name h1' : {
    'background': 'none',
    'border': 'none'
},


'#dashboard-topbar-offline-icon' : {
    'cursor': 'pointer',
    'padding': '0 5px',
    'height': '45px'

},

'#dashboard-topbar-offline-icon:hover' : {

},

'#dashboard-topbar-offline-icon svg' : {
    'margin-top': '12px',
    'shape-rendering': 'auto',

    // overcome some bootstrap stuff
    'width': 'auto'

    // 'position': 'relative',
    // 'top': '2px',
    // 'left': '2px'
},

'#dashboard-profile a.profile-link' : {
    'cursor': 'pointer',
    'height': '45px'
},

'#dashboard-profile a.profile-link img': {
    'float' : 'left',
    'top': '12px',
    'position': 'relative',
    'margin-right': '5px'
},

'#dashboard-profile a.profile-link span': {
    'float' : 'right'
},

'#initGarden-drop': {
    'text-align': 'center'
},
'#initGarden-drop button': {
    display: 'block',
    width: '94px',
    'margin-right': 'auto',
    'margin-left': 'auto',
    'margin-top': '5px',
    'margin-bottom': '15px',
    'font-size': '11px'
}

};  // end of css block


return function(options) {
    if (options.position) {
        css['#dashboard-topbar'].position = options.position;
    }
    if (options.position === 'fixed') {
        css['#dashboard-topbar'].top = "0";
        css['#dashboard-topbar'].width = "100%";
        css['#dashboard-topbar']['z-index'] = "10000";
    }
    return css;
};


}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            'jquery',
            'underscore',
            'events',
            'url',
            'garden-menu',
            'jscss',
            './src/garden-menu-widget.css.js',
            './dist/compiled_css.js',
            'modernizer',
            'bowser',
            'svg',
            'sync-status-icon'
        ],factory);
    } else {
        root.garden_menu_widget = factory(
            root.Zepto,
            root._,
            root.events,
            root.url,
            root.garden_menu,
            root.garden_default_settings,
            root.jscss,
            root.garden_menu_widget_css,
            root.garden_menu_widget_extra_css,
            root.Modernizr,
            root.bowser,
            root.svg,
            root.SyncIcon,
            root.JST["templates/topbar.underscore"],
            root.JST["templates/profile.underscore"]
        );
    }
}(this, function ($, _, events, url, GardenMenu, garden_settings, jscss, css, extra_css, Modernizr, bowser, svg, SyncIcon, topbar_t, profile_t) {


var app = function(dashboard_db_url, options) {
    if (!options) options = {};
    this.dashboard_db_url = dashboard_db_url;

    var defaults = {};

    // adjust defaults for pouch based on env
    if (Modernizr.indexeddb || Modernizr.websqldatabase) {
        defaults.disablePouch = false;
    }
    // also check version
    if (bowser.firefox && bowser.version < 12) {
        defaults.disablePouch= true;
    }
    if (bowser.opera && bowser.version < 12) {
        defaults.disablePouch= true;
    }
    if (bowser.chrome && bowser.version < 19) {
        defaults.disablePouch= true;
    }
    if (bowser.safari && bowser.version <= 5) {
        defaults.disablePouch= true;
    }
    if (bowser.iphone && bowser.version <= 5) {
        defaults.disablePouch= true;
    }

    this.options = _.extend(defaults, options);
    this.emitter = new events.EventEmitter();
    this.garden_menu = new GardenMenu(dashboard_db_url, this.options);
};


app.prototype.init = function(callback) {
    var widget = this;
    widget.last_state = null;
    widget.garden_menu.init(function(err, results){


        widget.core = results.core;
        widget.garden_menu.getAppLinks(function(err, links){

            if (err) return callback(err);

            // the final merge. Priority ends up (from highest to lowest)
            //   1. The db settings doc
            //   2. Any options passed into the new garden-menu-widget(...,options)
            //   3. The garden-default-settings js module
            widget.finalSettings = {};
            _.extend(widget.finalSettings, garden_settings.top_nav_bar, links.settingsDoc.top_nav_bar, widget.options);

            widget.loadTopbar(links, function(err){

                if (widget.finalSettings.showSession) {
                    widget.cachedLinks = links;
                    widget.core.getCachedSession(function(err, session){
                        widget.last_user = session.userCtx.name;
                        widget.showSession(session);
                    });

                    widget.poll_interval = setInterval(function() { widget.poll(); }, 10000);
                }

                callback(err);
            });
        });
    });
};


app.prototype.poll = function() {
    this.core.poll();
};

// emitter things..
app.prototype.on = function(event, listener) {
    this.emitter.on(event, listener);
};

app.prototype.once = function(event, listener) {
    this.emitter.once(event, listener);
};

app.prototype.removeListener = function(event, listener) {
    this.emitter.removeListener(event, listener);
};


app.prototype.loadTopbar = function(data, callback) {
    var me = this;



    jscss.embed(extra_css);

    // the computed styles always win
    jscss.embed(jscss.compile(css(me.finalSettings)));

    var $topbar = $('#dashboard-topbar');
    if ($topbar.length === 0) {
        $topbar = $('<div id="dashboard-topbar"></div>');
        $(me.finalSettings.divSelector).prepend($topbar);
    }

    // for the new foundation prefixed stuff
    $topbar.addClass('dashboard-topbar');

    if(data.apps.length === 0 && data.no_db_file && me.finalSettings.defaultAppName) {
        // show an *app* at the current url. Useful for non loaded gardens!
        data.defaultApp = {
            link: window.location.pathname,
            title: me.finalSettings.defaultAppName
        };
    }
    $topbar.html(topbar_t({data: data, options: me.finalSettings } ));

    try {
        $(document).foundation();
    } catch(e) {
        // so hacky. Depending how the user did the scripts, foundation might be
        // bound to jquery on the window scope
        window.$(document).foundation();
    }

    var path = window.location.pathname;

    // current futon hack. Remove when fauxton is ready
    if (path.indexOf('/_utils/') === 0) {
        $('#footer').css('bottom', '20px');
    }



    // highlight the best thing
    var dash = $topbar.find('a.home').attr('href');
    if (dash == path)  $topbar.find('a.home').addClass('active');

    var login = $topbar.find('#dashboard-topbar-session a').attr('href');
    if (login == path)  $topbar.find('#dashboard-topbar-session').addClass('active');

    /**
     *  does a head check to the db. before allowing the link to pass.
     * This double checks the user can login to the link.
     * THis is to prevent the dreaded json error.
     * @param link
     */
    var addNotLoggedInHack = function(link) {
        var db = link.data('db');
        if (db) {

            // only if online check the head
            $(link).bind('click', function(){
                var state = me.core.getState();
                if (state.indexOf('OFFLINE') === 0) return true;

               $(this).removeClass('hover');
                var pass;
                $.ajax({
                    url : '/dashboard/_design/dashboard/_rewrite/_couch/' + db,
                     type: 'HEAD',
                     dataType: 'json',
                     cache: "false",
                     async: false,
                     success: function(data, a){
                        pass = true;
                     },
                     error  : function(err, b, c) {
                        pass = false;
                        app.log('Access Denied.', {type: 'error'});
                     }

                 });
                return pass;

            });
        }
    };

    $('#dashboard-topbar ul.kanso-nav li').each(function(i) {
        var link = $(this).find('a');
        var href = link.attr('href');
        if ($(this).hasClass('home')) {
            if (href == path){
                $(this).addClass('active');
                link.addClass('active');
            }
        } else {
            if (path.indexOf(href) === 0) {
                $(this).addClass('active');
                link.addClass('active');
            }
            addNotLoggedInHack(link);
        }
    });

    $('#dashboard-topbar a').each(function(){
        var $a = $(this);
        var href = $a.attr('href');
        if ((path.indexOf(href) === 0 ) && ($a.data('remote_user_warn')) ){
            var remote_user = $a.data('remote_user');
            setTimeout(function(){
                if(confirm('Warning: The recommended user for this db is '+remote_user+'. Do you want to login as that user?')) {
                    window.location = $('#dashboard-topbar-session').data('login') + "?redirect=" + encodeURIComponent(window.location) + '&user=' + encodeURIComponent(remote_user);
                }
            }, 10);
        }
    });

    $('#dashboard-topbar .more-apps').click(function(){
        var me = $(this);
        var menu = $('#dashboard-more-apps');

        var left = me.position().left;
        menu.css('left', left + 'px').toggle(0, function(){
            if (menu.is(':visible')) me.addClass('dashboard-menu-highlight');
            else me.removeClass('dashboard-menu-highlight');
        });
        $(document).one('click', function() {
            me.removeClass('dashboard-menu-highlight');
            $('#dashboard-more-apps').hide();
        });
        return false;
    });



    $('#dashboard-topbar .logout').click(logout);

    $('#initGarden-drop button').live('click', function(){

    });



    if (!me.finalSettings.disablePouch && !data.no_db_file) {
        // add a sync icon
        me.sync_icon = new SyncIcon('dashboard-topbar-offline-icon', {
            size: 21,
            state: mapCoreStatesToDisplay(me.core.getState())
        });


        // bind state changes.
        me.core.bind(function(event, old_state, new_state) {
            // filter some chaff
            if ((old_state !== 'FIRST_VISIT' && new_state !=='FIRST_VISIT') && (me.last_state === new_state)) return;


            // show the sync state
            var display_state = mapCoreStatesToDisplay(new_state);
            if (new_state === 'FIRST_VISIT' && me.sync_icon.getState() === 'syncing') {
                // not sure... for now do nothing...
            } else {
                me.sync_icon[display_state]();
            }

            me.core.getCachedSession(function(err, session){
                if (session.userCtx.name === me.last_user) return;
                me.showSession(session);
                me.last_user = session.userCtx.name;
            });
            me.last_state = new_state;
        });

        // on click on sync icon
        $('#dashboard-topbar-offline-icon').click(function(){
            var state = me.core.getState();
            if (state === 'FIRST_VISIT') {
                me.sync_icon.syncing();
                me.core.sync();
            }
        });
    } else {
        $('#dashboard-topbar-offline-icon').hide();
    }

    if (callback) callback(null);
    $topbar.data('ready', true);
    this.emitter.emit('loaded');
};


app.prototype.showSession = function(session) {


    session.is_user = (session.userCtx.name || false);

    session.displayName = session.userCtx.name;
    session.login_url = this.cachedLinks.login_url;

    session.login_url = session.login_url + "?redirect=" + encodeURIComponent(window.location);

    $('#dashboard-profile').html(profile_t(session));
};



function mapCoreStatesToDisplay(core_state) {
        if (core_state === 'FIRST_VISIT') return "disabled";
        if (core_state === 'OFFLINE_NO_HOPE') return "disabled";
        if (core_state === 'READY_LOCAL_DB_UNSUPPORTED') return "disabled";
        if (core_state === 'OFFLINE_WITH_USER') return "offline";
        if (core_state === 'OFFLINE_WITHOUT_USER') return "offline";
        if (core_state === 'ONLINE_WITH_USER') return "online";
        if (core_state === 'ONLINE_WITHOUT_USER') return "online";
}


function logout() {
    // only if online


    $.ajax({
        url : '/dashboard/_design/dashboard/_rewrite/_couch/_session',
        type: 'DELETE',
        dataType: 'json',
        success: function(){
            var isOkToReload = checkLogoutDestination();
            if (isOkToReload) {
                window.location.reload();
            } else {
                window.location = $('#dashboard-topbar-session').data('login');
            }
        },
        error  : function() {
            app.alert('error loging out.');
        }
     });
    return false;
}


function checkLogoutDestination() {
    var pass;
    $.ajax({
        url : window.location,
        type: 'HEAD',
        async: false,
        success: function(data){
            pass = true;
        },
        error  : function() {
            pass = false;
        }

    });
    return pass;
}





// stuff for notifications
app.log = function(msg, options) {
    var type = 'success';
    if (options && options.type) type = options.type;

   window.Alertify.log[type](msg);
};

app.alert = function(msg, options) {
    window.Alertify.dialog.alert(msg);
};


return app;

}));
var root_url = window.location,
    db = url.resolve(root_url, '/dashboard'),
    // the hardcoded, pre agreed location of this script.
    scriptName = "topbar.js";


var queryOptions = findScriptParams();

//this.$ = window.Zepto;

window.garden_ui = new garden_menu_widget(db, queryOptions);
window.garden_ui.init(function(err){

});



// get querystring params from this
function findScriptParams() {
    var links = $('script');
    var results = {};
    $.each(links, function(i, script){
        var src = $(script).attr('src');
        if (src) {

            var param =  src.split('?');
            if (!endsWith(param[0], scriptName)) return;
            if (param[1]) {
                results = parseQueryString(param[1]);
            }
        }
    });
    return results;
}


function parseQueryString(str){
  if ('string' != typeof str) return {};
  str = trim(str);
  if ('' === str) return {};
  return reduce(str.split('&'), function(obj, pair){
    var parts = pair.split('=');
    obj[parts[0]] = null === parts[1] ? '' : decodeURIComponent(parts[1]);
    return obj;
  }, {});
}

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

function reduce(arr, fn, initial){
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3 ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }

  return curr;
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

if (mlt==='r') {exports=ml;} if (mlt==='a'){define=ml;} })() 
