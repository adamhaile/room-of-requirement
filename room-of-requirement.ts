class Cache {
    constructor(
        public depth : number,
        public items : { [path : string] : CacheEntry },
        public parent : Cache | null
    ) { }
}

type CacheEntry = Generator | Result | Multi | SubRules | undefined;

// cache entry subtypes and runtime typeguards
type Leaf = Generator | Result | Multi;
type Resolved = Result | Multi | SubRules | undefined;
type Value = Result | Multi;
var isLeaf     = (e : CacheEntry) : e is Leaf     => !!e && !(e instanceof SubRules),
    isResolved = (e : CacheEntry) : e is Resolved => !(e instanceof Generator),
    isValue    = (e : CacheEntry) : e is Value    => isResolved(e) && isLeaf(e);

class Generator {
    constructor(
        public fn : Function,   // function to generate dependency
        public scope : Cache,   // scope in which generator was added
        public path : string    // path of generator
    ) { }
}

class Result {
    constructor(
        public value : any,     // value of result
        public scope : Cache,   // scope in which result is valid
        public gen : Generator, // generator for this result
    ) { }
    deps = [] as Value[]; // dependencies of this result, for determining validity
    invalid(_ : Cache) : boolean { return _.items[this.gen.path] !== this || this.deps.some(d => d.invalid(_)); }
    addDependency(dep : Value) {
        if (this.scope.depth < dep.scope.depth) this.scope = dep.scope;
        this.deps.push(dep);
    }
}

class Multi {
    constructor(
        public value : any[], 
        public scope : Cache,
        public target : string
    ) { }
    invalid(_ : Cache) { var top = _.items[this.target]; return !!top && top.scope !== this.scope; }
}

class SubRules {
    constructor(
        public scope : Cache
    ) { }
}

let proxy = (_ : Cache, base : string, requestor : Result | null) : any =>
        new Proxy(overlay(_, base), { 
            get : (target, name) => get(_, combinePath(base, name), requestor) 
        }),
    get = (_ : Cache, path : string, requestor : Result | null) => {
        let node = resolve(_, path);
        if (requestor && isValue(node)) requestor.addDependency(node);
        if (node === undefined) return errorMissingTarget(path);
        return isValue(node) ? node.value : proxy(_, path, requestor);
    },
    resolve = (_ : Cache, path : string) : Resolved => {
        var cached   = _.items[path],
            resolved = 
                cached instanceof Generator                   ? resolveGenerator(_, path, cached) :
                cached instanceof Result && cached.invalid(_) ? resolveGenerator(_, path, cached.gen) :
                cached instanceof Multi  && cached.invalid(_) ? resolveMulti(_, path) :
                cached === undefined     && isMultiPath(path) ? resolveMulti(_, path) :
                cached;
        if (resolved && resolved !== cached) resolved.scope.items[path] = resolved;
        return resolved;
    },
    resolveGenerator = (_ : Cache, path : string, gen : Generator) => {
        let result = new Result(undefined, gen.scope, gen);
        result.value = gen.fn(proxy(_, '', result));
        return result;
    },
    resolveMulti = (_ : Cache, path : string) => {
        let target = path.substr(0, path.length - 2),
            result = new Multi([], root, target);
        for (var node = resolve(_, target);                                             // get first def'n
             node !== undefined;                                                        // loop until undefined
             node = node.scope.parent ? resolve(node.scope.parent, target) : undefined) // advance to next def'n`
        {
            if (result.scope === root) result.scope = node.scope;
            result.value.push(isLeaf(node) ? node.value : proxy(node.scope, target, null));
        }
        return result;
    },
    overlay = (parent : Cache, path : string) => (generators : any) => {
        let _ = new Cache(parent.depth + 1, Object.create(parent.items), parent);
        cacheGenerators(_, path, generators);
        return proxy(_, path, null);
    },
    cacheGenerators = (_ : Cache, path : string, obj : any) => {
        if (isPlainObject(obj)) { 
            if (isLeaf(_.items[path])) errorShadowValue(path);
            else _.items[path] = new SubRules(_); 
            for (let n in obj) cacheGenerators(_, combinePath(path, n), obj[n]);
        } else if (_.items[path] instanceof SubRules) errorShadowNamespace(path)
        else if (obj instanceof Function) _.items[path] = new Generator(obj, _, path);
        else errorBadGenerator(path, obj);
    };

// paths
let combinePath = (base : string, name : string | number | symbol) => 
        (base ? base + '.' : '') + name.toString().replace('\\', '\\\\').replace('.', '\\.'),
    isMultiPath = (path : string) => path.substr(path.length - 2) === '[]';

// utils    
let isPlainObject = (o : any) => o instanceof Object && getProto(o) === Object.prototype,
    getProto = (o : any) => Object.getPrototypeOf(o),
    hasOwnProp = (o : any, name : string) => Object.prototype.hasOwnProperty.call(o, name);

// errors
let errorMissingTarget = (path : string) => { throw new Error("missing dependency: " + path); },
    errorBadGenerator = (path : string, prod : any) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + path + ' = ' + prod); },
    errorShadowValue = (path : string) => { throw new Error("cannot shadow a value with a namespace: " + path); },
    errorShadowNamespace = (path : string) => { throw new Error("cannot shadow a namespace with a value: " + path); };

var root = new Cache(0, Object.create(null), null);

export default proxy(root, '', null);;
