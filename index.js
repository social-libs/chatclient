function createLib (execlib) {


  return {
    AllConversationsOfUserFetcherJob: require('./conversationfetchercreator')(execlib.lib),
    MessageFetcherJob: require('./messagefetchercreator')(execlib.lib)
  };
}

module.exports = createLib;
