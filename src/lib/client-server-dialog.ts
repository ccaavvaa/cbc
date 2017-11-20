export type RequestResolver<Request, Response> = (data: Request) => Promise<Response>;
export interface ICallbackClientSettings<Request, Response> {
    isResponse: (data: Request | Response) => data is Response;
    getRequestId: (data: Request | Response) => number;
    setRequestId(data: Request, requestId: number): void;
}

export class ClientServerDialog<Request, Response> {
    private rej: boolean;
    private _isWaitingClient: boolean;
    private executors: Array<PromiseResolver<Request, Response>> = [];
    private lastId = 0;

    private waitingPromise: Promise<Response>;
    public get isWaitingClient(): boolean {
        return this._isWaitingClient;
    }

    constructor(public readonly settings: ICallbackClientSettings<Request, Response>) {

    }
    public queryClient(request: Request): Promise<Response> {
        if (this._isWaitingClient) {
            return Promise.reject(new Error(`Allready waiting for client response ${this.lastId}`));
        }
        const requestId = ++this.lastId;
        this.settings.setRequestId(request, requestId);
        return new Promise<Response>((resolve, reject) => {
            this._isWaitingClient = true;
            this.executors.push({
                resolve,
                reject,
                requestId,
            });
            const currentResolver = this.executors.shift();
            currentResolver.resolve(request);
        });
    }

    public exchange(
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
                    if (!this.rej) {
                        const currentResolver = this.executors.shift();
                        if (currentResolver) {
                            currentResolver.resolve(r);
                        }
                    }
                });
        });
        return responsePromise;
    }

    private response(data: Response): Promise<Request | Response> {
        return new Promise<Request | Response>((resolve, reject) => {
            this.executors.push({
                resolve,
                reject,
                requestId: undefined,
            });
            const currentResolver = this.executors.shift();
            const requestId = this.settings.getRequestId(data);
            this._isWaitingClient = false;
            if (currentResolver.requestId !== requestId) {
                currentResolver.reject(
                    new Error(`unexpected request id!. Expected ${currentResolver.requestId}, received ${requestId}`)
                );
            } else {
                currentResolver.resolve(data);
            }
        });
    }
    private async execute(
        data: Request | Response,
        requestResolver?: RequestResolver<Request, Response>
    ): Promise<Request | Response> {
        if (this.settings.isResponse(data)) {
            return this.response(data);
        } else {
            let x: Promise<Response>;
            if (this.isWaitingClient) {
                this._isWaitingClient = false;
                x = this.waitingPromise;
                while (this.executors.length > 1) {
                    const executorToReject = this.executors.shift();
                    executorToReject.reject(new Error('out of band request'));
                }
            } else {
                this.waitingPromise = null;
                x = null;
            }
            if (requestResolver) {
                let p: Promise<Response>;
                if (x) {
                    try {
                        this.rej = true;
                        await x;
                    } finally {
                        this.waitingPromise = null;
                        this.rej = false;
                    }
                }
                this.waitingPromise = requestResolver(data);
                return this.waitingPromise;
            } else {
                return Promise.reject(new Error('request resolver is not defined'));
            }
        }
    }
}
class PromiseResolver<Request, Response> {
    public requestId: number;
    public resolve: (value?: Request | Response | PromiseLike<Request | Response>) => void;
    public reject: (reason?: any) => void;
}
