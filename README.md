CDN with fallback extension for the HTML Webpack Plugin
========================================
[![npm version](https://badge.fury.io/js/html-webpack-cdn-fallback-plugin.svg)](https://badge.fury.io/js/html-webpack-cdn-fallback-plugin)

Enhances [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
functionality by loading all `script` body tags with [fallbackjs](http://fallback.io/).

This is an extension plugin for the [webpack](http://webpack.github.io) plugin [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) (version 4 or higher).  It allows you to load javascript files from a cdn and fallback to self hosting if the cdn can't be reached.


This extension is based on the source code of [html-webpack-inline-source-plugin](https://github.com/dustinjackson/html-webpack-inline-source-plugin). 

Installation
------------
You must be running webpack on node 6 or higher.

Install the plugin with npm:
```shell
$ npm install --save-dev html-webpack-cdn-fallback-plugin
```

Basic Usage
-----------
Require the plugin in your webpack config:

```javascript
var HtmlWebpackCdnFallbackPlugin = require('html-webpack-cdn-fallback-plugin');
```

Add the plugin to your webpack config as follows:

```javascript
plugins: [
  new HtmlWebpackPlugin(),
  new HtmlWebPackCdnFallbackPlugin(HtmlWebpackPlugin,{cdnUrl: 'https://your-cdn.com/basepath/:version/',})
]  
```

This will replace all `script` tags from the body that have a `src` attribute with one script tag containing calls to [fallbackjs](https://github.com/dustinjackson/html-webpack-inline-source-plugin).

without plugin:
```html
  <script src='a.js'>
  <script>
    //inline javascript code 
  </script>
  <script src='b.js'>
```

with plugin:
```html
  <script src='fallback.min.js'>
  <script>
    //inline javascript code 
  </script>
  <script>
    fallback.load({
      'a.js': ['https://your-cdn.com/basepath/1.0.0/a.js', '/a.js'],
      'b.js': ['https://your-cdn.com/basepath/1.0.0/b.js', '/b.js'],
    });
  </script>
```


Options
-------

`cdnUrl`

Can be either a string or a function returning a string. `:version` will be replaced with the veriosn of your package.json. `:commit` will be replaced with the commit sha of your repository. 
