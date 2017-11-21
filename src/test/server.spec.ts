// tslint:disable:only-arrow-functions
// tslint:disable-next-line:no-implicit-dependencies
import * as chai from 'chai';
import './debug-test';
// tslint:disable-next-line:no-implicit-dependencies
import 'mocha';
import { ClientServerDialog } from '../lib/client-server-dialog';
import { debug } from 'util';

const expect = chai.expect;
// const assert = chai.assert;
interface Request {
    id?: number;
    query: string;
}
export interface Response {
    requestId?: number;
    data: string;
}

class BO {
    public states: string[] = [];
    constructor(private readonly cb: ClientServerDialog<Request, Response>) {

    }
    public async execute(data: Request): Promise<Response> {
        const response: Response = {
            data: 'hello ' + data.query,
        };
        if (data.query.startsWith('q')) {// query
            const cnt = parseInt(data.query[1], 10);
            for (let i = 0; i < cnt; i++) {
                const clientQuery = {
                    query: 'q' + i,
                };

                let queryResponseData: string;
                try {
                    const queryResponse = await this.cb.queryClient(clientQuery);
                    queryResponseData = queryResponse.data;
                } catch (e) {
                    queryResponseData = e.message || e;
                }
                response.data = response.data + ':' + queryResponseData;
            }
        }
        this.states.push(response.data);
        return response;
    }
}

function createServerAndBO() {
    const clientServerDialog = new ClientServerDialog<Request, Response>({
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
    const bo = new BO(clientServerDialog);
    const boMethod = bo.execute.bind(bo);
    return { clientServerDialog, bo, boMethod };
}
describe('test', () => {

    it('test', () => {
        // ok
    });
    it('server no cbc', async function () {
        const { clientServerDialog, bo, boMethod } = createServerAndBO();
        const r = await clientServerDialog.exchange({
            query: 'x',
        }, boMethod);
        expect(r).eql({
            data: 'hello x',
        });
    });
    it('server with cbc', async function () {
        const { clientServerDialog, bo, boMethod } = createServerAndBO();
        let r = await clientServerDialog.exchange({
            query: 'q1',
        }, boMethod);
        expect(r).eql({
            id: 1,
            query: 'q0',
        });
        r = await clientServerDialog.exchange({
            requestId: 1,
            data: 'y',
        });
        expect(r).eql({
            data: 'hello q1:y',
        });
    });

    it('server with cbc multiple query', async function () {
        const { clientServerDialog, bo, boMethod } = createServerAndBO();
        let r = await clientServerDialog.exchange({
            query: 'q2',
        }, boMethod);
        expect(r).eql({
            id: 1,
            query: 'q0',
        });
        r = await clientServerDialog.exchange({
            requestId: 1,
            data: '1',
        });
        expect(r).eql({
            id: 2,
            query: 'q1',
        });
        r = await clientServerDialog.exchange({
            requestId: 2,
            data: '2',
        });
        expect(r).eql({
            data: 'hello q2:1:2',
        });
    });
    it('unexpected response', async function () {
        const { clientServerDialog, bo, boMethod } = createServerAndBO();
        let r = await clientServerDialog.exchange({
            query: 'q1',
        }, boMethod);
        expect(r).eql({
            id: 1,
            query: 'q0',
        });
        let msg = '';
        try {
            await clientServerDialog.exchange({
                requestId: 2,
                data: 'y',
            });
        } catch (e) {
            msg = e.message || e;
        }
        expect(msg).eql('Out of band response');
    });
    it('out of band', async function () {
        const { clientServerDialog, bo, boMethod } = createServerAndBO();
        let r = await clientServerDialog.exchange({
            query: 'q1',
        }, boMethod);
        expect(r).eql({
            id: 1,
            query: 'q0',
        });
        r = await clientServerDialog.exchange({
            query: 'out of band',
        }, boMethod);
        expect(r).eql({
            data: 'hello out of band',
        });
        expect(bo.states).eql(['hello q1:Out of band request', 'hello out of band']);
    });
});
