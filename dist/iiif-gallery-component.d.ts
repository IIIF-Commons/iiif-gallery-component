// iiif-gallery-component v0.0.1 https://github.com/viewdir/iiif-gallery-component#readme
declare namespace IIIFComponents {
    class GalleryComponent extends _Components.BaseComponent implements IGalleryComponent {
        options: IGalleryComponentOptions;
        private _$header;
        private _$main;
        private _$selectedThumb;
        private _$sizeDownButton;
        private _$sizeRange;
        private _$sizeUpButton;
        private _$thumbs;
        private _lastThumbClickedIndex;
        private _multiSelectState;
        private _range;
        private _scrollStopDuration;
        private _thumbsCache;
        thumbs: Manifold.IThumb[];
        constructor(options: IGalleryComponentOptions);
        protected _init(): boolean;
        protected _getDefaultOptions(): IGalleryComponentOptions;
        databind(): void;
        createThumbs(): void;
        private _getThumbsByRange(range);
        updateThumbs(): void;
        isChunkedResizingEnabled(): boolean;
        getSelectedThumbIndex(): number;
        getAllThumbs(): JQuery;
        getThumbByIndex(canvasIndex: number): JQuery;
        scrollToThumb(canvasIndex: number): void;
        searchPreviewStart(canvasIndex: number): void;
        searchPreviewFinish(): void;
        selectIndex(index: any): void;
        setLabel(): void;
        private _setRange();
        private _setThumbMultiSelected(thumb, selected);
        private _setMultiSelectEnabled(enabled);
        private _reset();
        protected _resize(): void;
    }
}
declare namespace IIIFComponents.GalleryComponent {
    class Events {
        static DECREASE_SIZE: string;
        static INCREASE_SIZE: string;
        static THUMB_SELECTED: string;
        static THUMB_MULTISELECTED: string;
    }
}

declare namespace IIIFComponents {
    interface IGalleryComponent extends _Components.IBaseComponent {
    }
}

declare namespace IIIFComponents {
    interface IGalleryComponentOptions extends _Components.IBaseComponentOptions {
        helper: Manifold.IHelper;
        chunkedResizingEnabled: boolean;
        chunkedResizingThreshold: number;
        pageModeEnabled: boolean;
        scrollStopDuration: number;
        sizingEnabled: boolean;
    }
}
