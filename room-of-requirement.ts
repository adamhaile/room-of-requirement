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
                    deps[name] = cache[name] = (name in cache ? cache[name] : resolve(prod, namespace, cache)) :
                injector(prod, cache[name] = cache[name] || {}, deps[name] = deps[name] || {});
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
