var RoomOfRequirement = require('../room-of-requirement').default;

describe("a single arrow production", function () {
    it("returns the expected value", function () {
        var deps = RoomOfRequirement({
            foo: () => 1
        });

        expect(deps.foo).toEqual(1);
    });

    it("can chain another target", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
            bar: ({foo}) => foo
        });

        expect(deps.bar).toEqual(1);
    });

    it("can chain multiple targets", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
            bar: () => 2,
            bleck: ({foo, bar}) => [foo, bar]
        });

        expect(deps.bleck).toEqual([1, 2]);
    });

    it("throws on undefined dependencies", function () {
        var deps = RoomOfRequirement({
            foo: () => 1
        });

        expect(() => 
            deps.bar
        ).toThrowError(/bar/);
    });

    it("can have nested requirements", function () {
        var deps = RoomOfRequirement({
            foo: {
                bar: () => 2
            }
        });

        expect(deps.foo.bar).toEqual(2);
    });

    it("can have deeply nested requirements", function () {
        var deps = RoomOfRequirement({
            foo: {
                bar: {
                    bleck: {
                        zorp: () => 2
                    }
                }
            }
        });

        expect(deps.foo.bar.bleck.zorp).toEqual(2);
    });

    it("does not pick up prototype properties", function () {
        var deps = RoomOfRequirement({});

        expect(() => 
            deps.toString
        ).toThrowError(/toString/);
    });
})