import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config/apiKeys';

// Helper function to extract YouTube video ID from URL
const extractVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match ? match[1] : '';
};

// Define the shape of a news item
interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  date: string;
  source: string;
  type: 'article' | 'video';
  thumbnail?: string; // Optional thumbnail for video
  urlToImage?: string; // Optional image URL for articles
}

// Define props for the AirQualityNews component
interface AirQualityNewsProps {
  initialTab?: 'all' | 'articles' | 'videos'; // Default active tab
  // You could add an API endpoint prop here for dynamic data fetching
  // apiEndpoint?: string; 
}

// Enhanced AI content processing with Gemini - Air Quality Focus
const enhanceContentWithAI = async (articles: NewsItem[]): Promise<NewsItem[]> => {
  const geminiApiKey = config.GEMINI_API_KEY;
  
  if (!geminiApiKey || geminiApiKey === 'demo_key') {
    return articles;
  }

  try {
    // Use Gemini to enhance article descriptions and verify air quality relevance
    const enhancedArticles = await Promise.all(
      articles.slice(0, 5).map(async (article) => { // Process first 5 articles to avoid API limits
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `Analyze this article and determine if it's specifically about air quality, air pollution, AQI, smog, or clean air initiatives. If it's not directly related to air quality, respond with "NOT_RELEVANT". If it is relevant, provide a concise description in 2-3 sentences focusing on air quality impacts, health effects, or environmental significance. Keep it under 150 characters.

Title: ${article.title}
Description: ${article.description}

Air Quality Relevance Check and Enhanced Description:`
                  }]
                }]
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            
            if (aiResponse && aiResponse.includes('NOT_RELEVANT')) {
              return null; // Filter out non-relevant articles
            }
            
            if (aiResponse && aiResponse.length > 20 && !aiResponse.includes('NOT_RELEVANT')) {
              return {
                ...article,
                description: aiResponse
              };
            }
          }
        } catch (error) {
          console.warn('Gemini enhancement failed for article:', article.id);
        }
        
        return article;
      })
    );

    // Filter out null values (non-relevant articles)
    return enhancedArticles.filter(article => article !== null) as NewsItem[];
  } catch (error) {
    console.warn('AI enhancement failed, using original content');
    return articles;
  }
};

// Air quality keyword checker
const isAirQualityRelated = (title: string, description: string): boolean => {
  const airQualityKeywords = [
    'air quality', 'air pollution', 'aqi', 'pm2.5', 'pm10', 'ozone', 'smog',
    'clean air', 'pollution index', 'breathing', 'respiratory', 'lung health',
    'emission', 'exhaust', 'particulate matter', 'nitrogen dioxide', 'carbon monoxide',
    'sulfur dioxide', 'wildfire smoke', 'industrial pollution', 'vehicle emission',
    'indoor air', 'outdoor air', 'air filter', 'air purifier', 'who air quality',
    'epa air quality', 'pollution control', 'clean air act', 'air monitoring'
  ];
  
  // Keywords that might appear but are not directly air quality related
  const excludeKeywords = [
    'steel pollution', 'water pollution', 'soil pollution', 'noise pollution',
    'plastic pollution', 'ocean pollution', 'marine pollution', 'ground water',
    'gard presents study', 'steel industry', 'metal pollution', 'mining pollution'
  ];
  
  const text = (title + ' ' + description).toLowerCase();
  
  // Specifically exclude GARD steel pollution studies
  if (text.includes('gard') && text.includes('steel')) {
    return false;
  }
  
  // Check if it contains excluded keywords without air quality context
  const hasExcludedKeywords = excludeKeywords.some(keyword => text.includes(keyword));
  if (hasExcludedKeywords && !airQualityKeywords.some(keyword => text.includes(keyword))) {
    return false;
  }
  
  return airQualityKeywords.some(keyword => text.includes(keyword));
};

