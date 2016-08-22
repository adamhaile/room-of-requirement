(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var RoomOfRequirement = (...namespaces) => entrypoint(flatten(namespaces)), entrypoint = (namespace) => (prod) => resolve(prod, namespace, {}), resolve = (prod, namespace, cache) => {
        var deps = {}, result = prod(injector(namespace, cache, deps));
        return result;
    }, injector = (namespace, cache, deps) => new Proxy({}, { get: (_, name) => {
            var prod = namespace[name];
            return !prod ? missing(name) :
                prod instanceof Function ?
                    deps[name] = cache[name] = (name in cache ? cache[name] : resolve(prod, namespace, cache)) :
                    injector(prod, cache[name] = cache[name] || {}, deps[name] = deps[name] || {});
        } }), flatten = (namespaces) => {
        for (var i = 1; i < namespaces.length; i++)
            namespaces[i]['__proto__'] = namespaces[i - 1];
        return namespaces[i - 1];
    }, missing = (name) => { throw new Error("missing dependency: " + name); };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RoomOfRequirement;
});
//# sourceMappingURL=room-of-requirement.js.map