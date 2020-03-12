function createMessageFetcher (lib) {
  var q = lib.q,
    qlib = lib.qlib,
    JobBase = qlib.JobBase,
    zeroString = String.fromCharCode(0);

  function MessageFetcherJob (conversationevent, msgfunc, userid, conversationid, oldestmessageid, howmany, defer) {
    JobBase.call(this, defer);
    this.conversationevent = conversationevent;
    this.msgfunc = msgfunc;
    this.userid = userid;
    this.conversationid = conversationid;
    this.oldestmessageid = oldestmessageid;
    this.howmany = howmany;
    this.listener = null;
    this.notifications = [];
  }
  lib.inherit(MessageFetcherJob, JobBase);
  MessageFetcherJob.prototype.destroy = function () {
    this.notifications = null;
    if (this.listener) {
      this.listener.destroy();
    }
    this.listener = null;
    this.howmany = null;
    this.oldestmessageid = null;
    this.conversationid = null;
    this.userid = null;
    this.msgfunc = null;
    this.conversationevent = null;
    JobBase.prototype.destroy.call(this);
  };
  MessageFetcherJob.prototype.go = function () {
    if (!this.oldestmessageid) {
      this.listener = this.conversationevent.attach(this.onConversationNotification.bind(this));
    }
    this.msgfunc(this.userid, this.conversationid, this.oldestmessageid, this.howmany).then(
      this.onMessages.bind(this),
      this.reject.bind(this)
    );
    return this.defer.promise;
  };
  MessageFetcherJob.prototype.onConversationNotification = function (ntf) {
    //console.log('onConversationNotification', ntf);
    if (!(ntf && ntf.id===this.conversationid && ntf.mids.length===2)) {
      //console.error(ntf);
      //console.error('ne valja');
      return;
    }
    if (ntf.rcvdby) {
      return;
    }
    if (ntf.seenby) {
      return;
    }
    this.notifications.push(lib.extend({}, ntf.lastmessage, {id:ntf.mids[1]}));
  };
  MessageFetcherJob.prototype.onMessages = function (msgs) {
    var lastmsgid = msgs.length>0 ? msgs[msgs.length-1].id : undefined;
    //console.log('onMessages', msgs);
    //console.log('onMessages my notifications', this.notifications);
    //console.log('onMessages', msgs[msgs.length-1]);
    //console.log('lastmsgid', lastmsgid);
    this.resolve(msgs.concat(this.notifications.filter(gt.bind(null, lastmsgid))).slice(-this.howmany));
  };

  function gt (lastmsgid, msg) {
    return msg.id>lastmsgid;
  }

  return MessageFetcherJob;
}

module.exports = createMessageFetcher;
