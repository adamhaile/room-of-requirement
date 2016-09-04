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
    class CacheItem {
        constructor(cache, path) {
            this.cache = cache;
            this.path = path;
            cache.items[path] = this;
        }
    }
    class Namespace extends CacheItem {
        constructor(_, path) {
            super(_, path);
            new Generator(_, combinePath(path, '_'), () => overlay(_, path), '');
        }
    }
    class Target extends CacheItem {
    }
    class Generator extends Target {
        constructor(_, path, fn, base) {
            super(_, path);
            this.fn = fn;
            this.base = base;
        }
    }
    class Instance extends Target {
        constructor(_, path, value) {
            super(_, path);
            this.value = value;
        }
    }
    class Result extends Instance {
        constructor(_, path, value, gen, deps) {
            super(deps.reduce((_, d) => _.depth < d.cache.depth ? d.cache : _, _), path, value);
            this.gen = gen;
            this.deps = deps;
        }
        invalid(_) { return _.items[this.path] !== this || this.deps.some(d => d.invalid(_)); }
    }
    class Multi extends Instance {
        constructor(_, path, value, target) {
            super(_, path, value);
            this.target = target;
        }
        invalid(_) { var top = _.items[this.target]; return !!top && top.cache !== this.cache; }
    }
    let proxy = (_, base, instances) => new Proxy(overlay(_, base), {
        get: (target, name) => get(_, combinePath(base, name), instances)
    }), get = (_, path, instances) => {
        let node = resolve(_, path);
        if (node === undefined)
            return errorMissingTarget(path);
        if (instances && node instanceof Instance)
            instances[path] = node;
        return node instanceof Instance ? node.value : proxy(_, path, instances);
    }, resolve = (_, path) => {
        var cached = _.items[path], valid = cached instanceof Result && cached.invalid(_) ? cached.gen :
            cached instanceof Multi && cached.invalid(_) ? undefined :
                cached, resolved = valid instanceof Generator ? resolveGenerator(_, path, valid) :
            valid === undefined && isMultiPath(path) ? resolveMulti(_, path) :
                valid;
        return resolved;
    }, resolveGenerator = (_, path, gen) => {
        let instances = {}, value = gen.fn(proxy(_, gen.base, instances)), deps = Object.keys(instances).map(p => instances[p]);
        return new Result(gen.cache, path, value, gen, deps);
        ;
    }, resolveMulti = (_, path) => {
        let target = path.substr(0, path.length - 2), nodes = [];
        for (var node = resolve(_, target); node !== undefined; node = node.cache.parent ? resolve(node.cache.parent, target) : undefined)
            nodes.push(node);
        let value = nodes.map(node => node instanceof Instance ? node.value : proxy(node.cache, target, null)), cache = nodes.length ? nodes[0].cache : root;
        return new Multi(cache, path, value, target);
    }, overlay = (parent, path) => (generators) => {
        let _ = new Cache(parent.depth + 1, Object.create(parent.items), parent);
        cacheGenerators(_, path, path, generators);
        return proxy(_, path, null);
    }, cacheGenerators = (_, base, path, obj) => {
        if (obj instanceof Object && Object.getPrototypeOf(obj) === Object.prototype) {
            if (_.items[path] instanceof Target)
                errorShadowTarget(path);
            new Namespace(_, path);
            for (let name in obj)
                cacheGenerators(_, base, combinePath(path, name), obj[name]);
        }
        else {
            if (_.items[path] instanceof Namespace)
                errorShadowNamespace(path);
            if (obj instanceof Function)
                new Generator(_, path, obj, base);
            else
                new Result(_, path, obj, null, []);
        }
    }, combinePath = (base, name) => (base ? base + '.' : '') + name.toString().replace('\\', '\\\\').replace('.', '\\.'), isMultiPath = (path) => path.substr(path.length - 2) === '[]';
    // errors
    let errorMissingTarget = (path) => { throw new Error("missing dependency: " + path); }, errorShadowTarget = (path) => { throw new Error("cannot shadow a target with a namespace: " + path); }, errorShadowNamespace = (path) => { throw new Error("cannot shadow a namespace with a target: " + path); };
    let root = new Cache(0, Object.create(null), null);
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = proxy(root, '', null);
});
//# sourceMappingURL=room-of-requirement.js.map