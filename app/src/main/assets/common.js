/**
 * file: mod.js
 * ver: 1.1.0
 * update: 2015/01/29
 * 基于fis mod 修改
 * https://github.com/fex-team/mod
 */
var require, define;

(function(global) {
    var head = document.getElementsByTagName('head')[0],
        loadingMap = {},
        factoryMap = {},
        modulesMap = {},
        scriptsMap = {},
        resMap = {},
        pkgMap = {};

    function createScript(url, onerror) {
        if (url in scriptsMap) return;
        scriptsMap[url] = true;

        var script = document.createElement('script');
        if (onerror) {
            var tid = setTimeout(onerror, require.timeout);

            script.onerror = function() {
                clearTimeout(tid);
                onerror();
            };

            function onload() {
                clearTimeout(tid);
            }

            if ('onload' in script) {
                script.onload = onload;
            }
            else {
                script.onreadystatechange = function() {
                    if (this.readyState == 'loaded' || this.readyState == 'complete') {
                        onload();
                    }
                }
            }
        }
        script.type = 'text/javascript';
        script.src = url;
        head.appendChild(script);
        return script;
    }

    function loadScript(id, callback, onerror) {
        var queue = loadingMap[id] || (loadingMap[id] = []);
        queue.push(callback);

        //
        // resource map query
        //
        var res = resMap[id] || {};
        var pkg = res.pkg;
        var url;

        if (pkg) {
            url = pkgMap[pkg].url;
        } else {
            url = res.url || id;
        }

        createScript(url, onerror && function() {
            onerror(id);
        });
    }

    define = function(id, factory) {
        factoryMap[id] = factory;

        var queue = loadingMap[id];
        if (queue) {
            for(var i = 0, n = queue.length; i < n; i++) {
                queue[i]();
            }
            // delete loadingMap[id];
            loadingMap[id] = null;
        }
    };

    require = function(id) {

        // compatible with require([dep, dep2...]) syntax.
        if (id && id.splice) {
            return require.async.apply(this, arguments);
        }

        id = require.alias(id);

        var mod = modulesMap[id];
        if (mod) {
            return mod.exports;
        }

        //
        // init module
        //
        var factory = factoryMap[id];
        if (!factory) {
            throw '[ModJS] Cannot find module `' + id + '`';
        }

        mod = modulesMap[id] = {
            exports: {}
        };

        //
        // factory: function OR value
        //
        var ret = (typeof factory == 'function')
                ? factory.apply(mod, [require, mod.exports, mod])
                : factory;

        if (ret) {
            mod.exports = ret;
        }
        return mod.exports;
    };

    require.async = function(names, onload, onerror) {
        if (typeof names == 'string') {
            names = [names];
        }

        for(var i = 0, n = names.length; i < n; i++) {
            names[i] = require.alias(names[i]);
        }

        var needMap = {};
        var needNum = 0;

        function findNeed(depArr) {
            for(var i = 0, n = depArr.length; i < n; i++) {
                //
                // skip loading or loaded
                //
                var dep = depArr[i];

                if (dep in factoryMap){
                    // check whether loaded resource's deps is loaded or not
                    var child = resMap[dep];
                    if (child && 'deps' in child) {
                        findNeed(child.deps);
                    }
                    continue;
                }

                if (dep in needMap) {
                    continue;
                }

                needMap[dep] = true;
                needNum++;
                if(!/\.css$/.test(dep)) {
                    loadScript(dep, updateNeed, onerror);
                } else {
                    // todo 抽离loadCss
                    var res = resMap[dep] || {};
                    var url = res.url || dep;
                    require.loadCss({url: url});
                    updateNeed();
                }

                var child = resMap[dep];
                if (child && 'deps' in child) {
                    findNeed(child.deps);
                }
            }
        }

        function updateNeed() {
            if (0 == needNum--) {
                var args = [];
                for(var i = 0, n = names.length; i < n; i++) {
                    args[i] = require(names[i]);
                }

                onload && onload.apply(global, args);
            }
        }

        findNeed(names);
        updateNeed();
    };

    require.resourceMap = function(obj) {
        var k, col;

        // merge `res` & `pkg` fields
        col = obj.res;
        for(k in col) {
            if (col.hasOwnProperty(k)) {
                resMap[k] = col[k];
            }
        }

        col = obj.pkg;
        for(k in col) {
            if (col.hasOwnProperty(k)) {
                pkgMap[k] = col[k];
            }
        }
    };

    require.loadJs = function(url) {
        createScript(url);
    };

    require.loadCss = function(cfg) {
        if (cfg.content) {
            var sty = document.createElement('style');
            sty.type = 'text/css';
            sty.innerHTML = cfg.content;
            head.appendChild(sty);
        }
        else if (cfg.url) {
            var link = document.createElement('link');
            link.href = cfg.url;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            head.appendChild(link);
        }
    };


    require.alias = function(id) {return id};

    require.timeout = 5000;

})(this);
;/* Zepto v1.1.6 - zepto event ajax form ie - zeptojs.com/license */

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

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
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||
      function(object){ return object instanceof Array }

  zepto.matches = function(element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
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
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }
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
    var dom, nodes, container

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this)
      })
    }

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
    var dom
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // Optimize for string selectors
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
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
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)
    return (isDocument(element) && isSimple && maybeID) ?
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
      slice.call(
        isSimple && !maybeID ?
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = document.documentElement.contains ?
    function(parent, node) {
      return parent !== node && parent.contains(node)
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className || '',
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
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
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

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
      // need to check if document.body exists for IE as that browser reports
      // document ready when it hasn't yet created the body element
      if (readyRE.test(document.readyState) && document.body) callback($)
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
      if (!selector) result = $()
      else if (typeof selector == 'object')
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
        this.style.display == "none" && (this.style.display = '')
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
      return 0 in arguments ?
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    text: function(text){
      return 0 in arguments ?
        this.each(function(idx){
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : ''+newText
        }) :
        (0 in this ? this[0].textContent : null)
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && !(1 in arguments)) ?
        (!this.length || this[0].nodeType !== 1 ? undefined :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
        setAttribute(this, attribute)
      }, this)})
    },
    prop: function(name, value){
      name = propMap[name] || name
      return (1 in arguments) ?
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        }) :
        (this[0] && this[0][name])
    },
    data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)

      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      return 0 in arguments ?
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        }) :
        (this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
        )
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
      if (!this.length) return null
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2) {
        var computedStyle, element = this[0]
        if(!element) return
        computedStyle = getComputedStyle(element, '')
        if (typeof property == 'string')
          return element.style[camelize(property)] || computedStyle.getPropertyValue(property)
        else if (isArray(property)) {
          var props = {}
          $.each(property, function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

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
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        if (!('className' in this)) return
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
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value } :
        function(){ this.scrollTo(this.scrollX, value) })
    },
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value } :
        function(){ this.scrollTo(value, this.scrollY) })
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
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() })

    $.fn[dimension] = function(value){
      var offset, el = this[0]
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun)
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

        var parentInDocument = $.contains(document.documentElement, parent)

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target)
          if (parentInDocument) traverseNode(node, function(el){
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
window.$ === undefined && (window.$ = Zepto)

;(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
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

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = delegator
      var callback  = delegator || fn
      handler.proxy = function(e){
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2)
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  }
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  }
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name]
        event[name] = function(){
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined
    if (isFunction(data) || data === false)
      callback = data, data = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback)
        return callback.apply(this, arguments)
      }

      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }
  $.fn.off = function(event, selector, callback){
    var $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function(){
      // handle focus(), blur() by calling them directly
      if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
      // items in the collection might not be DOM elements
      else if ('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, args){
    var e, result
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout focus blur load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return (0 in arguments) ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true)
    return compatible(event)
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
      blankRE = /^\s*$/,
      originAnchor = document.createElement('a')

  originAnchor.href = window.location.href

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.isDefaultPrevented()
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
  function ajaxSuccess(data, xhr, settings, deferred) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    if (deferred) deferred.resolveWith(context, [data, status, xhr])
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings, deferred) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    if (deferred) deferred.rejectWith(context, [xhr, type, error])
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
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

  $.ajaxJSONP = function(options, deferred){
    if (!('type' in options)) return $.ajax(options)

    var _callbackName = options.jsonpCallback,
      callbackName = ($.isFunction(_callbackName) ?
        _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
      script = document.createElement('script'),
      originalCallback = window[callbackName],
      responseData,
      abort = function(errorType) {
        $(script).triggerHandler('error', errorType || 'abort')
      },
      xhr = { abort: abort }, abortTimeout

    if (deferred) deferred.promise(xhr)

    $(script).on('load error', function(e, errorType){
      clearTimeout(abortTimeout)
      $(script).off().remove()

      if (e.type == 'error' || !responseData) {
        ajaxError(null, errorType || 'error', xhr, options, deferred)
      } else {
        ajaxSuccess(responseData[0], xhr, options, deferred)
      }

      window[callbackName] = originalCallback
      if (responseData && $.isFunction(originalCallback))
        originalCallback(responseData[0])

      originalCallback = responseData = undefined
    })

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return xhr
    }

    window[callbackName] = function(){
      responseData = arguments
    }

    script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
    document.head.appendChild(script)

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
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
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
    cache: true
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    if (query == '') return url
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data), options.data = undefined
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred(),
        urlAnchor
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) {
      urlAnchor = document.createElement('a')
      urlAnchor.href = settings.url
      urlAnchor.href = urlAnchor.href
      settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host)
    }

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)

    var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)
    if (hasPlaceholder) dataType = 'jsonp'

    if (settings.cache === false || (
         (!options || options.cache !== true) &&
         ('script' == dataType || 'jsonp' == dataType)
        ))
      settings.url = appendQuery(settings.url, '_=' + Date.now())

    if ('jsonp' == dataType) {
      if (!hasPlaceholder)
        settings.url = appendQuery(settings.url,
          settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
      return $.ajaxJSONP(settings, deferred)
    }

    var mime = settings.accepts[dataType],
        headers = { },
        setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value] },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

    if (deferred) deferred.promise(xhr)

    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
    setHeader('Accept', mime || '*/*')
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
    xhr.setRequestHeader = setHeader

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script')    (1,eval)(result)
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings, deferred)
          else ajaxSuccess(result, xhr, settings, deferred)
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
        }
      }
    }

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      ajaxError(null, 'abort', xhr, settings, deferred)
      return xhr
    }

    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async, settings.username, settings.password)

    for (name in headers) nativeSetHeader.apply(xhr, headers[name])

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    if ($.isFunction(data)) dataType = success, success = data, data = undefined
    if (!$.isFunction(success)) dataType = success, success = undefined
    return {
      url: url
    , data: data
    , success: success
    , dataType: dataType
    }
  }

  $.get = function(/* url, data, success, dataType */){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(/* url, data, success, dataType */){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(/* url, data, success */){
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
    var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope :
        scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
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
    params.add = function(key, value) {
      if ($.isFunction(value)) value = value()
      if (value == null) value = ""
      this.push(escape(key) + '=' + escape(value))
    }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)

;(function($){
  // __proto__ doesn't exist on IE<11, so redefine
  // the Z function to use object extension instead
  if (!('__proto__' in {})) {
    $.extend($.zepto, {
      Z: function(dom, selector){
        dom = dom || []
        $.extend(dom, $.fn)
        dom.selector = selector || ''
        dom.__Z = true
        return dom
      },
      // this is a kludge but works
      isZ: function(object){
        return $.type(object) === 'array' && '__Z' in object
      }
    })
  }

})(Zepto)
;window.local = {
  zh: {
    viewMore: '查看更多',
    rank: '排行',
    featured: '精品',
    more: '更多'
  },
  en: {
    viewMore: 'View more',
    rank: 'Rank',
    featured: 'Featured',
    more: 'more'
  }
};

;define('assets/js/formate/formateApp.js', function(require, exports, module){ 
var _local = {
  zh: {
    install: '安装'
  },
  en: {
    install: 'Install'
  }
}

_local = _local[lang];

/*
*将传入的byte数值转化为MB值（保留小数点后一位）
*1.若转换值为int类型，末尾补.0；
*2.若为float类型，四舍五入；若结果为0.0则上升至0.1（考虑apk包内图片所占大小）。
*/
var formatApkSize = function(num) {
  num = (num / 1048576).toFixed(1);
  if (num == 0.0) {
    num = 0.1;
  }
  return num;
}

function formateApp (prefix, elem) {
  var hdIcon = elem.hdIcon;
  var icon;
  if(hdIcon) {
    icon = hdIcon.main;
  } else {
    icon = elem.icon;
  }
  elem.status = _local.install;
  elem.installed = false;
  elem.apkSize = formatApkSize(elem.apkSize);
  elem.icon = prefix + icon;
  elem.ratingScore = elem.ratingScore * 2;
  return elem;
}

return formateApp; 
});
;define('assets/js/formate/applist.js', function(require, exports, module){ var formateApp = require('assets/js/formate/formateApp.js');

var _local = {
  zh: {
    ad: '推广',
  },
  en: {
    ad: 'Ad'
  }
}

_local = _local[lang];

var formateApplist = function(opt) {
  var renderList = opt.listApp;
  var prefix = opt.thumbnail + 'webp/l144q80/';
  appendAd2Applist(renderList, opt.positionList, opt.appIdDigestMap);
  console.time('formateApplist concat');
  var list = [];
  for (var j = 0, len = renderList.length; j < len; j++) {
    var elem = formateApp(prefix, renderList[j]);
    // adType：2，不展示标志位
    if (elem.adType !== 2) {
      if (elem.ads === 1) {
        elem["ad-flag"] = '<span class="applist-ad">' + _local.ad + '</span>';
      }
      // 配置tagStyle的优先展示
      var tagStyle = elem.tagStyle;
      if (tagStyle && tagStyle.text) {
        elem["ad-flag"] = '<span style="' + tagStyle.style + '">' + tagStyle.text + '</span>';
      }
    }


    list.push(elem);
  }
  return list;
  console.timeEnd('formateApplist concat');
}

/**
 * 给应用列表加上推广位标识, adPosition和appIdDigestMap必须对应，否则会出现bug
 * @param {vm} list APP数组
 * @param {Array} adPosition 广告位置数组
 * @param {Array} appIdDigestMap 广告反作弊信息数组
 */
var appendAd2Applist = function(list, adPosition, appIdDigestMap) {
  // 设置推广位
  if (adPosition) {
    for (var i = 0, ii = adPosition.length; i < ii; i++) {
      var app = list[adPosition[i]];
      if (app) {
        app["ads"] = 1;
        var id = app.id;
        if (appIdDigestMap && appIdDigestMap[id]) {
          app["digest"] = appIdDigestMap[id];
        }
      }
    }
  }
};

return formateApplist;
 
});
;define('assets/js/formate/banner.js', function(require, exports, module){ 
/**
 * 补充初始值，补全地址
 * @param {vm} list APP数组
 * @param {String} prefix 图片的前缀
 * @param {String} icon 指定图片elem，由于服务端返回字段不统一
 */
var initBannerList = function(opt) {
  opt = $.extend({
    imgQuality: 'webp/l320q80/',
    icon: 'mticon'
  }, opt);
  var bannerList = opt.bannerList;
  var host = opt.host;
  var imgQuality = opt.imgQuality;
  
  for(var i = 0, len = bannerList.length; i < len; i++) {
    var elem = bannerList[i];
    // 如果配置了webview活动链接，优先展示
    if(elem.webViewPic && elem.webViewUrl) {
      elem.title = elem.webViewTitle;
      elem.featuredType = 3;
      elem.link = elem.webViewUrl;
      elem.bannerUrl = host + imgQuality + elem.webViewPic;
    } else {
      elem.bannerUrl = host + imgQuality + elem[opt.icon];
    }
    
  }
  return bannerList;
};

return initBannerList;
 
});
;define('assets/js/formate/removeSuffix.js', function(require, exports, module){ /**
 * [removeSuffix 去除‘-’或‘—’后修饰语]
 * @type {list} list 应用列表
 */
var removeSuffix = function(list) {
	if (!list) {return [];}
	list.forEach(function(elem, i){
		var displayName = elem.displayName;
		var matchRes = displayName.match(/-|—/);
		if (matchRes) {
			elem.displayName = displayName.slice(0, matchRes.index);
		};
	});
	return list;
};

return removeSuffix; 
});
;define('assets/js/formate/mingleList.js', function(require, exports, module){ var formateBanner = require('assets/js/formate/banner.js');
var formateApplist = require('assets/js/formate/applist.js');
var removeSuffix = require('assets/js/formate/removeSuffix.js');

var key = 'default';
var cacheList = {}
var indexCache;
/**
 * @param  {Object} msg 虽然格式化的信息
 * @param  {recount} recount 是否需要重置计数器（diff更新用）
 * @param  {String} newKey 新的key，默认default
 */
function formateMingleList(msg, recount, newKey) {
  if (newKey !== undefined) {
    key = newKey;
  }
  if (!cacheList[key]) {
    indexCache = cacheList[key] = {
      appIndex: 0,
      recIndex: 0,
      winIndex: 0,
      recWordIndex: 0,
      recAppDescIndex: 0,
      recAppsIndex: 0,
      singleAppIndex: 0,
      adIndex: 0,
      cptAdIndex: 0,
      recZoneIndex: 0,
      carouselRecIndex: 0
    }
  } else {
    indexCache = cacheList[key];
  }
  // 更新缓存需要重置计数器
  if (recount) {
    indexCache = cacheList[key] = {
      appIndex: 0,
      recIndex: 0,
      winIndex: 0,
      recWordIndex: 0,
      recAppDescIndex: 0,
      recAppsIndex: 0,
      singleAppIndex: 0,
      adIndex: 0,
      cptAdIndex: 0,
      recZoneIndex: 0,
      carouselRecIndex: 0
    }
  }

  console.log('updateMingleList', msg);
  var list = msg.list;
  var thumbnail = msg.thumbnail;
  list.forEach(function(elem, i) {
    elem.data.thumbnail = thumbnail;
    switch (elem.type) {
      case 'listApp':
        var renderList = formateApplist(elem.data);
        for (var i = 0, ii = renderList.length; i < ii; i++) {
          var elem = renderList[i];
          elem['$index'] = indexCache.appIndex++;
          elem['$rankIndex'] = indexCache.appIndex;
          // 应用列表增加实时数据，无限流列表无elem.browser
          if (isInstantData && elem.browser) {
            elem['pos'] = indexCache.appIndex - 1;
            elem['index'] = '<p><span class="statistics-index">' + indexCache.appIndex + '</span></p>';
            elem['tapAmount'] = '<p><span>点：</span><span>' + elem.browser + '</span></p>';
            elem['downAmount'] = '<p><span>下：</span><span>' + elem.download + '</span></p>';
            elem['covertRate'] = '<p><span>转：</span><span>' + elem.ctr + '</span></p>';
          }
        };
        break;
        // 卡片式applist
      case 'recZone':
        var renderList = formateApplist(elem.data);
        for (var i = 0, ii = renderList.length; i < ii; i++) {
          var elem = renderList[i];
          elem['$index'] = indexCache.recZoneIndex + '_' + i;
        };
        indexCache.recZoneIndex++;
        break;
      case 'window':
        var list = elem.data.window;
        list.forEach(function(elem, i) {
          elem['$index'] = indexCache.winIndex + '_' + elem.position;
          elem.src = msg.thumbnail + 'webp/q80/' + elem.icon;
        });
        indexCache.winIndex++;
        break;
      case 'recommend':
        var recommend = elem.data;
        var imgQuality = 'jpeg/l320/';
        if (recommend.topfeaturedList[0].displayType === 1) {
          imgQuality = 'jpeg/l720/';
        }
        var featuredList = formateBanner({
          bannerList: recommend.topfeaturedList,
          host: recommend.thumbnail,
          imgQuality: imgQuality,
        });
        for (var i = 0, ii = featuredList.length; i < ii; i++) {
          var elem = featuredList[i];
          elem['$index'] = indexCache.recIndex++;
          // 推荐位增加实时数据
          if (isInstantData && elem.browser) {
            elem['pos'] = indexCache.recIndex - 1;
            elem['tapAmount'] = '<p><span>点：</span><span>' + elem.browser + '</span></p>';
            elem['downAmount'] = '<p><span>下：</span><span>' + elem.download + '</span></p>';
            elem['covertRate'] = '<p><span>转：</span><span>' + elem.ctr + '</span></p>';
          }
        };
        break;
      case 'menu':
        var menuData = elem.data;
        var menuList = menuData.menu;
        var imgQuality = menuData.thumbnail + 'png/w105/';
        for (var i = 0, ii = menuList.length; i < ii; i++) {
          var elem = menuList[i];
          elem.icon = imgQuality + elem.src;
          elem['$index'] = i;
          // 导航键增加实时数据
          if (isInstantData) {
            switch (elem.link) {
              case 'subject-list.html':
                elem['statType'] = 'index-hotSubject';
                break;
              case 'new-app.html':
                elem['statType'] = 'index-hotfeatured';
                break;
              case 'subscribe.html':
                elem['statType'] = 'index-subscribe';
                break;
              case 'campaign-list.html':
                elem['statType'] = 'index-campaignList';
                break;
              case 'g-index.html':
                elem['statType'] = 'index-gameIndex';
                // 游戏查询特殊字段
                elem['mark'] = 'index-gameIndex';
                break;
              default:
                break;
            }
            elem['tapAmount'] = '<p><span>点：</span><span>' + elem.browser + '</span></p>';
            elem['downAmount'] = '<p><span>下：</span><span>' + elem.download + '</span></p>';
            elem['covertRate'] = '<p><span>转：</span><span>' + elem.ctr + '</span></p>';
          }
        };
        break;
      case 'nav':
        var navData = elem.data;
        var navList = navData.menu;
        var position = navData.position;
        var imgQuality = navData.thumbnail + 'png/l69/';
        for (var i = 0, ii = navList.length; i < ii; i++) {
          var elem = navList[i];
          elem.icon = imgQuality + elem.src;
          elem['$index'] = i;
        };
        break;
      case 'recWords':
        var list = elem.data.words;
        list.forEach(function(elem, i) {
          elem['$index'] = indexCache.recWordIndex + '_' + i;
        });
        indexCache.recWordIndex++;
        break;
      case 'recAppDesc':
        var data = elem.data;
        data.banner = thumbnail + 'webp/l720q80/' + data.banner;
        var list = formateApplist(data);
        list.forEach(function(elem, i) {
          elem['$index'] = indexCache.recAppDescIndex + '_' + i;
        });
        indexCache.recAppDescIndex++;
        break;
      case 'recApps':
        var data = elem.data;
        var renderList = formateApplist(data);
        renderList = removeSuffix(renderList);
        renderList.forEach(function(elem, i) {
          elem['$index'] = indexCache.recAppsIndex + '_' + i;
        });
        indexCache.recAppsIndex++;
        break;
      case 'recApp':
        var appInfo = elem.data;
        appInfo['$index'] = indexCache.singleAppIndex++;
        appInfo.status = '安装';
        appInfo.installed = false;
        appInfo.bannerUrl = thumbnail + 'jpeg/l720/' + appInfo.bannerUrl;
        break;
      case 'adApp':
        var renderList = formateApplist(elem.data);
        renderList.forEach(function(elem, i) {
          elem['$index'] = indexCache.adIndex++;
        });
        break;
      case 'cptApp':
        var renderList = formateApplist(elem.data);
        renderList.forEach(function(elem, i) {
          elem['$index'] = indexCache.cptAdIndex++;
        });
        break;
        // 分类列表 
      case 'catList':
        var data = elem.data;
        var rowList = data.rowList;
        for (var ii = 0; ii < rowList.length; ii++) {
          var el = rowList[ii];
          var leftCell = el.leftCell;
          leftCell.cellIcon = thumbnail + 'png/l90/' + leftCell.cellIcon;
        }
        // 分类header上icon
        var extendIcon = data.extendIcon;
        if (extendIcon) {
          data.extendIcon = thumbnail + 'png/l90/' + extendIcon;
        };
        break;
      case 'catNav':
        var navData = elem.data;
        var navList = navData.menu;
        for (var i = 0, ii = navList.length; i < ii; i++) {
          var elem = navList[i];
          elem.icon = thumbnail + 'png/l72/' + elem.src;
          elem['$index'] = i;
        };
        break;
      case 'carouselRecommend':
        var carouselRecData = elem.data;
        var carouselRecList = carouselRecData.topfeaturedList;
        for (var i = 0, ii = carouselRecList.length; i < ii; i++) {
          var elem = carouselRecList[i];
          elem.bannerUrl = thumbnail + 'jpeg/l720/' + elem.mticon;
          elem['$index'] = indexCache.carouselRecIndex++;;
        };
        break;
    }
  });
  return list;
}

return formateMingleList;
 
});
;define('assets/js/global.js', function(require, exports, module){ // 请求参数，携带设备信息
 window.market = window.marketAd = {};
 market.registerViewStatus = marketAd.trackAdAction = window.market.registerAppStatus = window.market.checkApis = window.market.checkAppsOnMobile = function() {};

 window.ajaxData = { "os": "5.11.19", "model": "MI 3", "ro": "unknown", "marketVersion": 1914102, "imei": "357911d9ab2125b3e00ecd4a6a62fc73", "miuiBigVersionName": "V7-dev", "resolution": "1080*1920", "webResVersion": 248, "clientId": "bf60126bb9e2ecdad218adaa1f075f21", "densityScaleFactor": 3, "co": "CN", "pageConfigVersion": 123, "session": "ZEtq8LRPFNXboEka", "deviceType": 0, "la": "zh", "sdk": "19" };

/*replace-market-before*/
//window.ajaxData = JSON.parse(market.getDeviceInfo());
/*replace-market-after*/

window.globle = {};
ajaxData.newUser = isNewUser();
ajaxData.page = 0;
// 与传统客户端请求区分，不带h5=1都是客户端的请求
window.h5 = ajaxData.h5 = 1;
window.screenSize = {
  width: window.innerWidth,
  height: window.innerHeight
}
window.HOST = 'https://app.market.xiaomi.com/apm/';
// window.HOST = 'http://dev.staging.appapi.n.xiaomi.com/apm/';

var isSpportGetPref = market.checkApis(JSON.stringify({
  apiNames: [{
    name: "getPref"
  }]
}));
if (isSpportGetPref) {
  var appHost = market.getPref('pref_key_staging_mode');
  switch (appHost) {
    case '1':
      window.HOST = 'http://staging.appapi.n.xiaomi.com/apm/';
      break;
    case '2':
      window.HOST = 'http://dev.staging.appapi.n.xiaomi.com/apm/';
      break;
    case '3':
      window.HOST = "http://preview.app.market.pt.xiaomi.com/apm/";
      break;
  }
}

window.PROTOCOL = 'file://';
window.isInstantData = false;

var supportRealTimeServer = market.checkApis(JSON.stringify({
  apiNames: [{
    name: "isUseRealTimeDataServer"
  }]
}));
if (supportRealTimeServer && market.isUseRealTimeDataServer()) {
  window.HOST = 'http://appstore.d.xiaomi.net/appstore/apm/';
  window.isInstantData = true;
}

var afterActive = function(callback) {
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        callback();
      })
    })
  });
}

