var RoomOfRequirement = (...specs : any[]) => injector(initState(specs), '', 0, null),
    injector = (_ : State, base : string, depth : number, result : Result | null) : any =>
        new Proxy(handleGivens(_, base, depth), { get : function get(t, name) {
            var path = combinePath(base, name),
                node = _[path];
            if (node instanceof Result && isInvalid(_, node)) node = node.prod;
            return node instanceof Result   ? (addDependency(result, node), node.value) :
                   node === null            ? injector(_, path, depth, result) :
                   node instanceof Function ? (node = resolve(_, path, depth, node),
                                               addDependency(result, node),
                                               node.value) :
                   node === undefined       ? errorMissingRule(path) :
                   errorBadProd(path, node);
        } }),
    resolve = (_ : State, path : string, depth : number, prod : Function) => {
        var result = new Result(prod, null, path, 0);
        result.value = prod(injector(_, '', depth, result));
        getLowerState(_, depth - result.depth)[path] = result;
        return result;
    },
    initState = (specs : any[]) => {
        var _ = Object.create(null);
        for (var spec of specs) 
            extendState(_, '', spec, (p, v, o) => v instanceof Function ? v : errorBadProd(p, v));
        return _;
    },
    handleGivens = (_ : State, path : string, depth : number) => (givens : any) => {
        _ = overlayState(_), depth++;
        extendState(_, path, givens, (p, v, o) => new Result(null!, v, p, depth));
        return injector(_, path, depth, null);
    },
    addDependency = (a : Result | null, b : Result) =>
        a && (a.depth = Math.max(a.depth, b.depth), a.deps.push(b)),
    isInvalid = (_ : State, r : Result) : boolean =>
        _[r.path] !== r || r.deps.some(d => isInvalid(_, d)),
    combinePath = (b : string, n : string | number | symbol) => 
        (b ? b + '.' : '') + n.toString().replace('\\', '\\\\').replace('.', '\\.'),
    overlayState = (_ : State) => Object.create(_),
    getLowerState = (_ : State, depth : number) => { while (depth--) _ = getProto(_); return _; },
    extendState = (_ : State, path : string, obj : any, fn : (path : string, val : any, cur : any) => any) => {
        if (isNamespace(obj)) { 
            if (_[path]) errorShadowValue(path);
            else _[path] = null; 
            for (var n in obj) extendState(_, combinePath(path, n), obj[n], fn);
        } else if (_[path] === null) errorShadowNamespace(path)
        else _[path] = fn(path, obj, _[path]);
    },
    isNamespace = (o : any) => o instanceof Object && getProto(o) === Object.prototype,
    getProto = (o : any) => Object.getPrototypeOf(o);

interface State { [path : string] : Function | Result | null }

class Result {
    constructor(
        public prod : Function,
        public value : any,
        public path : string,
        public depth : number
    ) { }
    deps = [] as Result[];
}

// errors
var errorMissingRule = (name : string) => { throw new Error("missing dependency: " + name); },
    errorBadProd = (name : string, prod : any) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + name + ' = ' + prod); },
    errorShadowValue = (name : string) => { throw new Error("cannot shadow a value with a namespace: " + name); },
    errorShadowNamespace = (name : string) => { throw new Error("cannot shadow a namespace with a value: " + name); };

export default RoomOfRequirement;
