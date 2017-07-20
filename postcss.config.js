let path        = require('path'),
    ASSETS_DIR  = path.resolve('src/')

module.exports = {
  plugins: [
    require('postcss-assets')({
      basePath: 'src/',
      // basePath: '..',
      relative: 'src/',
      // relative: true,
      // loadPaths: [ path.resolve(ASSETS_DIR, 'fonts/'), path.resolve(ASSETS_DIR, 'images/') ],
      loadPaths: [ 'fonts/', 'images/' ]
    }),
    require('autoprefixer')()
  ]
}
