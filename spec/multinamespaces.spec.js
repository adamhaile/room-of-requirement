var RoomOfRequirement = require('../room-of-requirement').default;

describe("multiple namespaces", function () {
    it("uses last defined rule", function () {
        var accio = RoomOfRequirement({
            foo: () => 1,
        }, {
            foo: () => 2
        });

        accio(({foo}) => expect(foo).toEqual(2));
    });

    it("can see earlier rules if they're the latest", function () {
        var accio = RoomOfRequirement({
            foo: () => 1,
        }, {
            foo: () => 2
        }, {
            bar: () => 3
        });

        accio(({foo}) => expect(foo).toEqual(2));
    });

    it("can see earlier nested rules", function () {
        var accio = RoomOfRequirement({
            foo: {
                bar: () => 1
            }
        }, {
            foo: {
                bleck: () => 2
            }
        });

        accio(({foo:{bar}}) => expect(bar).toEqual(1));
    });

    it("cannot shadow an earlier rule with a nested namespace", function () {
        expect(() => 
            RoomOfRequirement({
                foo: () => 1
            }, {
                foo: {
                    bleck: () => 2
                }
            }))
        .toThrowError(/object literal/);
    })
})