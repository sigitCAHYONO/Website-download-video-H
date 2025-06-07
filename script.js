document.addEventListener('DOMContentLoaded', () => {
    const USER_PROFILE_KEY = 'userProfileData';
    const DEFAULT_GROUP_AVATAR_URL = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%233A4B53"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="50" fill="white">?</text></svg>';

    // --- Elemen UI LAMA ---
    const mainHeader = document.getElementById('mainHeader');
    const appNameTitle = document.getElementById('appName');
    const appStatus = document.getElementById('appStatus');
    const appAvatar = document.getElementById('appAvatar');
    const onlineUserCount = document.getElementById('onlineUserCount'); 
    const homeSection = document.getElementById('homeSection');
    const enterChatButton = document.getElementById('enterChatButton');
    const backToHomeButton = document.getElementById('backToHomeButton');
    const groupChatInputBar = document.getElementById('groupChatInputBar');
    const groupChatSection = document.getElementById('groupChatSection');
    const groupChatConnectionStatus = document.getElementById('groupChatConnectionStatus');
    const messagesAreaGroupChat = document.getElementById('messagesAreaGroupChat');
    const groupChatMessageInput = document.getElementById('groupChatMessageInput');
    const sendGroupChatMessageButton = document.getElementById('sendGroupChatMessageButton');
    const groupChatMenuButton = document.getElementById('groupChatMenuButton');
    const groupChatAttachmentMenu = document.getElementById('group-chat-attachment-menu');
    const groupAttachmentInput = document.getElementById('groupAttachmentInput');
    const profilePicInput = document.getElementById('profilePicInput');
    const replyContextBar = document.getElementById('replyContextBar');
    const replySender = document.getElementById('replySender');
    const replyTextPreview = document.getElementById('replyTextPreview');
    const cancelReplyButton = document.getElementById('cancelReplyButton');
    const chatNotificationSound = document.getElementById('chatNotificationSound');
    const profileSettingsSection = document.getElementById('profileSettingsSection');
    const profileSettingsPreviewPic = document.getElementById('profileSettingsPreviewPic');
    const profileSettingsPicInput = document.getElementById('profileSettingsPicInput');
    const profileSettingsNicknameInput = document.getElementById('profileSettingsNicknameInput');
    const profileSettingsStatusInput = document.getElementById('profileSettingsStatusInput');
    const profileSettingsBackButton = document.getElementById('profileSettingsBackButton');
    const profileSettingsSaveButton = document.getElementById('profileSettingsSaveButton');
    const profileSettingsMessage = document.getElementById('profileSettingsMessage');
    const scrollToBottomButton = document.getElementById('scrollToBottomButton');
    const mediaPreviewModal = document.getElementById('mediaPreviewModal');
    const previewImage = document.getElementById('previewImage');
    const previewVideo = document.getElementById('previewVideo');
    const mediaCaptionInput = document.getElementById('mediaCaptionInput');
    const sendMediaButton = document.getElementById('sendMediaButton');
    const cancelMediaButton = document.getElementById('cancelMediaButton');
    
    // --- ELEMEN UI BARU ---
    const userProfileModal = document.getElementById('userProfileModal');
    const modalProfilePic = document.getElementById('modalProfilePic');
    const modalProfileNickname = document.getElementById('modalProfileNickname');
    const sendPrivateMessageButton = document.getElementById('sendPrivateMessageButton');
    const closeUserProfileModal = document.getElementById('closeUserProfileModal');
    const privateChatSection = document.getElementById('privateChatSection');
    const backToGroupChatButton = document.getElementById('backToGroupChatButton');
    const privateChatAvatar = document.getElementById('privateChatAvatar');
    const privateChatNickname = document.getElementById('privateChatNickname');
    const privateMessagesArea = document.getElementById('privateMessagesArea');
    const privateMessageInput = document.getElementById('privateMessageInput');
    const sendPrivateMessage = document.getElementById('sendPrivateMessage');

    // --- State Aplikasi LAMA ---
    let currentView = 'home';
    let websocket = null;
    let userNickname = null; 
    let userProfilePictures = {};
    let isReplying = false;
    let replyContext = null;
    let typingTimer;
    const TYPING_TIMER_LENGTH = 2500;
    const usersTyping = {};
    let newProfilePicDataUrl = null;
    let isUserScrolledUp = false;
    let pendingMediaFile = null;
    let pendingMediaDataURL = null;

    // --- STATE APLIKASI BARU ---
    let currentPrivateChatUser = null;

    function saveUserProfile(profileData) { try { localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileData)); console.info('Profil pengguna disimpan ke localStorage.'); return true; } catch (e) { console.error('Gagal menyimpan profil ke localStorage.', e); return false; } }
    function loadUserProfile() { try { const storedProfile = localStorage.getItem(USER_PROFILE_KEY); if (storedProfile) { const profile = JSON.parse(storedProfile); console.info('Profil pengguna dimuat dari localStorage.'); userNickname = profile.nickname || null; if (userNickname && profile.profilePicUrl) { userProfilePictures[userNickname] = profile.profilePicUrl; } return profile; } } catch (e) { console.error('Gagal memuat atau parse profil dari localStorage.', e); } return null; }
    loadUserProfile();

    function showHomeView() {
        homeSection.style.display = 'flex';
        groupChatSection.style.display = 'none';
        privateChatSection.style.display = 'none';
        profileSettingsSection.style.display = 'none';
        mainHeader.style.display = 'none';
        groupChatInputBar.style.display = 'none'; 
        currentView = 'home';
        if (websocket && websocket.readyState === WebSocket.OPEN) { websocket.close(); }
    }

    function showGroupChatView() {
        homeSection.style.display = 'none';
        groupChatSection.style.display = 'flex';
        privateChatSection.style.display = 'none';
        profileSettingsSection.style.display = 'none';
        mainHeader.style.display = 'flex';
        groupChatInputBar.style.display = 'flex';
        currentView = 'groupchat';
        currentPrivateChatUser = null; // Reset user chat pribadi saat kembali ke grup
        if (!websocket || websocket.readyState !== WebSocket.OPEN) {
            connectWebSocket();
        }
    }

    function openPrivateChatView(nickname) {
        currentPrivateChatUser = nickname;
        
        homeSection.style.display = 'none';
        groupChatSection.style.display = 'none';
        privateChatSection.style.display = 'flex';
        profileSettingsSection.style.display = 'none';
        mainHeader.style.display = 'none';
        groupChatInputBar.style.display = 'none';
        userProfileModal.style.display = 'none';

        currentView = 'privatechat';
        privateMessagesArea.innerHTML = '';
        privateChatNickname.textContent = nickname;
        
        const targetUserPic = userProfilePictures[nickname] || DEFAULT_GROUP_AVATAR_URL;
        if (targetUserPic.startsWith('data:image')) {
            privateChatAvatar.style.backgroundImage = 'none';
            privateChatAvatar.textContent = nickname.substring(0,1).toUpperCase();
        } else {
            privateChatAvatar.style.backgroundImage = `url('${targetUserPic}')`;
            privateChatAvatar.textContent = '';
        }
        
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: 'get_private_history', withUser: nickname }));
        }
    }

    function showProfileSettingsView() {
        homeSection.style.display = 'none';
        mainHeader.style.display = 'flex';
        groupChatSection.style.display = 'none';
        privateChatSection.style.display = 'none';
        groupChatInputBar.style.display = 'none';
        replyContextBar.style.display = 'none';
        profileSettingsSection.style.display = 'block';

        appNameTitle.textContent = "Profil & Pengaturan";
        appStatus.textContent = "Kelola informasi Anda";
        const profile = loadUserProfile();
        if (profile) {
            profileSettingsNicknameInput.value = profile.nickname || '';
            profileSettingsStatusInput.value = profile.status || '';
            profileSettingsPreviewPic.src = profile.profilePicUrl || DEFAULT_GROUP_AVATAR_URL;
            if (appAvatar) {
                if (profile.profilePicUrl && profile.profilePicUrl !== DEFAULT_GROUP_AVATAR_URL) {
                    appAvatar.style.backgroundImage = `url('${profile.profilePicUrl}')`; appAvatar.textContent = '';
                } else {
                    appAvatar.textContent = "⚙️"; appAvatar.style.backgroundImage = '';
                }
            }
        } else {
            profileSettingsNicknameInput.value = userNickname || '';
            profileSettingsStatusInput.value = '';
            profileSettingsPreviewPic.src = userProfilePictures[userNickname] || DEFAULT_GROUP_AVATAR_URL;
            if(appAvatar) appAvatar.textContent = "⚙️";
            if(appAvatar) appAvatar.style.backgroundImage = '';
        }
        profileSettingsMessage.textContent = '';
        newProfilePicDataUrl = null;
        currentView = 'profilesettings';
    }
    
    function showUserProfileModal(nickname, picUrl) {
        if (nickname === userNickname) return;
        modalProfileNickname.textContent = nickname;
        modalProfilePic.src = picUrl || DEFAULT_GROUP_AVATAR_URL;
        userProfileModal.style.display = 'flex';

        const newSendButton = sendPrivateMessageButton.cloneNode(true);
        sendPrivateMessageButton.parentNode.replaceChild(newSendButton, sendPrivateMessageButton);
        newSendButton.addEventListener('click', () => openPrivateChatView(nickname));
    }

    function addMessageToChatUI(content, senderType, isHtmlOrMedia = false, targetArea = messagesAreaGroupChat, senderName = null, mediaElement = null, messageId = null, messageData = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message-bubble', senderType);
        if(messageId) messageDiv.id = messageId;
        
        if (senderType === 'user' || senderType === 'group-in') {
            const profilePicImg = document.createElement('img');
            profilePicImg.classList.add('profile-pic-bubble');
            let picUrl = DEFAULT_GROUP_AVATAR_URL;
            if (senderType === 'user' && userProfilePictures[userNickname]) {
                picUrl = userProfilePictures[userNickname];
            } else if (senderType === 'group-in' && userProfilePictures[senderName]) {
                picUrl = userProfilePictures[senderName];
            }
            profilePicImg.src = picUrl;
            
            if (targetArea === messagesAreaGroupChat && senderName) {
                profilePicImg.addEventListener('click', () => showUserProfileModal(senderName, picUrl));
            }
            
            messageDiv.appendChild(profilePicImg);
        }
        
        const innerWrapper = document.createElement('div');
        innerWrapper.classList.add('message-inner-wrapper');
        if (messageData.replyTo && typeof messageData.replyTo === 'object') { const quoteDiv = document.createElement('div'); quoteDiv.classList.add('reply-quote'); const quoteSender = document.createElement('span'); quoteSender.classList.add('reply-quote-sender'); quoteSender.textContent = messageData.replyTo.senderName; const quoteText = document.createElement('span'); quoteText.classList.add('reply-quote-text'); quoteText.textContent = messageData.replyTo.messageText; quoteDiv.appendChild(quoteSender); quoteDiv.appendChild(quoteText); innerWrapper.appendChild(quoteDiv); }
        if (senderType === 'group-in') { const nameSpan = document.createElement('span'); nameSpan.classList.add('sender-name'); nameSpan.textContent = senderName; innerWrapper.appendChild(nameSpan); }
        if (mediaElement) { innerWrapper.appendChild(mediaElement); if (messageData.caption) { const captionP = document.createElement('p'); captionP.classList.add('media-caption'); captionP.textContent = messageData.caption; innerWrapper.appendChild(captionP);}}
        else if (isHtmlOrMedia) { const contentDiv = document.createElement('div'); contentDiv.innerHTML = content; innerWrapper.appendChild(contentDiv); } 
        else { const p = document.createElement('p'); p.innerHTML = linkify(content); innerWrapper.appendChild(p); }
        if (senderType === 'user') { const statusSpan = document.createElement('span'); statusSpan.classList.add('message-status'); statusSpan.innerHTML = '<span class="checkmark">✓</span>'; innerWrapper.appendChild(statusSpan); }
        
        const isTextMessage = !mediaElement && !isHtmlOrMedia && typeof content === 'string' && content.trim() !== '';
        const isAudioMessage = mediaElement && mediaElement.tagName === 'AUDIO';
        if (isTextMessage || isAudioMessage) { innerWrapper.classList.add('flipper-border-active'); }
        
        messageDiv.appendChild(innerWrapper);
        targetArea.appendChild(messageDiv); 
        targetArea.scrollTop = targetArea.scrollHeight;
    }

    function connectWebSocket() {
        if (websocket && (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING)) { return; }
        const WEBSOCKET_URL = 'wss://chat.ravaelstore.my.id'; // GANTI DENGAN URL WEBSOCKET ANDA
        websocket = new WebSocket(WEBSOCKET_URL);

        websocket.onopen = () => {
            console.info("WebSocket Terhubung!");
            if (!userNickname) { 
                let promptedNick = `User${Math.floor(Math.random() * 1000)}`;
                const newNick = prompt("Masukkan nama panggilan Anda:", promptedNick);
                if (newNick && newNick.trim() !== "") {
                    userNickname = newNick.trim();
                } else {
                    userNickname = promptedNick;
                }
                const initialProfile = loadUserProfile() || {};
                initialProfile.nickname = userNickname;
                if (!initialProfile.profilePicUrl) initialProfile.profilePicUrl = DEFAULT_GROUP_AVATAR_URL;
                saveUserProfile(initialProfile);
             }

            websocket.send(JSON.stringify({ type: 'user_login', nickname: userNickname }));
            
            if(groupChatConnectionStatus) groupChatConnectionStatus.textContent = `Terhubung sebagai: ${userNickname}`;
            if(appStatus) appStatus.textContent = `Terhubung sebagai: ${userNickname}`;
        };

        websocket.onmessage = async (event) => {
            let messageData;
            try {
                messageData = JSON.parse(event.data);
            } catch(e) { console.error("Pesan tidak valid:", event.data); return; }
            
            switch(messageData.type) {
                case 'group_chat_history':
                    messagesAreaGroupChat.innerHTML = '';
                    messageData.history.forEach(msg => {
                        const senderType = msg.nickname === userNickname ? 'user' : 'system-message';
                        addMessageToChatUI(msg.text || `*Pesan Sistem*`, senderType, true, messagesAreaGroupChat, msg.nickname, null, msg.id, msg);
                    });
                    break;
                case 'message':
                    if (messageData.nickname !== userNickname) {
                        addMessageToChatUI(messageData.text, 'group-in', false, messagesAreaGroupChat, messageData.nickname, null, messageData.id, messageData);
                    }
                    break;
                case 'private_message':
                    const isMyPrivateChatOpen = currentView === 'privatechat' && (messageData.nickname === currentPrivateChatUser || messageData.recipient === currentPrivateChatUser);
                    if (isMyPrivateChatOpen) {
                        const senderType = messageData.nickname === userNickname ? 'user' : 'group-in';
                        addMessageToChatUI(messageData.text, senderType, false, privateMessagesArea, messageData.nickname, null, messageData.id, messageData);
                    } else if (messageData.nickname !== userNickname) {
                        console.log(`Pesan pribadi diterima dari ${messageData.nickname}`);
                    }
                    break;
                case 'private_chat_history':
                    if (messageData.withUser === currentPrivateChatUser) {
                        privateMessagesArea.innerHTML = '';
                        messageData.history.forEach(msg => {
                            const senderType = msg.sender_nickname === userNickname ? 'user' : 'group-in';
                            addMessageToChatUI(msg.text, senderType, false, privateMessagesArea, msg.sender_nickname, null, msg.id, msg);
                        });
                    }
                    break;
                // ... (Sisa case: user_join, user_leave, dll. tetap sama) ...
                case 'user_join': addMessageToChatUI(`<i>${messageData.nickname} telah bergabung.</i>`, 'system-message', true, messagesAreaGroupChat); break;
                case 'user_leave': addMessageToChatUI(`<i>${messageData.nickname} telah keluar.</i>`, 'system-message', true, messagesAreaGroupChat); delete usersTyping[messageData.nickname]; updateTypingIndicator(); break;
                case 'user_count_update': if(onlineUserCount) onlineUserCount.textContent = `${messageData.count} Online`; break;
                case 'typing': if (messageData.nickname !== userNickname) { if (messageData.isTyping) { usersTyping[messageData.nickname] = true; } else { delete usersTyping[messageData.nickname]; } updateTypingIndicator(); } break;

            }
        };

        websocket.onclose = () => { console.info("Koneksi terputus."); if(groupChatConnectionStatus) groupChatConnectionStatus.textContent = "Koneksi terputus."; };
        websocket.onerror = () => { console.error("WebSocket Error."); if(groupChatConnectionStatus) groupChatConnectionStatus.textContent = "Error koneksi."; };
    }
    
    function sendGroupMessage(text = null, payloadOverride = null) { const messageText = text || (groupChatMessageInput ? groupChatMessageInput.value.trim() : ""); if ((!messageText && !payloadOverride) || !websocket || websocket.readyState !== WebSocket.OPEN) return; clearTimeout(typingTimer); websocket.send(JSON.stringify({ type: 'typing', nickname: userNickname, isTyping: false })); const messageId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`; let finalPayload; if (payloadOverride) { finalPayload = payloadOverride; } else { finalPayload = { type: 'message', nickname: userNickname, text: messageText, id: messageId }; if (isReplying && replyContext) { finalPayload.replyTo = replyContext; } } websocket.send(JSON.stringify(finalPayload)); if (isReplying) { cancelReply(); } if (finalPayload.type === 'message') { addMessageToChatUI(finalPayload.text, 'user', false, messagesAreaGroupChat, userNickname, null, messageId, finalPayload); } else if (finalPayload.type === 'file_message') { let mediaElement; if (finalPayload.filetype.startsWith('image/')) { mediaElement = document.createElement('img'); mediaElement.src = finalPayload.filecontent; mediaElement.alt = finalPayload.filename; } else if (finalPayload.filetype.startsWith('video/')) { mediaElement = document.createElement('video'); mediaElement.src = finalPayload.filecontent; mediaElement.controls = true; } else if (finalPayload.filetype.startsWith('audio/')) { mediaElement = document.createElement('audio'); mediaElement.src = finalPayload.filecontent; mediaElement.controls = true; } else { mediaElement = document.createElement('p'); mediaElement.textContent = `Anda mengirim file: ${finalPayload.filename}`; } if(mediaElement) mediaElement.classList.add('media-attachment'); addMessageToChatUI(null, 'user', true, messagesAreaGroupChat, userNickname, mediaElement, messageId, finalPayload); } if(!text && !payloadOverride && groupChatMessageInput) groupChatMessageInput.value = ""; if(messagesAreaGroupChat) messagesAreaGroupChat.scrollTop = messagesAreaGroupChat.scrollHeight; }

    function sendPrivateMessageAction() {
        const text = privateMessageInput.value.trim();
        if (!text || !currentPrivateChatUser) return;

        const payload = {
            type: 'private_message',
            recipient: currentPrivateChatUser,
            text: text,
            nickname: userNickname, // tambahkan nickname pengirim
            id: `pmsg-${Date.now()}`
        };
        websocket.send(JSON.stringify(payload));
        addMessageToChatUI(text, 'user', false, privateMessagesArea, userNickname, null, payload.id, payload);
        privateMessageInput.value = '';
    }
    
    // --- Event Listeners ---
    if (enterChatButton) enterChatButton.addEventListener('click', showGroupChatView);
    if (backToHomeButton) backToHomeButton.addEventListener('click', showHomeView);
    if (sendGroupChatMessageButton) sendGroupChatMessageButton.addEventListener('click', sendGroupMessage);
    if (groupChatMessageInput) groupChatMessageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendGroupMessage(); });
    if(profileSettingsSaveButton) profileSettingsSaveButton.addEventListener('click', () => { /* ... kode simpan profil ... */ });
    if(profileSettingsBackButton) profileSettingsBackButton.addEventListener('click', showGroupChatView);
    
    // Event listener baru
    if(closeUserProfileModal) closeUserProfileModal.addEventListener('click', () => userProfileModal.style.display = 'none');
    if(backToGroupChatButton) backToGroupChatButton.addEventListener('click', showGroupChatView);
    if(sendPrivateMessage) sendPrivateMessage.addEventListener('click', sendPrivateMessageAction);
    if(privateMessageInput) privateMessageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendPrivateMessageAction(); });
    
    // ... sisa event listener lainnya ...

    const canvas = document.getElementById('interactive-background');
    if (canvas) {
        // ... seluruh kode animasi canvas Anda di sini ...
    }
    
    showHomeView();
});