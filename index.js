'use strict';
var path = require('path');
var fs = require('fs');
var Git = require( 'nodegit' );
const url = require('url');

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

  const bodyTags = self.processBody(pluginData.bodyTags, cdnUrl)
  const headTags = self.processHead(pluginData.headTags, cdnUrl);
  return { headTags: headTags, bodyTags: bodyTags, plugin: pluginData.plugin, outputName: pluginData.outputName };
};

HtmlWebpackCdnFallbackPlugin.prototype.processHead = function (_headTags, cdnUrl) {
  const headTags = [];  
  let cssLoaderInserted=false;
  _headTags.forEach(tag => {
    if(tag.tagName==='link' &&  tag.attributes && tag.attributes.href && tag.attributes.rel==='stylesheet'){
      if(!cssLoaderInserted){
        headTags.push(this.createLoadCssScriptTag());
        cssLoaderInserted=true;
      }
      headTags.push(this.createCssLoaderForLinkTag(tag, cdnUrl));
    }
    else
      headTags.push(tag);
  });
  return headTags;
};

function resolve(cdnUrl, filepath){
  if(!cdnUrl.endsWith('/'))
    cdnUrl+='/';
  if(filepath.startsWith('/'))
    filepath = filepath.substring(1);
  return cdnUrl+filepath;
}

HtmlWebpackCdnFallbackPlugin.prototype.createCssLoaderForLinkTag= function (tag, cdnUrl){
  return {
    tagName: 'script',
    closTag: true,
    innerHTML: `loadCss(['${resolve(cdnUrl,tag.attributes.href)}', '${tag.attributes.href}'],document.currentScript);`
  }
};

HtmlWebpackCdnFallbackPlugin.prototype.processBody = function (_bodyTags, cdnUrl) {
  const scriptTagsWithSrcAttribute = [];
  const bodyTags = [];  
  _bodyTags.forEach(tag => {
    if(tag.tagName==='script' && tag.attributes && tag.attributes.src)
      scriptTagsWithSrcAttribute.push(tag);
    else
      bodyTags.push(tag);
  });
  if(scriptTagsWithSrcAttribute.length) {
    bodyTags.push(this.createFallbackJsScriptTag());
    bodyTags.push(this.createFallbackScriptLoaderTag(scriptTagsWithSrcAttribute, cdnUrl));
  }
  return bodyTags;
};

HtmlWebpackCdnFallbackPlugin.prototype.createLoadCssScriptTag = function () {
  return {
    tagName: 'script',
    closeTag: true,
    innerHTML: fs.readFileSync(path.join(__dirname, 'loadCss.js'))
  }

};

HtmlWebpackCdnFallbackPlugin.prototype.createFallbackJsScriptTag = function () {
  return {
    tagName: 'script',
    closeTag: true,
    innerHTML: fs.readFileSync(path.join(__dirname, 'loadJs.js'))
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
  }
  const fallbackJsFiles = files.map(file => `loadJs(['${resolve(cdnUrl,file)}', '${file}']);`).join('');
  tag.innerHTML=fallbackJsFiles;
  return tag;
};


module.exports = HtmlWebpackCdnFallbackPlugin;
