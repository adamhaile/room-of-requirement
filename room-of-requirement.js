(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    class Scope {
    }
    Scope.create = () => Object.create(null);
    Scope.overlay = (_) => Object.create(_);
    Scope.getLower = (_, depth) => {
        while (depth--)
            _ = getProto(_);
        return _;
    };
    Scope.extend = (_, path, obj, fn) => {
        if (isPlainObject(obj)) {
            if (_[path])
                errorShadowValue(path);
            else
                _[path] = null;
            for (var n in obj)
                Scope.extend(_, combinePath(path, n), obj[n], fn);
        }
        else if (_[path] === null)
            errorShadowNamespace(path);
        else
            _[path] = fn(path, obj, _[path]);
    };
    class Generator {
        constructor(fn, // function to generate dependency
            depth // depth in overlayed state
            ) {
            this.fn = fn;
            this.depth = depth;
        }
    }
    class Result {
        constructor(gen, // generator for this result, or undefined for givens and multis
            value, // value of the result, polymorphic
            path, // path of result
            depth // depth in overlayed state, = max depth of dependencies
            ) {
            this.gen = gen;
            this.value = value;
            this.path = path;
            this.depth = depth;
            this.deps = []; // dependencies of this result, for determining validity
        }
        addDependency(dep) {
            if (dep.depth > this.depth)
                this.depth = dep.depth;
            this.deps.push(dep);
        }
        invalidForState(_) {
            return _[this.path] !== this || this.deps.some(d => d.invalidForState(_));
        }
    }
    let RoomOfRequirement = (...specs) => injector(initState(specs), specs.length - 1, '', null), injector = (_, depth, base, result) => new Proxy(handleGivens(_, depth, base), {
        get: (target, name) => get(_, depth, combinePath(base, name), result)
    }), get = (_, depth, path, result) => {
        var node = _[path];
        if (node instanceof Result && node.invalidForState(_))
            node = node.gen; // why !?
        return node instanceof Result ? (result && result.addDependency(node),
            node.value) :
            node === null ? injector(_, depth, path, result) :
                node instanceof Generator ? (node = resolve(_, depth, path, node),
                    result && result.addDependency(node),
                    node.value) :
                    node === undefined ?
                        (isMultiPath(path) ? (node = resolveMulti(_, depth, path),
                            result && result.addDependency(node),
                            node.value)
                            : errorMissingRule(path)) :
                        errorBadProd(path, node);
    }, resolve = (_, depth, path, gen) => {
        var result = new Result(gen, null, path, gen.depth);
        result.value = gen.fn(injector(_, depth, '', result));
        Scope.getLower(_, depth - result.depth)[path] = result;
        return result;
    }, resolveMulti = (_, depth, path) => {
        var target = path.substr(0, path.length - 2), values = [], result = new Result(void 0, values, path, 0);
        for (; depth >= 0; _ = getProto(_), depth--)
            if (hasOwnProp(_, target)) {
                values.push(get(_, depth, target, values.length ? null : result));
                if (values.length === 1)
                    _[path] = result;
            }
        return result;
    }, initState = (specs) => {
        for (var i = 0, _ = Scope.create(); i < specs.length; i++, _ = Scope.overlay(_)) {
            Scope.extend(_, '', specs[i], (p, v, o) => v instanceof Function ? new Generator(v, i) : errorBadProd(p, v));
        }
        return getProto(_);
    }, handleGivens = (_, depth, path) => (givens) => {
        _ = Scope.overlay(_), depth++;
        Scope.extend(_, path, givens, (p, v, o) => new Result(void 0, v, p, depth));
        return injector(_, depth, path, null);
    };
    // paths
    var combinePath = (base, name) => (base ? base + '.' : '') + name.toString().replace('\\', '\\\\').replace('.', '\\.'), isMultiPath = (path) => path.substr(path.length - 2) === '[]';
    // utils    
    var isPlainObject = (o) => o instanceof Object && getProto(o) === Object.prototype, getProto = (o) => Object.getPrototypeOf(o), hasOwnProp = (o, name) => Object.prototype.hasOwnProperty.call(o, name);
    // errors
    var errorMissingRule = (path) => { throw new Error("missing dependency: " + path); }, errorBadProd = (path, prod) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + path + ' = ' + prod); }, errorShadowValue = (path) => { throw new Error("cannot shadow a value with a namespace: " + path); }, errorShadowNamespace = (path) => { throw new Error("cannot shadow a namespace with a value: " + path); };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RoomOfRequirement;
});
//# sourceMappingURL=room-of-requirement.js.map