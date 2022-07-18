const CryptoJS = require('crypto-js');


exports.decryptStringObject = (encryptString, secretCode) => {
    const bytes = CryptoJS.AES.decrypt(encryptString, secretCode);
    try {
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
    } catch (error) {
        return null
    }
}

exports.decryptString = (encryptString, secretCode) => {
    const bytes = CryptoJS.AES.decrypt(encryptString, secretCode);
    try {
        return bytes.toString(CryptoJS.enc.Utf8)
    } catch (error) {
        return null
    }
}
