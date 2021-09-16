/**
 * 修改自https://github.com/song940/node-escpos/blob/master/commands.js
 * ESC/POS _ (Constants)
 */
var _ = {
  LF: [10],
  FS: [28],
  FF: [12],
  GS: [29],
  DLE: [16],
  EOT: [4],
  NUL: [0],
  ESC: [27],
  EOL: "\n",
  GS_FF: [29, 12],
  ESC_FF: [27, 12]
};

/**
 * [HARDWARE Printer hardware]
 * @type {Object}
 */
_.HARDWARE = {
  HW_INIT: [27, 64], // Clear data in buffer and reset modes
  HW_SELECT: [27, 61, 1], // Printer select
  HW_RESET: [27, 63, 10, 0] // Reset printer hardware
};

/**
 * [UNIT]
 * @type {String}
 */
_.UNIT_INIT = [29, 80, 203, 203];

/**
 * [TEXT_FORMAT Text format]
 * @type {Object}
 */
_.TEXT_FORMAT = {
  SIZE_NORMAL: [29, 33, 0],
  SIZE_NORMAL_DOUBLE: [29, 33, 1],
  SIZE_NORMAL_TRIPLE: [29, 33, 2],
  SIZE_NORMAL_QUADRUPLE: [29, 33, 3],
  SIZE_DOUBLE_NORMAL: [29, 33, 16],
  SIZE_DOUBLE: [29, 33, 17],
  SIZE_DOUBLE_TRIPLE: [29, 33, 18],
  SIZE_DOUBLE_QUADRUPLE: [29, 33, 19],
  SIZE_TRIPLE_NORMAL: [29, 33, 32],
  SIZE_TRIPLE_DOUBLE: [29, 33, 33],
  SIZE_TRIPLE: [29, 33, 34],
  SIZE_TRIPLE_QUADRUPLE: [29, 33, 35],
  SIZE_QUADRUPLE_NORMAL: [29, 33, 48],
  SIZE_QUADRUPLE_DOUBLE: [29, 33, 49],
  SIZE_QUADRUPLE_TRIPLE: [29, 33, 50],
  SIZE_QUADRUPLE: [29, 33, 51],

  TXT_UNDERL_OFF: [27, 45, 0], // Underline font OFF
  TXT_UNDERL_ON: [27, 45, 1], // Underline font 1-dot ON
  TXT_UNDERL2_ON: [27, 45, 2], // Underline font 2-dot ON
  TXT_BOLD_OFF: [27, 69, 0], // Bold font OFF
  TXT_BOLD_ON: [27, 69, 1], // Bold font ON
  TXT_ITALIC_OFF: [27, 53], // Italic font ON
  TXT_ITALIC_ON: [27, 52], // Italic font ON

  TXT_FONT_A: [27, 77, 0], // Font type A
  TXT_FONT_B: [27, 77, 1], // Font type B
  TXT_FONT_C: [27, 77, 2], // Font type C

  TXT_ALIGN_LT: [27, 97, 0], // Left justification
  TXT_ALIGN_CT: [27, 97, 1], // Centering
  TXT_ALIGN_RT: [27, 97, 2], // Right justification

  ROTATE_90: [27, 86, 1]
};

/**
 * [BARCODE_FORMAT Barcode format]
 * @type {Object}
 */
_.BARCODE_FORMAT = {
  BARCODE_TXT_OFF: [29, 72, 0], // HRI barcode chars OFF
  BARCODE_TXT_ABV: [29, 72, 1], // HRI barcode chars above
  BARCODE_TXT_BLW: [29, 72, 2], // HRI barcode chars below
  BARCODE_TXT_BTH: [29, 72, 3], // HRI barcode chars both above and below

  BARCODE_FONT_A: [29, 102, 0], // Font type A for HRI barcode chars
  BARCODE_FONT_B: [29, 102, 1], // Font type B for HRI barcode chars

  BARCODE_HEIGHT: function(height) {
    // Barcode Height [1-255]
    return [29, 104, height];
  },
  BARCODE_WIDTH: function(width) {
    // Barcode Width  [2-6]
    return [29, 119, width];
  },
  BARCODE_HEIGHT_DEFAULT: [29, 104, 100], // Barcode height default:100
  BARCODE_WIDTH_DEFAULT: [29, 119, 1], // Barcode width default:1

  BARCODE_UPCA: [29, 107, 0], // Barcode type UPC-A
  BARCODE_UPCE: [29, 107, 1], // Barcode type UPC-E
  BARCODE_JAN13: [29, 107, 2], // Barcode type EAN13
  BARCODE_JAN8: [29, 107, 3], // Barcode type EAN8
  BARCODE_CODE39: [29, 107, 4], // Barcode type CODE39
  BARCODE_ITF: [29, 107, 5], // Barcode type ITF
  BARCODE_CODABAR: [29, 107, 6], // Barcode type CODABAR
  BARCODE_CODE93: [29, 107, 7], // Barcode type CODE93
  BARCODE_CODE128: [29, 107, 73] // Barcode type CODE128
};

/**
 * [IMAGE_FORMAT Image format]
 * @type {Object}
 */
_.IMAGE_FORMAT = {
  S_RASTER_N: [29, 118, 48, 0], // Set raster image normal size
  S_RASTER_2W: [29, 118, 48, 1], // Set raster image double width
  S_RASTER_2H: [29, 118, 48, 2], // Set raster image double height
  S_RASTER_Q: [29, 118, 48, 3] // Set raster image quadruple
};

/**
 * [BITMAP_FORMAT description]
 * @type {Object}
 */
_.BITMAP_FORMAT = {
  BITMAP_S8: [27, 42, 0],
  BITMAP_D8: [27, 42, 1],
  BITMAP_S24: [27, 42, 32],
  BITMAP_D24: [27, 42, 33]
};

/**
 * [GSV0_FORMAT description]
 * @type {Object}
 */
_.GSV0_FORMAT = {
  GSV0_NORMAL: [29, 118, 48, 0],
  GSV0_DW: [29, 118, 48, 1],
  GSV0_DH: [29, 118, 48, 2],
  GSV0_DWDH: [29, 118, 48, 3]
};

/**
 * [BEEP description]
 * @type {string}
 */
_.BEEP = [27, 66]; // Printer Buzzer pre hex

/**
 * [COLOR description]
 * @type {Object}
 */
_.COLOR = {
  0: [27, 114, 0], // black
  1: [27, 114, 1] // red
};

/**
 * [MODE description]
 * @type {Object}
 */
_.MODE = {
  PAGE: [27, 76],
  STANDARD: [27, 83]
};

/**
 * [AREA description]
 * @type {String}
 */

_.AREA = [27, 87];

/**
 * [POSITION description]
 * @type {Object}
 */

_.POSITION = {
  LEFT: [27, 36],
  TOP: [29, 36]
};

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = _;
