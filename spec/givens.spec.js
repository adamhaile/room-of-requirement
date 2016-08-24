var RoomOfRequirement = require('../room-of-requirement').default;

describe("givens", function () {
    it("extends dependency network with new values", function () {
        var deps = RoomOfRequirement({ });

        expect(deps({foo: 1}).foo).toEqual(1);
    });

    it("can be pre-declared with null in the namespace", function () {
        var deps = RoomOfRequirement({
            foo: null
        });

        expect(() =>
            deps.foo
        ).toThrowError(/given/);
    });

    it("can be supplied for sub-namespaces too", function () {
        var deps = RoomOfRequirement({
            foo: {
                bar: () => 1
            }
        });

        expect(deps.foo({bar: 2}).bar).toEqual(2);
    })
});