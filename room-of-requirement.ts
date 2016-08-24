interface Dependencies {
    [name : string] : any | Dependencies;
}

interface Production<T> {
    (deps : Dependencies) : T;
}

interface NamespaceSpec {
    [name : string] : Production<any> | NamespaceSpec
}

interface Entrypoint {
    <T>(prod : Production<T>) : T
}

var RoomOfRequirement = (...namespaces : NamespaceSpec[]) => entrypoint(new NS(namespaces)),
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
    errorMissingRule : any = (name : string) => { throw new Error("missing dependency: " + name); },
    errorBadProd : any = (prod : any) => { throw new Error("bad namespace spec: most consist of only plain objects or generator functions: " + prod); };

interface NS {
    [name : string ] : any
}

interface NSStatic {
    new() : NS;
    new(parent : NS) : NS;
    new(objs : any[]) : NS;
    base : NS;
    sub(ns : NS, name : string) : NS;
    extend(ns : NS, obj : any, mask? : NS) : NS;
}

var NS : NSStatic = <any>function _NS(parent? : NS | any[]) { 
    var name : string, ns : NS, obj : any, subs : { [name : string] : boolean };
    if (!('base' in NS)) return; // first call, to construct NS.base
    else if (!parent) {
        ns = Object.create((<any>NS).base)
    } else if (isNS(parent)) {
        ns = Object.create(parent);
        for (name in parent)
            if (isNS(parent[name])) ns[name] = new NS(parent[name]);
    } else if (Array.isArray(parent)) {
        ns = NS.base;
        subs = {};
        for (obj of parent) if (obj) {
            if (!isPlainObj(obj))
                throw new Error("namespace specifications must be plain object literals ({})");
            for (name in obj)
                if (isPlainObj(obj[name])) subs[name] = true;
            obj.__proto__ = ns, ns = obj;
        }
        for (name in subs)
            new NS(parent.map(ns => ns[name]));
    } else {
        throw new Error("parent must be another namespace or an array of objects");
    }
    return ns;
};

NS.prototype = Object.create(null);
NS.base = new NS();

NS.sub = (ns : NS, name : string | number | symbol) => isOwnProp(ns, name) ? ns[name] : ns[name] = new NS(ns[name]);

NS.extend = (ns : NS, obj : any, mask? : NS) => {
    for (var name in obj) {
        if (mask && mask[name] && !isNS(mask[name])) throw new Error("givens cannot shadow existing rules");
        if (name in ns && !isNS(ns[name])) throw new Error("givens cannot shadow other givens");
        if (name in ns && !isPlainObj(obj[name])) throw new Error("givens cannot shadow nested namespaces");
    }
    return ns;
};

// utils
var isNS = (o : any) => o instanceof NS,
    isPlainObj = (o : any) => o.__proto__ === Object.prototype,
    isOwnProp = (o : any, name : string | number | symbol) => Object.prototype.hasOwnProperty.call(o, name),
    getProto = (o : any) => Object.getPrototypeOf(o);

export default RoomOfRequirement;
