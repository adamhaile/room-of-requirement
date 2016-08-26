(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var RoomOfRequirement = (...specs) => injector(initState(specs), '', 0, null), injector = (_, base, depth, result) => new Proxy(givens(_, base, depth), { get: function get(t, name) {
            var path = combine(base, name), node = _[path];
            if (node instanceof Result && invalid(_, node))
                node = node.prod;
            return (node instanceof Result ?
                (result && result.dep(node),
                    node.value) :
                node === null ?
                    injector(_, path, depth, result) :
                    node instanceof Function ?
                        (node = resolve(_, path, depth, node),
                            descend(_, depth - node.depth)[path] = node,
                            result && result.dep(node),
                            node.value) :
                        node === undefined ? errorMissingRule(path) :
                            errorBadProd(node));
        } }), resolve = (_, path, depth, prod) => {
        var result = new Result(prod, null, path, 0);
        result.value = prod(injector(_, '', depth, result));
        return result;
    }, initState = (specs) => {
        var _ = Object.create(null);
        for (var spec of specs)
            extend(_, '', spec, (p, v, o) => v instanceof Function ? v : errorBadProd(v));
        return _;
    }, givens = (_, path, depth) => (givens) => {
        _ = Object.create(_), depth++;
        extend(_, path, givens, (p, v, o) => new Result(null, v, p, depth));
        return injector(_, path, depth, null);
    }, invalid = (_, r) => _[r.path] !== r || r.deps.some(d => invalid(_, d)), combine = (b, n) => (b ? b + '.' : '') + n.toString().replace('\\', '\\\\').replace('.', '\\.'), descend = (_, depth) => { while (depth--)
        _ = getProto(_); return _; }, extend = (_, path, obj, fn) => {
        if (isNamespace(obj)) {
            if (_[path])
                errorShadowValue(path);
            else
                _[path] = null;
            for (var n in obj)
                extend(_, combine(path, n), obj[n], fn);
        }
        else if (_[path] === null)
            errorShadowNamespace(path);
        else
            _[path] = fn(path, obj, _[path]);
    }, isNamespace = (o) => o instanceof Object && getProto(o) === Object.prototype, getProto = (o) => Object.getPrototypeOf(o);
    class Result {
        constructor(prod, value, path, depth) {
            this.prod = prod;
            this.value = value;
            this.path = path;
            this.depth = depth;
            this.deps = [];
        }
        dep(other) {
            if (other.depth < this.depth)
                this.depth = other.depth;
            this.deps.push(other);
        }
    }
    // errors
    var errorMissingRule = (name) => { throw new Error("missing dependency: " + name); }, errorBadProd = (prod) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + prod); }, errorShadowValue = (name) => { throw new Error("cannot shadow a value with a namespace: " + name); }, errorShadowNamespace = (name) => { throw new Error("cannot shadow a namespace with a value: " + name); };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RoomOfRequirement;
});
//# sourceMappingURL=room-of-requirement.js.map