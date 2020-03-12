function createConversationFetcher (lib, ConversationFetcherJobBase) {
  'use strict';

  var q = lib.q,
    qlib = lib.qlib,
    zeroString = String.fromCharCode(0);

  function AllConversationsOfUserFetcherJob (conversationevent, allconvfunc, username, defer) {
    ConversationFetcherJobBase.call(this, conversationevent, allconvfunc, username, defer);
  }
  lib.inherit(AllConversationsOfUserFetcherJob, ConversationFetcherJobBase);
  AllConversationsOfUserFetcherJob.prototype.destroy = function () {
    ConversationFetcherJobBase.prototype.destroy.call(this);
  };
  AllConversationsOfUserFetcherJob.prototype.doFetchConversations = function () {
    return this.fetchconvfunc(this.username);
  };
  return AllConversationsOfUserFetcherJob;

}

module.exports = createConversationFetcher;
