const { Telegraf, Markup } = require("telegraf");
const { v4: uuidv4 } = require("uuid");
const connectDB = require("./database/db");
const User = require("./schemas/user.schema");
const Messages = require("./schemas/messages.schema");
require("dotenv").config();
const languages = require("./lang");

connectDB();
const bot = new Telegraf(process.env.BOT_TOKEN);
let reference = null;
let country = null;
let language = null;

bot.command("generate", async (ctx) => {
  const userId = ctx.from.id;
  const user = await User.findOne({ userId });
  ctx.reply(`${language.generate_command}\n\n
    t.me/anonim_xabaruzbot?start=${user.uniqueId}
    `);
});
bot.command("help", (ctx) => {
  ctx.reply(`${language.help_command}`);
});
bot.command("language", (ctx) => {
  ctx.reply(
    "Tilni tanlang\nChoose your language\nВыберите свой язык",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("🇺🇿", "country_uz"),
        Markup.button.callback("🇷🇺", "country_ru"),
        Markup.button.callback("🇬🇧", "country_uk"),
      ],
    ])
  );
});
bot.use((ctx, next) => {
  return next();
});
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username;
  const uniqueId = uuidv4();
  reference = ctx.payload;

  try {
    const existingUser = await User.findOne({ userId });
    if (!existingUser) {
      const newUser = new User({ userId, username, uniqueId });
      await newUser.save();
    }

    if (reference) {
      const refUser = await User.findOne({ uniqueId: reference });

      if (refUser) {
        await ctx.reply(
          language
            ? language.greeting_ref
            : `You can now send an anonymous message directly to the user.`
        );
      } else {
        ctx.reply(
          `${language ? language.invalid_reference : "Invalid refernce ID"}`
        );
      }
    } else {
      await ctx.reply(
        "Tilni tanlang\nChoose your language\nВыберите свой язык",
        Markup.inlineKeyboard([
          [
            Markup.button.callback("🇺🇿", "country_uz"),
            Markup.button.callback("🇷🇺", "country_ru"),
            Markup.button.callback("🇬🇧", "country_uk"),
          ],
        ])
      );

      bot.action(/country_(.+)/, async (ctx) => {
        country = ctx.match[1];
        language = languages.find((lang) => lang.code === country);

        if (language) {
          await ctx.reply(language.selected_language);

          let id = ctx.from.id
          const user = await User.findOne({ userId: id });
          if (user) {
            await ctx.reply(
              `${language.greeting} \n${language.generate_command}\nt.me/anonim_xabaruzbot?start=${user.uniqueId}`,
              Markup.inlineKeyboard([
                [
                  Markup.button.switchToChat(
                    `📤 ${language.share_link}`,
                    `\n\n Click this link 🫴 t.me/anonim_xabaruzbot?start=${user.uniqueId}`
                  ),
                ],
              ])
            );
          }
        } else {
          ctx.reply("Language not found.");
        }
      });
    }
  } catch (error) {
    ctx.reply(`${language.error}`);
  }
});

bot.on("message", async (ctx) => {
  const newId = uuidv4();
  const refer = reference;
  const messageText = ctx.message.text;
  const senderId = ctx.message.from.id;

  try {
    const user = await User.findOne({ uniqueId: refer });

    if (!user) {
      return ctx.reply(
        `${language ? language.invalid_reference : "Invalid refernce ID"}`
      );
    }

    const newMessage = new Messages({
      uniqueId: newId,
      message: messageText,
      senderInfo: { ip: senderId },
    });

    await newMessage.save();

    await ctx.reply(
      `${
        language
          ? language.message_sent
          : "Message sent anonymously! If you want to stop, click this -> /start \nYou can also share your link to get anonymous messages"
      }\nt.me/anonim_xabaruzbot?start=${user.uniqueId}`,
      Markup.inlineKeyboard([
        [
          Markup.button.switchToChat(
            `📤 ${language.share_link}`,
            `\n\n Click this link 🫴 t.me/anonim_xabaruzbot?start=${user.uniqueId}`
          ),
        ],
      ])
    );

    await ctx.telegram.sendMessage(
      user.userId,
      `${
        language
          ? language.message_received
          : "You have received an anonymous message!"
      }\n\n${messageText}`
    );
  } catch (error) {
    await ctx.reply(
      `${
        language
          ? language.error
          : "An error occurred while processing. Please try again."
      }`
    );
  }
});

bot.launch(() => {
  console.log("Bot is up and running...");
});
