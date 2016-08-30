var RoomOfRequirement = require('../room-of-requirement').default;

describe("overlays", function () {
    it("should extend dependency network with new values", function () {
        var deps = RoomOfRequirement({ });
        
        expect(() =>
            deps.foo
        ).toThrowError(/foo/);
        
        deps = deps({ foo: _ => 1 });

        expect(deps.foo).toEqual(1);
    });

    it("should use last defined rule", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
        })({
            foo: () => 2
        });

        expect(deps.foo).toEqual(2);
    });

    it("should use earlier rules if they're the latest", function () {
        var deps = RoomOfRequirement({
            foo: () => 1,
        })({
            foo: () => 2
        })({
            bar: () => 3
        });

        expect(deps.foo).toEqual(2);
    });

    it("should use last nested rule", function () {
        var deps = RoomOfRequirement({
            foo: {
                bar: () => 1
            }
        })({ 
            foo: { 
                bar: () => 2 
            } 
        });

        expect(deps.foo.bar).toEqual(2);
    });

    it("should use earlier nested rules if they're the latest", function () {
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

    it("should not leak definitions to earlier caches", function () {
        var deps1 = RoomOfRequirement({
                foo: () => 1
            }),
            deps2 = deps1({
                bar: () => 2
            });
        
        expect(deps2.bar).toEqual(2);

        expect(() =>
            deps1.bar
        ).toThrowError(/bar/);
    });

    it("should not leak definitions to sibling caches", function () {
        var deps1 = RoomOfRequirement({
                foo: () => 1
            }),
            deps2 = deps1({
                bar: () => 2
            }),
            deps3 = deps1({
                bleck: () => 3
            });

        expect(deps2.bar).toEqual(2);

        expect(() =>
            deps3.bar
        ).toThrowError(/bar/);
    });

    it("should throw if new values shadow namespaces", function () {
        var deps = RoomOfRequirement({
            foo: {
                bar : () => 1
            }
        });

        expect(() =>
            deps({foo: _=>1})
        ).toThrowError(/shadow/);
    });

    it("should throw if new namespaces shadow values", function () {
        var deps = RoomOfRequirement({
            foo: () => 1
        });

        expect(() =>
            deps({foo: { bar: _=>1 } })
        ).toThrowError(/shadow/);
    });

    it("can be supplied for sub-namespaces", function () {
        var deps = RoomOfRequirement({
            foo: {
                bar: () => 1
            }
        });

        expect(deps.foo({ bar: _ => 2 }).bar).toEqual(2);
    });
});