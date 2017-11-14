import { Request } from './request';
import { Response } from './response';
export declare type Data = Request | Response;
export declare class Server {
    private executors;
    private nextId;
    execute(data: Data): Promise<Data>;
    queryClient(request: Request): Promise<Response>;
    process(data: Data): Promise<Data>;
}
