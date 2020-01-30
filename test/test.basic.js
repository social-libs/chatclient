var flooddescs = {
    luka2andra: {
      bankname: 'BasicBank',
      from: 'luka',
      to: 'andra',
      template: 'test'
    },
    ra2andra: {
      bankname: 'BasicBank',
      from: 'ra',
      to: 'andra',
      template: 'test'
    },
    ra2group: {
      bankname: 'BasicBank',
      from: 'ra',
      to: {
        groupname: '1',
        members: ['andra', 'luka_110', 'luka_73']
      },
      template: 'grouptest'
    },
    ra2manygroups: {
      bankname: 'BasicBank',
      from: 'ra',
      to: {
        groupname: 'raflood',
        members: ['andra', 'luka_110', 'luka_71']
      },
      template: 'grouptest'
    }
  };

var zeroString = String.fromCharCode(0);

// simulate browser core that has ArrayOperations

lib.arryOperations = require('allex_arrayoperationslowlevellib')(lib.extend, lib.readPropertyFromDotDelimitedString, lib.isFunction, lib.Map, lib.AllexJSONizingError);

function checkConversations (convs_ignored_because_global) {
  //console.log(require('util').inspect(Conversations, {depth:7, colors:true}));
}

function checklen (shouldbe, msgs) {
  return msgs.length===shouldbe;
}

function idder (msg) {
  return msg.id;
}

describe('Basic Test', function () {
  loadMochaIntegration('social_chatbanklib');
  it('Load Lib', function () {
    return setGlobal('Lib', require('..')(execlib));
  });
  it('Create a ChatBank', function () {
    return createGlobalChatBank('BasicBank', true);
  });
  it('Start floods', function () {
    startP2PMessageFlood(flooddescs.ra2andra);
    startP2PConversationFlood(flooddescs.luka2andra);
    startGroupMessageFlood(flooddescs.ra2group);
    startGroupConversationFlood(flooddescs.ra2manygroups);
    return q.delay(750, true);
  });
  it('All conversations for andra', function () {
    var job = new Lib.AllConversationsOfUserFetcherJob(BasicBank.conversationNotification.evnt, BasicBank.allConversationsOfUser.bind(BasicBank), 'andra');
    return setGlobal('Conversations', job.go()).then(
      checkConversations
    );
  });
  it('Stop other message floods', function () {
    //stop other floods
    stopFlood(flooddescs.luka2andra);
    stopFlood(flooddescs.ra2group);
    stopFlood(flooddescs.ra2manygroups);
    return q.delay(50, true);
  });
  it('Messages for the flooded Conversation', function () {
    var len = 130,
      job = new Lib.MessageFetcherJob(BasicBank.conversationNotification.evnt, BasicBank.messagesOfConversation.bind(BasicBank), 'andra', 'andra'+zeroString+'ra', null, len);
    return expect(job.go().then(
      setGlobal.bind(null, 'Messages')
    ).then(
      checklen.bind(null, len)
    )).to.eventually.equal(true);
    //qlib.promise2console(job.go(), 'messages');
  });
  it('Fetched mids', function () {
    var ids = Messages.map(idder);
    console.log('first ids', ids.slice(0,10));
    console.log('last ids', ids.slice(-10));
  });
  it('Stop floods', function () {
    stopFlood(flooddescs.ra2andra);
  });
});
