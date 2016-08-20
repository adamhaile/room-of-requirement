interface Dependencies {
    [name : string] : any;
}

interface Production<T> {
    (deps : Dependencies) : T;
}

interface Namespace {
    [name : string] : Production<any>
}

interface Entrypoint {
    <T>(prod : Production<T>) : T
}

var RoomOfRequirement = (...namespaces : Namespace[]) => entrypoint(flatten(namespaces)),
    entrypoint = (namespace : Namespace) : Entrypoint => <T>(prod : Production<T>) => resolver(namespace)(prod),
    resolver = (namespace : Namespace) => {
            var resolutions = {} as Dependencies,
                lookup = (name : string) : any => resolutions[name] 
                    || (resolutions[name] = resolver(namespace[name] || missing(name))),
                injector = new Proxy({}, { get : (_, name) => lookup(<string>name) }),
                resolver = <T>(prod : Production<T>) => prod(injector);
            return resolver;
        },
    flatten = (namespaces : Namespace[]) => {
        let ns = {} as Namespace;
        for (let _ns of namespaces)
            for (let name in _ns)
                ns[name] = _ns[name];
        return ns;
    },
    missing : any = (name : string) => { throw new Error("missing dependency: " + name); };

export default RoomOfRequirement;
