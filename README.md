# BooruShow

Simple browser extension to iterate through the content of a booru in a single tab while waiting for videos to complete.

Tested with `Danbooru` and `Firefox`.

## Installation

Package the project into a zip and install that as an extension into your browser.

## Usage

1. Click on the extension icon (default location is top left next to url bar, can be hidden in a extentions submenu)
2. Enter a URL to a posts.json file of a booru. Samples:
    - https://danbooru.donmai.us/posts.json?tags=animated
    - https://danbooru.donmai.us/posts.json?tags=raiden_shogun+official_art
    - http://localhost:3000/posts.json?tags=order:random+1girl&limit=100
3. Enter the interval (seconds) in which images should switch, videos switch on completion automatically.
3. Press Start.

The loop can be stopped by closing the tab.

## Tips

- Add `limit=100` or a number of your choosing to prevent repeats in the given limit.
- This supports http aswell, so local instances work.
- As the extension simply opens a tab, it uses your current account for authentication, allowing for more content to be viewed.
- Special tags like `order:random` work, which is quite nice.
- Tags can be copied from the normal url as both use + as the tag seperator.
- Pressing Start multiple times starts multiple independent instances.