var RoomOfRequirement = require('../room-of-requirement').default;

describe("cache", function () {    
    it("should not evaluate result until requested", function () {
        var x = 0,
            deps = RoomOfRequirement({
                foo: () => ++x,
            });

        expect(x).toEqual(0);
        expect(deps.foo).toEqual(1);
        expect(x).toEqual(1);
    });

    it("should cache result with subsequent resolutions", function () {
        var x = 0,
            deps = RoomOfRequirement({
                foo: () => ++x
            });

        expect(deps.foo).toEqual(1);
        expect(deps.foo).toEqual(1);
    });

    it("should cache result during the same resolution", function () {
        var x = 0,
            deps = RoomOfRequirement({
                foo: () => ++x,
                bar1: ({foo}) => foo,
                bar2: ({foo}) => foo,
                bleck: ({bar1, bar2}) => [bar1, bar2]
            });

        expect(deps.bleck).toEqual([1, 1]);
    });

    it("should cache result at most general validity", function () {
        var x = 0,
            deps1 = RoomOfRequirement({
                foo: () => ++x
            }),
            deps2 = deps1({
                bar: () => 2
            });

        expect(deps2.foo).toEqual(1);
        expect(deps1.foo).toEqual(1);
    });

    it("should invalidate cached result when it is affected by a new definition", function () {
        var x = 0,
            deps1 = RoomOfRequirement({
                foo: () => 1,
                bar: ({foo}) => ++x
            }),
            deps2 = deps1({ 
                foo : () => 1
            });

        expect(deps1.bar).toEqual(1);
        expect(deps2.bar).toEqual(2);
    });
});