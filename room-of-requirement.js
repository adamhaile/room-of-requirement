(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var RoomOfRequirement = (...specs) => injector(initState(specs), '', 0, null), injector = (_, base, depth, result) => new Proxy(handleGivens(_, base, depth), { get: function get(t, name) {
            var path = combinePath(base, name), node = _[path];
            if (node instanceof Result && isInvalid(_, node))
                node = node.prod;
            return node instanceof Result ? (addDependency(result, node), node.value) :
                node === null ? injector(_, path, depth, result) :
                    node instanceof Function ? (node = resolve(_, path, depth, node),
                        addDependency(result, node),
                        node.value) :
                        node === undefined ? errorMissingRule(path) :
                            errorBadProd(path, node);
        } }), resolve = (_, path, depth, prod) => {
        var result = new Result(prod, null, path, 0);
        result.value = prod(injector(_, '', depth, result));
        getLowerState(_, depth - result.depth)[path] = result;
        return result;
    }, initState = (specs) => {
        var _ = Object.create(null);
        for (var spec of specs)
            extendState(_, '', spec, (p, v, o) => v instanceof Function ? v : errorBadProd(p, v));
        return _;
    }, handleGivens = (_, path, depth) => (givens) => {
        _ = overlayState(_), depth++;
        extendState(_, path, givens, (p, v, o) => new Result(null, v, p, depth));
        return injector(_, path, depth, null);
    }, addDependency = (a, b) => a && (a.depth = Math.max(a.depth, b.depth), a.deps.push(b)), isInvalid = (_, r) => _[r.path] !== r || r.deps.some(d => isInvalid(_, d)), combinePath = (b, n) => (b ? b + '.' : '') + n.toString().replace('\\', '\\\\').replace('.', '\\.'), overlayState = (_) => Object.create(_), getLowerState = (_, depth) => { while (depth--)
        _ = getProto(_); return _; }, extendState = (_, path, obj, fn) => {
        if (isNamespace(obj)) {
            if (_[path])
                errorShadowValue(path);
            else
                _[path] = null;
            for (var n in obj)
                extendState(_, combinePath(path, n), obj[n], fn);
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
    }
    // errors
    var errorMissingRule = (name) => { throw new Error("missing dependency: " + name); }, errorBadProd = (name, prod) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + name + ' = ' + prod); }, errorShadowValue = (name) => { throw new Error("cannot shadow a value with a namespace: " + name); }, errorShadowNamespace = (name) => { throw new Error("cannot shadow a namespace with a value: " + name); };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RoomOfRequirement;
});
//# sourceMappingURL=room-of-requirement.js.map