(function() {
  function resizeTextCircle(svg) {
    if (!svg) return;
    try {
      var text = svg.querySelector('text');
      if (!text) return;
      var bbox = text.getBBox();
      if (!bbox || !isFinite(bbox.width) || bbox.width === 0) return;
      svg.setAttribute('viewBox', [bbox.x, bbox.y, bbox.width, bbox.height].join(' '));
      svg.setAttribute('width', bbox.width);
      svg.setAttribute('height', bbox.height);
    } catch (e) {}
  }
  function setStartOffsets(svg, startPercent) {
    var paths = svg.querySelectorAll('textPath');
    if (!paths || paths.length === 0) return;
    var a = startPercent;
    var b = (startPercent + 33.3334) % 100;
    var c = (startPercent + 66.6667) % 100;
    if (paths[0]) paths[0].setAttribute('startOffset', a + '%');
    if (paths[1]) paths[1].setAttribute('startOffset', b + '%');
    if (paths[2]) paths[2].setAttribute('startOffset', c + '%');
  }
  function optimizeStartOffset(svg) {
    if (!svg) return;
    var text = svg.querySelector('text');
    if (!text) return;
    var best = { p: 0, diff: Infinity, bbox: null };
    for (var p = 0; p < 100; p += 1) {
      setStartOffsets(svg, p);
      var bb = text.getBBox();
      if (!bb || !isFinite(bb.width) || !isFinite(bb.height)) continue;
      var d = Math.abs(bb.width - bb.height);
      if (d < best.diff) {
        best = { p: p, diff: d, bbox: bb };
      }
    }
    setStartOffsets(svg, best.p);
    return best.bbox;
  }
  function init() {
    var svg = document.currentScript && document.currentScript.previousElementSibling;
    if (!(svg && svg.classList && svg.classList.contains('textcircle'))) {
      svg = document.querySelector('.circle-container .textcircle');
    }
    // Try to find the startOffset that makes bbox as square as possible
    var bbox = optimizeStartOffset(svg);
    // Then size the SVG to the computed bbox
    if (!bbox) {
      resizeTextCircle(svg);
    } else {
      svg.setAttribute('viewBox', [bbox.x, bbox.y, bbox.width, bbox.height].join(' '));
      svg.setAttribute('width', bbox.width);
      svg.setAttribute('height', bbox.height);
    }
    window.addEventListener('resize', function() { resizeTextCircle(svg); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();