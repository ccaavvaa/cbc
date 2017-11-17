// tslint:disable-next-line:no-implicit-dependencies
import 'mocha';
// to debug all:
// const testToDebug: string = null;
// to test only test 'y' in suite 'x':
// const testToDebug = 'x y';
// ex:
const testToDebug: string = 'out of band';

beforeEach(function () {
    // tslint:disable-next-line:no-this-assignment
    const that: any = this;
    if (process.env.DEBUG_TEST === 'true' && testToDebug) {
        const fullTestTitle = getFullTitle(that.currentTest);
        if (fullTestTitle.search(testToDebug) < 0) {
            this.skip();
        }
    }
});

function getFullTitle(test: any): string {
    const titles: string[] = [];
    let current = test;
    while (current) {
        if (current.title) {
            titles.push(current.title);
        }
        current = current.parent;
    }
    return titles.reverse().join(' ');
}
