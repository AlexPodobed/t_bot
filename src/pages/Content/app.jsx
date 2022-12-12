import React, { useCallback, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { BGEvents, Events } from '../../constants/events';
import './app.css';
import moment from 'moment';
import { Counter } from './Counter';


function injectStyles(){
  console.log('here')

  const styles = document.createElement('style');

  styles.innerHTML =
`  
  .raidList table .troops {
      width: 40px !important;
      min-width: 40px !important;
  }
  
  
  #raidList .villageWrapper .dropContainer .raidList .raidListContent table td.lastRaid {
    width: 30% !important;
  }
  `;

  document.body.appendChild(styles)


}

const App = () => {
  const [state, setState] = useState({
    initialized: false,
    queue: [],
    nextSchedule: null,
  });

  const [initialized, setInitialized] = useState(false);


  const initiate = useCallback(() => {
    chrome.runtime.sendMessage({ event: Events.Bootstrap }, function (response) {
      setState(response)
      setInitialized(true)
    });
  }, []);



  useEffect(() => {
    const hash = window.location.hash.split('#')[1];

    if(!state.queue.length || !hash) return;

    const target = state.queue.find(item => item.timestamp === hash);

    if(target && target.status === 'reloading'){
      console.log('>>>>>>>>>>>>>>>FIRE', hash)
      setTimeout(() => {
        document.querySelectorAll('#raidList button[onclick="Travian.Game.RaidList.startRaid(3209)"]')[1].click()

        chrome.runtime.sendMessage({ event: Events.ConfirmFarm, timestamp: hash }, function (response) {
          setState(response)
          window.location.hash = '';
        });
      }, 300);
    }



  }, [state.queue]);


  useEffect(() => {
    initiate();
    injectStyles();

    const listen = (msg, sender, res) => {
      switch (msg?.event) {
        case BGEvents.Start:
          console.log('bg start TBD', msg.timestamp);
          // Travian.Game.RaidList.startRaid(3209)

          // todo: go here
          window.location.href = `https://ts20.x2.international.travian.com/build.php?id=39&gid=16&tt=99#${msg.timestamp}`;
          return res(true);

        case BGEvents.UpdateState:
          setState(msg.payload);
          return;
        default:
          console.log('unhandled', msg)
      }
    }

    chrome.runtime.onMessage.addListener(listen);

    return () => {
      chrome.runtime.onMessage.removeListener(listen);
    }

  }, []);


  const toggleFarm = useCallback(() => {
    chrome.runtime.sendMessage({ event: Events.ToggleFarm, payload: !state.running }, function (response) {
      setState(response)
    });

  }, [state]);


  if (!initialized) {
    return (
      <div className="botRoot">
        initializing...
      </div>
    )
  }

  return <div className="botRoot">
    <div><b>state:</b>{state.running ? 'running' : 'not-running'}</div>

    <button className="botButton" onClick={toggleFarm}>{state.running ? 'stop farm' : 'start farm'} </button>
    <div>
      <b>next attack:</b> {state.nextSchedule && <Counter timestamp={state.nextSchedule}/>}
    </div>
    <div>
      {state.queue.map((item) => {
        return (
          <div key={item.timestamp}>
            <span>{moment(item.timestamp).format('HH:mm:ss')}</span> | <b>{item.status}</b>
          </div>
        )
      })}
    </div>
  </div>
}


export function bootstrapReactApp(el) {
  render(<App/>, el)
}


/***
 *   Emit from content script ->> background
 * */
// chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
//   console.log(response.farewell);
// });


/***
 *  Subscribe for Events
 * */
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   // message - payload
//   // sender -
//   // sendResponse -> send back to main script
// })
