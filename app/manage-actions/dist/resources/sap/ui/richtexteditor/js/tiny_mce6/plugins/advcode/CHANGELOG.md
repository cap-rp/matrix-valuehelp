# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 3.4.0 - 2023-11-23

### Added
- Added new `advcode/codemirror_css.js` JS file to be used with the new resource CSS bundling feature. #TINY-10321

## 3.3.1 - 2023-08-31

### Fixed
- Editing the data before switching theme would mean a loss of edited data. #TINY-10046

## 3.3.0 - 2023-06-13

### Changed
- Inline code editor was not properly retaining selected font size. #TINY-9701
- Dialog code editor was not properly retaining selected font size and dark mode. #TINY-9749

### Fixed
- Now `Copy code` button in view mode have grey background. #TINY-9698
- Switching to full-screen mode while in inline view would not bring the focus back to the code editor on the iOS platform. #TINY-9735

## 3.2.0 - 2023-03-16

### Added
- New button to copy the current dialog content. #TINY-9525
- New buttons to increase and decrease the font size in the dialog. #TINY-9526
- New button to toggle dark mode. #TINY-9527
- New button to toggle fullscreen. #TINY-9529
- New button to copy the inline code view content to clipboard. #TINY-9616
- New buttons to increase and decrease the font size in the view. #TINY-9616
- New button to toggle dark mode for view mode. #TINY-9616
- New button to toggle fullscreen in view mode if the fullscreen plugin is used. #TINY-9616

## 3.1.0 - 2022-11-23

### Added
- New `advcode_inline` option that when set to `true` will display the code editor inline instead of in a dialog. #TINY-8964
- New language pack files for inline mode. #TINY-9381

## 3.0.0 - 2022-03-03

### Removed
- Removed support for TinyMCE 4.x and TinyMCE 5.x #TINY-8244
- Removed support for Microsoft Internet Explorer #TINY-8245

## 2.3.2 - 2021-11-03

### Fixed
- Fixed an exception getting thrown for hints when the editor was rendered in a shadow root #TINY-8197

## 2.3.1 - 2021-05-20

### Security
- Upgraded third-party dependencies to fix a moderate severity ReDoS vulnerability #TINY-7438

## 2.3.0 - 2020-11-18

### Added
- Added the ability to maintain the cursor position when opening the code dialog #TINY-5091

### Fixed
- Fixed the code view not using monospace fonts #TINY-6579
- Fixed an issue where non-breaking spaces were inserted instead of regular spaces on Safari #TINY-6579

## 2.2.0 - 2020-09-29

### Added
- Added support for loading UI components within a ShadowRoot #TINY-6299

## 2.1.0 - 2020-07-01

### Added
- Added search/replace support #TINY-6113

### Fixed
- Fixed the editor `referrer_policy` setting not working when loading additional resources #TINY-5087

## 2.0.3 - 2020-01-28

### Fixed
- Fixed gutter rendering in the wrong location in TinyMCE 4 #ADVCODE-11
- Fixed code editor dialog not resizing responsively in TinyMCE 5 #ADVCODE-12

## 2.0.2 - 2019-11-07

### Fixed
- Fixed gutter not responding to touch events #ADVCODE-8

## 2.0.0 - 2019-02-04

### Added
- Support for TinyMCE 5

## 1.2.0 - 2018-02-01

### Improved
- Decreased plugin size by improving build steps.

## 1.1.1 - 2017-12-28

### Fixed
- Fixed issue where the ui would be accessed directly instead of though a factory.

## 1.1.0 - 2017-03-01

### Added
- Added HTML autocomplete addon. Open a new tag by writing '<' and a dropdown menu will appear showing a list of suggestions of HTML tags that narrows down as you continue writing. #TINY-556

## 1.0.2 - 2016-10-25

### Added
- Added version detection logic that check if this plugin is used with a compatible tinymce version. #TINY-639
