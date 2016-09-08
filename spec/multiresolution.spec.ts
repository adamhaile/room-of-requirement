import { root } from '../room-of-requirement';

describe("multiple resolution", function () {
    it("should return empty array for undefined target", function () {
        var deps = root<{ 'foo[]' : never[] }>({
        });

        expect(deps['foo[]']).toEqual([]);
    });

    it("should return a value for each definition", function () {
        var deps = root<{ foo : number, 'foo[]' : number[] }>({
            foo: () => 1,
        })({
            foo: () => 2
        });

        expect(deps['foo[]']).toEqual([2, 1]);
    });

    it("should include new definitions when initial set was empty", function () {
        var deps = root<{ 'foo[]' : number[] }>({ });

        expect(deps['foo[]']).toEqual([]);
        expect(deps({foo : () => 1})['foo[]']).toEqual([1]);
    });

    it("should invalidate downstream dependencies when set changes", function () {
        var deps1 = root<{ bar : number, 'foo[]' : never[] }>({
                bar: ({'foo[]':foos}) => foos.length
            }),
            deps2 = deps1<{ 'foo[]' : number[] }>({
                foo : () => 1
            });

        expect(deps1.bar).toEqual(0);
        expect(deps2.bar).toEqual(1);
    });

    it("should return an array of arrays if doubly invoked ([][])", function () {
        var deps = root<{ foo : number, 'foo[][]' : number[][] }>({
            foo: () => 1,
        })({
            foo: () => 2
        });

        expect(deps['foo[][]']).toEqual([[2, 1], [1], []]);
    });

    it("should return an array of arrays of arrays if triply invoked ([][][]) -- stupid code games!", function () {
        var deps = root<{ foo : number, 'foo[][][]' : number[][][] }>({
            foo: () => 1,
        })({
            foo: () => 2
        });

        expect(deps['foo[][][]']).toEqual([
            [[2, 1], [1], []], 
            [[1], []], 
            [[]]
        ]);
    });

    it("should return an array of namespaces if target is a nested namespace", function () {
        var deps = root<{ foo : { bar: number }, 'foo[]' : { bar : number }[] }>({
            foo: {
                bar: () => 1
            }
        });

        expect(deps.foo.bar).toEqual(1);
        expect(deps['foo[]'].length).toEqual(1);
    });

    it("should return an array of root proxies for target '[]'", function () {
        var deps = root<{ foo : number, '[]' : { foo : number }[] }>({
            foo: () => 1,
        })({
            foo: () => 2
        })({
            foo: () => 3
        });

        var stack = deps['[]'];
        expect(stack[0].foo).toEqual(3);
        expect(stack[1].foo).toEqual(2);
        expect(stack[2].foo).toEqual(1);
    });
});