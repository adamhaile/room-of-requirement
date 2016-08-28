interface Scope { // current state of dependencies, "sees through" to lower scopes via its prototype
    [path : string] : Generator | Result | null // Generator = uninstantiated, Result = instantiated, null = nested namespace
}
class Scope {
    static create = () => Object.create(null) as Scope;
    static overlay = (_ : Scope) => Object.create(_);
    static getLower = (_ : Scope, depth : number) => { 
        while (depth--) _ = getProto(_); 
        return _; 
    };
    static extend = (_ : Scope, depth : number, path : string, obj : any) => {
        if (isPlainObject(obj)) { 
            if (_[path]) errorShadowValue(path);
            else _[path] = null; 
            for (let n in obj) Scope.extend(_, depth, combinePath(path, n), obj[n]);
        } else if (_[path] === null) errorShadowNamespace(path)
        else if (obj instanceof Function) _[path] = new Generator(obj, depth);
        else errorBadProd(path, obj);
    };
}

type GeneratorFunc = (deps? : any) => any;
class Generator {
    constructor(
        public fn : GeneratorFunc,         // function to generate dependency
        public depth : number              // depth in overlayed state
    ) { }
}

class Result {
    constructor(
        public gen : Generator | undefined, // generator for this result, or undefined for givens and multis
        public value : any,                 // value of the result, polymorphic
        public path : string,               // path of result
        public depth : number               // depth in overlayed state, = max depth of dependencies
    ) { }
    deps = [] as Result[];                  // dependencies of this result, for determining validity
    addDependency(dep : Result) {
        if (dep.depth > this.depth) this.depth = dep.depth;
        this.deps.push(dep);
    }
    invalidForScope(_ : Scope) : boolean {
        return _[this.path] !== this || this.deps.some(d => d.invalidForScope(_));
    }
}

interface NamespaceSpec {
    [name : string] :  GeneratorFunc | NamespaceSpec
}

let injector = (_ : Scope, depth : number, base : string, requestor : Result | null) : any =>
        new Proxy(overlay(_, depth, base), { 
            get : (target, name) => get(_, depth, combinePath(base, name), requestor) 
        }),
    get = (_ : Scope, depth : number, path : string, requestor : Result | null) => {
        let node = _[path];
        if (node instanceof Result && node.invalidForScope(_)) node = node.gen!; // why !?
        return node instanceof Result    ? (requestor && requestor.addDependency(node), 
                                            node.value) :
               node === null             ? injector(_, depth, path, requestor) :
               node instanceof Generator ? (node = resolve(_, depth, path, node),
                                            requestor && requestor.addDependency(node),
                                            node.value) :
               node === undefined        ? 
                   (isMultiPath(path)    ? (node = resolveMulti(_, depth, path),
                                            requestor && requestor.addDependency(node),
                                            node.value) 
                                         : errorMissingRule(path)) :
               errorBadProd(path, node);
    },
    resolve = (_ : Scope, depth : number, path : string, gen : Generator) => {
        let result = new Result(gen, null, path, gen.depth);
        result.value = gen.fn(injector(_, depth, '', result));
        Scope.getLower(_, depth - result.depth)[path] = result;
        return result;
    },
    resolveMulti = (_ : Scope, depth : number, path : string) => {
        let target = path.substr(0, path.length - 2),
            values = [] as any[],
            result = new Result(void 0, values, path, 0);
        for (; depth >= 0; _ = getProto(_), depth--) if (hasOwnProp(_, target)) {
            values.push(get(_, depth, target, values.length ? null : result));
            if (values.length === 1) _[path] = result;
        }
        return result;
    },
    overlay = (p_ : Scope, pdepth : number, path : string) => (givens : NamespaceSpec) => {
        let _ = Scope.overlay(p_), 
            depth = pdepth + 1;
        Scope.extend(_, depth, path, givens);
        return injector(_, depth, path, null);
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

export default injector(Scope.create(), 0, '', null);