window.lang = ajaxData.la;
// var isActive = market.registerViewStatus(JSON.stringify({
//   callBack: 'test'
// }));
// console.log(isActive);
// window.test = function(b) {
//   console.log(b);
// }

/**
 * 判断是否是新用户，一周内使用的都是新用户
 */
function isNewUser() {
  var isNewUser = localStorage.getItem("isNewUser");
  // 第一次激活
  if (isNewUser === null) {
    localStorage.setItem("activeTime", Date.now());
    localStorage.setItem("isNewUser", true);
    return true;
  }
  // 对于老用户，直接返回
  if (!isNewUser) {
    return false;
  }
  // 非老用户，判断一下
  if (Date.now() - localStorage.getItem("activeTime") > 604800000) {
    localStorage.setItem("isNewUser", false);
    return false;
  } else {
    localStorage.setItem("isNewUser", true);
    return true;
  }
};

/*
 * 打开页面的方式，通过三种变量与或操作自由组合
 * 例如1，3 与 操作，打开页面的方式为：新开页面，但返回的时候不保留目前的页面，而且回到上一级。
 */
window.loadPageMethod = {
  FLAG_ACTIVITY_NEW_TASK: 0x10000000,
  FLAG_ACTIVITY_SINGLE_TOP: 0x20000000,
  FLAG_ACTIVITY_CLEAR_TOP: 0x04000000
}
window.loadDetailMethod = loadPageMethod.FLAG_ACTIVITY_NEW_TASK | loadPageMethod.FLAG_ACTIVITY_CLEAR_TOP;
// 标记进入商店的来源
if (market.getPageRef) {
  ajaxData.pageRef = market.getPageRef();
}

