namespace IIIFComponents {

    type AnnotationGroup = manifold.AnnotationGroup;
    type Canvas = manifesto.Canvas;
    type MultiSelectableCanvas = manifold.MultiSelectableCanvas;
    type MultiSelectableRange = manifold.MultiSelectableRange;
    type MultiSelectableThumb = manifold.MultiSelectableThumb;
    type MultiSelectState = manifold.MultiSelectState;
    type Range = manifesto.Range;
    type Thumb = manifesto.Thumb;
    type ViewingDirection = manifesto.ViewingDirection;

    export interface IGalleryComponentContent {
        searchResult: string;
        searchResults: string;
        select: string;
        selectAll: string;
    }
    
    export interface IGalleryComponentData {
        chunkedResizingThreshold?: number;
        content?: IGalleryComponentContent;
        debug?: boolean;
        helper?: manifold.Helper | null;
        imageFadeInDuration?: number;
        initialZoom?: number;
        minLabelWidth?: number;
        pageModeEnabled?: boolean;
        searchResults?: AnnotationGroup[];
        scrollStopDuration?: number;
        sizingEnabled?: boolean;
        thumbHeight?: number;
        thumbLoadPadding?: number;
        thumbWidth?: number;
        viewingDirection?: ViewingDirection;
    }

    export class GalleryComponent extends _Components.BaseComponent {

        public options: _Components.IBaseComponentOptions;

        private _$header: JQuery;
        private _$leftOptions: JQuery;
        private _$main: JQuery;
        private _$multiSelectOptions: JQuery;
        private _$rightOptions: JQuery;
        private _$selectAllButton: JQuery;
        private _$selectAllButtonCheckbox: JQuery;
        private _$selectButton: JQuery;
        private _$selectedThumb: JQuery;
        private _$sizeDownButton: JQuery;
        private _$sizeRange: JQuery;
        private _$sizeUpButton: JQuery;
        private _$thumbs: JQuery;
        private _data: IGalleryComponentData = this.data();
        private _range: number;
        private _thumbs: MultiSelectableThumb[];
        private _thumbsCache: JQuery | null;

