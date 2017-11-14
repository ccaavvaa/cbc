import { Request } from './request';
import { Response } from './response';
import { Tools } from './util';

export type Data = Request | Response;
class PromiseResolver {
    public resolve: (value?: Data | PromiseLike<Data>) => void;
    public reject: (reason?: any) => void;
}

export class Server {
    private executors: PromiseResolver[] = [];
    private nextId = 1;

    public async execute(data: Data): Promise<Data> {
        if (Tools.objectIsRequest(data)) {
            const response: Response = {
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
            return response;
        } else {
            return new Promise<Data>((resolve, reject) => {
                this.executors.push({
                    resolve,
                    reject,
                });
                const currentResolver = this.executors.splice(0, 1)[0];
                currentResolver.resolve(data);
            });
        }
    }
    public queryClient(request: Request): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            this.executors.push({
                resolve,
                reject,
            });
            const currentResolver = this.executors.splice(0, 1)[0];
            currentResolver.resolve(request);
        });
    }
    public process(data: Data): Promise<Data> {
        const responsePromise = new Promise<Data>((resolve, reject) => {
            this.executors.push({ resolve, reject });
            this.execute(data)
                .then((r) => {
                    const currentResolver = this.executors.splice(0, 1)[0];
                    currentResolver.resolve(r);
                });
        });
        return responsePromise;
    }
}