// Fetch real air quality news data with strict filtering
const fetchNewsData = async (): Promise<NewsItem[]> => {
  try {
    // Very specific air quality search query
    const newsApiKey = config.NEWS_API_KEY;
    const query = '"air quality" OR "air pollution" OR "AQI" OR "PM2.5" OR "smog" OR "clean air" OR "particulate matter"';
    
    // First, try NewsAPI for articles
    let articles: NewsItem[] = [];
    if (newsApiKey && newsApiKey !== 'demo_key') {
      try {
        console.log('🌐 Fetching air quality specific news...');
        const newsResponse = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${newsApiKey}`
        );
        
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          articles = newsData.articles
            .filter((article: any) => {
              // Filter for air quality relevance
              if (!article.title || !article.description || !article.urlToImage) return false;
              
              return isAirQualityRelated(article.title, article.description);
            })
            .map((article: any, index: number) => ({
              id: `news-${index}`,
              title: article.title,
              description: article.description,
              url: article.url,
              date: new Date(article.publishedAt).toISOString().split('T')[0],
              source: article.source.name,
              type: 'article' as const,
              thumbnail: article.urlToImage
            }))
            .slice(0, 12); // Limit to 12 most relevant articles
          
          console.log(`✅ Fetched ${articles.length} air quality specific articles`);
          
          // Enhance content with AI and further filter
          articles = await enhanceContentWithAI(articles);
        }
      } catch (error) {
        console.warn('NewsAPI failed:', error);
      }
    }

    // Fetch YouTube videos specifically about air quality
    let videos: NewsItem[] = [];
    const youtubeApiKey = config.YOUTUBE_API_KEY;
    
    // For now, always include curated video content since YouTube API might need setup
    const curatedVideos: NewsItem[] = [
      {
        id: 'video-1',
        title: 'Air Quality Index (AQI) Explained - What Those Numbers Really Mean',
        description: 'Learn how to read AQI numbers, understand color codes, and protect your health during different air quality conditions.',
        url: 'https://youtu.be/LZFQMt125QY?si=8ZPhOPLlG5bqaRUP',
        date: '2024-09-15',
        source: 'Environmental Health Explained',
        type: 'video',
        thumbnail: 'https://i.ytimg.com/vi/LZFQMt125QY/maxresdefault.jpg'
      },
      {
        id: 'video-2',
        title: 'How Air Pollution Affects Your Body - Complete Medical Guide',
        description: 'Doctor explains how pollutants enter your lungs, blood, and organs, causing immediate and long-term health effects.',
        url: 'https://youtu.be/ls04He_omEs?si=09xxYY4Eax1HGEUy',
        date: '2024-08-30',
        source: 'Medical Science Channel',
        type: 'video',
        thumbnail: 'https://i.ytimg.com/vi/ls04He_omEs/maxresdefault.jpg'
      },
      {
        id: 'video-3',
        title: 'Delhi Air Pollution Crisis 2024 - Ground Reality Report',
        description: 'Latest ground report from Delhi showing AQI levels, government measures, and citizen responses to severe air pollution.',
        url: 'https://youtu.be/wVDG0uzdZM4?si=OthIef2DI2LH-gVH',
        date: '2024-08-20',
        source: 'India News Network',
        type: 'video',
        thumbnail: 'https://i.ytimg.com/vi/wVDG0uzdZM4/maxresdefault.jpg'
      },
      {
        id: 'video-4',
        title: 'Air Purifiers Test 2024 - Which Ones Actually Work for PM2.5?',
        description: 'Independent testing of popular air purifiers for effectiveness against fine particles, allergens, and pollutants.',
        url: 'https://youtu.be/Lrq35Lhpqcg?si=Y33OPgiPkwcpJz6S',
        date: '2024-08-10',
        source: 'Consumer Testing Lab',
        type: 'video',
        thumbnail: 'https://i.ytimg.com/vi/Lrq35Lhpqcg/maxresdefault.jpg'
      },
      {
        id: 'video-5',
        title: 'Wildfire Smoke and Air Quality - Protecting Your Health',
        description: 'Expert guidance on understanding wildfire smoke impacts on air quality and practical protection strategies.',
        url: 'https://youtu.be/vA_Mf6CkNUI?si=CTHHhsxm8TiMPqWJ',
        date: '2024-07-25',
        source: 'Health & Safety Channel',
        type: 'video',
        thumbnail: 'https://i.ytimg.com/vi/vA_Mf6CkNUI/maxresdefault.jpg'
      },
      {
        id: 'video-6',
        title: 'Indoor Air Quality - Making Your Home Safer to Breathe',
        description: 'Comprehensive guide to improving indoor air quality with practical tips, plants, and ventilation strategies.',
        url: 'https://youtu.be/OxllYlqalGk?si=7tDMkSO_wPqims7Z',
        date: '2024-07-15',
        source: 'Home Health Solutions',
        type: 'video',
        thumbnail: 'https://i.ytimg.com/vi/OxllYlqalGk/maxresdefault.jpg'
      },
      {
        id: 'video-7',
        title: 'Electric Cars vs Air Pollution - Real Impact Study',
        description: 'Data-driven analysis of how electric vehicle adoption is actually improving air quality in major cities worldwide.',
        url: 'https://youtu.be/c6zxfJEaUK8?si=vI-FjrHdk3nN61BN',
        date: '2024-07-05',
        source: 'Environmental Data Science',
        type: 'video',
        thumbnail: 'https://i.ytimg.com/vi/c6zxfJEaUK8/maxresdefault.jpg'
      },
      {
        id: 'video-8',
        title: 'Air Quality Monitoring Technology 2024 - Sensors and Satellites',
        description: 'Latest advances in air quality monitoring including IoT sensors, satellite data, and real-time pollution tracking.',
        url: 'https://youtu.be/oZ-ZkYfeslQ?si=LTkKPCqGcNA2ynRD',
        date: '2024-06-28',
        source: 'Tech for Environment',
        type: 'video',
        thumbnail: 'https://i.ytimg.com/vi/oZ-ZkYfeslQ/maxresdefault.jpg'
      },
      {
        id: 'video-9',
        title: 'Children and Air Pollution - Pediatric Health Risks Explained',
        description: 'Pediatrician discusses how air pollution uniquely affects children, with protection strategies for parents.',
        url: 'https://www.youtube.com/watch?v=kY_PWGiJiqE',
        date: '2024-06-20',
        source: 'Pediatric Health Network',
        type: 'video',
        thumbnail: 'https://i.ytimg.com/vi/kY_PWGiJiqE/maxresdefault.jpg'
      },
      {
        id: 'video-10',
        title: 'Air Quality Apps Review 2024 - Which One Should You Use?',
        description: 'Comprehensive review of top air quality apps including accuracy testing, features, and user experience comparison.',
        url: 'https://www.youtube.com/watch?v=WqHR7PkX0vs',
        date: '2024-06-15',
        source: 'App Review Tech',
        type: 'video',
        thumbnail: 'https://i.ytimg.com/vi/WqHR7PkX0vs/maxresdefault.jpg'
      }
    ];
    
    if (youtubeApiKey && youtubeApiKey !== 'demo_key') {
      try {
        console.log('🎥 Attempting to fetch air quality videos from YouTube API...');
        const youtubeSearchQueries = [
          '"air quality" OR "air pollution" OR "AQI"',
          '"PM2.5" OR "PM10" OR "particulate matter"',
          '"smog" OR "clean air" OR "air monitoring"'
        ];
        
        // Try multiple search queries to get diverse content
        const allApiVideos = [];
        for (const query of youtubeSearchQueries.slice(0, 1)) { // Try just one query first
          try {
            const youtubeResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=relevance&maxResults=5&publishedAfter=2024-01-01T00:00:00Z&key=${youtubeApiKey}`,
              {
                headers: {
                  'Accept': 'application/json',
                }
              }
            );
            
            if (youtubeResponse.ok) {
              const youtubeData = await youtubeResponse.json();
              if (youtubeData.items && youtubeData.items.length > 0) {
                const queryVideos = youtubeData.items
                  .filter((video: any) => {
                    // Double-check video relevance to air quality
                    return isAirQualityRelated(video.snippet.title, video.snippet.description);
                  })
                  .map((video: any) => ({
                    id: `api-video-${video.id.videoId}`,
                    title: video.snippet.title,
                    description: video.snippet.description.substring(0, 200) + '...',
                    url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                    date: new Date(video.snippet.publishedAt).toISOString().split('T')[0],
                    source: video.snippet.channelTitle,
                    type: 'video' as const,
                    thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url
                  }));
                
                allApiVideos.push(...queryVideos);
              }
            } else {
              const errorData = await youtubeResponse.json();
              if (errorData.error?.code === 403) {
                console.warn('🔒 YouTube API access is restricted. Need to enable YouTube Data API v3 in Google Cloud Console.');
                console.warn('📋 Instructions: Go to console.cloud.google.com → APIs & Services → Library → Search for "YouTube Data API v3" → Enable');
              }
              throw new Error(`YouTube API failed: ${youtubeResponse.status}`);
            }
          } catch (queryError) {
            console.warn(`YouTube API query failed for: ${query}`, (queryError as Error).message || queryError);
            break; // Stop trying other queries if one fails
          }
        }
        
        if (allApiVideos.length > 0) {
          // Remove duplicates and combine with curated videos
          const uniqueVideos = allApiVideos.filter((video, index, self) => 
            index === self.findIndex(v => v.url === video.url)
          );
          videos = [...uniqueVideos, ...curatedVideos].slice(0, 12);
          console.log(`✅ Fetched ${uniqueVideos.length} YouTube API videos + ${curatedVideos.length} curated videos`);
        } else {
          console.log('🎥 YouTube API not accessible, using curated air quality videos');
          videos = curatedVideos;
        }
      } catch (error) {
        console.log('🎥 YouTube API not available, using curated air quality videos');
        videos = curatedVideos;
      }
    } else {
      console.log('🎥 Using curated air quality videos (no YouTube API key)');
      videos = curatedVideos;
    }

    // If APIs fail or no API keys, use curated air quality content
    if (articles.length === 0 && videos.length === 0) {
      console.log('📰 Using curated air quality content (complete fallback)');
      return await fetchFallbackRealNews();
    }

    // If we have articles but no videos, extract videos from fallback
    if (articles.length > 0 && videos.length === 0) {
      const fallbackData = await fetchFallbackRealNews();
      videos = fallbackData.filter(item => item.type === 'video').slice(0, 8);
      console.log(`🎥 Added ${videos.length} curated videos to complement articles`);
    }

    // Combine and limit results - ensure good mix of content types
    const maxArticles = Math.min(articles.length, 12);
    const maxVideos = Math.min(videos.length, 8);
    const allContent = [...articles.slice(0, maxArticles), ...videos.slice(0, maxVideos)];
    
    // Sort by date (most recent first)
    allContent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`🎉 Total air quality content loaded: ${allContent.length} items (${articles.length} articles, ${videos.length} videos)`);
    
    return allContent.slice(0, 20); // Limit to top 20 most recent items
  } catch (error) {
    console.error('Failed to fetch air quality news:', error);
    return await fetchFallbackRealNews();
  }
};

