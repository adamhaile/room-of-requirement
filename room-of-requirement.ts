interface Dependencies {
    [name : string] : any | Dependencies;
}

interface Production<T> {
    (deps : Dependencies) : T;
}

interface Entrypoint {
    <T>(prod : Production<T>) : T
}

var RoomOfRequirement = (...namespaces : NS[]) => entrypoint(init(namespaces)),
    entrypoint = (ns : NS) : Entrypoint => <T>(prod : Production<T>) => resolve(prod, ns, new NS()),
    resolve = (prod : Production<any>, ns : NS, cache : NS) => {
        var deps = {} as Dependencies,
            result = prod(injector(ns, cache, deps));
        return result;
    },
    injector = (ns : NS, cache : NS, deps : Dependencies) : any =>
        new Proxy({}, { get : (_, name) => {
            var prod = ns[name];
            return (
                prod instanceof NS ?
                    injector(prod, NS.sub(cache, name.toString()), deps[name] = deps[name] || {}) :
                prod instanceof Function ? 
                    (deps[name] = true, cache[name] = (name in cache ? cache[name] : resolve(prod, ns, cache))) :
                !prod ? errorMissingRule(name) :
                errorBadProd(prod)
            );
        } }),
    init = (nss : NS[]) => nss.reduce((ns, o) => NS.extend(ns, o), new NS());

interface NS { [name : string] : NS | any }
class NS {
    static overlay = (ns : NS) => Object.create(ns);
    static sub = (ns : NS, name : string) => 
        name in ns && !isNS(ns[name]) ? errorShadowValue(name) :
        isOwnProp(ns, name) ? ns[name] : 
        ns[name] = ns[name] ? NS.overlay(ns[name]) : new NS();
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
    isPlainObj = (o : any) => o.__proto__ === Object.prototype,
    isOwnProp = (o : any, name : string | number | symbol) => Object.prototype.hasOwnProperty.call(o, name),
    getProto = (o : any) => Object.getPrototypeOf(o);

// errors
var errorMissingRule : any = (name : string) => { throw new Error("missing dependency: " + name); },
    errorBadProd : any = (prod : any) => { throw new Error("bad namespace spec: must consist of only plain objects or generator functions: " + prod); },
    errorShadowValue : any = (name : string) => { throw new Error("cannot shadow an earlier value with a nested namespace"); };

export default RoomOfRequirement;