        constructor(options: _Components.IBaseComponentOptions) {
            super(options);
            this._data = this.options.data;
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

            this._$leftOptions = $('<div class="left"></div>');
            this._$header.append(this._$leftOptions);

            this._$rightOptions = $('<div class="right"></div>');
            this._$header.append(this._$rightOptions);

            this._$sizeDownButton = $('<input class="btn btn-default size-down" type="button" value="-" />');
            this._$leftOptions.append(this._$sizeDownButton);

            this._$sizeRange = $('<input type="range" name="size" min="1" max="10" value="' + this.options.data.initialZoom + '" />');
            this._$leftOptions.append(this._$sizeRange);

            this._$sizeUpButton = $('<input class="btn btn-default size-up" type="button" value="+" />');
            this._$leftOptions.append(this._$sizeUpButton);

            this._$multiSelectOptions = $('<div class="multiSelectOptions"></div>');
            this._$rightOptions.append(this._$multiSelectOptions);

            this._$selectAllButton = $('<div class="multiSelectAll"><input id="multiSelectAll" type="checkbox" tabindex="0" /><label for="multiSelectAll">' + this.options.data.content.selectAll + '</label></div>');
            this._$multiSelectOptions.append(this._$selectAllButton);
            this._$selectAllButtonCheckbox = $(this._$selectAllButton.find('input:checkbox'));

            this._$selectButton = $('<a class="select" href="#">' + this.options.data.content.select + '</a>');
            this._$multiSelectOptions.append(this._$selectButton);

            this._$main = $('<div class="main"></div>');
            this._$element.append(this._$main);

            this._$thumbs = $('<div class="thumbs"></div>');
            this._$main.append(this._$thumbs);

            this._$sizeDownButton.on('click', () => {
                var val = Number(this._$sizeRange.val()) - 1;

                if (val >= Number(this._$sizeRange.attr('min'))) {
                    this._$sizeRange.val(val.toString());
                    this._$sizeRange.trigger('change');
                    this.fire(GalleryComponent.Events.DECREASE_SIZE);
                }
            });

            this._$sizeUpButton.on('click', () => {
                var val = Number(this._$sizeRange.val()) + 1;

                if (val <= Number(this._$sizeRange.attr('max'))) {
                    this._$sizeRange.val(val.toString());
                    this._$sizeRange.trigger('change');
                    this.fire(GalleryComponent.Events.INCREASE_SIZE);
                }
            });

            this._$sizeRange.on('change', () => {
                this._updateThumbs();
                this._scrollToThumb(this._getSelectedThumbIndex());
            });

            this._$selectAllButton.checkboxButton((checked: boolean) => {

                const multiSelectState: MultiSelectState | null = this._getMultiSelectState();

                if (multiSelectState) {
                    if (checked) {
                        multiSelectState.selectAll(true);
                    } else {
                        multiSelectState.selectAll(false);
                    }
                }

                this.set(this.options.data);
            });
            
            this._$selectButton.on('click', () => {

                const multiSelectState: MultiSelectState | null = this._getMultiSelectState();

                if (multiSelectState) {
                    var ids: string[] = multiSelectState.getAllSelectedCanvases().map((canvas: Canvas) => {
                        return canvas.id;
                    });
    
                    this.fire(GalleryComponent.Events.MULTISELECTION_MADE, ids);
                }

            });

            this._setRange();

            $.templates({
                galleryThumbsTemplate: '\
                    <div class="{{:~galleryThumbClassName()}}" data-src="{{>uri}}" data-index="{{>index}}" data-visible="{{>visible}}" data-width="{{>width}}" data-height="{{>height}}" data-initialwidth="{{>initialWidth}}" data-initialheight="{{>initialHeight}}">\
                        <div class="wrap" style="width:{{>initialWidth}}px; height:{{>initialHeight}}px" data-link="class{merge:multiSelected toggle=\'multiSelected\'}">\
                        {^{if multiSelectEnabled}}\
                            <input id="thumb-checkbox-{{>id}}" type="checkbox" data-link="checked{:multiSelected ? \'checked\' : \'\'}" class="multiSelect" />\
                        {{/if}}\
                        </div>\
                        <div class="info">\
                            <span class="index" style="width:{{>initialWidth}}px">{{:#index + 1}}</span>\
                            <span class="label" style="width:{{>initialWidth}}px" title="{{>label}}">{{>label}}&nbsp;</span>\
                            <span class="searchResults" title="{{:~galleryThumbSearchResultsTitle()}}">{{>data.searchResults}}</span>\
                        </div>\
                    </div>'
            });

            const that = this;

            $.views.helpers({
                galleryThumbClassName: function() {
                    let className: string = "thumb preLoad";

                    if (this.data.index === 0) {
                        className += " first";
                    }

                    if (!this.data.uri) {
                        className += " placeholder";
                    }

                    return className;
                },
                galleryThumbSearchResultsTitle: function() {
                    const searchResults = Number(this.data.data.searchResults);
                    
                    if (searchResults) {

                        if (searchResults > 1) {
                            return Utils.Strings.format(that.options.data.content.searchResults, searchResults.toString());
                        }

                        return Utils.Strings.format(that.options.data.content.searchResult, searchResults.toString());
                    }
                    
                    return null;
                }
            });

            // use unevent to detect scroll stop.
            this._$main.on('scroll', () => {
                this._updateThumbs();
            }, this.options.data.scrollStopDuration);

            if (!this.options.data.sizingEnabled){
                this._$sizeRange.hide();
            }

            return success;
        }
        
        public data(): IGalleryComponentData {
            return <IGalleryComponentData> {
                chunkedResizingThreshold: 400,
                content: <IGalleryComponentContent>{
                    searchResult: "{0} search result",
                    searchResults: "{0} search results",
                    select: "Select",
                    selectAll: "Select All"
                },
                debug: false,
                helper: null,
                imageFadeInDuration: 300,
                initialZoom: 6,
                minLabelWidth: 20,
                pageModeEnabled: false,
                scrollStopDuration: 100,
                searchResults: [],
                sizingEnabled: true,
                thumbHeight: 320,
                thumbLoadPadding: 3,
                thumbWidth: 200,
                viewingDirection: manifesto.ViewingDirection.LEFT_TO_RIGHT
            }
        }
        