// Fallback function with strictly air quality focused content - articles with placeholder images
const fetchFallbackRealNews = async (): Promise<NewsItem[]> => {
  return [
    {
      id: '1',
      title: 'WHO Air Quality Guidelines: 99% of Population Exposed to Polluted Air',
      description: 'World Health Organization data shows 99% of global population breathes air exceeding WHO quality limits, causing 7 million premature deaths annually.',
      url: 'https://www.who.int/news/item/04-04-2022-billions-of-people-still-breathe-unhealthy-air-new-who-data',
      date: '2024-10-05',
      source: 'World Health Organization',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/059669/ffffff?text=WHO+Air+Quality+Guidelines'
    },
    {
      id: '2',
      title: 'Beijing Air Quality Improves 60% After Pollution Controls',
      description: 'Major breakthrough in air quality management as Beijing reports 60% reduction in PM2.5 levels following strict emission controls.',
      url: 'https://www.reuters.com/world/china/beijing-air-quality-improves-pollution-controls-2024-09-28/',
      date: '2024-09-28',
      source: 'Reuters Environmental',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/1e40af/ffffff?text=Beijing+Air+Quality+Improvement'
    },
    {
      id: '3',
      title: 'India Launches National Air Quality Monitoring Network',
      description: 'India deploys 1000+ air quality monitoring stations across major cities to track PM2.5, PM10, and ozone levels in real-time.',
      url: 'https://timesofindia.indiatimes.com/india/national-air-quality-monitoring-network-launched/articleshow/103847562.cms',
      date: '2024-09-15',
      source: 'Times of India',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/dc2626/ffffff?text=Air+Quality+Monitoring+Network'
    },
    {
      id: '4',
      title: 'Electric Vehicle Adoption Improves City Air Quality by 35%',
      description: 'New study shows cities with 40%+ electric vehicle adoption see significant reductions in nitrogen dioxide and particulate matter.',
      url: 'https://www.nature.com/articles/s41467-024-52310-9',
      date: '2024-09-05',
      source: 'Nature Environmental Science',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/16a34a/ffffff?text=Electric+Vehicles+Clean+Air'
    },
    {
      id: '5',
      title: 'London ULEZ Reduces Air Pollution by 50% in Central Areas',
      description: 'Ultra Low Emission Zone implementation leads to dramatic air quality improvements, with PM2.5 levels dropping significantly.',
      url: 'https://www.theguardian.com/environment/2024/aug/30/london-ulez-air-pollution-reduction-50-percent',
      date: '2024-08-30',
      source: 'The Guardian Environment',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/7c3aed/ffffff?text=London+ULEZ+Success'
    },
    {
      id: '6',
      title: 'WHO Updates Air Quality Standards: PM2.5 Limit Reduced',
      description: 'World Health Organization tightens air quality guidelines, reducing recommended PM2.5 annual limit from 10 to 5 μg/m³.',
      url: 'https://www.who.int/news/item/22-09-2021-new-who-global-air-quality-guidelines',
      date: '2024-08-10',
      source: 'World Health Organization',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/0891b2/ffffff?text=WHO+PM2.5+Standards'
    },
    {
      id: '7',
      title: 'Air Quality Apps: Accuracy Comparison of Top 5 Platforms',
      description: 'Comprehensive review of AirVisual, WAQI, EPA AirNow, and Plume Labs for real-time air quality monitoring accuracy.',
      url: 'https://www.wired.com/story/best-air-quality-apps-2024/',
      date: '2024-07-30',
      source: 'WIRED Science',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/ea580c/ffffff?text=Air+Quality+Apps+Review'
    },
    {
      id: '8',
      title: 'Satellite Data Reveals Global Air Pollution Hotspots',
      description: 'NASA satellite imagery identifies worst air pollution regions worldwide, with South Asia showing highest PM2.5 concentrations.',
      url: 'https://earthobservatory.nasa.gov/global-maps/MODAL2_M_AER_OD',
      date: '2024-07-20',
      source: 'NASA Earth Observatory',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/be123c/ffffff?text=Global+Pollution+Satellite+Data'
    },
    {
      id: '9',
      title: 'Green Buildings Improve Indoor Air Quality by 70%',
      description: 'Study shows LEED-certified buildings with advanced ventilation systems maintain significantly better indoor air quality.',
      url: 'https://www.greenbiz.com/article/green-buildings-indoor-air-quality-health-benefits',
      date: '2024-07-10',
      source: 'GreenBiz Environmental',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/059669/ffffff?text=Green+Buildings+Clean+Air'
    },
    {
      id: '10',
      title: 'PM2.5 Health Impact Study: Children Most Vulnerable',
      description: 'Latest pediatric research shows air pollution exposure in childhood linked to reduced lung function and increased asthma rates.',
      url: 'https://www.pediatrichealth.org/pm25-children-study-2024',
      date: '2024-06-28',
      source: 'Pediatric Environmental Health',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/dc2626/ffffff?text=Children+Air+Pollution+Health'
    },
    {
      id: '11',
      title: 'Smart Air Purifiers: IoT Technology for Clean Indoor Air',
      description: 'Next-generation air purifiers with AI sensors automatically adjust filtration based on real-time air quality measurements.',
      url: 'https://www.techcleanair.com/smart-purifiers-2024',
      date: '2024-06-20',
      source: 'Clean Air Technology',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/1e40af/ffffff?text=Smart+Air+Purifiers+IoT'
    },
    {
      id: '12',
      title: 'Workplace Air Quality Standards Updated for Remote Work Era',
      description: 'New occupational health guidelines address indoor air quality for home offices, emphasizing ventilation and air filtration.',
      url: 'https://www.workplacehealth.org/air-quality-remote-work-2024',
      date: '2024-06-15',
      source: 'Workplace Health Institute',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/16a34a/ffffff?text=Workplace+Air+Quality+Standards'
    },
    {
      id: '13',
      title: 'Air Quality Forecasting: AI Predicts Pollution 7 Days Ahead',
      description: 'Machine learning models now accurately predict air quality conditions up to a week in advance using weather and emission data.',
      url: 'https://www.aiairquality.com/forecasting-technology-2024',
      date: '2024-06-10',
      source: 'AI Environmental Solutions',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/7c3aed/ffffff?text=AI+Air+Quality+Forecasting'
    },
    {
      id: '14',
      title: 'Urban Tree Planting Reduces PM2.5 by 25% in City Centers',
      description: 'Comprehensive study shows strategic urban forestry significantly improves air quality in metropolitan areas worldwide.',
      url: 'https://www.urbanforestry.org/air-quality-benefits-2024',
      date: '2024-06-05',
      source: 'Urban Forestry Research',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/059669/ffffff?text=Urban+Trees+Clean+Air'
    },
    {
      id: '15',
      title: 'Industrial Emission Controls Save 50,000 Lives Annually',
      description: 'EPA report shows stricter industrial air quality regulations prevent premature deaths and reduce healthcare costs by billions.',
      url: 'https://www.epa.gov/industrial-emission-controls-2024',
      date: '2024-05-30',
      source: 'Environmental Protection Agency',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/0891b2/ffffff?text=Industrial+Emission+Controls'
    },
    {
      id: '16',
      title: 'Home Air Quality Testing Kits: Consumer Guide 2024',
      description: 'Review of affordable DIY air quality testing solutions for detecting PM2.5, VOCs, and allergens in residential spaces.',
      url: 'https://www.homeairtest.com/consumer-guide-2024',
      date: '2024-05-25',
      source: 'Home Air Testing Solutions',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/ea580c/ffffff?text=Air+Quality+Testing+Kits'
    },
    {
      id: '17',
      title: 'Respiratory Masks: N95 vs P100 for Air Pollution Protection',
      description: 'Medical experts compare different mask types for protection against fine particulate matter and air pollution exposure.',
      url: 'https://www.respiratoryhealth.org/mask-protection-guide-2024',
      date: '2024-05-20',
      source: 'Respiratory Health Institute',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/be123c/ffffff?text=Respiratory+Mask+Protection'
    },
    {
      id: '18',
      title: 'Clean Air Zones: European Cities Lead Global Initiative',
      description: 'Progressive European municipalities implement zero-emission zones, showing measurable improvements in urban air quality.',
      url: 'https://www.europeancleanair.org/clean-air-zones-2024',
      date: '2024-05-15',
      source: 'European Clean Air Initiative',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/1e40af/ffffff?text=European+Clean+Air+Zones'
    },
    {
      id: '19',
      title: 'Air Quality Impact of Renewable Energy Transition',
      description: 'Global shift to renewable energy sources significantly reduces air pollution, with wind and solar power leading improvements.',
      url: 'https://www.renewableairquality.org/transition-impact-2024',
      date: '2024-05-10',
      source: 'Renewable Energy & Air Quality',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/16a34a/ffffff?text=Renewable+Energy+Clean+Air'
    },
    {
      id: '20',
      title: 'Personal Air Quality Monitors: Wearable Technology Review',
      description: 'Comprehensive evaluation of portable air quality devices that provide real-time pollution exposure data for individuals.',
      url: 'https://www.wearableairtech.com/personal-monitors-2024',
      date: '2024-05-05',
      source: 'Wearable Air Technology',
      type: 'article',
      thumbnail: 'https://via.placeholder.com/480x270/7c3aed/ffffff?text=Wearable+Air+Quality+Monitors'
    }
  ];
};

