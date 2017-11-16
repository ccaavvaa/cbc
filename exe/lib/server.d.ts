export declare type RequestResolver<Request, Response> = (data: Request) => Promise<Response>;
export interface ICallbackClientSettings<Request, Response> {
    isResponse: (data: Request | Response) => data is Response;
    getRequestId: (data: Request | Response) => number;
    setRequestId(data: Request, requestId: number): void;
}
export declare class CallbackClient<Request, Response> {
    readonly settings: ICallbackClientSettings<Request, Response>;
    private executors;
    private nextId;
    constructor(settings: ICallbackClientSettings<Request, Response>);
    response(data: Response): Promise<Request | Response>;
    execute(data: Request | Response, requestResolver?: RequestResolver<Request, Response>): Promise<Request | Response>;
    queryClient(request: Request): Promise<Response>;
    process(data: Request | Response, requestResolver?: RequestResolver<Request, Response>): Promise<Request | Response>;
}
