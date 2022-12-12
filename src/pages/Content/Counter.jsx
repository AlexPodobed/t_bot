import React, { memo, useEffect, useState } from 'react';
import moment from 'moment/moment';

export const Counter = memo(({timestamp}) => {
  const [time, setCounter] = useState('');

  useEffect(() => {

    function formatTime(){
      const diff = moment().diff(timestamp);
      const duration = moment.duration(Math.abs(diff));

      const timeValue = moment.utc(duration.as('milliseconds')).format('HH:mm:ss')
      setCounter(timeValue);
    }

    const id = setInterval(formatTime, 1000);
    formatTime();

    return () => {
      clearInterval(id);
    }
  }, [timestamp]);

  return <span>{time}</span>
})