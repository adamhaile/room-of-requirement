var RoomOfRequirement = (...namespaces : NS[]) => injector(init(namespaces), {}),
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
                node === null ? errorMissingGiven(name) :
                !node ? errorMissingRule(name) :
                errorBadProd(node)
            );
        } }),
    givens = (ns : NS) => (givens : any) => injector(NS.extend(NS.overlay(ns), givens, v => new Result(null!, v, null)), {}),
    init = (nss : NS[]) => nss.reduce((ns, o) => NS.extend(ns, o), new NS());

interface NS { [name : string] : NS | any }
class NS {
    static overlay = (ns : NS) => Object.create(ns);
    static sub = (ns : NS, name : string | number | symbol) : NS => 
        name in ns && !isNS(ns[name]) ? errorShadowValue(name) :
        isOwnProp(ns, name) ? ns[name] : 
        ns[name] = (isNS(getProto(ns)) ? NS.overlay(NS.sub(getProto(ns), name)) : new NS());
    static extend = (ns : NS, obj : any, fn? : (v : any) => any) => {
        for (let name of Object.keys(obj)) {
            let val = obj[name];
            if (isPlainObj(val)) NS.extend(NS.sub(ns, name), val);
            else ns[name] = fn ? fn(val) : val;
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
    errorMissingGiven : any = (name : string) => { throw new Error(name + "was defined as a given but has not been supplied yet"); },
    errorBadProd : any = (prod : any) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + prod); },
    errorShadowValue : any = (name : string) => { throw new Error("cannot shadow an earlier value with a nested namespace"); },
    errorNotGivenSite : any = (name : string) => { throw new Error("location " + name + " is not registered as a given (null in namespace)"); },
    errorNoSuchGiven : any = (name : string) => { throw new Error("location " + name + " does not exist in the namespace"); };

export default RoomOfRequirement;
