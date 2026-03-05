"""
Reddit Mining Module for Vibe Marketing

This module handles the collection and analysis of Reddit data
for shampoo-related discussions over the last 7 days.
"""

import praw
import json
import pandas as pd
from datetime import datetime, timedelta
from textblob import TextBlob
import logging
from typing import List, Dict, Optional


class RedditAPIClient:
    """Client for interacting with Reddit API"""

    def __init__(self, config_file: str = "configs/api_keys.json"):
        """Initialize the Reddit API client with credentials"""
        with open(config_file, 'r') as f:
            config = json.load(f)

        reddit_config = config['reddit_api']

        self.reddit = praw.Reddit(
            client_id=reddit_config['client_id'],
            client_secret=reddit_config['client_secret'],
            user_agent=reddit_config['user_agent'],
            username=reddit_config.get('username'),
            password=reddit_config.get('password')
        )

        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def search_subreddit_posts(self, keywords: List[str], subreddits: List[str],
                             time_filter: str = "week", limit: int = 100) -> List[Dict]:
        """
        Search for posts containing keywords in specified subreddits

        Args:
            keywords: List of keywords to search for
            subreddits: List of subreddits to search in
            time_filter: Time filter ('hour', 'day', 'week', 'month', 'year', 'all')
            limit: Maximum number of posts to return

        Returns:
            List of dictionaries containing post information
        """
        posts_data = []

        for subreddit_name in subreddits:
            try:
                subreddit = self.reddit.subreddit(subreddit_name)

                # Search for each keyword in the subreddit
                for keyword in keywords:
                    search_query = keyword
                    for submission in subreddit.search(
                        search_query,
                        sort='top',
                        time_filter=time_filter,
                        limit=limit//len(keywords)
                    ):
                        # Convert submission to dictionary
                        post_dict = {
                            'id': submission.id,
                            'title': submission.title,
                            'selftext': submission.selftext,
                            'author': str(submission.author),
                            'score': submission.score,
                            'num_comments': submission.num_comments,
                            'created_utc': submission.created_utc,
                            'url': submission.url,
                            'permalink': f"https://www.reddit.com{submission.permalink}",
                            'subreddit': subreddit_name,
                            'keyword_found': keyword
                        }

                        posts_data.append(post_dict)

            except Exception as e:
                self.logger.error(f"Error searching subreddit {subreddit_name}: {str(e)}")
                continue

        return posts_data

    def get_comments_for_post(self, post_id: str, limit: int = 50) -> List[Dict]:
        """Retrieve comments for a specific post"""
        try:
            submission = self.reddit.submission(id=post_id)
            submission.comments.replace_more(limit=0)  # Remove "more" comments

            comments = []
            for comment in submission.comments.list()[:limit]:
                comment_dict = {
                    'id': comment.id,
                    'body': comment.body,
                    'author': str(comment.author),
                    'score': comment.score,
                    'created_utc': comment.created_utc,
                    'parent_id': comment.parent_id
                }
                comments.append(comment_dict)

            return comments
        except Exception as e:
            self.logger.error(f"Error retrieving comments for post {post_id}: {str(e)}")
            return []


