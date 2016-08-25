# screwball.js
An experimental minimalist dependency injector for Javascript ES6+.

- Functions with ES6 destructuring arguments to define dependency rules
- ES6 Proxies to lazily instantiate requests

Still in proof-of-concept stage.

## Usage
```javascript
import Screwball from 'screwball';

const deps = Screwball({
    config: () => new Config(),
    db:     ({config}) => new Db(config),
    app:    ({db, config}) => new App(db, config),
    view:   ({app}) => new View(app) // .. or however you construct your apps
});

document.body.append(deps.view);

// Nested namespaces

const deps = Screwball({
    ...
    controllers: {
        accountController: ({user}) => new AccountController(user),
        tasksController:   ({user, db}) => new TasksController(user, db),
        ... etc ...
    }
});

deps.controllers.accountController.Run();

// "Givens" -- supply some values to be used in resolution

const deps = Screwball({
    ...
    userService: ({db}) = new UserService(db),
    user:        ({userId, userService}) => userService.getUser(userId) // note: no rule for userId
});

deps({userId: 1}).user // supply userId to get user
```

## Possible Future Features

Clean async injection using a double-arrow syntactic sugar:

```javascript
// pass in a Promise object to make all bindings Promises, 
// and use double arrow (=>()=>) syntax to cleanly chain them
const deps = Screwball(Promise, {
    config: () =>()=> new Config(),
    db:     ({config}) =>()=> new Db(config),
    app:    ({db, config}) =>()=> new App(db, config),
    view:   ({app}) =>()=> new View(app) 
});

// almost same code now resolves asynchronously
deps.view.then(view => document.body.append(view));
```

Copyright Adam Haile, 2016, MIT License