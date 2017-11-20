export declare type RequestResolver<Request, Response> = (data: Request) => Promise<Response>;
export interface ICallbackClientSettings<Request, Response> {
    isResponse: (data: Request | Response) => data is Response;
    getRequestId: (data: Request | Response) => number;
    setRequestId(data: Request, requestId: number): void;
}
export declare class ClientServerDialog<Request, Response> {
    readonly settings: ICallbackClientSettings<Request, Response>;
    private requestPromiseCanceled;
    private clientExecutor;
    private serverExecutor;
    private lastId;
    private requestPromise;
    readonly isWaitingClient: boolean;
    constructor(settings: ICallbackClientSettings<Request, Response>);
    queryClient(request: Request): Promise<Response>;
    exchange(data: Request | Response, requestResolver?: RequestResolver<Request, Response>): Promise<Request | Response>;
}
