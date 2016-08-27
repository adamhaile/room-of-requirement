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
    static extend = (_ : Scope, path : string, obj : any, fn : (path : string, val : any, cur : any) => any) => {
        if (isPlainObject(obj)) { 
            if (_[path]) errorShadowValue(path);
            else _[path] = null; 
            for (var n in obj) Scope.extend(_, combinePath(path, n), obj[n], fn);
        } else if (_[path] === null) errorShadowNamespace(path)
        else _[path] = fn(path, obj, _[path]);
    };
}

class Generator {
    constructor(
        public fn : Function,              // function to generate dependency
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
    invalidForState(_ : Scope) : boolean {
        return _[this.path] !== this || this.deps.some(d => d.invalidForState(_));
    }
}

let RoomOfRequirement = (...specs : any[]) => 
        injector(initState(specs), specs.length - 1, '', null),
    injector = (_ : Scope, depth : number, base : string, result : Result | null) : any =>
        new Proxy(handleGivens(_, depth, base), { 
            get : (target, name) => get(_, depth, combinePath(base, name), result) 
        }),
    get = (_ : Scope, depth : number, path : string, result : Result | null) => {
        var node = _[path];
        if (node instanceof Result && node.invalidForState(_)) node = node.gen!; // why !?
        return node instanceof Result    ? (result && result.addDependency(node), 
                                            node.value) :
               node === null             ? injector(_, depth, path, result) :
               node instanceof Generator ? (node = resolve(_, depth, path, node),
                                            result && result.addDependency(node),
                                            node.value) :
               node === undefined        ? 
                   (isMultiPath(path)    ? (node = resolveMulti(_, depth, path),
                                            result && result.addDependency(node),
                                            node.value) 
                                         : errorMissingRule(path)) :
               errorBadProd(path, node);
    },
    resolve = (_ : Scope, depth : number, path : string, gen : Generator) => {
        var result = new Result(gen, null, path, gen.depth);
        result.value = gen.fn(injector(_, depth, '', result));
        Scope.getLower(_, depth - result.depth)[path] = result;
        return result;
    },
    resolveMulti = (_ : Scope, depth : number, path : string) => {
        var target = path.substr(0, path.length - 2),
            values = [] as any[],
            result = new Result(void 0, values, path, 0);
        for (; depth >= 0; _ = getProto(_), depth--) if (hasOwnProp(_, target)) {
            values.push(get(_, depth, target, values.length ? null : result));
            if (values.length === 1) _[path] = result;
        }
        return result;
    },
    initState = (specs : any[]) => {
        for (var i = 0, _ = Scope.create(); i < specs.length; i++, _ = Scope.overlay(_)) {
            Scope.extend(_, '', specs[i],
                (p, v, o) => v instanceof Function ? new Generator(v, i) : errorBadProd(p, v));
        }
        return getProto(_);
    },
    handleGivens = (_ : Scope, depth : number, path : string) => (givens : any) => {
        _ = Scope.overlay(_), depth++;
        Scope.extend(_, path, givens, (p, v, o) => new Result(void 0, v, p, depth));
        return injector(_, depth, path, null);
    };

// paths
var combinePath = (base : string, name : string | number | symbol) => 
        (base ? base + '.' : '') + name.toString().replace('\\', '\\\\').replace('.', '\\.'),
    isMultiPath = (path : string) => path.substr(path.length - 2) === '[]';

// utils    
var isPlainObject = (o : any) => o instanceof Object && getProto(o) === Object.prototype,
    getProto = (o : any) => Object.getPrototypeOf(o),
    hasOwnProp = (o : any, name : string) => Object.prototype.hasOwnProperty.call(o, name);

// errors
var errorMissingRule = (path : string) => { throw new Error("missing dependency: " + path); },
    errorBadProd = (path : string, prod : any) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + path + ' = ' + prod); },
    errorShadowValue = (path : string) => { throw new Error("cannot shadow a value with a namespace: " + path); },
    errorShadowNamespace = (path : string) => { throw new Error("cannot shadow a namespace with a value: " + path); };

export default RoomOfRequirement;
