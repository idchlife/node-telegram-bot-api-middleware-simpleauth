'use strict';

require('co-mocha');
const auth = require('./authentication');
const expect = require('chai').expect;
const fs = require('mz/fs');

const databaseFilename = 'tests.sqlite3';

auth.setDatabaseFilename(databaseFilename);

describe('basic work with authentication', () => {
  after(function* () {
    fs.unlink(databaseFilename);
  });
  
  let authCode;

  const chatId = 212212;
  const username = 'us3rnam3';
  const firstName = 'firstNam3';
  const lastName = 'lastNam3';
  
  it('should create auth code for user to register and check it\'s existence', function* () {
    authCode = yield auth.generateAuthCode();

    expect(authCode).to.be.a('string');

    const exists = yield auth.doesAuthCodeExist(authCode);
    const existsInvalidCode = yield auth.doesAuthCodeExist('dsafsfd');

    expect(exists).to.equal(true);
    expect(existsInvalidCode).to.equal(false);
  });

  it('should work properly with registration of chatId and prevention if code or chatId already used/registered', function* () {
    yield auth.registerUser(username, firstName, lastName, chatId, authCode);
    
    const alreadyRegistered = yield auth.isChatIdRegistered(chatId);
    
    expect(alreadyRegistered).to.equal(true);
    
    const codeAlreadyUsed = yield auth.isAuthCodeAlreadyUsed(authCode);
    
    expect(codeAlreadyUsed).to.equal(true);
    
    const user = yield auth.getUserByChatId(chatId);
    
    expect(user.firstName).to.equal(firstName);
    expect(user.lastName).to.equal(lastName);
    expect(user.username).to.equal(username);
  });

  it('should make user an admin by chat id and then make him regular user', function* () {
    expect(yield auth.isUserAdminByChatId(chatId)).to.equal(false);

    yield auth.setUserAdminByChatId(true, chatId);

    expect(yield auth.isUserAdminByChatId(chatId)).to.equal(true);

    yield auth.setUserAdminByChatId(false, chatId);

    expect(yield auth.isUserAdminByChatId(chatId)).to.equal(false);
  });
});