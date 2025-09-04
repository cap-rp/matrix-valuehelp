# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 3.4.0 - 2023-11-23

### Added
- Added new `tinycomments/css/tinycomments.js` JS file to be used with the new resource CSS bundling feature. #TINY-10321

### Fixed
- Switching from an empty paragraph to a section with a comment didn't enable `Add comment...` textarea. #TINY-10173

## 3.3.3 - 2023-09-01

### Fixed
- `Change` event did not fire upon adding a reply. #TINY-10089

## 3.3.2 - 2023-04-27

### Fixed
- `deleteallconversations` menu item was enabled before any comments were added. #TINY-9740

## 3.3.0 - 2023-03-17

### Changed
- The comment input box now has a max height to prevent long comments from expanding the box indefinitely #TINY-8894

## 3.2.0 - 2022-11-23

### Changed
- Selection now expands to select the entirety of what a comment will be added to when clicking the toolbar or menu buttons #TINY-8777

### Fixed
- A comment could be inserted when in an empty editor or block #TINY-8500

## 3.1.0 - 2022-06-29

### Added
- Added a title to the comment sidebar panel #TINY-8770
- Added the `tinycomments_author_avatar` option to provide a custom avatar for the current author #TINY-8695
- Added new `getEventLog` API to get a log of comment changes #TINY-8769
- Added new `CommentChange` event that gets fired when any comment specific change is made #TINY-8769

### Improved
- Comments now use a provided or generated avatar instead of showing the same icon for all users #TINY-8695
- Various block elements can now be be commented on directly #TINY-8698
- Various block elements now have an outline around them to visually indicate they are part of a comment #TINY-8698

### Changed
- Save buttons for new comments and replies are now named "Comment" instead of "Save" #TINY-8696
- The CSS styles are loaded earlier than before #TINY-8710
- Replaced "Say something ..." comment placeholder text with "Add comment..." #TINY-8782

### Fixed
- The `change` event was not fired when deleting all conversations #TINY-8561
- An additional undo level was incorrectly created when the initial HTML included embedded comment data #TINY-8498
- Opening the comments sidebar via an editor command did not respect the `skip_focus` argument #TINY-8655
- Creating or editing a comment was not blocking the UI while saving the data in callback mode #TINY-8666
- A selected `hr` block could be commented on when it should not have been possible #TINY-8698
- Previous comment replies were retained in the comment placeholder after the comment had been submitted #TINY-8736
- The comment textarea will now shrink, as well as grow, in response to comment content changes #TINY-8801

## 3.0.0 - 2022-03-03

### Added
- Added translations for Hindi, Malay and Vietnamese #TINY-8428

### Fixed
- The comments active state class was not excluded when getting the editor content #TINY-8195
- Undo levels were incorrectly added when moving in or out of a comment #TINY-8195
- The last comment in some edge cases was not scrolled into view correctly #TINY-8440
- Embedded comment data was incorrectly appended when only getting the selected editor content #TINY-8424

### Removed
- Removed support for TinyMCE 4.x and TinyMCE 5.x #TINY-8244
- Removed support for Microsoft Internet Explorer #TINY-8245

## 2.4.0 - 2021-05-04

### Added
- Added new resolve conversation functionality #TINY-6782
- New translation strings #TINY-7323

## 2.3.0 - 2020-11-18

### Added
- Added optional `onError` and `onSuccess` callbacks to the `tinycomments_create` callback #TINY-6324

### Fixed
- Fixed nested and overlapping comments breaking content #TINY-6324
- Fixed long comments getting cut off #TINY-6345
- Fixed visible scrollbar in textarea when writing a comment #TINY-6345

## 2.2.0 - 2020-09-29

### Added
- Added translations #TINY-6374

### Fixed
- Fixed the editor `referrer_policy` setting not working when loading additional resources #TINY-5087
- Fixed elements incorrectly left in the dom when the editor was removed #TINY-6122

## 2.1.4 - 2020-05-21

### Fixed
- Fixed missing icons for the show/add comment menu items #TINY-5990

## 2.1.3 - 2020-03-25

### Fixed
- Fixed comments causing the document scroll position to change #TC-343
