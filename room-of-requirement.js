(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var RoomOfRequirement = (...namespaces) => entrypoint(flatten(namespaces)), entrypoint = (namespace) => (prod) => resolver(namespace, {})(prod), resolver = (namespace, resolutions) => {
        var lookup = (name) => {
            var prod = namespace[name];
            return !prod ? missing(name) :
                prod instanceof Function ?
                    name in resolutions ? resolutions[name] :
                        resolutions[name] = resolve(prod) :
                    null; // TODO recursive injections
        }, resolve = (prod) => {
            var dependencies = {}, injector = new Proxy({}, { get: (_, name) => dependencies[name] = lookup(name) }), result = prod(injector);
            return result;
        };
        return resolve;
    }, multi = (obj, resolver) => {
        for (var name in obj)
            resolver(obj[name]);
    }, flatten = (namespaces) => {
        let ns = {};
        for (let _ns of namespaces)
            for (let name in _ns)
                ns[name] = _ns[name];
        return ns;
    }, missing = (name) => { throw new Error("missing dependency: " + name); };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RoomOfRequirement;
});
//# sourceMappingURL=room-of-requirement.js.map