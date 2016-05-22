const auth = require('./authentication');
const co = require('co');

exports.createMiddleware = function(options) {
  auth.setDatabaseFilename(options ? options.databaseFilename : undefined);

  return function* () {
    this.simpleauth = auth;

    this.simpleauth.user = yield auth.getUserByChatId(this.chatId);

    this.simpleauth.isUserAuthenticated = () => {
      return !!this.simpleauth.user;
    };

    this.simpleauth.isCurrentUserAdmin = () => {
      if (!this.simpleauth.user) {
        return false;
      }

      return !!this.simpleauth.user.admin;
    };
    
    this.simpleauth.makeCurrentUserAdminAsync = co.wrap(function* () {
      yield this.simpleauth.setUserAdminByChatId(true, this.chatId);
    }.bind(this));
    
    this.simpleauth.registerCurrentTelegramUserWithCodeAsync = co.wrap(function* (code) {
      yield this.simpleauth.registerUser(
        this.msg.from.username,
        this.msg.from.first_name,
        this.msg.from.last_name,
        this.chatId,
        code
      );
    }.bind(this));
  }
};