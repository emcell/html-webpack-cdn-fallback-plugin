function loadJs(urls) {
  const url = urls[0];
  urls = urls.slice(1);
  var scriptTag = document.createElement("script");
  scriptTag.src = url;
  if (urls.length)
    scriptTag.onerror = function() {
      loadJs(urls);
    };
  document.body.appendChild(scriptTag);
}