        public set(data: IGalleryComponentData): void {
            
            this._data = Object.assign(this._data, data);

            if (this._data.helper && this._data.thumbWidth !== undefined && this._data.thumbHeight !== undefined) {
                this._thumbs = <MultiSelectableThumb[]>this._data.helper.getThumbs(this._data.thumbWidth, this._data.thumbHeight);
            }

            if (this._data.viewingDirection) {
                if (this._data.viewingDirection.toString() === manifesto.ViewingDirection.BOTTOM_TO_TOP) {
                    this._thumbs.reverse();
                }
    
                this._$thumbs.addClass(this._data.viewingDirection.toString()); // defaults to "left-to-right"
            }

            if (this._data.searchResults && this._data.searchResults.length) {

                for (let i = 0; i < this._data.searchResults.length; i++) {
                    var searchResult: AnnotationGroup = this._data.searchResults[i];

                    // find the thumb with the same canvasIndex and add the searchResult
                    let thumb: Thumb = this._thumbs.filter(t => t.index === searchResult.canvasIndex)[0];

                    // clone the data so searchResults isn't persisted on the canvas.
                    let data = $.extend(true, {}, thumb.data);
                    data.searchResults = searchResult.rects.length;
                    thumb.data = data;
                }

            }

            this._thumbsCache = null; // delete cache

            this._createThumbs();

            if (this._data.helper) {
                this.selectIndex(this._data.helper.canvasIndex);
            }

            const multiSelectState: MultiSelectState | null = this._getMultiSelectState();

            if (multiSelectState && multiSelectState.isEnabled) {
                this._$multiSelectOptions.show();
                this._$thumbs.addClass("multiSelect");

                for (let i = 0; i < multiSelectState.canvases.length; i++) {
                    const canvas: MultiSelectableCanvas = multiSelectState.canvases[i];
                    const thumb: Thumb = this._getThumbByCanvas(canvas);
                    this._setThumbMultiSelected(thumb, canvas.multiSelected);
                }

                // range selections override canvas selections
                for (let i = 0; i < multiSelectState.ranges.length; i++) {
                    const range: MultiSelectableRange = multiSelectState.ranges[i];
                    const thumbs: Thumb[] = this._getThumbsByRange(range);

                    for (let i = 0; i < thumbs.length; i++){
                        const thumb: Thumb = thumbs[i];
                        this._setThumbMultiSelected(thumb, range.multiSelected);
                    }
                }

            } else {
                this._$multiSelectOptions.hide();
                this._$thumbs.removeClass("multiSelect");
            }

            this._update();
        }

        private _update(): void {
            var multiSelectState: MultiSelectState | null = this._getMultiSelectState();

            if (multiSelectState && multiSelectState.isEnabled) {
                // check/uncheck Select All checkbox
                this._$selectAllButtonCheckbox.prop("checked", multiSelectState.allSelected());

                const anySelected: boolean = multiSelectState.getAll().filter(t => t.multiSelected).length > 0;

                if (!anySelected) {
                    this._$selectButton.hide();
                } else {
                    this._$selectButton.show();
                }
            }
        }

        private _getMultiSelectState(): MultiSelectState | null {
            
            if (this._data.helper) {
                return this._data.helper.getMultiSelectState();
            }
            
            return null;
        }

        private _createThumbs(): void {
            const that = this;

            if (!this._thumbs) return;

            this._$thumbs.undelegate('.thumb', 'click');

            this._$thumbs.empty();

            const multiSelectState: MultiSelectState | null = this._getMultiSelectState();

            // set initial thumb sizes
            const heights = [];

            for (let i = 0; i < this._thumbs.length; i++) {
                const thumb: MultiSelectableThumb = this._thumbs[i];
                const initialWidth: number = thumb.width;
                const initialHeight: number = thumb.height;
                thumb.initialWidth = initialWidth;
                //thumb.initialHeight = initialHeight;
                heights.push(initialHeight);
                thumb.multiSelectEnabled = (multiSelectState) ? multiSelectState.isEnabled : false;
            }

            const medianHeight: number = Utils.Maths.median(heights);

            for (let i = 0; i < this._thumbs.length; i++) {
                const thumb: MultiSelectableThumb = this._thumbs[i];
                thumb.initialHeight = medianHeight;
            }

            this._$thumbs.link($.templates.galleryThumbsTemplate, this._thumbs);

            if (multiSelectState && !multiSelectState.isEnabled) {
                // add a selection click event to all thumbs
                this._$thumbs.delegate('.thumb', 'click', function (e) {
                    e.preventDefault();
                    const thumb = $.view(this).data;
                    that.fire(GalleryComponent.Events.THUMB_SELECTED, thumb);
                });
            } else {
                // make each thumb a checkboxButton
                const thumbs: JQuery = this._$thumbs.find('.thumb');

                for (var i = 0; i < thumbs.length; i++) {
 
                    const that = this;                    
                    const $thumb = $(thumbs[i]);

                    $thumb.checkboxButton(function(checked: boolean) {
                        const thumb: MultiSelectableThumb = $.view(this).data;
                        that._setThumbMultiSelected(thumb, !thumb.multiSelected);
                        const range: MultiSelectableRange = <MultiSelectableRange>that.options.data.helper.getCanvasRange(thumb.data);
                        const multiSelectState: MultiSelectState | null = that._getMultiSelectState();

                        if (multiSelectState) {
                            if (range) {
                                multiSelectState.selectRange(<MultiSelectableRange>range, thumb.multiSelected);
                            } else {
                                multiSelectState.selectCanvas(<MultiSelectableCanvas>thumb.data, thumb.multiSelected);
                            }
                        }

                        that._update();

                        that.fire(GalleryComponent.Events.THUMB_MULTISELECTED, thumb);
                    });
                }
            }
        }

