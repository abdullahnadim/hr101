import { addMinutes, parse, format } from 'date-fns';

export interface ScheduleConfig {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  duration: number; // minutes
  interval: number; // minutes
  breakPeriods?: { start: string; end: string }[];
}

export function generateAutomatedSchedule(
  candidateIds: string[],
  config: ScheduleConfig
): Array<{ candidateId: string; startTime: string; endTime: string }> {
  const schedule = [];
  let currentTime = parse(config.startTime, 'HH:mm', new Date());

  for (const candidateId of candidateIds) {
    let slotFound = false;

    while (!slotFound) {
      const endTime = addMinutes(currentTime, config.duration);
      const currentTimeStr = format(currentTime, 'HH:mm');
      const endTimeStr = format(endTime, 'HH:mm');

      // Check against breaks (basic implementation)
      const inBreak = config.breakPeriods?.some((b) => 
        currentTimeStr >= b.start && currentTimeStr < b.end
      );

      if (inBreak) {
        currentTime = addMinutes(currentTime, config.interval || 5); // Shift by interval and check again
        continue;
      }

      schedule.push({
        candidateId,
        startTime: currentTimeStr,
        endTime: endTimeStr,
      });

      // Move to next slot accounting for duration + buffer
      currentTime = addMinutes(currentTime, config.duration + config.interval);
      slotFound = true;
    }
  }

  return schedule;
}