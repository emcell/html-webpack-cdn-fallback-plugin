function loadCss(urls, replaceElement) {
    const url = urls[0]; 
    urls = urls.slice(1); 
    var tag = document.createElement('link'); 
    tag.rel='stylesheet';
    tag.href = url; 
    if (urls.length) 
        tag.onerror = function () { loadCss(urls, tag); };
    replaceElement.parentElement.replaceChild(tag, replaceElement);
}
