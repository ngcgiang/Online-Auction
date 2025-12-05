const winston = require('winston');
const LokiTransport = require('winston-loki');

// Định nghĩa các cấp độ log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3, 
  debug: 4,
};

// Danh sách các trường nhạy cảm cần mask
const SENSITIVE_FIELDS = [
  'password',
  'passwordConfirm',
  'newPassword',
  'oldPassword',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'pin',
  'authorization',
  'cookie',
];

// Hàm mask dữ liệu nhạy cảm
const maskSensitiveData = (data) => {
  if (typeof data === 'string') {
    // Kiểm tra xem string có chứa các trường nhạy cảm không
    let maskedString = data;
    SENSITIVE_FIELDS.forEach(field => {
      // Pattern để tìm: field: value hoặc field=value
      const patterns = [
        new RegExp(`(${field}[:\\s]*)[^\\s,}\\]]+`, 'gi'),
        new RegExp(`(${field}=)[^&\\s]+`, 'gi'),
      ];
      patterns.forEach(pattern => {
        maskedString = maskedString.replace(pattern, '$1***MASKED***');
      });
    });
    return maskedString;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }

  if (data && typeof data === 'object') {
    const maskedObject = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_FIELDS.some(field => 
          lowerKey.includes(field.toLowerCase())
        );
        
        if (isSensitive) {
          maskedObject[key] = '***MASKED***';
        } else if (typeof data[key] === 'object' && data[key] !== null) {
          maskedObject[key] = maskSensitiveData(data[key]);
        } else {
          maskedObject[key] = data[key];
        }
      }
    }
    return maskedObject;
  }

  return data;
};

// Custom format để mask dữ liệu nhạy cảm
const maskSensitiveFormat = winston.format((info) => {
  // Mask message
  if (info.message) {
    info.message = maskSensitiveData(info.message);
  }
  
  // Mask metadata
  const metaKeys = Object.keys(info).filter(
    key => !['level', 'message', 'timestamp', 'service'].includes(key)
  );
  
  metaKeys.forEach(key => {
    info[key] = maskSensitiveData(info[key]);
  });
  
  return info;
})();

// Nhãn (label) chung cho tất cả log từ ứng dụng này
const lokiLabels = {
  app: 'sakila-api', // Đặt tên app của bạn
  env: process.env.NODE_ENV || 'development',
};

// Quyết định transports (nơi log sẽ đi đến)
const transports = [
  // 1. Gửi log đến Loki
  new LokiTransport({
    host: "http://localhost:3100", // Loki host
    labels: lokiLabels,
    json: true,
    format: winston.format.combine(
      maskSensitiveFormat,  // Mask dữ liệu nhạy cảm trước khi gửi
      winston.format.json()
    ),
    replaceTimestamp: true,
    onConnectionError: (err) => console.error(err), // Bắt lỗi kết nối
  }),

  // 2. In log ra Console (rất hữu ích khi dev)
  new winston.transports.Console({
    format: winston.format.combine(
      maskSensitiveFormat,  // Mask dữ liệu nhạy cảm trong console
      winston.format.colorize(), 
      winston.format.simple()   
    ),
  })
];

// Tạo logger
const logger = winston.createLogger({
  level: 'debug', // 
  levels: levels, // Sử dụng các cấp độ log đã định nghĩa
  transports: transports,
  defaultMeta: { service: 'sakila-api' }, 
});

logger.stream = {
  write: (message) => {
    logger.http(message.trim()); 
  },
};

// Xuất logger để dùng ở nơi khác
module.exports = logger;