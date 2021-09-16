const bluetooth = require("../../utils/bluetooth.js");
const PrinterJobs = require("../../utils/printerjobs");
// 获取应用实例
const app = getApp();
const LAST_CONNECTED_DEVICE = "last_connected_device";

Page({
  data: {
    status: "free", //0. free; 1.searching; 2.connecting; 3.error(disable, noAccess); 4.connected;
    deviceList: [],
    deviceId: "", // 蓝牙设备id
    serviceId: "", // 蓝牙设备服务id
    characteristicId: "", // 蓝牙设备服务特征值id
  },
  onLoad(options) {
    if (!wx.openBluetoothAdapter) {
      wx.showModal({
        title: "提示",
        content:
          "当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。",
      });
      return;
    }
    const lastDevice = this.getLastDevice();
    if (lastDevice.deviceId) {
      this.connectLastDevice(lastDevice);
    } else {
      // this.getDeviceList();
    }
  },
  onUnload() {
    bluetooth.stopSearchBluetooth();
    bluetooth.closeBLEConnection();
    bluetooth.closeBluetoothAdapter();
  },
  getLastDevice() {
    let deviceName = "";
    let deviceId = "";
    const lastDevice = wx.getStorageSync(LAST_CONNECTED_DEVICE);
    if (lastDevice) {
      let arr = lastDevice.split("|");
      deviceName = arr[0];
      deviceId = arr[1];
    }
    return {
      deviceName,
      deviceId,
    };
  },
  connectLastDevice(lastDevice) {
    const { deviceName, deviceId } = lastDevice;
    wx.showLoading({
      title: "正在连接蓝牙",
      mask: true,
    });
    this.setData({
      status: "connecting",
      deviceList: [
        {
          deviceName,
          deviceId,
          status: "连接中",
        },
      ],
    });
    // 连接上次蓝牙设备
    bluetooth.openBluetooth().then(
      () => {
        wx.hideLoading();
        this.connectDevice(deviceId, true);
      },
      (res) => {
        wx.hideLoading();
        if (res.msg) {
          wx.showToast({
            title: res.msg,
            icon: "none",
          });
        }
        this.setData({
          status: res.status,
          deviceList: [],
        });
      }
    );
  },
  async getDeviceList(loadingText) {
    wx.showLoading({
      title: loadingText || "搜索蓝牙设备",
      mask: true,
    });
    this.setData({
      status: "searching",
    });
    const result = await bluetooth.getBluetoothDevicesList();
    wx.hideLoading();
    if (result.status === "success") {
      let deviceList = [];
      (result.data || []).forEach((item) => {
        if (item.name && item.name !== "未知设备") {
          deviceList.push({
            deviceName: item.name,
            deviceId: item.deviceId,
            status: "未连接",
          });
        }
      });
      this.setData({
        status: "complete",
        deviceList,
      });
    } else {
      if (result.msg) {
        wx.showToast({
          title: result.msg,
          icon: "none",
        });
      }
      this.setData({
        status: result.status,
        deviceList: [],
      });
    }
  },
  handleConnect(e) {
    const data = e.currentTarget.dataset;
    const { status, deviceList } = this.data;
    if (status === "connecting") {
      wx.showToast({
        title: "有设备连接中，请耐心等待",
        icon: "none",
      });
    } else if (status === "printing") {
      return;
    } else {
      if (data.status === "已连接") {
        return;
      } else {
        let newDeviceList = deviceList.map((item) => {
          return {
            ...item,
            status: item.deviceId === data.deviceId ? "连接中" : "未连接",
          };
        });
        this.setData({
          status: "connecting",
          deviceList: newDeviceList,
        });
        this.connectDevice(data.deviceId);
      }
    }
  },
  async connectDevice(deviceId, isLast) {
    const lastDevice = this.getLastDevice();
    if (lastDevice.deviceId) {
      await bluetooth.closeBLEConnection(lastDevice.deviceId);
    }
    const result = await bluetooth.connectBluetoothDevice(deviceId);
    let newDeviceList;
    if (result.status === "success") {
      let deviceName = "";
      newDeviceList = this.data.deviceList.map((item) => {
        let status = "未连接";
        if (item.deviceId === deviceId) {
          status = "已连接";
          deviceName = item.deviceName;
        }
        return {
          ...item,
          status,
        };
      });
      const { serviceId, characteristicId } = result.data;
      this.setData({
        status: "connected",
        deviceList: newDeviceList,
        deviceId,
        serviceId,
        characteristicId,
      });
      // 缓存本次连接的设备
      wx.setStorageSync(LAST_CONNECTED_DEVICE, deviceName + "|" + deviceId);
    } else {
      wx.removeStorageSync(LAST_CONNECTED_DEVICE);
      if (!isLast) {
        wx.showToast({
          title: result.msg || "连接失败",
          icon: "none",
        });
        newDeviceList = this.data.deviceList.map((item) => {
          return {
            ...item,
            status: "未连接",
          };
        });
        this.setData({
          status: result.status,
          deviceList: newDeviceList,
          deviceId: "",
          serviceId: "",
          characteristicId: "",
        });
      } else {
        // 连接上次蓝牙打印机失败，重新获取蓝牙设备
        this.setData({
          status: "error",
          deviceList: [],
        });
        // this.getDeviceList("连接失败，重新搜索设备");
      }
    }
  },
  reSearch() {
    if (this.data.status !== "searching") {
      // 如果已经有设备连接过，重新搜索需要断开蓝牙防止安卓连不上
      if (this.data.status === "connected") {
        bluetooth.closeBluetoothAdapter().then(() => {
          // 获取蓝牙列表
          this.getDeviceList();
        });
      } else {
        this.getDeviceList();
      }
    }
  },
  onPrint() {
    let printerJobs = new PrinterJobs();
    printerJobs.println("开始打印了"); // 打印并走纸
    printerJobs
      .setAlign("ct")
      .setFontSize(2, 2)
      .setUnderline(true)
      .println("居中文字-中号字体-下划线")
      .lineFeed(1) // 空白1行
      .setAlign("rt")
      .setFontSize(3, 3)
      .setBold(true)
      .setUnderline(false)
      .println("居右文字-大号字体-加黑")
      .lineFeed(2)
      .setAlign("lt")
      .setFontSize(1, 1)
      .setBold(false)
      .println("打印结束");
    this.handlePrint(printerJobs);
  },
  onPrintBarCode() {
    let printerJobs = new PrinterJobs();
    printerJobs
      .setAlign("ct")
      .println("打印条形码，内容'0123456789'")
      .addBarcode({
        text: "0123456789",
        height: 20,
        textPosition: 2,
      })
      .println();
    this.handlePrint(printerJobs);
  },
  onPrintQrCode() {
    let printerJobs = new PrinterJobs();
    printerJobs
      .setAlign("ct")
      .println("打印二维码，内容'https://www.baidu.com?a=1&b=2'")
      .addQRCode({ text: "https://www.baidu.com?a=1&b=2" })
      .println();
    this.handlePrint(printerJobs);
  },
  onPrintRpeat() {
    let printerJobs = new PrinterJobs();
    let start = printerJobs.getLength();
    printerJobs.setAlign("ct").println("重复内容开始").println("重复内容结束");
    let end = printerJobs.getLength();
    printerJobs.repeat(start, end, 3); // 重复打印3次
    printerJobs.text("打印完成").printToEnd();
    this.handlePrint(printerJobs);
  },
  onPrintPage() {
    let x = 0; // 打印区域起点横坐标(mm)
    let y = 0; // 打印区域起点纵坐标(mm)
    let width = 104; // 打印区域宽度(mm)
    let height = 128; // 打印区域高度(mm)
    let printerJobs = new PrinterJobs();
    printerJobs.setMode("page").setArea(x, y, width, height);
    printerJobs.text(
      "不同于标准模式一行一行打印，页模式在打印机内部缓存一个临时页面，用户用命令描绘该页面的内容，描绘完成后用页打印命令一次性打印完成。"
    );
    printerJobs.setPosition(40, 40).text('我的坐标(40mm, 40mm)').setPosition(0, 60).text("我的坐标(0mm, 60mm)").print();
    this.handlePrint(printerJobs);
  },
  handlePrint(printerJobs) {
    let buffer = printerJobs.buffer();
    // 1.并行调用多次会存在写失败的可能性
    // 2.建议每次写入不超过20字节
    // 分包处理，延时调用
    const maxChunk = 20;
    const delay = 20;
    const length = buffer.byteLength;
    for (let i = 0, j = 0; i < length; i += maxChunk, j++) {
      let subPackage = buffer.slice(
        i,
        i + maxChunk <= length ? i + maxChunk : length
      );
      setTimeout(this.writeBLECharacteristicValue, j * delay, subPackage);
    }
  },
  writeBLECharacteristicValue(buffer) {
    const { deviceId, serviceId, characteristicId } = this.data;
    bluetooth
      .bluetoothPrint({
        deviceId,
        serviceId,
        characteristicId,
        value: buffer,
      })
      .then((res) => {});
  },
});
