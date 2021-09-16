const commands = require("./commands");
const TextEncoder = require("./encoding/index").TextEncoder;

const FONT_SIZE_MAP = {
  "1*1": "SIZE_NORMAL",
  "1*2": "SIZE_NORMAL_DOUBLE",
  "1*3": "SIZE_NORMAL_TRIPLE",
  "1*4": "SIZE_NORMAL_QUADRUPLE",
  "2*1": "SIZE_DOUBLE_NORMAL",
  "2*2": "SIZE_DOUBLE",
  "2*3": "SIZE_DOUBLE_TRIPLE",
  "2*4": "SIZE_DOUBLE_QUADRUPLE",
  "3*1": "SIZE_TRIPLE_NORMAL",
  "3*2": "SIZE_TRIPLE_DOUBLE",
  "3*3": "SIZE_TRIPLE",
  "3*4": "SIZE_TRIPLE_QUADRUPLE",
  "4*1": "SIZE_QUADRUPLE_NORMAL",
  "4*2": "SIZE_QUADRUPLE_DOUBLE",
  "4*3": "SIZE_QUADRUPLE_TRIPLE",
  "4*4": "SIZE_QUADRUPLE"
};
const BARCODE_TXT_MAP = {
  0: 'BARCODE_TXT_OFF',
  1: 'BARCODE_TXT_ABV',
  2: 'BARCODE_TXT_BLW',
  3: 'BARCODE_TXT_BTH'
};

// 毫米单位转化为16进制高低位数组 [nL, nH]
function transformMmToLH(millimeter) {
  var mm = Number(millimeter) || 0;
  var n = Math.round(mm * 8); // 计算数据单位，一个数据单位约等于1/8mm
  return getLHArr(n);
}

// 十进制转化为高低位数组 [nL, nH]
function getLHArr(n) {
  var number = Number(n) || 0;
  var nL, nH;
  nL = number % 256;
  nH = (number - nL) / 256;
  return [nL, nH];
}

const printerJobs = function() {
  this._queue = Array.from(commands.HARDWARE.HW_INIT);
  this._encoder = new TextEncoder("gb2312", {
    NONSTANDARD_allowLegacyEncoding: true
  });
  this._enqueue = function(cmd) {
    this._queue.push.apply(this._queue, cmd);
  };
  this._init();
};

// 获取当前指令集长度
printerJobs.prototype.getLength = function() {
  return this._queue.length;
}

// 插入指定片段指令集，主要用于重复打印
printerJobs.prototype.repeat = function(start = 0, end = 0, times = 0) {
  let interval = this._queue.slice(start, end);
  for (let i = 0; i < times; i++) {
    this._enqueue(interval);
  }
  return this;
}

printerJobs.prototype.add = function(commands) {
  this._enqueue(commands);
  return this;
};

/**
 * 打印机初始化
 */
printerJobs.prototype._init = function() {
  this._enqueue(commands.UNIT_INIT); //初始化打印数据单位，一个单位约1/8mm
}

/**
 * 增加打印内容
 * @param  {string} content  文字内容
 */
printerJobs.prototype.text = function(content) {
  if (content) {
    let uint8Array = this._encoder.encode(content);
    let encoded = Array.from(uint8Array);
    this._enqueue(encoded);
  }
  return this;
};

/**
 * 走纸标签至分割线处
 * @param  {string}  content  文字内容
 */
printerJobs.prototype.printToEnd = function() {
  this._enqueue(commands.GS_FF);
  return this;
};

/**
 * 设置对齐方式
 * @param {string} align 对齐方式 LT/CT/RT
 */
printerJobs.prototype.setAlign = function(align) {
  this._enqueue(commands.TEXT_FORMAT["TXT_ALIGN_" + align.toUpperCase()]);
  return this;
};

/**
 * 设置字体
 * @param  {string} family A/B/C
 */
printerJobs.prototype.setFont = function(family) {
  this._enqueue(commands.TEXT_FORMAT["TXT_FONT_" + family.toUpperCase()]);
  return this;
};

/**
 * 设定字体尺寸
 * @param  {number} width 字体宽度 1~4
 * @param  {number} height 字体高度 1~4
 */
printerJobs.prototype.setFontSize = function(width = 1, height = 1) {
  var sizeStr = width + "*" + height;
  var fontSize = FONT_SIZE_MAP[sizeStr] || "SIZE_NORMAL";
  this._enqueue(commands.TEXT_FORMAT[fontSize]);
  return this;
};

/**
 * 设定字体是否加粗
 * @param  {boolean} bold
 */
printerJobs.prototype.setBold = function(bold) {
  if (typeof bold !== "boolean") {
    bold = true;
  }
  this._enqueue(
    bold ? commands.TEXT_FORMAT.TXT_BOLD_ON : commands.TEXT_FORMAT.TXT_BOLD_OFF
  );
  return this;
};

/**
 * 设定是否开启下划线
 * @param  {boolean} underline
 */
printerJobs.prototype.setUnderline = function(underline) {
  if (typeof underline !== "boolean") {
    underline = true;
  }
  this._enqueue(
    underline
      ? commands.TEXT_FORMAT.TXT_UNDERL_ON
      : commands.TEXT_FORMAT.TXT_UNDERL_OFF
  );
  return this;
};

/**
 * 设置行间距单位mm,默认值行间距是 3.75mm
 * @param {height} n = height * 8 (0≤n≤255)
 */
