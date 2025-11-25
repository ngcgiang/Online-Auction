const { Sequelize } = require('sequelize');

// Helper function to remove Vietnamese accents
const removeVietnameseAccents = (str) => {
  if (!str) return '';
  
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  
  return str;
};

const generateUnaccentSQL = (colName) => {
  const accents = [
    ['a', 'àáạảãâầấậẩẫăằắặẳẵ'],
    ['e', 'èéẹẻẽêềếệểễ'],
    ['i', 'ìíịỉĩ'],
    ['o', 'òóọỏõôồốộổỗơờớợởỡ'],
    ['u', 'ùúụủũưừứựửữ'],
    ['y', 'ỳýỵỷỹ'],
    ['d', 'đ']
  ];

  let logic = Sequelize.col(colName);

  accents.forEach(([char, list]) => {
    [...list].forEach(accentChar => {
      logic = Sequelize.fn('REPLACE', logic, accentChar, char);
    });
  });

  return logic;
};

/**
 * Format milliseconds to relative time string
 * @param {Number} ms - Milliseconds
 * @returns {String} - Formatted relative time
 */
const formatRelativeTime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} from now`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} from now`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} from now`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''} from now`;
  }
};

module.exports = {
  removeVietnameseAccents,
  generateUnaccentSQL,
  formatRelativeTime
};
