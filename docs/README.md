# Nucleux

Simple, atomic hub for all your React application's state management needs. No providers, no boilerplate, just state that works.

## Why Nucleux?

- **Zero boilerplate** - Write less, do more
- **No providers** - Use state anywhere without wrapping components
- **Atomic updates** - Only subscribed components re-render
- **Framework agnostic** - Works with or without React

## Installation

```bash
npm install nucleux
```

## Quick Start

Create a store with atomic state:

```javascript
import { Store } from 'nucleux';

class CounterStore extends Store {
  count = this.atom(0);

  increment = () => {
    this.count.value += 1;
  };
}
```

Use it in React components:

```javascript
import { useStore, useValue } from 'nucleux';

function Counter() {
  const store = useStore(CounterStore);
  const count = useValue(store.count);

  return <button onClick={store.increment}>Count: {count}</button>;
}
```

That's it! No providers, no reducers, no dispatch.

## Core Concepts

### Atoms

Atoms are reactive pieces of state. When you change an atom's value, only components subscribed to that specific atom will re-render.

```javascript
class TodoStore extends Store {
  todos = this.atom([]);
  filter = this.atom('all');

  addTodo = (text) => {
    this.todos.value = [
      ...this.todos.value,
      { id: Date.now(), text, done: false },
    ];
  };
}
```

### Three Ways to Use State

#### 1. `useStore` - Get store methods

```javascript
const todoStore = useStore(TodoStore);
// Access: todoStore.addTodo(), todoStore.toggleTodo(), etc.
```

#### 2. `useValue` - Subscribe to specific atoms

```javascript
const todos = useValue(todoStore.todos);
// Or directly: const todos = useValue(TodoStore, 'todos');
```

#### 3. `useNucleux` - Get everything at once

```javascript
const todo = useNucleux(TodoStore);
// Access: todo.todos, todo.filter, todo.addTodo(), etc.
```

## Advanced Features

### Persistence

Save state automatically:

```javascript
class UserStore extends Store {
  // Persists to localStorage with key 'user-preferences'
  preferences = this.atom({ theme: 'dark' }, 'user-preferences');
}
```

### Derived State

Compute values from multiple atoms:

```javascript
class TodoStore extends Store {
  todos = this.atom([]);
  filter = this.atom('all');

  // Automatically updates when todos or filter changes
  filteredTodos = this.deriveAtom(
    [this.todos, this.filter],
    (todos, filter) => {
      if (filter === 'done') return todos.filter((t) => t.done);
      if (filter === 'pending') return todos.filter((t) => !t.done);
      return todos;
    },
  );
}
```

### Store Dependencies

Inject other stores:

```javascript
class NotificationStore extends Store {
  userStore = this.inject(UserStore);
  notifications = this.atom([]);

  constructor() {
    super();
    // Watch for user changes
    this.watchAtom(this.userStore.currentUser, (user) => {
      if (user) this.loadNotifications(user.id);
    });
  }
}
```

### Custom Storage (React Native)

Option 1: Set storage for the entire store:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class AppStore extends Store {
  storage = AsyncStorage; // All persistent atoms will use AsyncStorage

  settings = this.atom({ notifications: true }, 'app-settings');
  preferences = this.atom({ theme: 'dark' }, 'user-preferences');
}
```

Option 2: Set storage per atom:

```javascript
class AppStore extends Store {
  settings = this.atom({ notifications: true }, 'app-settings', {
    storage: AsyncStorage,
  });
}
```

## React Native Setup

Install the polyfill and import it before Nucleux:

```bash
npm install react-native-get-random-values
```

```javascript
// App.js - Import this first!
import 'react-native-get-random-values';
import { useStore, useValue } from 'nucleux';
```

## Complete Example

```javascript
import React from 'react';
import { Store, useNucleux } from 'nucleux';

class TodoStore extends Store {
  todos = this.atom([]);

  addTodo = (text) => {
    const newTodo = { id: Date.now(), text, done: false };
    this.todos.value = [...this.todos.value, newTodo];
  };

  toggleTodo = (id) => {
    this.todos.value = this.todos.value.map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done } : todo,
    );
  };
}

function TodoApp() {
  const { todos, addTodo, toggleTodo } = useNucleux(TodoStore);
  const [input, setInput] = React.useState('');

  const handleAdd = () => {
    if (input.trim()) {
      addTodo(input.trim());
      setInput('');
    }
  };

  return (
    <div>
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add todo..."
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <label>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
              />
              {todo.text}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Try It Live

[View on CodeSandbox](https://codesandbox.io/p/sandbox/nucleux-react-qw58s4)

## API Reference

### Store Methods

- `this.atom(initialValue, persistKey?, storage?)` - Create reactive state
- `this.deriveAtom(atoms[], computeFn)` - Create computed state
- `this.inject(StoreClass)` - Inject another store
- `this.watchAtom(atom, callback)` - Watch atom changes

### React Hooks

- `useStore(StoreClass)` - Get store instance with methods
- `useValue(atom)` or `useValue(StoreClass, 'atomKey')` - Subscribe to atom value
- `useNucleux(StoreClass)` - Get all methods and atom values

### Container (Advanced)

- `Container.getInstance().get(StoreClass)` - Get store instance
- `Container.getInstance().remove(StoreClass)` - Remove store

---

**Requirements:** Node ≥14, React ≥16.9.0 (optional)

## Author

**Marty Roque**

- GitHub: [@martyroque](https://github.com/martyroque)
- X: [@lmproque](https://x.com/lmproque)
- LinkedIn: [@lmproque](https://www.linkedin.com/in/lmproque/)

## License

[ISC License](LICENSE)

Copyright © 2025 [Marty Roque](https://github.com/martyroque).
