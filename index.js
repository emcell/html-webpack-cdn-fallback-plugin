'use strict';
var path = require('path');
var fs = require('fs');
var Git = require( 'nodegit' );

function HtmlWebpackCdnFallbackPlugin (htmlWebpackPlugin, options) {
  this.htmlWebpackPlugin = htmlWebpackPlugin;
  this.cdnUrl = options?options.cdnUrl:undefined;
}

HtmlWebpackCdnFallbackPlugin.prototype.apply = function (compiler) {
  var self = this;
  self.compiler = compiler;
  // Hook into the html-webpack-plugin processing
  compiler.hooks.compilation.tap('html-webpack-cdn-fallback-plugin', compilation => {
    self.htmlWebpackPlugin
      .getHooks(compilation)
      .alterAssetTagGroups.tapAsync('html-webpack-cdn-fallback-plugin', async(htmlPluginData, callback) => {
        if (!self.cdnUrl) {
          return callback(null, htmlPluginData);
        }

        let cdnUrl = self.cdnUrl;
        if (typeof v === "function") {
          cdnUrl=cdnUrl();
        }
        cdnUrl = await self.replaceCdnVariables(self.compiler.context, cdnUrl);
        var result = self.processTags(compilation, cdnUrl, htmlPluginData);
        callback(null, result);
      });
  });
};

HtmlWebpackCdnFallbackPlugin.prototype.processTags = function (compilation, cdnUrl, pluginData) {
  var self = this;

  const scriptTagsWithSrcAttribute = pluginData.bodyTags.filter(tag => {
    return tag.tagName==='script' &&
           tag.attributes && tag.attributes.src
  });
  const bodyTags = pluginData.bodyTags.filter(tag => tag.tagName!=='script');
  if(scriptTagsWithSrcAttribute.length) {
    this.copyFallbackJsToOutputRoot(compilation);
    bodyTags.push(this.createFallbackJsScriptTag());
    bodyTags.push(this.createFallbackScriptLoaderTag(scriptTagsWithSrcAttribute, cdnUrl));
  }
  return { headTags: pluginData.headTags, bodyTags: bodyTags, plugin: pluginData.plugin, outputName: pluginData.outputName };
};
HtmlWebpackCdnFallbackPlugin.prototype.copyFallbackJsToOutputRoot = function (compiler){
  const filename = path.resolve(__dirname, '..', 'fallbackjs', 'fallback.min.js');
  fs.copyFileSync(filename, path.join(compiler.options.output.path, 'fallback.min.js'));
  return;
};
HtmlWebpackCdnFallbackPlugin.prototype.createFallbackJsScriptTag = function () {
  return {
    tagName: 'script',
    closeTag: false,
    attributes: {
      src: '/fallback.min.js'
    }
  }
};

async function getCommitHash(repositoryPath){
  const repository = await Git.Repository.open( repositoryPath );
  const commit = await repository.getHeadCommit();
  const sha =  await commit.sha();
  return sha;
}

async function getPackageJsonVersion(projectRoot) {
  const packageJsonPath = path.join(__dirname, 'package.json');
  if(!fs.existsSync(packageJsonPath))
    return undefined;
  const p = require(packageJsonPath);
  return p.version;
}

function replaceVariable(cdnUrl, variable, value){
  if(value)
    cdnUrl = cdnUrl.replace(variable, value);
  return cdnUrl;
}

HtmlWebpackCdnFallbackPlugin.prototype.replaceCdnVariables = async function(projectRoot, cdnUrl) {
  cdnUrl = replaceVariable(cdnUrl, ':version', await getPackageJsonVersion(projectRoot));
  cdnUrl = replaceVariable(cdnUrl, ':commit', await getCommitHash(projectRoot));
  return cdnUrl;
};
HtmlWebpackCdnFallbackPlugin.prototype.createFallbackScriptLoaderTag = function (scriptTags, cdnUrl) {
  const files = scriptTags.map(tag => tag.attributes.src);
  const tag = {
    tagName: 'script',
    closeTag: true,
    attributes: {
      type: 'text/javascript'
    }
  }
  const fallbackJsFiles = files.map(file => `'${file}':['${path.join(cdnUrl,file)}', '${file}']`).join(',');
  tag.innerHTML=`fallback.load({${fallbackJsFiles}});`;
  return tag;
};


module.exports = HtmlWebpackCdnFallbackPlugin;
