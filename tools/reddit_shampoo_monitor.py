#!/usr/bin/env python3
"""
Script to run shampoo discussion monitoring on Reddit for the last 7 days
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from agents.reddit_miner.reddit_mining import ShampooRedditMonitor
import json
from datetime import datetime


def generate_markdown_report(data):
    """Generate a human-readable markdown report from the collected data"""

    if not data or data['total_posts'] == 0:
        return "# Shampoo Discussion Monitoring Report\n\nNo discussions found for the specified period."

    report = f"""# Shampoo Discussion Monitoring Report

**Report Period:** {data['period']}
**Generated:** {data['collection_date']}

## Summary Statistics

- Total Posts: {data['total_posts']}
- Total Comments: {data['total_comments']}
- Average Upvotes per Post: {data['analysis']['engagement_metrics']['average_upvotes']}
- Average Comments per Post: {data['analysis']['engagement_metrics']['average_comments']}

## Sentiment Analysis

| Sentiment | Count | Percentage |
|-----------|-------|------------|
| Positive | {data['analysis']['sentiment_breakdown']['positive']} | {round((data['analysis']['sentiment_breakdown']['positive']/(data['total_posts']+data['total_comments']))*100, 1) if data['total_posts']+data['total_comments'] > 0 else 0}% |
| Neutral | {data['analysis']['sentiment_breakdown']['neutral']} | {round((data['analysis']['sentiment_breakdown']['neutral']/(data['total_posts']+data['total_comments']))*100, 1) if data['total_posts']+data['total_comments'] > 0 else 0}% |
| Negative | {data['analysis']['sentiment_breakdown']['negative']} | {round((data['analysis']['sentiment_breakdown']['negative']/(data['total_posts']+data['total_comments']))*100, 1) if data['total_posts']+data['total_comments'] > 0 else 0}% |

## Top Subreddits Discussing Shampoo

1. {data['analysis']['top_subreddits'][0]['name']} ({data['analysis']['top_subreddits'][0]['count']} mentions)
2. {data['analysis']['top_subreddits'][1]['name']} ({data['analysis']['top_subreddits'][1]['count']} mentions)
3. {data['analysis']['top_subreddits'][2]['name']} ({data['analysis']['top_subreddits'][2]['count']} mentions)

## Sample Posts

"""

    # Add sample posts
    for i, post in enumerate(data['posts'][:5]):  # Show first 5 posts
        report += f"### Post {i+1}\n"
        report += f"- **Subreddit:** r/{post['subreddit']}\n"
        report += f"- **Title:** {post['title']}\n"
        report += f"- **Upvotes:** {post['score']}\n"
        report += f"- **Comments:** {post['num_comments']}\n"
        report += f"- **URL:** {post['permalink']}\n\n"

    report += "## Key Insights\n\n"

    pos_pct = round((data['analysis']['sentiment_breakdown']['positive']/(data['total_posts']+data['total_comments']))*100, 1) if data['total_posts']+data['total_comments'] > 0 else 0
    neg_pct = round((data['analysis']['sentiment_breakdown']['negative']/(data['total_posts']+data['total_comments']))*100, 1) if data['total_posts']+data['total_comments'] > 0 else 0

    if pos_pct > neg_pct:
        report += "- Overall sentiment is **positive**, indicating satisfaction with shampoo products\n"
    elif neg_pct > pos_pct:
        report += "- Overall sentiment is **negative**, suggesting areas for improvement\n"
    else:
        report += "- Sentiment is relatively **balanced** between positive and negative opinions\n"

    if data['analysis']['engagement_metrics']['average_upvotes'] > 10:
        report += "- Posts are receiving high engagement, indicating strong interest in the topic\n"
    else:
        report += "- Posts have moderate engagement, suggesting steady but not exceptional interest\n"

    return report


def main():
    """Main function to run the analysis and generate report"""
    print("Starting shampoo discussion monitoring for the last 7 days...")

    # Create output directories if they don't exist
    os.makedirs("data/raw_data", exist_ok=True)
    os.makedirs("data/processed_data", exist_ok=True)
    os.makedirs("data/reports", exist_ok=True)

    try:
        # Create monitor instance
        monitor = ShampooRedditMonitor()

        # Collect data for the last 7 days
        data = monitor.collect_last_n_days(days=7, limit=100)

        if data and data['total_posts'] > 0:
            # Save raw data
            raw_filename = f"data/raw_data/reddit_shampoo_raw_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(raw_filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, default=str)

            # Generate and save report
            report_md = generate_markdown_report(data)
            report_filename = f"data/reports/shampoo_reddit_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            with open(report_filename, 'w', encoding='utf-8') as f:
                f.write(report_md)

            # Also create a processed data file
            processed_data = {
                'report_date': data['collection_date'],
                'time_period': data['period'],
                'metrics': {
                    'total_posts': data['total_posts'],
                    'total_comments': data['total_comments'],
                    'sentiment': data['analysis']['sentiment_breakdown'],
                    'top_subreddits': data['analysis']['top_subreddits'],
                    'engagement': data['analysis']['engagement_metrics']
                }
            }
            processed_filename = f"data/processed_data/reddit_shampoo_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(processed_filename, 'w', encoding='utf-8') as f:
                json.dump(processed_data, f, indent=2, default=str)

            print(f"Analysis complete!")
            print(f"- Raw data saved to: {raw_filename}")
            print(f"- Processed data saved to: {processed_filename}")
            print(f"- Report saved to: {report_filename}")

            # Display summary
            print(f"\nSUMMARY:")
            print(f"- Collected {data['total_posts']} posts and {data['total_comments']} comments")
            print(f"- Time period: {data['period']}")
            print(f"- Sentiment: {data['analysis']['sentiment_breakdown']}")
            print(f"- Top subreddits: {[sub['name'] for sub in data['analysis']['top_subreddits'][:3]]}")

            return report_md

        else:
            print("No data collected. This may be because:")
            print("- No Reddit API credentials have been configured")
            print("- No shampoo-related discussions were found in the target subreddits")
            print("- Network/API access issues")

            # Create an empty report
            empty_report = generate_markdown_report(None)
            report_filename = f"data/reports/shampoo_reddit_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            with open(report_filename, 'w', encoding='utf-8') as f:
                f.write(empty_report)

            print(f"Empty report saved to: {report_filename}")
            return empty_report

    except Exception as e:
        print(f"Error during execution: {str(e)}")
        print("\nMake sure you have configured your Reddit API credentials in configs/api_keys.json")
        print("And installed required packages: pip install praw textblob")


if __name__ == "__main__":
    main()