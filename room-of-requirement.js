(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    class Cache {
        constructor(depth, items, parent) {
            this.depth = depth;
            this.items = items;
            this.parent = parent;
        }
    }
    var isLeaf = (e) => !!e && !(e instanceof SubRules), isResolved = (e) => !(e instanceof Generator), isValue = (e) => isResolved(e) && isLeaf(e);
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
        invalid(_) { return _.items[this.gen.path] !== this || this.deps.some(d => d.invalid(_)); }
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
        invalid(_) { var top = _.items[this.target]; return !!top && top.scope !== this.scope; }
    }
    class SubRules {
        constructor(scope) {
            this.scope = scope;
        }
    }
    let proxy = (_, base, requestor) => new Proxy(overlay(_, base), {
        get: (target, name) => get(_, combinePath(base, name), requestor)
    }), get = (_, path, requestor) => {
        let node = resolve(_, path);
        if (requestor && isValue(node))
            requestor.addDependency(node);
        if (node === undefined)
            return errorMissingTarget(path);
        return isValue(node) ? node.value : proxy(_, path, requestor);
    }, resolve = (_, path) => {
        var cached = _.items[path], resolved = cached instanceof Generator ? resolveGenerator(_, path, cached) :
            cached instanceof Result && cached.invalid(_) ? resolveGenerator(_, path, cached.gen) :
                cached instanceof Multi && cached.invalid(_) ? resolveMulti(_, path) :
                    cached === undefined && isMultiPath(path) ? resolveMulti(_, path) :
                        cached;
        if (resolved && resolved !== cached)
            resolved.scope.items[path] = resolved;
        return resolved;
    }, resolveGenerator = (_, path, gen) => {
        let result = new Result(undefined, gen.scope, gen);
        result.value = gen.fn(proxy(_, '', result));
        return result;
    }, resolveMulti = (_, path) => {
        let target = path.substr(0, path.length - 2), result = new Multi([], root, target);
        for (var node = resolve(_, target); node !== undefined; node = node.scope.parent ? resolve(node.scope.parent, target) : undefined) {
            if (result.scope === root)
                result.scope = node.scope;
            result.value.push(isLeaf(node) ? node.value : proxy(node.scope, target, null));
        }
        return result;
    }, overlay = (parent, path) => (generators) => {
        let _ = new Cache(parent.depth + 1, Object.create(parent.items), parent);
        cacheGenerators(_, path, generators);
        return proxy(_, path, null);
    }, cacheGenerators = (_, path, obj) => {
        if (isPlainObject(obj)) {
            if (isLeaf(_.items[path]))
                errorShadowValue(path);
            else
                _.items[path] = new SubRules(_);
            for (let n in obj)
                cacheGenerators(_, combinePath(path, n), obj[n]);
        }
        else if (_.items[path] instanceof SubRules)
            errorShadowNamespace(path);
        else if (obj instanceof Function)
            _.items[path] = new Generator(obj, _, path);
        else
            errorBadGenerator(path, obj);
    };
    // paths
    let combinePath = (base, name) => (base ? base + '.' : '') + name.toString().replace('\\', '\\\\').replace('.', '\\.'), isMultiPath = (path) => path.substr(path.length - 2) === '[]';
    // utils    
    let isPlainObject = (o) => o instanceof Object && getProto(o) === Object.prototype, getProto = (o) => Object.getPrototypeOf(o), hasOwnProp = (o, name) => Object.prototype.hasOwnProperty.call(o, name);
    // errors
    let errorMissingTarget = (path) => { throw new Error("missing dependency: " + path); }, errorBadGenerator = (path, prod) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + path + ' = ' + prod); }, errorShadowValue = (path) => { throw new Error("cannot shadow a value with a namespace: " + path); }, errorShadowNamespace = (path) => { throw new Error("cannot shadow a namespace with a value: " + path); };
    var root = new Cache(0, Object.create(null), null);
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = proxy(root, '', null);
    ;
});
//# sourceMappingURL=room-of-requirement.js.map