# reddit-monitor — src/main.py (excerpt)
import os
from src.reddit_fetcher import fetch_all_new_posts, load_processed_posts
from src.gemini_analyzer import analyze_batch, BATCH_SIZE
from src.prefilter import pre_filter
from src.queue_manager import add_to_queue, get_items_to_process, ITEMS_PER_RUN
from src.feishu_notifier import send_batch_to_feishu

def main():
    processed_ids = load_processed_posts()
    new_items = fetch_all_new_posts()
    filtered = pre_filter(new_items)
    add_to_queue(filtered, processed_ids)

    items = get_items_to_process(ITEMS_PER_RUN)
    for batch in chunk_list(items, BATCH_SIZE):
        results = analyze_batch(batch, batch_num)
        relevant = [item for item, r in zip(batch, results) if r.get('is_relevant')]
        send_batch_to_feishu(relevant)  # 飞书卡片：标题、AI 理由、参考回复
