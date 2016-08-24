var RoomOfRequirement = require('../room-of-requirement').default,
    Promise = require('bluebird');

describe("a single arrow async production", function () {
    it("returns promise of the expected value", function (done) {
        var deps = RoomOfRequirement({
            foo: () => Promise.resolve(1)
        });

        deps.foo.then(foo => 
            expect(foo).toEqual(1)
        ).finally(done);
    });
    
    it("returns a cached result with subsequent resolutions", function (done) {
        var x = 1,
            deps = RoomOfRequirement({
                foo: () => Promise.resolve(x++)
            });

        Promise.join(deps.foo, deps.foo).then(([foo1, foo2]) => {
            expect(foo1).toEqual(1);
            expect(foo2).toEqual(1);
        }).finally(done);
    });

    it("can chain another target", function (done) {
        var deps = RoomOfRequirement({
            foo: () => Promise.resolve(1),
            bar: ({foo}) => foo
        });

        deps.bar.then(bar =>
            expect(bar).toEqual(1)
        ).finally(done);
    });

    it("can chain multiple targets", function (done) {
        var deps = RoomOfRequirement({
            foo: () => Promise.resolve(1),
            bar: () => Promise.resolve(2),
            bleck: ({foo, bar}) => Promise.join(foo, bar)
        });

        deps.bleck.then(bleck =>
            expect(bleck).toEqual([1, 2])
        ).finally(done);
    });

    it("resolves to a single value during the same resolution", function (done) {
        var x = 1,
            deps = RoomOfRequirement({
                foo: () => Promise.resolve(x++),
                bar1: ({foo}) => foo,
                bar2: ({foo}) => foo,
                bleck: ({bar1, bar2}) => Promise.join(bar1, bar2)
            });

        deps.bleck.then(bleck =>
            expect(bleck).toEqual([1, 1])
        ).finally(done);
    });
})