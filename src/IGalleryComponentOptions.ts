namespace IIIFComponents{
    
    export interface IContent {
        searchResult: string;
        searchResults: string;
        select: string;
        selectAll: string;
    }
    
    export interface IGalleryComponentOptions extends _Components.IBaseComponentOptions {
        chunkedResizingThreshold: number;
        content: IContent;
        debug: boolean;
        helper: Manifold.IHelper;
        imageFadeInDuration: number;
        initialZoom: number;
        minLabelWidth: number;
        pageModeEnabled: boolean;
        searchResults: Manifold.SearchResult[];
        scrollStopDuration: number;
        sizingEnabled: boolean;
        thumbHeight: number;
        thumbLoadPadding: number;
        thumbWidth: number;
        viewingDirection: Manifesto.ViewingDirection
    }
}