# room-of-requirement.js
An minimalist-but-powerful dependency injector for Javascript ES6+.

Compiles dependency rules into an ES6 Proxy that exposes targets as simple properties.

All major desktop browsers except IE11 now support ES6 Proxies.  Node requires version 6+.  Mobile browsers don't yet.

Requires at least typesceript 2.0.0 beta to compile .ts source.

## Usage
```javascript
import RoomOfRequirement from 'room-of-requirement';

// define dependencies as a namespace of generator functions 
// ES6 destructuring makes syntax clean -- target: ({...deps...}) => ...impl...

const deps = RoomOfRequirement({
    config: () => new Config(),
    db:     ({config}) => new Db(config),
    app:    ({db, config}) => new App(db, config),
    view:   ({app}) => new View(app)
});

// request dependencies as properties

document.body.append(deps.view); 

// once evaluated, dependencies are cached and re-used

deps.view === deps.view;

// namespace can be heirarchical

const deps = RoomOfRequirement({
    ...
    controllers: {
        account: ({user}) => new AccountController(user),
        tasks:   ({user, db}) => new TasksController(user, db),
        ... etc ...
    }
});

deps.controllers.account.Run();

// namespaces can have overlays ("modules") passed in as an array

const deps = RoomOfRequirement([
    {
        ...
        view: ({app}) => new View(app)
    }, 
    {
        view: ({app}) => new AlternateView(app);
    }
]);

// in which case last definition wins

deps.view instanceof AlternateView;

// but we can request all bindings of a target as an array -- 'target[]'

deps['view[]'].length === 2;

// "givens" -- supply some values to be used in resolution

const deps = RoomOfRequirement({
    ...
    userService: ({db}) = new UserService(db),
    user:        ({userId, userService}) => userService.getUser(userId) // note: no rule for userId
});

deps({ userId: 1 }).user // supply missing depedencies, like userId to get user
deps({ user: new User("joe") }).user // or override existing dependencies entirely

// dependencies downstreawm of a given are re-evaluated

deps({ userId: 1 }).user !== deps({userId: 2 }).user;

// but unaffected dependencies stay cached

deps.userService === deps({ userId: 1 }).userService

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