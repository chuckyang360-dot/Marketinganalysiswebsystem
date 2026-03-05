#!/usr/bin/env python3
"""
Mock script to simulate shampoo discussion monitoring on Reddit for the last 7 days
This script simulates the functionality that would be available with proper API credentials
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List


def create_mock_reddit_data():
    """Create simulated Reddit data for shampoo discussions"""
    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)

    # Mock data for shampoo discussions on Reddit
    mock_posts = [
        {
            'id': 'post1',
            'title': 'What’s everyone’s favorite sulfate-free shampoo? Having issues with scalp irritation',
            'subreddit': 'SkincareAddicts',
            'score': 142,
            'num_comments': 36,
            'created_utc': (end_date - timedelta(days=1)).timestamp(),
            'permalink': 'https://www.reddit.com/r/SkincareAddicts/comments/post1/',
            'selftext': 'Been dealing with scalp issues lately and wondering if anyone has recommendations for a good sulfate-free shampoo.'
        },
        {
            'id': 'post2',
            'title': 'DIY shampoo with coconut oil and honey - thoughts?',
            'subreddit': 'Hair',
            'score': 87,
            'num_comments': 24,
            'created_utc': (end_date - timedelta(days=2)).timestamp(),
            'permalink': 'https://www.reddit.com/r/Hair/comments/post2/',
            'selftext': 'Made my own shampoo with coconut oil, honey, and some essential oils. Has anyone tried this?'
        },
        {
            'id': 'post3',
            'title': 'Olaplex vs. K18 - which one actually works for damaged hair?',
            'subreddit': 'CurlyHair',
            'score': 201,
            'num_comments': 68,
            'created_utc': (end_date - timedelta(days=3)).timestamp(),
            'permalink': 'https://www.reddit.com/r/CurlyHair/comments/post3/',
            'selftext': 'Trying to decide between these two for my chemically treated hair. Which one restored your hair the best?'
        },
        {
            'id': 'post4',
            'title': 'Why do expensive shampoos seem to work better? Is it just placebo?',
            'subreddit': 'AskReddit',
            'score': 312,
            'num_comments': 142,
            'created_utc': (end_date - timedelta(days=4)).timestamp(),
            'permalink': 'https://www.reddit.com/r/AskReddit/comments/post4/',
            'selftext': 'Just curious if there\'s science behind premium shampoos or if it\'s marketing.'
        },
        {
            'id': 'post5',
            'title': 'Head & Shoulders is literally the worst now - any alternatives for dandruff?',
            'subreddit': 'Beauty',
            'score': 76,
            'num_comments': 45,
            'created_utc': (end_date - timedelta(days=5)).timestamp(),
            'permalink': 'https://www.reddit.com/r/Beauty/comments/post5/',
            'selftext': 'Used to love Head & Shoulders but the formula has changed. Need recommendations for dandruff control.'
        }
    ]

    # Mock comments
    mock_comments = [
        {
            'id': 'comment1',
            'body': 'I switched to Aussie 3 Minute Miracle and my hair feels amazing!',
            'score': 24,
            'parent_post_id': 'post1'
        },
        {
            'id': 'comment2',
            'body': 'Try the new OGX Coconut Curls - it\'s drugstore but works great for curls',
            'score': 18,
            'parent_post_id': 'post3'
        },
        {
            'id': 'comment3',
            'body': 'Have you tried using apple cider vinegar rinse? Works great for scalp issues',
            'score': 31,
            'parent_post_id': 'post1'
        },
        {
            'id': 'comment4',
            'body': 'K18 is worth the money if you have severely damaged hair. I saw results after one use.',
            'score': 42,
            'parent_post_id': 'post3'
        },
        {
            'id': 'comment5',
            'body': 'Trader Joe\'s has some great affordable options that work just as well as expensive brands.',
            'score': 15,
            'parent_post_id': 'post4'
        }
    ]

    # Simulated analysis
    analysis = {
        'sentiment_breakdown': {
            'positive': 32,
            'neutral': 18,
            'negative': 8
        },
        'top_subreddits': [
            {'name': 'r/SkincareAddicts', 'count': 12},
            {'name': 'r/Hair', 'count': 9},
            {'name': 'r/CurlyHair', 'count': 8},
            {'name': 'r/AskReddit', 'count': 6},
            {'name': 'r/Beauty', 'count': 5}
        ],
        'engagement_metrics': {
            'average_upvotes': 15.2,
            'average_comments': 6.8
        }
    }

    # Full dataset
    data = {
        'collection_date': datetime.now().isoformat(),
        'period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
        'posts': mock_posts,
        'comments': mock_comments,
        'analysis': analysis,
        'total_posts': len(mock_posts),
        'total_comments': len(mock_comments)
    }

    return data


def generate_markdown_report(data):
    """Generate a human-readable markdown report from the collected data"""

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
| Positive | {data['analysis']['sentiment_breakdown']['positive']} | {round((data['analysis']['sentiment_breakdown']['positive']/sum(data['analysis']['sentiment_breakdown'].values()))*100, 1) if sum(data['analysis']['sentiment_breakdown'].values()) > 0 else 0}% |
| Neutral | {data['analysis']['sentiment_breakdown']['neutral']} | {round((data['analysis']['sentiment_breakdown']['neutral']/sum(data['analysis']['sentiment_breakdown'].values()))*100, 1) if sum(data['analysis']['sentiment_breakdown'].values()) > 0 else 0}% |
| Negative | {data['analysis']['sentiment_breakdown']['negative']} | {round((data['analysis']['sentiment_breakdown']['negative']/sum(data['analysis']['sentiment_breakdown'].values()))*100, 1) if sum(data['analysis']['sentiment_breakdown'].values()) > 0 else 0}% |

## Top Subreddits Discussing Shampoo

1. {data['analysis']['top_subreddits'][0]['name']} ({data['analysis']['top_subreddits'][0]['count']} mentions)
2. {data['analysis']['top_subreddits'][1]['name']} ({data['analysis']['top_subreddits'][1]['count']} mentions)
3. {data['analysis']['top_subreddits'][2]['name']} ({data['analysis']['top_subreddits'][2]['count']} mentions)
4. {data['analysis']['top_subreddits'][3]['name']} ({data['analysis']['top_subreddits'][3]['count']} mentions)
5. {data['analysis']['top_subreddits'][4]['name']} ({data['analysis']['top_subreddits'][4]['count']} mentions)

## Recent Shampoo Discussions

"""

    # Add recent posts
    for i, post in enumerate(data['posts']):
        post_date = datetime.fromtimestamp(post['created_utc']).strftime('%Y-%m-%d')
        report += f"### [{post['title']}]({post['permalink']})\n"
        report += f"- **Subreddit:** r/{post['subreddit']}\n"
        report += f"- **Date:** {post_date}\n"
        report += f"- **Upvotes:** {post['score']}\n"
        report += f"- **Comments:** {post['num_comments']}\n"
        if post['selftext']:
            report += f"- **Preview:** {post['selftext'][:100]}...\n"
        report += "\n"

    report += "## Key Insights\n\n"

    pos_pct = round((data['analysis']['sentiment_breakdown']['positive']/(data['total_posts']+data['total_comments']))*100, 1)
    neg_pct = round((data['analysis']['sentiment_breakdown']['negative']/(data['total_posts']+data['total_comments']))*100, 1)

    if pos_pct > neg_pct:
        report += "- Overall sentiment is **positive**, indicating satisfaction with shampoo products and solutions\n"
    elif neg_pct > pos_pct:
        report += "- Overall sentiment is **negative**, suggesting areas for improvement in current offerings\n"
    else:
        report += "- Sentiment is relatively **balanced** between positive and negative opinions\n"

    if data['analysis']['engagement_metrics']['average_upvotes'] > 10:
        report += "- Posts are receiving high engagement, indicating strong interest in shampoo-related topics\n"
    else:
        report += "- Posts have moderate engagement, suggesting steady but not exceptional interest\n"

    # Identify key themes from mock data
    themes = ["sulfate-free", "DIY solutions", "premium vs. budget", "damaged hair treatment", "dandruff control"]
    report += f"- Common discussion themes: {', '.join(themes[:4])} and others\n\n"

    report += "## Recommendations\n\n"
    report += "- Consider developing sulfate-free product lines given consumer interest\n"
    report += "- Explore opportunities in DIY/natural hair care segment\n"
    report += "- Address consumer concerns about price vs. value proposition\n"
    report += "- Focus on solutions for damaged hair recovery\n\n"

    report += "---\n"
    report += "_Note: This report is based on simulated data. To obtain real data, configure proper Reddit API credentials in `configs/api_keys.json` and run the actual monitoring script._\n"

    return report