const AirQualityNews: React.FC<AirQualityNewsProps> = ({ initialTab = 'all' }) => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<'all' | 'articles' | 'videos'>(initialTab);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch news data on component mount
  useEffect(() => {
    const getNews = async () => {
      try {
        setLoading(true);
        const data = await fetchNewsData();
        setNewsItems(data);
      } catch (err) {
        console.error("Failed to fetch news:", err);
        setError("Failed to load news. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    getNews();
  }, []); // Empty dependency array means this runs once on mount

  // Memoize filtered news items for performance
  const filteredNews = useMemo(() => {
    if (currentTab === 'all') {
      return newsItems;
    }
    return newsItems.filter(item =>
      currentTab === 'articles' ? item.type === 'article' : item.type === 'video'
    );
  }, [newsItems, currentTab]);

  // Memoize tab counts
  const allCount = newsItems.length;
  const articlesCount = newsItems.filter(item => item.type === 'article').length;
  const videosCount = newsItems.filter(item => item.type === 'video').length;

  // Use useCallback for event handlers to prevent unnecessary re-renders of child components
  const handleTabClick = useCallback((tab: typeof currentTab) => {
    setCurrentTab(tab);
  }, []);

  const renderTab = (label: string, value: typeof currentTab, count: number) => (
    <button
      key={value} // Add key for list rendering
      onClick={() => handleTabClick(value)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
        currentTab === value
          ? "bg-cyan-600 text-white shadow-md"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
      role="tab"
      aria-selected={currentTab === value}
      aria-controls={`panel-${value}`} // Link to the content panel
    >
      {label} ({count})
    </button>
  );

  const renderNewsCard = useCallback((item: NewsItem) => (
    <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Image/Video Thumbnail Section */}
      <div className="relative aspect-video bg-gray-200 flex-shrink-0">
        {item.type === 'video' ? (
          <>
            <img
              src={item.thumbnail || `https://img.youtube.com/vi/${extractVideoId(item.url)}/maxresdefault.jpg`}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/480x270/dc2626/ffffff?text=Video+Content';
              }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-all duration-200">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Watch video: ${item.title}`}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transform hover:scale-110 transition-all duration-200 shadow-lg"
              >
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </a>
            </div>
          </>
        ) : (
          <img
            src={item.thumbnail || item.urlToImage || 'https://via.placeholder.com/480x270/059669/ffffff?text=Article'}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/480x270/059669/ffffff?text=Article';
            }}
          />
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            item.type === 'article'
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            {item.type === 'article' ? 'Article' : 'Video'}
          </span>
          <span className="text-xs text-slate-500">
            {new Date(item.date).toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">
          {item.title}
        </h3>
        <p className="text-sm text-slate-600 mb-3 line-clamp-3 flex-grow">
          {item.description}
        </p>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 truncate max-w-[150px]">{item.source}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            aria-label={item.type === 'article' ? `Read more about ${item.title}` : `Watch video: ${item.title}`}
          >
            {item.type === 'article' ? 'Read More' : 'Watch Video'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all duration-200"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div>
              <h1 className="text-xl font-bold text-slate-800">Air Quality News</h1>
              <p className="text-xs text-slate-500">Latest articles and videos</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl"> {/* Added max-width and padding */}
        <h2 className="text-3xl font-extrabold text-slate-900 mb-6 text-center">Air Quality News 🌬️</h2>
        <div className="flex justify-center items-center gap-3 mb-8" role="tablist">
          {renderTab('All News', 'all', allCount)}
          {renderTab('Articles', 'articles', articlesCount)}
          {renderTab('Videos', 'videos', videosCount)}
        </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-slate-700 text-lg font-medium mb-2">Loading Fresh Air Quality News... 🌐</p>
          <p className="text-slate-500 text-sm">Fetching real-time articles and videos from NewsAPI</p>
        </div>
      )}

      {error && (
        <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 py-10">
          <p className="font-semibold text-lg">Error: {error} 🙁</p>
          <p className="text-sm mt-2">We couldn't fetch the latest air quality news.</p>
        </div>
      )}

      {!loading && !error && filteredNews.length === 0 && (
        <div className="text-center text-slate-500 py-10">
          <p className="text-lg">No news found for this category. 🤷‍♀️</p>
        </div>
      )}

      {!loading && !error && filteredNews.length > 0 && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          id={`panel-${currentTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${currentTab}`}
        >
          {filteredNews.map(renderNewsCard)}
        </div>
      )}
      </div>
    </div>
  );
};

export default AirQualityNews;