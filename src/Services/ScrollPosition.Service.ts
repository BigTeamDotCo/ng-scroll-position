import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Subscriber } from "rxjs/Subscriber";

export interface ScrollPositionData {
  x: number,
  y: number
};

interface ScrollPositionTracker {
  observable: Observable<ScrollPositionData>,
  observerList: string[]
};

interface ObserverItems {
  [key: string]: Subscriber<ScrollPositionData>
}

@Injectable()
export class ScrollPositionService {
  private trackers: {
    [key: string]: ScrollPositionTracker
  } = {};
  private observerItems: ObserverItems = {};

  createObservable(trackerName: string) {
    return new Observable<ScrollPositionData>(observer => {
      const observerKey = atob(`${trackerName}-${observer.constructor.name}-${Date.now()}`);
      console.log('Adding subscription: ' + observerKey);
      this.observerItems[observerKey] = observer;
      this.trackers[trackerName].observerList = [...this.trackers[trackerName].observerList, observerKey];

      // unsubscribe cleanup
      return this._cleanUpObserver.bind(this, trackerName, observerKey);
    });
  }

  createPositionTracker(trackerName: string): (data: ScrollPositionData) => void {
    if (this.trackers[trackerName]) {
      throw new Error(`${this.constructor.name}: There is already a tracker that goes by the name ${trackerName}`);
    }
    const observable$ = this.createObservable(trackerName);
    this.trackers[trackerName].observable = observable$;
    Object.defineProperty(this, trackerName, this._createTrackerGetter(trackerName));
    this.trackers[trackerName].observable.finally(this._destroyObservable.bind(this, trackerName));
    return this._emitNextObserverValue.bind(this, trackerName);
  }

  _createTrackerGetter(trackerName: string) {
    return {
      get: this._getTrackerObservable.bind(this, trackerName)
    };
  }

  private _cleanUpObserver(trackerName: string, observerKey: string) {
    this.observerItems[observerKey].complete();
    delete this.observerItems[observerKey];
    this.trackers[trackerName].observerList = this.trackers[trackerName].observerList.filter(x => x !== trackerName);
  }

  private _destroyObservable(trackerName: string) {
    this.trackers[trackerName].observerList.forEach(observerKey => {
      this.observerItems[observerKey].complete();
      delete this.observerItems[observerKey];
    });
    this.trackers[trackerName].observerList = [];
    delete this.trackers[trackerName];
  }

  private _getTrackerObservable(trackerName) {
    return this.trackers[trackerName].observable;
  }

  private _emitNextObserverValue(trackerName, data: ScrollPositionData) {
    this.trackers[trackerName].observerList.forEach(observerKey => {
      this.observerItems[observerKey].next(data);
    });
  }
}