def main():
    """Main function to run the mock analysis and generate report"""
    print("Generating simulated shampoo discussion monitoring report for the last 7 days...")
    print("(This simulates the functionality that would be available with proper API credentials)")

    # Create output directories if they don't exist
    os.makedirs("data/raw_data", exist_ok=True)
    os.makedirs("data/processed_data", exist_ok=True)
    os.makedirs("data/reports", exist_ok=True)

    # Generate mock data
    data = create_mock_reddit_data()

    # Save raw data
    raw_filename = f"data/raw_data/reddit_shampoo_raw_{datetime.now().strftime('%Y%m%d_%H%M%S')}_mock.json"
    with open(raw_filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, default=str)

    # Generate and save report
    report_md = generate_markdown_report(data)
    report_filename = f"data/reports/shampoo_reddit_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}_mock.md"
    with open(report_filename, 'w', encoding='utf-8') as f:
        f.write(report_md)

    # Create processed data
    processed_data = {
        'report_date': data['collection_date'],
        'time_period': data['period'],
        'metrics': {
            'total_posts': data['total_posts'],
            'total_comments': data['total_comments'],
            'sentiment': data['analysis']['sentiment_breakdown'],
            'top_subreddits': data['analysis']['top_subreddits'],
            'engagement': data['analysis']['engagement_metrics']
        },
        'themed_discussions': [
            'Sulfate-free formulations',
            'Natural/DIY hair care',
            'Premium product comparisons',
            'Scalp health concerns',
            'Damaged hair treatments'
        ]
    }
    processed_filename = f"data/processed_data/reddit_shampoo_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}_mock.json"
    with open(processed_filename, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, indent=2, default=str)

    print(f"\nSimulated analysis complete!")
    print(f"- Mock raw data saved to: {raw_filename}")
    print(f"- Mock processed data saved to: {processed_filename}")
    print(f"- Mock report saved to: {report_filename}")

    # Display summary
    print(f"\nSIMULATED SUMMARY:")
    print(f"- Simulated {data['total_posts']} posts and {data['total_comments']} comments")
    print(f"- Time period: {data['period']}")
    print(f"- Sentiment: {data['analysis']['sentiment_breakdown']}")
    print(f"- Top subreddits: {[sub['name'] for sub in data['analysis']['top_subreddits'][:3]]}")

    print(f"\nThe full report has been generated at: {report_filename}")
    print("\nTo get REAL data, you would need to:")
    print("1. Register a Reddit application at https://www.reddit.com/prefs/apps")
    print("2. Update configs/api_keys.json with your credentials")
    print("3. Run the actual monitoring script: python tools/reddit_shampoo_monitor.py")

    return report_md


if __name__ == "__main__":
    main()