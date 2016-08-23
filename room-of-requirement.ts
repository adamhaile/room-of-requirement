interface Dependencies {
    [name : string] : any;
}

interface Production<T> {
    (deps : Dependencies) : T;
}

interface Namespace {
    [name : string] : Production<any> | Namespace
}

interface Entrypoint {
    <T>(prod : Production<T>) : T
}

var RoomOfRequirement = (...namespaces : Namespace[]) => entrypoint(hh.chain(namespaces)),
    entrypoint = (namespace : Namespace) : Entrypoint => <T>(prod : Production<T>) => resolve(prod, namespace, hh.root()),
    resolve = (prod : Production<any>, namespace : Namespace, cache : Dependencies) => {
        var deps = {} as Dependencies,
            result = prod(injector(namespace, cache, deps));
        return result;
    },
    injector = (namespace : Namespace, cache : Dependencies, deps : Dependencies) : any =>
        new Proxy({}, { get : (_, name) => {
            var prod = namespace[name];
            return !prod ? missing(name) :
                prod instanceof Function ? 
                    (deps[name] = true, cache[name] = (name in cache ? cache[name] : resolve(prod, namespace, cache))) :
                injector(prod, hh.sub(cache, name), deps[name] = deps[name] || {});
        } }),
    missing : any = (name : string) => { throw new Error("missing dependency: " + name); },
    hh = {
        chain: (namespaces : Namespace[]) => {
            for (var i = 0; i < namespaces.length; i++)
                namespaces[i]['__proto__'] = i ? namespaces[i - 1] : hh.root();
            return namespaces[i - 1];
        },
        root: () => Object.create(null),
        depth: (h : any, name : string | number | symbol) => {
            for (var i = 0; h && !Object.prototype.hasOwnProperty.call(h, name); i++, h = h.__proto__) {}
            return h ? -1 : i;
        },
        set: (h: any, depth : number, key : string | number | symbol, value : any) => {
            while (depth--) h = h.__proto__;
            h[key] = value;
        },
        sub: (h : any, name : string | number | symbol) => {
            var top = h[name] = h[name] || hh.root(),
                sub = top;
            while (h = h.__proto__) {
                h[name] = sub = sub.__proto__ = h[name] || hh.root();
            }
            return top;
        }
    };

export default RoomOfRequirement;
