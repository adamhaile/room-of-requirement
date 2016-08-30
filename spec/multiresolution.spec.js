var RoomOfRequirement = require('../room-of-requirement').default;

describe("multiple resolution", function () {
    it("should return empty array for undefined target", function () {
        var deps = RoomOfRequirement({
        });

        expect(deps['foo[]']).toEqual([]);
    });

    it("should return a value for each definition", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
        })({
            foo: () => 2
        });

        expect(deps['foo[]']).toEqual([2, 1]);
    });

    it("should include new definitions when initial set was empty", function () {
        var deps = RoomOfRequirement({ });

        expect(deps['foo[]']).toEqual([]);
        expect(deps({foo : () => 1})['foo[]']).toEqual([1]);
    });

    it("should invalidate downstream dependencies when set changes", function () {
        var deps1 = RoomOfRequirement({
                bar: ({'foo[]':foos}) => foos.length
            }),
            deps2 = deps1({
                foo : () => 1
            });

        expect(deps1.bar).toEqual(0);
        expect(deps2.bar).toEqual(1);
    });

    it("should return an array of arrays if doubly invoked ([][])", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
        })({
            foo: () => 2
        });

        expect(deps['foo[][]']).toEqual([[2, 1], [1], []]);
    });

    it("should return an array of arrays of arrays if triply invoked ([][][]) -- stupid code games!", function () {
        var deps = RoomOfRequirement({
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
        var deps = RoomOfRequirement({
            foo: {
                bar: () => 1
            }
        });

        expect(deps.foo.bar).toEqual(1);
        expect(deps['foo[]'].length).toEqual(1);
    });
});