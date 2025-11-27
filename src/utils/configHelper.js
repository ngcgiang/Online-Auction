// helpers/configHelper.js
const SystemSetting = require('../models/SystemSetting');

async function getAuctionConfig() {
  // Lấy 2 config quan trọng nhất
  const configs = await SystemSetting.findAll({
    where: {
      setting_key: [
        'AUCTION_EXTEND_TRIGGER_MINUTES', 
        'AUCTION_EXTEND_DURATION_MINUTES'
      ]
    }
  });

  // Convert mảng thành object cho dễ dùng: { KEY: VALUE }
  const configMap = {};
  configs.forEach(conf => {
    // Ép kiểu về number vì trong DB lưu string
    configMap[conf.setting_key] = Number(conf.setting_value);
  });

  return {
    triggerTime: configMap['AUCTION_EXTEND_TRIGGER_MINUTES'] || 5, // Fallback là 5 nếu lỗi
    extendTime: configMap['AUCTION_EXTEND_DURATION_MINUTES'] || 10 // Fallback là 10 nếu lỗi
  };
}

module.exports = { getAuctionConfig };