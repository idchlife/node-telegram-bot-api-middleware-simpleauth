'use strict';

const db = require('./database');
const co = require('co');
const uniqid = require('uniqid');

let databaseFilename;

function withDB(callback) {
  return co.wrap(function* () {
    const context = {};

    context.db = yield db.getDatabase(databaseFilename);

    const result = yield callback.apply(context, arguments);

    return result;
  });
}

exports.isChatIdRegistered = withDB(function* (chatId) {
  const statement = this.db.prepare('SELECT count(*) as count FROM users WHERE telegram_chat_id = ?');

  const result = yield statement.getAsync(chatId);

  if (result.count > 1) {
    throw 'ChatIdRegisteredMoreThanOnceError';
  }

  yield statement.finalizeAsync();

  return result.count === 1;
});

exports.getUserByChatId = withDB(function* (chatId) {
  const statement = this.db.prepare('SELECT * FROM users WHERE telegram_chat_id = ?');

  const result = yield statement.getAsync(chatId);

  yield statement.finalizeAsync();

  if (typeof result === 'object') {
    return {
      id: result.id,
      username: result.username,
      firstName: result.first_name,
      lastName: result.last_name,
      chatId: result.telegram_chat_id,
      admin: !!result.admin
    }
  }

  return result;
});

exports.doesAuthCodeExist = withDB(function* (code) {
  const statement = this.db.prepare('SELECT count(*) as count FROM auth_codes WHERE code = ?');

  const result = yield statement.getAsync(code);

  yield statement.finalizeAsync();

  if (result.count > 1) {
    throw 'AuthCodeExistsInMoreThanOneRecordError';
  }

  return result.count === 1;
});

exports.findCodeByCode = withDB(function* (code) {
  const statement = this.db.prepare('SELECT * FROM auth_codes WHERE code = ?');

  const codeData = yield statement.getAsync(code);

  yield statement.finalizeAsync();

  return codeData;
});

exports.isAuthCodeAlreadyUsed = withDB(function* (code) {
  const codeData = yield exports.findCodeByCode(code);

  const statement = this.db.prepare('SELECT count(*) as count FROM users WHERE auth_code_id = ?');

  const result =  yield statement.getAsync(codeData.id);

  yield statement.finalizeAsync();

  if (result.count > 1) {
    throw 'CodeUsedMoreThatOnceError';
  }

  return result.count === 1;
});

/**
 * @param {string} username
 * @param {string} lastName
 * @param {number} chatId
 * @param {string} code
 */
exports.registerUser = withDB(function* (username, firstName, lastName, chatId, code) {
  const alreadyRegistered = yield exports.isChatIdRegistered(chatId);

  if (alreadyRegistered) {
    throw new Error('Chat id already registered')
  }

  const codeData = yield exports.findCodeByCode(code);

  const statement = this.db.prepare('INSERT INTO users (username, first_name, last_name, telegram_chat_id, auth_code_id) VALUES (?, ?, ?, ?, ?)');

  yield statement.runAsync(username, firstName, lastName, chatId, codeData.id);

  yield statement.finalizeAsync();
});

exports.generateAuthCode = withDB(function* () {
  const statement = this.db.prepare('INSERT INTO auth_codes (code) VALUES (?)');

  const code = uniqid();

  yield statement.runAsync(code);

  yield statement.finalizeAsync();

  return code;
});

exports.isUserAdminByChatId = withDB(function* (chatId) {
  const statement = this.db.prepare('SELECT admin FROM users WHERE telegram_chat_id = ?');

  const result = yield statement.getAsync(chatId);

  yield statement.finalizeAsync();

  if (!result) {
    return false;
  }

  return !!result.admin;
});

exports.setUserAdminByChatId = withDB(function* (admin, chatId) {
  const statement = this.db.prepare('UPDATE users SET admin = ? WHERE telegram_chat_id = ?');

  yield statement.runAsync(admin ? 1 : 0, chatId);

  yield statement.finalizeAsync();
});

exports.setDatabaseFilename = filename => {
  databaseFilename = filename;
};