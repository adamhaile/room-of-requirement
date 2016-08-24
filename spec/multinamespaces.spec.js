var RoomOfRequirement = require('../room-of-requirement').default;

describe("multiple namespaces", function () {
    it("uses last defined rule", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
        }, {
            foo: () => 2
        });

        expect(deps.foo).toEqual(2);
    });

    it("can see earlier rules if they're the latest", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
        }, {
            foo: () => 2
        }, {
            bar: () => 3
        });

        expect(deps.foo).toEqual(2);
    });

    it("can see earlier nested rules", function () {
        var deps = RoomOfRequirement({
            foo: {
                bar: () => 1
            }
        }, {
            foo: {
                bleck: () => 2
            }
        });

        expect(deps.foo.bar).toEqual(1);
    });

    it("cannot shadow an earlier rule with a nested namespace", function () {
        expect(() => 
            RoomOfRequirement({
                foo: () => 1
            }, {
                foo: {
                    bleck: () => 2
                }
            }))
        .toThrowError(/shadow/);
    })
})