let is_load_js = false;

(function(){
  document.addEventListener('DOMContentLoaded', function() {
    ['keydown', 'mousemove', 'touchstart'].forEach((event) => {
      document.addEventListener(event, () => {
        if (is_load_js) return;
        is_load_js = true;
        const videoComponents = document.querySelectorAll('.video-background-component--clickable');

        videoComponents.forEach(function(videoComponent) {
          const video = videoComponent.querySelector('video');
          const playButton = videoComponent.querySelector('.video-play-button');
          const pauseButton = videoComponent.querySelector('.video-pause-button');
          const progressBar = videoComponent.querySelector('.video-progress-bar');
          const progressFilled = videoComponent.querySelector('.video-progress-filled');
          const progressHandle = videoComponent.querySelector('.video-progress-handle');
          const volumeButton = videoComponent.querySelector('.video-volume-button');
          const volumeRange = videoComponent.querySelector('.volume-range');
          const currentTimeEl = videoComponent.querySelector('.current-time');
          const totalTimeEl = videoComponent.querySelector('.total-time');

          if (!video || !playButton || !pauseButton) return;

          videoComponent.style.cursor = 'pointer';

          playButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Play the video
            video.play().then(function() {
              videoComponent.classList.add('video-playing');
            }).catch(function(error) {
              console.error('Error playing video:', error);
            });
          });

          // Pause button click handler
          pauseButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Pause the video
            video.pause();

            // Show play button and remove playing class
            videoComponent.classList.remove('video-playing');
          });

          // Video ended handler
          video.addEventListener('ended', function() {
            // Show play button and remove playing class
            videoComponent.classList.remove('video-playing');
          });

          videoComponent.addEventListener('mouseenter', function() {
            if (!videoComponent.classList.contains('video-playing')) {
              this.style.opacity = '0.95';
              this.style.transition = 'opacity 0.3s ease';
            }
          });

          videoComponent.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
          });

          // Volume Control Functionality
          if (volumeRange) {
            volumeRange.addEventListener('input', function() {
              video.volume = this.value;
              video.muted = this.value == 0;
            });
          }

          if (volumeButton) {
            volumeButton.addEventListener('click', function() {
              if (video.muted) {
                video.muted = false;
                volumeRange.value = video.volume;
              } else {
                video.muted = true;
                volumeRange.value = 0;
              }
            });
          }

          // Progress Bar Functionality
          if (progressBar && progressFilled && progressHandle) {
            // Update progress bar
            video.addEventListener('timeupdate', function() {
              const progress = (video.currentTime / video.duration) * 100;
              progressFilled.style.width = progress + '%';
              progressHandle.style.left = progress + '%';

              // Update time display
              if (currentTimeEl) {
                currentTimeEl.textContent = formatTime(video.currentTime);
              }
            });

            // Set total time
            video.addEventListener('loadedmetadata', function() {
              if (totalTimeEl) {
                totalTimeEl.textContent = formatTime(video.duration);
              }
            });

            // Click on progress bar to seek
            progressBar.addEventListener('click', function(e) {
              const rect = progressBar.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percentage = clickX / rect.width;
              video.currentTime = percentage * video.duration;
            });

            // Drag progress handle
            let isDragging = false;
            progressHandle.addEventListener('mousedown', function(e) {
              isDragging = true;
              e.preventDefault();
            });

            document.addEventListener('mousemove', theme.utils.rafThrottle((e) => {
              if (isDragging && progressBar) {
                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                video.currentTime = percentage * video.duration;
              }
            }));

            document.addEventListener('mouseup', function() {
              isDragging = false;
            });
          }

          function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return minutes + ':' + (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
          }
        });
      });
    });
  });
})();