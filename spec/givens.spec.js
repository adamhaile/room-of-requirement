var RoomOfRequirement = require('../room-of-requirement').default;

describe("givens", function () {
    it("extends dependency network with new values", function () {
        var deps = RoomOfRequirement({ });

        expect(deps({foo: 1}).foo).toEqual(1);
    });

    it("cannot shadow namespaces with values", function () {
        var deps = RoomOfRequirement({
            foo: {
                bar : () => 1
            }
        });

        expect(() =>
            deps({foo: 1})
        ).toThrowError(/shadow/);
    });

    it("cannot shadow values with namespaces", function () {
        var deps = RoomOfRequirement({
            foo: () => 1
        });

        expect(() =>
            deps({foo: { bar: 1 } })
        ).toThrowError(/shadow/);
    });

    it("can be supplied for sub-namespaces", function () {
        var deps = RoomOfRequirement({
            foo: {
                bar: () => 1
            }
        });

        expect(deps.foo({bar: 2}).bar).toEqual(2);
    });
});