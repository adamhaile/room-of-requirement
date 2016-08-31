class Cache {
    constructor(
        public depth : number,
        public items : { [path : string] : CacheItem | undefined }, // undefined = cache miss
        public parent : Cache | null
    ) { items[''] = new SubRules(this, ''); }
}

abstract class CacheItem {
    cache : Cache;
    path : string;
    constructor(_ : Cache, path : string) { this.cache = _; this.path = path; }
}

class SubRules extends CacheItem { }

abstract class Leaf extends CacheItem { }

class Generator extends Leaf {
    fn : Function;
    constructor(_: Cache, path : string, fn : Function) { super(_, path); this.fn = fn; }
}

abstract class Value extends Leaf {
    value : any;
    constructor(_: Cache, path : string, value : any) { super(_, path); this.value = value; }
    abstract invalid(_ : Cache) : boolean;
}

class Result extends Value {
    gen : Generator;
    deps = [] as Value[]; // dependencies of this result, for determining validity
    sealed = false;
    constructor(_ : Cache, path : string, value : any, gen : Generator) { super(_, path, value); this.gen = gen; }
    invalid(_ : Cache) : boolean { return _.items[this.path] !== this || this.deps.some(d => d.invalid(_)); }
    addDependency(dep : Value) {
        if (this.sealed) return;
        if (this.cache.depth < dep.cache.depth) this.cache = dep.cache;
        this.deps.push(dep);
    }
}

class Multi extends Value {
    target : string;
    constructor(_ : Cache, path : string, value : any, target : string) { super(_, path, value); this.target = target; }
    invalid(_ : Cache) { var top = _.items[this.target]; return !!top && top.cache !== this.cache; }
}

let proxy = (_ : Cache, base : string, requestor : Result | null) : any =>
        new Proxy(overlay(_, base), { 
            get : (target, name) => get(_, combinePath(base, name), requestor) 
        }),
    get = (_ : Cache, path : string, requestor : Result | null) => {
        let node = resolve(_, path);
        if (requestor && node instanceof Value) requestor.addDependency(node);
        if (node === undefined) return errorMissingTarget(path);
        return node instanceof Value ? node.value : proxy(_, path, requestor);
    },
    resolve = (_ : Cache, path : string) : Value | SubRules | undefined => {
        var cached   = _.items[path],
            resolved = 
                cached instanceof Generator                   ? resolveGenerator(_, path, cached) :
                cached instanceof Result && cached.invalid(_) ? resolveGenerator(_, path, cached.gen) :
                cached instanceof Multi  && cached.invalid(_) ? resolveMulti(_, path) :
                cached === undefined     && isMultiPath(path) ? resolveMulti(_, path) :
                cached;
        if (resolved && resolved !== cached) resolved.cache.items[path] = resolved;
        return resolved;
    },
    resolveGenerator = (_ : Cache, path : string, gen : Generator) => {
        let result = new Result(gen.cache, path, undefined, gen);
        result.value = gen.fn(proxy(_, '', result));
        result.sealed = true;
        return result;
    },
    resolveMulti = (_ : Cache, path : string) => {
        let target = path.substr(0, path.length - 2),
            result = new Multi(root, path, [], target);
        for (var node = resolve(_, target);                                             // get first def'n
             node !== undefined;                                                        // loop until undefined
             node = node.cache.parent ? resolve(node.cache.parent, target) : undefined) // advance to next def'n`
        {
            if (result.cache === root) result.cache = node.cache;
            result.value.push(node instanceof Value ? node.value : proxy(node.cache, target, null));
        }
        return result;
    },
    overlay = (parent : Cache, path : string) => (generators : any) => {
        let _ = new Cache(parent.depth + 1, Object.create(parent.items), parent);
        cacheGenerators(_, path, generators);
        return proxy(_, path, null);
    },
    cacheGenerators = (_ : Cache, path : string, obj : any) => {
        if (obj instanceof Object && Object.getPrototypeOf(obj) === Object.prototype) { 
            if (_.items[path] instanceof Leaf) errorShadowValue(path);
            else _.items[path] = new SubRules(_, path); 
            for (let name in obj) cacheGenerators(_, combinePath(path, name), obj[name]);
        } else if (obj instanceof Function) {
            if (_.items[path] instanceof SubRules) errorShadowNamespace(path);
            else _.items[path] = new Generator(_, path, obj);
        } else errorBadGenerator(path, obj);
    },
    combinePath = (base : string, name : string | number | symbol) => 
        (base ? base + '.' : '') + name.toString().replace('\\', '\\\\').replace('.', '\\.'),
    isMultiPath = (path : string) => path.substr(path.length - 2) === '[]';

// errors
let errorMissingTarget = (path : string) => { throw new Error("missing dependency: " + path); },
    errorBadGenerator = (path : string, prod : any) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + path + ' = ' + prod); },
    errorShadowValue = (path : string) => { throw new Error("cannot shadow a value with a namespace: " + path); },
    errorShadowNamespace = (path : string) => { throw new Error("cannot shadow a namespace with a value: " + path); };

var root = new Cache(0, Object.create(null), null);

export default proxy(root, '', null);;
