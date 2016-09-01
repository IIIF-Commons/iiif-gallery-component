namespace IIIFComponents{
    export interface IGalleryComponentOptions extends _Components.IBaseComponentOptions {
        chunkedResizingEnabled: boolean;
        chunkedResizingThreshold: number;
        helper: Manifold.IHelper;
        imageFadeInDuration: number;
        pageModeEnabled: boolean;
        scrollStopDuration: number;
        sizingEnabled: boolean;
        thumbLoadPadding: number;
    }
}