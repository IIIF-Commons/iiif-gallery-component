namespace IIIFComponents{
    
    export interface IContent {
        select: string;
        selectAll: string;
    }
    
    export interface IGalleryComponentOptions extends _Components.IBaseComponentOptions {
        chunkedResizingEnabled: boolean;
        chunkedResizingThreshold: number;
        content: IContent;
        debug: boolean;
        helper: Manifold.IHelper;
        imageFadeInDuration: number;
        pageModeEnabled: boolean;
        scrollStopDuration: number;
        sizingEnabled: boolean;
        thumbHeight: number;
        thumbLoadPadding: number;
        thumbWidth: number;
        viewingDirection: Manifesto.ViewingDirection
    }
}