interface Rules<D> {
    [target : string] : Rules<D> | ((deps : Cache<D>) => any) | Object | null
}

export type Cache<D> = D & { _ : Cache<D> } & (<E>(rules : Rules<D & E>) => Cache<D & E>)

class CacheState {
    constructor(public depth : number, public items : { [path : string] : CacheItem | undefined }, public parent : CacheState | null) { }
}

abstract class CacheItem {
    constructor(public cache : CacheState, public path : string) { cache.items[path] = this; }
}

class NestedRules extends CacheItem { 
    constructor(_ : CacheState, path : string) { super(_, path);
        new Generator(_, combinePath(path, '_'), () => overlay(_, path), '')
    }
}

abstract class Target extends CacheItem { }

class Generator extends Target {
    constructor(_: CacheState, path : string, public fn : Function, public base : string) { super(_, path); }
}

abstract class Instance extends Target {
    constructor(_: CacheState, path : string, public value : any) { super(_, path); }
    abstract invalid(_ : CacheState) : boolean;
}

class Result extends Instance {
    constructor(_ : CacheState, path : string, value : any, public gen : Generator | null, public deps : Instance[]) { 
        super(deps.reduce((_, d) => _.depth < d.cache.depth ? d.cache : _, _), path, value); 
    }
    invalid(_ : CacheState) { return _.items[this.path] !== this || this.deps.some(d => d.invalid(_)); }
}

class Multi extends Instance {
    constructor(_ : CacheState, path : string, value : any, public target : string) { super(_, path, value); }
    invalid(_ : CacheState) { var top = _.items[this.target]; return !!top && top.cache !== this.cache; }
}

let proxy = <D>(_ : CacheState, base : string, instances : { [path : string] : Instance } | null) : Cache<D> =>
        new Proxy(overlay<D>(_, base) as Cache<D>, { 
            get : (target, name) => get(_, combinePath(base, name), instances) 
        }),
    get = (_ : CacheState, path : string, instances : { [path : string] : Instance } | null) => {
        let node = resolve(_, path);
        if (node === undefined) return errorMissingTarget(path);
        if (instances && node instanceof Instance) instances[path] = node;
        return node instanceof Instance ? node.value : proxy(_, path, instances);
    },
    resolve = (_ : CacheState, path : string) : Instance | NestedRules | undefined => {
        var cached   = _.items[path],
            valid    = cached instanceof Result && cached.invalid(_) ? cached.gen! :
                       cached instanceof Multi  && cached.invalid(_) ? undefined :
                       cached,
            resolved = valid instanceof Generator                    ? resolveGenerator(_, path, valid) :
                       valid === undefined      && isMultiPath(path) ? resolveMulti(_, path) :
                       valid;
        return resolved;
    },
    resolveGenerator = (_ : CacheState, path : string, gen : Generator) => {
        let instances = {} as { [path : string] : Instance }, 
            value = gen.fn(proxy(_, gen.base, instances)),
            deps = Object.keys(instances).map(p => instances[p]);
        return new Result(gen.cache, path, value, gen, deps);;
    },
    resolveMulti = (_ : CacheState, path : string) => {
        let target = path.substr(0, path.length - 2),
            nodes = [] as (Instance | NestedRules)[];
        for (var node = resolve(_, target);                                             // get first def'n
             node !== undefined;                                                        // loop until undefined
             node = node.cache.parent ? resolve(node.cache.parent, target) : undefined) // advance to next def'n`
            nodes.push(node);
        let value = nodes.map(node => node instanceof Instance ? node.value : proxy(node.cache, target, null)),
            cache = nodes.length ? nodes[0].cache : _;
        return new Multi(cache, path, value, target);
    },
    overlay = <D>(parent : CacheState, path : string) => <E>(generators : Rules<D & E>) => {
        let _ = new CacheState(parent.depth + 1, Object.create(parent.items), parent);
        cacheGenerators(_, path, path, generators);
        return proxy<D & E>(_, path, null);
    },
    cacheGenerators = (_ : CacheState, base : string, path : string, obj : any) => {
        if (obj instanceof Object && Object.getPrototypeOf(obj) === Object.prototype) {
            if (_.items[path] instanceof Target) errorShadowTarget(path);
            new NestedRules(_, path); 
            for (let name in obj) cacheGenerators(_, base, combinePath(path, name), obj[name]);
        } else {
            if (_.items[path] instanceof NestedRules) errorShadowNamespace(path);
            if (obj instanceof Function) new Generator(_, path, obj, base);
            else new Result(_, path, obj, null, []);
        } 
    },
    combinePath = (base : string, name : string | number | symbol) => 
        (base ? base + '.' : '') + name.toString().replace('\\', '\\\\').replace('.', '\\.'),
    isMultiPath = (path : string) => path.substr(path.length - 2) === '[]';

// errors
let errorMissingTarget = (path : string) => { throw new Error("missing dependency: " + path); },
    errorShadowTarget = (path : string) => { throw new Error("cannot shadow a target with a namespace: " + path); },
    errorShadowNamespace = (path : string) => { throw new Error("cannot shadow a namespace with a target: " + path); };

export let root = proxy<{}>(new CacheState(0, Object.create(null), null), '', null);


