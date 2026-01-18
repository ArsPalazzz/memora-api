export interface GetWeeklyDeskStats {
  weekly_attempts: {
    current: {
      mon: number;
      tue: number;
      wed: number;
      thu: number;
      fri: number;
      sat: number;
      sun: number;
    };
    previous: {
      mon: number;
      tue: number;
      wed: number;
      thu: number;
      fri: number;
      sat: number;
      sun: number;
    };
  };
}
