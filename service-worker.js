// service-worker.js
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  // ここは最低限でOK
});
self.addEventListener('fetch', event => {
  // オフラインキャッシュなどを実装したい場合はここに記述
});