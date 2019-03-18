import { easeOut } from '@popmotion/easing'
import { mix } from '@popmotion/popcorn'
import arePassiveEventsSupported from 'are-passive-events-supported'
import durationProgress from 'callbag-duration-progress'
import flatten from 'callbag-flatten'
import fromEvent from 'callbag-from-event'
import map from 'callbag-map'
import merge from 'callbag-merge'
import subject from 'callbag-subject'
import subscribe from 'callbag-subscribe'
import takeUntil from 'callbag-take-until'
import pipe from 'pipeline.macro'
import { useCallback, useEffect } from 'react'
import useConstant from 'use-constant'

const ONCE = []
const PASSIVE = arePassiveEventsSupported() ? { passive: true } : undefined

export default function useSmoothScroll(axis, ref, easing = easeOut) {
  const scrollProperty = axis === 'x' ? 'scrollLeft' : 'scrollTop'
  const command$ = useConstant(subject)

  const scrollTo = useCallback((target, duration = 300) => {
    command$(1, [target, duration])
  }, ONCE)

  useEffect(
    () =>
      pipe(
        command$,
        map(([target, duration]) => {
          const start = ref.current[scrollProperty]
          return pipe(
            durationProgress(
              typeof duration === 'function'
                ? duration(Math.abs(target - start))
                : duration,
            ),
            map(p => mix(start, target, easing(p))),
            takeUntil(
              merge(
                fromEvent(ref.current, 'wheel', PASSIVE),
                fromEvent(ref.current, 'touchstart', PASSIVE),
              ),
            ),
          )
        }),
        flatten,
        subscribe(v => {
          ref.current[scrollProperty] = v
        }),
      ),
    ONCE,
  )

  return scrollTo
}