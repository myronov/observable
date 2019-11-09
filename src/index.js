import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";

let accessedProperties = [];
const derivationGraph = [];

function observable(targetObject) {
  const ObservableObject = {};

  const keys = Object.keys(targetObject);

  const id = Math.random();

  function getId(key) {
    return `Observable(${id}: ${key})`;
  }
  keys.forEach(key => {
    const id = getId(key);

    ObservableObject[key] = targetObject[key];

    if (typeof targetObject[key] !== "function") {
      Object.defineProperty(ObservableObject, key, {
        get() {
          accessedProperties.push(id);
          return targetObject[key];
        },

        set(val) {
          targetObject[key] = val;

          if (derivationGraph[id]) {
            derivationGraph[id].forEach(fn => {
              fn();
            });
          }
        }
      });
    }
  });

  return ObservableObject;
}

function createReaction(whatShouldWeRunOnChange) {
  return {
    track(functionWhereWeUseObservables) {
      accessedProperties = [];
      functionWhereWeUseObservables();

      console.log(derivationGraph);
      console.log(accessedProperties);

      accessedProperties.forEach(id => {
        derivationGraph[id] = derivationGraph[id] || [];

        if (derivationGraph[id].indexOf(whatShouldWeRunOnChange) < 0) {
          derivationGraph[id].push(whatShouldWeRunOnChange);
        }
      });
    }
  };
}

function autorun(cb) {
  const reaction = createReaction(cb);

  reaction.track(cb);
}

const store = observable({
  count: 0,
  somethingElse: 0,

  increment() {
    this.count += 1;
  }
});

autorun(() => {
  console.log("count autorun", store.count);
});

function useForceUpdate() {
  const [, set] = useState(0);

  return () => set(val => val + 1);
}

function observer(baseComponent) {
  const wrapper = () => {
    const forceUpdate = useForceUpdate();
    const reaction = useRef(null);

    if (!reaction.curent) {
      reaction.current = createReaction(forceUpdate);
    }

    let result;

    reaction.current.track(() => {
      result = baseComponent();
    });
  };
}