class ShampooRedditMonitor:
    """Specialized monitor for shampoo-related Reddit discussions"""

    def __init__(self, config_file: str = "configs/api_keys.json"):
        self.api_client = RedditAPIClient(config_file)
        self.config = self._load_config(config_file)

    def _load_config(self, config_file: str) -> Dict:
        """Load configuration from file"""
        with open(config_file, 'r') as f:
            return json.load(f)

    def collect_last_n_days(self, days: int = 7, limit: int = 100) -> Dict:
        """
        Collect shampoo-related discussions from the last N days

        Args:
            days: Number of days to look back
            limit: Maximum number of posts to collect

        Returns:
            Dictionary containing collected data and analysis
        """
        # Calculate the date threshold
        date_threshold = datetime.utcnow() - timedelta(days=days)

        # Get keywords and subreddits from config
        keywords = self.config['social_media_monitoring']['target_keywords']
        subreddits = self.config['social_media_monitoring']['target_subreddits']

        # Collect posts
        posts = self.api_client.search_subreddit_posts(
            keywords=keywords,
            subreddits=subreddits,
            time_filter="week",  # Use "week" to get recent posts (Reddit's smallest unit)
            limit=limit
        )

        # Filter posts by exact date requirement
        filtered_posts = []
        for post in posts:
            post_date = datetime.utcfromtimestamp(post['created_utc'])
            if post_date >= date_threshold:
                filtered_posts.append(post)

        # Collect comments for each post
        all_comments = []
        for post in filtered_posts:
            comments = self.api_client.get_comments_for_post(post['id'])
            for comment in comments:
                comment['parent_post_id'] = post['id']
                comment['parent_post_title'] = post['title']
                all_comments.append(comment)

        # Perform basic analysis
        analysis = self._analyze_discussions(filtered_posts, all_comments)

        return {
            'collection_date': datetime.utcnow().isoformat(),
            'period': f"{date_threshold.date()} to {datetime.utcnow().date()}",
            'posts': filtered_posts,
            'comments': all_comments,
            'analysis': analysis,
            'total_posts': len(filtered_posts),
            'total_comments': len(all_comments)
        }

    def _analyze_discussions(self, posts: List[Dict], comments: List[Dict]) -> Dict:
        """Perform basic analysis of collected discussions"""
        # Sentiment analysis
        all_texts = [post['title'] + ' ' + post['selftext'] for post in posts if post['selftext']]
        all_texts.extend([comment['body'] for comment in comments if comment['body']])

        sentiments = {'positive': 0, 'neutral': 0, 'negative': 0}
        for text in all_texts:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            if polarity > 0.1:
                sentiments['positive'] += 1
            elif polarity < -0.1:
                sentiments['negative'] += 1
            else:
                sentiments['neutral'] += 1

        # Top subreddits
        subreddit_counts = {}
        for post in posts:
            subreddit = post['subreddit']
            subreddit_counts[subreddit] = subreddit_counts.get(subreddit, 0) + 1

        top_subreddits = sorted(subreddit_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        # Engagement metrics
        avg_score = sum([post['score'] for post in posts]) / len(posts) if posts else 0
        avg_comments = sum([post['num_comments'] for post in posts]) / len(posts) if posts else 0

        return {
            'sentiment_breakdown': sentiments,
            'top_subreddits': [{'name': sr[0], 'count': sr[1]} for sr in top_subreddits],
            'engagement_metrics': {
                'average_upvotes': round(avg_score, 2),
                'average_comments': round(avg_comments, 2)
            },
            'total_mentions': len(posts) + len(comments)
        }

    def save_data(self, data: Dict, filename: str = None):
        """Save collected data to file"""
        if filename is None:
            filename = f"data/raw_data/reddit_shampoo_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        # Create directory if it doesn't exist
        import os
        os.makedirs(os.path.dirname(filename), exist_ok=True)

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)

        print(f"Data saved to {filename}")
        return filename


def main():
    """Main function to run the shampoo Reddit monitoring"""
    try:
        monitor = ShampooRedditMonitor()
        print("Collecting shampoo-related discussions from the last 7 days...")

        data = monitor.collect_last_n_days(days=7, limit=100)

        # Print summary
        print(f"\nCollected {data['total_posts']} posts and {data['total_comments']} comments")
        print(f"Time period: {data['period']}")
        print(f"Sentiment breakdown: {data['analysis']['sentiment_breakdown']}")
        print(f"Top subreddits: {[sr['name'] for sr in data['analysis']['top_subreddits'][:3]]}")

        # Save the data
        filename = monitor.save_data(data)

        # Also save a simplified summary
        summary = {
            'summary': {
                'time_period': data['period'],
                'total_discussions': data['total_posts'],
                'total_comments': data['total_comments'],
                'sentiment_breakdown': data['analysis']['sentiment_breakdown'],
                'top_subreddits': data['analysis']['top_subreddits'],
                'average_upvotes': data['analysis']['engagement_metrics']['average_upvotes'],
                'average_comments': data['analysis']['engagement_metrics']['average_comments']
            }
        }

        summary_filename = filename.replace('.json', '_summary.json')
        with open(summary_filename, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, default=str)

        print(f"\nFull data saved to: {filename}")
        print(f"Summary saved to: {summary_filename}")

        return data

    except Exception as e:
        print(f"Error running Reddit monitor: {str(e)}")
        print("Make sure you have configured your Reddit API credentials in configs/api_keys.json")
        return None


if __name__ == "__main__":
    main()