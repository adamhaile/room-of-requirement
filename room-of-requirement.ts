var RoomOfRequirement = (...specs : any[]) => injector(initState(specs), '', 0, null),
    injector = (_ : State, base : string, depth : number, result : Result | null) : any =>
        new Proxy(givens(_, base, depth), { get : function get(t, name) {
            var path = combine(base, name),
                node = _[path];
            if (node instanceof Result && invalid(_, node)) node = node.prod;
            return (
                node instanceof Result ?
                    (result && result.dep(node), 
                     node.value) :
                node === null ?
                    injector(_, path, depth, result) :
                node instanceof Function ? 
                    (node = resolve(_, path, depth, node),
                     descend(_, depth - node.depth)[path] = node,
                     result && result.dep(node),
                     node.value) :
                node === undefined ? errorMissingRule(path) :
                errorBadProd(node)
            );
        } }),
    resolve = (_ : State, path : string, depth : number, prod : Function) => {
        var result = new Result(prod, null, path, 0);
        result.value = prod(injector(_, '', depth, result));
        return result;
    },
    initState = (specs : any[]) => {
        var _ = Object.create(null);
        for (var spec of specs) extend(_, '', spec, (p, v, o) => v instanceof Function ? v : errorBadProd(v));
        return _;
    },
    givens = (_ : State, path : string, depth : number) => (givens : any) => {
        _ = Object.create(_), depth++;
        extend(_, path, givens, (p, v, o) => new Result(null!, v, p, depth));
        return injector(_, path, depth, null);
    },
    invalid = (_ : State, r : Result) : boolean =>
        _[r.path] !== r || r.deps.some(d => invalid(_, d)),
    combine = (b : string, n : string | number | symbol) => 
        (b ? b + '.' : '') + n.toString().replace('\\', '\\\\').replace('.', '\\.'),
    descend = (_ : State, depth : number) => { while (depth--) _ = getProto(_); return _; },
    extend = (_ : State, path : string, obj : any, fn : (path : string, val : any, cur : any) => any) => {
        if (isNamespace(obj)) { 
            if (_[path]) errorShadowValue(path);
            else _[path] = null; 
            for (var n in obj) extend(_, combine(path, n), obj[n], fn);
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
    dep(other : Result) {
        if (other.depth < this.depth) this.depth = other.depth;
        this.deps.push(other);
    }
}

// errors
var errorMissingRule : any = (name : string) => { throw new Error("missing dependency: " + name); },
    errorBadProd : any = (prod : any) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + prod); },
    errorShadowValue : any = (name : string) => { throw new Error("cannot shadow a value with a namespace: " + name); },
    errorShadowNamespace : any = (name : string) => { throw new Error("cannot shadow a namespace with a value: " + name); };

export default RoomOfRequirement;
