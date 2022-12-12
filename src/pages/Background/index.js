import { BGEvents, Events } from '../../constants/events';

console.log('This is the background page.');
console.log('Put the background scripts here.');

const config = {
  intervalTime: 10 * 60 * 1000
}

class Bot {
  intervalId;
  timeoutId;
  state = {
    running: false,
    tabId: null,
    queue: [],
    nextSchedule: null,
  };


  getState() {
    return this.state;
  }

  emitMessage(message, cb) {
    console.log('emit', message.event, message?.timestamp);
    chrome.tabs.sendMessage(this.state.tabId, message, cb);
  }


  emitUpdateState(){
    this.emitMessage({event: BGEvents.UpdateState, payload: this.state});
  }

  emitStartRaid() {
    const timestamp = new Date().toISOString();
    const message = {
      event: BGEvents.Start,
      payload: [],
      timestamp,
    };
    this.state.nextSchedule = new Date().getTime() + config.intervalTime;
    this.state.queue.unshift({ timestamp, status: 'pending' });
    this.state.queue = this.state.queue.slice(0, 5);
    this.emitUpdateState();
    this.emitMessage(message, (status) => {
      const target = this.state.queue.find(item => item.timestamp === timestamp);
      if(target) {
        target.status = !status ? 'bad' : 'reloading';
      }else {
        console.log('No target', timestamp)
      }
      this.emitUpdateState();
    })
  }

  updateQueueReloadingState(timestamp){
    const target = this.state.queue.find(item => item.timestamp === timestamp);
    if(target){
      target.status = 'ok';
    }
  }

  start() {
    this.state.running = true;
    this.intervalId = setInterval(() => this.emitStartRaid(), config.intervalTime);
    this.emitStartRaid();
  }

  stop() {
    clearInterval(this.intervalId);
    this.state.running = false;
    this.state.queue = [];
    this.state.nextSchedule = null;
  }

  subscribe() {
    chrome.runtime.onMessage.addListener((msg, sender, res) => {
      switch (msg?.event) {
        case Events.Bootstrap: {
          // set tab ID for communication
          this.state.tabId = sender.tab.id;
          return res(this.state)
        }

        case Events.ConfirmFarm: {
          this.updateQueueReloadingState(msg.timestamp)
          return res(this.state)
        }

        case Events.ToggleFarm:
          const running = msg.payload;
          if (running) {
            this.start()
          } else {
            this.stop()
          }
          return res(this.state)

        default:
          return null
      }
    });
  }
}

const bot = new Bot();
bot.subscribe();