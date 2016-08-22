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
    entrypoint = (namespace : Namespace) : Entrypoint => <T>(prod : Production<T>) => resolver(namespace, {} as Dependencies)(prod),
    resolver = (namespace : Namespace, resolutions : Dependencies) => {
            var lookup = (name : string) : any => {
                    var prod = namespace[name];
                    return !prod                 ? missing(name) :
                        prod instanceof Function ? 
                            name in resolutions  ? resolutions[name] :  
                            resolutions[name] = resolve(prod) :
                    null; // TODO recursive injections
                },
                resolve = <T>(prod : Production<T>) => {
                    var dependencies = {} as Dependencies,
                        injector = new Proxy({}, { get : (_, name) => 
                            dependencies[name] = lookup(<string>name) }
                        ),
                        result = prod(injector);
                    return result;
                };
            return resolve;
        },
    multi = (obj : Dependencies, resolver : (prod: Production<any>) => any) => {
            for (var name in obj) resolver(obj[name]);
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
