document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('background-video');
    const videoSource = video.querySelector('source');
    const backgroundVideoSelect = document.getElementById('background-video-select');
    const backgroundAudioSelect = document.getElementById('background-audio-select');
    const audioVolumeControl = document.getElementById('audio-volume');
    const closeSettingsButton = document.getElementById('close-settings');
    const products = document.querySelectorAll('.product');
    const lihatVideoLinks = document.querySelectorAll('.lihat-video');
    let sound;
    let isPlaying = false;
    let isAudioPlayingBeforePause = false;
    let wasAudioPlayingBeforeSettings = false;
    const animeLink = document.getElementById('anime-link');
    const donghuaLink = document.getElementById('donghua-link');
    const apkModLink = document.getElementById('apk-mod-link');
    const settingsButton = document.getElementById('settings-button');
    const mainButton = document.getElementById('main-button'); // Ambil referensi tombol UTAMA
    const mainContent = document.getElementById('main-content');
    const animeContent = document.getElementById('anime-content');
    const donghuaContent = document.getElementById('donghua-content');
    const apkModContent = document.getElementById('apk-mod-content');
    const settingsContent = document.getElementById('settings-content');
    const loadingSpinner = document.getElementById('loading-spinner');
    const clickTriggers = document.querySelectorAll('.anime-button, .donghua-button, #settings-button, #main-button, .apk-mod-button'); // Hapus back-button dari clickTriggers
    const productClickTriggers = document.querySelectorAll('.product-click-trigger');

    const textColorSelect = document.getElementById('text-color-select');
    const productSizeSelect = document.getElementById('product-size-select');
    const animationToggleSelect = document.getElementById('animation-toggle');
    const bodyElement = document.body;
    const allTextElements = document.querySelectorAll('body, h1, h2, h3, p, a, button');
    const productElements = document.querySelectorAll('.product');

    const serverBaseUrl = 'http://localhost:9999'; // PASTIKAN INI SESUAI DENGAN ALAMAT DAN PORT SERVER TERMUX ANDA

    function initAudio(audioSrc) {
        const currentVideoTime = video.currentTime;
        if (sound) {
            sound.stop();
            sound.unload();
        }
        sound = new Howl({
            src: [audioSrc],
            html5: true,
            loop: true,
            volume: parseFloat(audioVolumeControl.value),
            onload: function() {
                console.log('Audio loaded:', audioSrc);
                if (isPlaying) {
                    sound.play();
                    sound.seek(currentVideoTime);
                }
            },
            onloaderror: function(id, error) {
                console.error("Error loading audio:", id, error, audioSrc);
            },
            onplayerror: function(id, error) {
                console.error("Error playing audio:", id, error);
                if (Howler.ctx && Howler.ctx.state === 'suspended') {
                    Howler.ctx.resume().catch(e => console.error("Error resuming AudioContext:", e));;
                }
            },
            onend: function() {
                isPlaying = false;
            }
        });
    }

    function playVideoAndAudio() {
        if (!isPlaying) {
            video.classList.add('playing');
            video.play()
                .then(() => {
                    isPlaying = true;
                    if (sound && sound.state() === 'loaded' && !sound.playing()) {
                        sound.play();
                    }
                })
                .catch(error => console.error("Error playing video:", error));
        } else {
            if (video.paused) {
                video.currentTime = 0;
                video.play().catch(error => console.error("Error playing video:", error));
            }
            if (sound && sound.state() === 'loaded' && !sound.playing() && isAudioPlayingBeforePause) {
                sound.play();
            }
        }
    }


    function pauseVideoAndAudio() {
        video.classList.remove('playing');
        video.pause();
        if (sound && sound.playing()) {
            sound.pause();
            isAudioPlayingBeforePause = true;
        } else {
            isAudioPlayingBeforePause = false;
        }
        isPlaying = false;
    }

    productClickTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            loadingSpinner.style.display = 'block';
            setTimeout(function() {
                const currentAudioSrc = backgroundAudioSelect.value;
                initAudio(currentAudioSrc);
                if (isPlaying) {
                    pauseVideoAndAudio();
                } else {
                    playVideoAndAudio();
                }
                loadingSpinner.style.display = 'none';
            }, 500);
        });
    });

    lihatVideoLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            window.open(this.href, '_blank');
        });
    });

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && isPlaying) {
            playVideoAndAudio();
        } else {
            pauseVideoAndAudio();
        }
    });
    document.addEventListener('copy', function(e) { e.preventDefault(); alert('Menyalin teks tidak diizinkan.'); });
    document.addEventListener('cut', function(e) { e.preventDefault(); });
    document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

    clickTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            loadingSpinner.style.display = 'block';
            setTimeout(function() {
                mainContent.style.display = (trigger.id === 'main-content' || trigger.id === 'main-button' || !trigger.id) ? 'block' : 'none';
                animeContent.style.display = (trigger.id === 'anime-link') ? 'block' : 'none';
                donghuaContent.style.display = (trigger.id === 'donghua-link') ? 'block' : 'none';
                apkModContent.style.display = (trigger.id === 'apk-mod-link') ? 'block' : 'none';
                settingsContent.style.display = (trigger.id === 'settings-button') ? 'block' : 'none';
                loadingSpinner.style.display = 'none';
            }, 500);
        });
    });

    settingsButton.addEventListener('click', function() {
        mainContent.style.display = 'none';
        animeContent.style.display = 'none';
        donghuaContent.style.display = 'none';
        apkModContent.style.display = 'none';
        settingsContent.style.display = 'block';
        document.getElementById('password-check').style.display = 'block';
        document.getElementById('settings-panel').style.display = 'none';
        document.getElementById('settings-password').value = '';
        document.getElementById('password-error').style.display = 'none';
    });

    const submitPasswordButton = document.getElementById('submit-password');
    const passwordInput = document.getElementById('settings-password');
    const passwordError = document.getElementById('password-error');
    const correctPassword = "12";

    submitPasswordButton.addEventListener('click', function() {
        const enteredPassword = passwordInput.value;
        if (enteredPassword === correctPassword) {
            document.getElementById('password-check').style.display = 'none';
            document.getElementById('settings-panel').style.display = 'block';
        } else {
            passwordError.style.display = 'block';
        }
    });

    passwordInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            submitPasswordButton.click();
        }
    });

    closeSettingsButton.addEventListener('click', function() {
        settingsContent.style.display = 'none';
        mainContent.style.display = 'block';
    });


    backgroundVideoSelect.addEventListener('change', function() {
        const selectedVideo = this.value;
        localStorage.setItem('backgroundVideo', selectedVideo);
        videoSource.src = selectedVideo;
        video.load();
        video.currentTime = 0;
        if (isPlaying) {
            video.play().catch(error => console.error("Error playing video:", error));
        }
    });

    backgroundAudioSelect.addEventListener('change', function() {
        const selectedAudio = this.value;
        localStorage.setItem('backgroundAudio', selectedAudio);
        initAudio(selectedAudio);
        if (isPlaying) {
            sound.play();
        }
    });

    audioVolumeControl.addEventListener('input', function() {
        if (sound) {
            sound.volume(parseFloat(this.value));
        }
    });

    textColorSelect.addEventListener('change', function() {
        const selectedColor = this.value;
        localStorage.setItem('textColor', selectedColor);
        allTextElements.forEach(element => {
            element.style.color = selectedColor;
        });
    });

    productSizeSelect.addEventListener('change', function() {
        const selectedSize = parseFloat(this.value);
        localStorage.setItem('productSize', selectedSize);
        productElements.forEach(element => {
            element.style.transform = `scale(${selectedSize})`;
        });
    });

    animationToggleSelect.addEventListener('change', function() {
        const animationState = this.value;
        localStorage.setItem('animationState', animationState);
        if (animationState === 'on') {
            bodyElement.style.animation = "colorCycle 7s linear infinite";
        } else {
            bodyElement.style.animation = "none";
        }
    });

    const addNewVideoButton = document.getElementById('add-new-video');
    const newVideoLinkInput = document.getElementById('new-video-link');
    const newVideoThumbnailInput = document.getElementById('new-video-thumbnail');
    const newVideoTitleInput = document.getElementById('new-video-title');
    const mainProductContainer = document.querySelector('#main-content .product-container');

    addNewVideoButton.addEventListener('click', function() {
        const videoLink = newVideoLinkInput.value;
        const thumbnailUrl = newVideoThumbnailInput.value;
        const title = newVideoTitleInput.value;

        if (videoLink && thumbnailUrl && title) {
            const videoData = {
                link: videoLink,
                thumbnail: thumbnailUrl,
                title: title
            };

            fetch(`${serverBaseUrl}/api/upload-video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(videoData)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Video berhasil diunggah:', data);
                loadUploadedVideosFromServer();
                newVideoLinkInput.value = '';
                newVideoThumbnailInput.value = '';
                newVideoTitleInput.value = '';
            })
            .catch(error => {
                console.error('Error mengunggah video:', error);
                alert('Terjadi kesalahan saat mengunggah video.');
            });
        } else {
            alert('Harap isi semua kolom untuk menambahkan video.');
        }
    });

    function loadUploadedVideosFromServer() {
        fetch(`${serverBaseUrl}/api/videos`)
            .then(response => response.json())
            .then(videos => {
                console.log('Daftar video dari server:', videos);
                displayVideos(videos);
            })
            .catch(error => {
                console.error('Error memuat video dari server:', error);
            });
    }

    function displayVideos(videos) {
        mainProductContainer.innerHTML = '';
        videos.forEach(video => {
            const newProductDiv = document.createElement('div');
            newProductDiv.classList.add('product');

            const titleElement = document.createElement('h3');
            titleElement.classList.add('product-click-trigger');
            titleElement.textContent = video.title;

            const imageElement = document.createElement('img');
            imageElement.src = video.thumbnail;
            imageElement.alt = video.title;
            imageElement.classList.add('product-click-trigger');

            const watchLink = document.createElement('a');
            watchLink.href = video.link;
            watchLink.target = '_blank';
            watchLink.classList.add('lihat-video');
            watchLink.textContent = 'NONTON SEKARANG';

            newProductDiv.appendChild(titleElement);
            newProductDiv.appendChild(imageElement);
            newProductDiv.appendChild(watchLink);

            mainProductContainer.appendChild(newProductDiv);

            const newProductClickTriggers = newProductDiv.querySelectorAll('.product-click-trigger');
            newProductClickTriggers.forEach(trigger => {
                trigger.addEventListener('click', function() {
                    loadingSpinner.style.display = 'block';
                    setTimeout(function() {
                        const currentAudioSrc = backgroundAudioSelect.value;
                        initAudio(currentAudioSrc);
                        if (isPlaying) {
                            pauseVideoAndAudio();
                        } else {
                            playVideoAndAudio();
                        }
                        loadingSpinner.style.display = 'none';
                    }, 500);
                });
            });
        });
    }

    const storedTextColor = localStorage.getItem('textColor');
    if (storedTextColor) {
        textColorSelect.value = storedTextColor;
        allTextElements.forEach(element => {
            element.style.color = storedTextColor;
        });
    }

    const storedProductSize = localStorage.getItem('productSize');
    if (storedProductSize) {
        productSizeSelect.value = storedProductSize;
        productElements.forEach(element => {
            element.style.transform = `scale(${storedProductSize})`;
        });
    }

    const storedAnimationState = localStorage.getItem('animationState');
    if (storedAnimationState) {
        animationToggleSelect.value = storedAnimationState;
        if (storedAnimationState === 'on') {
            bodyElement.style.animation = "colorCycle 7s linear infinite";
        } else {
            bodyElement.style.animation = "none";
        }
    }

    const storedBackgroundVideo = localStorage.getItem('backgroundVideo');
    if (storedBackgroundVideo) {
        backgroundVideoSelect.value = storedBackgroundVideo;
        videoSource.src = storedBackgroundVideo;
        video.load();
        video.currentTime = 0;
        if (isPlaying) {
            video.play().catch(error => console.error("Error playing video:", error));
        }
    }

    const storedBackgroundAudio = localStorage.getItem('backgroundAudio');
    if (storedBackgroundAudio) {
        backgroundAudioSelect.value = storedBackgroundAudio;
        initAudio(storedBackgroundAudio);
        if (isPlaying) {
            sound.play();
        }
    }

    loadUploadedVideosFromServer();
    initAudio(backgroundAudioSelect.value);

    const changeFontButton = document.getElementById('change-font-button');
    const fontListContainer = document.getElementById('font-list-container');
    const fontList = document.getElementById('font-list');

    changeFontButton.addEventListener('click', function() {
        fontListContainer.style.display = 'block';
        const buttonRect = changeFontButton.getBoundingClientRect();
        fontListContainer.style.top = (buttonRect.bottom + window.scrollY) + 'px';
        fontListContainer.style.left = (buttonRect.left + window.scrollX) + 'px';
    });

    fontList.addEventListener('click', function(event) {
        if (event.target.tagName === 'LI') {
            const selectedFont = event.target.getAttribute('data-font');
            document.body.style.fontFamily = selectedFont + ', sans-serif';
            localStorage.setItem('selectedFont', selectedFont);
            fontListContainer.style.display = 'none';
        }
    });

    const storedFont = localStorage.getItem('selectedFont');
    if (storedFont) {
        document.body.style.fontFamily = storedFont + ', sans-serif';
    }

    // Bagian untuk fitur kirim email
    const sendEmailButton = document.getElementById('send-email-button');
    const recipientEmailInput = document.getElementById('recipient-email');
    const emailSubjectInput = document.getElementById('email-subject');
    const emailBodyInput = document.getElementById('email-body');

    sendEmailButton.addEventListener('click', function() {
        const recipientEmail = recipientEmailInput.value;
        const subject = emailSubjectInput.value;
        const body = emailBodyInput.value;

        if (recipientEmail && subject && body) {
            const emailData = {
                recipient: recipientEmail,
                subject: subject,
                body: body
            };

            fetch(`${serverBaseUrl}/api/send-email`, { // Endpoint backend untuk mengirim email
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Email berhasil dikirim:', data);
                alert('Email berhasil dikirim!');
                recipientEmailInput.value = '';
                emailSubjectInput.value = '';
                emailBodyInput.value = '';
            })
            .catch(error => {
                console.error('Error mengirim email:', error);
                alert('Terjadi kesalahan saat mengirim email.');
            });
        } else {
            alert('Harap isi semua kolom email.');
        }
    });

});
```

**Penjelasan:**

* **index.html:** Berisi struktur dasar HTML, termasuk link ke file CSS (`style.css`) di bagian `<head>` dan link ke file JavaScript (`script.js`) di bagian paling bawah sebelum tag penutup `</body>`.
* **style.css:** Berisi semua kode CSS yang sebelumnya berada di dalam tag `<style>` di file HTML.
* **script.js:** Berisi semua kode JavaScript yang sebelumnya berada di dalam tag `<script>` di file HTML.

Dengan pemisahan ini, kode Anda akan menjadi lebih terstruktur dan mudah dikelola. Pastikan ketiga file ini berada dalam direktori yang sama agar link di file HTML dapat berfungsi dengan baik.