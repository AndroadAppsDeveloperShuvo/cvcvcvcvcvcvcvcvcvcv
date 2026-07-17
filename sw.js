// 🌐 Network First Strategy (নিরাপদ অফলাইন সিস্টেম)

const CACHE_NAME = 'khamar-app-v5';
const urlsToCache = ['./', './index.html', './medicines.js'];

self.addEventListener('install', event => {
    self.skipWaiting(); // আপডেট পেলে সাথে সাথে চালু হবে
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) return caches.delete(cache); // পুরোনো ক্যাশ মুছে ফেলবে
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Only handle GET requests from http/https schemes
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    // Bypass caching for Firebase Realtime Database and external APIs
    if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
        .then(response => {
            if (!response || response.status !== 200) {
                return response;
            }
            // ইন্টারনেট থাকলে নতুন ফাইল আনবে এবং ক্যাশে সেভ করে রাখবে
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
            return response;
        })
        .catch(() => {
            // ইন্টারনেট না থাকলে (অফলাইনে) ক্যাশ থেকে দেখাবে
            return caches.match(event.request);
        })
    );
});