printerJobs.prototype.setLineSpacing = function(height = 3.75) {
  var n = Math.round(height * 8);
  this._enqueue(commands.LINE_SPACING.LS_SET);
  this._enqueue([n]);
  return this;
};

/**
 * 打印空行
 * @param {number} n
 */
printerJobs.prototype.lineFeed = function(n = 1) {
  return this.text(new Array(n).fill(commands.EOL).join(''));
};

/**
 * 清空任务
 */
printerJobs.prototype.clear = function() {
  this._queue = Array.from(commands.HARDWARE.HW_INIT);
  return this;
};

/**
 * 返回ArrayBuffer
 */
printerJobs.prototype.buffer = function() {
  return new Uint8Array(this._queue).buffer;
};

/**
 * 设置页打印模式(页面模式和标准模式)
 * mode: page | standard
 */
printerJobs.prototype.setMode = function(mode) {
  this._enqueue(commands.PAGEMODE);
  if (mode === 'page') {
    this._enqueue(commands.MODE.PAGE);
  } else if (mode === 'standard') {
    this._enqueue(commands.MODE.STANDARD);
  }
  return this;
};

/**
 * 设置打印区域
 * x: 打印区域起点横坐标(mm)
 * y: 打印区域起点纵坐标(mm)
 * width: 打印区域宽度(mm) 
 * height: 打印区域高度(mm)
 */
printerJobs.prototype.setArea = function(x = 0, y = 0, width = 104, height = 128) {
  this._enqueue(commands.AREA);
  this._enqueue(transformMmToLH(x));
  this._enqueue(transformMmToLH(y));
  this._enqueue(transformMmToLH(width));
  this._enqueue(transformMmToLH(height));
  return this;
};

/**
 * 设置绝对打印位置
 * left: 距离起始点左边距离(mm)
 * top: 距离起始点上边距离(mm)
 */
printerJobs.prototype.setPosition = function(left = 0, top = 0) {
  this._enqueue(commands.POSITION.LEFT)
  this._enqueue(transformMmToLH(left))
  this._enqueue(commands.POSITION.TOP)
  this._enqueue(transformMmToLH(top));
  return this;
};

/**
 * 添加二维码
 * params: 二维码打印参数
 * text: 二维码文字
 * mode: 二维码宽度(49, 50, 51)
 * size: 二维码尺寸(1-16)
 * level: 二维码纠错等级(48 L等级, 49 M等级, 50 Q等级, 51 H等级)
 */
printerJobs.prototype.addQRCode = function(params = {}) {
  const {
    text,
    mode = 50,
    size = 6,
    level = 49
  } = params;
  if (text) {
    // mode
    this._enqueue([29, 40, 107, 4, 0, 49, 65, mode, 0]);
    // size
    this._enqueue([29, 40, 107, 3, 0, 49, 67, size]);
    // level
    this._enqueue([29, 40, 107, 3, 0, 49, 69, level]);
    // stores the QR Code symbol data in the symbol storage area
    this._enqueue([29, 40, 107]);
    this._enqueue(getLHArr(text.length + 3));
    this._enqueue([49, 80, 48])
    this.text(text);
    // encodes and prints the QR Code symbol data in the symbol storage area
    this._enqueue([29, 40, 107, 3, 0, 49, 81, 48]);
  }
  return this;
}

/**
 * 添加条码
 * params: 条码打印参数
 * text: 条码文字
 * width: 条码宽度(2-6)
 * height: 条码高度(mm)
 * textPosition: 条码文字位置(0:不显示;1:条码上方;2:条码下方)
 */
printerJobs.prototype.addBarcode = function(params = {}) {
  const {
    text,
    width = 2,
    height = 15,
    textPosition = 0,
    type = 'CODE39'
  } = params;
  if (text) {
    // 条码高度
    var ht = Math.round(height * 8);
    this._enqueue(commands.BARCODE_FORMAT.BARCODE_HEIGHT(ht));

    // 条码宽度
    this._enqueue(commands.BARCODE_FORMAT.BARCODE_WIDTH(width));

    // 条码文字位置
    var textPosKey = BARCODE_TXT_MAP[textPosition];
    this._enqueue(commands.BARCODE_FORMAT[textPosKey]);

    // 根据文字生成条形码
    this._enqueue(commands.BARCODE_FORMAT['BARCODE_' + type]);
    if (type === 'CODE128') {
      var len = text.length;
      var nL = len % 256;
      this._enqueue([nL]);
      this.text(text); // 有些打印机必须要在text前面加上'{B'([123, 66]), 并且结束时需要加[0]
      // this._enqueue([0]);
    } else {
      this.text(text);
      this._enqueue([0]);
    }
  }
  return this;
};

/**
 * 打印文字并走纸一行
 * @param  {string} content  文字内容
 */
printerJobs.prototype.println = function(content) {
  if (content) {
    this.text(content);
    this._enqueue(commands.LF);
  } else {
    this._enqueue(commands.ESC_d);
    this._enqueue([0]);
  }

  return this;
};

/**
 * 标准模式: 打印并走纸，同println
 * 标签模式: 打印并走纸到分割线处，不清打印缓冲区
 * 页模式: 打印页数据并返回标准模式，清所有页面缓冲区，将内区域大小及区域方向设为默认值
 */
printerJobs.prototype.print = function() {
  this._enqueue(commands.FF);
  return this;
};

/**
 * 页模式或标签模式下打印缓冲区中所有数据，不清除缓冲区
 */
printerJobs.prototype.printPage = function() {
  this._enqueue(commands.ESC_FF);
  return this;
};

module.exports = printerJobs;