        private _getThumbByCanvas(canvas: Canvas): Thumb {
            return this._thumbs.filter(c => c.data.id === canvas.id)[0];
        }

        private _sizeThumb($thumb: JQuery): void {

            const initialWidth: number = $thumb.data().initialwidth;
            const initialHeight: number = $thumb.data().initialheight;

            const width: number = Number(initialWidth);
            const height: number = Number(initialHeight);

            const newWidth: number = Math.floor(width * this._range);
            const newHeight: number = Math.floor(height * this._range);

            const $wrap: JQuery = $thumb.find('.wrap');
            const $label: JQuery = $thumb.find('.label');
            const $index: JQuery = $thumb.find('.index');
            const $searchResults: JQuery = $thumb.find('.searchResults');

            let newLabelWidth: number = newWidth;

            // if search results are visible, size index/label to accommodate it.
            // if the resulting size is below options.minLabelWidth, hide search results.
            if (this._data.searchResults && this._data.searchResults.length) {

                $searchResults.show();

                newLabelWidth = newWidth - (<any>$searchResults).outerWidth();

                if (this._data.minLabelWidth !== undefined && newLabelWidth < this._data.minLabelWidth) {
                    $searchResults.hide(); 
                    newLabelWidth = newWidth;      
                } else {
                    $searchResults.show();
                }

            } 

            if (this._data.pageModeEnabled) {
                $index.hide();
                $label.show();
            } else {
                $index.show();
                $label.hide();
            }

            $wrap.outerWidth(newWidth);
            $wrap.outerHeight(newHeight);
            $index.outerWidth(newLabelWidth);
            $label.outerWidth(newLabelWidth);
        }

        private _loadThumb($thumb: JQuery, cb?: (img: JQuery) => void): void {
            const $wrap: JQuery = $thumb.find('.wrap');

            if ($wrap.hasClass('loading') || $wrap.hasClass('loaded')) return;

            $thumb.removeClass('preLoad');

            // if no img has been added yet

            const visible: string | undefined = $thumb.attr('data-visible');
            const fadeDuration: number = this._data.imageFadeInDuration || 0;

            if (visible !== 'false') {
                $wrap.addClass('loading');
                const src: string | undefined = $thumb.attr('data-src');
                const $img: JQuery = $('<img class="thumbImage" src="' + src + '" />');
                // fade in on load.
                $img.hide();
                
                $img.on('load', function () {
                    $(this).fadeIn(fadeDuration, function () {
                        (<any>$(this).parent()).switchClass('loading', 'loaded');
                    });
                });

                $wrap.prepend($img);

                if (cb) cb($img);

            } else {
                $wrap.addClass('hidden');
            }

        }

        private _getThumbsByRange(range: Range): Thumb[] {

            let thumbs: Thumb[] = [];

            if (!this._data.helper) {
                return thumbs;
            }

            for (let i = 0; i < this._thumbs.length; i++) {
                const thumb: Thumb = this._thumbs[i];
                const canvas: Canvas = thumb.data;
                const r: Range = <Range>this._data.helper.getCanvasRange(canvas, range.path);

                if (r && r.id === range.id){
                    thumbs.push(thumb);
                }
            }

            return thumbs;
        }

