# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

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
