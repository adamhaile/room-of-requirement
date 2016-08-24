(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var RoomOfRequirement = (...namespaces) => entrypoint(new NS(namespaces)), entrypoint = (namespace) => (prod) => resolve(prod, namespace, new NS()), resolve = (prod, namespace, cache) => {
        var deps = {}, result = prod(injector(namespace, cache, deps));
        return result;
    }, injector = (namespace, cache, deps) => new Proxy({}, { get: (_, name) => {
            var prod = namespace[name];
            return !prod ? missing(name) :
                prod instanceof Function ?
                    (deps[name] = true, cache[name] = (name in cache ? cache[name] : resolve(prod, namespace, cache))) :
                    injector(prod, NS.sub(cache, name.toString()), deps[name] = deps[name] || {});
        } }), missing = (name) => { throw new Error("missing dependency: " + name); }, extend = (cache, ns, obj) => {
        for (var name in obj) {
            if (ns[name] instanceof Function)
                throw new Error("givens cannot include targets with existing rules");
        }
    };
    var NS = function _NS(parent) {
        var name, ns, obj, subs;
        if (!('base' in NS))
            return; // first call, to construct NS.base
        else if (!parent) {
            ns = Object.create(NS.base);
        }
        else if (parent instanceof NS) {
            ns = Object.create(parent);
            for (name in parent)
                if (parent[name] instanceof NS)
                    ns[name] = new NS(parent[name]);
        }
        else if (Array.isArray(parent)) {
            ns = NS.base;
            subs = {};
            for (obj of parent) {
                if (obj) {
                    if (obj.__proto__ !== Object.prototype)
                        throw new Error("namespaces must be plain object literals ({})");
                    for (name in obj)
                        if (obj[name].__proto__ === Object.prototype)
                            subs[name] = true;
                    obj.__proto__ = ns, ns = obj;
                }
            }
            for (name in subs) {
                new NS(parent.map(ns => ns[name]));
            }
            return ns;
        }
        else {
            throw new Error("parent must be another namespace or an array of objects");
        }
        return ns;
    };
    NS.prototype = Object.create(null);
    NS.base = new NS();
    NS.sub = (ns, name) => ns[name] = ns[name] || new NS();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RoomOfRequirement;
});
//# sourceMappingURL=room-of-requirement.js.map