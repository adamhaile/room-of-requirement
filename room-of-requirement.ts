var Screwball = (...namespaces : NS[]) => injector(init(namespaces), {}),
    resolve = (prod : Function, ns : NS) => {
        var deps = {} as any,
            value = prod(injector(ns, deps));
        return new Result(prod, value, deps);
    },
    injector = (ns : NS, deps : any) : any =>
        new Proxy(givens(ns), { get : function get(_, name) {
            var node = ns[name];
            return (
                node instanceof Result ?
                    (deps[name] = node).value :
                node instanceof NS ?
                    injector(NS.sub(ns, name), deps[name] = deps[name] || {}) :
                node instanceof Function ? 
                    (deps[name] = ns[name] = resolve(node, ns)).value :
                node === undefined ? errorMissingRule(name) :
                errorBadProd(node)
            );
        } }),
    givens = (ns : NS) => (givens : any) => injector(NS.extend(NS.overlay(ns), givens, v => new Result(null!, v, null)), {}),
    init = (nses : NS[]) => nses.reduce((ns, o) => NS.extend(ns, o, v => v instanceof Function ? v : errorBadProd(v)), new NS());

interface NS { [name : string] : NS | any }
class NS {
    static overlay = (ns : NS) => Object.create(ns);
    static sub = (ns : NS, name : string | number | symbol) : NS => 
        name in ns && !isNS(ns[name]) ? errorShadowValue(name) :
        isOwnProp(ns, name) ? ns[name] : 
        ns[name] = (isNS(getProto(ns)) ? NS.overlay(NS.sub(getProto(ns), name)) : new NS());
    static extend = (ns : NS, obj : any, fn? : (val : any, cur? : any, name? : string) => any) => {
        for (let name of Object.keys(obj)) {
            let val = obj[name];
            if (isPlainObj(val)) NS.extend(NS.sub(ns, name), val);
            else if (isNS(ns[name])) errorShadowNamespace(name)
            else ns[name] = fn ? fn(val, ns[name], name) : val;
        }
        return ns;
    }
}
Object.setPrototypeOf(NS.prototype, null);

class Result {
    constructor(
        public prod : Function,
        public value : any,
        public deps : any
    ) {}
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

export default Screwball;
