/**
 * Middleware to detect web crawlers and bots
 * This helps implement SEO-friendly responses while protecting sensitive data
 */

// Common search engine and social media bot user agents
const CRAWLER_USER_AGENTS = [
    // Search engines
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
    'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
    // SEO tools
    'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'rogerbot',
    // Generic patterns
    'bot', 'crawler', 'spider', 'scraper'
];

const detectCrawler = (req, res, next) => {
    const userAgent = (req.get('User-Agent') || '').toLowerCase();

    // Check if request is from a known crawler
    const isCrawler = CRAWLER_USER_AGENTS.some(pattern =>
        userAgent.includes(pattern)
    );

    // Additional checks for crawler behavior
    const hasNoAcceptHeader = !req.get('Accept') || req.get('Accept') === '*/*';
    const hasHeadMethod = req.method === 'HEAD';
    const hasSimpleAccept = req.get('Accept') &&
        (req.get('Accept').includes('text/html') &&
            !req.get('Accept').includes('application/json'));

    // Mark request as crawler if any condition matches
    req.isCrawler = isCrawler || hasNoAcceptHeader || hasHeadMethod ||
        (hasSimpleAccept && !req.get('X-Requested-With'));

    // Log crawler detection for monitoring
    if (req.isCrawler) {
        console.log(`🤖 Crawler detected: ${userAgent} accessing ${req.originalUrl}`);
    }

    next();
};

// Middleware to set appropriate headers for crawlers
const setCrawlerHeaders = (req, res, next) => {
    if (req.isCrawler) {
        // Set cache headers for crawlers
        res.set({
            'Cache-Control': 'public, max-age=3600, s-maxage=7200',
            'X-Robots-Tag': 'index, follow, noarchive',
            'Vary': 'User-Agent'
        });
    }
    next();
};

module.exports = {
    detectCrawler,
    setCrawlerHeaders
};