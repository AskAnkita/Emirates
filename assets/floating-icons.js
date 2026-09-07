(function(){
  var config = window.floatingIcons || {};
  if (!config.show) return;
  var iconsString = (config.icons || '').trim();
  if (!iconsString) return;
  var floatingIconsEmojis = iconsString.split(',').map(function(item){ return item.trim(); }).filter(Boolean);
  if (!floatingIconsEmojis.length) return;

  var iconCount = 30;
  if (theme.config.mqlTablet) {
    iconCount = 20;
  }
  if (theme.config.mqlSmall) {
    iconCount = 10;
  }
  var floatingIconsContainer = document.querySelector('.floating-icons');
  if (!floatingIconsContainer) return;

  var speedPercent = Number(config.speed);
  if (!(speedPercent > 0)) {
    var dataSpeed = Number(floatingIconsContainer.dataset.floatingSpeed);
    if (dataSpeed > 0) speedPercent = dataSpeed;
  }
  var speedMultiplier = speedPercent > 0 ? speedPercent / 100 : 1;
  var baseFall = 8;
  var baseShake = 4;
  function scaleDuration(value){
    return value / (speedMultiplier || 1);
  }

  floatingIconsContainer.style.visibility = 'hidden';

  for (var i = 0; i < iconCount; i++) {
    var icon = document.createElement('div');
    icon.className = 'floating-icon';
    icon.textContent = floatingIconsEmojis[0];
    icon.style.left = ((i / iconCount) * 95 + 2) + "vw";
    icon.style.fontSize = "28px";
    icon.style.opacity = "0.8";
    icon.style.animationDuration = scaleDuration(baseFall) + "s, " + scaleDuration(baseShake) + "s";
    icon.style.animationDelay = "0s, 0s";
    floatingIconsContainer.appendChild(icon);
  }

  window.requestAnimationFrame(function(){
    var icons = floatingIconsContainer.children;
    function randomBetween(a, b){ return Math.random() * (b - a) + a; }
    for(var i = 0; i < icons.length; i++) {
      var icon = icons[i];
      var left = randomBetween(2,97);
      var fallDur = scaleDuration(randomBetween(6,12));
      var shakeDur = scaleDuration(randomBetween(3,6));
      var delay = randomBetween(-10,0);
      var fontSize = randomBetween(18,38);
      icon.textContent = floatingIconsEmojis[Math.floor(Math.random()*floatingIconsEmojis.length)];
      icon.style.left = left + "vw";
      icon.style.animationDuration = fallDur + "s, " + shakeDur + "s";
      icon.style.animationDelay = delay + "s, " + (delay/2).toFixed(2) + "s";
      icon.style.fontSize = fontSize+"px";
      icon.style.opacity = randomBetween(0.7,1).toFixed(2);
    }
    floatingIconsContainer.style.visibility = 'visible';
  });
})();