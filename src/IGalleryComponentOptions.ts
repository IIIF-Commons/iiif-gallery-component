namespace IIIFComponents{
    export interface IGalleryComponentOptions extends _Components.IBaseComponentOptions {
        helper: Manifold.IHelper;
        chunkedResizingEnabled: boolean;
        chunkedResizingThreshold: number;
        pageModeEnabled: boolean;
        scrollStopDuration: number;
        sizingEnabled: boolean;
    }
}