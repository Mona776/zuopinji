// tiktok-trends-daily — src/index.ts (excerpt)
import dayjs from 'dayjs';
import { config, loadKeywords, flattenKeywords } from './config';
import { TikTokService } from './services/tiktok';
import { AnalyzerService } from './services/analyzer';
import { AISummaryService } from './services/ai-summary';

async function generateDailyReport(): Promise<void> {
  console.log('📊 开始生成 TikTok 情报日报...\n');

  const keywordList = flattenKeywords(loadKeywords());
  const results = await new TikTokService().searchMultipleKeywords(
    keywordList.map((k) => ({ keyword: k.keyword, category: k.category, circle: k.circle })),
    config.videosPerKeyword
  );

  const validResults = results.filter((r) => r.videos.length > 0);
  const analyses = new AnalyzerService(loadKeywords()).analyzeKeywordResults(validResults);

  let aiSummary;
  if (new AISummaryService().isAvailable()) {
    aiSummary = await new AISummaryService().generateSummary(analyses);
  }

  // → Markdown 报告上传 Gist，精简版推送飞书
  const fullReportUrl = await gistService.createReportGist(markdownReport, dayjs().format('YYYY-MM-DD'));
  await reportGenerator.generateAndSend(report, fullReportUrl);
}
