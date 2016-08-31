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
        private _thumbsCache: JQuery;

        public thumbs: Manifold.IThumb[];

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
                this.updateThumbs();
                this.scrollToThumb(this.getSelectedThumbIndex());
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
                this.updateThumbs();
            }, this.options.scrollStopDuration);

            if (!this.options.sizingEnabled){
                this._$sizeRange.hide();
            }

            return success;
        }
        
        protected _getDefaultOptions(): IGalleryComponentOptions {
            return <IGalleryComponentOptions>{
                helper: null,
                scrollStopDuration: 100,
                chunkedResizingEnabled: true,
                chunkedResizingThreshold: 400,
                pageModeEnabled: false,
                sizingEnabled: true
            }
        }
        
        public databind(): void{
            if (!this.thumbs) return;
            this._reset();
            this.createThumbs();
        }

        createThumbs(): void{
            var that = this;

            if (!this.thumbs) return;

            if (this.isChunkedResizingEnabled()) {
                this._$thumbs.addClass("chunked");
            }

            // set initial thumb sizes
            var heights = [];

            for(var i = 0; i < this.thumbs.length; i++) {
                var thumb: Manifold.IThumb = this.thumbs[i];
                var initialWidth = thumb.width;
                var initialHeight = thumb.height;
                thumb.initialWidth = initialWidth;
                //thumb.initialHeight = initialHeight;
                heights.push(initialHeight);
            }

            var medianHeight = Math.median(heights);

            for(var j = 0; j < this.thumbs.length; j++){
                var thumb: Manifold.IThumb = this.thumbs[j];
                thumb.initialHeight = medianHeight;
            }

            this._$thumbs.link($.templates.galleryThumbsTemplate, this.thumbs);

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

            this.selectIndex(this.options.helper.canvasIndex);

            this.setLabel();

            this.updateThumbs();
        }

        private _getThumbsByRange(range: Manifold.IRange): Manifold.IThumb[] {
            var thumbs: Manifold.IThumb[] = [];

            for (var i = 0; i < this.thumbs.length; i++) {
                var thumb: Manifold.IThumb = this.thumbs[i];
                var canvas: Manifold.ICanvas = thumb.data;

                var r: Manifold.IRange = <Manifold.IRange>this.options.helper.getCanvasRange(canvas, range.path);

                if (r && r.id === range.id){
                    thumbs.push(thumb);
                }
            }

            return thumbs;
        }

        updateThumbs(): void {
        
        }

        isChunkedResizingEnabled(): boolean {
            if (this.options.chunkedResizingEnabled && this.thumbs.length > this.options.chunkedResizingThreshold){
                return true;
            }
            return false;
        }

        getSelectedThumbIndex(): number {
            return Number(this._$selectedThumb.data('index'));
        }

        getAllThumbs(): JQuery {
            if (!this._thumbsCache){
                this._thumbsCache = this._$thumbs.find('.thumb');
            }
            return this._thumbsCache;
        }

        getThumbByIndex(canvasIndex: number): JQuery {
            return this._$thumbs.find('[data-index="' + canvasIndex + '"]');
        }

        scrollToThumb(canvasIndex: number): void {
            var $thumb = this.getThumbByIndex(canvasIndex)
            this._$main.scrollTop($thumb.position().top);
        }

        searchPreviewStart(canvasIndex: number): void {
            this.scrollToThumb(canvasIndex);
            var $thumb = this.getThumbByIndex(canvasIndex);
            $thumb.addClass('searchpreview');
        }

        searchPreviewFinish(): void {
            this.scrollToThumb(this.options.helper.canvasIndex);
            this.getAllThumbs().removeClass('searchpreview');
        }

        selectIndex(index): void {
            // may be authenticating
            if (index === -1) return;
            if (!this.thumbs || !this.thumbs.length) return;
            index = parseInt(index);
            this.getAllThumbs().removeClass('selected');
            this._$selectedThumb = this.getThumbByIndex(index);
            this._$selectedThumb.addClass('selected');
            // make sure visible images are loaded.
            this.updateThumbs();
        }

        setLabel(): void {
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
            for (var i = 0; i < this.thumbs.length; i++){
                var thumb: Manifold.IThumb = this.thumbs[i];
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