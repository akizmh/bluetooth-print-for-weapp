// 关闭蓝牙
export function closeBluetoothAdapter() {
  return new Promise((resolve, reject) => {
    wx.closeBluetoothAdapter({
      success(res) {
        console.log("已关闭蓝牙模块");
        resolve();
      }
    });
  });
}

// 断开低功耗蓝牙连接
export function closeBLEConnection(deviceId) {
  return new Promise((resolve, reject) => {
    wx.closeBLEConnection({
      deviceId,
      success(res) {
        console.log("已断开低功耗蓝牙连接");
        resolve(true);
      },
      fail(res) {
        resolve(true);
      }
    });
  });
}

// 初始化蓝牙连接
export function openBluetooth() {
  return new Promise((resolve, reject) => {
    wx.openBluetoothAdapter({
      success: res => {
        resolve();
      },
      fail: res => {
        // console.log("blueTooth error= openBluetoothAdapter", res);
        reject({
          status: "error",
          msg: res.state === 3 ? "微信蓝牙未授权" : "手机蓝牙未打开"
        });
      }
    });
  });
}

// 搜索蓝牙设备
export function searchBluetooth() {
  return new Promise((resolve, reject) => {
    wx.startBluetoothDevicesDiscovery({
      success: res => {
        setTimeout(() => {
          resolve();
        }, 2000);
      },
      fail: res => {
        // console.log("blueTooth error= startBluetoothDevicesDiscovery", res);
        reject({
          status: "error"
        });
      }
    });
  });
}

// 获取搜索到的蓝牙设备
export function getBluetoothDevices() {
  return new Promise((resolve, reject) => {
    wx.getBluetoothDevices({
      success: res => {
        resolve(res);
      },
      fail: res => {
        // console.log("blueTooth error= getBluetoothDevices", res);
        reject({
          status: "error"
        });
      }
    });
  });
}

// 停止搜索蓝牙
export function stopSearchBluetooth() {
  wx.stopBluetoothDevicesDiscovery({
    complete: res => {
      // console.log("stopBluetoothDevicesDiscovery", res);
    }
  });
}

// 连接低功耗蓝牙
export function connectBLEDevice(deviceId) {
  return new Promise((resolve, reject) => {
    wx.createBLEConnection({
      deviceId,
      success: res => {
        // console.log("createBLEConnection success", res);
        resolve(deviceId);
      },
      fail: res => {
        // console.log("createBLEConnection fail", res);
        reject({
          status: "complete"
        });
      }
    });
  });
}

// 获取蓝牙设备所有服务
export function getBLEDeviceServices(deviceId) {
  return new Promise((resolve, reject) => {
    wx.getBLEDeviceServices({
      deviceId,
      success: res => {
        // console.log("getBLEDeviceServices", res);
        for (let i = 0; i < res.services.length; i++) {
          let item = res.services[i];
          if (item.isPrimary) {
            // this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid);
            resolve({ deviceId, serviceId: item.uuid });
            break;
          }
        }
      },
      fail: () => {
        reject({
          status: "complete"
        });
      }
    });
  });
}

// 获取蓝牙设备某个服务中的特征值列表
export function getBLEDeviceCharacteristics({ deviceId, serviceId }) {
  return new Promise((resolve, reject) => {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: res => {
        // console.log("getBLEDeviceCharacteristics success", res.characteristics);
        // 这里会存在特征值是支持write，写入成功但是没有任何反应的情况
        // 只能一个个去试
        for (let i = 0; i < res.characteristics.length; i++) {
          const item = res.characteristics[i];
          if (item.properties.write) {
            resolve({
              deviceId,
              serviceId,
              characteristicId: item.uuid
            });
            break;
          }
        }
        reject({
          status: "complete",
          msg: "该设备不可用"
        });
      },
      fail(res) {
        // console.error("getBLEDeviceCharacteristics", res);
        reject({
          status: "complete"
        });
      }
    });
  });
}

// 打印
export function bluetoothPrint(params) {
  return new Promise((resolve, reject) => {
    wx.writeBLECharacteristicValue({
      ...params,
      success(res) {
        // console.log("writeBLECharacteristicValue success", res);
        resolve("success");
      },
      fail(res) {
        resolve("fail");
        // console.log("writeBLECharacteristicValue fail", res);
      }
    });
  });
}

export function getBluetoothDevicesList() {
  return new Promise((resolve, reject) => {
    openBluetooth()
      .then(searchBluetooth)
      .then(getBluetoothDevices)
      .then(res => {
        if (res && res.devices) {
          resolve({
            status: "success",
            data: res.devices || []
          });
        }
      })
      .catch(e => {
        resolve(e);
      });
  });
}

export function connectBluetoothDevice(deviceId) {
  return new Promise((resolve, reject) => {
    stopSearchBluetooth();
    connectBLEDevice(deviceId)
      .then(getBLEDeviceServices)
      .then(getBLEDeviceCharacteristics)
      .then(res => {
        resolve({
          status: "success",
          data: res
        });
      })
      .catch(e => {
        resolve(e);
      });
  });
}

