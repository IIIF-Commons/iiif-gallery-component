(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TinyEmitter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function E () {
	// Keep this empty so it's easier to inherit from
  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
}

E.prototype = {
	on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    };

    listener._ = callback
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // Remove event from queue to prevent memory leak
    // Suggested by https://github.com/lazd
    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
};

module.exports = E;

},{}]},{},[1])(1)
});
!function(f){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=f();else if("function"==typeof define&&define.amd)define([],f);else{var g;g="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,g.baseComponent=f()}}(function(){return function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a="function"==typeof require&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}for(var i="function"==typeof require&&require,o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){var _Components;!function(_Components){function applyMixins(derivedCtor,baseCtors){baseCtors.forEach(function(baseCtor){Object.getOwnPropertyNames(baseCtor.prototype).forEach(function(name){derivedCtor.prototype[name]=baseCtor.prototype[name]})})}var BaseComponent=function(){function BaseComponent(options){this.options=$.extend(this._getDefaultOptions(),options)}return BaseComponent.prototype._init=function(){return this._$element=$(this.options.element),this._$element.length?(this._$element.empty(),!0):(console.warn("element not found"),!1)},BaseComponent.prototype._getDefaultOptions=function(){return{}},BaseComponent.prototype._emit=function(event){for(var args=[],_i=1;_i<arguments.length;_i++)args[_i-1]=arguments[_i];this.emit(event,args)},BaseComponent.prototype._resize=function(){},BaseComponent.prototype.databind=function(data){},BaseComponent}();_Components.BaseComponent=BaseComponent,_Components.applyMixins=applyMixins,applyMixins(BaseComponent,[TinyEmitter])}(_Components||(_Components={})),function(w){w._Components||(w._Components=_Components)}(window)},{}]},{},[1])(1)});
!function(f){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=f();else if("function"==typeof define&&define.amd)define([],f);else{var g;g="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,g.componentBoilerplate=f()}}(function(){return function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a="function"==typeof require&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}for(var i="function"==typeof require&&require,o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){var MyComponents,__extends=this&&this.__extends||function(d,b){function __(){this.constructor=d}for(var p in b)b.hasOwnProperty(p)&&(d[p]=b[p]);d.prototype=null===b?Object.create(b):(__.prototype=b.prototype,new __)};!function(MyComponents){var ExampleComponent=function(_super){function ExampleComponent(options){_super.call(this,options),this._init(),this._resize()}return __extends(ExampleComponent,_super),ExampleComponent.prototype.test=function(){this._emit(ExampleComponent.Events.TEST,[1,2,"three"])},ExampleComponent.prototype._init=function(){var success=_super.prototype._init.call(this);return success||console.error("Component failed to initialise"),this._$element.append("I am an example component"),success},ExampleComponent.prototype._getDefaultOptions=function(){return{}},ExampleComponent.prototype._resize=function(){},ExampleComponent}(_Components.BaseComponent);MyComponents.ExampleComponent=ExampleComponent}(MyComponents||(MyComponents={}));var MyComponents;!function(MyComponents){var ExampleComponent;!function(ExampleComponent){var Events=function(){function Events(){}return Events.TEST="test",Events}();ExampleComponent.Events=Events}(ExampleComponent=MyComponents.ExampleComponent||(MyComponents.ExampleComponent={}))}(MyComponents||(MyComponents={})),function(w){w.MyComponents?w.MyComponents.ExampleComponent=MyComponents.ExampleComponent:w.MyComponents=MyComponents}(window)},{}]},{},[1])(1)});