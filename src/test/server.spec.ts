// tslint:disable:only-arrow-functions
// tslint:disable-next-line:no-implicit-dependencies
import * as chai from 'chai';
import './debug-test';
// tslint:disable-next-line:no-implicit-dependencies
import 'mocha';
import { Tools } from '../lib/util';
import { Request } from '../lib/request';
import { Response } from '../lib/response';
import { ClientServerDialog } from '../lib/client-server-dialog';
import { debug } from 'util';

const expect = chai.expect;
// const assert = chai.assert;

class BO {
    public states: string[] = [];
    constructor(private readonly cb: ClientServerDialog<Request, Response>) {

    }
    public async execute(data: Request): Promise<Response> {
        const response: Response = {
            data: data.query,
        };
        if (data.query.startsWith('q')) {
            const clientQuery = {
                query: data.query,
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
            data: 'x',
        });
    });
    it('server with cbc', async function () {
        const { clientServerDialog, bo, boMethod } = createServerAndBO();
        let r = await clientServerDialog.exchange({
            query: 'qx',
        }, boMethod);
        expect(r).eql({
            id: 1,
            query: 'qx',
        });
        r = await clientServerDialog.exchange({
            requestId: 1,
            data: 'y',
        });
        expect(r).eql({
            data: 'qx:y',
        });
    });

    it('unexpected response', async function () {
        const { clientServerDialog, bo, boMethod } = createServerAndBO();
        let r = await clientServerDialog.exchange({
            query: 'qx',
        }, boMethod);
        expect(r).eql({
            id: 1,
            query: 'qx',
        });
        r = await clientServerDialog.exchange({
            requestId: 2,
            data: 'y',
        });
        expect(r).eql({
            data: 'qx:unexpected request id!. Expected 1, received 2',
        });
    });
    it('out of band', async function () {
        const { clientServerDialog, bo, boMethod } = createServerAndBO();
        let r = await clientServerDialog.exchange({
            query: 'qx',
        }, boMethod);
        expect(r).eql({
            id: 1,
            query: 'qx',
        });
        r = await clientServerDialog.exchange({
            query: 'out of band',
        }, boMethod);
        expect(r).eql({
            data: 'out of band',
        });
        expect(bo.states).eql(['out of band', 'qx:out of band request']);
    });
});
