// const nodemailer = require('nodemailer');

// const sendEmail = async options => {
//     // 1) Create a transporterver
//     const transporter = nodemailer.createTransport({
//         // service: 'Gmail',
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth: {
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD
//         }
//     //Activate 'less secure app' option in Gmail. 
//     });

//     // 2) Define the email options
//     const mailOptions = {
//         from: 'Sire <sire@lord.io>',
//         to: options.email,
//         subject: options.subject,
//         text: options.message,
//         //html
//     };


//     //3)Actually send the email.
//     await transporter.sendMail(mailOptions);

// };

// module.exports = sendEmail;
//Deprecated



const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Sire <${process.env.EMAIL_FROM}>`;
    }


    newTransport() {
        if(process.env.NODE_ENV === 'production') {
            // SendGrid
            return nodemailer.createTransport({
                service: 'SendGrid',                        // SendGrid like Gmail is recognized service by nodemailer so not much config required.
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                    
                }
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }


    // Send actual email
    async send(template, subject) {     // template.pug here
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(                    //only creates the html file to be sent
            `${__dirname}/../views/email/${template}.pug`,
            {
                firstName: this.firstName,
                url: this.url,
                subject
            }
        );

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)   //sometimes we do need in string to avoid some spam filters and etc.
        };

        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
        // In the importing code, we wont be sending using this 'sendMail' directly but from  below functions defined for different situations
        // Can create multiple functions below for many situations.
    }

    async sendWelcome(){
        await this.send('welcome', 'Welcome to the Natours Family');
    }

    async sendPasswordReset(){
        await this.send(
            'passwordReset',
            'Your password reset token (valid for only 10 minutes)'
        );
    }

};
