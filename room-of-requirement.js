(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var RoomOfRequirement = (...namespaces) => entrypoint(flatten(namespaces)), entrypoint = (namespace) => (prod) => resolver(namespace)(prod), resolver = (namespace) => {
        var resolutions = {}, lookup = (name) => resolutions[name]
            || (resolutions[name] = resolver(namespace[name] || missing(name))), injector = new Proxy({}, { get: (_, name) => lookup(name) }), resolver = (prod) => prod(injector);
        return resolver;
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