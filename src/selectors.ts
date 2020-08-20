// * Defined in ./redux/store
// type RootState = ReturnType<typeof rootReducer>;

// @ts-ignore
export const getDailyBreakdownData = (state: RootState) =>
  state.campaigns.campaignOverview.dailyBreakdown.data;
// @ts-ignore
export const getDailyBreakdownMeta = (state: RootState) =>
  state.campaigns.campaignOverview.dailyBreakdown.meta;