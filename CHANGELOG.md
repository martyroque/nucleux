# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [1.3.0] - 2025-06-22

### Added

- Added social media meta tags to docs for improved link previews.
- Added favicon to the docs.
- Added docs analytics.
- Added layered memoization support to atoms and derived atoms with
  shallow (default), deep, and custom comparator options to further
  improve atom updates and component re-renders.
- Added `enableDebug()` to Store class for console-based debugging.
- Enhanced atom subscribe method to support previous value in callbacks.
- Console logging for atom changes with previous/current values and
  timestamps.
- Added initialValue property to atom interfaces for accessing the
  original atom value.
- Added isServerSnapshot parameter to getStoreProxy utility function for
  SSR support.

### Changed

- Updated logo view-box and reduce logo size in docs.
- Updated atom subscribe callback signature to optionally include
  previous value.
- Improved atom subscriber error handling.
- Updated all hooks (useStore, useValue, useNucleux) to provide proper
  server-side snapshots for SSR.
- Moved `use-sync-external-store` as a peer dependency.

### Fixed

- Fixed NextJS SSR compatibility by adding getServerSnapshot parameter
  to useSyncExternalStore hooks.
- Fixed SSR hydration mismatches for persisted atoms by using initial
  values on server-side rendering.

## [1.2.2] - 2025-05-31

### Added

- Added immediate callback option to Atom subscribe method.

### Changed

- Improved the README content
- Updated description and keywords

## [1.2.1] - 2025-05-17

### Added

- Documentation

### Fixed

- Fix and improve useNucleux hook

## [1.2.0] - 2025-05-10

### Added

- New useNucleux hook for accessing all store methods and atom values
  with a single hook
- Overloaded useValue hook to support direct atom access via store
  constructor and key name
- Comprehensive JSDoc documentation for all hooks to improve developer
  experience

### Changed

- Improved type safety for atom access with StoreProxyAtoms type
  constraints
- Enhanced error handling for invalid atom access

### Fixed

- Fixed potential memory leaks in subscription cleanup logic
- Improved type inference for nested atom values

## [1.1.1] - 2025-03-31

### Changed

- Update the readme logo size

## [1.1.0] - 2025-03-31

### Changed

- Renamed library to Nucleux.
- Improved method naming:
  - value() → atom()
  - subscribeToValue() → watchAtom()
  - computedValue() → deriveAtom()
- Updated README with consistent terminology and improved examples.
- Enhanced documentation clarity and formatting.
- Kept hook names useStore and useValue for community familiarity.

## [1.0.0] - 2025-03-29

### Changed

- Migrate from apps-digest for simplicity and improvements.
- Simplify all interfaces, classes and helpers names.

## [0.4.0] - 2023-04-13

### Added

- Add value getters and setters for a simplified usage.

### Changed

- Shorten hook names for a common/known pattern.

## [0.3.0] - 2023-04-13

### Added

- Add support for React Native.
- Add support for custom persistency storage.

## [0.2.0] - 2023-02-17

### Changed

- Abstract the store definition generation to the store container by
  adding a `getStoreDefinition` method to the store prototype, making it
  simpler to just export the stores instead of manually generating the
  store definition before exporting or using the store.

### Removed

- Remove `generateStoreDefinition` from library exports.

## [0.1.0] - 2022-12-09

### Changed

- Update custom hooks to consume `useSyncExternalStore`.
- Generate unique store IDs upon store generation instead of the static `getStoreName` method, which could be prone to issues on refactors.

## [0.0.5] - 2022-10-21

### Changed

- Fixed README examples and added a live demo.
- Removed the `apps_digest_flow.jpeg` image to reduce package size.

## [0.0.4] - 2022-09-04

### Added

- Added computed values.

### Changed

- Fix store definition constraints to comply with [TypeScript 4.8](https://devblogs.microsoft.com/typescript/announcing-typescript-4-8/#unconstrained-generics-no-longer-assignable-to).

## [0.0.3] - 2022-08-18

### Added

- Added persistency feature to store values.

## [0.0.2] - 2022-06-04

### Fixed

- Fixed the store collision issues in production due to functions becoming
  one-letter when minified. Added `getStoreName` static method as part of the
  store constructable to enforce store name definition.

## [0.0.1] - 2022-05-25

### Added

- Initial release.
