(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var RoomOfRequirement = (...namespaces) => injector(init(namespaces), new NS(), {}), resolve = (prod, ns, cache) => {
        var deps = {}, result = prod(injector(ns, cache, deps));
        return result;
    }, injector = (ns, cache, deps) => new Proxy(givens(ns, cache), { get: (_, name) => {
            var prod = ns[name];
            return (name in cache && !(cache[name] instanceof NS) ?
                (deps[name] = true, cache[name]) :
                prod instanceof NS ?
                    injector(prod, NS.sub(cache, name.toString()), deps[name] = deps[name] || {}) :
                    prod instanceof Function ?
                        (deps[name] = true, cache[name] = resolve(prod, ns, cache)) :
                        prod === null ? errorMissingGiven(name) :
                            !prod ? errorMissingRule(name) :
                                errorBadProd(prod));
        } }), givens = (ns, cache) => (givens) => injector(ns, NS.extend(NS.overlay(cache), givens), {}), init = (nss) => nss.reduce((ns, o) => NS.extend(ns, o), new NS());
    class NS {
    }
    NS.overlay = (ns) => Object.create(ns);
    NS.sub = (ns, name) => name in ns ? (!isNS(ns[name]) ? errorShadowValue(name) :
        isOwnProp(ns, name) ? ns[name] :
            ns[name] = Object.create(ns[name])) :
        ns[name] = new NS();
    NS.extend = (ns, obj) => {
        for (let name of Object.keys(obj)) {
            let val = obj[name];
            if (isPlainObj(val))
                NS.extend(NS.sub(ns, name), val);
            else
                ns[name] = val;
        }
        return ns;
    };
    Object.setPrototypeOf(NS.prototype, null);
    // utils
    var isNS = (o) => o instanceof NS, isPlainObj = (o) => o instanceof Object && getProto(o) === Object.prototype, isOwnProp = (o, name) => Object.prototype.hasOwnProperty.call(o, name), getProto = (o) => Object.getPrototypeOf(o);
    // errors
    var errorMissingRule = (name) => { throw new Error("missing dependency: " + name); }, errorMissingGiven = (name) => { throw new Error(name + "was defined as a given but has not been supplied yet"); }, errorBadProd = (prod) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + prod); }, errorShadowValue = (name) => { throw new Error("cannot shadow an earlier value with a nested namespace"); }, errorNotGivenSite = (name) => { throw new Error("location " + name + " is not registered as a given (null in namespace)"); }, errorNoSuchGiven = (name) => { throw new Error("location " + name + " does not exist in the namespace"); };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RoomOfRequirement;
});
//# sourceMappingURL=room-of-requirement.js.map