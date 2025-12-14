require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const adminId = process.env.ADMIN_CHAT_ID;

// Bot menyulari va komandalari
bot.start((ctx) => {
  if (ctx.chat.id.toString() !== adminId) return ctx.reply('Sizga ruxsat yo\'q!');
  ctx.reply('Bot ishga tushdi! Monitoring boshlandi.', {
    reply_markup: {
      keyboard: [['/viewselectedproducts'], ['/productabout']],
      resize_keyboard: true
    }
  });
});

bot.command('viewselectedproducts', (ctx) => {
  if (ctx.chat.id.toString() !== adminId) return;
  ctx.reply('Foydalanuvchilar tanlagan mahsulotlar:\n(Hozircha hech nima yo\'q, yangi tanlovlar kelganda xabar beraman)');
  // Keyin bu yerda real ma'lumotlarni ko'rsatish mumkin (DB dan)
});

bot.command('productabout', (ctx) => {
  if (ctx.chat.id.toString() !== adminId) return;
  ctx.reply('Mahsulot haqida ma\'lumot:\nBu bot sizning online do\'koningizni monitoring qiladi. Kimdir mahsulot tanlasa, darhol xabar keladi.');
});

// Express server webhook uchun
const app = express();
app.use(express.json());

// Webhook endpoint – saytingizdan POST so'rov keladi
app.post('/webhook/selected-product', (ctx, res) => {
  const secret = ctx.headers['x-secret'];
  if (secret !== process.env.SITE_WEBHOOK_SECRET) {
    return res.status(403).send('Forbidden');
  }

  const data = ctx.body; // { productName, productId, price, imageUrl, userIp, userName, userPhone, ... }

  let message = `Yangi tanlov!\n\nMahsulot: ${data.productName || 'Noma\'lum'}\nID: ${data.productId || '-'}\nNarxi: ${data.price || '-'}\n`;

  if (data.imageUrl) {
    bot.telegram.sendPhoto(adminId, data.imageUrl, { caption: message });
  } else {
    bot.telegram.sendMessage(adminId, message);
  }

  // Qo'shimcha user info
  if (data.userName || data.userPhone || data.userIp) {
    const userInfo = `\nFoydalanuvchi:\nIsm: ${data.userName || '-'}\nTelefon: ${data.userPhone || '-'}\nIP: ${data.userIp || '-'}`;
    bot.telegram.sendMessage(adminId, userInfo);
  }

  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ishlayapti port ${PORT}`);
});

// Botni ishga tushirish
bot.launch();
console.log('Bot ishga tushdi!');