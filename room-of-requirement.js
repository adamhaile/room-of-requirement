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
        constructor(depth, cache, parent) {
            this.depth = depth;
            this.cache = cache;
            this.parent = parent;
        }
    }
    class Generator {
        constructor(fn, // function to generate dependency
            scope, // scope in which generator was added
            path // path of generator
            ) {
            this.fn = fn;
            this.scope = scope;
            this.path = path;
        }
    }
    class Result {
        constructor(value, // value of result
            scope, // scope in which result is valid
            gen) {
            this.value = value;
            this.scope = scope;
            this.gen = gen;
            this.deps = []; // dependencies of this result, for determining validity
        }
        invalid(_) { return _.cache[this.gen.path] !== this || this.deps.some(d => d.invalid(_)); }
        addDependency(dep) {
            if (this.scope.depth < dep.scope.depth)
                this.scope = dep.scope;
            this.deps.push(dep);
        }
    }
    class Multi {
        constructor(value, scope, target) {
            this.value = value;
            this.scope = scope;
            this.target = target;
        }
        invalid(_) { var top = _.cache[this.target]; return !!top && top.scope !== this.scope; }
    }
    let proxy = (_, base, requestor) => new Proxy(overlay(_, base), {
        get: (target, name) => get(_, combinePath(base, name), requestor)
    }), get = (_, path, requestor) => {
        let node = resolve(_, path, _.cache[path]);
        if (requestor && node)
            requestor.addDependency(node);
        return node ? node.value : proxy(_, path, requestor);
    }, resolve = (_, path, node) => node instanceof Generator ? resolveGenerator(_, path, node) :
        node instanceof Result && node.invalid(_) ? resolveGenerator(_, path, node.gen) :
            node instanceof Multi && node.invalid(_) ? resolveMulti(_, path) :
                node === undefined ? (isMultiPath(path) ? resolveMulti(_, path)
                    : errorMissingRule(path)) :
                    node, resolveGenerator = (_, path, gen) => {
        let result = new Result(null, gen.scope, gen);
        result.value = gen.fn(proxy(_, '', result));
        result.scope.cache[path] = result;
        return result;
    }, resolveMulti = (_, path) => {
        let target = path.substr(0, path.length - 2), result = new Multi([], _, target);
        do
            if (hasOwnProp(_.cache, target)) {
                result.value.push(get(_, target, null));
            }
        while (_ = _.parent);
        result.scope.cache[path] = result;
        return result;
    }, overlay = (p, path) => (generators) => {
        let _ = new Scope(p.depth + 1, Object.create(p.cache), p);
        cacheGenerators(_, path, generators);
        return proxy(_, path, null);
    }, cacheGenerators = (_, path, obj) => {
        if (isPlainObject(obj)) {
            if (_.cache[path])
                errorShadowValue(path);
            else
                _.cache[path] = null;
            for (let n in obj)
                cacheGenerators(_, combinePath(path, n), obj[n]);
        }
        else if (_.cache[path] === null)
            errorShadowNamespace(path);
        else if (obj instanceof Function)
            _.cache[path] = new Generator(obj, _, path);
        else
            errorBadProd(path, obj);
    };
    // paths
    let combinePath = (base, name) => (base ? base + '.' : '') + name.toString().replace('\\', '\\\\').replace('.', '\\.'), isMultiPath = (path) => path.substr(path.length - 2) === '[]';
    // utils    
    let isPlainObject = (o) => o instanceof Object && getProto(o) === Object.prototype, getProto = (o) => Object.getPrototypeOf(o), hasOwnProp = (o, name) => Object.prototype.hasOwnProperty.call(o, name);
    // errors
    let errorMissingRule = (path) => { throw new Error("missing dependency: " + path); }, errorBadProd = (path, prod) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + path + ' = ' + prod); }, errorShadowValue = (path) => { throw new Error("cannot shadow a value with a namespace: " + path); }, errorShadowNamespace = (path) => { throw new Error("cannot shadow a namespace with a value: " + path); };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = proxy(new Scope(0, Object.create(null), null), '', null);
});
//# sourceMappingURL=room-of-requirement.js.map