var registerViewCbFn = [];
// 由于registerViewStatus接口不能即时返回状态(兼容不全面)，
// 需要通过全局变量的方式实现，默认所有页面初始化都是true
globle.viewStatus = true;
globle.registerViewStatus = function(fn) {
  registerViewCbFn.push(fn);
  market.registerViewStatus(JSON.stringify({
    callBack: 'window.globle.registerViewStatusCb'
  }));
}
globle.registerViewStatusCb = function(status) {
  if (status === 'selected' || status === 'true') {
    globle.viewStatus = true;
  } else {
    globle.viewStatus = false;
  }
  registerViewCbFn.forEach(function(fn) {
    fn(globle.viewStatus);
  });
}
globle.registerViewStatus(function() {});

exports.afterActive = afterActive; 
});
;define('assets/js/createReqQuery.js', function(require, exports, module){ /*
 * 读取dom节点，返回相关的请求参数（广告，位置信息等）
 * @extraParams {JSON} 传给native的额外参数
 * @refPosition {String} 广告扣费的来源位置
 * @ref {String} 广告扣费的ref
 * @customRef {String} 是否采用自定义的ref
 */

function createReqQuery(opt) {
  var elem = opt.elem;
  var dataset = elem.dataset;
  var extraParams = {
    h5: h5,
    ad: 0,
    sid: $(elem).parents('.J_feed').data('sid'),
    //统计参数
    outerTraceId: dataset.outertraceid
  };
  var posPrefix = opt.posPrefix;
  var digest = dataset.digest;
  digest && (extraParams.di = digest);
  var ad = dataset.ad;
  // 服务端可能返回0，1，true，false
  if (ad === '1' || ad === 'true') {
    extraParams.ad = 1
  }
  // 兼容新的expid数据，如果应用里面有expid，则优先采用
  var expid = dataset.expid;
  expid && (extraParams.expid = expid);
  extraParams.refs = ajaxData.refs;

  var index = dataset.index;
  extraParams.pos = posPrefix + index;

  var refPosition = dataset.position;
  var linkTitle = dataset.linkTitle;
  var customRef = opt.customRef;
  if (opt.newRef && !customRef) {
    var _ref = ref + '_' + posPrefix + '_' + index;
  } else if(customRef){
    var _ref = customRef;
  } else {
    var _ref = ref;
  }
  return {
    extra_params: extraParams,
    refPosition: refPosition,
    ref: _ref,
    title: linkTitle
  }
}

return createReqQuery;
 
});
;define('assets/js/device.js', function(require, exports, module){ window.mobileCb = {};
var cacheList = window.cacheList = {};
// 多tab回调用的前缀
var prefix = 'index-';
var cachePrefix = [prefix];

var _local = {
  zh: {
    open: '打开',
    install: '安装',
    installed: '已安装',
    update: '升级',
    connecting: '连接中',
    pausing: '暂停中',
    pause: '暂停',
    wait: '等待中',
    goon: '继续',
    noNetTip: '网络不给力，请检查后再试试',
    confirm: '知道了',
    appInstall: '应用安装',
    installing: '安装中'
  },
  en: {
    open: 'Launch',
    install: 'Install',
    installed: 'Installed',
    update: 'Update',
    connecting: 'Connecting',
    pausing: 'Paused',
    pause: 'Pause',
    wait: 'Waiting',
    goon: 'Resume',
    noNetTip: 'Check your internet connection and try again.',
    confirm: 'OK',
    appInstall: 'Install app',
    installing: 'installing'
  }
}

_local = _local[lang];

/**
 * 检查页面上的应用是否已经安装,并把dom缓存到cacheList
 * @param {Array} appList appList
 */
var checkAppsStatus = function(contain, list) {
  console.time('cache dom');
  var packageList = [];
  console.log('checkAppsStatus', list);
  list.forEach(function(elem) {
    var pName = elem.packageName;
    var wrap = contain.querySelector('.J_btnInstall[data-pname="' + pName + '"]');
    if (!wrap) {
      return;
    }
    wrap.classList.remove('J_btnInstall');
    var btnContain = {
      btn: wrap.querySelector('button'),
      progress: wrap.querySelector('.J_appProgress'),
      progressStatusTxt: wrap.querySelector('.J_appStatusProgress'),
      statusTxt: wrap.querySelector('.J_appStatus'),
      wrap: wrap
    };
    var key = prefix + pName;
    if (cacheList[key]) {
      cacheList[key].push(btnContain);
    } else {
      cacheList[key] = [btnContain];
    }

    packageList.push({
      pName: pName,
      version: elem.versionCode || 0,
      appId: elem.id
    });
  });
  console.timeEnd('cache dom');
  var checkPackageList = {
    packageList: packageList,
    callBack: "mobileCb.checkAppsStatusCb"
  };
  console.log('packageList', packageList);
  market.checkAppsOnMobile(JSON.stringify(checkPackageList));
};

mobileCb.checkAppsStatusCb = function(pNames) {
  var packageList = JSON.parse(pNames);
  if (!packageList.length) return;
  for (var i = 0, ii = packageList.length; i < ii; i++) {
    var elem = packageList[i];
    var pName = elem.pName;
    var btnContains = getBtnConatins(pName);
    if (!btnContains) {
      continue;
    }
    var appId = elem.appId;
    switch (elem.status) {
      case 0:
        // 已经安装，可以打开
        setOpenStatus(btnContains);
        break;
      case 1:
        // 待升级
        setInstallStatus(btnContains, _local.update);
        break;
      case 3:
        // 下载或安装中，触发下载事件
        install({
          pName: pName,
          appId: appId
        });
        break;
      case 4:
        // 暂停中,激活继续安装的回调
        install({
          pName: pName,
          appId: appId,
          needArrange: false
        });
        break;
      case 5:
        // 已经安装，不可以打开
        setTxt(btnContains, _local.installed, _local.installed);
        break;
      default:
        break;
    }
  }
};
/**
 * 安装应用
 * @param {String} pName pName
 * @param {Number} appId appId
 * @param {Boolean} needArrange 
 */
var install = function(opt) {
  // 立即响应事件，避免回调带来的延迟
  var btnContains = getBtnConatins(opt.pName);
  setTxt(btnContains, _local.connecting, _local.connecting);
  opt = $.extend({
    callBack: "mobileCb.installCb"
  }, opt);
  market.install(JSON.stringify(opt));
};
mobileCb.installCb = function(installInfos) {
  var installInfos = JSON.parse(installInfos).packageInfo;

  for (var i = 0, len = installInfos.length; i < len; i++) {
    var installInfo = installInfos[i];
    var pName = installInfo.pName;
    var doms = getBtnConatins(pName);
    var status = installInfo.status;
    switch (status) {
      case 0:
      case 1:
        setTxt(doms, _local.connecting, _local.connecting);
        break;
      case 2:
        setTxt(doms, _local.wait, _local.wait);
        break;
      case 3:
        var progress = installInfo.progress;
        setTxt(doms, progress + '%', _local.pause);
        setProgress(doms, progress, 'installing');
        break;
      case 4:
        setProgress(doms, installInfo.progress, 'paused');
        setTxt(doms, _local.pausing, _local.goon, 'install-btn install-btn-action install-btn-action-pause');
        break;
      case 5:
      case 6:
      case 7:
        setProgress(doms, 0, 'installing');
        setTxt(doms, _local.installing, _local.installing);
        break;
      case 8:
        // 安装失败，回退到安装状态
        setInstallStatus(doms, _local.install);
        break;
      case 9:
        // 安装成功,检查一下状态，是否可以打开
        var checkPackageList = {
          packageList: [{
            pName: pName,
            version: 0
          }],
          callBack: "mobileCb.checkAppsStatusCb"
        };
        market.checkAppsOnMobile(JSON.stringify(checkPackageList));
        break;
    }
  }
};

/**
 * 注册app状态，当app出现安装，删除状态的变化，
 * 执行回调函数（各页面均可以有自己独立的回调），
 * 返回相关的数据，该监听器在页面重载以及暂停时不会取消。
 * @param {vm} vm 
 * @param {Array} list appList
 */
var registerAppStatus = function() {
  var param = {
    callBack: "mobileCb.registerAppStatusCb"
  };
  market.registerAppStatus(JSON.stringify(param));
};

mobileCb.registerAppStatusCb = function(appInfo) {
  var appInfo = JSON.parse(appInfo);
  var pName = appInfo.pName;
  var doms = getBtnConatins(pName);
  var status = appInfo.status;
  switch (status) {
    case 0:
      // 被删除
      setInstallStatus(doms, _local.install);
      break;
    case 1:
      // 表示安装完毕（有可能是更新，也有可能是新安装）
      setOpenStatus(doms);
      break;
    case 2:
      // 任务开始(不包括resume)，发现任务开始，激活回调
      install({
        pName: pName,
        appId: appInfo.appId,
        needArrange: false
      });
      break;
    case 3:
      // 任务失败
      setInstallStatus(doms, _local.install);
      break;
    case 4:
      // 任务成功
      setOpenStatus(doms);
      break;
    case 5:
      // 无网络情况的失败
      setInstallStatus(doms, _local.install);
      market.showDialog(JSON.stringify({
        title: _local.appInstall,
        message: _local.noNetTip,
        positiveText: _local.confirm
      }));
      break;
    default:
      setInstallStatus(doms, _local.install);
      break;
  }
}

// 设置安装状态
function setInstallStatus(btnContains, status) {
  btnContains.forEach(function(elem, i) {
    elem.progressStatusTxt && (elem.progressStatusTxt.innerHTML = status);
    elem.statusTxt && (elem.statusTxt.innerHTML = status);
    var btn = elem.btn;
    btn.removeAttribute('disabled');
    btn.dataset.installed = 'false';
    setProgressStyle(elem.progress, 0);
    elem.wrap.className = 'install-btn install-btn-start';
  })
}
// 设置打开状态
function setOpenStatus(btnContains) {
  btnContains.forEach(function(elem, i) {
    elem.progressStatusTxt && (elem.progressStatusTxt.innerHTML = _local.open);
    elem.statusTxt && (elem.statusTxt.innerHTML = _local.open);
    var btn = elem.btn;
    btn.removeAttribute('disabled');
    btn.dataset.installed = 'true';
    setProgressStyle(elem.progress, 0);
    elem.wrap.className = 'install-btn install-btn-open';
  })
}

function setProgress(btnContains, progress, installStatus) {
  console.log('progress', progress);
  btnContains.forEach(function(elem, i) {
    var domProgress = elem.progress;
    elem.wrap.className = 'install-btn install-btn-progress';
    setProgressStyle(domProgress, progress);
    var btn = elem.btn;
    btn.setAttribute('disabled', 'true');
    btn.dataset.installed = installStatus;
  })
}

function setTxt(btnContains, progressStatusTxt, statusTxt, className) {
  btnContains.forEach(function(elem, i) {
    elem.progressStatusTxt && (elem.progressStatusTxt.innerHTML = progressStatusTxt);
    elem.statusTxt && (elem.statusTxt.innerHTML = statusTxt);
    var domProgress = elem.progress;
    elem.wrap.className = className || 'install-btn install-btn-action';
    elem.btn.setAttribute('disabled', 'true');
  })
}

// 切换tab，重置prefix
function setPrefix(value) {
  prefix = value;
  cachePrefix.indexOf(value) === -1 && cachePrefix.push(value);
}
// 根据pname，返回pname的dom数组
function getBtnConatins(pName) {
  var doms = [];
  var divideIndex;
  var packageName;
  for (var i in cacheList) {
    // 从prefix之后截取真正的包名
    divideIndex = i.indexOf('-') + 1;
    packageName = i.slice(divideIndex);
    if (packageName === pName) {
      var dom = cacheList[i];
      // 保证存在（可能被清除内存）
      dom && (doms = doms.concat(dom));
    }
  }
  return doms;
}

// 清除指定的dom缓存
function clearMemory(list) {
  for (var i = 0, ii = list.length; i < ii; i++) {
    var key = prefix + list[i].packageName;
    if (cacheList[key]) {
      cacheList[key] = null;
    }
  }
}

function setProgressStyle(dom, progress) {
  dom.style.width = progress + '%';
}

module.exports = {
  checkAppsStatus: checkAppsStatus,
  install: install,
  registerAppStatus: registerAppStatus,
  setPrefix: setPrefix,
  clearMemory: clearMemory
}
 
});
;define('assets/js/scrollRequest.js', function(require, exports, module){ var getJSON = require('assets/js/request.js').getJSON;
var scrollBottomEvent = require('assets/js/scrollBottomEvent.js');
/**
 * 获取应用列表
   [2015-8-4] 修改分页逻辑，采用hasmore判断，不需要传listVal
 * @param {vm} vm 
 * @param {String} url
 * @param {Object} data 携带的数据
 * @param {Function} callBack 成功回调
 * @param {Function} errorCallBack 失败回调
 */
var scrollReq = function(opt) {
  var load = opt.load;
  if (opt.noRequest) {
    opt.noRequest = false;
    scrollBottomEvent(scrollReq, opt);
    load.show();
    load.changePositon('bottom');
  } else {
    getJSON({
      url: opt.url,
      data: opt.data,
      load: load,
      callBack: function(msg) {
        opt.callBack(msg);
        load && load.show();
        if (msg.hasMore) {
          scrollBottomEvent(scrollReq, opt);
        } else {
          // 数据空处理
          load && load.showEmpty();
        }
      },
      errorCallBack: function() {
        scrollBottomEvent(scrollReq, opt);
      }
    });
  }
};

return scrollReq;
 
});
;define('assets/js/module/lazyLoad.js', function(require, exports, module){ /**
 * @name: layzload
 * @overview: 延迟加载
 * @description: 配合domlazy做内存优化
 * @author: yangweixian
 * @date: 2015/4/13
 */

/**
 * @param {Boolean} contain 设置容器
 * @param {String} images 需要延迟加载的图片
 * @param {Number} buffer 缓冲高度
 * @param {Number} bufferWidth 缓冲宽度
 * @param {Number} timeout 滚动的间隔
 * @param {Boolean} fadeIn 是否渐显
 * @param {String} extralDoms 是否需要监听内部dom的滚动事件
 */
var displayWidth = window.innerWidth;
var LazyLoad = function(opt) {
  var me = this;
  opt = $.extend({
    images: '.J_lazyload',
    buffer: 350,
    timeout: 150,
    fadeIn: true,
    bufferWidth: 50
  }, opt);
  var contain = opt.contain;
  displayWidth += opt.bufferWidth;
  if (!contain) {
    contain = document.body;
    $handler = $(window);
    me.containHeight = $handler.height();
  } else {
    $handler = $(contain);
    me.containHeight = $handler.height();
  }
  me.contain = contain;

  me.buffer = opt.buffer;
  me.images = opt.images;
  me.fadeIn = opt.fadeIn;
  me.cache = {}; // 缓存需要延迟加载的图片dom
  me.positions = []; //保存需要延迟加载的图片位置（高度）信息

  var timer;
  $handler.on('scroll.lazyload', function(e) {
    if (!timer) {
      timer = setTimeout(function() {
        me.loadImg();
        timer = null;
      }, opt.timeout);
    }
  });

  // 处理横向滚动场景
  var extralDoms = opt.extralDoms;
  if (extralDoms) {
    $(extralDoms).on('scroll.lazyload', function(e) {
      if (!timer) {
        timer = setTimeout(function() {
          me.loadImg(true, e);
          timer = null;
        }, opt.timeout);
      }
    });
  }
};

/**
 * @description 更新lazyload的数据
 */
LazyLoad.prototype.update = function(fadeIn) {
  var images = this.contain.querySelectorAll(this.images);
  if (!images.length) return;
  this.updateIndexData(images);
  this.loadImg(fadeIn);
};

// 读取scrollTop会引起页面reflow，性能不稳定，1-100ms消耗
// 若contain被非containdow对象赋值，则只有scrollTop属性
function getScrollTop(elem) {
  return elem.scrollTop || window.scrollY
}

/*
 * 加载图片
 * */
LazyLoad.prototype.load = function(imgCache, fadeIn) {
  if (!imgCache.isLoad && !imgCache.isLoading) {
    var img = imgCache.img;
    var handler = function(img, imgCache) {
      return function(e) {
        img.src = e.currentTarget.src;
        if (fadeIn) {
          img.classList.add('lazyload-fadein');
        } else {
          img.classList.add('lazyload-show');
        }
        imgCache.isLoad = true;
        imgCache.isLoading = false;
        imgCache = img = null;
      }
    }(img, imgCache);
    var handlerErr = function(imgCache) {
      return function() {
        console.log('error', imgCache);
        imgCache.isLoading = false;
        imgCache = null;
      }
    }(imgCache);
    imgCache.isLoading = true;
    var _img = new Image();
    _img.src = img.dataset.src;
    _img.onload = handler;
    _img.onerror = handlerErr;
  }
}


/*
 * 返回要加载的索引
 * */
LazyLoad.prototype.getLoadIndex = function(top, buffer) {
  var me = this;
  var positions = me.positions;
  var containHeight = me.containHeight;
  // 需要执行加载的数组
  var LoadIndexs = [];
  var activeTop = top - buffer;
  var activeBottom = top + containHeight + buffer;
  for (var i = 0, len = positions.length; i < len; i++) {
    var position = positions[i];
    if (position > activeTop && position < activeBottom) {
      LoadIndexs.push(position);
    }
  }
  return LoadIndexs;
}

/*
 * 更新延迟加载数据，放到缓存中
 * @Param {NodeList} images，图片
 * */
LazyLoad.prototype.updateIndexData = function(images) {
  var cache = this.cache;
  var positions = this.positions;
  var scrollTop = getScrollTop(this.contain);
  for (var i = 0, ii = images.length; i < ii; i++) {
    var elem = images[i];
    var elemRect = elem.getBoundingClientRect();
    var top = parseInt(elemRect.top + scrollTop);
    var left = elemRect.left;
    if (!cache[top]) {
      positions.push(top);
      cache[top] = [];
    }
    cache[top].push({
      img: elem,
      isLoad: false,
      isLoading: false,
      left: left
    });
    elem.classList.remove('J_lazyload');
  };
}

// 加载符合条件的图片
LazyLoad.prototype.loadImg = function(fadeIn, e) {
  var me = this;
  // 如果外部指定显示方式，优先采用
  if (fadeIn === undefined) {
    fadeIn = me.fadeIn;
  }
  var cache = me.cache;
  var scrollTop = getScrollTop(me.contain);
  var LoadIndexs = me.getLoadIndex(scrollTop, me.buffer);
  var scrollLeft = 0;
  if (e !== undefined) {
    scrollLeft = e.target.scrollLeft;
  }
  console.log(scrollLeft);
  for (var i = 0, ii = LoadIndexs.length; i < ii; i++) {
    var elems = cache[LoadIndexs[i]];
    for (var j = 0, jj = elems.length; j < jj; j++) {
      var elem = elems[j];
      if (elem.left - scrollLeft < displayWidth) {
        me.load(elem, fadeIn);
      }
    }
  }
};

/**
 * @description 立即加载图片
 * @Param {Boolean} placeholder
 */
LazyLoad.prototype.show = function(keepPlaceholder) {
  var images = this.contain.querySelectorAll('.J_lazyload');
  for (var i = 0, ii = images.length; i < ii; i++) {
    var elem = images[i];
    elem.src = elem.dataset.src;
    var elemClass = elem.classList;
    elemClass.remove('J_lazyload');
    elemClass.remove('lazyload');
    if (!keepPlaceholder) {
      elem.parentNode.classList.add('lazyload-nobg');
    }
  };
}

// 清除指定范围的图片内存
LazyLoad.prototype.clearMemory = function(top, bottom) {
  var me = this;
  var cache = me.cache;
  me.positions = me.positions.filter(function(position) {
    var match = position > top && position < bottom;
    if (match) {
      cache[position] = null;
    }
    return !match;
  })
}

module.exports = LazyLoad
 
});
;define('assets/js/module/exposure.js', function(require, exports, module){ /**
 * 应用曝光统计，把当前元素（应用、专题等）停留一秒的应用往客户端打点
 * 对于横划的应用，如果出现在feed流里面，可能会出现统计不准
 * @author: babyzone2004
 * @date: 2016/4/18
 */

/**
 * @param {Boolean} contain 设置容器
 * @param {Boolean} global 是否是全局lazy
 * @param {String} apps 需要检测曝光的应用
 * @param {Number} timeout 滚动的间隔
 * @param {Number} offsetTop 偏离顶部的位移
 * @param {String} extralDoms 是否需要监听内部dom的滚动事件
 */
var displayWidth = window.innerWidth;
var timer;
var Exposure = function(opt) {
  var me = this;
  opt = $.extend({
    apps: '.J_exposure',
    buffer: 0,
    timeout: 800,
    bufferWidth: 0
  }, opt);
  var contain = opt.contain;
  displayWidth += opt.bufferWidth;
  this.offsetTop = 0;
  if (!contain) {
    contain = document.body;
    $handler = $(window);
    me.containHeight = $handler.height();
  } else {
    $handler = $(contain);
    this.offsetTop = contain.getBoundingClientRect().top;
    me.containHeight = $handler.height();
  }
  me.$handler = $handler;
  me.contain = contain;

  me.buffer = opt.buffer;
  me.apps = opt.apps;
  me.timeout = opt.timeout;
  me.cache = {}; // 缓存需要延迟加载的图片dom
  me.positions = []; //保存需要延迟加载的图片位置（高度）信息

  $handler.on('scroll.exposure', function(e) {
    clearTimeout(timer);
    timer = setTimeout(function() {
      me.exposureApp();
    }, opt.timeout);
  });

  // 处理横向滚动场景
  var extralDoms = opt.extralDoms;
  if (extralDoms) {
    $(extralDoms).on('scroll.exposure', function(e) {
      clearTimeout(timer);
      timer = setTimeout(function() {
        me.exposureApp(e);
      }, opt.timeout);
    });
  }
  globle.registerViewStatus(function(selected) {
    if (selected) {
      clearTimeout(timer);
      timer = setTimeout(function() {
        me.exposureApp();
      }, me.timeout);
    }
  });
};

/**
 * @description 更新lazyload的数据
 */
Exposure.prototype.update = function() {
  var me = this;
  var apps = me.contain.querySelectorAll(me.apps);
  if (apps.length) {
    me.updateIndexData(apps);
  }
  clearTimeout(timer);
  timer = setTimeout(function() {
    me.exposureApp();
  }, me.timeout);
};

// 读取scrollTop会引起页面reflow，性能不稳定，1-100ms消耗
// 若contain被非containdow对象赋值，则只有scrollTop属性
function getScrollTop(elem) {
  return (elem.scrollTop || window.scrollY);
}

/*
 * 返回要加载的索引
 * */
var activeTop = 0;
var activeBottom = 0;
Exposure.prototype.getLoadIndex = function(top, buffer) {
  var me = this;
  var positions = me.positions;
  var containHeight = me.containHeight;
  // 需要执行加载的数组
  var LoadIndexs = [];
  activeTop = top - buffer;
  activeBottom = top + containHeight + buffer + this.offsetTop;
  for (var i = 0, len = positions.length; i < len; i++) {
    var position = positions[i];
    if (position > activeTop && position < activeBottom) {
      LoadIndexs.push(position);
    }
  }
  return LoadIndexs;
}

/*
 * 更新延迟加载数据，放到缓存中
 * @Param {NodeList} apps，图片
 * */
Exposure.prototype.updateIndexData = function(apps) {
  var cache = this.cache;
  var positions = this.positions;
  var scrollTop = getScrollTop(this.contain);
  for (var i = 0, ii = apps.length; i < ii; i++) {
    var elem = apps[i];
    var elemRect = elem.getBoundingClientRect();
    var top = parseInt(elemRect.top + scrollTop - this.offsetTop);
    var left = elemRect.left;
    if (!cache[top]) {
      positions.push(top);
      cache[top] = [];
    }
    cache[top].push({
      dom: elem,
      isLoad: false,
      isLoading: false,
      left: left,
      right: left + elemRect.width,
      bottom: top + elemRect.height
    });
    elem.classList.remove('J_exposure');
  };
}

// 加载符合条件的图片
Exposure.prototype.exposureApp = function(e) {
  if (!globle.viewStatus) {
    return
  }
  console.time('exposureApp');
  var me = this;
  var cache = me.cache;
  var scrollTop = getScrollTop(me.contain);
  var LoadIndexs = me.getLoadIndex(scrollTop, me.buffer);
  var scrollLeft = 0;
  if (e !== undefined) {
    scrollLeft = e.target.scrollLeft;
  }
  var exposureItems = [];
  for (var i = 0, ii = LoadIndexs.length; i < ii; i++) {
    var top = LoadIndexs[i];
    var elems = cache[top];
    for (var j = 0, jj = elems.length; j < jj; j++) {
      var elem = elems[j];
      if (elem.left - scrollLeft >= 0 && elem.right - scrollLeft <= displayWidth && elem.bottom <= activeBottom) {
        var dom = elem.dom;
        var dataset = dom.dataset;
        exposureItems.push({
          rId: dataset.rid || '',
          appId: dataset.appid || '',
          ad: dataset.ad || '',
          pos: dataset.position || '',
          pagePos: {
            l: elem.left,
            t: top
          },
          sid: $(dom).parents('.J_feed').data('sid') || ''
        });
      }
    }
  }
  if (exposureItems.length !== 0) {
    // 曝光应用
    marketAd.trackAdAction('mimarket_adfeedback', 'exposure', JSON.stringify({
      items: exposureItems,
      context: {
        scroll: scrollTop,
        ref: ref,
        screenSize: screenSize
      }
    }));
  }
  console.log('exposureApp:', {
    items: exposureItems,
    context: {
      scroll: scrollTop,
      ref: ref,
      screenSize: screenSize
    }
  });
  console.timeEnd('exposureApp');
}

// 清除指定范围的图片内存
Exposure.prototype.clearMemory = function(top, bottom) {
  var me = this;
  var cache = me.cache;
  me.positions = me.positions.filter(function(position) {
    var match = position > top && position < bottom;
    if (match) {
      cache[position] = null;
    }
    return !match;
  })
}

Exposure.prototype.updateHeight = function() {
  this.containHeight = $handler.height();
}

module.exports = Exposure 
});
;define('assets/js/module/dom.js', function(require, exports, module){ /*
 * dom操作
 * */
return {
  id: function(elem) {
    return document.getElementById(elem);
  }
};
 
});
;define('assets/js/module/domLazy.js', function(require, exports, module){ /**
 * 长列表内存回收，不在当前屏幕的dom列表将被清空
 * @param {Int} buffer 缓冲高度
 * @param {Function} clearCb 回调函数，执行清空操作
 * @param {Function} renderCb 回调函数，执行重绘工作
 */
var DomLazy = function(opt) {
  var me = this;
  var cacheList = me.cacheList = [];
  var $handler;
  var contain = opt.contain;
  if (!contain) {
    contain = document.body;
    $handler = $(window);
  } else {
    $handler = $(contain);
  }
  //30条列表(标准字体是2100，大字体是2580) 
  var buffer = opt.buffer || 2100;
  var $contain = $(contain);
  var renderCb = opt.renderCb;
  var clearCb = opt.clearCb;
  var timer;
  $handler.on('scroll.domLazy', function() {
    if (!timer) {
      timer = setTimeout(function() {
        var top = contain.scrollTop || window.scrollY;
        var activeTop = top - buffer;
        var activeBottom = top + buffer;
        for (var i = 0, len = cacheList.length; i < len; i++) {
          var cache = cacheList[i];
          var rended = cache.rended;
          var cacheTop = cache.top;
          var cacheBottom = cache.bottom;
          if ((activeBottom >= cacheTop && cacheTop >= activeTop) || (activeBottom >= cacheBottom && cacheBottom >= activeTop)) {
            console.log('renderCb');
            if (!rended) {
              renderCb(cache);
            }
          } else {
            console.log('clearCb', rended);
            if (rended) {
              clearCb(cache, cacheTop, cacheBottom);
            }
          }
        }
        timer = null;
      }, 150);
    }
  });
};
/**
 * 增加延迟加载的dom数据
 * @param {Array} cacheList domlazy所有的数据
 * @param {Int} top 容器顶部高度
 * @param {Int} top 容器顶部高度
 * @param {Int} bottom 容器底部高度
 * @param {Boolean} rended 判断是否该区域已经渲染，避免重复渲染
 */
DomLazy.prototype.add = function(opt) {
  var contain = opt.contain;
  var $contain = $(contain);
  // 相对父元素（非static）的便宜
  var top = $contain.position().top;
  var height = $contain.height();
  var bottom = top + height;
  opt = $.extend({
    top: top,
    height: height,
    bottom: bottom,
    rended: true
  }, opt);
  this.cacheList.push(opt);
  console.log(this.cacheList);
}

module.exports = DomLazy;
 
});
;define('assets/js/module/query.js', function(require, exports, module){ /*
 * query操作
 * */

var serialize = function(o){
  var s = [];
  for(var k in o){
    var value = o[k];
    if(value !== undefined) {
      s.push(k + '=' + value);
    } else {
      s.push(k); 
    }
  }
  return s.join('&');
};

var getQueryObject = function(query) {
  var arrQuery = query.split('&')
  , oQuery = {};
  for(var i = 0, ii = arrQuery.length; i < ii; i++) {
    var arrTmp = arrQuery[i].split('=');
    oQuery[arrTmp[0]] = arrTmp[1];
  }
  return oQuery;
}

return {
  get: function(name) {
    var oQuery = getQueryObject(location.search.slice(1));
    return oQuery[name];
  },
  /*
   * key:如果是对象，直接序列化
   * */
  /**
  * 增加query，新的key会覆盖旧的key
  * @key {Object || String}，Object：直接序列化，String，需要增加value参数
  */
  add: function(url, key, vaule) {
    var queryArr = url.split('?');
    var query;
    // 统一成Object形式处理
    if(typeof key === 'string') {
      var cloneKey = {};
      cloneKey[key] = vaule;
      key = cloneKey;
    }
    // 只对新增的query做encode处理，原有的url param不处理
    for(var i in key) {
      key[i] = encodeURIComponent(key[i])
    }
    if(queryArr.length === 1) {
      query = serialize(key);
    } else {
      var oQuery = getQueryObject(queryArr[1]);
      for(var i in key) {
        oQuery[i] =  key[i];
      }
      query = serialize(oQuery);
    }
    return queryArr[0] + '?' + query;
  }
} 
});
;define('assets/js/module/render.js', function(require, exports, module){ /**
 * 简单的模板引擎，会把{{}}里面的内容替换
 ** @param {dom} contain dom容器
 ** @param {String} tpl 模板
 ** @param {Array} list render的数组
 */
var render = function(opt) {
  var list = opt.list;
  var str = '';
  var tpl = opt.tpl;
  for (var i = 0, ii = list.length; i < ii; i++) {
    var data = list[i];
    var domStr = tpl.replace(/{{([^{}]+)}}/g, function(s0, s1) {
      // 如是是0，会转换为空
      var val = data[s1];
      if(val !== undefined) {
        val = val.toString();
      } else {
        val = '';
      }
      return val;
    });
    str += domStr;
  };
  try{
    opt.contain.innerHTML = str;
  } catch(e) {
    console.log(e);
  }
  
};

return render; 
});
;define('assets/js/module/tap.js', function(require, exports, module){ /*
 * 
 * 
 */
/**
 * tap.on(contain);触发 'tap'事件
 * @param {Boolean} isTrigerTap 
 * 50毫秒内只能触发一次，防止内嵌的多重tap事件
 */
var startTx, startTy, isTrigerTap = true;

var onsTouchStart = function(e) {
  var touches = e.touches[0];
  startTx = touches.clientX;
  startTy = touches.clientY;
}

var onTouchEnd = function(e) {
  var touches = e.changedTouches[0];
  var endTx = touches.clientX;
  var endTy = touches.clientY;
  // 部分设备touch 事件比较灵敏，导致按下和松开手指时的事件坐标会出现一点点变化
  if (Math.abs(startTx - endTx) < 6 && Math.abs(startTy - endTy) < 6 && isTrigerTap) {
    var evt = new window.CustomEvent('tap', {
      bubbles: true,
      cancelable: true
    });
    e.target.dispatchEvent(evt);
    isTrigerTap = false;
    setTimeout(function() {
      isTrigerTap = true;
    }, 50);
    // e.stopPropagation();
    console.log('fire tap event');
  }
}
var onTap = function(elem) {
  elem.addEventListener('touchstart', onsTouchStart, false);
  elem.addEventListener('touchend', onTouchEnd, false);
}

var offTap = function(elem) {
  elem.removeEventListener('touchstart', onsTouchStart, false);
  elem.removeEventListener('touchend', onTouchEnd, false);
}

module.exports = {
  on: onTap,
  off: offTap
};
 
});
;define('components/load/load.js', function(require, exports, module){ 
var _local = {
  zh: {
    loading: '加载中…',
    end: '到底啦',
    loadMore: '加载更多',
    more: '更多',
    viewMore: '查看更多',
    noNetwork: '当前无网络连接，请连接后重试哟~',
    retry: '重试',
    reflesh: '刷新'
  },
  en: {
    viewMore: 'View more',
    loading: 'Just a sec',
    end: 'You\'ve reached the bottom of the page',
    loadMore: 'View more',
    more: 'More',
    noNetwork: 'Can\'t connect to the network',
    retry: 'Retry',
    reflesh: 'Refresh'
  }
};

_local = _local[lang];


var noNetwork = _local.noNetwork;

console.time('load time');
var tplNormal = '<i class="icon-loading-small"></i><span>' + _local.loading + '</span>';
var tplEmpty = '<p>' + _local.end + '</p>';
var tplErr = '<p><span>' + noNetwork + '</span><span class="btn-restry" data-retry="true">' + _local.retry + '</span></p>';
var errIcon = '<div class="no-network"><span class="icon-no-network"></span><p>' + noNetwork + '</p><span class="btn-restry" data-retry="true">' + _local.retry + '</span></div>';
var tplIconBottom = '<div class="no-network-bottom"><span class="fl">' + noNetwork + '</span><span class="fr"><button class="btn-reflesh" data-retry="true">' + _local.reflesh + '</button></span></div>';
var tplLoadTxt = '<span>' + _local.loadMore + '</span>';
console.timeEnd('load time');

function init(node, position) {
  this._node = node;
  this.changePositon(position);
}

init.prototype.show = function() {
  var node = this._node;
  node.classList.remove('hide');
  node.innerHTML = tplLoadTxt;
}

init.prototype.showLoading = function() {
  var node = this._node;
  node.classList.remove('hide');
  node.innerHTML = tplNormal;
}

init.prototype.hide = function() {
  var node = this._node;
  node.classList.add('hide');
  node.innerHTML = '';
}

init.prototype.showEmpty = function() {
  var node = this._node;
  node.classList.remove('hide');
  node.innerHTML = tplEmpty;
}

init.prototype.showErr = function() {
  this._node.innerHTML = this._errNode;
}

init.prototype.changePositon = function(position) {
  switch(position) {
    case 'bottom':
      this._node.className = 'load';
      this._errNode = tplErr;
    break;
    case 'fixBottom':
      this._node.className = 'load-bottom-fix';
      this._errNode = tplIconBottom;
    break;
    case 'middle':
      this._node.className = 'load load-middle';
      this._errNode = errIcon;
    break;
    default:
      this._errNode = errIcon;
    break;
  }
}
/**
 * @param {String} selector 选择器
 * @param {string} position 
    default: 居中显示，居中显示错误
    'bottom': 在底部展示错误和loading，
    'fixBottom': 在底部fixed展示错误和loading，
 */
var render = function(selector, position) {
  var node = document.querySelector(selector); 
  var load = new init(node, position);
  return load;
}

module.exports = render; 
});
;define('components/app-list/app-list.js', function(require, exports, module){ /**
 * @param {dom} contain 容器
 * @param {string} tpl 模板
 * @param {Array} list 数据
 * @param {Number} buffer 延迟dom的高度，不传不开启延迟dom
 */

var device = require('assets/js/device.js');
var createReqQuery = require('assets/js/createReqQuery.js');

var tplNoBrief = "<li>\r\n  <div class=\"applist-item\">\r\n    <div class=\"tap J_exposure\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-pname=\"{{packageName}}\" data-link-title=\"{{displayName}}\"  data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-appid=\"{{id}}\" data-rid=\"{{rid}}\" data-outertraceid=\"{{outerTraceId}}\">\r\n      <div class=\"applist-wrap c{{id}}\">\r\n        <div class=\"applist-rank\">{{$rankIndex}}</div><div class=\"applist-img\"><img class=\"J_lazyload lazyload\" data-src=\"{{icon}}\" width=\"52\" height=\"52\"></div><div class=\"applist-wrap-des\">\r\n          <h3 class=\"ellipsis\">{{displayName}}</h3>\r\n          <div class=\"applist-wrap-flex-item\">\r\n            <div class=\"icon-star icon-star{{ratingScore}}\">\r\n              <div class=\"icon-star icon-star-light\"></div>\r\n            </div>\r\n          </div>\r\n          <p class=\"applist-info-bottom\">\r\n            <span class=\"ellipsis\">{{level1CategoryName}}</span>\r\n            <span>{{apkSize}} M</span>\r\n            {{ad-flag}}\r\n          </p>\r\n        </div>\r\n      </div>\r\n    </div>\r\n    <div class=\"J_btnInstall install-btn\" data-pname=\"{{packageName}}\">\r\n  <button type=\"button\" data-pname=\"{{packageName}}\" class=\"touch J_install\" data-appid=\"{{id}}\" data-installed=\"\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-link-title=\"{{displayName}}\" data-outertraceid=\"{{outerTraceId}}\"></button>\r\n  <div class=\"install-btn-display\">\r\n    <span class=\"J_appProgress install-progress\"></span>\r\n    <span class=\"J_appStatusProgress\">{{status}}</span>\r\n  </div>\r\n</div>\r\n  </div>\r\n</li>";
var tplWithBrief = "<li>\r\n  <div class=\"applist-item\">\r\n    <div class=\"tap J_exposure\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-pname=\"{{packageName}}\" data-link-title=\"{{displayName}}\"  data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-appid=\"{{id}}\" data-rid=\"{{rid}}\" data-outertraceid=\"{{outerTraceId}}\">\r\n      <div class=\"applist-wrap c{{id}}\">\r\n        <div class=\"applist-rank\">{{$rankIndex}}</div>\r\n        <div class=\"applist-img\"><img class=\"J_lazyload lazyload\" data-src=\"{{icon}}\" width=\"52\" height=\"52\"></div><div class=\"applist-wrap-des\">\r\n          <h3 class=\"ellipsis\">{{displayName}}</h3>\r\n          <div class=\"applist-wrap-flex-item\">\r\n            <div class=\"applist-info\">\r\n              <div class=\"icon-star icon-star{{ratingScore}}\">\r\n                <div class=\"icon-star icon-star-light\"></div>\r\n              </div>\r\n              <span class=\"ellipsis\">{{level1CategoryName}}</span>\r\n              <span class=\"applit-delimit\">|</span>\r\n              <span>{{apkSize}} M</span>\r\n              {{ad-flag}}\r\n            </div>\r\n          </div>\r\n          <p class=\"applist-brief ellipsis\">{{briefShow}}</p>\r\n        </div>\r\n      </div>\r\n    </div>\r\n    <div class=\"J_btnInstall install-btn\" data-pname=\"{{packageName}}\">\r\n  <button type=\"button\" data-pname=\"{{packageName}}\" class=\"touch J_install\" data-appid=\"{{id}}\" data-installed=\"\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-link-title=\"{{displayName}}\" data-outertraceid=\"{{outerTraceId}}\"></button>\r\n  <div class=\"install-btn-display\">\r\n    <span class=\"J_appProgress install-progress\"></span>\r\n    <span class=\"J_appStatusProgress\">{{status}}</span>\r\n  </div>\r\n</div>\r\n  </div>\r\n</li>\r\n\r\n";
var _render = require('assets/js/module/render.js');
var tap = require('assets/js/module/tap.js');
var request = require('assets/js/request.js');
var formateMingleList = require('assets/js/formate/mingleList.js');
var cAppSuggest = require('components/app-suggest/app-suggest.js');
var formateApplist = require('assets/js/formate/applist.js');

device.registerAppStatus();
var posPrefix = 'app';
var expendMore = false;


var render = function(opt) {
  // 过渡
  var tpl;
  if (opt.briefShow) {
    tpl = tplWithBrief;
  } else {
    tpl = tplNoBrief;
  }
  expendMore = opt.expendMore;
  //实时数据tpl模板
  if (isInstantData) {
  tpl = tpl.replace(/([\s\S]*)(<\/li>)/g, function(s0, s1, s2) {
    return s1 + "<div class=\"statistics\" data-pos=\"{{pos}}\" data-stattype=\"{{statType}}\" data-mark=\"{{mark}}\">\r\n\t{{index}}\r\n\t{{tapAmount}}\r\n\t{{downAmount}}\r\n\t{{covertRate}}\r\n</div>" + s2;
  });
};
  opt = $.extend({
    tpl: tpl
  }, opt);
  var contain = opt.contain;
  // 根据pname做diff判断
  if (opt.diff) {
    var newContain = document.createElement('div');
    opt.contain = newContain;
    _render(opt);
    var $newContain = $(newContain);
    var $oldContain = $(contain);
    var $newElems = $newContain.find('li');
    var $oldElems = $oldContain.find('li');
    $newElems.each(function(i, elem) {
      var $elem = $(elem);
      var newPname = $elem.find('.touch').data('pname');
      var $oldElem = $oldElems.eq(i);
      if ($oldElem.length !== 0) {
        if (newPname !== $oldElem.find('.touch').data('pname')) {
          $oldElem.replaceWith($elem);
        }
      } else {
        $oldContain.append($newContain.find('li').slice(i));
        return false;
      }
    });
    newContain = null;
  } else {
    _render(opt);
    tap.on(contain);
    $(contain).on('tap', '.tap,.J_install', handTap);
    // contain.addEventListener('tap', handTap);
  }
  opt.contain = contain;
  initLog(opt);
  device.checkAppsStatus(contain, opt.list);
}

function initLog(opt) {
  // 如果是分类ID，说明从分类进来，否则是从精品进来
  // 只在专题详情页面使用
  var catId = opt.catId;
  var subjectId = opt.subjectId;
  if (catId && subjectId) {
    ref = 'subject/' + subjectId + '_' + catId;
  } else if (subjectId) {
    ref = 'subject/' + subjectId + '_-1';
  }
  var extraParams = {
    h5: h5
  };
  var experimentalId = opt.experimentalId;
  var adExtrasMap = opt.adExtrasMap;
  experimentalId && (extraParams.expid = experimentalId);
  adExtrasMap && $.extend(extraParams, adExtrasMap);
  opt.contain.dataset.extraParams = JSON.stringify(extraParams);
  console.log('extraParams', extraParams);
}

function handTap(e) {
  var dataset = this.dataset;
  var pName = dataset.pname;
  var reqQuery = createReqQuery({
    elem: this,
    posPrefix: posPrefix
  });
  var appId = dataset.appid;
  // 兼容旧版extraParams，全部的列表api都更新为带运营位的后，可以删除
  reqQuery.extra_params = $.extend(reqQuery.extra_params, JSON.parse(e.liveFired.dataset.extraParams));
  if (this.tagName.toLowerCase() === 'button') {
    if (this.disabled) return;
    if (dataset.installed !== 'true') {
      var installOpt = $.extend(reqQuery, {
        pName: pName,
        appId: appId
      });
      device.install(installOpt);
      var $applistContain = $(this).closest('li');
      // 某些不希望展开的应用，会设置expendMore=0
      if (expendMore && dataset.expendMore !== '0') {
        dataset.expendMore = 0;
        request.getJSON({
          url: HOST + 'recommend/relatedapps?packageName=' + pName,
          data: ajaxData,
          callBack: function(msg) {
            if (msg.data) {
              var renderList = formateApplist(msg.data);
              for (var i = 0, ii = renderList.length; i < ii; i++) {
                renderList[i]['$index'] = i;
              }
              cAppSuggest.render({
                contain: $applistContain[0],
                list: renderList,
                title: '安装 <span style="color:#09ae4a">' + dataset.linkTitle + '</span> 的用户还喜欢'
              });
            }
          }
        });
      }
    } else {
      market.openApp(JSON.stringify({
        pName: pName
      }));
    }
  } else {
    reqQuery.extra_params.refs = ajaxData.refs + '-detail/' + appId;
    var detailOpt = $.extend(reqQuery, {
      url: 'mimarket://details?appId=' + appId,
      title: dataset.linkTitle,
      launchMode: loadDetailMethod
    });
    market.loadPage(JSON.stringify(detailOpt));
  }
  e.stopPropagation();
}

exports.render = render; 
});
;define('components/app-suggest/app-suggest.js', function(require, exports, module){ /**
 * 点击展开更多应用
 * 注意：此组件会污染全局ref，只能用在搜索结果页面
 *
 *
 */
/**
 * @require components/app-list/app-list.css
 */
var device = require('assets/js/device.js');
var createReqQuery = require('assets/js/createReqQuery.js');
var tplWithBrief = "<li>\r\n  <div class=\"applist-item\">\r\n    <div class=\"tap J_exposure\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-pname=\"{{packageName}}\" data-link-title=\"{{displayName}}\"  data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-appid=\"{{id}}\" data-rid=\"{{rid}}\" data-outertraceid=\"{{outerTraceId}}\">\r\n      <div class=\"applist-wrap c{{id}}\">\r\n        <div class=\"applist-rank\">{{$rankIndex}}</div><div class=\"applist-img\"><img class=\"J_lazyload lazyload\" data-src=\"{{icon}}\" width=\"52\" height=\"52\"></div><div class=\"applist-wrap-des\">\r\n          <h3 class=\"ellipsis\">{{displayName}}</h3>\r\n          <div class=\"applist-wrap-flex-item\">\r\n            <div class=\"icon-star icon-star{{ratingScore}}\">\r\n              <div class=\"icon-star icon-star-light\"></div>\r\n            </div>\r\n          </div>\r\n          <p class=\"applist-info-bottom\">\r\n            <span class=\"ellipsis\">{{level1CategoryName}}</span>\r\n            <span>{{apkSize}} M</span>\r\n            {{ad-flag}}\r\n          </p>\r\n        </div>\r\n      </div>\r\n    </div>\r\n    <div class=\"J_btnInstall install-btn\" data-pname=\"{{packageName}}\">\r\n  <button type=\"button\" data-pname=\"{{packageName}}\" class=\"touch J_install\" data-appid=\"{{id}}\" data-installed=\"\" data-index=\"{{$index}}\" data-expid=\"{{experimentalId}}\" data-digest=\"{{digest}}\" data-ad=\"{{ads}}\" data-position=\"{{position}}\" data-link-title=\"{{displayName}}\" data-outertraceid=\"{{outerTraceId}}\"></button>\r\n  <div class=\"install-btn-display\">\r\n    <span class=\"J_appProgress install-progress\"></span>\r\n    <span class=\"J_appStatusProgress\">{{status}}</span>\r\n  </div>\r\n</div>\r\n  </div>\r\n</li>";
var _render = require('assets/js/module/render.js');
var tap = require('assets/js/module/tap.js');
var LazyLoad = require('assets/js/module/lazyLoad.js');
var lazyLoad = new LazyLoad();
var cListPanel = require('components/list-panel/list-panel.js');

device.registerAppStatus();
var posPrefix = 'appSuggest';

var render = function(opt) {
  var hotWordsPanel = cListPanel.createPanel(opt.title);
  var domUl = hotWordsPanel.content;
  hotWordsPanel.contain.classList.add('app-suggest');
  var list = opt.list;
  _render({
    contain: domUl,
    tpl: tplWithBrief,
    list: list
  });
  domUl.className = 'applist';
  opt.contain.appendChild(hotWordsPanel.contain);

  tap.on(domUl);
  $(domUl).on('tap', '.tap,.J_install', handTap);
  lazyLoad.show(true);
  device.checkAppsStatus(domUl, list);
}

function handTap(e) {
  var dataset = this.dataset;
  var pName = dataset.pname;
  window.ref = 'searchResult';
  var reqQuery = createReqQuery({
    elem: this,
    posPrefix: posPrefix,
    newRef: true
  });

  if (this.tagName.toLowerCase() === 'button') {
    if (this.disabled) return;
    if (dataset.installed !== 'true') {
      var installOpt = $.extend(reqQuery, {
        pName: pName,
        appId: dataset.appid
      });
      device.install(installOpt);
    } else {
      market.openApp(JSON.stringify({
        pName: pName
      }));
    }
  } else {
    reqQuery.extra_params.refs = ajaxData.refs + '-detail/' + pName;
    var detailOpt = $.extend(reqQuery, {
      url: 'mimarket://details?appId=' + dataset.appid,
      title: dataset.linkTitle,
      launchMode: loadDetailMethod
    })
    market.loadPage(JSON.stringify(detailOpt));
  }
  e.stopPropagation();
}

exports.render = render; 
});
;define('assets/js/scrollEvent.js', function(require, exports, module){ /*
 * 监听滚动事件
 * @param {Function} callBack 回调
 * @opt {Object} 回调参数
 *
 */
var $win = $(window);
var timer;

var scrollEvent = function(callBack, opt) {
  $win.off('scroll.efficient').on('scroll.efficient', function() {
    if (!timer) {
      timer = setTimeout(function() {
        timer = null;
        callBack(opt);
      }, 100);
    }
  });
};

module.exports = scrollEvent;
 
});
;define('assets/js/scrollBottomEvent.js', function(require, exports, module){ /*
 * 监听滚动到底部事件
 * @param {Function} callBack 回调
 * @opt {Object} 回调参数
 *
 */

var scrollEvent = function(callBack, opt) {
  var contain = opt.contain || window;
  var $contain = $(contain);
  var containHeight = $contain.height();
  var scrollHeight = contain.scrollHeight || document.body.scrollHeight;
  var timer;
  $contain.off('scroll.onbottom').on('scroll.onbottom', function() {
    if (!timer) {
      timer = setTimeout(function() {
        timer = null;
        if ((contain.scrollTop || window.scrollY) + containHeight > scrollHeight - 140) {
          $contain.off('scroll.onbottom');
          callBack(opt);
        }
      }, 100);
    }
  });
};

module.exports = scrollEvent;
 
});
;define('assets/js/request.js', function(require, exports, module){ var _local = {
  zh: {
    title: '网络提示',
    message: '检测到您的网络存在问题，建议您进行网络诊断并反馈结果，我们会尽快处理！',
    positiveText: '开始网络诊断',
    negativeText: '不了，谢谢'
  },
  en: {
    title: 'Network issue',
    message: 'There may be a problem with your network connection. Test your network to resolve the issue.',
    positiveText: 'Test network',
    negativeText: 'Later'
  }
};

_local = _local[lang];

/**
 * 获取json，过程会操作load（加载组件）状态
 * @param {String} url
 * @param {Object} data 携带的数据
 * @param {Function} callBack 成功回调
 * @param {Function} errorCallBack 失败回调
 * @param {Dom} load 是否设置load图标
 */

var callBackId = 0;
// 失败需要重连的上下文配置
var failOpts = [];
// 网络重试按钮点击数
var retryClick = 0;
// var firstReq = true;
var getJSON = function(opt) {
  var load = opt.load;
  var errorCallBack = opt.errorCallBack;
  var url = opt.url;
  var data = opt.data;
  var callBack = opt.callBack;
  load && load.showLoading();
  $.ajax({
    dataType: 'json',
    type: 'GET',
    url: url,
    data: data,
    success: function(msg) {
      successCallBack(msg);
      // showPage();
    },
    error: function(xhr, errorType, error) {
      var supportRequest = market.checkApis(JSON.stringify({
        apiNames: [{
          name: "request"
        }]
      }));

      if (supportRequest) {
        var callBackName = 'landCallBack' + callBackId++;
        console.log('callBackName', callBackName);
        window[callBackName] = function(msg) {
          if (msg) {
            msg = msg.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
            successCallBack(JSON.parse(msg));
          } else {
            showErr(xhr, errorType, error);
          }
          delete window[callBackName];
        }

        market.request(JSON.stringify({
          url: opt.url,
          get: true,
          params: data,
          callBack: callBackName
        }));
      } else {
        showErr(xhr, errorType, error);
      }
      // showPage();
    },
    timeout: 10000
  });

  function successCallBack(msg) {
    if (load) {
      // 第一次请求，loading图居中，请求成功后归位
      load.changePositon('bottom');
      load.hide();
    }
    retryClick = 0;
    callBack(msg);
  }

  function showErr(xhr, errorType, error) {
    load && load.showErr();
    errorCallBack && errorCallBack(xhr, errorType, error);
    console.log("error", xhr, errorType, error);
    console.log('opt', opt);

    failOpts.push(opt);
    window.autoReload = function(msg) {
      var state = JSON.parse(msg).state;
      console.log('autoReload', state);
      if (state === 1 || state === 2) {
        reload();
      }
    }

    market.registerNetworkChange && market.registerNetworkChange(JSON.stringify({
      callBack: 'autoReload'
    }));

    // 只需要一次监听
    if (failOpts.length === 1) {
      document.addEventListener('click', retry);
    }
  }
};

function retry(e) {
  if (e.target.dataset.retry === 'true') {
    reload();
    // 重试按钮点击达到三次，触发网络诊断
    retryClick++;
    var supportShowDialog = market.checkApis(JSON.stringify({
      apiNames: [{
        name: "showDialog"
      }]
    }));
    if (supportShowDialog && retryClick >= 3) {
      window.positiveCb = function() {
        market.loadPage(JSON.stringify({
          url: "intent:#Intent;component=com.xiaomi.market/.testutils.NetworkDiagnosticsActivity;B.start=true;end"
        }));
      };
      market.showDialog(JSON.stringify({
        title: _local.title,
        message: _local.message,
        positiveText: _local.positiveText,
        negativeText: _local.negativeText,
        positiveCb: "positiveCb",
        negativeCb: ""
      }));
    }
  }
}

function reload() {
  failOpts.forEach(function(elem, i) {
    console.log('request opt', elem);
    getJSON(elem);
  });
  failOpts.length = 0;
  document.removeEventListener('click', retry);
  // 把回调置空，删除监听
  market.registerNetworkChange(JSON.stringify({
    callBack: ''
  }));
  delete window.autoReload;
}

/*
 * 清除失败的请求队列
 */
function clearFailReq() {
  failOpts.length = 0;
}
/**
 * 清除native的loading过渡页面
 */
// function showPage() {
//   if (firstReq) {
//     setTimeout(function() {
//       console.log("finishLoading");
//       try {
//         market.finishLoading();
//       } catch (e) {
//         console.log(e);
//       }
//     }, 0);
//     firstReq = false;
//   }
// }

module.exports = {
  getJSON: getJSON,
  clearFailReq: clearFailReq
};
 
});
