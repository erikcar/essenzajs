import { deferredAction, waitAction } from "../src/core";

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe("WG Core Tests", () => {
    test("Defer Action", () => {
        const callback = jest.fn();

        const action = new deferredAction(callback, 1000);

        action.execute();

        jest.advanceTimersByTime(500);

        action.execute();
        action.execute();

        expect(callback).not.toBeCalled();

        // Fast-forward until all timers have been executed
        jest.advanceTimersByTime(500);

        // Now our callback should have been called!
        expect(callback).toBeCalled();
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test("Wait Action", () => {
        const callback = jest.fn();

        const action = new waitAction(callback, 1000);

        action.execute();

        jest.advanceTimersByTime(500);

        action.execute();

        expect(callback).not.toBeCalled();

        jest.advanceTimersByTime(500);

        expect(callback).not.toBeCalled();

        jest.advanceTimersByTime(500);

        // Now our callback should have been called!
        expect(callback).toBeCalled();
        expect(callback).toHaveBeenCalledTimes(1);
    });
})