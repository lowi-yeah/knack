// @see: https://gero3.github.io/facetype.js/
import {Font} from 'three'
let opentype = require('opentype.js')

function _reverseCommands(commands) {
    var paths = [];
    var path;
    
    commands.forEach(function(c){
        if (c.type.toLowerCase() === "m"){
            path = [c];
            paths.push(path);
        } else if (c.type.toLowerCase() !== "z") {
            path.push(c);
        }
    });
    
    var reversed = [];
    paths.forEach(function(p){
        var result = {"type":"m" , "x" : p[p.length-1].x, "y": p[p.length-1].y};
        reversed.push(result);
        
        for(var i = p.length - 1;i > 0; i-- ){
            var command = p[i];
            result = {"type":command.type};
            if (command.x2 !== undefined && command.y2 !== undefined){
                result.x1 = command.x2;
                result.y1 = command.y2;
                result.x2 = command.x1;
                result.y2 = command.y1;
            } else if (command.x1 !== undefined && command.y1 !== undefined){
                result.x1 = command.x1;
                result.y1 = command.y1;
            }
            result.x =  p[i-1].x;
            result.y =  p[i-1].y;
            reversed.push(result);
        }
        
    });
    
    return reversed
}


var convert = function(font, options){
  let scale   = (1000 * 100) / ( (font.unitsPerEm || 2048) *72),
      result  = {}

  options = _.defaults(options, { restriction: {range : null, set : null},
                                  reverseTypeface: false })
  
  result.glyphs = {}

  // restriction = { range : null, set : null }
  
  // if (restrictCharactersCheck.checked) {
  //   var restrictContent = restrictCharacterSetInput.value;
  //   var rangeSeparator = '-';
  //   if (restrictContent.indexOf (rangeSeparator) != -1) {
  //     var rangeParts = restrictContent.split (rangeSeparator);
  //     if (rangeParts.length === 2 && !isNaN (rangeParts[0]) && !isNaN (rangeParts[1])) {
  //       restriction.range = [parseInt (rangeParts[0]), parseInt (rangeParts[1])];
  //     }
  //   }
  //   if (restriction.range === null) {
  //     restriction.set = restrictContent;
  //   }
  // }
  
  _.each(font.glyphs.glyphs, (glyph) => {
    if (_.isNil(glyph.unicode)) return

    let glyphCharacter  = String.fromCharCode(glyph.unicode),
        needToExport    = true
    
    // if (restriction.range !== null) {
    //   needToExport = (glyph.unicode >= restriction.range[0] && glyph.unicode <= restriction.range[1]);
    // } else if (restriction.set !== null) {
    //   needToExport = (restrictCharacterSetInput.value.indexOf (glyphCharacter) != -1);
    // }
    
    if (needToExport) {
      let token = {}
      
      token.ha    = Math.round(glyph.advanceWidth * scale)
      token.x_min = Math.round(glyph.xMin * scale)
      token.x_max = Math.round(glyph.xMax * scale)
      token.o     = ''
      
      if (options.reverseTypeface) 
        glyph.path.commands = _reverseCommands(glyph.path.commands)
      
      _.each(glyph.path.commands, function(command,i){
        if (command.type.toLowerCase() === "c") {command.type = "b";}
        token.o += command.type.toLowerCase();
        token.o += " "
        if (command.x !== undefined && command.y !== undefined){
          token.o += Math.round(command.x * scale);
          token.o += " "
          token.o += Math.round(command.y * scale);
          token.o += " "
        }
        if (command.x1 !== undefined && command.y1 !== undefined){
          token.o += Math.round(command.x1 * scale);
          token.o += " "
          token.o += Math.round(command.y1 * scale);
          token.o += " "
        }
        if (command.x2 !== undefined && command.y2 !== undefined){
          token.o += Math.round(command.x2 * scale);
          token.o += " "
          token.o += Math.round(command.y2 * scale);
          token.o += " "
        }
      });
      result.glyphs[String.fromCharCode(glyph.unicode)] = token;
    }
  });
  result.familyName = font.familyName;
  result.ascender = Math.round(font.ascender * scale);
  result.descender = Math.round(font.descender * scale);
  result.underlinePosition = font.tables.post.underlinePosition;
  result.underlineThickness = font.tables.post.underlineThickness;
  result.boundingBox = {
      'yMin': font.tables.head.yMin,
      'xMin': font.tables.head.xMin,
      'yMax': font.tables.head.yMax,
      'xMax': font.tables.head.xMax
  };
  result.resolution = 1000;
  result.original_font_information = font.tables.name;

  // if (font.styleName.toLowerCase().indexOf("bold") > -1) result.cssFontWeight = "bold" 
  // else result.cssFontWeight = "normal"
  // if (font.styleName.toLowerCase().indexOf("italic") > -1) result.cssFontStyle = "italic"
  // else result.cssFontStyle = "normal"
  result.cssFontWeight = 'normal'

  return result
}


function make(fontFace, options) {
  return new Promise( function(resolve, reject) { 
    opentype.load(fontFace, function(err, font) {
      if (err) reject('could not load font : ' + err)
      else resolve(new Font(convert(font, options)))})})}

export default make