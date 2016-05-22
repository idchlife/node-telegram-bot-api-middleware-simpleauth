'use strict';

const token = process.argv[2];

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(token, {
  polling: true
});
const use = require('node-telegram-bot-api-middleware').use;
const simpleauth = require('./../index').createMiddleware();

const response = use(simpleauth);

// You can change logic of user becoming admin as you like
const becomeAdminCode = 'a2888';

// Registered users only will be able to get through this middleware
const onlyAuth = response.use(function* () {
  if (!this.simpleauth.isUserAuthenticated()) {
    yield bot.sendMessage(this.chatId, 'You are not registered to use this command');

    this.stop();
  }
});

// Using this for messages that are only for admin
const onlyAdmin = onlyAuth.use(function* () {
  if (!this.simpleauth.isCurrentUserAdmin()) {
    yield bot.sendMessage(this.chatId, 'You are not authorised to do this');
  }
});

bot.onText(/\/makeadmin (.*)/, response(function* (msg, matches) {
  if (!this.simpleauth.isUserAuthenticated()) {
    // Registering admin
    if (becomeAdminCode === matches[1]) {
      const code = yield this.simpleauth.generateAuthCode();

      yield this.simpleauth.registerCurrentTelegramUserWithCodeAsync(code);

      yield this.simpleauth.makeCurrentUserAdminAsync();
    } else {
      bot.sendMessage(this.chatId, 'Invalid code for becoming an admin');

      return;
    }
  } else {
    if (this.simpleauth.isCurrentUserAdmin()) {
      bot.sendMessage(this.chatId, 'You are already admin');

      return;
    }

    yield this.simpleauth.makeCurrentUserAdminAsync();
  }

  bot.sendMessage(this.chatId, 'You are now admin');
}));

bot.onText(/\/register (.*)/, response(function* (msg, matches) {
  const code = matches[1];

  if (this.simpleauth.isUserAuthenticated()) {
    bot.sendMessage(this.chatId, 'You are already registered');

    return;
  }

  if (!(yield this.simpleauth.doesAuthCodeExist(code))) {
    bot.sendMessage(this.chatId, 'Code for registration does not exist');

    return;
  }

  if (yield this.simpleauth.isAuthCodeAlreadyUsed(code)) {
    bot.sendMessage(this.chatId, 'Code already used');

    return;
  }

  yield this.simpleauth.registerCurrentTelegramUserWithCodeAsync(code);

  bot.sendMessage(this.chatId, 'Congratulations! You are registered.');
}));

bot.onText(/\/secret_info/, onlyAuth(function* () {
  bot.sendMessage(this.chatId, 'Here is our secret info!');
}));

bot.onText(/\/generate_code/, onlyAdmin(function* () {
  const code = yield this.simpleauth.generateAuthCode();

  yield bot.sendMessage(this.chatId, `Give this code for registration to someone you want in the system: ${code}`);
}));

console.log('bot started');