(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var RoomOfRequirement = (...namespaces) => entrypoint(hh.chain(namespaces)), entrypoint = (namespace) => (prod) => resolve(prod, namespace, hh.root()), resolve = (prod, namespace, cache) => {
        var deps = {}, result = prod(injector(namespace, cache, deps));
        return result;
    }, injector = (namespace, cache, deps) => new Proxy({}, { get: (_, name) => {
            var prod = namespace[name];
            return !prod ? missing(name) :
                prod instanceof Function ?
                    (deps[name] = true, cache[name] = (name in cache ? cache[name] : resolve(prod, namespace, cache))) :
                    injector(prod, hh.sub(cache, name), deps[name] = deps[name] || {});
        } }), missing = (name) => { throw new Error("missing dependency: " + name); }, hh = {
        chain: (namespaces) => {
            for (var i = 0; i < namespaces.length; i++)
                namespaces[i]['__proto__'] = i ? namespaces[i - 1] : hh.root();
            return namespaces[i - 1];
        },
        root: () => Object.create(null),
        depth: (h, name) => {
            for (var i = 0; h && !Object.prototype.hasOwnProperty.call(h, name); i++, h = h.__proto__) { }
            return h ? -1 : i;
        },
        set: (h, depth, key, value) => {
            while (depth--)
                h = h.__proto__;
            h[key] = value;
        },
        sub: (h, name) => {
            var top = h[name] = h[name] || hh.root(), sub = top;
            while (h = h.__proto__) {
                h[name] = sub = sub.__proto__ = h[name] || hh.root();
            }
            return top;
        }
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RoomOfRequirement;
});
//# sourceMappingURL=room-of-requirement.js.map