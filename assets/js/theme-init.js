(function(){
  var saved = localStorage.getItem('skv-theme');
  var preferred = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', preferred);
})();
