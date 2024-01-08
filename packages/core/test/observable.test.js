import { Observable } from "../src/observe";

const mockTask = jest.fn(token=>{
    expect(token.event).toBe("EVT_TEST");
    expect(token.data).toBe("DATA");
    console.log(token);
});

describe("Observable Tests", () => {
    /*beforeAll(async () => {
        await page.goto('file:///D:/repos/ec/webground/packages/core/test/test.html');
    });*/

    //const _session = {...session};
    //console.log("SESSION Init ",  _session.init, session.init);
    test("Listen Test", async () => {
        const obs = new Observable();

        obs.listen("EVT_TEST", mockTask)

        obs.emit("EVT_TEST", "DATA");

        expect(mockTask).toHaveBeenCalled();
    });
})