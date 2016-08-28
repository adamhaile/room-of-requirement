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
    Scope.extend = (_, depth, path, obj) => {
        if (isPlainObject(obj)) {
            if (_[path])
                errorShadowValue(path);
            else
                _[path] = null;
            for (let n in obj)
                Scope.extend(_, depth, combinePath(path, n), obj[n]);
        }
        else if (_[path] === null)
            errorShadowNamespace(path);
        else if (obj instanceof Function)
            _[path] = new Generator(obj, depth);
        else
            errorBadProd(path, obj);
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
        invalidForScope(_) {
            return _[this.path] !== this || this.deps.some(d => d.invalidForScope(_));
        }
    }
    let injector = (_, depth, base, requestor) => new Proxy(overlay(_, depth, base), {
        get: (target, name) => get(_, depth, combinePath(base, name), requestor)
    }), get = (_, depth, path, requestor) => {
        let node = _[path];
        if (node instanceof Result && node.invalidForScope(_))
            node = node.gen; // why !?
        return node instanceof Result ? (requestor && requestor.addDependency(node),
            node.value) :
            node === null ? injector(_, depth, path, requestor) :
                node instanceof Generator ? (node = resolve(_, depth, path, node),
                    requestor && requestor.addDependency(node),
                    node.value) :
                    node === undefined ?
                        (isMultiPath(path) ? (node = resolveMulti(_, depth, path),
                            requestor && requestor.addDependency(node),
                            node.value)
                            : errorMissingRule(path)) :
                        errorBadProd(path, node);
    }, resolve = (_, depth, path, gen) => {
        let result = new Result(gen, null, path, gen.depth);
        result.value = gen.fn(injector(_, depth, '', result));
        Scope.getLower(_, depth - result.depth)[path] = result;
        return result;
    }, resolveMulti = (_, depth, path) => {
        let target = path.substr(0, path.length - 2), values = [], result = new Result(void 0, values, path, 0);
        for (; depth >= 0; _ = getProto(_), depth--)
            if (hasOwnProp(_, target)) {
                values.push(get(_, depth, target, values.length ? null : result));
                if (values.length === 1)
                    _[path] = result;
            }
        return result;
    }, overlay = (p_, pdepth, path) => (givens) => {
        let _ = Scope.overlay(p_), depth = pdepth + 1;
        Scope.extend(_, depth, path, givens);
        return injector(_, depth, path, null);
    };
    // paths
    let combinePath = (base, name) => (base ? base + '.' : '') + name.toString().replace('\\', '\\\\').replace('.', '\\.'), isMultiPath = (path) => path.substr(path.length - 2) === '[]';
    // utils    
    let isPlainObject = (o) => o instanceof Object && getProto(o) === Object.prototype, getProto = (o) => Object.getPrototypeOf(o), hasOwnProp = (o, name) => Object.prototype.hasOwnProperty.call(o, name);
    // errors
    let errorMissingRule = (path) => { throw new Error("missing dependency: " + path); }, errorBadProd = (path, prod) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + path + ' = ' + prod); }, errorShadowValue = (path) => { throw new Error("cannot shadow a value with a namespace: " + path); }, errorShadowNamespace = (path) => { throw new Error("cannot shadow a namespace with a value: " + path); };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = injector(Scope.create(), 0, '', null);
});
//# sourceMappingURL=room-of-requirement.js.map