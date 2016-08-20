var RoomOfRequirement = require('../room-of-requirement').default,
    Promise = require('bluebird');

describe("a single arrow production", function () {
    it("returns promise of the expected value", function (done) {
        var ror = RoomOfRequirement({
            foo: () => Promise.resolve(1)
        });

        ror(({foo}) => foo).then(foo => {
            expect(foo).toEqual(1);
        }).finally(done);
    });
    
    it("returns a new result with each resolution", function (done) {
        var x = 1,
            ror = RoomOfRequirement({
                foo: () => Promise.resolve(x++)
            });

        Promise.join(
            ror(({foo}) => foo),
            ror(({foo}) => foo)
        ).then(([foo1, foo2]) => {
            expect(foo1).toEqual(1);
            expect(foo2).toEqual(2);
        }).finally(done);
    });

    it("can chain another target", function (done) {
        var ror = RoomOfRequirement({
            foo: () => Promise.resolve(1),
            bar: ({foo}) => foo
        });

        ror(({bar}) => bar).then(bar => {
            expect(bar).toEqual(1);
        }).finally(done);
    });

    it("can chain multiple targets", function (done) {
        var ror = RoomOfRequirement({
            foo: () => Promise.resolve(1),
            bar: () => Promise.resolve(2),
            bleck: ({foo, bar}) => Promise.join(foo, bar)
        });

        ror(({bleck}) => bleck).then(bleck => {
            expect(bleck).toEqual([1, 2]);
        }).finally(done);
    });

    it("resolves to a single value during the same resolution", function (done) {
        var x = 1,
            ror = RoomOfRequirement({
                foo: () => Promise.resolve(x++),
                bar1: ({foo}) => foo,
                bar2: ({foo}) => foo,
                bleck: ({bar1, bar2}) => Promise.join(bar1, bar2)
            });

        ror(({bleck}) => bleck).then(bleck => {
            expect(bleck).toEqual([1, 1]);
        }).finally(done);
    });
})