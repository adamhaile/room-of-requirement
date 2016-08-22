(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var RoomOfRequirement = (...namespaces) => entrypoint(flatten(namespaces)), entrypoint = (namespace) => (prod) => resolve(prod, namespace, {}), resolve = (prod, namespace, cache) => prod(injector(namespace, cache, {})), injector = (namespace, cache, deps) => new Proxy({}, { get: (_, name) => {
            var prod = namespace[name];
            return !prod ? missing(name) :
                prod instanceof Function ?
                    name in cache ? cache[name] :
                        cache[name] = resolve(prod, namespace, cache) :
                    injector(prod, cache[name] = cache[name] || {}, deps[name] = deps[name] || {}); // TODO recursive injections
        } }), flatten = (namespaces) => {
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