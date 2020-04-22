import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import asyncFC from '../.';

interface SleepingProps {
  duration: number;
}

const Sleeping = asyncFC<SleepingProps>(
  async ({ duration }, subscription) => {
    await new Promise((res) => {
      const timeout = setTimeout(res, duration, true)

      subscription.addListener(() => {
        clearTimeout(timeout);
      });
    });

    return <h1>Woke up!</h1>;
  }, {
    dependencies: ({ duration }) => [duration],
    suspense: true,
  },
);

const useForceUpdate = () => {
  const [, setState] = React.useState();

  return React.useCallback(() => {
    setState({});
  }, []);
};

const Clock = ({ duration }: SleepingProps) => {
  const [finished, setFinished] = React.useState(true);
  const currentDur = React.useRef(0);
  const maxDur = React.useRef(duration);
  const forceUpdate = useForceUpdate();

  React.useEffect(() => {
    currentDur.current = 0;
    maxDur.current = duration;
    setFinished(false);
  }, [duration]);

  React.useEffect(() => {
    if (!finished) {
      let raf;
      let prev = performance.now();
  
      const callback = (dt) => {
        const actualDT = dt - prev;
        prev = dt;
        if (currentDur.current < maxDur.current) {
          currentDur.current += actualDT;
          forceUpdate();
          raf = requestAnimationFrame(callback);
        } else {
          setFinished(true);
        }
      };
  
      raf = requestAnimationFrame(callback);
  
      return () => {
        cancelAnimationFrame(raf);
      };
    }
  }, [finished]);

  if (finished) {
    return <h1>Finished!</h1>
  }

  return (
    <h1>Current time: {(currentDur.current / 1000).toFixed(2)} seconds</h1>
  );
};

const App = () => {
  const [state, setState] = React.useState(0);

  const onClick = React.useCallback(() => {
    setState(10000 * Math.random());
  }, []);

  return (
    <div>
      <Sleeping
        duration={state}
        fallback={<h1>Sleeping for {(state / 1000).toFixed(2)} seconds.</h1>}
      />
      <Clock duration={state} />
      <button onClick={onClick}>Go to sleep for 1 to 10 seconds!</button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
