class Scope {
    constructor(
        public depth : number,
        public cache : { [path : string] : Generator | Result | Multi | null | undefined },
        public parent : Scope | null
    ) { }
}

type GeneratorFunc = (deps? : any) => any;

class Generator {
    constructor(
        public fn : GeneratorFunc, // function to generate dependency
        public scope : Scope,      // scope in which generator was added
        public path : string       // path of generator
    ) { }
}

interface IDependency {
    scope : Scope;
    invalid(_ : Scope) : boolean;
}

class Result implements IDependency {
    constructor(
        public value : any,     // value of result
        public scope : Scope,   // scope in which result is valid
        public gen : Generator, // generator for this result
    ) { }
    deps = [] as IDependency[]; // dependencies of this result, for determining validity
    invalid(_ : Scope) { return _.cache[this.gen.path] !== this || this.deps.some(d => d.invalid(_)); }
    addDependency(dep : IDependency) {
        if (this.scope.depth < dep.scope.depth) this.scope = dep.scope;
        this.deps.push(dep);
    }
}

class Multi implements IDependency {
    constructor(
        public value : any[], 
        public scope : Scope,
        public target : string
    ) { }
    invalid(_ : Scope) { var top = _.cache[this.target]; return !!top && top.scope !== this.scope; }
}

interface NamespaceSpec {
    [name : string] :  GeneratorFunc | NamespaceSpec
}

let proxy = (_ : Scope, base : string, requestor : Result | null) : any =>
        new Proxy(overlay(_, base), { 
            get : (target, name) => get(_, combinePath(base, name), requestor) 
        }),
    get = (_ : Scope, path : string, requestor : Result | null) => {
        let node = resolve(_, path, _.cache[path]);
        if (requestor && node) requestor.addDependency(node);
        return node ? node.value : proxy(_, path, requestor);
    },
    resolve = (_ : Scope, path : string, node : Generator | Result | Multi | null | undefined) =>
        node instanceof Generator                   ? resolveGenerator(_, path, node) :
        node instanceof Result && node.invalid(_)   ? resolveGenerator(_, path, node.gen) :
        node instanceof Multi  && node.invalid(_)   ? resolveMulti(_, path) :
        node === undefined ? (isMultiPath(path)     ? resolveMulti(_, path)
                                                    : errorMissingRule(path)) :
        node,
    resolveGenerator = (_ : Scope, path : string, gen : Generator) => {
        let result = new Result(null, gen.scope, gen);
        result.value = gen.fn(proxy(_, '', result));
        result.scope.cache[path] = result;
        return result;
    },
    resolveMulti = (_ : Scope, path : string) => {
        let target = path.substr(0, path.length - 2),
            result = new Multi([], _, target);
        do if (hasOwnProp(_.cache, target)) {
            result.value.push(get(_, target, null));
        } while (_ = _.parent!);
        result.scope.cache[path] = result;
        return result;
    },
    overlay = (p : Scope, path : string) => (generators : NamespaceSpec) => {
        let _ = new Scope(p.depth + 1, Object.create(p.cache), p);
        cacheGenerators(_, path, generators);
        return proxy(_, path, null);
    },
    cacheGenerators = (_ : Scope, path : string, obj : any) => {
        if (isPlainObject(obj)) { 
            if (_.cache[path]) errorShadowValue(path);
            else _.cache[path] = null; 
            for (let n in obj) cacheGenerators(_, combinePath(path, n), obj[n]);
        } else if (_.cache[path] === null) errorShadowNamespace(path)
        else if (obj instanceof Function) _.cache[path] = new Generator(obj, _, path);
        else errorBadProd(path, obj);
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
let errorMissingRule = (path : string) => { throw new Error("missing dependency: " + path); },
    errorBadProd = (path : string, prod : any) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + path + ' = ' + prod); },
    errorShadowValue = (path : string) => { throw new Error("cannot shadow a value with a namespace: " + path); },
    errorShadowNamespace = (path : string) => { throw new Error("cannot shadow a namespace with a value: " + path); };

export default proxy(new Scope(0, Object.create(null), null), '', null);
