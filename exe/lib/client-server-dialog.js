"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PromiseResolver {
}
class ClientServerDialog {
    constructor(settings) {
        this.settings = settings;
        this.lastId = 0;
    }
    get isWaitingClient() {
        return this.serverExecutor ? true : false;
    }
    queryClient(request) {
        if (this.isWaitingClient) {
            return Promise.reject(new Error(`Allready waiting for client response ${this.lastId}`));
        }
        const requestId = ++this.lastId;
        this.settings.setRequestId(request, requestId);
        return new Promise((resolve, reject) => {
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
    async exchange(data, requestResolver) {
        if (this.settings.isResponse(data)) {
            const requestId = this.settings.getRequestId(data);
            if (!this.isWaitingClient
                || !this.serverExecutor
                || this.serverExecutor.requestId !== requestId) {
                return Promise.reject('Out of band response');
            }
            const serverExecutor = this.serverExecutor;
            this.serverExecutor = null;
            const p = new Promise((resolve, reject) => {
                this.clientExecutor = {
                    resolve,
                    reject,
                    requestId: undefined,
                };
            });
            serverExecutor.resolve(data);
            return p;
        }
        let clientPromise = new Promise((resolve, reject) => {
            this.clientExecutor = {
                resolve,
                reject,
                requestId: undefined,
            };
        });
        if (this.isWaitingClient) {
            const serverExecutor = this.serverExecutor;
            const oldRequestPromise = this.requestPromise;
            this.serverExecutor = null;
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
exports.ClientServerDialog = ClientServerDialog;

//# sourceMappingURL=client-server-dialog.js.map
