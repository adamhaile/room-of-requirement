var RoomOfRequirement = (...namespaces : any[]) => injector(init(namespaces), 0, {}, null),
    resolve = (prod : Function, ns : NS, depth : number, inv : Invalids) => {
        var result = new Result(prod, null, 0);
        result.value = prod(injector(ns, depth, inv, result));
        return result;
    },
    injector = (ns : NS, depth : number, inv : Invalids, result : Result | null) : any =>
        new Proxy(givens(ns, depth, inv), { get : function get(_, name) {
            var node = ns[name];
            if (node instanceof Result && inv[node.id]) node = node.prod;
            return (
                node instanceof Result ?
                    (result && result.dep(node), 
                     node.value) :
                node instanceof NS ?
                    injector(NS.sub(ns, name), depth, inv, result) :
                node instanceof Function ? 
                    (node = resolve(node, ns, depth, inv),
                     NS.descend(ns, depth - node.depth)[name] = node,
                     result && result.dep(node),
                     node.value) :
                node === undefined ? errorMissingRule(name) :
                errorBadProd(node)
            );
        } }),
    givens = (ns : NS, depth : number, inv : Invalids) => (givens : any) => {
        ns = NS.overlay(ns), depth++, inv = Object.create(inv);
        NS.extend(ns, givens, (v, o) => (invalidate(inv, o), new Result(null!, v, depth)));
        return injector(ns, depth, inv, null);
    },
    invalidate = (inv : Invalids, o : any) => {
        if (o instanceof Result && !inv[o.id]) {
            inv[o.id] = true;
            for (let d of o.dependees) invalidate(inv, d);
        }
    },
    init = (nses : NS[]) => 
        nses.reduce((ns, o) => 
            NS.extend(ns, o, v => v instanceof Function ? v : errorBadProd(v)), 
            new NS());

interface NS { [name : string] : NS | Function | Result }
class NS {
    static overlay = (ns : NS) => Object.create(ns);
    static sub = (ns : NS, name : string | number | symbol) : NS => 
        name in ns && !isNS(ns[name]) ? errorShadowValue(name) :
        isOwnProp(ns, name) ? ns[name] : 
        ns[name] = (isNS(getProto(ns)) ? NS.overlay(NS.sub(getProto(ns), name)) : new NS());
    static descend = (ns : NS, depth : number) : NS => depth > 0 ? NS.descend(getProto(ns), depth - 1) : ns;
    static extend = (ns : NS, obj : any, fn? : (val : any, cur? : any) => any) => {
        for (let name of Object.keys(obj)) {
            let val = obj[name];
            if (isPlainObj(val)) NS.extend(NS.sub(ns, name), val);
            else if (isNS(ns[name])) errorShadowNamespace(name)
            else ns[name] = fn ? fn(val, ns[name]) : val;
        }
        return ns;
    }
}
Object.setPrototypeOf(NS.prototype, null);

interface Invalids {
    [id : number] : boolean
}

class Result {
    static count = 0;
    constructor(
        public prod : Function,
        public value : any,
        public depth : number,
        public id = Result.count++
    ) { }
    dependees = [] as Result[];
    dep(other : Result) {
        if (other.depth < this.depth) this.depth = other.depth;
        other.dependees.push(this);
    }
}

// utils
var isNS = (o : any) => o instanceof NS,
    isPlainObj = (o : any) => o instanceof Object && getProto(o) === Object.prototype,
    isOwnProp = (o : any, name : string | number | symbol) => Object.prototype.hasOwnProperty.call(o, name),
    getProto = (o : any) => Object.getPrototypeOf(o);

// errors
var errorMissingRule : any = (name : string) => { throw new Error("missing dependency: " + name); },
    errorBadProd : any = (prod : any) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + prod); },
    errorShadowValue : any = (name : string) => { throw new Error("cannot shadow a value with a namespace: " + name); },
    errorShadowNamespace : any = (name : string) => { throw new Error("cannot shadow a namespace with a value: " + name); };

export default RoomOfRequirement;
