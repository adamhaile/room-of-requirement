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
        var deps = RoomOfRequirement({
        });

        expect(deps['foo[]']).toEqual([]);
        expect(deps({foo : _ => 1})['foo[]']).toEqual([1]);
    });

    it("should invalidate downstream dependencies when set changes", function () {
        var deps = RoomOfRequirement({
            bar: ({'foo[]':foos}) => foos.length
        });

        expect(deps.bar).toEqual(0);
        expect(deps({foo : _ => 1}).bar).toEqual(1);
    });
});