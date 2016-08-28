var RoomOfRequirement = require('../room-of-requirement').default;

describe("multiple namespaces", function () {
    it("uses last defined rule", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
        })({
            foo: () => 2
        });

        expect(deps.foo).toEqual(2);
    });

    it("can see earlier rules if they're the latest", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
        })({
            foo: () => 2
        })({
            bar: () => 3
        });

        expect(deps.foo).toEqual(2);
    });

    it("can see earlier nested rules", function () {
        var deps = RoomOfRequirement({
            foo: {
                bar: () => 1
            }
        })({
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
            })({
                foo: {
                    bleck: () => 2
                }
            }))
        .toThrowError(/shadow/);
    });

    it("higher namespaces are not visible to lower", function () {
        var deps1 = RoomOfRequirement({
                foo: () => 1
            }),
            deps2 = deps1({
                bar: () => 2
            });
        

        expect(() =>
            deps1.bar
        ).toThrowError(/bar/);
    });

    it("hides sibling definitions from each other", function () {
        var deps1 = RoomOfRequirement({
                foo: () => 1
            }),
            deps2 = deps1({
                bar: () => 2
            }),
            deps3 = deps1({
                bleck: () => 3
            });
        

        expect(() =>
            deps1.bar
        ).toThrowError(/bar/);

        expect(deps2.bar).toEqual(2);

        expect(() =>
            deps3.bar
        ).toThrowError(/bar/);
    });
})