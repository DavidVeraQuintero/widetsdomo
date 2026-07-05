import { useEffect } from 'react';

export function useAlarmTimers(alarmState, config, onTimerUpdate, onTimerComplete) {
  useEffect(() => {
    // Exit Delay Timer (contando hacia 0 antes de armarse)
    if (alarmState.timers.exitDelay !== null && alarmState.timers.exitDelay > 0) {
      const timer = setTimeout(() => {
        onTimerUpdate('exitDelay', alarmState.timers.exitDelay - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (alarmState.timers.exitDelay === 0) {
      onTimerComplete('exitDelay');
    }
  }, [alarmState.timers.exitDelay, onTimerUpdate, onTimerComplete]);

  useEffect(() => {
    // Entry Delay Timer (contando hacia 0 cuando zona se activa)
    if (alarmState.timers.entryDelay !== null && alarmState.timers.entryDelay > 0) {
      const timer = setTimeout(() => {
        onTimerUpdate('entryDelay', alarmState.timers.entryDelay - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (alarmState.timers.entryDelay === 0) {
      onTimerComplete('entryDelay');
    }
  }, [alarmState.timers.entryDelay, onTimerUpdate, onTimerComplete]);

  useEffect(() => {
    // Alarm Duration Timer
    if (alarmState.timers.alarmDuration !== null && alarmState.timers.alarmDuration > 0) {
      const timer = setTimeout(() => {
        onTimerUpdate('alarmDuration', alarmState.timers.alarmDuration - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (alarmState.timers.alarmDuration === 0) {
      onTimerComplete('alarmDuration');
    }
  }, [alarmState.timers.alarmDuration, onTimerUpdate, onTimerComplete]);
}
