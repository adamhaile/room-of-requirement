var RoomOfRequirement = require('../room-of-requirement').default;

describe("definitions", function () {
    it("should return the expected value", function () {
        var deps = RoomOfRequirement({
            foo: () => 1
        });

        expect(deps.foo).toEqual(1);
    });

    it("should allow chaining another target", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
            bar: ({foo}) => foo
        });

        expect(deps.bar).toEqual(1);
    });

    it("should allow chaining multiple targets", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
            bar: () => 2,
            bleck: ({foo, bar}) => [foo, bar]
        });

        expect(deps.bleck).toEqual([1, 2]);
    });

    it("should throw on undefined target", function () {
        var deps = RoomOfRequirement({ });

        expect(() => 
            deps.foo
        ).toThrowError(/foo/);
    });

    it("should throw on undefined upstream target", function () {
        var deps = RoomOfRequirement({
            foo: ({bar}) => 1
        });

        expect(() => 
            deps.foo
        ).toThrowError(/bar/);
    });

    it("should allow nested definitions", function () {
        var deps = RoomOfRequirement({
            foo: {
                bar: () => 2
            }
        });

        expect(deps.foo.bar).toEqual(2);
    });

    it("should allow deeply nested definitions", function () {
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

    it("should not pick up prototype properties", function () {
        var deps = RoomOfRequirement({
            foo: ({toString}) => 1
        });

        expect(() => 
            deps.foo
        ).toThrowError(/toString/);
    });

    it("should allow numbers as definitions", function () {
        var deps = RoomOfRequirement({
            foo: 1
        });

        expect(deps.foo).toBe(1);
    });

    it("should allow strings as definitions", function () {
        var deps = RoomOfRequirement({
            foo: "foo"
        });

        expect(deps.foo).toBe("foo");
    });

    it("should allow booleans as definitions", function () {
        var deps = RoomOfRequirement({
            foo: true
        });

        expect(deps.foo).toBe(true);
    });

    it("should allow null as a definition", function () {
        var deps = RoomOfRequirement({
            foo: null
        });

        expect(deps.foo).toBe(null);
    });

    it("should allow Dates as definitions", function () {
        var deps = RoomOfRequirement({
            foo: new Date(0)
        });

        expect(deps.foo).toEqual(new Date(0));
    });
})