export interface stockInfo {
    name: string;
    code: string;
}

export type stockInfoWithUrl = stockInfo & { url: string };

export type summaryInfo = Record<string, string>;