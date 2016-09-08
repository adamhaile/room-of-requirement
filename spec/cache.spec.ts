import { root } from '../room-of-requirement';

describe("cache", function () {    
    it("should not evaluate result until requested", function () {
        var x = 0,
            deps = root<{ foo : number }>({
                foo: () => ++x,
            });

        expect(x).toEqual(0);
        expect(deps.foo).toEqual(1);
        expect(x).toEqual(1);
    });

    it("should cache result with subsequent resolutions", function () {
        var x = 0,
            deps = root<{ foo : number }>({
                foo: () => ++x
            });

        expect(deps.foo).toEqual(1);
        expect(deps.foo).toEqual(1);
    });

    it("should cache result during the same resolution", function () {
        var x = 0,
            deps = root<{ foo : number, bar1 : number, bar2 : number, bleck: number[] }>({
                foo: () => ++x,
                bar1: ({foo}) => foo,
                bar2: ({foo}) => foo,
                bleck: ({bar1, bar2}) => [bar1, bar2]
            });

        expect(deps.bleck).toEqual([1, 1]);
    });

    it("should cache result at most general validity", function () {
        var x = 0,
            deps1 = root<{ foo : number }>({
                foo: () => ++x
            }),
            deps2 = deps1<{ bar : number }>({
                bar: () => 2
            });

        expect(deps2.foo).toEqual(1);
        expect(deps1.foo).toEqual(1);
    });

    it("should invalidate cached result when it is affected by a new definition", function () {
        var x = 0,
            deps1 = root<{ foo : number, bar : number }>({
                foo: () => 1,
                bar: ({foo}) => ++x
            }),
            deps2 = deps1({ 
                foo : () => 1
            });

        expect(deps1.bar).toEqual(1);
        expect(deps2.bar).toEqual(2);
    });

    it("should not invalidate cached result based on properties read after instantiation", function () {
        var x = 0,
            deps1 = root<{ foo : number, bar : () => number }>({
                foo: () => 1,
                bar: _ => () => _.foo
            }),
            deps2 = deps1({ 
                foo : () => 2
            });

        expect(deps1.bar()).toEqual(1);
        expect(deps2.bar()).toEqual(1);
    });
});