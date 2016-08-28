var RoomOfRequirement = require('../room-of-requirement').default;

describe("cache", function () {    
    it("returns a cached result during the same resolution", function () {
        var x = 1,
            deps = RoomOfRequirement({
                foo: () => x++,
                bar1: ({foo}) => foo,
                bar2: ({foo}) => foo,
                bleck: ({bar1, bar2}) => [bar1, bar2]
            });

        expect(deps.bleck).toEqual([1, 1]);
    });

    it("returns a cached result with subsequent resolutions", function () {
        var x = 1,
            deps = RoomOfRequirement({
                foo: () => x++
            });

        expect(deps.foo).toEqual(1);
        expect(deps.foo).toEqual(1);
    });

    it("stores in pre-given cache when result not dependent on givens", function () {
        var x = 1,
            deps = RoomOfRequirement({
                foo: () => x++
            });

        expect(deps({bar : _ => 2}).foo).toEqual(1);
        expect(deps.foo).toEqual(1);
    });

    it("invalidates cached value when it is dependent on a given", function () {
        var deps = RoomOfRequirement({
                foo: () => 1,
                bar: ({foo}) => foo
            });

        expect(deps.bar).toEqual(1);
        expect(deps({foo : _ => 2}).bar).toEqual(2);
    });
});