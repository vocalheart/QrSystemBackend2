const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vocalheart.tech@gmail.com',
    pass: 'ybbgrkvknqccupzy'
  },
  tls: {
    rejectUnauthorized: false 
  }
});

module.exports = transporter;
