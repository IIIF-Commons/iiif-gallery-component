namespace IIIFComponents {
    export interface IGalleryComponent extends _Components.IBaseComponent{
        searchPreviewStart(canvasIndex: number): void;
        searchPreviewFinish(): void;
        selectIndex(index: number): void; 
    }
}