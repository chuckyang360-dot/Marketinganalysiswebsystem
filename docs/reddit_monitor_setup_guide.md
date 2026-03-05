# Reddit Shampoo Monitor - Quick Setup Guide

## Overview
This guide explains how to set up and run the Reddit monitoring system for shampoo-related discussions. The system has been designed to collect and analyze discussions over the last 7 days from relevant subreddits.

## Prerequisites
- Python 3.7+
- Reddit account for API access

## Step 1: Obtain Reddit API Credentials

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in the form:
   - Name: VibeMarketingBot
   - App type: Script
   - Description: Marketing analysis bot
   - About URL: Leave blank
   - Redirect URL: http://localhost:8080
4. Note down your:
   - client_id (the 14-character string under your app name)
   - client_secret (the long string next to "secret")

## Step 2: Configure API Keys

Update `configs/api_keys.json` with your credentials:

```json
{
  "reddit_api": {
    "client_id": "YOUR_ACTUAL_CLIENT_ID",
    "client_secret": "YOUR_ACTUAL_CLIENT_SECRET",
    "user_agent": "VibeMarketingBot 1.0 by /u/YOUR_REDDIT_USERNAME",
    "username": "YOUR_REDDIT_USERNAME",
    "password": "YOUR_REDDIT_PASSWORD"
  },
  "social_media_monitoring": {
    "monitoring_period_days": 7,
    "target_keywords": [
      "shampoo",
      "hair care",
      "conditioner",
      "scalp treatment",
      "hair loss",
      "dandruff",
      "hair product",
      "hair routine"
    ],
    "target_subreddits": [
      "SkincareAddicts",
      "hair",
      "HairLoss",
      "AskReddit",
      "Beauty",
      "CurlyHair",
      "ChemistryHair",
      "HairProducts",
      "Showerthoughts"
    ]
  }
}
```

## Step 3: Run the Monitor

Execute the monitoring script:

```bash
python tools/reddit_shampoo_monitor.py
```

## Expected Output

The script will create several files:

1. **Raw data**: `data/raw_data/reddit_shampoo_raw_<timestamp>.json`
   - Contains original Reddit API responses
   - Includes post titles, content, authors, scores, etc.

2. **Processed data**: `data/processed_data/reddit_shampoo_analysis_<timestamp>.json`
   - Structured analysis with metrics
   - Sentiment breakdown and engagement statistics

3. **Report**: `data/reports/shampoo_reddit_report_<timestamp>.md`
   - Human-readable markdown report
   - Includes summaries, insights, and recommendations

## File Structure

```
Vibe Marketing/
├── configs/
│   └── api_keys.json          # API credentials
├── agents/
│   └── reddit_miner/          # Reddit monitoring implementation
│       └── reddit_mining.py
├── tools/
│   └── reddit_shampoo_monitor.py  # Main monitoring script
└── data/
    ├── raw_data/              # Raw Reddit API responses
    ├── processed_data/        # Structured analysis
    └── reports/               # Human-readable reports
```

## Integration with Marketing Agents

Once configured, this monitoring system integrates with the Vibe Marketing ecosystem:

- **SEO Analyzer**: Uses trending topics for keyword research
- **Content Generator**: Creates responsive content based on community discussions
- **Report Synthesizer**: Incorporates social insights into comprehensive reports
- **X-Social Monitor**: Cross-references with Twitter sentiment
- **CEO Manager**: Makes strategic decisions based on aggregated insights

## Troubleshooting

### Common Issues:

1. **Authentication Error**: Verify your API credentials in `configs/api_keys.json`
2. **Rate Limiting**: The script includes rate limiting, but verify you're not exceeding Reddit's limits
3. **Missing Dependencies**: Run `python3 -m pip install praw textblob` to install required packages

### Verification Steps:

1. Test API access:
```python
import praw
with open('configs/api_keys.json') as f:
    import json
    creds = json.load(f)['reddit_api']

reddit = praw.Reddit(
    client_id=creds['client_id'],
    client_secret=creds['client_secret'],
    user_agent=creds['user_agent']
)

print(reddit.user.me())  # Should return your username or "None" if using script app
```

2. Check if you can access a subreddit:
```python
subreddit = reddit.subreddit('SkincareAddicts')
print(subreddit.display_name)
```

## Security Best Practices

- Never commit `api_keys.json` to version control
- Use a dedicated Reddit account for the monitoring bot
- Rotate credentials periodically
- Monitor usage to stay within API limits

## Customization

You can customize the monitoring by:

- Adding more subreddits to the `target_subreddits` list
- Expanding the `target_keywords` list with brand names
- Adjusting the `monitoring_period_days` value
- Modifying the sentiment analysis thresholds

## Maintenance

- Check logs regularly for API errors
- Update credentials if they expire
- Adjust keyword lists based on market changes
- Scale up frequency for high-traffic periods

For questions about the implementation, refer to the `agents/reddit_miner/reddit_mining.py` file which contains detailed documentation and configuration options.