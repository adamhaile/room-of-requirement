# room-of-requirement.js
An experimental minimalist dependency injector for Javascript ES6+.

- Dependency rules are defined using plain functions with ES6 destructuring syntax
- Returns an ES6 Proxy that exposes dependency targets as simple properties
- Proxy instantiates and caches dependencies on request (i.e. lazily)
- Proxy accepts user-supplied "givens" that fill in missing targets and/or override existing ones
- Invalidates cached dependencies affected by a given
- Targets can be nested into heirarchical namespaces

Still in proof-of-concept stage.

## Usage
```javascript
import RoomOfRequirement from 'room-of-requirement';

// define dependencies using ES6 destructuring syntax, ({...}) => ...
const deps = RoomOfRequirement({
    config: () => new Config(),
    db:     ({config}) => new Db(config),
    app:    ({db, config}) => new App(db, config),
    view:   ({app}) => new View(app) // ... or however you construct your apps
});

document.body.append(deps.view); // request dependencies as properties

// target namespace can be heirarchical
const deps = RoomOfRequirement({
    ...
    controllers: {
        account: ({user}) => new AccountController(user),
        tasks:   ({user, db}) => new TasksController(user, db),
        ... etc ...
    }
});

deps.controllers.account.Run();

// "givens" -- supply some values to be used in resolution
const deps = RoomOfRequirement({
    ...
    userService: ({db}) = new UserService(db),
    user:        ({userId, userService}) => userService.getUser(userId) // note: no rule for userId
});

deps({ userId: 1 }).user // supply missing targets, like userId to get user
deps({ user: new User("joe") }).user // or override existing targets entirely
```

## Possible Future Features

Clean async injection using a double-arrow syntactic sugar:

```javascript
// pass in a Promise object to make all bindings Promises, 
// and use double arrow (=>()=>) syntax to cleanly chain them
const deps = RoomOfRequirement(Promise, {
    config: () =>()=> new Config(),
    db:     ({config}) =>()=> new Db(config),
    app:    ({db, config}) =>()=> new App(db, config),
    view:   ({app}) =>()=> new View(app) 
});

// almost same code now resolves asynchronously
deps.view.then(view => document.body.append(view));
```

Copyright Adam Haile, 2016, MIT License