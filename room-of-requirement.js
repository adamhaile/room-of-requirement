(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var RoomOfRequirement = (...namespaces) => injector(init(namespaces), 0, {}, null), resolve = (prod, ns, depth, inv) => {
        var result = new Result(prod, null, 0);
        result.value = prod(injector(ns, depth, inv, result));
        return result;
    }, injector = (ns, depth, inv, result) => new Proxy(givens(ns, depth, inv), { get: function get(_, name) {
            var node = ns[name];
            if (node instanceof Result && inv[node.id])
                node = node.prod;
            return (node instanceof Result ?
                (result && result.dep(node),
                    node.value) :
                node instanceof NS ?
                    injector(NS.sub(ns, name), depth, inv, result) :
                    node instanceof Function ?
                        (node = resolve(node, ns, depth, inv),
                            NS.descend(ns, depth - node.depth)[name] = node,
                            result && result.dep(node),
                            node.value) :
                        node === undefined ? errorMissingRule(name) :
                            errorBadProd(node));
        } }), givens = (ns, depth, inv) => (givens) => {
        ns = NS.overlay(ns), depth++, inv = Object.create(inv);
        NS.extend(ns, givens, (v, o) => (invalidate(inv, o), new Result(null, v, depth)));
        return injector(ns, depth, inv, null);
    }, invalidate = (inv, o) => {
        if (o instanceof Result && !inv[o.id]) {
            inv[o.id] = true;
            for (let d of o.dependees)
                invalidate(inv, d);
        }
    }, init = (nses) => nses.reduce((ns, o) => NS.extend(ns, o, v => v instanceof Function ? v : errorBadProd(v)), new NS());
    class NS {
    }
    NS.overlay = (ns) => Object.create(ns);
    NS.sub = (ns, name) => name in ns && !isNS(ns[name]) ? errorShadowValue(name) :
        isOwnProp(ns, name) ? ns[name] :
            ns[name] = (isNS(getProto(ns)) ? NS.overlay(NS.sub(getProto(ns), name)) : new NS());
    NS.descend = (ns, depth) => depth > 0 ? NS.descend(getProto(ns), depth - 1) : ns;
    NS.extend = (ns, obj, fn) => {
        for (let name of Object.keys(obj)) {
            let val = obj[name];
            if (isPlainObj(val))
                NS.extend(NS.sub(ns, name), val);
            else if (isNS(ns[name]))
                errorShadowNamespace(name);
            else
                ns[name] = fn ? fn(val, ns[name]) : val;
        }
        return ns;
    };
    Object.setPrototypeOf(NS.prototype, null);
    class Result {
        constructor(prod, value, depth, id = Result.count++) {
            this.prod = prod;
            this.value = value;
            this.depth = depth;
            this.id = id;
            this.dependees = [];
        }
        dep(other) {
            if (other.depth < this.depth)
                this.depth = other.depth;
            other.dependees.push(this);
        }
    }
    Result.count = 0;
    // utils
    var isNS = (o) => o instanceof NS, isPlainObj = (o) => o instanceof Object && getProto(o) === Object.prototype, isOwnProp = (o, name) => Object.prototype.hasOwnProperty.call(o, name), getProto = (o) => Object.getPrototypeOf(o);
    // errors
    var errorMissingRule = (name) => { throw new Error("missing dependency: " + name); }, errorBadProd = (prod) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + prod); }, errorShadowValue = (name) => { throw new Error("cannot shadow a value with a namespace: " + name); }, errorShadowNamespace = (name) => { throw new Error("cannot shadow a namespace with a value: " + name); };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RoomOfRequirement;
});
//# sourceMappingURL=room-of-requirement.js.map