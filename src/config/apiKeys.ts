// Environment configuration for API keys
// Note: In production, these should be stored as environment variables

declare const process: {
  env: {
    REACT_APP_NEWS_API_KEY?: string;
    REACT_APP_YOUTUBE_API_KEY?: string;
    REACT_APP_GEMINI_API_KEY?: string;
  };
};

export const config = {
  // NewsAPI key for fetching real air quality news
  NEWS_API_KEY: (typeof process !== 'undefined' && process.env?.REACT_APP_NEWS_API_KEY) || '773a38243d3c4f7fbebac38f35e123e1',
  
  // YouTube Data API key (using Google API key for YouTube Data API)
  YOUTUBE_API_KEY: (typeof process !== 'undefined' && process.env?.REACT_APP_YOUTUBE_API_KEY) || 'AIzaSyC2WrlsJUNuc8ILebmhxYOHh-KinBfK7X8',
  
  // Gemini API key for enhanced content processing
  GEMINI_API_KEY: (typeof process !== 'undefined' && process.env?.REACT_APP_GEMINI_API_KEY) || 'AIzaSyC2WrlsJUNuc8ILebmhxYOHh-KinBfK7X8',
  
  // CORS proxy for news API (required for browser requests)
  CORS_PROXY: 'https://cors-anywhere.herokuapp.com/',
  
  // Alternative news sources that don't require API keys
  RSS_FEEDS: [
    'https://rss.cnn.com/rss/edition.rss',
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://www.epa.gov/newsroom/rss'
  ]
};

// Instructions for setting up API keys:
/*
1. NewsAPI (Free tier: 1000 requests/day):
   - Go to https://newsapi.org/register
   - Get your API key
   - Add REACT_APP_NEWS_API_KEY=your_key_here to your .env file

2. YouTube Data API (Free tier: 10,000 units/day):
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Enable YouTube Data API v3
   - Create credentials (API key)
   - Add REACT_APP_YOUTUBE_API_KEY=your_key_here to your .env file

3. For production deployment:
   - Set these as environment variables in your hosting platform
   - Never commit API keys to version control
*/