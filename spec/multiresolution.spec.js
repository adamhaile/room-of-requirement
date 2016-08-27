var RoomOfRequirement = require('../room-of-requirement').default;

describe("multiple resolution", function () {
    it("returns a value for each definition", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
        }, {
            foo: () => 2
        });

        expect(deps['foo[]']).toEqual([2, 1]);
    });

    it("returns empty array for undefined target", function () {
        var deps = RoomOfRequirement({
        });

        expect(deps['foo[]']).toEqual([]);
    });

    it("includes givens", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
        }, {
            foo: () => 2
        });

        expect(deps({ foo : 3 })({ foo: 4 })['foo[]']).toEqual([4, 3, 2, 1]);
    });
});