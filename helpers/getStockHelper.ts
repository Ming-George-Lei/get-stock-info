import { stockInfo, summaryInfo, stockInfoWithUrl } from "./types";
import { Page } from "@playwright/test";
import path from 'path';
import fs from 'fs/promises';

const STOCK_URL_PREFIX = "https://www.nasdaq.com/market-activity/stocks";

export function getStockSummaryUrlList(list: stockInfo[]): stockInfoWithUrl[] {
    const stocks: stockInfoWithUrl[] = [];
    for (const info of list) {
        stocks.push({ ...info, url: STOCK_URL_PREFIX + "/" + info.code.toLowerCase() })
    }
    return stocks;
}

export function getStockChartUrlList(list: stockInfo[]): stockInfoWithUrl[] {
    const stocks: stockInfoWithUrl[] = [];
    for (const info of list) {
        stocks.push({ ...info, url: STOCK_URL_PREFIX + "/" + info.code + "/" + "advanced-charting" })
    }
    return stocks;
}

export async function acceptCookies(page: Page) {
    const acceptCookies = page.getByRole('button', { name: 'Accept All Cookies' });
    if (await acceptCookies.count() > 0) {
        await acceptCookies.click();
    }
}

export async function getSummaryValue(page: Page, stockName: string, stockCode: string): Promise<summaryInfo> {
    await page.getByText('Key Data').nth(0).scrollIntoViewIfNeeded();

    const locator = page.locator('nsdq-table');
    const summary = await locator.evaluate((elem, stockInfo) => {
        const root = elem.shadowRoot!;
        const rows = root.querySelectorAll('.table-row');
        let summary: summaryInfo = {};
        summary['Name'] = stockInfo.Name;
        summary['Code'] = stockInfo.Code;
        for (let i = 0; i < rows.length; i++) {
            const currentRow = rows[i];
            const name = currentRow.querySelectorAll('.table-cell')[0].textContent;
            let value = currentRow.querySelectorAll('.table-cell')[1].textContent;
            if (name && value) {
                value = value.trim().replace(/[\n]/g, '');
                summary[name] = value;
            }
        }
        return summary;
    }, { Name: stockName, Code: stockCode });

    return summary;
}

function getCurrentDate(): string {
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");

    return `${year}${month}${day}`;
}

function getDirectoryPrefix(): string {
    return path.join("results", "stock_");
}

async function wait(ms: number): Promise<void> {
    await new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function takeSnapshotForChart(page: Page, stockCode: string): Promise<void> {

    const chartlocator = page.locator('#chartholder').locator('iframe');
    await chartlocator.click();
    const rangeLocator = chartlocator.contentFrame().locator('cq-show-range');
    const prefix = getDirectoryPrefix();
    const currentDate = getCurrentDate();
    const folder = `${prefix}${currentDate}`;

    // click 1 day
    const oneDayRange = rangeLocator.getByText('1D');
    await oneDayRange.click();
    const oneDayRangeName = `${stockCode}-1D.png`;
    const oneDayPath = path.join(folder, oneDayRangeName);
    await wait(15000);
    await page.screenshot({ type: 'png', path: oneDayPath });

    // click 5 day
    const fiveDayRange = rangeLocator.getByText('5D');
    await fiveDayRange.click();
    const ficeDayRangeName = `${stockCode}-5D.png`;
    const fiveDayPath = path.join(folder, ficeDayRangeName);
    await wait(15000);
    await page.screenshot({ type: 'png', path: fiveDayPath });
    // click 1 month
    const oneMonthRange = rangeLocator.getByText('1M');
    await oneMonthRange.click();
    const oneMonthRangeName = `${stockCode}-1M.png`;
    const oneMonthPath = path.join(folder, oneMonthRangeName);
    await wait(15000);
    await page.screenshot({ type: 'png', path: oneMonthPath });
    // click 3 month
    const threeMonthRange = rangeLocator.getByText('3M');
    await threeMonthRange.click();
    const threeMonthRangeName = `${stockCode}-3M.png`;
    const threeMonthPath = path.join(folder, threeMonthRangeName);
    await wait(15000);
    await page.screenshot({ type: 'png', path: threeMonthPath });
    // click 6 month
    const sixMonthRange = rangeLocator.getByText('6M');
    await sixMonthRange.click();
    const sixMonthRangeName = `${stockCode}-6M.png`;
    const sixMonthPath = path.join(folder, sixMonthRangeName);
    await wait(15000);
    await page.screenshot({ type: 'png', path: sixMonthPath });
}

export async function writeSummariesToFiles(summaries: summaryInfo[]): Promise<void> {
    // write data
    const prefix = getDirectoryPrefix();
    const currentDate = getCurrentDate();
    const lastUpdated = currentDate;

    await fs.writeFile(`${prefix}${currentDate}.json`, JSON.stringify(summaries, null, 2));
    await fs.writeFile(`${prefix}latest.json`, JSON.stringify(summaries, null, 2));
    await fs.writeFile(`${prefix}last_updated.json`, JSON.stringify([{ lastUpdated }]));
}