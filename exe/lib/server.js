"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
class PromiseResolver {
}
class Server {
    constructor() {
        this.executors = [];
        this.nextId = 1;
    }
    async execute(data) {
        let r;
        if (util_1.Tools.objectIsRequest(data)) {
            const response = {
                data: data.query,
            };
            if (data.query.startsWith('q')) {
                const clientQuery = {
                    id: this.nextId++,
                    query: data.query,
                };
                const queryData = await this.queryClient(clientQuery);
                if (queryData.requestId !== clientQuery.id) {
                    response.isError = true;
                    response.data = 'err ' + response.data;
                }
                response.data = response.data + ':' + queryData.data;
            }
            r = response;
        }
        else {
            const currentResolver = this.executors.pop();
            return new Promise((resolve, reject) => {
                this.executors.push({
                    resolve,
                    reject,
                });
                currentResolver.resolve(data);
            });
        }
    }
    queryClient(request) {
        const currentResolver = this.executors.pop();
        return new Promise((resolve, reject) => {
            this.executors.push({
                resolve,
                reject,
            });
            currentResolver.resolve(request);
        });
    }
    process(data) {
        const responsePromise = new Promise((resolve, reject) => {
            this.executors.push({ resolve, reject });
            this.execute(data)
                .then((r) => {
                const currentResolver = this.executors.pop();
                currentResolver.resolve(r);
            });
        });
        return responsePromise;
    }
}
exports.Server = Server;

//# sourceMappingURL=server.js.map
