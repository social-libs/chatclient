function createMessageFetcher (lib, utilslib) {
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
    if (!(ntf && ntf.id===this.conversationid && ntf.mids.length>0)) {
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
    this.notifications.push(lib.extend({}, ntf.lastm, {id:ntf.mids[1]}));
  };
  MessageFetcherJob.prototype.onMessages = function (msgs) {
    var lastmsgid, allmsgs, myid;
    lastmsgid = msgs.length>0 ? msgs[msgs.length-1].id : undefined;
    allmsgs = msgs.concat(this.notifications.filter(gt.bind(null, lastmsgid)).slice(-this.howmany));
    //console.log('onMessages', msgs);
    //console.log('onMessages my notifications', this.notifications);
    //console.log('onMessages', msgs[msgs.length-1]);
    //console.log('lastmsgid', lastmsgid);
    msgs.forEach(this.checkForNotRcvdByUserid.bind(this));
    myid = this.userid;
    allmsgs.forEach(personalizer.bind(null, myid));
    myid = null;
    this.resolve(allmsgs);
  };
  MessageFetcherJob.prototype.checkForNotRcvdByUserid = function (msg) {
    //console.log('checkForNotRcvdByUserid', msg);
    if (!msg) {
      return;
    }
    if (msg.from === null) {
      return;
    }
    if (msg.rcvd) {
      return;
    }
    this.notify({
      conversationid: this.conversationid,
      userid: this.userid,
      messageid: msg.id
    });
  };

  function personalizer (myid, msg) {
    utilslib.rcvdseen2personal(msg, lib.isArray(msg.rcvdby), myid, 'rcvd', false);
    utilslib.rcvdseen2personal(msg, lib.isArray(msg.rcvdby), myid, 'seen', false);
  }

  function gt (lastmsgid, msg) {
    return msg.id>lastmsgid;
  }

  return MessageFetcherJob;
}

module.exports = createMessageFetcher;
