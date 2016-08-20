var RoomOfRequirement = require('../room-of-requirement').default,
    Promise = require('bluebird');

describe("a single arrow production", function () {
    it("returns the expected value", function () {
        var accio = RoomOfRequirement({
            foo: () => 1
        });

        accio(({foo}) => expect(foo).toEqual(1));
    });
    
    it("returns a new result with each resolution", function () {
        var x = 1,
            accio = RoomOfRequirement({
                foo: () => x++
            });

        accio(({foo}) => expect(foo).toEqual(1));
        accio(({foo}) => expect(foo).toEqual(2));
    });

    it("can chain another target", function () {
        var accio = RoomOfRequirement({
            foo: () => 1,
            bar: ({foo}) => foo
        });

        accio(({bar}) => expect(bar).toEqual(1));
    });

    it("can chain multiple targets", function () {
        var accio = RoomOfRequirement({
            foo: () => 1,
            bar: () => 2,
            bleck: ({foo, bar}) => [foo, bar]
        });

        accio(({bleck}) => expect(bleck).toEqual([1, 2]));
    });

    it("resolves to a single value during the same resolution", function () {
        var x = 1,
            accio = RoomOfRequirement({
                foo: () => x++,
                bar1: ({foo}) => foo,
                bar2: ({foo}) => foo,
                bleck: ({bar1, bar2}) => [bar1, bar2]
            });

        accio(({bleck}) => expect(bleck).toEqual([1, 1]));
    });

    it("throws on undefined dependencies", function () {
        var accio = RoomOfRequirement({
            foo: () => 1
        });

        expect(() => 
            accio(({bar}) => bar)
        ).toThrowError(/bar/);
    })
})