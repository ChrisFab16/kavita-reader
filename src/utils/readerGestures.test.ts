import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  EDGE_ZONE_RATIO,
  createDoubleTapPressHandler,
  getTapZone,
  resolveTapAction,
  clampPinchScale,
  normalizeZoomScale,
  getEdgeZoneWidths,
} from './readerGestures';

describe('getTapZone', () => {
  const width = 400;
  const edge = width * EDGE_ZONE_RATIO;

  it('classifies left third', () => {
    assert.equal(getTapZone(0, width), 'left');
    assert.equal(getTapZone(edge - 1, width), 'left');
  });

  it('classifies right third', () => {
    assert.equal(getTapZone(width - 1, width), 'right');
    assert.equal(getTapZone(width - edge + 1, width), 'right');
  });

  it('classifies center band', () => {
    assert.equal(getTapZone(edge + 1, width), 'center');
    assert.equal(getTapZone(width - edge - 1, width), 'center');
  });
});

describe('resolveTapAction', () => {
  const width = 1000;

  it('at fit with chrome hidden: L/R turn pages, center toggles chrome', () => {
    assert.equal(
      resolveTapAction({ x: 50, viewportWidth: width, isZoomed: false, chromeVisible: false }),
      'previous-page'
    );
    assert.equal(
      resolveTapAction({ x: 950, viewportWidth: width, isZoomed: false, chromeVisible: false }),
      'next-page'
    );
    assert.equal(
      resolveTapAction({ x: 500, viewportWidth: width, isZoomed: false, chromeVisible: false }),
      'toggle-chrome'
    );
  });

  it('when chrome visible: any tap dismisses chrome', () => {
    assert.equal(
      resolveTapAction({ x: 50, viewportWidth: width, isZoomed: false, chromeVisible: true }),
      'toggle-chrome'
    );
    assert.equal(
      resolveTapAction({ x: 950, viewportWidth: width, isZoomed: true, chromeVisible: true }),
      'toggle-chrome'
    );
  });

  it('when zoomed: L/R turn pages; center is free for pan', () => {
    assert.equal(
      resolveTapAction({ x: 50, viewportWidth: width, isZoomed: true, chromeVisible: false }),
      'previous-page'
    );
    assert.equal(
      resolveTapAction({ x: 950, viewportWidth: width, isZoomed: true, chromeVisible: false }),
      'next-page'
    );
    assert.equal(
      resolveTapAction({ x: 500, viewportWidth: width, isZoomed: true, chromeVisible: false }),
      'none'
    );
  });
});

describe('clampPinchScale', () => {
  it('clamps between 1 and max', () => {
    assert.equal(clampPinchScale(1, 2, 4), 2);
    assert.equal(clampPinchScale(2, 3, 4), 4);
    assert.equal(clampPinchScale(2, 0.5, 4), 1);
  });
});

describe('normalizeZoomScale', () => {
  it('snaps near-fit to 1', () => {
    assert.equal(normalizeZoomScale(1.005, 4), 1);
    assert.equal(normalizeZoomScale(2, 4), 2);
    assert.equal(normalizeZoomScale(9, 4), 4);
  });
});

describe('getEdgeZoneWidths', () => {
  it('splits 20% per side', () => {
    assert.deepEqual(getEdgeZoneWidths(400), { leftWidth: 80, rightWidth: 80 });
  });
});

describe('createDoubleTapPressHandler', () => {
  it('fires single after delay when only one press', () => {
    let now = 0;
    const timers: Array<{ fn: () => void; at: number }> = [];
    const singles: number[] = [];
    const doubles: number[] = [];

    const handler = createDoubleTapPressHandler({
      onSingle: () => singles.push(now),
      onDouble: () => doubles.push(now),
      delayMs: 300,
      now: () => now,
      schedule: (fn, ms) => {
        const id = timers.length;
        timers.push({ fn, at: now + ms });
        return id as unknown as ReturnType<typeof setTimeout>;
      },
      cancel: (id) => {
        void id;
      },
    });

    handler();
    assert.equal(singles.length, 0);
    assert.equal(timers.length, 1);
    now = 300;
    timers[0].fn();
    assert.deepEqual(singles, [300]);
    assert.deepEqual(doubles, []);
  });

  it('fires double when two presses within delay', () => {
    let now = 0;
    const singles: number[] = [];
    const doubles: number[] = [];

    const handler = createDoubleTapPressHandler({
      onSingle: () => singles.push(now),
      onDouble: () => doubles.push(now),
      delayMs: 300,
      now: () => now,
      schedule: (fn, ms) => {
        void fn;
        void ms;
        return 1 as unknown as ReturnType<typeof setTimeout>;
      },
      cancel: () => {},
    });

    handler();
    now = 100;
    handler();
    assert.deepEqual(doubles, [100]);
    assert.deepEqual(singles, []);
  });
});
