"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ClientServerDialog {
    constructor(settings) {
        this.settings = settings;
        this.executors = [];
        this.lastId = 0;
    }
    get isWaitingClient() {
        return this._isWaitingClient;
    }
    queryClient(request) {
        if (this._isWaitingClient) {
            return Promise.reject(new Error(`Allready waiting for client response ${this.lastId}`));
        }
        const requestId = ++this.lastId;
        this.settings.setRequestId(request, requestId);
        return new Promise((resolve, reject) => {
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
    exchange(data, requestResolver) {
        const responsePromise = new Promise((resolve, reject) => {
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
    response(data) {
        return new Promise((resolve, reject) => {
            this.executors.push({
                resolve,
                reject,
                requestId: undefined,
            });
            const currentResolver = this.executors.shift();
            const requestId = this.settings.getRequestId(data);
            this._isWaitingClient = false;
            if (currentResolver.requestId !== requestId) {
                currentResolver.reject(new Error(`unexpected request id!. Expected ${currentResolver.requestId}, received ${requestId}`));
            }
            else {
                currentResolver.resolve(data);
            }
        });
    }
    async execute(data, requestResolver) {
        if (this.settings.isResponse(data)) {
            return this.response(data);
        }
        else {
            let x;
            if (this.isWaitingClient) {
                this._isWaitingClient = false;
                x = this.waitingPromise;
                while (this.executors.length > 1) {
                    const executorToReject = this.executors.shift();
                    executorToReject.reject(new Error('out of band request'));
                }
            }
            else {
                this.waitingPromise = null;
                x = null;
            }
            if (requestResolver) {
                let p;
                if (x) {
                    try {
                        this.rej = true;
                        await x;
                    }
                    finally {
                        this.waitingPromise = null;
                        this.rej = false;
                    }
                }
                this.waitingPromise = requestResolver(data);
                return this.waitingPromise;
            }
            else {
                return Promise.reject(new Error('request resolver is not defined'));
            }
        }
    }
}
exports.ClientServerDialog = ClientServerDialog;
class PromiseResolver {
}

//# sourceMappingURL=client-server-dialog.js.map
