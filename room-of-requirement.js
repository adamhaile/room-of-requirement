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
        constructor(depth, items, // undefined = cache miss
            parent) {
            this.depth = depth;
            this.items = items;
            this.parent = parent;
            items[''] = new SubRules(this, '');
        }
    }
    class CacheItem {
        constructor(_, path) {
            this.cache = _;
            this.path = path;
        }
    }
    class SubRules extends CacheItem {
    }
    class Leaf extends CacheItem {
    }
    class Generator extends Leaf {
        constructor(_, path, fn) {
            super(_, path);
            this.fn = fn;
        }
    }
    class Value extends Leaf {
        constructor(_, path, value) {
            super(_, path);
            this.value = value;
        }
    }
    class Result extends Value {
        constructor(_, path, value, gen) {
            super(_, path, value);
            this.deps = []; // dependencies of this result, for determining validity
            this.sealed = false;
            this.gen = gen;
        }
        invalid(_) { return _.items[this.path] !== this || this.deps.some(d => d.invalid(_)); }
        addDependency(dep) {
            if (this.sealed)
                return;
            if (this.cache.depth < dep.cache.depth)
                this.cache = dep.cache;
            this.deps.push(dep);
        }
    }
    class Multi extends Value {
        constructor(_, path, value, target) {
            super(_, path, value);
            this.target = target;
        }
        invalid(_) { var top = _.items[this.target]; return !!top && top.cache !== this.cache; }
    }
    let proxy = (_, base, requestor) => new Proxy(overlay(_, base), {
        get: (target, name) => get(_, combinePath(base, name), requestor)
    }), get = (_, path, requestor) => {
        let node = resolve(_, path);
        if (requestor && node instanceof Value)
            requestor.addDependency(node);
        if (node === undefined)
            return errorMissingTarget(path);
        return node instanceof Value ? node.value : proxy(_, path, requestor);
    }, resolve = (_, path) => {
        var cached = _.items[path], resolved = cached instanceof Generator ? resolveGenerator(_, path, cached) :
            cached instanceof Result && cached.invalid(_) ? resolveGenerator(_, path, cached.gen) :
                cached instanceof Multi && cached.invalid(_) ? resolveMulti(_, path) :
                    cached === undefined && isMultiPath(path) ? resolveMulti(_, path) :
                        cached;
        if (resolved && resolved !== cached)
            resolved.cache.items[path] = resolved;
        return resolved;
    }, resolveGenerator = (_, path, gen) => {
        let result = new Result(gen.cache, path, undefined, gen);
        result.value = gen.fn(proxy(_, '', result));
        result.sealed = true;
        return result;
    }, resolveMulti = (_, path) => {
        let target = path.substr(0, path.length - 2), result = new Multi(root, path, [], target);
        for (var node = resolve(_, target); node !== undefined; node = node.cache.parent ? resolve(node.cache.parent, target) : undefined) {
            if (result.cache === root)
                result.cache = node.cache;
            result.value.push(node instanceof Value ? node.value : proxy(node.cache, target, null));
        }
        return result;
    }, overlay = (parent, path) => (generators) => {
        let _ = new Cache(parent.depth + 1, Object.create(parent.items), parent);
        cacheGenerators(_, path, generators);
        return proxy(_, path, null);
    }, cacheGenerators = (_, path, obj) => {
        if (obj instanceof Object && Object.getPrototypeOf(obj) === Object.prototype) {
            if (_.items[path] instanceof Leaf)
                errorShadowValue(path);
            else
                _.items[path] = new SubRules(_, path);
            for (let name in obj)
                cacheGenerators(_, combinePath(path, name), obj[name]);
        }
        else if (obj instanceof Function) {
            if (_.items[path] instanceof SubRules)
                errorShadowNamespace(path);
            else
                _.items[path] = new Generator(_, path, obj);
        }
        else
            errorBadGenerator(path, obj);
    }, combinePath = (base, name) => (base ? base + '.' : '') + name.toString().replace('\\', '\\\\').replace('.', '\\.'), isMultiPath = (path) => path.substr(path.length - 2) === '[]';
    // errors
    let errorMissingTarget = (path) => { throw new Error("missing dependency: " + path); }, errorBadGenerator = (path, prod) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + path + ' = ' + prod); }, errorShadowValue = (path) => { throw new Error("cannot shadow a value with a namespace: " + path); }, errorShadowNamespace = (path) => { throw new Error("cannot shadow a namespace with a value: " + path); };
    var root = new Cache(0, Object.create(null), null);
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = proxy(root, '', null);
    ;
});
//# sourceMappingURL=room-of-requirement.js.map