namespace IIIFComponents {
    export class GalleryComponent extends _Components.BaseComponent implements IGalleryComponent {

        public options: IGalleryComponentOptions;

        private _$header: JQuery;
        private _$main: JQuery;
        private _$selectedThumb: JQuery;
        private _$sizeDownButton: JQuery;
        private _$sizeRange: JQuery;
        private _$sizeUpButton: JQuery;
        private _$thumbs: JQuery;
        private _lastThumbClickedIndex: number;
        private _multiSelectState: Manifold.MultiSelectState;
        private _range: number;
        private _scrollStopDuration: number = 100;
        private _thumbs: Manifold.IThumb[];
        private _thumbsCache: JQuery;

        constructor(options: IGalleryComponentOptions) {
            super(options);
            
            this._init();
            this._resize();
        }

        protected _init(): boolean {
            var success: boolean = super._init();

            if (!success){
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

            this._$sizeDownButton.on('click', () => {
                var val = Number(this._$sizeRange.val()) - 1;

                if (val >= Number(this._$sizeRange.attr('min'))){
                    this._$sizeRange.val(val.toString());
                    this._$sizeRange.trigger('change');
                    this._emit(GalleryComponent.Events.DECREASE_SIZE);
                }
            });

            this._$sizeUpButton.on('click', () => {
                var val = Number(this._$sizeRange.val()) + 1;

                if (val <= Number(this._$sizeRange.attr('max'))){
                    this._$sizeRange.val(val.toString());
                    this._$sizeRange.trigger('change');
                    this._emit(GalleryComponent.Events.INCREASE_SIZE);
                }
            });

            this._$sizeRange.on('change', () => {
                this._updateThumbs();
                this._scrollToThumb(this._getSelectedThumbIndex());
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
                className: function(){
                    var className = "thumb preLoad";

                    if (this.data.index === 0){
                        className += " first";
                    }

                    if (!this.data.uri){
                        className += " placeholder";
                    }

                    return className;
                }
            });

            // use unevent to detect scroll stop.
            this._$main.on('scroll', () => {
                this._updateThumbs();
            }, this.options.scrollStopDuration);

            if (!this.options.sizingEnabled){
                this._$sizeRange.hide();
            }

            this._updateMultiSelectState();

            return success;
        }
        
        protected _getDefaultOptions(): IGalleryComponentOptions {
            return <IGalleryComponentOptions>{
                chunkedResizingEnabled: true,
                chunkedResizingThreshold: 400,
                helper: null,
                imageFadeInDuration: 300,
                pageModeEnabled: false,
                scrollStopDuration: 100,
                sizingEnabled: true,
                thumbLoadPadding: 3
            }
        }
        
        public databind(thumbs: Manifold.IThumb[]): void{
            this._thumbs = thumbs;
            this._reset();
            this._createThumbs();
        }

        private _createThumbs(): void{
            var that = this;

            if (!this._thumbs) return;

            if (this._isChunkedResizingEnabled()) {
                this._$thumbs.addClass("chunked");
            }

            // set initial thumb sizes
            var heights = [];

            for(var i = 0; i < this._thumbs.length; i++) {
                var thumb: Manifold.IThumb = this._thumbs[i];
                var initialWidth = thumb.width;
                var initialHeight = thumb.height;
                thumb.initialWidth = initialWidth;
                //thumb.initialHeight = initialHeight;
                heights.push(initialHeight);
            }

            var medianHeight = Math.median(heights);

            for(var j = 0; j < this._thumbs.length; j++){
                var thumb: Manifold.IThumb = this._thumbs[j];
                thumb.initialHeight = medianHeight;
            }

            this._$thumbs.link($.templates.galleryThumbsTemplate, this._thumbs);

            if (!that._multiSelectState.isEnabled){
                // add a selection click event to all thumbs
                this._$thumbs.delegate('.thumb', 'click', function (e) {
                    e.preventDefault();
                    var thumb = $.view(this).data;
                    that._lastThumbClickedIndex = thumb.index;
                    that._emit(GalleryComponent.Events.THUMB_SELECTED, thumb);
                });
            } else {
                // make each thumb a checkboxButton
                $.each(this._$thumbs.find('.thumb'), (index: number, thumb: any) => {
                    var $thumb = $(thumb);

                    $thumb.checkboxButton(function(checked: boolean) {
                        var thumb = $.view(this).data;
                        that._setThumbMultiSelected(thumb, !thumb.multiSelected);
                        that._emit(GalleryComponent.Events.THUMB_MULTISELECTED, thumb);
                    });
                })
            }

            this._selectIndex(this.options.helper.canvasIndex);
            this._setLabel();
            this._updateThumbs();
        }

        private _updateMultiSelectState(): void {
            this._multiSelectState = this.options.helper.getMultiSelectState();
        }

        private _sizeThumb($thumb: JQuery) : void {

            var $wrap = $thumb.find('.wrap');

            var width: number = Number($thumb.data().initialwidth);
            var height: number = Number($thumb.data().initialheight);

            var $label = $thumb.find('.label');

            var newWidth = Math.floor(width * this._range);
            var newHeight = Math.floor(height * this._range);

            $wrap.outerWidth(newWidth);
            $wrap.outerHeight(newHeight);
            $label.outerWidth(newWidth);
        }

        private _loadThumb($thumb: JQuery, cb?: (img: JQuery) => void): void {
            var $wrap = $thumb.find('.wrap');

            if ($wrap.hasClass('loading') || $wrap.hasClass('loaded')) return;

            $thumb.removeClass('preLoad');

            // if no img has been added yet

            var visible = $thumb.attr('data-visible');

            var fadeDuration = this.options.imageFadeInDuration;

            if (visible !== "false") {
                $wrap.addClass('loading');
                var src = $thumb.attr('data-src');
                var img = $('<img class="thumbImage" src="' + src + '" />');
                // fade in on load.
                $(img).hide().load(function () {
                    $(this).fadeIn(fadeDuration, function () {
                        $(this).parent().swapClass('loading', 'loaded');
                    });
                });

                $wrap.prepend(img);
                if (cb) cb(img);
            } else {
                $wrap.addClass('hidden');
            }

        }

        private _getThumbsByRange(range: Manifold.IRange): Manifold.IThumb[] {
            var thumbs: Manifold.IThumb[] = [];

            for (var i = 0; i < this._thumbs.length; i++) {
                var thumb: Manifold.IThumb = this._thumbs[i];
                var canvas: Manifold.ICanvas = thumb.data;

                var r: Manifold.IRange = <Manifold.IRange>this.options.helper.getCanvasRange(canvas, range.path);

                if (r && r.id === range.id){
                    thumbs.push(thumb);
                }
            }

            return thumbs;
        }

        _updateThumbs(): void {

            var debug: boolean = false;

            // cache range size
            this._setRange();

            var scrollTop: number = this._$main.scrollTop();
            var scrollHeight: number = this._$main.height();
            var scrollBottom: number = scrollTop + scrollHeight;

            if (debug){
                console.log('scrollTop %s, scrollBottom %s', scrollTop, scrollBottom);
            }

            // test which thumbs are scrolled into view
            var thumbs = this._getAllThumbs();

            for (var i = 0; i < thumbs.length; i++) {

                var $thumb = $(thumbs[i]);

                var thumbTop = $thumb.position().top;
                var thumbHeight = $thumb.outerHeight();
                var thumbBottom = thumbTop + thumbHeight;

                if (debug) {
                    var $label = $thumb.find('span:visible');
                    $label.empty().append('t: ' + thumbTop + ', b: ' + thumbBottom);
                }

                // if chunked resizing isn't enabled, resize all thumbs
                if (!this._isChunkedResizingEnabled()) {
                    this._sizeThumb($thumb);
                }

                var padding: number = thumbHeight * this.options.thumbLoadPadding;

                // check all thumbs to see if they are within the scroll area plus padding
                if (thumbTop <= scrollBottom + padding && thumbBottom >= scrollTop - padding){

                    // if chunked resizing is enabled, only resize, equalise, and show thumbs in the scroll area
                    if (this._isChunkedResizingEnabled()) {
                        this._sizeThumb($thumb);
                    }

                    $thumb.removeClass('outsideScrollArea');

                    if (debug) {
                        $label.append(', i: true');
                    }

                    this._loadThumb($thumb);
                } else {

                    $thumb.addClass('outsideScrollArea');

                    if (debug) {
                        $label.append(', i: false');
                    }
                }
            }
        }

        private _isChunkedResizingEnabled(): boolean {
            if (this.options.chunkedResizingEnabled && this._thumbs.length > this.options.chunkedResizingThreshold){
                return true;
            }
            return false;
        }

        private _getSelectedThumbIndex(): number {
            return Number(this._$selectedThumb.data('index'));
        }

        private _getAllThumbs(): JQuery {
            if (!this._thumbsCache){
                this._thumbsCache = this._$thumbs.find('.thumb');
            }
            return this._thumbsCache;
        }

        private _getThumbByIndex(canvasIndex: number): JQuery {
            return this._$thumbs.find('[data-index="' + canvasIndex + '"]');
        }

        private _scrollToThumb(canvasIndex: number): void {
            var $thumb = this._getThumbByIndex(canvasIndex)
            this._$main.scrollTop($thumb.position().top);
        }

        private _searchPreviewStart(canvasIndex: number): void {
            this._scrollToThumb(canvasIndex);
            var $thumb = this._getThumbByIndex(canvasIndex);
            $thumb.addClass('searchpreview');
        }

        private _searchPreviewFinish(): void {
            this._scrollToThumb(this.options.helper.canvasIndex);
            this._getAllThumbs().removeClass('searchpreview');
        }

        private _selectIndex(index): void {
            if (!this._thumbs || !this._thumbs.length) return;
            index = parseInt(index);
            this._getAllThumbs().removeClass('selected');
            this._$selectedThumb = this._getThumbByIndex(index);
            this._$selectedThumb.addClass('selected');
            // make sure visible images are loaded.
            this._updateThumbs();
        }

        private _setLabel(): void {
            if (this.options.pageModeEnabled) {
                $(this._$thumbs).find('span.index').hide();
                $(this._$thumbs).find('span.label').show();
            } else {
                $(this._$thumbs).find('span.index').show();
                $(this._$thumbs).find('span.label').hide();
            }
        }

        private _setRange(): void {
            var norm = Math.normalise(Number(this._$sizeRange.val()), 0, 10);
            this._range = Math.clamp(norm, 0.05, 1);
        }

        private _setThumbMultiSelected(thumb: Manifold.IThumb, selected: boolean): void {
            $.observable(thumb).setProperty("multiSelected", selected);
        }

        private _setMultiSelectEnabled(enabled: boolean): void {
            for (var i = 0; i < this._thumbs.length; i++){
                var thumb: Manifold.IThumb = this._thumbs[i];
                thumb.multiSelectEnabled = enabled;
            }
        }
 
        private _reset(): void {
            this._$thumbs.undelegate('.thumb', 'click');
            this._setMultiSelectEnabled(this._multiSelectState.isEnabled);
        }

        protected _resize(): void {
            
        }
    }
}

namespace IIIFComponents.GalleryComponent {
    export class Events {
        static DECREASE_SIZE: string = 'decreaseSize';
        static INCREASE_SIZE: string = 'increaseSize';
        static THUMB_SELECTED: string = 'thumbSelected';
        static THUMB_MULTISELECTED: string = 'thumbMultiSelected';
    }
}

(function(w) {
    if (!w.IIIFComponents){
        w.IIIFComponents = IIIFComponents;
    } else {
        w.IIIFComponents.GalleryComponent = IIIFComponents.GalleryComponent;
    }
})(window);