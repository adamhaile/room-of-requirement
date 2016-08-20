# room-of-requirement.js
A minimalist, functionally-oriented dependency injector for Javascript ES6+.

Uses ES6 destructuring assignment and functions to define bindings in plain javascript.

## Usage
```javascript
import RoomOfRequirement from 'room-of-requirement';

const get = RoomOfRequirement({
    config: () => new Config(),
    db:     ({config}) => new Db(config),
    app:    ({db, config}) => new App(db, config),
    view:   ({app}) => new View(app) // .. or however you construct your apps
});

get(({view}) => document.body.append(view));
```

Still in proof-of-concept stage.

## Planned Features

"Givens" -- supply some values to be used in resolution:

```javascript
const get = RoomOfRequirement({
    ...
    userService: ({db}) = new UserService(db),
    user:        ({userId, userService}) => userService.getUser(userId) // note: no rule for userId
});

get({userId: 1}, ({user}) => ... do something with user); // supply userId to get user
```

Nested namespaces:

```javascript
const get = RoomOfRequirement({
    ...
    controllers: {
        accountController: ({user}) => new AccountController(user),
        tasksController:   ({user, db}) => new TasksController(user, db),
        ... etc ...
    }
});

get(({controllers:{accountController}}) => accountController.Run());
```

Clean async injection using a double-arrow syntactic sugar:

```javascript
// pass in a Promise object to make all bindings Promises, 
// and use double arrow (=>()=>) syntax to cleanly chain them
const get = RoomOfRequirement(Promise, {
    config: () =>()=> new Config(),
    db:     ({config}) =>()=> new Db(config),
    app:    ({db, config}) =>()=> new App(db, config),
    view:   ({app}) =>()=> new View(app) 
});

// almost same code now resolves asynchronously
get(({view}) =>()=> document.body.append(view));
```

Copyright Adam Haile, 2016, MIT License