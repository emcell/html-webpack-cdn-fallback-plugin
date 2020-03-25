import { Plugin } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

type CdnUrlGenerator = () => string;

type HtmlWebpackCdnFallbackPluginOptions = {
  cdnUrl: string | CdnUrlGenerator
};

export = HtmlWebpackCdnFallbackPlugin;
declare class HtmlWebpackCdnFallbackPlugin extends Plugin {
  constructor(htmlWebpackPlugin: HtmlWebpackPlugin, options: HtmlWebpackCdnFallbackPluginOptions)
}
declare namespace HtmlWebpackCdnFallbackPlugin { }
