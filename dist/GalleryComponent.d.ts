/// <reference types="@iiif/manifold" />
/// <reference types="manifesto.js" />
/// <reference types="@iiif/base-component" />
/// <reference types="jquery" />
declare namespace IIIFComponents {
    interface IGalleryComponentContent {
        searchResult: string;
        searchResults: string;
        select: string;
        selectAll: string;
    }
    interface IGalleryComponentData {
        chunkedResizingThreshold: number;
        content: IGalleryComponentContent;
        debug: boolean;
        helper: Manifold.IHelper | null;
        imageFadeInDuration: number;
        initialZoom: number;
        minLabelWidth: number;
        pageModeEnabled: boolean;
        searchResults: Manifold.AnnotationGroup[];
        scrollStopDuration: number;
        sizingEnabled: boolean;
        thumbHeight: number;
        thumbLoadPadding: number;
        thumbWidth: number;
        viewingDirection: Manifesto.ViewingDirection;
    }
    class GalleryComponent extends _Components.BaseComponent {
        options: _Components.IBaseComponentOptions;
        private _$header;
        private _$leftOptions;
        private _$main;
        private _$multiSelectOptions;
        private _$rightOptions;
        private _$selectAllButton;
        private _$selectAllButtonCheckbox;
        private _$selectButton;
        private _$selectedThumb;
        private _$sizeDownButton;
        private _$sizeRange;
        private _$sizeUpButton;
        private _$thumbs;
        private _range;
        private _thumbs;
        private _thumbsCache;
        constructor(options: _Components.IBaseComponentOptions);
        protected _init(): boolean;
        data(): IGalleryComponentData;
        set(): void;
        private _update;
        private _getMultiSelectState;
        private _createThumbs;
        private _getThumbByCanvas;
        private _sizeThumb;
        private _loadThumb;
        private _getThumbsByRange;
        private _updateThumbs;
        private _getSelectedThumbIndex;
        private _getAllThumbs;
        private _getThumbByIndex;
        private _scrollToThumb;
        selectIndex(index: number): void;
        private _setRange;
        private _setThumbMultiSelected;
        protected _resize(): void;
    }
}
declare namespace IIIFComponents.GalleryComponent {
    class Events {
        static DECREASE_SIZE: string;
        static INCREASE_SIZE: string;
        static MULTISELECTION_MADE: string;
        static THUMB_SELECTED: string;
        static THUMB_MULTISELECTED: string;
    }
}
interface JQuery {
    link: any;
    render: any;
    on(events: string, handler: (eventObject: JQueryEventObject, ...args: any[]) => any, wait: Number): JQuery;
    checkboxButton(onClicked: (checked: boolean) => void): void;
}
interface JQueryStatic {
    observable: any;
    templates: any;
    views: any;
    view: any;
}
