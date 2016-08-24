interface Dependencies {
    [name : string] : any | Dependencies;
}

interface Production<T> {
    (deps : Dependencies) : T;
}

var RoomOfRequirement = (...namespaces : NS[]) => injector(init(namespaces), new NS(), {}),
    resolve = (prod : Production<any>, ns : NS, cache : NS) => {
        var deps = {} as Dependencies,
            result = prod(injector(ns, cache, deps));
        return result;
    },
    injector = (ns : NS, cache : NS, deps : Dependencies) : any =>
        new Proxy(givens(ns, cache), { get : (_, name) => {
            var prod = ns[name];
            return (
                name in cache && !(cache[name] instanceof NS) ? 
                    (deps[name] = true, cache[name]) :
                prod instanceof NS ?
                    injector(prod, NS.sub(cache, name.toString()), deps[name] = deps[name] || {}) :
                prod instanceof Function ? 
                    (deps[name] = true, cache[name] = resolve(prod, ns, cache)) :
                prod === null ? errorMissingGiven(name) :
                !prod ? errorMissingRule(name) :
                errorBadProd(prod)
            );
        } }),
    givens = (ns : NS, cache : NS) => (givens : any) => injector(ns, applyGivens(ns, NS.overlay(cache), givens), {}),
    applyGivens = (ns : NS, cache : NS, givens : any) => {
        if (!ns) errorNoSuchGiven(name);
        for (let name of Object.keys(givens)) {
            let val = givens[name];
            if (isPlainObj(val)) applyGivens(ns[name], NS.sub(cache, name), val);
            else if (ns[name] === null) cache[name] = val;
            else errorNotGivenSite(name);
        }
        return ns;
    },
    init = (nss : NS[]) => nss.reduce((ns, o) => NS.extend(ns, o), new NS());

interface NS { [name : string] : NS | any }
class NS {
    static overlay = (ns : NS) => Object.create(ns);
    static sub = (ns : NS, name : string) => 
        name in ns ? (!isNS(ns[name]) ? errorShadowValue(name) :
                      isOwnProp(ns, name) ? ns[name] : 
                      ns[name] = Object.create(ns[name])) :
        ns[name] = new NS();
    static extend = (ns : NS, obj : any) => {
        for (let name of Object.keys(obj)) {
            let val = obj[name];
            if (isPlainObj(val)) NS.extend(NS.sub(ns, name), val);
            else ns[name] = val;
        }
        return ns;
    }
}
Object.setPrototypeOf(NS.prototype, null);

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
