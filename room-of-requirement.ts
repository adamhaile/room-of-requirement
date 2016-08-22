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

var RoomOfRequirement = (...namespaces : Namespace[]) => entrypoint(flatten(namespaces)),
    entrypoint = (namespace : Namespace) : Entrypoint => <T>(prod : Production<T>) => resolve(prod, namespace, {} as Dependencies),
    resolve = (prod : Production<any>, namespace : Namespace, cache : Dependencies) =>
        prod(injector(namespace, cache, {})),
    injector = (namespace : Namespace, cache : Dependencies, deps : Dependencies) : any =>
        new Proxy({}, { get : (_, name) => {
            var prod = namespace[name];
            return !prod                 ? missing(name) :
                prod instanceof Function ? 
                    name in cache  ? cache[name] :  
                    cache[name] = resolve(prod, namespace, cache) :
                injector(prod, cache[name] = cache[name] || {}, deps[name] = deps[name] || {}); // TODO recursive injections
        } }),
    flatten = (namespaces : Namespace[]) => {
        let ns = {} as Namespace;
        for (let _ns of namespaces)
            for (let name in _ns)
                ns[name] = _ns[name];
        return ns;
    },
    missing : any = (name : string) => { throw new Error("missing dependency: " + name); };

export default RoomOfRequirement;
