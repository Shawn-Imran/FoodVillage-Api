const moment = require('moment-timezone');

exports.getDateString = (date) => {
    return moment(date).tz("Asia/Dhaka").format('YYYY-MM-DD');
}

exports.getDateDifference = (diffType, startDate, endDate) => {
    if (typeof startDate === "string") {
        startDate = new Date(startDate)
    }
    if (typeof endDate === "string") {
        endDate = new Date(endDate)
    }
    const a = moment(startDate, 'M/D/YYYY').tz("Asia/Dhaka");
    const b = moment(endDate, 'M/D/YYYY').tz("Asia/Dhaka");
    return a.diff(b, diffType ? diffType : 'd');
}

exports.convertToDateTime = (dateStr, timeStr) => {
    const date = moment(dateStr).tz("Asia/Dhaka");
    const time = moment(timeStr, 'HH:mm');

    date.set({
        hour: time.get('hour'),
        minute: time.get('minute'),
        second: time.get('second')
    });
    return date.format();
}
