(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var RoomOfRequirement = (...namespaces) => injector(init(namespaces), {}), resolve = (prod, ns) => {
        var deps = {}, value = prod(injector(ns, deps));
        return new Result(prod, value, deps);
    }, injector = (ns, deps) => new Proxy(givens(ns), { get: function get(_, name) {
            var node = ns[name];
            return (node instanceof Result ?
                (deps[name] = node).value :
                node instanceof NS ?
                    injector(NS.sub(ns, name), deps[name] = deps[name] || {}) :
                    node instanceof Function ?
                        (deps[name] = ns[name] = resolve(node, ns)).value :
                        node === null ? errorMissingGiven(name) :
                            !node ? errorMissingRule(name) :
                                errorBadProd(node));
        } }), givens = (ns) => (givens) => injector(NS.extend(NS.overlay(ns), givens, v => new Result(null, v, null)), {}), init = (nss) => nss.reduce((ns, o) => NS.extend(ns, o), new NS());
    class NS {
    }
    NS.overlay = (ns) => Object.create(ns);
    NS.sub = (ns, name) => name in ns && !isNS(ns[name]) ? errorShadowValue(name) :
        isOwnProp(ns, name) ? ns[name] :
            ns[name] = (isNS(getProto(ns)) ? NS.overlay(NS.sub(getProto(ns), name)) : new NS());
    NS.extend = (ns, obj, fn) => {
        for (let name of Object.keys(obj)) {
            let val = obj[name];
            if (isPlainObj(val))
                NS.extend(NS.sub(ns, name), val);
            else
                ns[name] = fn ? fn(val) : val;
        }
        return ns;
    };
    Object.setPrototypeOf(NS.prototype, null);
    class Result {
        constructor(prod, value, deps) {
            this.prod = prod;
            this.value = value;
            this.deps = deps;
        }
    }
    // utils
    var isNS = (o) => o instanceof NS, isPlainObj = (o) => o instanceof Object && getProto(o) === Object.prototype, isOwnProp = (o, name) => Object.prototype.hasOwnProperty.call(o, name), getProto = (o) => Object.getPrototypeOf(o);
    // errors
    var errorMissingRule = (name) => { throw new Error("missing dependency: " + name); }, errorMissingGiven = (name) => { throw new Error(name + "was defined as a given but has not been supplied yet"); }, errorBadProd = (prod) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + prod); }, errorShadowValue = (name) => { throw new Error("cannot shadow an earlier value with a nested namespace"); }, errorNotGivenSite = (name) => { throw new Error("location " + name + " is not registered as a given (null in namespace)"); }, errorNoSuchGiven = (name) => { throw new Error("location " + name + " does not exist in the namespace"); };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RoomOfRequirement;
});
//# sourceMappingURL=room-of-requirement.js.map