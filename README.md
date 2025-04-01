<h1 align="center">
  Nucleux
</h1>

<p align="center">
  <i>Simple, atomic hub for all your application's state management needs.</i>
</p>

<p align="center">
  <img src="https://github.com/martyroque/nucleux/blob/main/docs/logo.svg" />
</p>

<p align="center">
  <a href="https://www.npmjs.org/package/nucleux">
    <img src="https://img.shields.io/npm/v/nucleux?color=brightgreen&label=npm%20package" alt="Current npm package version." />
  </a>
</p>

---

## Introduction

Nucleux is a simple, atomic state management library based on the publisher-subscriber pattern and inversion-of-control (IoC) container design principle.

Nucleux allows you to create centralized stores with atomic units of state that your application can subscribe to. Unlike other state management libraries, Nucleux only triggers strictly-needed, isolated updates for computations (e.g. React components) subscribed to specific atoms.

With Nucleux, you can manage your application state outside of any UI framework, making your code decoupled, portable, and testable.

## Why Nucleux over other state management libraries?

- Simple and un-opinionated
- Makes hooks the primary means of consuming state
- Less boilerplate and no provider wrapping
- Centralized, atomic, and subscription-based state management

## Table of contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [A Quick Example](#a-quick-example)
- [Description](#description)
- [Detailed Usage](#detailed-usage)
- [Dependency Injection](#dependency-injection)
- [Persistency](#persistency)
- [Computed Values](#computed-values)
- [React Native](#react-native)
- [Author](#author)
- [License](#license)

## Prerequisites

- Node >= 14
- React >= 16.9.0 (Optional)

## Installation

```sh
npm install nucleux
```

## A quick example

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { Store, useStore, useValue } from 'nucleux';

class CounterStore extends Store {
  count = this.atom(0);

  increment() {
    const currentCount = this.count.value;
    this.count.value = currentCount + 1;
  }
}

const CounterView = () => {
  const counterStore = useStore(CounterStore);
  const count = useValue(counterStore.count);

  return (
    <button onClick={() => counterStore.increment()}>
      Current Count: {count}
    </button>
  );
};

ReactDOM.render(<CounterView />, document.body);
```

## Description

Nucleux leverages two core software architecture patterns:

- IoC Container pattern (a.k.a. DI Container) to manage store instantiation, dependency injection, and lifecycle.
- Publisher-subscriber pattern to implement atoms within stores that any JavaScript context (including React components) can subscribe and publish to.

### What's a Store?

A store is essentially a container of atoms (state values) that other JavaScript objects can subscribe and publish to. Stores live as long as they have at least one reference in the container. Once the last reference of a store is removed, the store is disposed.

## Detailed Usage

Let's take a closer look at how to use the library.

### Create a store

First, let's create our store. A store is a class that implements:

- Store atoms by calling `this.atom()` with an initial value (required).
- Methods that update the store atoms (optional).

Note: It's good practice to keep your stores separate from your UI.

```javascript
import { Store } from 'nucleux';

class CounterStore extends Store {
  count = this.atom(0);

  increment() {
    const currentCount = this.count.value;
    this.count.value = currentCount + 1;
  }
}

export default CounterStore;
```

### Use the store anywhere

Now that we have our store, we can use it anywhere within a JavaScript application by getting its instance via the container.

```javascript
import { Container } from 'nucleux';
import CounterStore from './CounterStore';

// Get the container and store instances
const container = Container.getInstance();
const counterStore = container.get(CounterStore);

// Subscribe to an atom
const subscriberId = counterStore.count.subscribe((count) => {
  console.log(`Current Count: ${count}`);
});

// Update the atom
counterStore.increment();
counterStore.increment();
counterStore.increment();

// Unsubscribe from the atom
counterStore.count.unsubscribe(subscriberId);

// Dispose the store
container.remove(CounterStore);
```

### Use the store in a React Component

Let's use our store in a React component.

First, we need to get our store instance using `useStore`. Then we use the `useValue` hook to subscribe to a store atom and trigger re-renders when it changes.

These hooks automatically handle atom unsubscription and store disposal when the component unmounts.

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { useStore, useValue } from 'nucleux';
import CounterStore from './CounterStore';

const CounterView = () => {
  const counterStore = useStore(CounterStore);
  const count = useValue(counterStore.count);

  return (
    <button onClick={() => counterStore.increment()}>
      Current Count: {count}
    </button>
  );
};

ReactDOM.render(<CounterView />, document.body);
```

### See this live

Visit our [Codesandbox](https://codesandbox.io/p/sandbox/0cwlqq) to see a live example of Nucleux with React.

## Dependency Injection

It's important for applications to follow software design principles, especially separation of concerns and segregation.

With Nucleux, you can have segregated stores that contain focused portions of your application's state. You can then leverage the container to inject stores into other stores.

Let's say we have a store that needs to read the count value from our `CounterStore`:

```javascript
import { Store } from 'nucleux';
import CounterStore from './CounterStore';

class ApplicationStore extends Store {
  counterStore = this.inject(CounterStore);
  isMax = this.atom(false);

  constructor() {
    super();

    this.watchAtom(this.counterStore.count, (count) => {
      if (!this.isMax.value && count >= 10) {
        this.isMax.value = true;
      }
    });
  }
}

export default ApplicationStore;
```

By extending `Store`, you get automatic unsubscription when the store is disposed.

## Persistency

To persist a store atom, specify a unique persistence key as the second argument to `this.atom()`.

When the atom's value changes, it will be persisted. The next time the store is instantiated, the value will be rehydrated.

```javascript
// Assuming 'CountValue' was persisted as 2, count will be hydrated with 2 instead of 0
count = this.atom(0, 'CountValue');

// This will persist the new value
this.count.value = currentCount + 1;
```

### Persistency - Custom Storage

You can configure Nucleux atoms to use custom storage for persistence. For instance, in React Native, you can use `AsyncStorage`:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

count = this.atom(0, 'CountValue', {
  storage: AsyncStorage,
});
```

## Derived Values

Sometimes you need to derive a value from several atoms. Nucleux offers a derived atoms feature that lets you consume multiple atoms, transform them, and produce a single result.

For example, let's say we have a user store that manages authentication and depends on an API store that tracks connection status. If we only want to allow requests from authenticated users when the API is connected, we can create a derived atom:

### ApiStore

```javascript
import { Store } from 'nucleux';

class ApiStore extends Store {
  isConnected = this.atom(false);
}

export default ApiStore;
```

### UserStore

```javascript
import { Store } from 'nucleux';
import ApiStore from './ApiStore';

class UserStore extends Store {
  apiStore = this.inject(ApiStore);
  isAuth = this.atom(false);
  shouldMakeRequest = this.deriveAtom(
    [this.isAuth, this.apiStore.isConnected],
    (isAuthValue, isConnectedValue) => {
      return isAuthValue && isConnectedValue;
    },
  );
}

export default UserStore;
```

With this, `shouldMakeRequest` will watch both the `isAuth` and `isConnected` atoms and derive a single boolean result. This derived atom can be used anywhere in your app:

```javascript
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useStore, useValue } from 'nucleux';
import UserStore from './UserStore';

const App = () => {
  const userStore = useStore(UserStore);
  const shouldMakeRequest = useValue(userStore.shouldMakeRequest);

  useEffect(() => {
    if (shouldMakeRequest) {
      // Make a fetch request
    }
  }, [shouldMakeRequest]);

  // ...
};

ReactDOM.render(<App />, document.body);
```

## React Native

Nucleux uses `nanoid` for secure unique ID generation for atom subscriptions and store identifiers. Since React Native doesn't have a built-in random generator, you'll need to add a polyfill.

The following setup works for both plain React Native and Expo projects (version 39.x and above):

```javascript
// App.jsx
import 'react-native-get-random-values'; // Add this polyfill before importing Nucleux
import { View } from 'react-native';
import { useStore, useValue } from 'nucleux';

import YourStore from './YourStore';

export default function App() {
  const store = useStore(YourStore);
  const value = useValue(store.value);

  return <View>{/* Your components here */}</View>;
}
```

First, install the required polyfill:

```sh
npm install react-native-get-random-values
# or
yarn add react-native-get-random-values
```

Make sure to import the polyfill at the top of your entry file before any Nucleux imports.

## Author

- **Marty Roque**
  - GitHub: [@martyroque](https://github.com/martyroque)
  - X: [@lmproque](https://x.com/lmproque)
  - LinkedIn: [@lmproque](https://www.linkedin.com/in/lmproque/)

## License

[ISC License](LICENSE)

Copyright © 2025 [Marty Roque](https://github.com/martyroque).
