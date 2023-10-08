import { session, userEnum } from "../src/session";

describe("Session Tests", () => {
    beforeAll(async () => {
        await page.goto('file:///D:/repos/ec/webground/packages/core/test/test.html');
    });

    //const _session = {...session};
    //console.log("SESSION Init ",  _session.init, session.init);
    test("Init Session", async () => {
        const data = await page.evaluate(() => {
            const session = webground.session;
            //session.init();
            console.log('SESSION INIT', session.data);
            return session.pid;
        });

        expect(data).toBe("session");
    });
})