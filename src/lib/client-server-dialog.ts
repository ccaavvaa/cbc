export type RequestResolver<Request, Response> = (data: Request) => Promise<Response>;
export interface ICallbackClientSettings<Request, Response> {
    isResponse: (data: Request | Response) => data is Response;
    getRequestId: (data: Request | Response) => number;
    setRequestId(data: Request, requestId: number): void;
}
class PromiseResolver<Request, Response> {
    public requestId: number;
    public resolve: (value?: Request | Response | PromiseLike<Request | Response>) => void;
    public reject: (reason?: any) => void;
}

export class ClientServerDialog<Request, Response> {
    private requestPromiseCanceled: boolean;
    private clientExecutor: PromiseResolver<Request, Response>;
    private serverExecutor: PromiseResolver<Request, Response>;
    private lastId = 0;

    private requestPromise: Promise<Response>;
    public get isWaitingClient(): boolean {
        return this.serverExecutor ? true : false;
    }

    constructor(public readonly settings: ICallbackClientSettings<Request, Response>) {

    }
    public queryClient(request: Request): Promise<Response> {
        if (this.isWaitingClient) {
            return Promise.reject(new Error(`Allready waiting for client response ${this.lastId}`));
        }
        const requestId = ++this.lastId;
        this.settings.setRequestId(request, requestId);
        return new Promise<Response>((resolve, reject) => {
            this.serverExecutor = {
                resolve,
                reject,
                requestId,
            };
            const currentResolver = this.clientExecutor;
            this.clientExecutor = null;
            currentResolver.resolve(request);
        });
    }

    public async exchange(
        data: Request | Response,
        requestResolver?: RequestResolver<Request, Response>
    ): Promise<Request | Response> {
        if (this.settings.isResponse(data)) {
            const requestId = this.settings.getRequestId(data);
            if (!this.isWaitingClient
                || !this.serverExecutor
                || this.serverExecutor.requestId !== requestId) {// out of band response
                return Promise.reject('Out of band response');
            }
            const serverExecutor = this.serverExecutor;
            this.serverExecutor = null;
            const p = new Promise<Request | Response>((resolve, reject) => {
                this.clientExecutor = {
                    resolve,
                    reject,
                    requestId: undefined,
                };
            });
            serverExecutor.resolve(data);
            return p;
        }
        // request
        let clientPromise = new Promise<Response>((resolve, reject) => {
            this.clientExecutor = {
                resolve,
                reject,
                requestId: undefined,
            };
        });

        if (this.isWaitingClient) { // out of band request
            const serverExecutor = this.serverExecutor;
            this.serverExecutor = null;
            const oldRequestPromise = this.requestPromise;
            this.requestPromise = null;
            this.requestPromiseCanceled = true;
            serverExecutor.reject('Out of band request');
            if (oldRequestPromise) {
                await oldRequestPromise;
            }
        }

        this.requestPromiseCanceled = false;
        this.requestPromise = requestResolver(data);
        this.requestPromise.then((r) => {
            if (!this.requestPromiseCanceled) {
                const currentResolver = this.clientExecutor;
                if (currentResolver) {
                    currentResolver.resolve(r);
                }
            }
        });
        return clientPromise;
    }
}
