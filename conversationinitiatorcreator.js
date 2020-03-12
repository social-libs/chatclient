function createConversationFetcher (lib, ConversationFetcherJobBase) {
  'use strict';

  var q = lib.q,
    qlib = lib.qlib,
    zeroString = String.fromCharCode(0);

  function ConversationsOfUserForUsersInitiatorJob (conversationevent, allconvfunc, username, usernames, defer) {
    ConversationFetcherJobBase.call(this, conversationevent, allconvfunc, username, defer);
    this.usernames = usernames;
  }
  lib.inherit(ConversationsOfUserForUsersInitiatorJob, ConversationFetcherJobBase);
  ConversationsOfUserForUsersInitiatorJob.prototype.destroy = function () {
    this.usernames = null;
    ConversationFetcherJobBase.prototype.destroy.call(this);
  };
  ConversationsOfUserForUsersInitiatorJob.prototype.doFetchConversations = function () {
    return this.fetchconvfunc(this.username, this.usernames);
  };
  return ConversationsOfUserForUsersInitiatorJob;

}

module.exports = createConversationFetcher;
