class PromiseResolver<Request, Response> {
    public requestId: number;
    public resolve: (value?: Request | Response | PromiseLike<Request | Response>) => void;
    public reject: (reason?: any) => void;
}

export type RequestResolver<Request, Response> = (data: Request) => Promise<Response>;
export interface ICallbackClientSettings<Request, Response> {
    isResponse: (data: Request | Response) => data is Response;
    getRequestId: (data: Request | Response) => number;
    setRequestId(data: Request, requestId: number): void;
}

export class CallbackClient<Request, Response> {
    private executors: Array<PromiseResolver<Request, Response>> = [];
    private nextId = 1;

    constructor(public readonly settings: ICallbackClientSettings<Request, Response>) {

    }

    public response(data: Response): Promise<Request | Response> {
        return new Promise<Request | Response>((resolve, reject) => {
            this.executors.push({
                resolve,
                reject,
                requestId: undefined,
            });
            const currentResolver = this.executors.shift();
            const requestId = this.settings.getRequestId(data);
            if (currentResolver.requestId !== requestId) {
                currentResolver.reject(
                    new Error(`unexpected request id!. Expected ${currentResolver.requestId}, received ${requestId}`)
                );
            } else {
                currentResolver.resolve(data);
            }
        });

    }
    public execute(
        data: Request | Response,
        requestResolver?: RequestResolver<Request, Response>
    ): Promise<Request | Response> {
        if (this.settings.isResponse(data)) {
            return new Promise<Request | Response>((resolve, reject) => {
                this.executors.push({
                    resolve,
                    reject,
                    requestId: undefined,
                });
                const currentResolver = this.executors.shift();
                currentResolver.resolve(data);
            });
        } else {
            return requestResolver ?
                requestResolver(data) :
                Promise.reject(new Error('request resolver is not defined'));
        }
    }
    public queryClient(request: Request): Promise<Response> {
        const requestId = this.nextId++;
        this.settings.setRequestId(request, requestId);
        return new Promise<Response>((resolve, reject) => {
            this.executors.push({
                resolve,
                reject,
                requestId,
            });
            const currentResolver = this.executors.shift();
            currentResolver.resolve(request);
        });
    }
    public process(
        data: Request | Response,
        requestResolver?: RequestResolver<Request, Response>
    ): Promise<Request | Response> {
        const responsePromise = new Promise<Request | Response>((resolve, reject) => {
            this.executors.push({
                resolve,
                reject,
                requestId: this.settings.getRequestId(data),
            });
            this.execute(data, requestResolver)
                .then((r) => {
                    const currentResolver = this.executors.shift();
                    currentResolver.resolve(r);
                });
        });
        return responsePromise;
    }
}
