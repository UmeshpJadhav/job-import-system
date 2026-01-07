const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
});

const fetchFeed = async (url) => {
    try {
        const response = await axios.get(url);
        const xmlData = response.data;
        const jsonObj = parser.parse(xmlData);

        // Normalize data based on structure (RSS vs Atom vs others)
        // Usually RSS 2.0 has channel -> item
        let items = [];
        if (jsonObj.rss && jsonObj.rss.channel && jsonObj.rss.channel.item) {
            items = jsonObj.rss.channel.item;
        } else if (jsonObj.rdf && jsonObj.rdf.item) { // RSS 1.0
            items = jsonObj.rdf.item;
        }

        if (!Array.isArray(items)) {
            items = [items];
        }

        return items.map(item => normalizeJob(item));
    } catch (error) {
        console.error(`Error fetching feed ${url}:`, error.message);
        throw error;
    }
};

const normalizeJob = (item) => {
    return {
        title: item.title,
        company: item['job_listing:company'] || item.company || 'Unknown',
        location: item['job_listing:location'] || item.location || 'Remote',
        description: item.description,
        sourceUrl: item.link || item.guid,
        postedDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        categories: [], 
        type: item['job_listing:job_type']
    };
};

module.exports = { fetchFeed };
