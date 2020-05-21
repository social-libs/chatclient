function createLib (execlib) {
  'use strict';
  return execlib.loadDependencies('client', ['allex:arrayoperations:lib', 'social:chatutils:lib'], libCreator.bind(null, execlib));
}
function libCreator (execlib, arryopslib, utilslib) {
  'use strict';

  var ConversationFetcherJobBase = require('./conversationfetcherbasecreator')(execlib.lib, arryopslib, utilslib);

  return {
    ConversationFetcherJobBase: ConversationFetcherJobBase,
    AllConversationsOfUserFetcherJob: require('./conversationfetchercreator')(execlib.lib, ConversationFetcherJobBase),
    ConversationsOfUserForUsersInitiatorJob: require('./conversationinitiatorcreator')(execlib.lib, ConversationFetcherJobBase, utilslib),
    MessageFetcherJob: require('./messagefetchercreator')(execlib.lib, utilslib)
  };
}

module.exports = createLib;
