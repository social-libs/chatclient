function createConversationFetcher (lib) {
  'use strict';

  var q = lib.q,
    qlib = lib.qlib,
    JobBase = qlib.JobBase,
    zeroString = String.fromCharCode(0);

  function AllConversationsOfUserFetcherJob (conversationevent, allconvfunc, username, defer) {
    JobBase.call(this, defer);
    this.conversationevent = conversationevent;
    this.allconvfunc = allconvfunc;
    this.username = username;
    this.listener = null;
    this.notifications = [];
  }
  lib.inherit(AllConversationsOfUserFetcherJob, JobBase);
  AllConversationsOfUserFetcherJob.prototype.destroy = function () {
    this.notifications = null;
    if (this.listener) {
      this.listener.destroy();
    }
    this.listener = null;
    this.username = null;
    this.allconvfunc = null;
    this.conversationevent = null;
    JobBase.prototype.destroy.call(this);
  };
  AllConversationsOfUserFetcherJob.prototype.go = function () {
    if (this.listener) {
      return this.defer.promise;
    }
    this.listener = this.conversationevent.attach(this.onConversationNotification.bind(this));
    this.allconvfunc(this.username).then(
      this.onAllConversations.bind(this),
      this.reject.bind(this)
    );
    return this.defer.promise;
  };
  AllConversationsOfUserFetcherJob.prototype.onConversationNotification = function (ntf) {
    if (!(ntf && lib.isArray(ntf.affected) && ntf.affected.length>0)) {
      return;
    }
    if (ntf.affected.indexOf(this.username)<0) {
      return;
    }
    //console.log('onConversationNotification', ntf);
    this.notifications.push(ntf);
  };
  AllConversationsOfUserFetcherJob.prototype.onAllConversations = function (convs) {
    var name = this.username;
    this.crossCheck(convs);
    convs.sort(convsorter);
    this.resolve(convs.map(packer.bind(null, name)));
    name = null;
  };
  AllConversationsOfUserFetcherJob.prototype.crossCheck = function (convs) {
    var _c;
    if (!lib.isArray(convs)) {
      return;
    }
    if (!lib.isArray(this.notifications)) {
      return;
    }
    //console.log(this.notifications.length, 'notifications to process');
    _c = convs;
    this.notifications.forEach(check.bind(null, _c));
    _c = null;
  };

  function check (convs, ntf) {
    //console.log(convs.length, 'conversations vs', ntf);
    var c = lib.arryOperations.findElementWithProperty(convs, '0', ntf.id);
    ////console.log('=>', c);
    if (c) {
      compare (c, ntf);
    } else {
      //console.log('will push');
      /*console.log([
        ntf.id,
        {
          lastm: ntf.lastmessage
        }
      ]);*/
      //console.log('after');
      //console.log(convs[convs.length-1]);
      convs.push([
        ntf.id,
        {
          lastm: ntf.lastmessage
        }
      ]);
    }
  }

  function compare(conv, ntf) {
    if (!lib.isEqual(conv[1].lastm,ntf.lastmessage)) {
      //console.log('not equal');
      //console.log(conv);
      //console.log(ntf);
      conv[1].lastm = lib.extend({}, ntf.lastmessage);
      //console.log('so finally');
      //console.log(conv);
    } else {
      //console.log('nuttin 2 do');
    }
  }

  function crit (conv) {
    if (!(lib.isArray(conv) && conv.length===2)) {
      return -Infinity;
    }
    conv = conv[1];
    if (!conv.lastm) {
      return conv.cat;
    }
    return conv.lastm.created;
  }
  function convsorter(a, b) {
    return crit(b)-crit(a); //descending
  }

  function packer (myname, conv) {
    var sp, ind, ret = {
      id: conv[0],
      conv: conv[1],
      resolve: null
    };
    if (ret.conv.name) {
      return ret;
    }
    sp = conv[0].split(zeroString);
    ind = sp.length>1 ? sp.indexOf(myname) : -1;
    if (ind>=0) {
      sp.splice(ind,1);
      ret.resolve = sp.join(zeroString);
    }
    //console.log(conv, '=>', ret);
    return ret;
  }

  return AllConversationsOfUserFetcherJob;

}

module.exports = createConversationFetcher;
