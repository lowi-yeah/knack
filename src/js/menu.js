function init(id) {
  // no menu
  // if ($('#sidebar').length === 0) return

  let tocOptions = {iconId:   'burger',
                    duration: 400,
                    rotation: 'none' },
      tocButton  = new SVGMorpheus('#toc #iconset', tocOptions)

  $(id)
    .sidebar({
      // dimPage: false,
      onVisible: () => {
        tocButton.to('close')
        $('#toc').addClass('open') },
      onHide: () => {
        tocButton.to('burger')
        $('#toc').removeClass('open') }})
    .sidebar('attach events', '#toc')
    .sidebar('attach events', '#sidebar  a')

  }

export default {init: init}