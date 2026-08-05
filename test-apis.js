// Test script to verify API key functionality
// Run this with: node test-apis.js

const API_KEYS = {
  NEWS_API: '773a38243d3c4f7fbebac38f35e123e1',
  YOUTUBE_API: 'AIzaSyC2WrlsJUNuc8ILebmhxYOHh-KinBfK7X8',
  GEMINI_API: 'AIzaSyC2WrlsJUNuc8ILebmhxYOHh-KinBfK7X8'
};

async function testNewsAPI() {
  try {
    console.log('🧪 Testing NewsAPI...');
    const response = await fetch(
      `https://newsapi.org/v2/everything?q="air quality"&sortBy=publishedAt&language=en&pageSize=5&apiKey=${API_KEYS.NEWS_API}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ NewsAPI working! Found ${data.totalResults} articles`);
      console.log(`📰 Sample article: ${data.articles[0]?.title}`);
      return true;
    } else {
      console.error(`❌ NewsAPI failed: ${response.status} - ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('❌ NewsAPI error:', error.message);
    return false;
  }
}

async function testYouTubeAPI() {
  try {
    console.log('🧪 Testing YouTube API...');
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q="air quality"&type=video&maxResults=3&key=${API_KEYS.YOUTUBE_API}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ YouTube API working! Found ${data.items?.length || 0} videos`);
      if (data.items && data.items.length > 0) {
        console.log(`🎥 Sample video: ${data.items[0].snippet.title}`);
      }
      return true;
    } else {
      const errorData = await response.text();
      console.error(`❌ YouTube API failed: ${response.status} - ${response.statusText}`);
      console.error('Error details:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ YouTube API error:', error.message);
    return false;
  }
}

async function testGeminiAPI() {
  try {
    console.log('🧪 Testing Gemini API...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEYS.GEMINI_API}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Explain what PM2.5 means in air quality in one sentence.'
            }]
          }]
        })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini API working!');
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiResponse) {
        console.log(`🤖 AI Response: ${aiResponse.substring(0, 100)}...`);
      }
      return true;
    } else {
      const errorData = await response.text();
      console.error(`❌ Gemini API failed: ${response.status} - ${response.statusText}`);
      console.error('Error details:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Gemini API error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting API Tests for PurePulse Air Quality News\n');
  
  const results = {
    newsAPI: await testNewsAPI(),
    youtubeAPI: await testYouTubeAPI(),
    geminiAPI: await testGeminiAPI()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log(`📰 NewsAPI: ${results.newsAPI ? '✅ Working' : '❌ Failed'}`);
  console.log(`🎥 YouTube API: ${results.youtubeAPI ? '✅ Working' : '❌ Failed'}`);
  console.log(`🤖 Gemini API: ${results.geminiAPI ? '✅ Working' : '❌ Failed'}`);
  
  const workingCount = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 Overall: ${workingCount}/3 APIs working (${Math.round(workingCount/3 * 100)}%)`);
  
  if (workingCount === 3) {
    console.log('🎉 All APIs are working! Your air quality news component will fetch real data.');
  } else if (workingCount >= 1) {
    console.log('⚠️ Some APIs working. The component will use a mix of real and curated data.');
  } else {
    console.log('🔄 APIs not working. The component will use curated fallback data.');
  }
}

// Run the tests
runAllTests().catch(console.error);