// tslint:disable:only-arrow-functions
// tslint:disable-next-line:no-implicit-dependencies
import * as chai from 'chai';
import './debug-test';
// tslint:disable-next-line:no-implicit-dependencies
import 'mocha';
import { Tools } from '../lib/util';
import { Request } from '../lib/request';
import { Response } from '../lib/response';
import { CallbackClient } from '../lib/server';

const expect = chai.expect;
// const assert = chai.assert;

class BO {
    constructor(private readonly cb: CallbackClient<Request, Response>) {

    }
    public async execute(data: Request): Promise<Response> {
        const response: Response = {
            data: data.query,
        };
        if (data.query.startsWith('q')) {
            const clientQuery = {
                query: data.query,
            };
            const queryData = await this.cb.queryClient(clientQuery);
            response.data = response.data + ':' + queryData.data;
        }
        return response;
    }
}

function createServerAndBO() {
    const server = new CallbackClient<Request, Response>({
        isResponse: (data: Request | Response): data is Response => {
            return (data as Response).requestId ? true : false;
        },
        getRequestId: (data: Request | Response): number => {
            return (data as Response).requestId || (data as Request).id;
        },
        setRequestId(request: Request, requestId: number): void {
            request.id = requestId;
        },
    });
    const bo = new BO(server);
    const boMethod = bo.execute.bind(bo);
    return { server, bo, boMethod };
}
describe('test', () => {

    it('test', () => {
        // ok
    });
    it('server no cbc', async function () {
        const { server, bo, boMethod } = createServerAndBO();
        const r = await server.process({
            query: 'x',
        }, boMethod);
        expect(r).eql({
            data: 'x',
        });
    });
    it('server with cbc', async function () {
        const { server, bo, boMethod } = createServerAndBO();
        let r = await server.process({
            query: 'qx',
        }, boMethod);
        expect(r).eql({
            id: 1,
            query: 'qx',
        });
        r = await server.process({
            requestId: 1,
            data: 'y',
        });
        expect(r).eql({
            data: 'qx:y',
        });
    });
});
