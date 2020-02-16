import axios from 'axios';
import autobahn from 'autobahn'
import Connection from "~/pusher/Connection";

export default class Pusher {

  constructor(appID, publicKey, opt = {}) {
    this.settings = Object.assign({
      auth: {
        endpoint: '/push/auth',
        headers: {}
      },
    }, opt);
    this.session = null;
    this.appID = appID;
    this.connection = new Connection({
      url: 'ws://167.172.107.136:7474',
      realm: 'default',
      onchallenge: (session, method, extra) => {
        if (method === 'token') {
          return publicKey;
        }
      },
      authmethods: ['token']
    });
    this.connection.open();
  }

  async prepare() {
    let sess = null;
    this.connection.onopen = await function (session) {
      sess = session;
    };
    this.session = sess;
    await this.connection.open();
  }

  subscribe(channel, callback) {
    this.connection.getSession().then((session) => {
      channel = this.appID + '_' + channel;
      session.subscribe(channel, callback);
    });
  }

  subscribePrivate(channel, callback) {
    this.connection.getSession().then((session) => {
      axios.post(this.settings.auth.endpoint, {
        channel: channel + '.private',
        sessionID: session.id
      }, {
        headers: this.settings.auth.headers
      }).then(() => {
        channel = this.appID + '_' + channel + '.private';
        session.subscribe(channel, callback);
      })
    });
  }

  disconnect() {
    this.connection.close();
  }

};
