import { test } from '@playwright/test';
import { stocklist } from '../data/datalist';
import { getStockSummaryUrlList, getStockChartUrlList, getSummaryValue, writeSummariesToFiles, acceptCookies, takeSnapshotForChart } from '../helpers/getStockHelper';
import { summaryInfo } from '../helpers/types';

test('get stock info', async ({ page, context }) => {
  // write stock summaries to the file
  const stockwithSummaryUrls = getStockSummaryUrlList(stocklist);
  const stockSummaries: summaryInfo[] = [];
  for (const stock of stockwithSummaryUrls) {
    await page.goto(stock.url);
    await acceptCookies(page);
    const stockSummary = await getSummaryValue(page, stock.name, stock.code);
    stockSummaries.push(stockSummary);
  }
  await writeSummariesToFiles(stockSummaries);
  // take snapshot for the stock chart
  const stockwithChartUrls = getStockChartUrlList(stocklist);
  for (const stock of stockwithChartUrls) {
    await page.goto(stock.url);
    await takeSnapshotForChart(page, stock.code);
  }
});
