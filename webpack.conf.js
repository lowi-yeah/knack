import webpack from 'webpack'
import path from 'path'
import Clean from 'clean-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'

export default {
  module: {
    rules: [

      // JSON
      { test: /\.json$/, 
        loader: "json-loader"},
    
      // JS
      { loader: "babel-loader",
        test: /\.js?$/,
        exclude: /node_modules/,
        query: {cacheDirectory: true} },

      // { test: require.resolve('jquery'),
      //   use:  { loader: 'expose-loader',
      //           options: '$' } },

      // { test: require.resolve('lodash'),
      //   use:  { loader: 'expose-loader',
      //           options: '_' } },


      // LESS
      { test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            { loader:   'css-loader',
              options : { autoprefixer: false,
                          sourceMap:    true,
                          url:          false } },
            'postcss-loader',
            { loader: 'less-loader',
              options : { includePaths: [path.resolve(__dirname, './node_modules')]}}
          ]
        })},

      // images
      { test: /\.(jpe?g|png|gif|svg)$/i, 
        loader: "file-loader?name=images/[name].[ext]"},
     
      // Fonts
      // { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,     loader: 'url-loader?limit=65000&mimetype=image/svg+xml&name=assets/fonts/[name].[ext]' },
      // { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,    loader: 'url-loader?limit=65000&mimetype=application/font-woff&name=assets/fonts/[name].[ext]' },
      // { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,   loader: 'url-loader?limit=65000&mimetype=application/font-woff2&name=assets/fonts/[name].[ext]' },
      // { test: /\.[ot]tf(\?v=\d+\.\d+\.\d+)?$/,  loader: 'url-loader?limit=65000&mimetype=application/octet-stream&name=assets/fonts/[name].[ext]' },
      // { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,     loader: 'url-loader?limit=65000&mimetype=application/vnd.ms-fontobject&name=assets/fonts/[name].[ext]'}

    ]
  },

  plugins: [
    new ExtractTextPlugin({ filename: path.join('css', 'index.bundle.css')}),
    new webpack.ProvidePlugin({
      "fetch": "imports-loader?this=>global!exports?global.fetch!whatwg-fetch"
    }),
    new webpack.ProvidePlugin({
      // $               :'jquery',
      // jQuery          :'jquery',
      // 'window.jQuery' :'jquery',
      _               :'lodash'
    })
  ],

  context: path.join(__dirname, "src"),
  entry: {
    app: ['./js/app', './less/main.less']
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: "/",
    filename: "[name].js"
  },
  externals:  [/^vendor\/.+\.js$/]
};
