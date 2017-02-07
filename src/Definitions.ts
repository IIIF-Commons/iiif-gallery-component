interface JQuery {
    // jsviews
    link: any;
    render: any;
    // unevent
    on(events: string, handler: (eventObject: JQueryEventObject, ...args: any[]) => any, wait: Number): JQuery;
    // plugins
    checkboxButton(onClicked: (checked: boolean) => void): void;
    swapClass(removeClass: string, addClass: string): void;
}

interface JQueryStatic {
    // jsviews
    observable: any;
    templates: any;
    views: any;
    view: any;
}