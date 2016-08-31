namespace IIIFComponents {
    export class GalleryComponent extends _Components.BaseComponent implements IGalleryComponent {

        public options: IGalleryComponentOptions;
        private _thumbsCache: JQuery;
        private _scrollStopDuration: number = 100;
        $header: JQuery;
        $main: JQuery;
        $selectedThumb: JQuery;
        $sizeDownButton: JQuery;
        $sizeRange: JQuery;
        $sizeUpButton: JQuery;
        $thumbs: JQuery;
        isOpen: boolean = false;
        lastThumbClickedIndex: number;
        multiSelectState: Manifold.MultiSelectState;
        range: number;

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
            
            this.$header = $('<div class="header"></div>');
            this._$element.append(this.$header);

            this.$sizeDownButton = $('<input class="btn btn-default size-down" type="button" value="-" />');
            this.$header.append(this.$sizeDownButton);

            this.$sizeRange = $('<input type="range" name="size" min="1" max="10" value="6" />');
            this.$header.append(this.$sizeRange);

            this.$sizeUpButton = $('<input class="btn btn-default size-up" type="button" value="+" />');
            this.$header.append(this.$sizeUpButton);

            this.$main = $('<div class="main"></div>');
            this._$element.append(this.$main);

            this.$thumbs = $('<div class="thumbs"></div>');
            this.$main.append(this.$thumbs);

            this.$thumbs.addClass(this.options.helper.getViewingDirection().toString()); // defaults to "left-to-right"

            this.$sizeDownButton.on('click', () => {
                var val = Number(this.$sizeRange.val()) - 1;

                if (val >= Number(this.$sizeRange.attr('min'))){
                    this.$sizeRange.val(val.toString());
                    this.$sizeRange.trigger('change');
                    this._emit(GalleryComponent.Events.GALLERY_DECREASE_SIZE);
                }
            });

            this.$sizeUpButton.on('click', () => {
                var val = Number(this.$sizeRange.val()) + 1;

                if (val <= Number(this.$sizeRange.attr('max'))){
                    this.$sizeRange.val(val.toString());
                    this.$sizeRange.trigger('change');
                    this._emit(GalleryComponent.Events.GALLERY_INCREASE_SIZE);
                }
            });

            this.$sizeRange.on('change', () => {
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
            this.$main.on('scroll', () => {
                this.updateThumbs();
            }, this._scrollStopDuration);

            if (!Modernizr.inputtypes.range){
                this.$sizeRange.hide();
            }

            return success;
        }
        
        protected _getDefaultOptions(): IGalleryComponentOptions {
            return <IGalleryComponentOptions>{
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
                this.$thumbs.addClass("chunked");
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

            this.$thumbs.link($.templates.galleryThumbsTemplate, this.thumbs);

            if (!that.multiSelectState.isEnabled){
                // add a selection click event to all thumbs
                this.$thumbs.delegate('.thumb', 'click', function (e) {
                    e.preventDefault();
                    var data = $.view(this).data;
                    that.lastThumbClickedIndex = data.index;
                    $.publish(BaseCommands.THUMB_SELECTED, [data]);
                });
            } else {
                // make each thumb a checkboxButton
                $.each(this.$thumbs.find('.thumb'), (index: number, thumb: any) => {
                    var $thumb = $(thumb);

                    $thumb.checkboxButton(function(checked: boolean) {
                        var data = $.view(this).data;
                        that._setThumbMultiSelected(data, !data.multiSelected);
                        $.publish(Commands.THUMB_MULTISELECTED, [data]);
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

        private _setRange(): void {
            var norm = Math.normalise(Number(this.$sizeRange.val()), 0, 10);
            this.range = Math.clamp(norm, 0.05, 1);
        }

        protected _resize(): void {
            
        }
    }
}

namespace IIIFComponents.GalleryComponent {
    export class Events {
        static GALLERY_DECREASE_SIZE: string = 'decreaseSize';
        static GALLERY_INCREASE_SIZE: string = 'increaseSize';
    }
}

(function(w) {
    if (!w.IIIFComponents){
        w.IIIFComponents = IIIFComponents;
    } else {
        w.IIIFComponents.GalleryComponent = IIIFComponents.GalleryComponent;
    }
})(window);