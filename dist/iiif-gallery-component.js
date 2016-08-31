// iiif-gallery-component v0.0.1 https://github.com/viewdir/iiif-gallery-component#readme
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.iiifGalleryComponent = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var IIIFComponents;
(function (IIIFComponents) {
    var GalleryComponent = (function (_super) {
        __extends(GalleryComponent, _super);
        function GalleryComponent(options) {
            _super.call(this, options);
            this._scrollStopDuration = 100;
            this._init();
            this._resize();
        }
        GalleryComponent.prototype._init = function () {
            var _this = this;
            var success = _super.prototype._init.call(this);
            if (!success) {
                console.error("Component failed to initialise");
            }
            this._$header = $('<div class="header"></div>');
            this._$element.append(this._$header);
            this._$sizeDownButton = $('<input class="btn btn-default size-down" type="button" value="-" />');
            this._$header.append(this._$sizeDownButton);
            this._$sizeRange = $('<input type="range" name="size" min="1" max="10" value="6" />');
            this._$header.append(this._$sizeRange);
            this._$sizeUpButton = $('<input class="btn btn-default size-up" type="button" value="+" />');
            this._$header.append(this._$sizeUpButton);
            this._$main = $('<div class="main"></div>');
            this._$element.append(this._$main);
            this._$thumbs = $('<div class="thumbs"></div>');
            this._$main.append(this._$thumbs);
            this._$thumbs.addClass(this.options.helper.getViewingDirection().toString()); // defaults to "left-to-right"
            this._$sizeDownButton.on('click', function () {
                var val = Number(_this._$sizeRange.val()) - 1;
                if (val >= Number(_this._$sizeRange.attr('min'))) {
                    _this._$sizeRange.val(val.toString());
                    _this._$sizeRange.trigger('change');
                    _this._emit(GalleryComponent.Events.DECREASE_SIZE);
                }
            });
            this._$sizeUpButton.on('click', function () {
                var val = Number(_this._$sizeRange.val()) + 1;
                if (val <= Number(_this._$sizeRange.attr('max'))) {
                    _this._$sizeRange.val(val.toString());
                    _this._$sizeRange.trigger('change');
                    _this._emit(GalleryComponent.Events.INCREASE_SIZE);
                }
            });
            this._$sizeRange.on('change', function () {
                _this.updateThumbs();
                _this.scrollToThumb(_this.getSelectedThumbIndex());
            });
            this._setRange();
            $.templates({
                galleryThumbsTemplate: '\
                    <div class="{{:~className()}}" data-src="{{>uri}}" data-index="{{>index}}" data-visible="{{>visible}}" data-width="{{>width}}" data-height="{{>height}}" data-initialwidth="{{>initialWidth}}" data-initialheight="{{>initialHeight}}">\
                        <div class="wrap" style="width:{{>initialWidth}}px; height:{{>initialHeight}}px" data-link="class{merge:multiSelected toggle=\'multiSelected\'}">\
                        {^{if multiSelectEnabled}}\
                            <input id="thumb-checkbox-{{>id}}" type="checkbox" data-link="checked{:multiSelected ? \'checked\' : \'\'}" class="multiSelect" />\
                        {{/if}}\
                        </div>\
                        <span class="index">{{:#index + 1}}</span>\
                        <span class="label" style="width:{{>initialWidth}}px" title="{{>label}}">{{>label}}&nbsp;</span>\
                    </div>'
            });
            $.views.helpers({
                className: function () {
                    var className = "thumb preLoad";
                    if (this.data.index === 0) {
                        className += " first";
                    }
                    if (!this.data.uri) {
                        className += " placeholder";
                    }
                    return className;
                }
            });
            // use unevent to detect scroll stop.
            this._$main.on('scroll', function () {
                _this.updateThumbs();
            }, this.options.scrollStopDuration);
            if (!this.options.sizingEnabled) {
                this._$sizeRange.hide();
            }
            return success;
        };
        GalleryComponent.prototype._getDefaultOptions = function () {
            return {
                helper: null,
                scrollStopDuration: 100,
                chunkedResizingEnabled: true,
                chunkedResizingThreshold: 400,
                pageModeEnabled: false,
                sizingEnabled: true
            };
        };
        GalleryComponent.prototype.databind = function () {
            if (!this.thumbs)
                return;
            this._reset();
            this.createThumbs();
        };
        GalleryComponent.prototype.createThumbs = function () {
            var that = this;
            if (!this.thumbs)
                return;
            if (this.isChunkedResizingEnabled()) {
                this._$thumbs.addClass("chunked");
            }
            // set initial thumb sizes
            var heights = [];
            for (var i = 0; i < this.thumbs.length; i++) {
                var thumb = this.thumbs[i];
                var initialWidth = thumb.width;
                var initialHeight = thumb.height;
                thumb.initialWidth = initialWidth;
                //thumb.initialHeight = initialHeight;
                heights.push(initialHeight);
            }
            var medianHeight = Math.median(heights);
            for (var j = 0; j < this.thumbs.length; j++) {
                var thumb = this.thumbs[j];
                thumb.initialHeight = medianHeight;
            }
            this._$thumbs.link($.templates.galleryThumbsTemplate, this.thumbs);
            if (!that._multiSelectState.isEnabled) {
                // add a selection click event to all thumbs
                this._$thumbs.delegate('.thumb', 'click', function (e) {
                    e.preventDefault();
                    var thumb = $.view(this).data;
                    that._lastThumbClickedIndex = thumb.index;
                    that._emit(GalleryComponent.Events.THUMB_SELECTED, thumb);
                });
            }
            else {
                // make each thumb a checkboxButton
                $.each(this._$thumbs.find('.thumb'), function (index, thumb) {
                    var $thumb = $(thumb);
                    $thumb.checkboxButton(function (checked) {
                        var thumb = $.view(this).data;
                        that._setThumbMultiSelected(thumb, !thumb.multiSelected);
                        that._emit(GalleryComponent.Events.THUMB_MULTISELECTED, thumb);
                    });
                });
            }
            this.selectIndex(this.options.helper.canvasIndex);
            this.setLabel();
            this.updateThumbs();
        };
        GalleryComponent.prototype._getThumbsByRange = function (range) {
            var thumbs = [];
            for (var i = 0; i < this.thumbs.length; i++) {
                var thumb = this.thumbs[i];
                var canvas = thumb.data;
                var r = this.options.helper.getCanvasRange(canvas, range.path);
                if (r && r.id === range.id) {
                    thumbs.push(thumb);
                }
            }
            return thumbs;
        };
        GalleryComponent.prototype.updateThumbs = function () {
        };
        GalleryComponent.prototype.isChunkedResizingEnabled = function () {
            if (this.options.chunkedResizingEnabled && this.thumbs.length > this.options.chunkedResizingThreshold) {
                return true;
            }
            return false;
        };
        GalleryComponent.prototype.getSelectedThumbIndex = function () {
            return Number(this._$selectedThumb.data('index'));
        };
        GalleryComponent.prototype.getAllThumbs = function () {
            if (!this._thumbsCache) {
                this._thumbsCache = this._$thumbs.find('.thumb');
            }
            return this._thumbsCache;
        };
        GalleryComponent.prototype.getThumbByIndex = function (canvasIndex) {
            return this._$thumbs.find('[data-index="' + canvasIndex + '"]');
        };
        GalleryComponent.prototype.scrollToThumb = function (canvasIndex) {
            var $thumb = this.getThumbByIndex(canvasIndex);
            this._$main.scrollTop($thumb.position().top);
        };
        GalleryComponent.prototype.searchPreviewStart = function (canvasIndex) {
            this.scrollToThumb(canvasIndex);
            var $thumb = this.getThumbByIndex(canvasIndex);
            $thumb.addClass('searchpreview');
        };
        GalleryComponent.prototype.searchPreviewFinish = function () {
            this.scrollToThumb(this.options.helper.canvasIndex);
            this.getAllThumbs().removeClass('searchpreview');
        };
        GalleryComponent.prototype.selectIndex = function (index) {
            // may be authenticating
            if (index === -1)
                return;
            if (!this.thumbs || !this.thumbs.length)
                return;
            index = parseInt(index);
            this.getAllThumbs().removeClass('selected');
            this._$selectedThumb = this.getThumbByIndex(index);
            this._$selectedThumb.addClass('selected');
            // make sure visible images are loaded.
            this.updateThumbs();
        };
        GalleryComponent.prototype.setLabel = function () {
            if (this.options.pageModeEnabled) {
                $(this._$thumbs).find('span.index').hide();
                $(this._$thumbs).find('span.label').show();
            }
            else {
                $(this._$thumbs).find('span.index').show();
                $(this._$thumbs).find('span.label').hide();
            }
        };
        GalleryComponent.prototype._setRange = function () {
            var norm = Math.normalise(Number(this._$sizeRange.val()), 0, 10);
            this._range = Math.clamp(norm, 0.05, 1);
        };
        GalleryComponent.prototype._setThumbMultiSelected = function (thumb, selected) {
            $.observable(thumb).setProperty("multiSelected", selected);
        };
        GalleryComponent.prototype._setMultiSelectEnabled = function (enabled) {
            for (var i = 0; i < this.thumbs.length; i++) {
                var thumb = this.thumbs[i];
                thumb.multiSelectEnabled = enabled;
            }
        };
        GalleryComponent.prototype._reset = function () {
            this._$thumbs.undelegate('.thumb', 'click');
            this._setMultiSelectEnabled(this._multiSelectState.isEnabled);
        };
        GalleryComponent.prototype._resize = function () {
        };
        return GalleryComponent;
    }(_Components.BaseComponent));
    IIIFComponents.GalleryComponent = GalleryComponent;
})(IIIFComponents || (IIIFComponents = {}));
var IIIFComponents;
(function (IIIFComponents) {
    var GalleryComponent;
    (function (GalleryComponent) {
        var Events = (function () {
            function Events() {
            }
            Events.DECREASE_SIZE = 'decreaseSize';
            Events.INCREASE_SIZE = 'increaseSize';
            Events.THUMB_SELECTED = 'thumbSelected';
            Events.THUMB_MULTISELECTED = 'thumbMultiSelected';
            return Events;
        }());
        GalleryComponent.Events = Events;
    })(GalleryComponent = IIIFComponents.GalleryComponent || (IIIFComponents.GalleryComponent = {}));
})(IIIFComponents || (IIIFComponents = {}));
(function (w) {
    if (!w.IIIFComponents) {
        w.IIIFComponents = IIIFComponents;
    }
    else {
        w.IIIFComponents.GalleryComponent = IIIFComponents.GalleryComponent;
    }
})(window);





},{}]},{},[1])(1)
});