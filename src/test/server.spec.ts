// tslint:disable:only-arrow-functions
// tslint:disable-next-line:no-implicit-dependencies
import * as chai from 'chai';
import './debug-test';
// tslint:disable-next-line:no-implicit-dependencies
import 'mocha';
import { Server } from '../lib/server';

const expect = chai.expect;
// const assert = chai.assert;
describe('test', () => {

    it('test', () => {
        // ok
    });
    it('server no cbc', async function () {
        const server = new Server();
        const r = await server.process({
            query: 'x',
        });
        expect(r).eql({
            data: 'x',
        });
    });
    it('server with cbc', async function () {
        const server = new Server();
        let r = await server.process({
            query: 'qx',
        });
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
