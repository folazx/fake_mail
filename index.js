require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const express = require('express');

const { Telegraf } = require('telegraf');

const app = express();

const bot = new Telegraf(process.env.BOT_TOKEN);

const users = {};


// ============================
// CREATE TEMP MAIL
// ============================

async function createMail() {

    const domainsRes = await axios.get(
        'https://api.mail.tm/domains'
    );

    const domain =
        domainsRes.data['hydra:member'][0].domain;

    const username =
        Math.random().toString(36).substring(2, 10);

    const address = `${username}@${domain}`;

    const password = '12345678';

    await axios.post(
        'https://api.mail.tm/accounts',
        {
            address,
            password
        }
    );

    const tokenRes = await axios.post(
        'https://api.mail.tm/token',
        {
            address,
            password
        }
    );

    return {
        address,
        password,
        token: tokenRes.data.token
    };
}


// ============================
// START
// ============================

bot.start((ctx) => {

    ctx.reply(`
🚀 Welcome To Fake Mail Bot

COMMANDS:

/generate → Create Mail
/id → Show Mail
/inbox → Check Inbox
    `);

});


// ============================
// GENERATE MAIL
// ============================

bot.command('generate', async (ctx) => {

    try {

        const mail = await createMail();

        users[ctx.from.id] = mail;

        ctx.reply(`
📧 YOUR TEMP MAIL

${mail.address}
        `);

    } catch (err) {

        console.log(err);

        ctx.reply('❌ Error Creating Mail');
    }

});


// ============================
// SHOW MAIL
// ============================

bot.command('id', (ctx) => {

    const user = users[ctx.from.id];

    if (!user) {
        return ctx.reply('❌ Generate Mail First');
    }

    ctx.reply(`
📬 YOUR MAIL:

${user.address}
    `);

});


// ============================
// INBOX
// ============================

bot.command('inbox', async (ctx) => {

    const user = users[ctx.from.id];

    if (!user) {
        return ctx.reply('❌ Generate Mail First');
    }

    try {

        const res = await axios.get(
            'https://api.mail.tm/messages',
            {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            }
        );

        const msgs = res.data['hydra:member'];

        if (msgs.length === 0) {
            return ctx.reply('📭 Inbox Empty');
        }

        for (const m of msgs) {

            const msgRes = await axios.get(
                `https://api.mail.tm/messages/${m.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                }
            );

            const full = msgRes.data;

            let body = '';

            if (typeof full.html === 'string') {

                body = full.html;

            } else if (Array.isArray(full.html)) {

                body = full.html.join(' ');

            } else if (typeof full.text === 'string') {

                body = full.text;

            } else if (typeof full.intro === 'string') {

                body = full.intro;

            } else {

                body = 'No Content';
            }

            body = String(body);

            const codes =
                body.match(/\b\d{4,8}\b/g);

            let otp = null;

            if (codes && codes.length > 0) {

                otp = codes.reduce((a, b) => {

                    return a.length >= b.length
                        ? a
                        : b;

                });

            }

            // ============================
            // BEAUTIFUL HTML UI
            // ============================

            const htmlContent = `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Fake Mail</title>

<style>

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
}

body{

    background:
    linear-gradient(
    135deg,
    #0f172a,
    #111827,
    #1e1b4b
    );

    min-height:100vh;

    font-family:
    Arial,
    sans-serif;

    padding:40px;

    color:white;
}

.container{

    max-width:900px;

    margin:auto;
}

.card{

    background:
    rgba(255,255,255,0.05);

    border:
    1px solid rgba(255,255,255,0.1);

    backdrop-filter:blur(10px);

    border-radius:25px;

    overflow:hidden;

    box-shadow:
    0 0 40px rgba(0,0,0,0.4);
}

.header{

    background:
    linear-gradient(
    90deg,
    #7c3aed,
    #2563eb
    );

    padding:30px;
}

.logo{

    font-size:35px;

    font-weight:bold;
}

.sub{

    opacity:0.8;

    margin-top:8px;
}

.content{

    padding:35px;
}

.info{

    background:
    rgba(255,255,255,0.05);

    padding:18px;

    border-radius:15px;

    margin-bottom:15px;

    word-break:break-word;
}

.label{

    color:#a78bfa;

    font-weight:bold;

    margin-bottom:6px;
}

.mailbody{

    margin-top:30px;

    background:#0f172a;

    border-radius:20px;

    padding:25px;

    overflow:auto;

    border:
    1px solid rgba(255,255,255,0.08);
}

.otp-box{

    margin-top:30px;

    background:
    linear-gradient(
    135deg,
    #f59e0b,
    #ef4444
    );

    border-radius:20px;

    padding:25px;

    text-align:center;

    box-shadow:
    0 0 30px rgba(239,68,68,0.4);
}

.otp-title{

    font-size:18px;

    margin-bottom:10px;

    opacity:0.9;
}

.otp{

    font-size:55px;

    font-weight:bold;

    letter-spacing:8px;
}

.footer{

    text-align:center;

    padding:25px;

    opacity:0.6;

    font-size:14px;
}

::-webkit-scrollbar{
    width:8px;
}

::-webkit-scrollbar-thumb{
    background:#7c3aed;
    border-radius:10px;
}

</style>

</head>

<body>

<div class="container">

<div class="card">

<div class="header">

<div class="logo">
📧 Fake Mail
</div>

<div class="sub">
Temporary Email Viewer
</div>

</div>

<div class="content">

<div class="info">

<div class="label">
FROM
</div>

<div>
${full.from.address}
</div>

</div>

<div class="info">

<div class="label">
SUBJECT
</div>

<div>
${full.subject}
</div>

</div>

${otp
                    ?
                    `
<div class="otp-box">

<div class="otp-title">
VERIFICATION CODE
</div>

<div class="otp">
${otp}
</div>

</div>
`
                    :
                    ''
                }

<div class="mailbody">
${body}
</div>

</div>

<div class="footer">
Fake Mail Bot • Telegram
</div>

</div>

</div>

</body>
</html>
`;

            // ============================
            // SAVE HTML
            // ============================

            const folder = path.join(__dirname, 'mails');

            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder);
            }

            const fileName =
                path.join(folder, `${m.id}.html`);

            fs.writeFileSync(
                fileName,
                htmlContent
            );

            // ============================
            // SEND FILE
            // ============================

            await ctx.replyWithDocument({
                source: fileName
            });

        }

    } catch (err) {

        console.log(
            err.response?.data ||
            err.message ||
            err
        );

        ctx.reply(`
❌ ERROR

${err.message}
        `);
    }

});


// ============================
// EXPRESS SERVER
// ============================

app.get('/', (req, res) => {

    res.send(`
    <h1>
    Fake Mail Bot Running 🚀
    </h1>
    `);

});

app.listen(3000, () => {

    console.log(
        'HTML Server Running On http://localhost:3000'
    );

});


// ============================
// START BOT
// ============================

bot.launch();

console.log('Bot Running...');