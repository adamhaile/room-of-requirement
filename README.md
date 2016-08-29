# room-of-requirement.js
An minimalist-but-powerful dependency injector for Javascript ES6+.

Compiles dependency rules into an ES6 Proxy that exposes targets as simple properties.

All major desktop browsers except IE11 now support ES6 Proxies.  Node requires version 6+.  Mobile browsers don't yet.

Requires at least typescript 2.0.0 beta to compile .ts source.

## Usage
```javascript
import RoomOfRequirement from 'room-of-requirement';

// define dependencies as a namespace of generator functions 
// ES6 destructuring makes syntax clean -- target: ({...deps...}) => ...impl...

let deps = RoomOfRequirement({
    config: () => new Config(),
    db:     ({config}) => new Db(config),
    app:    ({db, config}) => new App(db, config),
    view:   ({app}) => new View(app)
});

// request dependencies as properties

document.body.append(deps.view); 

// once evaluated, dependencies are cached and re-used

deps.view === deps.view;

// missing dependencies throw an error (i.e., they don't just return undefined)

deps.router; // THROWS missing dependency: router

// extend dependencies by passing in new rules
// this makes a new Proxy that has all the old rules plus the new

let extDeps = deps({
    router: ({app}) => new Router(app);
});

extDeps.router instanceof Router;
extDeps.config instanceof Config;

// you can even replace ("overlay") existing rules

var altDeps = deps({
    config: () => new AlternateConfig(app)
});

deps.config instanceof Config;
altDeps.config instanceof AlternateConfig;

// any dependencies downstream of the replaced ones are re-evaluated

deps.app !== altDeps.app;

// add '[]' to a target name to get an array of all definitions, even overlayed ones

let configs = altDeps['config[]'];
configs.length === 2;
configs[0] instanceof AlternateConfig;
configs[1] instanceof View;

// rules can reference missing targets

deps = deps({
    user: ({userId}) => new User(userId) // NOTE: no rule yet for userId
});

deps.user; // THROWS missing dependency: userId

// which can be supplied later

deps = deps({
    userId: () => 2
});

deps.user.id === 2;

// finally, the target namespace is heirarchical

deps = deps({
    controllers: {
        account: ({user}) => new AccountController(user),
        tasks:   ({user, db}) => new TasksController(user, db)
    }
});

deps.controllers.account.Run();

```

## Possible Future Ideas

Some way to apply a monad to dependencies, to enable things like clean Promise-based async resolutions.

```javascript
// pass in Promise monadic functions to make all dependencies Promises.
// Use double arrow (=>()=>) syntax to separate dependency detection from evaluation.
// join depedencies' Promises before evaluating target.
const deps = RoomOfRequirement(Promise.resolve, Promise.all, { // aka lift, flatMap
    config: () =>()=> new Config(),
    db:     ({config}) =>()=> new Db(config),
    app:    ({db, config}) =>()=> new App(db, config),
    view:   ({app}) =>()=> new View(app) 
});

// almost same code now resolves asynchronously
deps.view.then(view => document.body.append(view));
```

Copyright Adam Haile, 2016, MIT License