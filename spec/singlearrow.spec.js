var RoomOfRequirement = require('../room-of-requirement').default;

describe("a single arrow production", function () {
    it("returns the expected value", function () {
        var deps = RoomOfRequirement({
            foo: () => 1
        });

        expect(deps.foo).toEqual(1);
    });
    
    it("returns a cached result with subsequent resolutions", function () {
        var x = 1,
            deps = RoomOfRequirement({
                foo: () => x++
            });

        expect(deps.foo).toEqual(1);
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

    it("resolves to a single value during the same resolution", function () {
        var x = 1,
            deps = RoomOfRequirement({
                foo: () => x++,
                bar1: ({foo}) => foo,
                bar2: ({foo}) => foo,
                bleck: ({bar1, bar2}) => [bar1, bar2]
            });

        expect(deps.bleck).toEqual([1, 1]);
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