var RoomOfRequirement = require('../room-of-requirement').default;

describe("givens", function () {
    it("extends dependency network with new values", function () {
        var deps = RoomOfRequirement({
            foo: null
        });

        expect(deps({foo: 1}).foo).toEqual(1);
    });

    it("cause an exception when requested before they're supplied", function () {
        var deps = RoomOfRequirement({
            foo: null
        });

        expect(() =>
            deps.foo
        ).toThrowError(/given/);
    });

    it("cause an exception when supplied for a non-null target", function () {
        var deps = RoomOfRequirement({
            foo: () => 1
        });

        expect(() =>
            deps({foo : 2})
        ).toThrowError(/given/);
    });
});