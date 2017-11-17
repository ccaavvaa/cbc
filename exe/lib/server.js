"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CallbackClient {
    constructor(settings) {
        this.settings = settings;
        this.executors = [];
        this.lastId = 0;
    }
    get isWaitingClient() {
        return this._isWaitingForClient;
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
            this._isWaitingForClient = false;
            if (currentResolver.requestId !== requestId) {
                currentResolver.reject(new Error(`unexpected request id!. Expected ${currentResolver.requestId}, received ${requestId}`));
            }
            else {
                currentResolver.resolve(data);
            }
        });
    }
    execute(data, requestResolver) {
        if (this.settings.isResponse(data)) {
            return this.response(data);
        }
        else {
            return requestResolver ?
                requestResolver(data) :
                Promise.reject(new Error('request resolver is not defined'));
        }
    }
    queryClient(request) {
        const requestId = ++this.lastId;
        this.settings.setRequestId(request, requestId);
        return new Promise((resolve, reject) => {
            this._isWaitingForClient = true;
            this.executors.push({
                resolve,
                reject,
                requestId,
            });
            const currentResolver = this.executors.shift();
            currentResolver.resolve(request);
        });
    }
    process(data, requestResolver) {
        const responsePromise = new Promise((resolve, reject) => {
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
exports.CallbackClient = CallbackClient;
class PromiseResolver {
}

//# sourceMappingURL=server.js.map
