# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 1.3.0 - 2023-06-13

### Added
- The plugin now correctly manages prefixes and suffixes when they are the same. #TINY-9566

### Fixed
- Insert merge tag button and menu item was not disabled when selection was inside a non-editable context. #TINY-9893

## 1.2.0 - 2023-03-16

### Changed
- The `mceMergeTag` command now preserves the selected content as a plain text and wraps it in a merge tag prefix and suffix if the content length exceeds the limit. #TINY-9444

## 1.1.0 - 2022-11-23

### Added
- New `mceMergeTag` command to wrap selected content in a merge tag. #TINY-9112
- Merge tags can not exceed 255 characters in length. #TINY-9169

### Fixed
- The autocompleter was triggered without being preceded by a merge tag prefix. #TINY-9118

## 1.0.0 - 2022-09-08

### Added
- Initial release
