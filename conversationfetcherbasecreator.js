function createConversationFetcherJobBase (lib, arryopslib, utilslib) {
  'use strict';

  var q = lib.q,
    qlib = lib.qlib,
    JobBase = qlib.JobBase,
    zeroString = String.fromCharCode(0);

  function ConversationFetcherJobBase (conversationevent, fetchconvfunc, username, defer) {
    JobBase.call(this, defer);
    this.conversationevent = conversationevent;
    this.fetchconvfunc = fetchconvfunc;
    this.username = username;
    this.listener = null;
    this.notifications = [];
  }
  lib.inherit(ConversationFetcherJobBase, JobBase);
  ConversationFetcherJobBase.prototype.destroy = function () {
    this.notifications = null;
    if (this.listener) {
      this.listener.destroy();
    }
    this.listener = null;
    this.username = null;
    this.fetchconvfunc = null;
    this.conversationevent = null;
    JobBase.prototype.destroy.call(this);
  };
  ConversationFetcherJobBase.prototype.go = function () {
    if (this.listener) {
      return this.defer.promise;
    }
    this.listener = this.conversationevent.attach(this._onConversationNotification.bind(this));
    this.doFetchConversations().then(
      this.onConversationsFetched.bind(this),
      this.reject.bind(this)
    );
    return this.defer.promise;
  };
  ConversationFetcherJobBase.prototype.onConversationsFetched = function (convs) {
    console.log('onConversationsFetched', require('util').inspect(convs, {colors: true, depth: 7}));
    var name = this.username;
    this._crossCheck(convs);
    convs.sort(convsorter);
    this.resolve(convs.map(packer.bind(null, name)));
    name = null;
  };
  ConversationFetcherJobBase.prototype._crossCheck = function (convs) {
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
    var c = arryopslib.findElementWithProperty(convs, '0', ntf.id);
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
          rm: ntf.rm || c.rm,
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
    if (lib.isVal(ntf.rm) && !lib.isEqual(conv[1].rm, ntf.rm)) {
      conv[1].rm = ntf.rm;
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
    var sp, ind, myconv, ret;
    myconv = conv[1];
    myconv.nr = utilslib.nr2personal(myconv.nr, myname);
    ret = {
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

  ConversationFetcherJobBase.prototype.doFetchConversations = function () {
    throw new Error('doFetchConversations is not implemented in '+this.constructor.name);
  };
  ConversationFetcherJobBase.prototype._onConversationNotification = function (ntf) {
    if (!(ntf && lib.isArray(ntf.affected) && ntf.affected.length>0)) {
      return;
    }
    if (ntf.rcvdby) {
      return;
    }
    if (ntf.seenby) {
      return;
    }
    if (ntf.affected.indexOf(this.username)<0) {
      return;
    }
    //console.log('_onConversationNotification', ntf);
    this.notifications.push(ntf);
  };

  return ConversationFetcherJobBase;
}
module.exports = createConversationFetcherJobBase;