        private _updateThumbs(): void {

            const debug: boolean = !!this._data.debug;

            // cache range size
            this._setRange();

            const scrollTop: number | undefined = this._$main.scrollTop();
            const scrollHeight: number | undefined = this._$main.height();
            const scrollBottom: number = (scrollTop as number) + (scrollHeight as number);

            if (debug) {
                console.log('scrollTop %s, scrollBottom %s', scrollTop, scrollBottom);
            }

            // test which thumbs are scrolled into view
            const thumbs = this._getAllThumbs();

            let numToUpdate: number = 0;

            for (let i = 0; i < thumbs.length; i++) {

                const $thumb: JQuery = $(thumbs[i]);
                const thumbTop: number = $thumb.position().top;
                const thumbHeight: number | undefined = $thumb.outerHeight();
                const thumbBottom: number = thumbTop + (thumbHeight as number);

                const padding: number = (thumbHeight as number) * (this._data.thumbLoadPadding as number);

                // check all thumbs to see if they are within the scroll area plus padding
                if (thumbTop <= scrollBottom + padding && thumbBottom >= (scrollTop as number) - padding) {

                    numToUpdate += 1;

                    //let $label: JQuery = $thumb.find('span:visible').not('.searchResults');

                    // if (debug) {
                    //     $thumb.addClass('debug');
                    //     $label.empty().append('t: ' + thumbTop + ', b: ' + thumbBottom);
                    // } else {
                    //     $thumb.removeClass('debug');
                    // }

                    this._sizeThumb($thumb);

                    $thumb.addClass('insideScrollArea');

                    // if (debug) {
                    //     $label.append(', i: true');
                    // }

                    this._loadThumb($thumb);
                } else {

                    $thumb.removeClass('insideScrollArea');

                    // if (debug) {
                    //     $label.append(', i: false');
                    // }
                }
            }

            if (debug) {
                console.log('number of thumbs to update: ' + numToUpdate);
            }

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
            const $thumb: JQuery = this._getThumbByIndex(canvasIndex)
            this._$main.scrollTop($thumb.position().top);
        }

        // these don't work well because thumbs are loaded in chunks
        
        // public searchPreviewStart(canvasIndex: number): void {
        //     this._scrollToThumb(canvasIndex);
        //     const $thumb: JQuery = this._getThumbByIndex(canvasIndex);
        //     $thumb.addClass('searchpreview');
        // }

        // public searchPreviewFinish(): void {
        //     this._scrollToThumb(this._data.helper.canvasIndex);
        //     this._getAllThumbs().removeClass('searchpreview');
        // }

        public selectIndex(index: number): void {
            if (!this._thumbs || !this._thumbs.length) return;
            this._getAllThumbs().removeClass('selected');
            this._$selectedThumb = this._getThumbByIndex(index);
            this._$selectedThumb.addClass('selected');
            this._scrollToThumb(index);
            // make sure visible images are loaded.
            this._updateThumbs();
        }

        private _setRange(): void {
            const norm = Utils.Maths.normalise(Number(this._$sizeRange.val()), 0, 10);
            this._range = Utils.Maths.clamp(norm, 0.05, 1);
        }

        private _setThumbMultiSelected(thumb: Thumb, selected: boolean): void {
            $.observable(thumb).setProperty("multiSelected", selected);
        }

        protected _resize(): void {

        }
    }
}

namespace IIIFComponents.GalleryComponent {
    export class Events {
        static DECREASE_SIZE: string = 'decreaseSize';
        static INCREASE_SIZE: string = 'increaseSize';
        static MULTISELECTION_MADE: string = 'multiSelectionMade';
        static THUMB_SELECTED: string = 'thumbSelected';
        static THUMB_MULTISELECTED: string = 'thumbMultiSelected';
    }
}

(function(g:any) {
    if (!g.IIIFComponents){
        g.IIIFComponents = IIIFComponents;
    } else {
        g.IIIFComponents.GalleryComponent = IIIFComponents.GalleryComponent;
    }
})(window);

interface JQuery {
    // jsviews
    link: any;
    render: any;
    // unevent
    on(events: string, handler: (eventObject: JQueryEventObject, ...args: any[]) => any, wait: Number): JQuery;
    // plugins
    checkboxButton(onClicked: (checked: boolean) => void): void;
}

interface JQueryStatic {
    // jsviews
    observable: any;
    templates: any;
    views: any;
    view: any;
}